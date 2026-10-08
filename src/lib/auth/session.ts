import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "smeda_session";
const SESSION_DAYS = 30;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");

export type SessionUser = { id: string; name: string; email: string; phone: string | null; role: "member" | "trainer"; avatarUrl: string | null; emailNotifications: boolean };

export async function createSession(userId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const db = await getDb();
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
}

export async function readSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const [row] = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, role: users.role, avatarUrl: users.avatarUrl, emailNotifications: users.emailNotifications })
    .from(sessions).innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

/** Hash of the current session token (the sessions.id), if signed in. */
export async function currentSessionId() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? hashToken(token) : null;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await (await getDb()).delete(sessions).where(eq(sessions.id, hashToken(token)));
  cookieStore.delete(SESSION_COOKIE);
}

/** Signs a user out everywhere, e.g. after a password reset. */
export async function deleteUserSessions(userId: string) {
  await (await getDb()).delete(sessions).where(eq(sessions.userId, userId));
}
