import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { readSessionUser, type SessionUser } from "@/lib/auth/session";

/** The signed-in user for this request (memoised per render), or null. */
export const getCurrentUser = cache(readSessionUser);

export function homeFor(user: Pick<SessionUser, "role">) {
  return user.role === "trainer" ? "/egitmen-paneli" : "/dersler";
}

/**
 * Secure check used by every protected page and Server Action.
 * Guests go to the login page (and come back afterwards); the wrong role goes to its own home.
 */
export async function requireUser(options: { role?: SessionUser["role"]; next?: string } = {}): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(options.next ? `/giris?sonra=${encodeURIComponent(options.next)}` : "/giris");
  if (options.role && user.role !== options.role) redirect(homeFor(user));
  return user;
}

export { safeNext } from "@/lib/privacy";
