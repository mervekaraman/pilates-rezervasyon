// Relative import with extension so the unit tests can load this file directly with Node.
import { formatDayLong, formatTime } from "./format.ts";

// Free "click to chat" links: WhatsApp opens on the trainer's phone with the member's number and a
// ready-made message; the trainer only presses send. No API, no per-message fee.

export type WhatsAppTopic = "approved" | "rejected" | "pending" | "lessonCancelled" | "reminder";

type MessageInput = { topic: WhatsAppTopic; memberName: string; trainerName: string; startsAt: Date; trainerNote?: string | null; siteUrl: string };

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

export function whatsappMessage({ topic, memberName, trainerName, startsAt, trainerNote, siteUrl }: MessageInput) {
  const when = `${formatDayLong(startsAt)} ${formatTime(startsAt)}`;
  const note = trainerNote ? ` Notum: ${trainerNote}` : "";
  const sign = `\n\n${firstName(trainerName)} · Smeda Pilates`;
  const body: Record<WhatsAppTopic, string> = {
    approved: `${when} reformer dersin için rezervasyonun onaylandı.${note} Dersten birkaç dakika önce stüdyoda olman yeterli, görüşmek üzere!`,
    rejected: `${when} reformer dersi için talebini maalesef onaylayamadım.${note} Programdan sana uygun başka bir saat seçebilirsin: ${siteUrl}/dersler`,
    pending: `${when} reformer dersi için talebini aldım, kısa süre içinde dönüş yapacağım.`,
    lessonCancelled: `${when} reformer dersimizi iptal etmek zorunda kaldım, kusura bakma. Rezervasyonun kaldırıldı; programdan başka bir saat seçebilirsin: ${siteUrl}/dersler`,
    reminder: `${when} reformer dersinde seni bekliyorum. Rahat kıyafet ve kaymaz çorabını unutma.`,
  };
  return `Merhaba ${firstName(memberName)}, ${body[topic]}${sign}`;
}

/** wa.me link for a stored E.164 number (+905321234567), or null when there is no usable number. */
export function whatsappLink(phone: string | null | undefined, text: string) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (digits.length < 10 || digits.length > 15) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
