import { defineConfig } from "drizzle-kit";

// `npm run db:generate` only reads the schema; applying migrations happens in the app (local PGlite)
// or with `npm run db:migrate` against DATABASE_URL (production Postgres, e.g. Supabase).
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
