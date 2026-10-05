"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { bookings, lessons } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import { fieldErrors, type FormState } from "@/lib/forms";
import { notifyBookingCancelled, notifyBookingDecision, notifyBookingRequested } from "@/lib/notify";
import { isUuid } from "@/lib/queries";
import { studio } from "@/lib/studio";

const note = z.string().trim().max(300, { error: "Not en fazla 300 karakter olabilir." }).optional().transform((value) => value || null);

class BookingError extends Error {}

export async function requestBooking(_: FormState, formData: FormData): Promise<FormState> {
  const lessonId = String(formData.get("lessonId") ?? "");
  const user = await requireUser({ role: "member", next: `/dersler/${lessonId}` });
  const parsed = z.object({ lessonId: z.uuid(), memberNote: note }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const db = await getDb();
  let bookingId: string;
  try {
    bookingId = await db.transaction(async (tx) => {
      // Lock the lesson row so two members cannot both take the last seat.
      const [lesson] = await tx.select({ id: lessons.id, status: lessons.status, startsAt: lessons.startsAt, capacity: lessons.capacity }).from(lessons).where(eq(lessons.id, parsed.data.lessonId)).for("update");
      if (!lesson || lesson.status !== "published") throw new BookingError("Bu ders artık programda değil.");
      if (lesson.startsAt.getTime() <= Date.now()) throw new BookingError("Bu ders başladı ya da sona erdi.");

      const [existing] = await tx.select({ id: bookings.id, status: bookings.status }).from(bookings).where(and(eq(bookings.lessonId, lesson.id), eq(bookings.memberId, user.id)));
      if (existing && (existing.status === "pending" || existing.status === "approved")) throw new BookingError("Bu ders için zaten bir rezervasyonun var.");

      const [{ taken }] = await tx.select({ taken: sql<number>`count(*)::int` }).from(bookings).where(and(eq(bookings.lessonId, lesson.id), inArray(bookings.status, ["pending", "approved"])));
      if (taken >= lesson.capacity) throw new BookingError("Bu derste yer kalmadı. Programdan başka bir saat seçebilirsin.");

      if (existing) {
        await tx.update(bookings).set({ status: "pending", memberNote: parsed.data.memberNote, trainerNote: null, decidedAt: null, updatedAt: new Date() }).where(eq(bookings.id, existing.id));
        return existing.id;
      }
      const [created] = await tx.insert(bookings).values({ lessonId: lesson.id, memberId: user.id, memberNote: parsed.data.memberNote }).returning({ id: bookings.id });
      return created.id;
    });
  } catch (error) {
    if (error instanceof BookingError) return { error: error.message };
    throw error;
  }

  after(() => notifyBookingRequested(bookingId));
  redirect(`/rezervasyon/basarili?r=${bookingId}`);
}

export async function cancelBooking(_: FormState, formData: FormData): Promise<FormState> {
  const bookingId = String(formData.get("bookingId") ?? "");
  const user = await requireUser({ role: "member" });
  if (!isUuid(bookingId)) return { error: "Rezervasyon bulunamadı." };

  const db = await getDb();
  const [row] = await db.select({ status: bookings.status, startsAt: lessons.startsAt }).from(bookings).innerJoin(lessons, eq(lessons.id, bookings.lessonId))
    .where(and(eq(bookings.id, bookingId), eq(bookings.memberId, user.id))).limit(1);
  if (!row) return { error: "Rezervasyon bulunamadı." };
  if (row.status !== "pending" && row.status !== "approved") return { error: "Bu rezervasyon zaten aktif değil." };
  const hoursLeft = (row.startsAt.getTime() - Date.now()) / 3_600_000;
  if (hoursLeft <= 0) return { error: "Başlamış bir ders iptal edilemez." };
  if (row.status === "approved" && hoursLeft < studio.cancellationHours) return { error: `Derse ${studio.cancellationHours} saatten az kaldığı için çevrimiçi iptal kapandı. Lütfen stüdyoyla iletişime geç.` };

  await db.update(bookings).set({ status: "cancelled", updatedAt: new Date() }).where(eq(bookings.id, bookingId));
  after(() => notifyBookingCancelled(bookingId));
  refresh();
  return { ok: true, message: "Rezervasyonun iptal edildi." };
}

export async function rescheduleBooking(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser({ role: "member" });
  const parsed = z.object({ bookingId: z.uuid(), lessonId: z.uuid() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Ders seçimi geçersiz." };
  const db = await getDb();
  let newBookingId: string;
  try {
    newBookingId = await db.transaction(async (tx) => {
      const [current] = await tx.select({ lessonId: bookings.lessonId, status: bookings.status, startsAt: lessons.startsAt })
        .from(bookings).innerJoin(lessons, eq(lessons.id, bookings.lessonId))
        .where(and(eq(bookings.id, parsed.data.bookingId), eq(bookings.memberId, user.id))).for("update");
      if (!current || !["pending", "approved"].includes(current.status)) throw new BookingError("Aktif rezervasyon bulunamadı.");
      if (current.lessonId === parsed.data.lessonId) throw new BookingError("Zaten bu derstesin.");
      const hoursLeft = (current.startsAt.getTime() - Date.now()) / 3_600_000;
      if (hoursLeft <= 0) throw new BookingError("Başlamış bir ders değiştirilemez.");
      if (current.status === "approved" && hoursLeft < studio.cancellationHours) throw new BookingError(`Derse ${studio.cancellationHours} saatten az kaldığı için çevrimiçi değişiklik kapandı.`);

      const [target] = await tx.select({ id: lessons.id, status: lessons.status, startsAt: lessons.startsAt, capacity: lessons.capacity })
        .from(lessons).where(eq(lessons.id, parsed.data.lessonId)).for("update");
      if (!target || target.status !== "published" || target.startsAt.getTime() <= Date.now()) throw new BookingError("Seçtiğin ders artık uygun değil.");
      const [{ taken }] = await tx.select({ taken: sql<number>`count(*)::int` }).from(bookings)
        .where(and(eq(bookings.lessonId, target.id), inArray(bookings.status, ["pending", "approved"])));
      if (taken >= target.capacity) throw new BookingError("Seçtiğin ders doldu. Başka bir saat seçebilirsin.");
      const [existing] = await tx.select({ id: bookings.id, status: bookings.status }).from(bookings)
        .where(and(eq(bookings.lessonId, target.id), eq(bookings.memberId, user.id))).for("update");
      if (existing && ["pending", "approved"].includes(existing.status)) throw new BookingError("Bu ders için zaten aktif bir rezervasyonun var.");

      await tx.update(bookings).set({ status: "cancelled", updatedAt: new Date() }).where(eq(bookings.id, parsed.data.bookingId));
      if (existing) {
        await tx.update(bookings).set({ status: "pending", attendance: null, attendanceMarkedAt: null, trainerNote: null, decidedAt: null, updatedAt: new Date() }).where(eq(bookings.id, existing.id));
        return existing.id;
      }
      const [created] = await tx.insert(bookings).values({ lessonId: target.id, memberId: user.id }).returning({ id: bookings.id });
      return created.id;
    });
  } catch (error) {
    if (error instanceof BookingError) return { error: error.message };
    throw error;
  }
  after(async () => { await notifyBookingCancelled(parsed.data.bookingId); await notifyBookingRequested(newBookingId); });
  redirect(`/rezervasyon/basarili?r=${newBookingId}&degisti=1`);
}

export async function decideBooking(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser({ role: "trainer" });
  const parsed = z.object({ bookingId: z.uuid(), decision: z.enum(["approve", "reject"]), trainerNote: note, back: z.string().optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const db = await getDb();
  const [row] = await db.select({ status: bookings.status, startsAt: lessons.startsAt }).from(bookings).innerJoin(lessons, eq(lessons.id, bookings.lessonId))
    .where(and(eq(bookings.id, parsed.data.bookingId), eq(lessons.trainerId, user.id))).limit(1);
  if (!row) return { error: "Talep bulunamadı." };
  if (row.status !== "pending") return { error: "Bu talep için daha önce karar verilmiş." };
  if (row.startsAt.getTime() <= Date.now()) return { error: "Ders başladığı için talep artık değiştirilemez." };

  await db.update(bookings).set({ status: parsed.data.decision === "approve" ? "approved" : "rejected", trainerNote: parsed.data.trainerNote, decidedAt: new Date(), updatedAt: new Date() }).where(eq(bookings.id, parsed.data.bookingId));
  after(() => notifyBookingDecision(parsed.data.bookingId));
  if (parsed.data.back === "detail") redirect("/egitmen-paneli/talepler");
  refresh();
  return { ok: true };
}
