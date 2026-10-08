import "server-only";
import { headers } from "next/headers";

/** The visitor's IP for rate limiting (Vercel sets x-forwarded-for; locally it may be missing). */
export async function clientIp() {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "yerel";
}
