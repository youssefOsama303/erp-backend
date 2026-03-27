const router = require("express").Router();
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authCustomer = require("../middleware/authCustomer");

// ══════════════════════════
// 1. تسجيل عميل جديد من الموقع
// ══════════════════════════
router.post("/register", async (req, res) => {
  const { name, phone, email, password, address, city } = req.body;
  if (!name || !phone || !password)
    return res.status(400).json({ message: "الاسم والتليفون وكلمة المرور مطلوبة" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // توليد كود فريد للعميل (مثال: WEB-168453)
    const customerCode = 'WEB-' + Math.floor(100000 + Math.random() * 900000);

    // 1. حفظ في جدول customers (الـ ERP) مع إضافة الـ code
    const customer = await client.query(
      `INSERT INTO customers (code, name, phone, email, city, address)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [customerCode, name, phone, email, city, address]
    );

    // 2. حفظ في جدول website_users (للـ login)
    const hashed = await bcrypt.hash(password, 10);
    await client.query(
      `INSERT INTO website_users (customer_id, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)`,
      [customer.rows[0].id, email, phone, hashed]
    );

    await client.query("COMMIT");

    // إرسال token مباشرة بعد التسجيل
    const token = jwt.sign(
      { id: customer.rows[0].id, name, role: "customer" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.status(201).json({ token, customer_id: customer.rows[0].id, name });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505")
      return res.status(409).json({ message: "البريد أو التليفون مستخدم مسبقاً" });
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
});

// ══════════════════════════
// 2. تسجيل دخول العميل
// ══════════════════════════
router.post("/login", async (req, res) => {
  const { phone, password } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT wu.*, c.name FROM website_users wu
       JOIN customers c ON c.id = wu.customer_id
       WHERE wu.phone = $1`,
      [phone]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "بيانات غير صحيحة" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: "بيانات غير صحيحة" });

    const token = jwt.sign(
      { id: user.customer_id, name: user.name, role: "customer" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.json({ token, name: user.name, customer_id: user.customer_id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ══════════════════════════
// 4. طلبات العميل
// ══════════════════════════
router.get("/my-orders", authCustomer, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.order_number, o.date, o.total, o.status, o.payment_method,
              COUNT(l.id) AS items_count
       FROM sales_orders o
       LEFT JOIN sales_order_lines l ON l.order_id = o.id
       WHERE o.customer_id = $1
       GROUP BY o.id
       ORDER BY o.date DESC`,
      [req.customer.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ═══════════════════════════════════════
// إنشاء أمر بيع جديد من الموقع
// ═══════════════════════════════════════
router.post("/orders", authCustomer, async (req, res) => {
  const { items, address, payment_method, notes } = req.body;
  const customer_id = req.customer.id; // بنجيب رقم العميل من التوكن (authCustomer)

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "سلة المشتريات فارغة" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN"); // بنبدأ العملية علشان لو حصل خطأ نلغيها كلها

    // 1. جلب الأسعار الحقيقية للمنتجات من الداتا بيز (أمان علشان محدش يتلاعب بالسعر من الموقع)
    const productIds = items.map(i => i.product_id);
    const { rows: dbProducts } = await client.query(
      `SELECT products.id, products.sale_price, products.name FROM products WHERE products.id = ANY($1::int[])`,
      [productIds]
    );

    let subtotal = 0;
    const orderLines = [];

    // 2. مطابقة المنتجات وحساب المجموع
    for (const item of items) {
      const product = dbProducts.find(p => p.id === item.product_id);
      if (!product) throw new Error(`المنتج غير موجود: ${item.product_id}`);

      const lineTotal = product.sale_price * item.quantity;
      subtotal += lineTotal;

      orderLines.push({
        product_id: product.id,
        quantity: item.quantity,
        unit_price: product.sale_price,
        total: lineTotal
      });
    }

    const tax = subtotal * 0.14; // حساب ضريبة 14%
    const total = subtotal + tax;

    // 3. توليد رقم أمر بيع فريد متسلسل للموقع (مثال: WEB-2026-0001)
    const { rows: lastOrder } = await client.query(
      `SELECT sales_orders.id FROM sales_orders ORDER BY sales_orders.id DESC LIMIT 1`
    );
    const nextId = (lastOrder[0]?.id || 0) + 1;
    const order_number = `WEB-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`;

    // 4. حفظ أمر البيع الأساسي في جدول sales_orders 
    const { rows: newOrder } = await client.query(
      `INSERT INTO sales_orders 
       (order_number, customer_id, date, subtotal, tax_amount, total, status, payment_method, shipping_address, notes, source)
       VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, 'جديد', $6, $7, $8, 'website')
       RETURNING id, order_number, total, payment_method`,
      [order_number, customer_id, subtotal, tax, total, payment_method, address, notes]
    );

    const orderId = newOrder[0].id;

    // 5. حفظ تفاصيل المنتجات داخل أمر البيع في جدول sales_order_lines
    for (const line of orderLines) {
      await client.query(
        `INSERT INTO sales_order_lines (order_id, product_id, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, line.product_id, line.quantity, line.unit_price, line.total]
      );
    }

    await client.query("COMMIT"); // تأكيد الحفظ بنجاح في قاعدة البيانات

    // إرجاع بيانات الطلب بنجاح لصفحة checkout.html علشان تحولنا لصفحة النجاح
    res.status(201).json(newOrder[0]);

  } catch (err) {
    await client.query("ROLLBACK"); // التراجع عن العملية لو حصل أي خطأ
    console.error("Order Creation Error:", err);
    res.status(500).json({ message: err.message || "حدث خطأ أثناء معالجة الطلب" });
  } finally {
    client.release();
  }
});

module.exports = router;