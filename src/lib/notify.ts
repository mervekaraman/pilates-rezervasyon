import "server-only";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db";
import { bookings, lessons, notifications, users, type NotificationKind } from "@/db/schema";
import { formatDayLong, formatTime, lessonLevelLabels, lessonTypeLabels } from "@/lib/format";
import { sendEmail } from "@/lib/mail";
import { sendPush } from "@/lib/push";
import { studio } from "@/lib/studio";

// Booking events fan out to an in-app notification and (if the person allows it) an e-mail.
// Callers run these inside `after()` so a slow SMTP server never delays the response.

const member = alias(users, "member");
const trainer = alias(users, "trainer");

async function loadBooking(bookingId: string) {
  const db = await getDb();
  const [row] = await db.select({ booking: bookings, lesson: lessons, member, trainer })
    .from(bookings).innerJoin(lessons, eq(lessons.id, bookings.lessonId))
    .innerJoin(member, eq(member.id, bookings.memberId)).innerJoin(trainer, eq(trainer.id, lessons.trainerId))
    .where(eq(bookings.id, bookingId)).limit(1);
  return row;
}

type Row = NonNullable<Awaited<ReturnType<typeof loadBooking>>>;
const lessonTitle = (lesson: Row["lesson"]) => lessonTypeLabels[lesson.type];
const when = (lesson: Row["lesson"]) => `${formatDayLong(lesson.startsAt)}, ${formatTime(lesson.startsAt)}`;
const lessonDetails = (row: Row): [string, string][] => [
  ["Ders", `${lessonTitle(row.lesson)} · ${lessonLevelLabels[row.lesson.level]}`],
  ["Tarih", formatDayLong(row.lesson.startsAt)],
  ["Saat", `${formatTime(row.lesson.startsAt)} · ${row.lesson.durationMin} dk`],
  ["Eğitmen", row.trainer.name],
];

/** In-app notification, mirrored as a Web Push to the person's devices (if they allowed it). */
async function inApp(userId: string, kind: NotificationKind, title: string, body: string, href: string, { push = true } = {}) {
  await (await getDb()).insert(notifications).values({ userId, kind, title, body, href });
  // Same tag per page: a newer update (e.g. "onaylandı") replaces the older one on the lock screen.
  if (push) await sendPush(userId, { title, body, url: href, tag: href });
}

export async function notifyBookingRequested(bookingId: string) {
  const row = await loadBooking(bookingId);
  if (!row) return;
  await inApp(row.member.id, "request", "Rezervasyon talebin alındı", `${lessonTitle(row.lesson)} · ${when(row.lesson)} — eğitmen onayı bekleniyor.`, `/rezervasyonlar/${row.booking.id}`, { push: false });
  await inApp(row.trainer.id, "request", "Yeni rezervasyon talebi", `${row.member.name} · ${when(row.lesson)}`, `/egitmen-paneli/talepler/${row.booking.id}`);
  if (row.member.emailNotifications) await sendEmail({
    to: row.member.email, subject: `Talebin alındı · ${formatDayLong(row.lesson.startsAt)} ${formatTime(row.lesson.startsAt)}`,
    heading: "Rezervasyon talebin alındı.",
    paragraphs: [`Merhaba ${row.member.name.split(" ")[0]}, ${studio.name} için talebini aldık. Eğitmen onayladığında sana tekrar haber vereceğiz.`],
    details: lessonDetails(row), action: { label: "Talebi gör", href: `/rezervasyonlar/${row.booking.id}` },
  });
  if (row.trainer.emailNotifications) await sendEmail({
    to: row.trainer.email, subject: `Yeni talep · ${row.member.name} · ${formatTime(row.lesson.startsAt)}`,
    heading: "Yeni bir rezervasyon talebin var.",
    paragraphs: [`${row.member.name}, ${when(row.lesson)} dersin için yer istedi.`, ...(row.booking.memberNote ? [`Üyenin notu: “${row.booking.memberNote}”`] : [])],
    details: lessonDetails(row).slice(0, 3), action: { label: "Talebi incele", href: `/egitmen-paneli/talepler/${row.booking.id}` },
  });
}

