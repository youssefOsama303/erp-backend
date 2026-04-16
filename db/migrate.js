/**
 * db/migrate.js — Run all database migrations against Neon
 *
 * Uses DIRECT_URL (not DATABASE_URL) for migrations because:
 *   - PgBouncer (the pooler) does not support `CREATE EXTENSION`,
 *     multi-statement DDL, or session-level commands needed by schema.sql
 *   - Direct connections handle DDL safely without pooling interference
 *
 * Usage:
 *   npm run db:migrate
 */

require("dotenv").config();
const { Client } = require("pg");
const fs   = require("fs");
const path = require("path");

// ── Pick the right connection URL ────────────────────────────
// Always prefer DIRECT_URL for migrations; fall back to DATABASE_URL
// (which may be a pooler) only if DIRECT_URL is absent.
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ No database URL found. Set DIRECT_URL or DATABASE_URL in .env");
  process.exit(1);
}

const isPgBouncer = connectionString.includes("-pooler.");
if (isPgBouncer) {
  console.warn(
    "⚠️  WARNING: You appear to be using a pooler (PgBouncer) endpoint for migrations.\n" +
    "   DDL statements may fail. Set DIRECT_URL to your direct Neon endpoint instead."
  );
}

// ── Migration files to run, in order ─────────────────────────
const MIGRATIONS = [
  { file: "schema.sql",           label: "Base schema (all tables)" },
  { file: "migration-sprint2.sql", label: "Sprint 2 (shipping & payments)" },
  { file: "migration-phase2-activity.sql", label: "Phase 2 (activity log & notifications)" },
  { file: "migration-phase2-activity-notifications.sql", label: "Phase 2 (per-user notifications fanout)" },
  { file: "migration-sap-v3.sql",   label: "SAP v3.0 Expansion (Warehouse, GRC, PP, BTP)" },
  { file: "migration-ewm-v3-2.sql", label: "EWM v3.2 (3D bins, materials, stock, tasks)" },
];

async function migrate() {
  const client = new Client({
    connectionString,
  });

  try {
    console.log("\n📡 Connecting to PostgreSQL...");
    await client.connect();
    console.log("✅ Connected.\n");

    for (const { file, label } of MIGRATIONS) {
      const filePath = path.join(__dirname, file);

      if (!fs.existsSync(filePath)) {
        console.warn(`⏭  Skipping '${file}' — file not found.`);
        continue;
      }

      const sql = fs.readFileSync(filePath, "utf8");
      console.log(`🔄 Running: ${file}  (${label})`);

      try {
        await client.query(sql);
        console.log(`✅ Done:    ${file}\n`);
      } catch (err) {
        // If the statement failed because an object already exists, warn and continue.
        // Otherwise rethrow — something is genuinely wrong.
        if (err.code === "42P07" || err.code === "42710") {
          // 42P07 = duplicate_table, 42710 = duplicate_object
          console.warn(`⚠️  Already exists (skipped): ${err.message}`);
        } else {
          throw err;
        }
      }
    }

    console.log("🎉 All migrations completed successfully!");

  } catch (err) {
    console.error("\n❌ Migration failed:");
    console.error(`   Code:    ${err.code || "N/A"}`);
    console.error(`   Message: ${err.message}`);
    process.exit(1);
  } finally {
    await client.end();
    console.log("🔌 Database connection closed.");
  }
}

migrate();
