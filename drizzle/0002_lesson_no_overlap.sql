ALTER TABLE "lessons" ADD COLUMN "ends_at" timestamp with time zone;--> statement-breakpoint
UPDATE "lessons" SET "ends_at" = "starts_at" + make_interval(mins => "duration_min");--> statement-breakpoint
ALTER TABLE "lessons" ALTER COLUMN "ends_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_ends_after_start" CHECK ("lessons"."ends_at" > "lessons"."starts_at");--> statement-breakpoint
-- One studio room: the database refuses two published classes whose time ranges overlap, even when
-- two trainers save at the same moment. Cancelled classes free their slot.
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_no_overlap" EXCLUDE USING gist (tstzrange("starts_at", "ends_at") WITH &&) WHERE ("status" = 'published');
