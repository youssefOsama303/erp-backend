/**
 * seeds/seed_ewm_synthetic.js
 * EWM Synthetic Data Seed — Dubai DC + Cairo Cold Store
 *
 * Usage:
 *   node seeds/seed_ewm_synthetic.js
 *   or via API: POST /api/ewm/seed-demo (superadmin only)
 *
 * Guard: only runs if EWM_SEED=true in .env OR called from API with force flag
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Client } = require('pg');

// ─── Synthetic data ────────────────────────────────────────────────────────
const SEED_DATA = {
  warehouses: [
    { code: 'DXB-01', name: 'Dubai Main DC',      address: 'Jebel Ali Free Zone, Dubai, UAE',    lat: 25.2048, lon: 55.2708 },
    { code: 'CAI-02', name: 'Cairo Cold Store',    address: 'Industrial Zone, 10th of Ramadan, Egypt', lat: 30.0444, lon: 31.2357 },
    { code: 'RUH-03', name: 'Riyadh Regional Hub', address: 'King Khalid Industrial City, KSA',  lat: 24.7136, lon: 46.6753 }
  ],

  storage_types: [
    { warehouse_code: 'DXB-01', code: 'STD',  name: 'Standard Ambient',  temperature_zone: 'ambient' },
    { warehouse_code: 'DXB-01', code: 'HZM',  name: 'Hazmat Zone',       temperature_zone: 'hazmat'  },
    { warehouse_code: 'CAI-02', code: 'CLD',  name: 'Cold Chain',        temperature_zone: 'chilled' },
    { warehouse_code: 'CAI-02', code: 'FRZ',  name: 'Deep Freeze',       temperature_zone: 'frozen'  },
    { warehouse_code: 'RUH-03', code: 'BLK',  name: 'Bulk Storage',      temperature_zone: 'ambient' }
  ],

  storage_sections: [
    // DXB-01 STD → Aisles A-D
    { type_code: 'STD', code: 'A', name: 'Aisle A — Fast-Moving',  hazard_class: 'none' },
    { type_code: 'STD', code: 'B', name: 'Aisle B — Medium Movers',hazard_class: 'none' },
    { type_code: 'STD', code: 'D', name: 'Aisle D — Oversize',     hazard_class: 'none' },
    // DXB-01 HZM
    { type_code: 'HZM', code: 'H', name: 'Hazmat Bay H',           hazard_class: 'flammable' },
    // CAI-02 CLD
    { type_code: 'CLD', code: 'C', name: 'Chilled Aisle C',        hazard_class: 'none' },
    // CAI-02 FRZ
    { type_code: 'FRZ', code: 'F', name: 'Freeze Chamber F',       hazard_class: 'none' },
    // RUH-03 BLK
    { type_code: 'BLK', code: 'K', name: 'Bulk Row K',             hazard_class: 'none' }
  ],

  bins: [
    // Aisle A — row 01, levels 1-3
    { section_code:'A', bin_code:'A-01-01', x:1, y:1, z:1, rotation_deg:0,   capacity_kg:800  },
    { section_code:'A', bin_code:'A-01-02', x:1, y:1, z:2, rotation_deg:0,   capacity_kg:800  },
    { section_code:'A', bin_code:'A-01-03', x:1, y:1, z:3, rotation_deg:0,   capacity_kg:600  },
    { section_code:'A', bin_code:'A-02-01', x:2, y:1, z:1, rotation_deg:0,   capacity_kg:800  },
    { section_code:'A', bin_code:'A-02-02', x:2, y:1, z:2, rotation_deg:0,   capacity_kg:800  },
    // Aisle B
    { section_code:'B', bin_code:'B-01-01', x:4, y:1, z:1, rotation_deg:0,   capacity_kg:1200 },
    { section_code:'B', bin_code:'B-02-05', x:5, y:2, z:1, rotation_deg:90,  capacity_kg:1200 },
    { section_code:'B', bin_code:'B-03-01', x:6, y:3, z:1, rotation_deg:0,   capacity_kg:1000 },
    // Aisle D — oversize
    { section_code:'D', bin_code:'D-01-01', x:8, y:1, z:1, rotation_deg:0,   capacity_kg:4000 },
    { section_code:'D', bin_code:'D-01-02', x:9, y:1, z:1, rotation_deg:0,   capacity_kg:4000 },
    // Hazmat H
    { section_code:'H', bin_code:'H-01-01', x:12, y:1, z:1, rotation_deg:0,  capacity_kg:500  },
    // Cold C
    { section_code:'C', bin_code:'C-01-01', x:1,  y:1, z:1, rotation_deg:0,  capacity_kg:600  },
    { section_code:'C', bin_code:'C-03-02', x:2,  y:3, z:1, rotation_deg:0,  capacity_kg:600  },
    // Freeze F
    { section_code:'F', bin_code:'F-01-01', x:1,  y:1, z:1, rotation_deg:0,  capacity_kg:400  },
    // Bulk K
    { section_code:'K', bin_code:'K-01-01', x:1,  y:1, z:1, rotation_deg:0,  capacity_kg:8000 },
    { section_code:'K', bin_code:'K-02-01', x:2,  y:1, z:1, rotation_deg:0,  capacity_kg:8000 }
  ],

  materials: [
    { sku:'MAT-PA-01', name:'Polymer Pellets 25kg Bag',    length_cm:40, width_cm:30, height_cm:15, weight_kg:25,  uom:'EA' },
    { sku:'MAT-CH-02', name:'Chilled Juice Crate 12x1L',   length_cm:60, width_cm:40, height_cm:25, weight_kg:15,  uom:'EA' },
    { sku:'MAT-FZ-03', name:'Frozen Fish Box 10kg',        length_cm:55, width_cm:35, height_cm:20, weight_kg:10,  uom:'EA' },
    { sku:'MAT-EL-04', name:'Electronics Module A4',       length_cm:30, width_cm:25, height_cm:8,  weight_kg:2.5, uom:'EA' },
    { sku:'MAT-BK-05', name:'Steel Coil 500kg',            length_cm:120,width_cm:80, height_cm:80, weight_kg:500, uom:'EA' },
    { sku:'MAT-HZ-06', name:'Solvent Drum 200L',           length_cm:60, width_cm:60, height_cm:90, weight_kg:180, uom:'EA' }
  ],

  stock: [
    { bin_code:'A-01-01', sku:'MAT-PA-01', qty:48,  uom:'EA' },
    { bin_code:'A-01-02', sku:'MAT-EL-04', qty:120, uom:'EA' },
    { bin_code:'A-02-01', sku:'MAT-PA-01', qty:0,   uom:'EA' },   // empty → heatmap = 0%
    { bin_code:'B-01-01', sku:'MAT-PA-01', qty:60,  uom:'EA' },
    { bin_code:'B-02-05', sku:'MAT-BK-05', qty:3,   uom:'EA' },   // heavy items
    { bin_code:'D-01-01', sku:'MAT-BK-05', qty:8,   uom:'EA' },
    { bin_code:'H-01-01', sku:'MAT-HZ-06', qty:5,   uom:'EA' },
    { bin_code:'C-01-01', sku:'MAT-CH-02', qty:40,  uom:'EA' },
    { bin_code:'C-03-02', sku:'MAT-CH-02', qty:30,  uom:'EA' },
    { bin_code:'F-01-01', sku:'MAT-FZ-03', qty:20,  uom:'EA' },
    { bin_code:'K-01-01', sku:'MAT-BK-05', qty:15,  uom:'EA' }
  ],

  tasks: [
    { type:'putaway',  status:'open',        bin_to:'A-01-02',  sku:'MAT-PA-01', qty:20,  priority:1, assigned_to:'robot_01',  eta_minutes:8  },
    { type:'picking',  status:'open',        bin_from:'C-03-02',sku:'MAT-CH-02', qty:10,  priority:2, assigned_to:'worker_12', eta_minutes:6  },
    { type:'transfer', status:'open',        bin_from:'A-01-01',bin_to:'B-01-01',sku:'MAT-EL-04', qty:50, priority:3, assigned_to:'worker_08', eta_minutes:15 },
    { type:'putaway',  status:'in_progress', bin_to:'D-01-02',  sku:'MAT-BK-05', qty:2,   priority:1, assigned_to:'forklift_02',eta_minutes:20 },
    { type:'picking',  status:'done',        bin_from:'F-01-01',sku:'MAT-FZ-03', qty:5,   priority:2, assigned_to:'worker_05', eta_minutes:10 },
    { type:'inventory',status:'open',        sku:'MAT-HZ-06',   qty:1,           priority:5, assigned_to:'auditor_01',eta_minutes:30 }
  ]
};

// ─── Main seeder ───────────────────────────────────────────────────────────
async function seedEWM(tenantId, client, ownClient = false) {
  if (!client) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');
    client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    ownClient = true;
  }

  console.log('\n🏗  EWM Synthetic Seed starting...');
  console.log(`   Tenant: ${tenantId}`);

  try {
    // Clear existing demo data (idempotent)
    await client.query('DELETE FROM ewm_tasks    WHERE tenant_id=$1', [tenantId]);
    await client.query('DELETE FROM ewm_stock    WHERE tenant_id=$1', [tenantId]);
    await client.query('DELETE FROM ewm_materials WHERE tenant_id=$1',[tenantId]);
    await client.query('DELETE FROM ewm_bins     WHERE tenant_id=$1', [tenantId]);
    await client.query('DELETE FROM ewm_storage_sections WHERE tenant_id=$1', [tenantId]);
    await client.query('DELETE FROM ewm_storage_types WHERE tenant_id=$1',    [tenantId]);
    await client.query('DELETE FROM ewm_warehouses WHERE tenant_id=$1',       [tenantId]);

    // ── 1. Warehouses ──
    const whMap = {};
    for (const w of SEED_DATA.warehouses) {
      const r = await client.query(
        `INSERT INTO ewm_warehouses (code,name,address,lat,lon,tenant_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [w.code, w.name, w.address, w.lat, w.lon, tenantId]
      );
      whMap[w.code] = r.rows[0].id;
    }
    console.log(`   ✅ ${SEED_DATA.warehouses.length} warehouses`);

    // ── 2. Storage Types ──
    const stMap = {};
    for (const t of SEED_DATA.storage_types) {
      const r = await client.query(
        `INSERT INTO ewm_storage_types (warehouse_id,code,name,temperature_zone,tenant_id) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [whMap[t.warehouse_code], t.code, t.name, t.temperature_zone, tenantId]
      );
      stMap[t.code] = r.rows[0].id;
    }
    console.log(`   ✅ ${SEED_DATA.storage_types.length} storage types`);

    // ── 3. Sections ──
    const secMap = {};
    for (const s of SEED_DATA.storage_sections) {
      const r = await client.query(
        `INSERT INTO ewm_storage_sections (storage_type_id,code,name,hazard_class,tenant_id) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [stMap[s.type_code], s.code, s.name, s.hazard_class, tenantId]
      );
      secMap[s.code] = r.rows[0].id;
    }
    console.log(`   ✅ ${SEED_DATA.storage_sections.length} storage sections`);

    // ── 4. Bins ──
    const binMap = {};
    for (const b of SEED_DATA.bins) {
      const r = await client.query(
        `INSERT INTO ewm_bins (section_id,bin_code,x,y,z,rotation_deg,capacity_kg,tenant_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [secMap[b.section_code], b.bin_code, b.x, b.y, b.z, b.rotation_deg, b.capacity_kg, tenantId]
      );
      binMap[b.bin_code] = r.rows[0].id;
    }
    console.log(`   ✅ ${SEED_DATA.bins.length} bins`);

    // ── 5. Materials ──
    const matMap = {};
    for (const m of SEED_DATA.materials) {
      const r = await client.query(
        `INSERT INTO ewm_materials (sku,name,length_cm,width_cm,height_cm,weight_kg,uom,tenant_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [m.sku, m.name, m.length_cm, m.width_cm, m.height_cm, m.weight_kg, m.uom, tenantId]
      );
      matMap[m.sku] = r.rows[0].id;
    }
    console.log(`   ✅ ${SEED_DATA.materials.length} materials`);

    // ── 6. Stock ──
    for (const s of SEED_DATA.stock) {
      await client.query(
        `INSERT INTO ewm_stock (bin_id,material_id,qty,uom,tenant_id) VALUES ($1,$2,$3,$4,$5)`,
        [binMap[s.bin_code], matMap[s.sku], s.qty, s.uom, tenantId]
      );
    }
    console.log(`   ✅ ${SEED_DATA.stock.length} stock records`);

    // ── 7. Tasks ──
    for (const t of SEED_DATA.tasks) {
      await client.query(
        `INSERT INTO ewm_tasks (task_type,status,bin_from_id,bin_to_id,material_id,qty,priority,assigned_to,eta_minutes,tenant_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          t.type,
          t.status,
          t.bin_from ? binMap[t.bin_from] : null,
          t.bin_to   ? binMap[t.bin_to]   : null,
          t.sku      ? matMap[t.sku]       : null,
          t.qty, t.priority, t.assigned_to, t.eta_minutes, tenantId
        ]
      );
    }
    console.log(`   ✅ ${SEED_DATA.tasks.length} tasks`);

    console.log('\n🎉 EWM Seed completed successfully!\n');
    return { success: true, counts: {
      warehouses: SEED_DATA.warehouses.length,
      bins: SEED_DATA.bins.length,
      materials: SEED_DATA.materials.length,
      tasks: SEED_DATA.tasks.length
    }};

  } finally {
    if (ownClient) await client.end();
  }
}

// ─── CLI entry point ───────────────────────────────────────────────────────
if (require.main === module) {
  const EWM_SEED = process.env.EWM_SEED === 'true';
  if (!EWM_SEED) {
    console.error('❌ Set EWM_SEED=true in .env to run this seed');
    console.error('   e.g.: EWM_SEED=true node seeds/seed_ewm_synthetic.js');
    process.exit(1);
  }

  // Default: use first tenant in DB
  const { Client } = require('pg');
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  c.connect()
    .then(() => c.query('SELECT id FROM tenants LIMIT 1'))
    .then(r => {
      if (!r.rows[0]) throw new Error('No tenant found — run seed.js first');
      return seedEWM(r.rows[0].id, c);
    })
    .then(() => c.end())
    .catch(err => { console.error('❌', err.message); process.exit(1); });
}

module.exports = { seedEWM };
