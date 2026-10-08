import { and, isNotNull, lt, or } from "drizzle-orm";
import { getDb } from "../src/db";
import { passwordResetTokens, rateLimits, sessions } from "../src/db/schema";

async function main() {
  const db = await getDb();
  const now = new Date();
  const usedBefore = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  await db.delete(sessions).where(lt(sessions.expiresAt, now));
  await db.delete(passwordResetTokens).where(or(lt(passwordResetTokens.expiresAt, now), and(isNotNull(passwordResetTokens.usedAt), lt(passwordResetTokens.usedAt, usedBefore))));
  await db.delete(rateLimits).where(lt(rateLimits.resetAt, now));
  console.log("Süresi dolan oturum, parola bağlantısı ve hız sınırı kayıtları temizlendi.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
