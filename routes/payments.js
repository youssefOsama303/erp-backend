/**
 * routes/payments.js
 * Handles Paymob (Egypt) and Stripe (international) payments.
 *
 * Endpoints:
 *   POST /api/payments/paymob           — create Paymob iframe URL
 *   POST /api/payments/stripe           — create Stripe PaymentIntent
 *   POST /api/payments/webhook          — Stripe webhook handler
 *   POST /api/payments/paymob-callback  — Paymob HMAC callback
 */

const router  = require("express").Router();
const pool    = require("../config/db");
const crypto  = require("crypto");

// ── ENV ───────────────────────────────────────────────────────
const {
  PAYMOB_API_KEY,
  PAYMOB_INTEGRATION_ID,
  PAYMOB_IFRAME_ID,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
} = process.env;

// ══════════════════════════════════════════════════════════════
//  PAYMOB  — 3-step flow
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/payments/paymob
 * Body: { order_id, amount (EGP), billing_data: { first_name, phone_number, city, street } }
 * Returns: { iframe_url }
 */
router.post("/paymob", async (req, res) => {
  const { order_id, amount, billing_data = {} } = req.body;

  if (!order_id || !amount)
    return res.status(400).json({ message: "order_id و amount مطلوبان" });

  try {
    const amountCents = Math.round(parseFloat(amount) * 100);

    // Step 1 — Auth token
    const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ api_key: PAYMOB_API_KEY }),
    });
    const authData = await authRes.json();
    if (!authData.token) throw new Error("Paymob auth failed: " + JSON.stringify(authData));
    const authToken = authData.token;

    // Step 2 — Register order
    const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token:       authToken,
        delivery_needed:  false,
        amount_cents:     amountCents,
        currency:         "EGP",
        merchant_order_id: String(order_id),
        items: [],
      }),
    });
    const orderData = await orderRes.json();
    if (!orderData.id) throw new Error("Paymob order reg failed: " + JSON.stringify(orderData));

    // Step 3 — Payment key
    const billing = {
      apartment:     "N/A",
      email:         billing_data.email         || "guest@nexusstore.eg",
      floor:         "N/A",
      first_name:    billing_data.first_name     || "Customer",
      street:        billing_data.street         || billing_data.address || "N/A",
      building:      "N/A",
      phone_number:  billing_data.phone_number   || billing_data.phone   || "+201000000000",
      shipping_method: "PKG",
      postal_code:   billing_data.postal_code    || "11311",
      city:          billing_data.city           || "Cairo",
      country:       "EG",
      last_name:     billing_data.last_name      || "Guest",
      state:         billing_data.state          || billing_data.city    || "Cairo",
    };

    const keyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token:          authToken,
        amount_cents:        amountCents,
        expiration:          3600,
        order_id:            orderData.id,
        billing_data:        billing,
        currency:            "EGP",
        integration_id:      Number(PAYMOB_INTEGRATION_ID),
        lock_order_when_paid: false,
      }),
    });
    const keyData = await keyRes.json();
    if (!keyData.token) throw new Error("Paymob key failed: " + JSON.stringify(keyData));

    // Update sales_order with paymob reference
    await pool.query(
      "UPDATE sales_orders SET paymob_order_id=$1 WHERE id=$2",
      [String(orderData.id), order_id]
    ).catch(() => {}); // non-blocking

    const iframe_url = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${keyData.token}`;
    res.json({ iframe_url, paymob_order_id: orderData.id });

  } catch (err) {
    console.error("Paymob error:", err.message);
    res.status(502).json({ message: "خطأ في بوابة الدفع: " + err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  STRIPE
// ══════════════════════════════════════════════════════════════

let stripe;
try {
  stripe = require("stripe")(STRIPE_SECRET_KEY);
} catch {
  console.warn("⚠️  stripe package not installed — run: npm install stripe");
}

/**
 * POST /api/payments/stripe
 * Body: { order_id, amount (EGP), currency?, customer_email? }
 * Returns: { client_secret, publishable_key }
 */
router.post("/stripe", async (req, res) => {
  if (!stripe)
    return res.status(503).json({ message: "Stripe not configured. Run: npm install stripe" });

  const { order_id, amount, currency = "egp", customer_email } = req.body;
  if (!order_id || !amount)
    return res.status(400).json({ message: "order_id و amount مطلوبان" });

  try {
    const amountCents = Math.round(parseFloat(amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountCents,
      currency: currency.toLowerCase(),
      receipt_email: customer_email || undefined,
      metadata: { order_id: String(order_id), store: "nexus-store" },
      automatic_payment_methods: { enabled: true },
    });

    // Save Stripe reference
    await pool.query(
      "UPDATE sales_orders SET stripe_payment_id=$1 WHERE id=$2",
      [paymentIntent.id, order_id]
    ).catch(() => {});

    res.json({
      client_secret:   paymentIntent.client_secret,
      publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(502).json({ message: "خطأ في Stripe: " + err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  STRIPE WEBHOOK
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/payments/webhook
 * Must be registered in Stripe Dashboard.
 * Raw body required — add before express.json() in server.js:
 *   app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))
 */
router.post("/webhook", express_raw_handler, async (req, res) => {
  if (!stripe) return res.sendStatus(200);

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature error:", err.message);
    return res.status(400).json({ message: "Invalid signature" });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    const orderId = pi.metadata?.order_id;
    if (orderId) {
      await pool.query(
        `UPDATE sales_orders
         SET payment_status = 'paid', status = 'مؤكد', updated_at = NOW()
         WHERE id = $1`,
        [orderId]
      ).catch(e => console.error("DB update error:", e.message));
    }
  }

  res.sendStatus(200);
});

// Middleware placeholder — actual raw body setup is in server.js
function express_raw_handler(req, res, next) { next(); }

// ══════════════════════════════════════════════════════════════
//  PAYMOB CALLBACK  (HMAC validation)
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/payments/paymob-callback
 * Paymob sends this after payment attempt.
 * Register URL in Paymob Dashboard → Developers → Callbacks.
 */
router.post("/paymob-callback", async (req, res) => {
  try {
    const data = req.body;

    // HMAC validation
    const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;
    if (PAYMOB_HMAC_SECRET) {
      const obj = data.obj || {};
      const concatenated = [
        obj.amount_cents,
        obj.created_at,
        obj.currency,
        obj.error_occured,
        obj.has_parent_transaction,
        obj.id,
        obj.integration_id,
        obj.is_3d_secure,
        obj.is_auth,
        obj.is_capture,
        obj.is_refunded,
        obj.is_standalone_payment,
        obj.is_voided,
        obj.order?.id,
        obj.owner,
        obj.pending,
        obj.source_data?.pan,
        obj.source_data?.sub_type,
        obj.source_data?.type,
        obj.success,
      ].join("");

      const hmac = crypto
        .createHmac("sha512", PAYMOB_HMAC_SECRET)
        .update(concatenated)
        .digest("hex");

      if (hmac !== data.hmac) {
        console.warn("Paymob HMAC mismatch");
        return res.status(400).json({ message: "HMAC mismatch" });
      }
    }

    const obj       = data.obj || {};
    const success   = obj.success === true || obj.success === "true";
    const merchantOrderId = obj.order?.merchant_order_id;

    if (success && merchantOrderId) {
      await pool.query(
        `UPDATE sales_orders
         SET payment_status = 'paid', status = 'مؤكد', updated_at = NOW()
         WHERE id = $1`,
        [merchantOrderId]
      ).catch(e => console.error("DB update error:", e.message));
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Paymob callback error:", err.message);
    res.sendStatus(200); // Always 200 to Paymob
  }
});

/**
 * GET /api/payments/paymob-callback
 * Paymob redirects user here after payment (GET with query params).
 * We just redirect to success or failure page.
 */
router.get("/paymob-callback", (req, res) => {
  const success = req.query.success === "true";
  const orderId = req.query.merchant_order_id || "";
  if (success) {
    return res.redirect(`/success.html?order=${orderId}&via=paymob`);
  }
  return res.redirect(`/checkout.html?payment_error=1`);
});

module.exports = router;
