const router = require("express").Router();
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

router.get("/notifications", authenticate, async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit || "15", 10), 1), 100);
  const unreadOnly = String(req.query.unreadOnly ?? "true") === "true";

  try {
    const userId = req.user.id;

    const { rows } = await pool.query(
      `SELECT
          n.id,
          al.action_type,
          al.entity_type,
          al.entity_id,
          al.entity_label,
          al.title,
          al.message,
          al.redirect_url,
          n.is_read,
          n.created_at
        FROM notifications n
        JOIN activity_logs al ON al.id = n.activity_log_id
        WHERE n.user_id = $1
          AND ($2::boolean = false OR n.is_read = false)
        ORDER BY n.created_at DESC
        LIMIT $3`,
      [userId, unreadOnly, limit]
    );

    const { rows: summary } = await pool.query(
      `SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE is_read = false)::int AS unread
        FROM notifications
        WHERE user_id = $1`,
      [userId]
    );

    res.json({
      notifications: rows,
      unread: summary[0]?.unread || 0,
      total: summary[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/notifications/:id/read", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_read`,
      [req.params.id, req.user.id]
    );

    if (!rows[0]) return res.status(404).json({ message: "Notification not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/notifications/read-all", authenticate, async (_req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1 AND is_read = false`,
      [_req.user.id]
    );
    res.json({ message: "All notifications marked as read", affected: result.rowCount || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
