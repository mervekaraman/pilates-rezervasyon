import "server-only";
import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { rateLimits } from "@/db/schema";

// Login and reset attempts are counted in the database, so the limit holds across every server
// instance (Vercel runs many). Keys contain e-mail addresses, so only their hash is stored.
const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");

/** Counts one attempt; true when the caller is over `limit` within the current window. */
export async function hitRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const db = await getDb();
  const resetAt = new Date(Date.now() + windowMs);
  // One atomic upsert: concurrent attempts can neither reset nor skip the counter.
  const [row] = await db.insert(rateLimits).values({ key: hashKey(key), count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} < now() then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} < now() then ${resetAt.toISOString()}::timestamptz else ${rateLimits.resetAt} end`,
      },
    })
    .returning({ count: rateLimits.count });
  return (row?.count ?? 0) > limit;
}

export async function clearRateLimit(key: string) {
  await (await getDb()).delete(rateLimits).where(eq(rateLimits.key, hashKey(key)));
}
