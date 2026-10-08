"use server";

import { and, eq, gt, ilike, inArray, isNull, lt, or } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { bookings, emailChangeTokens, emailOutbox, lessons, notifications, passwordResetTokens, reviews, users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession, deleteUserSessions, hashToken, newToken } from "@/lib/auth/session";
import { appUrl } from "@/lib/mail";
import { notifyMemberLeft, notifySeatOpened, sendEmailChangedNotice, sendEmailChangeLink } from "@/lib/notify";
import { hitRateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/dal";
import { fieldErrors, keepValues, normalizePhone, type FormState } from "@/lib/forms";
import { isUuid } from "@/lib/queries";

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const values = keepValues(formData, ["name", "phone"]);
  const parsed = z.object({
    name: z.string().trim().min(2, { error: "Adını ve soyadını yaz." }).max(80, { error: "Ad soyad en fazla 80 karakter olabilir." }),
    phone: z.string().transform((value, ctx) => {
      const phone = normalizePhone(value);
      if (!phone) ctx.addIssue({ code: "custom", message: "Geçerli bir cep telefonu numarası gir." });
      return phone ?? "";
    }),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  await (await getDb()).update(users).set({ name: parsed.data.name, phone: parsed.data.phone, emailNotifications: formData.get("emailNotifications") === "on" }).where(eq(users.id, user.id));
  refresh();
  return { ok: true, message: "Bilgilerin kaydedildi." };
}

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = z.object({
    current: z.string().min(1, { error: "Mevcut şifreni yaz." }),
    password: z.string().min(8, { error: "Yeni şifre en az 8 karakter olmalı." }).max(128),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const db = await getDb();
  const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || !(await verifyPassword(parsed.data.current, row.passwordHash))) return { fieldErrors: { current: "Mevcut şifre hatalı." } };
  await db.update(users).set({ passwordHash: await hashPassword(parsed.data.password) }).where(eq(users.id, user.id));
  // Anyone signed in with the old password (another phone, a stolen session) is signed out.
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
  await deleteUserSessions(user.id);
  await createSession(user.id);
  return { ok: true, message: "Şifren güncellendi. Diğer cihazlardaki oturumların kapatıldı." };
}

export async function markNotificationsRead() {
  const user = await requireUser();
  await (await getDb()).update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  refresh();
}

export async function createReview(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser({ role: "member" });
  const values = keepValues(formData, ["comment"]);
  const parsed = z.object({
    bookingId: z.string().refine(isUuid),
    rating: z.coerce.number().int().min(1, { error: "Puan seç." }).max(5),
    comment: z.string().trim().min(10, { error: "Birkaç cümleyle anlatır mısın? (en az 10 karakter)" }).max(500, { error: "Yorum en fazla 500 karakter olabilir." }),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const db = await getDb();
  const [booking] = await db.select({ status: bookings.status, attendance: bookings.attendance, startsAt: lessons.startsAt, trainerId: lessons.trainerId, reviewId: reviews.id })
    .from(bookings).innerJoin(lessons, eq(lessons.id, bookings.lessonId)).leftJoin(reviews, eq(reviews.bookingId, bookings.id))
    .where(and(eq(bookings.id, parsed.data.bookingId), eq(bookings.memberId, user.id), lt(lessons.startsAt, new Date()))).limit(1);
  if (!booking || booking.status !== "approved" || booking.attendance === "no_show") return { error: "Sadece katıldığın dersleri değerlendirebilirsin.", values };
  if (booking.reviewId) return { error: "Bu dersi zaten değerlendirdin.", values };

  await db.insert(reviews).values({
    bookingId: parsed.data.bookingId, memberId: user.id, trainerId: booking.trainerId, rating: parsed.data.rating, comment: parsed.data.comment,
    recommendsTrainer: formData.get("recommendsTrainer") === "on", recommendsStudio: formData.get("recommendsStudio") === "on",
  }).onConflictDoNothing();
  redirect("/yorumlar?gonderildi=1");
}

const emailSchema = z.string().trim().toLowerCase().pipe(z.email({ error: "Geçerli bir e-posta adresi gir." }));

/** Step 1: password check, then a one-hour confirmation link to the new address. */
export async function requestEmailChange(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const values = keepValues(formData, ["newEmail"]);
  const parsed = z.object({ newEmail: emailSchema, emailPassword: z.string().min(1, { error: "Şifreni yaz." }) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const { newEmail, emailPassword: password } = parsed.data;
  if (newEmail === user.email) return { fieldErrors: { newEmail: "Bu zaten şu anki e-posta adresin." }, values };
  if (await hitRateLimit(`email-change:${user.id}`, 5, 60 * 60 * 1000)) return { error: "Çok fazla deneme yapıldı. Biraz sonra tekrar dene.", values };

  const db = await getDb();
  const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || !(await verifyPassword(password, row.passwordHash))) return { fieldErrors: { emailPassword: "Şifre hatalı." }, values };
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, newEmail)).limit(1);
  if (taken) return { fieldErrors: { newEmail: "Bu e-posta adresiyle açılmış başka bir hesap var." }, values };

  const token = newToken();
  await db.delete(emailChangeTokens).where(eq(emailChangeTokens.userId, user.id));
  await db.insert(emailChangeTokens).values({ id: hashToken(token), userId: user.id, newEmail, expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
  after(() => sendEmailChangeLink({ name: user.name, newEmail }, `${appUrl()}/eposta-dogrula?t=${token}`));
  return { ok: true, message: `Onay bağlantısını ${newEmail} adresine gönderdik. Bağlantıyı açınca e-postan değişecek.` };
}

/** Step 2: the link from the new mailbox; a button press (not the page load) applies the change. */
export async function confirmEmailChange(_: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  if (!token || token.length > 100) return { error: "Bağlantı geçersiz." };
  const db = await getDb();
  const outcome = await db.transaction(async (tx) => {
    const [row] = await tx.select({ userId: emailChangeTokens.userId, newEmail: emailChangeTokens.newEmail, name: users.name, oldEmail: users.email })
      .from(emailChangeTokens).innerJoin(users, eq(users.id, emailChangeTokens.userId))
      .where(and(eq(emailChangeTokens.id, hashToken(token)), isNull(emailChangeTokens.usedAt), gt(emailChangeTokens.expiresAt, new Date()))).for("update", { of: emailChangeTokens }).limit(1);
    if (!row) return { error: "Bu bağlantının süresi dolmuş ya da daha önce kullanılmış. Profil ayarlarından yeniden iste." } as const;
    const [taken] = await tx.select({ id: users.id }).from(users).where(eq(users.email, row.newEmail)).limit(1);
    if (taken) return { error: "Bu e-posta adresiyle açılmış başka bir hesap var." } as const;
    await tx.update(users).set({ email: row.newEmail }).where(eq(users.id, row.userId));
    // Copies of mail sent to the old address are not needed any more.
    await tx.delete(emailOutbox).where(eq(emailOutbox.to, row.oldEmail));
    await tx.update(emailChangeTokens).set({ usedAt: new Date() }).where(eq(emailChangeTokens.id, hashToken(token)));
    return row;
  });
  if ("error" in outcome) return { error: outcome.error };
  after(() => sendEmailChangedNotice({ name: outcome.name, oldEmail: outcome.oldEmail, newEmail: outcome.newEmail }));
  return { ok: true, message: `E-posta adresin ${outcome.newEmail} olarak güncellendi. Artık bu adresle giriş yapabilirsin.` };
}

/** KVKK: a member deletes their account and everything stored about them. */
export async function deleteAccount(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.role !== "member") return { error: "Eğitmen hesapları stüdyo üzerinden kapatılır." };
  const parsed = z.object({ deletePassword: z.string().min(1, { error: "Şifreni yaz." }), confirm: z.literal("on", { error: "Silme işlemini onayla." }) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const db = await getDb();
  const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || !(await verifyPassword(parsed.data.deletePassword, row.passwordHash))) return { fieldErrors: { deletePassword: "Şifre hatalı." } };

  // Seats this member still holds; trainers and the waitlist hear about them once the data is gone.
  const seats = await db.select({ lessonId: lessons.id, trainerId: lessons.trainerId, startsAt: lessons.startsAt }).from(bookings).innerJoin(lessons, eq(lessons.id, bookings.lessonId))
    .where(and(eq(bookings.memberId, user.id), inArray(bookings.status, ["pending", "approved"]), eq(lessons.status, "published"), gt(lessons.startsAt, new Date())));
  // Cascades remove sessions, bookings, reviews, notifications, push subscriptions and waitlist rows;
  // copies of e-mails sent to this person have no foreign key, so they go explicitly.
  await db.transaction(async (tx) => {
    // Their own mail plus copies sent to trainers that name them (requests, cancellations, notes).
    const namePattern = `%${user.name.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
    await tx.delete(emailOutbox).where(or(eq(emailOutbox.to, user.email), ilike(emailOutbox.text, namePattern)));
    await tx.delete(users).where(eq(users.id, user.id));
  });
  await deleteSession();
  after(async () => {
    for (const seat of seats) {
      await notifyMemberLeft({ trainerId: seat.trainerId, memberName: user.name, lessonId: seat.lessonId, startsAt: seat.startsAt });
      await notifySeatOpened(seat.lessonId);
    }
  });
  redirect("/giris?silindi=1");
}
