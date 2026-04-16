require("dotenv").config();
const bcrypt = require("bcryptjs");
const { Client } = require("pg");

async function main() {
  const newPassword = "123456";
  const targetEmail = (process.argv[2] || "admin@erp.com").trim().toLowerCase();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL is missing in .env");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const hash = await bcrypt.hash(newPassword, 10);

    // 1) Try exact email (what you asked for)
    let res = await client.query(
      `UPDATE users
       SET password = $1, updated_at = NOW()
       WHERE LOWER(email) = $2
       RETURNING id, email, role`,
      [hash, targetEmail]
    );

    // 2) Common seed email fallback
    if (res.rowCount === 0) {
      res = await client.query(
        `UPDATE users
         SET password = $1, updated_at = NOW()
         WHERE LOWER(email) = 'admin@erp.sa'
         RETURNING id, email, role`,
        [hash]
      );
    }

    // 3) Fallback: first admin role
    if (res.rowCount === 0) {
      res = await client.query(
        `UPDATE users
         SET password = $1, updated_at = NOW()
         WHERE id = (
           SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1
         )
         RETURNING id, email, role`,
        [hash]
      );
    }

    if (res.rowCount === 0) {
      console.error("❌ No admin user found to reset.");
      process.exit(1);
    }

    const user = res.rows[0];
    console.log("✅ Admin password reset successful:");
    console.log(`- email: ${user.email}`);
    console.log(`- role:  ${user.role}`);
    console.log(`- new password: ${newPassword}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌ reset-admin.js failed:", err.message);
  process.exit(1);
});

