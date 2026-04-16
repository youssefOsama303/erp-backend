const { pool } = require('./config/db');
const { v4: uuidv4 } = require('uuid');

async function seedSAP() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Get a valid tenant_id
        const tenantRes = await client.query('SELECT id FROM tenants LIMIT 1');
        const tenantId = tenantRes.rows[0]?.id;
        if (!tenantId) throw new Error('No tenant found. Run main seeds first.');

        // 2. Clear existing v3 data (optional for test)
        await client.query('DELETE FROM storage_bins WHERE tenant_id = $1', [tenantId]);
        await client.query('DELETE FROM grc_risks WHERE tenant_id = $1', [tenantId]);

        // 3. Seed Storage Types & Bins
        const stRes = await client.query(
            'INSERT INTO storage_types (code, name_ar, name_en, tenant_id) VALUES ($1, $2, $3, $4) RETURNING id',
            ['HR-01', 'أرفف عالية', 'High Racks', tenantId]
        );
        const stId = stRes.rows[0].id;

        for (let i = 1; i <= 5; i++) {
            await client.query(
                'INSERT INTO storage_bins (code, storage_type_id, aisle, section, bin_level, status, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [`A-01-0${i}`, stId, '01', `0${i}`, '1', 'فارغ', tenantId]
            );
        }

        // 4. Seed GRC Risks
        const userRes = await client.query('SELECT id FROM users WHERE email = $1', ['admin@nexus.com']);
        const userId = userRes.rows[0]?.id;

        const risks = [
            ['R-1001', 'مالي', 4, 5, 'خطة سيولة طارئة'],
            ['R-1002', 'تقني', 3, 5, 'خطة تعافي من الكوارث'],
            ['R-1003', 'تشغيلي', 2, 4, 'تأمين سلاسل التوريد']
        ];

        for (const [code, cat, lik, imp, plan] of risks) {
            await client.query(
                `INSERT INTO grc_risks (code, category, likelihood, impact, mitigation_plan, owner_id, tenant_id) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [code, cat, lik, imp, plan, userId, tenantId]
            );
        }

        await client.query('COMMIT');
        console.log('✅ SAP v3.0 Seeds applied successfully!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Seeding failed:', e.message);
    } finally {
        client.release();
    }
}

seedSAP().then(() => process.exit());
