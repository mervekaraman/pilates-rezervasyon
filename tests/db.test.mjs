import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

// Runs the real migrations on an in-memory Postgres and checks the rules the database must enforce.
async function migratedDb() {
  const db = new PGlite();
  const dir = new URL("../drizzle/", import.meta.url);
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".sql")).sort()) {
    for (const statement of readFileSync(new URL(file, dir), "utf8").split("--> statement-breakpoint")) {
      if (statement.trim()) await db.exec(statement);
    }
  }
  const { rows: [trainer] } = await db.query(`insert into users (name, email, password_hash, role) values ('Eğitmen', 'e@test', 'x', 'trainer') returning id`);
  return { db, trainerId: trainer.id };
}

const addLesson = (db, trainerId, start, end, status = "published") => db.query(
  `insert into lessons (trainer_id, starts_at, ends_at, duration_min, capacity, status) values ($1, $2, $3, 50, 4, $4)`,
  [trainerId, start, end, status],
);

test("aynı anda kaydedilen iki ders stüdyoda çakışamaz; veritabanı birini reddeder", async () => {
  const { db, trainerId } = await migratedDb();
  const results = await Promise.allSettled([
    addLesson(db, trainerId, "2026-10-07T10:00:00+03:00", "2026-10-07T10:50:00+03:00"),
    addLesson(db, trainerId, "2026-10-07T10:00:00+03:00", "2026-10-07T10:50:00+03:00"),
    addLesson(db, trainerId, "2026-10-07T10:30:00+03:00", "2026-10-07T11:20:00+03:00"),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  for (const result of results.filter((item) => item.status === "rejected")) assert.equal(result.reason.code, "23P01");
  await db.close();
});

test("arka arkaya dersler ve iptal edilen dersin saati serbesttir", async () => {
  const { db, trainerId } = await migratedDb();
  await addLesson(db, trainerId, "2026-10-07T10:00:00+03:00", "2026-10-07T10:50:00+03:00", "cancelled");
  await addLesson(db, trainerId, "2026-10-07T10:00:00+03:00", "2026-10-07T10:50:00+03:00");
  await addLesson(db, trainerId, "2026-10-07T11:00:00+03:00", "2026-10-07T11:50:00+03:00");
  await assert.rejects(addLesson(db, trainerId, "2026-10-07T12:00:00+03:00", "2026-10-07T11:00:00+03:00"), { code: "23514" }, "bitiş başlangıçtan önce olamaz");
  await db.close();
});

test("katılım durumu rezervasyon kararından ayrı ve yalnızca tanımlı değerlerdedir", async () => {
  const { db, trainerId } = await migratedDb();
  const { rows: [member] } = await db.query(`insert into users (name, email, password_hash) values ('Üye', 'u@test', 'x') returning id`);
  const { rows: [lesson] } = await db.query(`insert into lessons (trainer_id, starts_at, ends_at, duration_min, capacity) values ($1, '2026-10-01T10:00:00+03:00', '2026-10-01T10:50:00+03:00', 50, 4) returning id`, [trainerId]);
  const { rows: [booking] } = await db.query(`insert into bookings (lesson_id, member_id, status, attendance) values ($1, $2, 'approved', 'attended') returning status, attendance`, [lesson.id, member.id]);
  assert.deepEqual(booking, { status: "approved", attendance: "attended" });
  await assert.rejects(db.query(`update bookings set attendance = 'unknown' where lesson_id = $1`, [lesson.id]), { code: "22P02" });
  await db.close();
});
