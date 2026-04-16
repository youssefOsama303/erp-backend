/**
 * createNotification – Reusable utility to insert a notification / activity log entry.
 *
 * Call this from any controller after a significant action:
 *   const { createNotification } = require("../utils/createNotification");
 *   await createNotification({ userId, title, message, entityType, entityId, entityLabel, actionType, redirectUrl });
 *
 * @param {object} opts
 * @param {string|number} [opts.userId]       - The user who triggered the action (optional, for future per-user filtering)
 * @param {string}        opts.title          - Short notification title  e.g. "New Order Received"
 * @param {string}        opts.message        - Longer description         e.g. "Order #1042 was placed by John"
 * @param {string}        [opts.entityType]   - Table / domain name        e.g. "orders", "products"
 * @param {string}        [opts.entityId]     - PK / identifier of the record
 * @param {string}        [opts.entityLabel]  - Human-readable label       e.g. product name
 * @param {string}        [opts.actionType]   - "ADD" | "DELETE" | "UPDATE" (default: "ADD")
 * @param {string}        [opts.redirectUrl]  - Frontend URL to navigate to when notification is clicked
 * @param {object}        [opts.payload]      - Any extra JSON data to store alongside the log
 * @returns {Promise<object|null>}            - The inserted row, or null on failure
 */

const pool = require("../config/db");

async function createNotification({
  userId      = null,
  title,
  message,
  entityType  = "system",
  entityId    = null,
  entityLabel = null,
  actionType  = "ADD",
  redirectUrl = "/admin/index.html",
  payload     = {},
}) {
  if (!title || !message) {
    console.warn("[createNotification] 'title' and 'message' are required – skipping insert.");
    return null;
  }

  // Normalise actionType to the CHECK constraint values in the DB
  const validActions = ["ADD", "DELETE", "UPDATE"];
  const safeAction = validActions.includes(String(actionType).toUpperCase())
    ? String(actionType).toUpperCase()
    : "ADD";

  try {
    const { rows } = await pool.query(
      `INSERT INTO activity_logs
         (action_type, entity_type, entity_id, entity_label, title, message, redirect_url, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, message, entity_type, is_read, created_at`,
      [
        safeAction,
        entityType,
        entityId   ? String(entityId)   : null,
        entityLabel ? String(entityLabel) : null,
        title,
        message,
        redirectUrl,
        JSON.stringify(payload),
      ]
    );

    return rows[0] ?? null;
  } catch (err) {
    // Non-fatal – log but don't crash the parent request
    console.error("[createNotification] Failed to insert notification:", err.message);
    return null;
  }
}

module.exports = { createNotification };
