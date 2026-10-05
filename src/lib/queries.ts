import "server-only";
import { and, asc, desc, eq, gt, gte, isNull, lt, ne, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db";
import { bookings, emailOutbox, lessons, notifications, reviews, users, type BookingStatus } from "@/db/schema";
import { atStudioTime, dayKey, dayRange } from "@/lib/format";

// Read models for pages. Each function returns only what the UI renders (no password hashes, no raw rows).

const trainer = alias(users, "trainer");
const member = alias(users, "member");

// Correlated subqueries name the outer table explicitly: Drizzle leaves column names unqualified in
// single-table queries, and an unqualified "id" inside the subquery would bind to the inner table.
// Seats held by a lesson: pending requests count, so a class can never be over-requested.
const takenSeats = sql<number>`(select count(*)::int from bookings b where b.lesson_id = "lessons"."id" and b.status in ('pending', 'approved'))`;

const lessonColumns = {
  id: lessons.id, type: lessons.type, level: lessons.level, startsAt: lessons.startsAt, durationMin: lessons.durationMin,
  capacity: lessons.capacity, note: lessons.note, status: lessons.status,
  trainerId: trainer.id, trainerName: trainer.name, trainerAvatar: trainer.avatarUrl, taken: takenSeats,
};

export type LessonCard = Awaited<ReturnType<typeof listLessons>>[number];

export async function listLessons({ from, to, viewerId, trainerId, includeCancelled = false }: { from: Date; to: Date; viewerId?: string; trainerId?: string; includeCancelled?: boolean }) {
  const db = await getDb();
  const rows = await db.select({ ...lessonColumns, myBookingId: viewerId ? sql<string | null>`(select b.id from bookings b where b.lesson_id = "lessons"."id" and b.member_id = ${viewerId})` : sql<null>`null`, myStatus: viewerId ? sql<BookingStatus | null>`(select b.status from bookings b where b.lesson_id = "lessons"."id" and b.member_id = ${viewerId})` : sql<null>`null` })
    .from(lessons).innerJoin(trainer, eq(trainer.id, lessons.trainerId))
    .where(and(gte(lessons.startsAt, from), lt(lessons.startsAt, to), trainerId ? eq(lessons.trainerId, trainerId) : undefined, includeCancelled ? undefined : eq(lessons.status, "published")))
    .orderBy(asc(lessons.startsAt));
  return rows;
}

export async function getLesson(id: string, viewerId?: string) {
  if (!isUuid(id)) return null;
  const [row] = await listLessonsWhere(eq(lessons.id, id), viewerId);
  return row ?? null;
}

async function listLessonsWhere(where: SQL | undefined, viewerId?: string) {
  const db = await getDb();
  return db.select({ ...lessonColumns, trainerBio: trainer.bio, myBookingId: viewerId ? sql<string | null>`(select b.id from bookings b where b.lesson_id = "lessons"."id" and b.member_id = ${viewerId})` : sql<null>`null`, myStatus: viewerId ? sql<BookingStatus | null>`(select b.status from bookings b where b.lesson_id = "lessons"."id" and b.member_id = ${viewerId})` : sql<null>`null` })
    .from(lessons).innerJoin(trainer, eq(trainer.id, lessons.trainerId)).where(where).limit(1);
}

/** Studio time already taken by published classes in [from, to), for the new-lesson form. */
export async function listBusySlots(from: Date, to: Date) {
  const db = await getDb();
  return db.select({ startsAt: lessons.startsAt, endsAt: lessons.endsAt }).from(lessons)
    .where(and(eq(lessons.status, "published"), lt(lessons.startsAt, to), gt(lessons.endsAt, from)));
}

export type DayCount = { total: number; open: number };

/** Upcoming lessons per studio day (and how many still have seats), for the date strip. */
export async function lessonCountsByDay(days: string[]) {
  if (!days.length) return {} as Record<string, DayCount>;
  const db = await getDb();
  const [from] = dayRange(days[0]);
  const [, to] = dayRange(days[days.length - 1]);
  const rows = await db.select({ startsAt: lessons.startsAt, capacity: lessons.capacity, taken: takenSeats })
    .from(lessons).where(and(gte(lessons.startsAt, new Date(Math.max(from.getTime(), Date.now()))), lt(lessons.startsAt, to), eq(lessons.status, "published")));
  const counts: Record<string, DayCount> = {};
  for (const row of rows) {
    const count = (counts[dayKey(row.startsAt)] ??= { total: 0, open: 0 });
    count.total += 1;
    if (row.taken < row.capacity) count.open += 1;
  }
  return counts;
}

export async function listMemberBookings(memberId: string) {
  const db = await getDb();
  return db.select({ id: bookings.id, status: bookings.status, attendance: bookings.attendance, createdAt: bookings.createdAt, lessonId: lessons.id, startsAt: lessons.startsAt, durationMin: lessons.durationMin, level: lessons.level, type: lessons.type, lessonStatus: lessons.status, trainerId: trainer.id, trainerName: trainer.name, trainerAvatar: trainer.avatarUrl, reviewId: reviews.id })
    .from(bookings).innerJoin(lessons, eq(lessons.id, bookings.lessonId)).innerJoin(trainer, eq(trainer.id, lessons.trainerId)).leftJoin(reviews, eq(reviews.bookingId, bookings.id))
    .where(eq(bookings.memberId, memberId)).orderBy(asc(lessons.startsAt));
}

export async function getMemberBooking(memberId: string, bookingId: string) {
  if (!isUuid(bookingId)) return null;
  const db = await getDb();
  const [row] = await db.select({ id: bookings.id, status: bookings.status, attendance: bookings.attendance, memberNote: bookings.memberNote, trainerNote: bookings.trainerNote, createdAt: bookings.createdAt, decidedAt: bookings.decidedAt, lessonId: lessons.id, startsAt: lessons.startsAt, durationMin: lessons.durationMin, level: lessons.level, type: lessons.type, lessonStatus: lessons.status, trainerId: trainer.id, trainerName: trainer.name, trainerAvatar: trainer.avatarUrl, reviewId: reviews.id, reviewRating: reviews.rating, reviewComment: reviews.comment, recommendsTrainer: reviews.recommendsTrainer, recommendsStudio: reviews.recommendsStudio })
    .from(bookings).innerJoin(lessons, eq(lessons.id, bookings.lessonId)).innerJoin(trainer, eq(trainer.id, lessons.trainerId)).leftJoin(reviews, eq(reviews.bookingId, bookings.id))
    .where(and(eq(bookings.id, bookingId), eq(bookings.memberId, memberId))).limit(1);
  return row ?? null;
}

export async function listTrainers() {
  const db = await getDb();
  return db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, bio: users.bio, rating: sql<number | null>`(select round(avg(r.rating)::numeric, 1)::float from reviews r where r.trainer_id = "users"."id")`, reviewCount: sql<number>`(select count(*)::int from reviews r where r.trainer_id = "users"."id")` })
    .from(users).where(eq(users.role, "trainer")).orderBy(asc(users.createdAt));
}

