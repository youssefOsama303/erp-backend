require("dotenv").config();
const { Pool } = require("pg");

async function run() {
  const cs = process.env.DATABASE_URL;
  if (!cs) {
    console.error("Missing DATABASE_URL in .env");
    process.exit(1);
  }

  // Connect to the server default database (postgres) for DB existence checks.
  // Example: postgresql://user:pass@localhost:5432/erp_local -> .../postgres
  const csPostgres = cs.replace(/\/[^/]+$/, "/postgres");

  const pool = new Pool({
    connectionString: csPostgres,
    ssl: false,
  });

  try {
    await pool.query("SELECT 1");
    const { rows } = await pool.query(
      "SELECT datname FROM pg_database WHERE datname = $1",
      ["erp_db"]
    );

    if (rows.length === 0) {
      await pool.query("CREATE DATABASE erp_db");
      console.log("✅ erp_db was missing and is now created.");
    } else {
      console.log("✅ erp_db already exists.");
    }
  } finally {
    await pool.end();
  }
}

run().catch((e) => {
  console.error("❌ check-erp-db failed:", e.message);
  process.exit(1);
});

