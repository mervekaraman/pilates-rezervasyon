CREATE TYPE "public"."attendance" AS ENUM('attended', 'no_show');--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "attendance" "attendance";--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "effort" smallint;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "effort_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_effort_range" CHECK ("bookings"."effort" between 1 and 10);