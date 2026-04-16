/**
 * update-admin.js — Update primary admin display name to Youssef Osama Badawy
 * Uses the correct `name` column (schema.sql users table has single `name` field)
 * Usage: node update-admin.js
 */
require('dotenv').config();
const { Client } = require('pg');

async function main() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    try {
        // Check current admin
        const check = await client.query(
            `SELECT id, email, name, role FROM users WHERE role IN ('admin','superadmin') ORDER BY created_at ASC LIMIT 5`
        );
        console.log('\n📋 Current admin accounts:');
        check.rows.forEach(u => console.log(`  [${u.role}] ${u.email} — "${u.name}"`));

        if (check.rowCount === 0) {
            console.error('❌ No admin found. Run seed first: node seed-db.js');
            return;
        }

        // Update the first admin (admin@nexus.com preferred)
        const target = check.rows.find(u => u.email === 'admin@nexus.com') || check.rows[0];
        
        await client.query(
            `UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2`,
            ['Youssef Osama Badawy', target.id]
        );
        console.log(`\n✅ Updated: ${target.email} → name = "Youssef Osama Badawy"`);
        console.log('   Login with: admin@nexus.com / admin123');

    } finally {
        await client.end();
    }
}

main().catch(err => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
});
