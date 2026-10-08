import { timingSafeEqual } from "node:crypto";
import { cleanUp, sendTomorrowReminders } from "@/lib/jobs";

// Daily job (Vercel Cron, see vercel.json): tomorrow's reminders + database clean-up.
// Vercel calls it with "Authorization: Bearer <CRON_SECRET>"; nobody else can trigger it.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const allowed = secret ? given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected)) : process.env.NODE_ENV === "development";
  if (!allowed) return new Response("Yetkisiz", { status: 401 });

  const reminders = await sendTomorrowReminders();
  const removed = await cleanUp();
  return Response.json({ ok: true, reminders, removed });
}
