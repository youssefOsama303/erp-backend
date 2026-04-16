const { Pool } = require("pg");
require("dotenv").config();

// ── DATABASE CONNECTION ───────────────────────────────────────
// Priority: DATABASE_URL (Neon / any PostgreSQL URL) → individual DB_* vars (local dev)
//
// Neon is a serverless PostgreSQL provider. To avoid exhausting Neon's
// connection limit, the pool is tuned with:
//   - max: 3        — keep concurrent connections low
//   - idleTimeoutMillis: 10_000   — release idle clients fast (serverless functions are short-lived)
//   - connectionTimeoutMillis: 5_000 — fail fast if DB is unreachable
//   - allowExitOnIdle: true — let Node.js exit cleanly when pool is idle (important for scripts)
//
// For even higher scalability on Neon, use the Neon Pooler endpoint
// (ends in `-pooler.neon.tech`) which uses PgBouncer under the hood.

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_MAX || "10"),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || "5000"),
      allowExitOnIdle: true,
    }
  : {
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "erp_local",
      password: process.env.DB_PASSWORD || "password",
      port: parseInt(process.env.DB_PORT || "5432"),
      max: parseInt(process.env.DB_POOL_MAX || "10"),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || "5000"),
      allowExitOnIdle: true,
    };

const pool = new Pool(poolConfig);

pool.on("connect", () => {
  const target = process.env.DATABASE_URL
    ? "[DATABASE_URL]"
    : `[${process.env.DB_HOST || "localhost"}/${process.env.DB_NAME || "erp_local"}]`;
  console.log(`✅ DB connected ${target}`);
});

pool.on("error", (err) => {
  console.error("❌ Unexpected DB pool error:", err.message);
  // Do NOT call process.exit() here — let the request fail gracefully instead
});

module.exports = pool;