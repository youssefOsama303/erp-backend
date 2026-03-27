const router = require("express").Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

router.get("/products", auth(), async (req, res) => {
  const { search } = req.query;
  try {
    const { rows } = await pool.query(`
      SELECT p.*, pc.name AS category_name,
        COALESCE(SUM(s.quantity),0) AS total_qty,
        CASE
          WHEN COALESCE(SUM(s.quantity),0) = 0 THEN 'نفد'
          WHEN COALESCE(SUM(s.quantity),0) <= p.min_quantity THEN 'منخفض'
          ELSE 'متاح'
        END AS status
      FROM products p
      LEFT JOIN product_categories pc ON pc.id = p.category_id
      LEFT JOIN stock s ON s.product_id = p.id
      WHERE p.is_active = true
      ${search ? "AND p.name ILIKE $1" : ""}
      GROUP BY p.id, pc.name
      ORDER BY p.name
    `, search ? [`%${search}%`] : []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/products", auth(["admin","warehouse"]), async (req, res) => {
  const { code, name, category_id, unit, cost_price, sale_price, min_quantity } = req.body;
  if (!code || !name) return res.status(400).json({ message: "الكود والاسم مطلوبان" });
  try {
    const { rows } = await pool.query(`
      INSERT INTO products (code, name, category_id, unit, cost_price, sale_price, min_quantity)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [code, name, category_id, unit||"قطعة", cost_price||0, sale_price||0, min_quantity||0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "الكود مستخدم مسبقاً" });
    res.status(500).json({ message: err.message });
  }
});

router.get("/movements", auth(), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.*, p.name AS product_name, w.name AS warehouse_name
      FROM stock_movements m
      JOIN products p ON p.id = m.product_id
      JOIN warehouses w ON w.id = m.warehouse_id
      ORDER BY m.created_at DESC LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/movements", auth(["admin","warehouse"]), async (req, res) => {
  const { product_id, warehouse_id, type, quantity, reference, notes } = req.body;
  if (!product_id || !warehouse_id || !type || !quantity)
    return res.status(400).json({ message: "جميع الحقول مطلوبة" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: last } = await client.query("SELECT mov_number FROM stock_movements ORDER BY id DESC LIMIT 1");
    const lastNum = last[0] ? parseInt(last[0].mov_number.split("-")[1] || 0) : 0;
    const mov_number = `MOV-${String(lastNum+1).padStart(4,"0")}`;
    await client.query(`
      INSERT INTO stock_movements (mov_number, product_id, warehouse_id, type, quantity, reference, notes, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `, [mov_number, product_id, warehouse_id, type, quantity, reference, notes, req.user.id]);
    const delta = type === "وارد" ? quantity : -quantity;
    await client.query(`
      INSERT INTO stock (product_id, warehouse_id, quantity) VALUES ($1,$2,$3)
      ON CONFLICT (product_id, warehouse_id)
      DO UPDATE SET quantity = stock.quantity + EXCLUDED.quantity
    `, [product_id, warehouse_id, delta]);
    await client.query("COMMIT");
    res.status(201).json({ message: "تم تسجيل الحركة" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
});

router.get("/warehouses", auth(), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT w.*, COUNT(DISTINCT s.product_id) AS product_count
      FROM warehouses w
      LEFT JOIN stock s ON s.warehouse_id = w.id
      WHERE w.is_active = true
      GROUP BY w.id ORDER BY w.name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ عام - للموقع الإلكتروني بدون auth
router.get("/public-products", async (req, res) => {
  const { search, category } = req.query;
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.id, p.name, p.code, p.sale_price, p.unit,
        pc.name AS category_name,
        CASE
          WHEN COALESCE(SUM(s.quantity),0) = 0 THEN 'نفد'
          WHEN COALESCE(SUM(s.quantity),0) <= p.min_quantity THEN 'منخفض'
          ELSE 'متاح'
        END AS stock_status,
        -- مش بنكشف cost_price للعامة أبداً
        p.image_url
      FROM products p
      LEFT JOIN product_categories pc ON pc.id = p.category_id
      LEFT JOIN stock s ON s.product_id = p.id
      WHERE p.is_active = true
      ${search ? "AND p.name ILIKE $1" : ""}
      ${category ? `AND pc.name = $${search ? 2 : 1}` : ""}
      GROUP BY p.id, pc.name
      ORDER BY p.name
    `, [
      ...(search ? [`%${search}%`] : []),
      ...(category ? [category] : [])
    ]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// رفع منتجات بالجملة (Bulk Import) من Listly
router.post("/bulk-import", async (req, res) => {
  const { products } = req.body;

  if (!products || !products.length) {
    return res.status(400).json({ message: "لم يتم إرسال أي منتجات" });
  }

  // التأكد من استدعاء قاعدة البيانات
  const pool = require("../config/db"); // تأكد إن مسار الداتا بيز عندك كده
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    let insertedCount = 0;

    for (const item of products) {
      if (!item.name || !item.price) continue;

      // توليد كود فريد للمنتج
      const productCode = 'PRD-' + Math.floor(100000 + Math.random() * 900000);

      await client.query(
        `INSERT INTO products (code, name, sale_price, image_url, category_name)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          productCode,
          item.name, 
          item.price, 
          item.image_url || null, 
          item.category_name || 'إلكترونيات عامة'
        ]
      );
      insertedCount++;
    }

    await client.query("COMMIT");
    res.json({ message: `تم إضافة ${insertedCount} منتج بنجاح!` });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk Import Error:", err);
    res.status(500).json({ message: "حدث خطأ أثناء حفظ المنتجات" });
  } finally {
    client.release();
  }
});

module.exports = router;
