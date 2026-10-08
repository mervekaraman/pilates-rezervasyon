import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AppShell } from "@/components/flowly/shell";
import { EmptyState, PageHeading, StatusBadge } from "@/components/flowly/ui";
import { relativeTime } from "@/lib/format";
import { requireUser } from "@/lib/dal";
import { isMailConfigured } from "@/lib/mail";
import { listOutbox } from "@/lib/queries";

export const metadata = { title: "Giden e-postalar" };

const actionLink = (text: string) => text.match(/https?:\/\/\S+$/m)?.[0];

// Development-only window into the outbox, so e-mail flows can be checked without an SMTP account.
// Copies include password-reset links, so even locally only a signed-in trainer may open it
// (anyone else on the same Wi-Fi could otherwise take over accounts).
export default async function OutboxPage() {
  if (process.env.NODE_ENV === "production") notFound();
  await connection();
  await requireUser({ role: "trainer", next: "/gelistirici/e-postalar" });
  const emails = await listOutbox();
  return <AppShell className="outbox-screen" nav={false}>
    <section>
      <PageHeading eyebrow="Geliştirici" title="Giden e-postalar" sub={isMailConfigured() ? "SMTP ayarlı: e-postalar gerçekten gönderiliyor ve burada da kaydediliyor." : "SMTP ayarlı olmadığı için e-postalar gönderilmiyor, yalnızca burada görünüyor. Gerçek gönderim için .env.local dosyasına SMTP bilgilerini ekle."}/>
      {emails.length ? <div className="outbox-list">{emails.map((email) => <details key={email.id}>
        <summary><div><strong>{email.subject}</strong><span>{email.to} · {relativeTime(email.createdAt)}</span></div><StatusBadge tone={email.status === "sent" ? "moss" : email.status === "failed" ? "plum" : "neutral"}>{email.status === "sent" ? "Gönderildi" : email.status === "failed" ? "Hata" : "Kaydedildi"}</StatusBadge></summary>
        {email.error && <p className="check-error">{email.error}</p>}
        <iframe title={email.subject} srcDoc={email.html} sandbox=""/>
        {actionLink(email.text) && <a href={actionLink(email.text)!} className="see-all">E-postadaki bağlantıyı aç</a>}
      </details>)}</div> : <EmptyState icon="mail" title="Henüz e-posta yok." text="Kayıt olduğunda ya da rezervasyon talebi gönderdiğinde e-postalar burada görünür."/>}
    </section>
  </AppShell>;
}
