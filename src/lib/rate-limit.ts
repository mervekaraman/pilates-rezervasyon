import "server-only";

import { createHash } from "node:crypto";
import { eq, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { rateLimits } from "@/db/schema";

const privateKey = (key: string) => createHash("sha256").update(key).digest("hex");

/** Database-backed limiter: one bucket is shared by every app/serverless instance. */
export async function hitRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const db = await getDb();
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const [bucket] = await db.insert(rateLimits).values({ key: privateKey(key), count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} <= ${now} then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} <= ${now} then ${resetAt} else ${rateLimits.resetAt} end`,
      },
    }).returning({ count: rateLimits.count });
  return (bucket?.count ?? 1) > limit;
}

export async function clearRateLimit(key: string) {
  await (await getDb()).delete(rateLimits).where(eq(rateLimits.key, privateKey(key)));
}

export async function cleanupRateLimits() {
  await (await getDb()).delete(rateLimits).where(lt(rateLimits.resetAt, new Date()));
}
