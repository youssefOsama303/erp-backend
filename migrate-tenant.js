require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  console.log('🔄 Starting Multi-Tenant Migration...');

  try {
    await client.query('BEGIN');

    // 1. Create Tenants Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        primary_color VARCHAR(20) DEFAULT '#4F46E5',
        default_language VARCHAR(5) DEFAULT 'ar',
        default_currency VARCHAR(5) DEFAULT 'EGP',
        subscription_plan VARCHAR(50) DEFAULT 'enterprise',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created tenants table');

    // 2. Create Tenant Settings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_settings (
        tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
        company_name_ar VARCHAR(255),
        company_name_en VARCHAR(255),
        currency VARCHAR(5) DEFAULT 'EGP',
        tax_percent DECIMAL(5,2) DEFAULT 14,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created tenant_settings table');

    // 3. Add tenant_id to existing tables safely
    const tables = ['users', 'products', 'sales_orders', 'customers', 'invoices', 'warehouses', 'stock_levels', 'stock_movements'];
    
    // We need a default tenant to attach to existing rows, otherwise NOT NULL constraints will fail.
    const defaultTenantRes = await client.query(`
      INSERT INTO tenants (name, slug) 
      VALUES ('Default Tenant', 'nexus-demo') 
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id;
    `);
    const defaultTenantId = defaultTenantRes.rows[0].id;
    
    for (const table of tables) {
      // Check if table exists
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);

      if (tableExists.rows[0].exists) {
        // Add column if it doesn't exist
        const colExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = $1 AND column_name = 'tenant_id'
          );
        `, [table]);
        
        if (!colExists.rows[0].exists) {
          console.log(`Adding tenant_id to ${table}...`);
          await client.query(`ALTER TABLE ${table} ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;`);
          // Set default for existing
          await client.query(`UPDATE ${table} SET tenant_id = $1 WHERE tenant_id IS NULL;`, [defaultTenantId]);
          // Alter table to NOT NULL
          await client.query(`ALTER TABLE ${table} ALTER COLUMN tenant_id SET NOT NULL;`);
          console.log(`✅ Altered table ${table}`);
        }
      }
    }
    
    // 4. Update unique constraints to include tenant_id
    // For users table
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
          ALTER TABLE users DROP CONSTRAINT users_email_key;
        END IF;
      END $$;
    `);
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_tenant_id_email_key') THEN
          ALTER TABLE users ADD CONSTRAINT users_tenant_id_email_key UNIQUE (tenant_id, email);
        END IF;
      END $$;
    `);

    await client.query('COMMIT');
    console.log('🎉 Migration successful!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
