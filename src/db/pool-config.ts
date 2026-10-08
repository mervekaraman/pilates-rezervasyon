import type { PoolConfig } from "pg";

// Connection settings for a hosted Postgres (Supabase etc.). Traffic to a remote database is
// always encrypted; local databases (CI, docker) connect without TLS. Serverless functions keep
// few connections each because the provider's pooler multiplexes them.
let warned = false;

/**
 * With DATABASE_CA_CERT (Supabase › Database › SSL Configuration › Download certificate, pasted as
 * PEM) the server certificate is verified, so nobody in between can pose as the database. Without
 * it the connection is still encrypted but unverified, and a warning is logged once.
 */
function tlsOptions() {
  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n").trim();
  if (ca) return { ca, rejectUnauthorized: true };
  if (!warned) {
    warned = true;
    console.warn("[veritabanı] DATABASE_CA_CERT tanımlı değil: bağlantı şifreli ama sunucu sertifikası doğrulanmıyor.");
  }
  return { rejectUnauthorized: false };
}

export function poolConfig(connectionString: string, max = 3): PoolConfig {
  const host = (() => {
    try {
      return new URL(connectionString).hostname;
    } catch {
      return "";
    }
  })();
  const local = ["localhost", "127.0.0.1", "::1", ""].includes(host) || process.env.DATABASE_SSL === "disable";
  const url = new URL(connectionString);
  // pg treats `sslmode=require` as full CA verification; the `ssl` option below decides instead.
  url.searchParams.delete("sslmode");
  return {
    connectionString: url.toString(),
    max,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: local ? undefined : tlsOptions(),
  };
}
