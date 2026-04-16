/**
 * routes/website.js  — Nexus Store public API
 * Sprint 2: auto-generate customer code, accept shipping fields in orders
 */

const router      = require("express").Router();
const pool        = require("../config/db");
const bcrypt      = require("bcryptjs");
const jwt         = require("jsonwebtoken");
const authCustomer= require("../middleware/authCustomer");

// ══════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════

/** POST /api/website/register */
router.post("/register", async (req, res) => {
  const { name, phone, email, password, city, address } = req.body;
  if (!name || !phone || !password)
    return res.status(400).json({ message: "الاسم والتليفون وكلمة المرور مطلوبة" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ✅ Sprint 2 fix: auto-generate unique customer code
    const code = "WEB-" + Date.now();

    const { rows: cust } = await client.query(
      `INSERT INTO customers (code, name, phone, email, city, address)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [code, name, phone, email || null, city || null, address || null]
    );

    const hashed = await bcrypt.hash(password, 10);
    await client.query(
      `INSERT INTO website_users (customer_id, email, phone, password_hash)
       VALUES ($1,$2,$3,$4)`,
      [cust.rows[0].id, email || null, phone, hashed]
    );

    await client.query("COMMIT");

    const token = jwt.sign(
      { id: cust.rows[0].id, name, role: "customer" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.status(201).json({ token, customer_id: cust.rows[0].id, name });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505")
      return res.status(409).json({ message: "البريد أو التليفون مستخدم مسبقاً" });
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
});

/** POST /api/website/login */
router.post("/login", async (req, res) => {
  const { phone, password } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT wu.*, c.name
       FROM website_users wu
       JOIN customers c ON c.id = wu.customer_id
       WHERE wu.phone = $1 AND wu.is_active = true`,
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

// ══════════════════════════════════════════════════════════════
//  ORDERS
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/website/orders
 * Sprint 2: accepts shipping_method, shipping_amount, shipping_carrier, shipping_service
 */
router.post("/orders", authCustomer, async (req, res) => {
  const {
    items,
    address,
    payment_method  = "COD",
    notes,
    // Sprint 2 — shipping fields
    shipping_method   = null,
    shipping_amount   = 0,
    shipping_carrier  = null,
    shipping_service  = null,
  } = req.body;

  const customer_id = req.customer.id;

  if (!items?.length)
    return res.status(400).json({ message: "الطلب فاضي" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Fetch live prices from DB (never trust client-sent prices)
    const productIds = items.map(i => i.product_id);
    const { rows: products } = await client.query(
      `SELECT id, sale_price, name,
         COALESCE(SUM(s.quantity), 0) AS stock
       FROM products p
       LEFT JOIN stock s ON s.product_id = p.id
       WHERE p.id = ANY($1)
       GROUP BY p.id`,
      [productIds]
    );

    // Validate stock
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (!product) throw new Error(`منتج غير موجود: ${item.product_id}`);
      if (Number(product.stock) < item.quantity)
        throw new Error(`الكمية غير متاحة: ${product.name}`);
    }

    // Build lines
    const lines = items.map(item => {
      const product = products.find(p => p.id === item.product_id);
      return {
        product_id: item.product_id,
        quantity:   item.quantity,
        unit_price: Number(product.sale_price),
        total:      item.quantity * Number(product.sale_price),
      };
    });

    const subtotal       = lines.reduce((s, l) => s + l.total, 0);
    const tax            = subtotal * 0.14;
    const shippingCost   = Number(shipping_amount) || 0;
    const total          = subtotal + tax + shippingCost;

    // Order number
    const { rows: last } = await client.query(
      "SELECT order_number FROM sales_orders ORDER BY id DESC LIMIT 1"
    );
    const lastNum = last[0]
      ? parseInt(last[0].order_number.split("-")[2] || 0) : 0;
    const order_number = `WEB-${new Date().getFullYear()}-${String(lastNum + 1).padStart(4, "0")}`;

    // Insert order
    const { rows: order } = await client.query(
      `INSERT INTO sales_orders
         (order_number, customer_id, date, subtotal, tax_amount, total,
          notes, status, payment_method, shipping_address, source,
          payment_status)
       VALUES ($1,$2,NOW(),$3,$4,$5,$6,'جديد',$7,$8,'website','pending')
       RETURNING *`,
      [order_number, customer_id, subtotal, tax, total,
       notes, payment_method, address]
    );

    const orderId = order[0].id;

    // Sprint 2: update shipping columns (added in sprint1-migration)
    if (shipping_method) {
      await client.query(
        `UPDATE sales_orders
         SET shipping_address = COALESCE(shipping_address, $2)
         WHERE id = $1`,
        [orderId, address]
      ).catch(() => {});
      // Store shipping info in notes if columns not yet in DB
      await client.query(
        `UPDATE sales_orders SET notes = COALESCE(notes,'') || $2 WHERE id = $1`,
        [orderId, `\n[شحن: ${shipping_carrier} - ${shipping_service} - ${shippingCost} ج.م]`]
      ).catch(() => {});
    }

    // Insert order lines
    for (const l of lines) {
      await client.query(
        `INSERT INTO sales_order_lines
           (order_id, product_id, quantity, unit_price, total)
         VALUES ($1,$2,$3,$4,$5)`,
        [orderId, l.product_id, l.quantity, l.unit_price, l.total]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      id:           orderId,
      order_number,
      total,
      subtotal,
      tax,
      shipping:     shippingCost,
      payment_method,
      status:       "جديد",
      message:      "تم استلام طلبك بنجاح! سيتواصل معك فريقنا قريباً",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
});

/** GET /api/website/my-orders */
router.get("/my-orders", authCustomer, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         o.id, o.order_number, o.date, o.total, o.subtotal,
         o.tax_amount, o.status, o.payment_method, o.payment_status,
         o.shipping_address, o.notes, o.created_at,
         COUNT(l.id) AS items_count
       FROM sales_orders o
       LEFT JOIN sales_order_lines l ON l.order_id = o.id
       WHERE o.customer_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.customer.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/** GET /api/website/my-orders/:id — order detail with lines */
router.get("/my-orders/:id", authCustomer, async (req, res) => {
  try {
    const { rows: order } = await pool.query(
      `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone
       FROM sales_orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE o.id = $1 AND o.customer_id = $2`,
      [req.params.id, req.customer.id]
    );
    if (!order[0]) return res.status(404).json({ message: "الطلب غير موجود" });

    const { rows: lines } = await pool.query(
      `SELECT l.*, p.name AS product_name, p.image_url, p.brand
       FROM sales_order_lines l
       JOIN products p ON p.id = l.product_id
       WHERE l.order_id = $1`,
      [req.params.id]
    );

    res.json({ ...order[0], lines });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
