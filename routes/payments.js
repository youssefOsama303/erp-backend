const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const pool = require("../config/db");
const authCustomer = require("../middleware/authCustomer");

// ═══════════════════════════════════════
// 1. إنشاء Payment Intent (من الموقع)
// ═══════════════════════════════════════
router.post("/create-payment-intent", async (req, res) => {
  const { order_id } = req.body;
  const customer_id = 1; // ثبتنا رقم العميل مؤقتاً علشان التجربة تنجح

  try {
    // جيب تفاصيل الطلب
    const { rows: orders } = await pool.query(
      `SELECT o.*, c.name, c.email 
       FROM sales_orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE o.id = $1 AND o.customer_id = $2`,
      [order_id, customer_id]
    );

    if (!orders.length) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    const order = orders[0];

    // تأكد إن الطلب لسه جديد
    // if (order.status !== "جديد") {
    //  return res.status(400).json({ message: "الطلب تم دفعه مسبقاً أو تم إلغاؤه" });
    // }

    // إنشاء Payment Intent في Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // بالـ cents
      currency: "egp", // أو "usd" حسب عملتك
      automatic_payment_methods: { enabled: true },
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        customer_id: customer_id
      },
      description: `طلب #${order.order_number}`
    });

    // حفظ payment_intent_id في الطلب
    await pool.query(
      `UPDATE sales_orders 
       SET payment_intent_id = $1, payment_status = 'pending'
       WHERE id = $2`,
      [paymentIntent.id, order_id]
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });

  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ message: "حدث خطأ في إنشاء عملية الدفع" });
  }
});

// ═══════════════════════════════════════
// 2. Webhook - استلام تأكيد الدفع
// ═══════════════════════════════════════
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // معالجة الأحداث
  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentSuccess(event.data.object);
      break;

    case "payment_intent.payment_failed":
      await handlePaymentFailed(event.data.object);
      break;

    case "charge.refunded":
      await handleRefund(event.data.object);
      break;
  }

  res.json({ received: true });
});

// ═══════════════════════════════════════
// 3. دوال المساعدة
// ═══════════════════════════════════════

async function handlePaymentSuccess(paymentIntent) {
  const { order_id, order_number } = paymentIntent.metadata;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // تحديث حالة الطلب
    await client.query(
      `UPDATE sales_orders 
       SET payment_status = 'paid', 
           status = 'تم الدفع',
           paid_amount = $1,
           paid_at = NOW()
       WHERE id = $2`,
      [paymentIntent.amount / 100, order_id]
    );

    // تسجيل عملية الدفع
    await client.query(
      `INSERT INTO payment_transactions 
       (order_id, payment_intent_id, amount, currency, status, payment_method, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        order_id,
        paymentIntent.id,
        paymentIntent.amount / 100,
        paymentIntent.currency,
        "succeeded",
        paymentIntent.payment_method_types[0]
      ]
    );

    await client.query("COMMIT");

    // 🔔 إرسال إيميل تأكيد (هنعمله بعدين)
    await sendPaymentConfirmationEmail(order_id);

    console.log(`✅ تم الدفع بنجاح للطلب #${order_number}`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error handling payment success:", err);
  } finally {
    client.release();
  }
}

async function handlePaymentFailed(paymentIntent) {
  const { order_id } = paymentIntent.metadata;

  await pool.query(
    `UPDATE sales_orders 
     SET payment_status = 'failed'
     WHERE id = $1`,
    [order_id]
  );

  console.log(`❌ فشل الدفع للطلب #${order_id}`);
}

async function handleRefund(charge) {
  const paymentIntent = charge.payment_intent;
  
  await pool.query(
    `UPDATE sales_orders 
     SET payment_status = 'refunded',
         status = 'تم الاسترجاع'
     WHERE payment_intent_id = $1`,
    [paymentIntent]
  );

  console.log(`↩️ تم استرجاع المبلغ`);
}

// ═══════════════════════════════════════
// بوابة دفع Paymob (كروت ومحافظ إلكترونية)
// ═══════════════════════════════════════
router.post("/paymob", authCustomer, async (req, res) => {
    const { order_id, amount, billing_data } = req.body;

    const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
    const INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
    const IFRAME_ID = process.env.PAYMOB_IFRAME_ID;

    try {
        // 1. طلب التوكن الأساسي (Authentication)
        const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: PAYMOB_API_KEY })
        });
        const authData = await authRes.json();
        const auth_token = authData.token;

        // 2. تسجيل الطلب في Paymob (Order Registration)
        const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                auth_token: auth_token,
                delivery_needed: "false",
                amount_cents: Math.round(amount * 100), // تحويل المبلغ لقروش
                currency: "EGP",
                merchant_order_id: `WEB-${order_id}-${Date.now()}` // كود فريد للطلب
            })
        });
        const orderData = await orderRes.json();
        const paymob_order_id = orderData.id;

        // 3. استخراج مفتاح الدفع (Payment Key)
        const keyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                auth_token: auth_token,
                amount_cents: Math.round(amount * 100),
                expiration: 3600,
                order_id: paymob_order_id,
                
                // هنكتب الرقم بإيدينا هنا علشان نتأكد إنه مش بيقراه غلط من الـ env
                integration_id: 3409787, 
                currency: "EGP", 
                
                billing_data: {
                    first_name: billing_data.first_name || "Customer",
                    last_name: "NA", 
                    email: "customer@nexastore.com", 
                    phone_number: billing_data.phone_number || "01000000000",
                    city: billing_data.city || "NA",
                    country: "EG",
                    street: billing_data.street || "NA",
                    apartment: "NA", 
                    floor: "NA", 
                    building: "NA",
                    shipping_method: "NA",
                    postal_code: "NA",
                    state: "NA"
                }
            })
        });
        const keyData = await keyRes.json();
        const payment_token = keyData.token;

        // التأكد إن بيموب رجع توكن سليم مش إيرور
        if (!payment_token) {
            console.error("Paymob Error:", keyData);
            return res.status(400).json({ message: "فشل استخراج مفتاح الدفع من Paymob" });
        }

        // 4. إرجاع لينك الـ Iframe للموقع
        const iframe_url = `https://accept.paymob.com/api/acceptance/iframes/${IFRAME_ID}?payment_token=${payment_token}`;
        res.json({ iframe_url });

    } catch (error) {
        console.error("Paymob Integration Error:", error);
        res.status(500).json({ message: "خطأ داخلي في السيرفر أثناء الدفع" });
    }
});

module.exports = router;