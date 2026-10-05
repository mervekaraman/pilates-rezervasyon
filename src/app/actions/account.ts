"use server";

import { and, eq, isNull } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { bookings, lessons, notifications, reviews, users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteUserSessions } from "@/lib/auth/session";
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
  await deleteUserSessions(user.id);
  await createSession(user.id);
  return { ok: true, message: "Şifren güncellendi; diğer cihazlardaki oturumların kapatıldı." };
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
  const [booking] = await db.select({ status: bookings.status, attendance: bookings.attendance, trainerId: lessons.trainerId, reviewId: reviews.id })
    .from(bookings).innerJoin(lessons, eq(lessons.id, bookings.lessonId)).leftJoin(reviews, eq(reviews.bookingId, bookings.id))
    .where(and(eq(bookings.id, parsed.data.bookingId), eq(bookings.memberId, user.id))).limit(1);
  if (!booking || booking.status !== "approved" || booking.attendance !== "attended") return { error: "Sadece eğitmenin katılımını onayladığı dersleri değerlendirebilirsin.", values };

  const reviewValues = {
    bookingId: parsed.data.bookingId, memberId: user.id, trainerId: booking.trainerId, rating: parsed.data.rating, comment: parsed.data.comment,
    recommendsTrainer: formData.get("recommendsTrainer") === "on", recommendsStudio: formData.get("recommendsStudio") === "on",
  };
  if (booking.reviewId) await db.update(reviews).set({ ...reviewValues, updatedAt: new Date() }).where(and(eq(reviews.id, booking.reviewId), eq(reviews.memberId, user.id)));
  else await db.insert(reviews).values(reviewValues);
  redirect(`/yorumlar?${booking.reviewId ? "guncellendi" : "gonderildi"}=1`);
}
