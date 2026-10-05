// Applies ./drizzle migrations to the Postgres database in DATABASE_URL (production / staging).
// Local development needs no command: the embedded database migrates itself on first use.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tanımlı değil. Yerel veritabanı ilk açılışta kendini otomatik kurar.");
  process.exit(1);
}
const pool = new Pool({ connectionString: url, max: 1 });
migrate(drizzle(pool), { migrationsFolder: "drizzle" })
  .then(() => console.log("Migration tamamlandı."))
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => pool.end());