export async function notifyBookingDecision(bookingId: string) {
  const row = await loadBooking(bookingId);
  if (!row || (row.booking.status !== "approved" && row.booking.status !== "rejected")) return;
  const approved = row.booking.status === "approved";
  await inApp(row.member.id, approved ? "approved" : "rejected", approved ? "Rezervasyonun onaylandı" : "Rezervasyon talebin onaylanmadı", `${lessonTitle(row.lesson)} · ${when(row.lesson)}`, `/rezervasyonlar/${row.booking.id}`);
  if (!row.member.emailNotifications) return;
  await sendEmail({
    to: row.member.email,
    subject: approved ? `Rezervasyonun onaylandı · ${formatDayLong(row.lesson.startsAt)}` : "Rezervasyon talebin hakkında",
    heading: approved ? "Yerin hazır, görüşmek üzere." : "Bu derste yer açamadık.",
    paragraphs: [
      approved ? `${row.trainer.name} talebini onayladı. Dersten birkaç dakika önce stüdyoda olman yeterli.` : `${row.trainer.name} bu ders için talebini onaylayamadı. Programdan sana uygun başka bir saat seçebilirsin.`,
      ...(row.booking.trainerNote ? [`Eğitmenin notu: “${row.booking.trainerNote}”`] : []),
      ...(approved ? [`Derse ${studio.cancellationHours} saat kalana kadar iptal edebilirsin.`] : []),
    ],
    details: lessonDetails(row),
    action: approved ? { label: "Rezervasyonu gör", href: `/rezervasyonlar/${row.booking.id}` } : { label: "Ders programına git", href: "/dersler" },
  });
}

export async function notifyBookingCancelled(bookingId: string) {
  const row = await loadBooking(bookingId);
  if (!row) return;
  // Only approved bookings carry a decision date; without one the member withdrew a pending request.
  const wasApproved = row.booking.decidedAt !== null;
  const title = wasApproved ? "Bir rezervasyon iptal edildi" : "Bir talep geri çekildi";
  await inApp(row.trainer.id, "cancelled", title, `${row.member.name} · ${when(row.lesson)}`, `/egitmen-paneli/dersler/${row.lesson.id}`);
  if (row.trainer.emailNotifications) await sendEmail({
    to: row.trainer.email,
    subject: `${wasApproved ? "İptal" : "Talep geri çekildi"} · ${row.member.name} · ${formatDayLong(row.lesson.startsAt)} ${formatTime(row.lesson.startsAt)}`,
    heading: wasApproved ? "Bir rezervasyon iptal edildi." : "Bir talep geri çekildi.",
    paragraphs: [wasApproved
      ? `${row.member.name}, ${when(row.lesson)} dersindeki onaylı yerini iptal etti. Bu yer artık diğer üyelere açık.`
      : `${row.member.name}, ${when(row.lesson)} dersi için gönderdiği talebi onayını beklemeden geri çekti. Senin bir şey yapmana gerek yok.`],
    details: lessonDetails(row).slice(0, 3),
    action: { label: "Ders listesini gör", href: `/egitmen-paneli/dersler/${row.lesson.id}` },
  });
}

export async function notifyLessonCancelled(lessonId: string, bookingIds: string[]) {
  for (const bookingId of bookingIds) {
    const row = await loadBooking(bookingId);
    if (!row || row.lesson.id !== lessonId) continue;
    await inApp(row.member.id, "cancelled", "Dersin iptal edildi", `${lessonTitle(row.lesson)} · ${when(row.lesson)}`, "/dersler");
    if (row.member.emailNotifications) await sendEmail({
      to: row.member.email, subject: `Ders iptali · ${formatDayLong(row.lesson.startsAt)} ${formatTime(row.lesson.startsAt)}`,
      heading: "Dersin iptal edildi.",
      paragraphs: [`${row.trainer.name}, ${when(row.lesson)} dersini iptal etmek zorunda kaldı. Rezervasyonun kaldırıldı.`, "Programdan başka bir saat seçebilirsin."],
      details: lessonDetails(row), action: { label: "Ders programına git", href: "/dersler" },
    });
  }
}

export async function sendWelcomeEmail(user: { name: string; email: string; role: "member" | "trainer" }) {
  await sendEmail({
    to: user.email, subject: `${studio.name} hesabın hazır`,
    heading: `Hoş geldin, ${user.name.split(" ")[0]}.`,
    paragraphs: user.role === "trainer"
      ? ["Eğitmen hesabın açıldı. Panelinden yeni ders saatleri oluşturabilir, gelen talepleri onaylayabilirsin."]
      : [`${studio.name} hesabın açıldı. Ders programından sana uygun reformer dersini seçip yerini ayırabilirsin.`],
    action: user.role === "trainer" ? { label: "Eğitmen paneline git", href: "/egitmen-paneli" } : { label: "Ders programını gör", href: "/dersler" },
  });
}

export async function sendPasswordResetEmail(user: { name: string; email: string }, link: string) {
  await sendEmail({
    to: user.email, subject: "Şifre yenileme bağlantın",
    heading: "Şifreni yenile.",
    paragraphs: [`Merhaba ${user.name.split(" ")[0]}, şifreni yenilemek için aşağıdaki bağlantıyı kullan. Bağlantı 1 saat geçerli ve yalnızca bir kez kullanılabilir.`, "Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; şifren değişmez."],
    action: { label: "Yeni şifre belirle", href: link },
  });
}
