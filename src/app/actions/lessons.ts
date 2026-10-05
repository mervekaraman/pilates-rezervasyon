"use server";

import { and, eq, gt, inArray, lt } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { bookings, lessonLevel, lessons } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import { addDays, atStudioTime, dayKey, formatDayLong, formatTime, isDayKey, isSunday, todayKey } from "@/lib/format";
import { fieldErrors, keepValues, type FormState } from "@/lib/forms";
import { notifyLessonCancelled } from "@/lib/notify";
import { isUuid } from "@/lib/queries";
import { lessonStartTimes } from "@/lib/studio";

const lessonSchema = z.object({
  day: z.string().refine(isDayKey, { error: "Bir gün seç." }).refine((day) => !isSunday(day), { error: "Pazar günleri ders açılmıyor." }),
  time: z.string({ error: "Başlangıç saatini seç." }).refine((time) => lessonStartTimes.includes(time), { error: "Dersler saat başında başlar; listeden bir saat seç." }),
  durationMin: z.coerce.number().int().min(30, { error: "Süre en az 30 dakika olmalı." }).max(120, { error: "Süre en fazla 120 dakika olabilir." }),
  capacity: z.coerce.number().int().min(1, { error: "Kontenjan en az 1 olmalı." }).max(12, { error: "Kontenjan en fazla 12 olabilir." }),
  level: z.enum(lessonLevel.enumValues, { error: "Seviye seç." }),
  note: z.string().trim().max(300, { error: "Not en fazla 300 karakter olabilir." }).optional().transform((value) => value || null),
  repeatWeeks: z.coerce.number().int().min(1).max(8).default(1),
});

export async function createLesson(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser({ role: "trainer" });
  const values = keepValues(formData, ["day", "time", "durationMin", "capacity", "level", "note"]);
  const parsed = lessonSchema.safeParse({ ...Object.fromEntries(formData), repeatWeeks: formData.get("repeat") === "on" ? formData.get("repeatWeeks") : 1 });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const data = parsed.data;
  if (data.day > addDays(todayKey(), 60)) return { fieldErrors: { day: "En fazla 60 gün sonrasına ders açabilirsin." }, values };

  const occurrences = Array.from({ length: data.repeatWeeks }, (_, week) => {
    const startsAt = atStudioTime(addDays(data.day, week * 7), data.time);
    return { startsAt, endsAt: new Date(startsAt.getTime() + data.durationMin * 60_000) };
  });
  if (occurrences[0].startsAt.getTime() <= Date.now()) return { fieldErrors: { time: "Geçmiş bir saate ders açılamaz." }, values };

  const db = await getDb();
  // One studio room: no two classes may overlap, whoever teaches them. This check only produces a
  // friendly message; the `lessons_no_overlap` constraint is what guarantees it under concurrent saves.
  for (const { startsAt, endsAt } of occurrences) {
    const [clash] = await db.select({ startsAt: lessons.startsAt }).from(lessons)
      .where(and(eq(lessons.status, "published"), lt(lessons.startsAt, endsAt), gt(lessons.endsAt, startsAt))).limit(1);
    if (clash) {
      refresh();
      return { error: `${formatDayLong(startsAt)} ${formatTime(startsAt)} için stüdyoda ${formatTime(clash.startsAt)} başlangıçlı başka bir ders var. Farklı bir saat seç.`, values };
    }
  }

  try {
    // A single statement: either every week is created or none is.
    await db.insert(lessons).values(occurrences.map(({ startsAt, endsAt }) => ({ trainerId: user.id, type: "reformer" as const, level: data.level, startsAt, endsAt, durationMin: data.durationMin, capacity: data.capacity, note: data.note })));
  } catch (error) {
    if (!isOverlapError(error)) throw error;
    refresh();
    return { error: "Bu saat az önce başka bir derse verildi. Saat listesi güncellendi; farklı bir saat seç.", values };
  }
  redirect(`/egitmen-paneli/takvim?gun=${data.day}&yeni=${occurrences.length}`);
}

function isOverlapError(error: unknown) {
  const code = (error as { code?: string; cause?: { code?: string } } | null);
  return code?.code === "23P01" || code?.cause?.code === "23P01";
}

export async function cancelLesson(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser({ role: "trainer" });
  const lessonId = String(formData.get("lessonId") ?? "");
  if (!isUuid(lessonId)) return { error: "Ders bulunamadı." };

  const db = await getDb();
  const result = await db.transaction(async (tx) => {
    const [lesson] = await tx.select({ startsAt: lessons.startsAt, status: lessons.status }).from(lessons).where(and(eq(lessons.id, lessonId), eq(lessons.trainerId, user.id))).for("update");
    if (!lesson) return { error: "Ders bulunamadı." } as const;
    if (lesson.status !== "published") return { error: "Bu ders zaten iptal edilmiş." } as const;
    if (lesson.startsAt.getTime() <= Date.now()) return { error: "Başlamış bir ders iptal edilemez." } as const;
    await tx.update(lessons).set({ status: "cancelled" }).where(eq(lessons.id, lessonId));
    const affected = await tx.update(bookings).set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(bookings.lessonId, lessonId), inArray(bookings.status, ["pending", "approved"]))).returning({ id: bookings.id });
    return { startsAt: lesson.startsAt, bookingIds: affected.map((row) => row.id) } as const;
  });
  if ("error" in result) return { error: result.error };

  after(() => notifyLessonCancelled(lessonId, result.bookingIds));
  redirect(`/egitmen-paneli/takvim?gun=${dayKey(result.startsAt)}&iptal=${result.bookingIds.length}`);
}

export async function markAttendance(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser({ role: "trainer" });
  const parsed = z.object({ bookingId: z.uuid(), attendance: z.enum(["attended", "no_show"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Katılım kaydı geçersiz." };
  const db = await getDb();
  const [row] = await db.select({ status: bookings.status, startsAt: lessons.startsAt }).from(bookings)
    .innerJoin(lessons, eq(lessons.id, bookings.lessonId))
    .where(and(eq(bookings.id, parsed.data.bookingId), eq(lessons.trainerId, user.id))).limit(1);
  if (!row) return { error: "Rezervasyon bulunamadı." };
  if (row.status !== "approved") return { error: "Yalnızca onaylı rezervasyonların katılımı işaretlenebilir." };
  if (row.startsAt.getTime() > Date.now()) return { error: "Katılım, ders başladıktan sonra işaretlenebilir." };
  await db.update(bookings).set({ attendance: parsed.data.attendance, attendanceMarkedAt: new Date(), updatedAt: new Date() }).where(eq(bookings.id, parsed.data.bookingId));
  refresh();
  return { ok: true, message: parsed.data.attendance === "attended" ? "Katılım kaydedildi." : "Katılmadı olarak kaydedildi." };
}
