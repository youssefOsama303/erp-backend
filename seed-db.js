require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./config/db");

async function runSeed() {
  try {
    console.log("⏳ Checking database schema...");

    // 1. Create users table if missing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Check if any admin exists
    const { rows } = await pool.query("SELECT id FROM users WHERE role = 'admin' OR email = 'admin@nuxes-store.com' LIMIT 1");

    // 3. Insert default admin if missing
    if (rows.length === 0) {
      console.log("⚠️ No admin user found. Creating default admin...");
      const hash = await bcrypt.hash("password123", 10);
      await pool.query(
        "INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5)",
        ["Admin User", "admin@erp.com", hash, "admin", true]
      );
      console.log("✅ Default admin created successfully: admin@erp.com / password123");
    } else {
      console.log("✅ Admin user already exists. Skipping seed.");
    }
  } catch (err) {
    console.error("❌ Seeding error:", err.message);
    process.exit(1);
  } finally {
    // Release pool connection so the script can exit
    await pool.end();
  }
}

runSeed();
