import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { getDb } from "@/db";
import { emailOutbox } from "@/db/schema";
import { studio } from "@/lib/studio";

export const appUrl = () => (process.env.APP_URL ?? "http://localhost:3040").replace(/\/$/, "");

let transporter: Transporter | null | undefined;
function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return (transporter = null);
  const port = Number(process.env.SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  return transporter;
}

export const isMailConfigured = () => Boolean(process.env.SMTP_HOST);

type Email = { to: string; subject: string; heading: string; paragraphs: string[]; details?: [string, string][]; action?: { label: string; href: string } };

/** Sends through SMTP when configured; otherwise the message is only recorded (visible at /gelistirici/e-postalar in development). */
export async function sendEmail(email: Email) {
  const { html, text } = render(email);
  let status: "sent" | "logged" | "failed" = "logged";
  let error: string | null = null;
  const transport = getTransporter();
  if (transport) {
    try {
      await transport.sendMail({ from: process.env.MAIL_FROM ?? `${studio.name} <no-reply@localhost>`, to: email.to, subject: email.subject, html, text });
      status = "sent";
    } catch (cause) {
      status = "failed";
      error = cause instanceof Error ? cause.message : String(cause);
      console.error(`[e-posta] ${email.to} adresine gönderilemedi: ${error}`);
    }
  } else {
    console.info(`[e-posta] SMTP ayarlı değil, kaydedildi → ${email.to} · ${email.subject}`);
  }
  await (await getDb()).insert(emailOutbox).values({ to: email.to, subject: email.subject, html, text, status, error });
}

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

// Table-based, inline-styled layout so it renders the same in Gmail, Outlook and Apple Mail.
function render({ heading, paragraphs, details, action }: Email) {
  const href = action ? (action.href.startsWith("http") ? action.href : `${appUrl()}${action.href}`) : null;
  const detailRows = (details ?? []).map(([label, value]) => `<tr><td style="padding:10px 0;border-top:1px solid #e6e1cf;color:#77716c;font-size:13px;width:38%">${escape(label)}</td><td style="padding:10px 0;border-top:1px solid #e6e1cf;color:#1d1b1b;font-size:14px;font-weight:600">${escape(value)}</td></tr>`).join("");
  const html = `<!doctype html><html lang="tr"><body style="margin:0;background:#f1edda;font-family:Helvetica,Arial,sans-serif;color:#1d1b1b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1edda;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#f8f5e8;border-radius:14px;padding:36px 32px">
<tr><td style="font-size:28px;font-weight:700;letter-spacing:-1px;padding-bottom:4px">flowly</td></tr>
<tr><td style="font-size:11px;letter-spacing:3px;color:#77716c;text-transform:uppercase;padding-bottom:28px">${escape(studio.name)}</td></tr>
<tr><td style="font-size:26px;font-weight:600;letter-spacing:-0.5px;line-height:1.2;padding-bottom:14px">${escape(heading)}</td></tr>
${paragraphs.map((paragraph) => `<tr><td style="font-size:15px;line-height:1.55;color:#3a3232;padding-bottom:12px">${escape(paragraph)}</td></tr>`).join("")}
${detailRows ? `<tr><td style="padding:10px 0 6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows}</table></td></tr>` : ""}
${href && action ? `<tr><td style="padding-top:22px"><a href="${escape(href)}" style="display:inline-block;background:#28171a;color:#f1edda;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:15px">${escape(action.label)} →</a></td></tr>` : ""}
<tr><td style="padding-top:30px;font-size:12px;color:#77716c;line-height:1.5">Bu e-postayı ${escape(studio.name)} hesabındaki bir işlem nedeniyle aldın. Bildirim tercihlerini profil ayarlarından değiştirebilirsin.</td></tr>
</table></td></tr></table></body></html>`;
  const text = [heading, "", ...paragraphs, ...(details ?? []).map(([label, value]) => `${label}: ${value}`), ...(href && action ? ["", `${action.label}: ${href}`] : [])].join("\n");
  return { html, text };
}
