/**
 * routes/shipping.js
 * POST /api/shipping/rates  — get shipping rate options
 *
 * Body: {
 *   cartItems: [{ name, qty, price }],
 *   destination: { name, phone, city, address, country? }
 * }
 *
 * Returns: { rates: [{ carrier, service, amount, currency, days, rateId }] }
 *
 * Strategy:
 *   1. Try ShipEngine API (test key) for real rates.
 *   2. If ShipEngine fails or no Egyptian carriers found,
 *      return realistic Egypt domestic fallback rates.
 */

const router = require("express").Router();

const SHIPENGINE_KEY = process.env.SHIPENGINE_API_KEY ||
  "TEST:926d9d10-33d4-4cd2-98d0-619b9b8e8601";

// Egypt domestic fallback rates (realistic local pricing in EGP)
const EGYPT_FALLBACK_RATES = [
  {
    rateId:   "EG-STD",
    carrier:  "Bosta",
    service:  "Standard Delivery",
    serviceAr:"توصيل عادي",
    amount:   45,
    currency: "EGP",
    days:     3,
  },
  {
    rateId:   "EG-EXP",
    carrier:  "Aramex",
    service:  "Express Delivery",
    serviceAr:"توصيل سريع",
    amount:   75,
    currency: "EGP",
    days:     1,
  },
  {
    rateId:   "EG-ECO",
    carrier:  "Egyptian Post",
    service:  "Economy Delivery",
    serviceAr:"توصيل اقتصادي",
    amount:   25,
    currency: "EGP",
    days:     7,
  },
];

// Helper — total weight in oz (10 oz per item unit)
function calcWeight(cartItems) {
  return cartItems.reduce((sum, item) => sum + (item.qty || item.quantity || 1) * 10, 0);
}

router.post("/rates", async (req, res) => {
  const { cartItems = [], destination = {} } = req.body;

  if (!cartItems.length)
    return res.status(400).json({ message: "السلة فارغة" });

  // ── Try ShipEngine ────────────────────────────────────────
  try {
    const weightOz = calcWeight(cartItems);

    const sePayload = {
      carrier_ids: [],          // empty = all connected carriers
      from: {
        country_code: "EG",
        postal_code:  "11311",  // Cairo default origin
        city_locality:"Cairo",
        state_province:"Cairo",
      },
      to: {
        country_code:   destination.country || "EG",
        city_locality:  destination.city    || "Cairo",
        state_province: destination.city    || "Cairo",
        postal_code:    destination.zip     || "11311",
      },
      packages: [{
        weight: { value: weightOz, unit: "ounce" },
        dimensions: { unit: "inch", length: 10, width: 8, height: 4 },
      }],
    };

    const seRes = await fetch("https://api.shipengine.com/v1/rates/estimate", {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "API-Key":       SHIPENGINE_KEY,
      },
      body: JSON.stringify(sePayload),
    });

    const seData = await seRes.json();

    // Filter valid rates
    const validRates = (seData || [])
      .filter(r => r.shipping_amount && r.shipping_amount.amount > 0)
      .slice(0, 5)
      .map(r => ({
        rateId:   r.rate_id,
        carrier:  r.carrier_friendly_name || r.carrier_code,
        service:  r.service_type,
        serviceAr:r.service_type,
        amount:   parseFloat(r.shipping_amount.amount),
        currency: r.shipping_amount.currency.toUpperCase(),
        days:     r.delivery_days || r.estimated_delivery_date
                    ? Math.ceil((new Date(r.estimated_delivery_date) - new Date()) / 86400000)
                    : null,
      }));

    if (validRates.length > 0) {
      return res.json({ rates: validRates, source: "shipengine" });
    }
    // Fall through to local rates
  } catch (err) {
    console.warn("ShipEngine API error:", err.message, "— using local rates");
  }

  // ── Egypt fallback ────────────────────────────────────────
  return res.json({ rates: EGYPT_FALLBACK_RATES, source: "local" });
});

module.exports = router;