export async function getTrainer(id: string) {
  if (!isUuid(id)) return null;
  const all = await listTrainers();
  return all.find((item) => item.id === id) ?? null;
}

export type ReviewSort = "yeni" | "yuksek";

export async function listReviews({ trainerId, limit = 50, sort = "yeni" }: { trainerId?: string; limit?: number; sort?: ReviewSort } = {}) {
  const db = await getDb();
  return db.select({ id: reviews.id, rating: reviews.rating, comment: reviews.comment, createdAt: reviews.createdAt, memberName: member.name, memberAvatar: member.avatarUrl, trainerId: trainer.id, trainerName: trainer.name })
    .from(reviews).innerJoin(member, eq(member.id, reviews.memberId)).innerJoin(trainer, eq(trainer.id, reviews.trainerId))
    .where(trainerId ? eq(reviews.trainerId, trainerId) : undefined)
    .orderBy(...(sort === "yuksek" ? [desc(reviews.rating), desc(reviews.createdAt)] : [desc(reviews.createdAt)])).limit(limit);
}

export async function reviewSummary(trainerId?: string) {
  const db = await getDb();
  const rows = await db.select({ rating: reviews.rating, count: sql<number>`count(*)::int` }).from(reviews).where(trainerId ? eq(reviews.trainerId, trainerId) : undefined).groupBy(reviews.rating);
  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let total = 0, sum = 0;
  for (const row of rows) { distribution[row.rating] = row.count; total += row.count; sum += row.rating * row.count; }
  return { count: total, average: total ? Math.round((sum / total) * 10) / 10 : null, distribution };
}

export async function memberStats(userId: string) {
  const db = await getDb();
  const now = new Date();
  const [row] = await db.select({
    completed: sql<number>`count(*) filter (where ${bookings.attendance} = 'attended')::int`,
    upcoming: sql<number>`count(*) filter (where ${bookings.status} in ('pending', 'approved') and ${lessons.startsAt} >= ${now})::int`,
  }).from(bookings).innerJoin(lessons, eq(lessons.id, bookings.lessonId)).where(eq(bookings.memberId, userId));
  const [reviewRow] = await db.select({ count: sql<number>`count(*)::int` }).from(reviews).where(eq(reviews.memberId, userId));
  return { completed: row?.completed ?? 0, upcoming: row?.upcoming ?? 0, reviews: reviewRow?.count ?? 0 };
}

