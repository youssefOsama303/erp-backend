require('dotenv').config();
const { Pool } = require('pg');
const bcrypt    = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  console.log('\n🌱 Nexus ERP — Starting full demo seed...\n');

  try {
    await client.query('BEGIN');

    // ── Tenant ──────────────────────────────────────────────────────────────
    const tenantRes = await client.query(`
      INSERT INTO tenants (name, slug, primary_color, default_language, default_currency, subscription_plan)
      VALUES ('شركة الأهرام للتجارة', 'nexus-demo', '#0f3a5a', 'ar', 'EGP', 'enterprise')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING *
    `);
    const tenant = tenantRes.rows[0];
    console.log('✅ Tenant:', tenant.slug, '—', tenant.name);

    // Tenant settings
    await client.query(`
      INSERT INTO tenant_settings (tenant_id, company_name_ar, company_name_en, currency, tax_percent)
      VALUES ($1, 'شركة الأهرام للتجارة', 'Al-Ahram Trading Co.', 'EGP', 14)
      ON CONFLICT (tenant_id) DO NOTHING
    `, [tenant.id]);

    // ── Users ────────────────────────────────────────────────────────────────
    const USERS = [
      { email:'superadmin@nexus.com', pass:'super123',  role:'superadmin',         fname:'Super',   lname:'Admin'         },
      { email:'admin@nexus.com',      pass:'admin123',  role:'admin',              fname:'Youssef', lname:'Osama Badawy'  },
      { email:'accountant@nexus.com', pass:'acc123',    role:'accountant',         fname:'محمد',    lname:'علي'           },
      { email:'hr@nexus.com',         pass:'hr1234',    role:'hr',                 fname:'سارة',    lname:'أحمد'          },
      { email:'inventory@nexus.com',  pass:'inv123',    role:'inventory_manager',  fname:'خالد',    lname:'عمر'           },
      { email:'sales@nexus.com',      pass:'sales123',  role:'sales_manager',      fname:'فاطمة',   lname:'حسن'           },
      { email:'purchase@nexus.com',   pass:'pur123',    role:'purchasing_manager', fname:'عمر',     lname:'يوسف'          },
      { email:'employee@nexus.com',   pass:'emp123',    role:'employee',           fname:'مريم',    lname:'علي'           },
      { email:'viewer@nexus.com',     pass:'view123',   role:'viewer',             fname:'مشاهد',   lname:'فقط'           },
    ];

    for (const u of USERS) {
      const hash = await bcrypt.hash(u.pass, 10);
      await client.query(`
        INSERT INTO users (tenant_id, email, password, role, name)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (tenant_id, email) DO UPDATE SET password=EXCLUDED.password, role=EXCLUDED.role
      `, [tenant.id, u.email, hash, u.role, `${u.fname} ${u.lname}`.trim()]);
    }
    console.log(`✅ ${USERS.length} users created`);

    // ── Customers ────────────────────────────────────────────────────────────
    const CUSTOMERS = [
      { name:'مصنع النيل للمنسوجات',  email:'nile.textiles@example.com',  phone:'01001234567', city:'Cairo'    },
      { name:'شركة الخليج للاستيراد', email:'gulf.import@example.com',    phone:'01112345678', city:'Alexandria'},
      { name:'مجموعة القاهرة التجارية',email:'cairo.group@example.com',   phone:'01223456789', city:'Giza'     },
      { name:'مؤسسة الشرق للمقاولات', email:'alsharq.cont@example.com',  phone:'01334567890', city:'Suez'     },
      { name:'شركة سيناء للصناعات',   email:'sinai.ind@example.com',      phone:'01445678901', city:'Ismailia' },
      { name:'Delta Tech Solutions',   email:'delta.tech@example.com',     phone:'01556789012', city:'Cairo'    },
      { name:'شركة الوادي للخدمات',   email:'wadi.services@example.com',  phone:'01667890123', city:'Luxor'    },
      { name:'مصنع الإسكندرية للورق', email:'alex.paper@example.com',     phone:'01778901234', city:'Alexandria'},
      { name:'رابطة تجار الجملة',     email:'wholesale.union@example.com',phone:'01889012345', city:'Cairo'    },
      { name:'شركة الكنانة للنقل',    email:'kanana.trans@example.com',   phone:'01990123456', city:'Aswan'    },
    ];

    for (const c of CUSTOMERS) {
      await client.query(`
        INSERT INTO customers (tenant_id, name, email, phone, city)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT DO NOTHING
      `, [tenant.id, c.name, c.email, c.phone, c.city]).catch(() => {});
    }
    console.log(`✅ ${CUSTOMERS.length} customers created`);

    // ── Suppliers ────────────────────────────────────────────────────────────
    const SUPPLIERS = [
      { name:'Al-Amal Paper Co.',      contact:'Hassan Ali',    email:'supply@alamal.com',    specialty:'Office Supplies' },
      { name:'Tech Systems Ltd',       contact:'Ahmed Karim',   email:'orders@techsys.com',   specialty:'IT Hardware'     },
      { name:'Al-Nahda Industrial',    contact:'Mohamed Saed',  email:'sales@alnahda.com',    specialty:'Steel & Metal'   },
      { name:'Cairo Electric Co.',     contact:'Sara Mostafa',  email:'info@cairoelec.com',   specialty:'Electrical'      },
      { name:'Delta Chemicals',        contact:'Khaled Omar',   email:'supply@deltachem.com', specialty:'Chemicals & Raw' },
    ];

    for (const s of SUPPLIERS) {
      await client.query(`
        INSERT INTO suppliers (tenant_id, name, contact_person, email, specialty)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT DO NOTHING
      `, [tenant.id, s.name, s.contact, s.email, s.specialty]).catch(() => {});
    }
    console.log(`✅ ${SUPPLIERS.length} suppliers created`);

    // ── Products ─────────────────────────────────────────────────────────────
    const PRODUCTS = [
      { code:'PRD-001', name:'A4 Paper Ream (500 sheets)',    category:'Stationery',   qty:850,  price:45,     cost:32   },
      { code:'PRD-002', name:'Office Chair Executive',        category:'Furniture',    qty:24,   price:2800,   cost:1800 },
      { code:'PRD-003', name:'Dell Latitude Laptop 14"',      category:'Electronics',  qty:12,   price:18500,  cost:14000},
      { code:'PRD-004', name:'Printer HP LaserJet Pro',       category:'Electronics',  qty:8,    price:4200,   cost:3000 },
      { code:'PRD-005', name:'Steel Pipe 2"×6m',             category:'Raw Material', qty:320,  price:185,    cost:130  },
      { code:'PRD-006', name:'Electrical Cable 2.5mm² (100m)',category:'Electrical',   qty:55,   price:420,    cost:280  },
      { code:'PRD-007', name:'Cement Bag 50kg',               category:'Raw Material', qty:1200, price:65,     cost:48   },
      { code:'PRD-008', name:'Server Dell PowerEdge R640',    category:'Electronics',  qty:3,    price:85000,  cost:62000},
      { code:'PRD-009', name:'Safety Helmet (Pack of 10)',    category:'Safety',       qty:45,   price:380,    cost:220  },
      { code:'PRD-010', name:'Hydraulic Pump 5HP',            category:'Machinery',    qty:7,    price:12500,  cost:9000 },
      { code:'PRD-011', name:'Copier Paper A3 (500 sheets)',  category:'Stationery',   qty:400,  price:75,     cost:55   },
      { code:'PRD-012', name:'Network Switch 24-Port',        category:'Electronics',  qty:6,    price:3200,   cost:2200 },
      { code:'PRD-013', name:'Industrial Fan 18"',            category:'Equipment',    qty:18,   price:850,    cost:600  },
      { code:'PRD-014', name:'PVC Pipe 3"×4m',               category:'Raw Material', qty:520,  price:55,     cost:38   },
      { code:'PRD-015', name:'Paint 20L White',               category:'Chemicals',    qty:95,   price:380,    cost:250  },
      { code:'PRD-016', name:'Desk Telephone IP',             category:'Electronics',  qty:30,   price:750,    cost:500  },
      { code:'PRD-017', name:'Generator 15KVA',              category:'Equipment',    qty:2,    price:65000,  cost:47000},
      { code:'PRD-018', name:'Filing Cabinet 4-Drawer',       category:'Furniture',    qty:14,   price:1800,   cost:1200 },
      { code:'PRD-019', name:'UPS 1500VA',                    category:'Electronics',  qty:22,   price:2100,   cost:1500 },
      { code:'PRD-020', name:'Hand Pallet Truck 2T',          category:'Machinery',    qty:5,    price:4500,   cost:3200 },
    ];

    for (const p of PRODUCTS) {
      await client.query(`
        INSERT INTO products (tenant_id, code, name, category, quantity, price, cost_price)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT DO NOTHING
      `, [tenant.id, p.code, p.name, p.category, p.qty, p.price, p.cost]).catch(() => {});
    }
    console.log(`✅ ${PRODUCTS.length} products created`);

    // ── Sales Orders ─────────────────────────────────────────────────────────
    const ORDERS = [
      { num:'ORD-2026-001', status:'completed', total:84500,  date:'2026-04-09' },
      { num:'ORD-2026-002', status:'shipped',   total:32000,  date:'2026-04-10' },
      { num:'ORD-2026-003', status:'pending',   total:125000, date:'2026-04-12' },
      { num:'ORD-2026-004', status:'completed', total:18750,  date:'2026-04-08' },
      { num:'ORD-2026-005', status:'pending',   total:56200,  date:'2026-04-13' },
    ];

    for (const o of ORDERS) {
      await client.query(`
        INSERT INTO sales_orders (tenant_id, order_number, status, total_amount, order_date)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT DO NOTHING
      `, [tenant.id, o.num, o.status, o.total, o.date]).catch(() => {});
    }
    console.log(`✅ ${ORDERS.length} sales orders created`);

    await client.query('COMMIT');

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log('\n🎉 Demo seed completed!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Company: شركة الأهرام للتجارة (nexus-demo)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    USERS.forEach(u => console.log(`  ${u.role.padEnd(22)} ${u.email} / ${u.pass}`));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
