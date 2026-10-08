CREATE TYPE "public"."attendance_status" AS ENUM('attended', 'no_show');--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" smallint DEFAULT 1 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "attendance" "attendance_status";--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "attendance_marked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD COLUMN "retryable" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD COLUMN "attempts" smallint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "rate_limits_reset_idx" ON "rate_limits" USING btree ("reset_at");