export async function trainerStats(trainerId: string, weekStart: string) {
  const db = await getDb();
  const from = atStudioTime(weekStart, "00:00");
  const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [week] = await db.select({
    lessons: sql<number>`count(distinct ${lessons.id})::int`,
    participants: sql<number>`count(${bookings.id}) filter (where ${bookings.status} = 'approved')::int`,
  }).from(lessons).leftJoin(bookings, eq(bookings.lessonId, lessons.id))
    .where(and(eq(lessons.trainerId, trainerId), eq(lessons.status, "published"), gte(lessons.startsAt, from), lt(lessons.startsAt, to)));
  const [pending] = await db.select({ count: sql<number>`count(*)::int` }).from(bookings).innerJoin(lessons, eq(lessons.id, bookings.lessonId))
    .where(and(eq(lessons.trainerId, trainerId), eq(bookings.status, "pending"), gte(lessons.startsAt, new Date())));
  return { weekLessons: week?.lessons ?? 0, weekParticipants: week?.participants ?? 0, pending: pending?.count ?? 0 };
}

export type RequestFilter = "pending" | "approved" | "rejected";

export async function listTrainerRequests(trainerId: string, status: RequestFilter, limit = 60) {
  const db = await getDb();
  const now = new Date();
  return db.select({ id: bookings.id, status: bookings.status, memberNote: bookings.memberNote, createdAt: bookings.createdAt, decidedAt: bookings.decidedAt, lessonId: lessons.id, startsAt: lessons.startsAt, durationMin: lessons.durationMin, level: lessons.level, capacity: lessons.capacity, taken: takenSeats, memberId: member.id, memberName: member.name, memberAvatar: member.avatarUrl, memberPhone: member.phone, trainerNote: bookings.trainerNote })
    .from(bookings).innerJoin(lessons, eq(lessons.id, bookings.lessonId)).innerJoin(member, eq(member.id, bookings.memberId))
    .where(and(eq(lessons.trainerId, trainerId), eq(bookings.status, status), status === "pending" ? gte(lessons.startsAt, now) : undefined))
    .orderBy(status === "pending" ? asc(lessons.startsAt) : desc(bookings.decidedAt)).limit(limit);
}

export async function getTrainerRequest(trainerId: string, bookingId: string) {
  if (!isUuid(bookingId)) return null;
  const db = await getDb();
  const [row] = await db.select({ id: bookings.id, status: bookings.status, attendance: bookings.attendance, memberNote: bookings.memberNote, trainerNote: bookings.trainerNote, createdAt: bookings.createdAt, lessonId: lessons.id, startsAt: lessons.startsAt, durationMin: lessons.durationMin, level: lessons.level, capacity: lessons.capacity, taken: takenSeats, memberId: member.id, memberName: member.name, memberAvatar: member.avatarUrl, memberEmail: member.email, memberPhone: member.phone, memberSince: member.createdAt })
    .from(bookings).innerJoin(lessons, eq(lessons.id, bookings.lessonId)).innerJoin(member, eq(member.id, bookings.memberId))
    .where(and(eq(bookings.id, bookingId), eq(lessons.trainerId, trainerId))).limit(1);
  if (!row) return null;
  const [history] = await db.select({ completed: sql<number>`count(*)::int` }).from(bookings).innerJoin(lessons, eq(lessons.id, bookings.lessonId))
    .where(and(eq(bookings.memberId, row.memberId), eq(bookings.attendance, "attended")));
  return { ...row, completedLessons: history?.completed ?? 0 };
}

export async function getTrainerLesson(trainerId: string, lessonId: string) {
  if (!isUuid(lessonId)) return null;
  const [lesson] = await listLessonsWhere(and(eq(lessons.id, lessonId), eq(lessons.trainerId, trainerId)));
  if (!lesson) return null;
  const db = await getDb();
  const roster = await db.select({ id: bookings.id, status: bookings.status, attendance: bookings.attendance, memberNote: bookings.memberNote, memberName: member.name, memberAvatar: member.avatarUrl, memberPhone: member.phone })
    .from(bookings).innerJoin(member, eq(member.id, bookings.memberId))
    .where(and(eq(bookings.lessonId, lessonId), ne(bookings.status, "rejected"))).orderBy(asc(bookings.createdAt));
  return { lesson, roster };
}

/** Day keys of a month (YYYY-MM) that have at least one of the trainer's lessons. */
export async function trainerLessonDays(trainerId: string, month: string) {
  const db = await getDb();
  const from = atStudioTime(`${month}-01`, "00:00");
  const next = new Date(from); next.setUTCMonth(next.getUTCMonth() + 1);
  const rows = await db.select({ startsAt: lessons.startsAt }).from(lessons)
    .where(and(eq(lessons.trainerId, trainerId), eq(lessons.status, "published"), gte(lessons.startsAt, from), lt(lessons.startsAt, next)));
  return new Set(rows.map((row) => dayKey(row.startsAt)));
}

export async function listNotifications(userId: string, limit = 40) {
  const db = await getDb();
  return db.select({ id: notifications.id, kind: notifications.kind, title: notifications.title, body: notifications.body, href: notifications.href, readAt: notifications.readAt, createdAt: notifications.createdAt })
    .from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function unreadCount(userId: string) {
  const db = await getDb();
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(notifications).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.count ?? 0;
}

export async function listOutbox(limit = 50) {
  const db = await getDb();
  return db.select().from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(limit);
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
