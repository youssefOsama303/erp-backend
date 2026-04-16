// import-products.js
const pool = require('./config/db');

const RAW_PRODUCTS = [
    // ... (انسخ محتوى RAW_PRODUCTS من الملف الذي أرسلته سابقًا) ...
];

async function importProducts() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // التأكد من وجود المستودع الرئيسي
        let warehouseRes = await client.query('SELECT id FROM warehouses WHERE code = $1', ['WH-MAIN']);
        let warehouseId;
        if (warehouseRes.rows.length === 0) {
            const insert = await client.query(
                `INSERT INTO warehouses (name, code, address, is_active) 
         VALUES ('المستودع الرئيسي', 'WH-MAIN', 'العنوان الافتراضي', true) RETURNING id`
            );
            warehouseId = insert.rows[0].id;
        } else {
            warehouseId = warehouseRes.rows[0].id;
        }

        // إضافة التصنيفات
        const categories = [...new Set(RAW_PRODUCTS.map(p => p.category))];
        const categoryMap = {};
        for (const cat of categories) {
            let catRes = await client.query('SELECT id FROM product_categories WHERE name = $1', [cat]);
            if (catRes.rows.length === 0) {
                const insert = await client.query(
                    `INSERT INTO product_categories (name) VALUES ($1) RETURNING id`,
                    [cat]
                );
                categoryMap[cat] = insert.rows[0].id;
            } else {
                categoryMap[cat] = catRes.rows[0].id;
            }
        }

        // إدخال المنتجات
        for (const prod of RAW_PRODUCTS) {
            const categoryId = categoryMap[prod.category];
            const code = prod.code
                ? prod.code
                : prod.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '')
                    .slice(0, 30);

            const cost_price = Math.round(prod.price * 0.8);
            const sale_price = prod.price;
            const total_qty = 10;

            const productRes = await client.query(
                `INSERT INTO products (code, name, brand, sale_price, cost_price, image_url, category_id, total_qty, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           brand = EXCLUDED.brand,
           sale_price = EXCLUDED.sale_price,
           cost_price = EXCLUDED.cost_price,
           image_url = EXCLUDED.image_url,
           category_id = EXCLUDED.category_id,
           total_qty = EXCLUDED.total_qty,
           is_active = EXCLUDED.is_active
         RETURNING id`,
                [code, prod.name, prod.brand, sale_price, cost_price, prod.image, categoryId, total_qty]
            );
            const productId = productRes.rows[0].id;

            // حركة مخزون أولية
            const mov_number = `MOV-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            await client.query(
                `INSERT INTO stock_movements (mov_number, product_id, warehouse_id, type, quantity, reference, notes)
         VALUES ($1, $2, $3, 'IN', $4, 'IMPORT', 'استيراد أولي')`,
                [mov_number, productId, warehouseId, total_qty]
            );
        }

        await client.query('COMMIT');
        console.log('✅ تم استيراد المنتجات بنجاح');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ خطأ:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

importProducts();