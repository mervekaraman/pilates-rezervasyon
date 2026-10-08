-- Existing reviews prove that the member attended; preserve their edit access after introducing attendance.
UPDATE "bookings" b SET "attendance" = 'attended', "attendance_marked_at" = r."created_at"
FROM "reviews" r WHERE r."booking_id" = b."id" AND b."attendance" IS NULL;
