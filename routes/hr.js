const router = require("express").Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

router.get("/employees", auth(), async (req, res) => {
  const { search, status } = req.query;
  try {
    const { rows } = await pool.query(`
      SELECT e.*, d.name AS department_name
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE ($1::text IS NULL OR e.name ILIKE $1)
      AND ($2::text IS NULL OR e.status = $2)
      ORDER BY e.name
    `, [search ? `%${search}%` : null, status || null]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/employees", auth(["admin","hr"]), async (req, res) => {
  const { code, name, department_id, job_title, basic_salary, join_date, phone, email } = req.body;
  if (!code || !name || !join_date)
    return res.status(400).json({ message: "الكود والاسم والتاريخ مطلوبة" });
  try {
    const { rows } = await pool.query(`
      INSERT INTO employees (code, name, department_id, job_title, basic_salary, join_date, phone, email)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [code, name, department_id, job_title, basic_salary||0, join_date, phone, email]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "الكود مستخدم مسبقاً" });
    res.status(500).json({ message: err.message });
  }
});

router.get("/leaves", auth(), async (req, res) => {
  const { status } = req.query;
  try {
    const { rows } = await pool.query(`
      SELECT l.*, e.name AS employee_name
      FROM leave_requests l
      JOIN employees e ON e.id = l.employee_id
      WHERE ($1::text IS NULL OR l.status = $1)
      ORDER BY l.created_at DESC
    `, [status || null]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/leaves", auth(), async (req, res) => {
  const { employee_id, type, from_date, to_date, reason } = req.body;
  if (!employee_id || !type || !from_date || !to_date)
    return res.status(400).json({ message: "جميع الحقول مطلوبة" });
  const days = Math.ceil((new Date(to_date) - new Date(from_date)) / (1000*60*60*24)) + 1;
  try {
    const { rows: last } = await pool.query("SELECT request_number FROM leave_requests ORDER BY id DESC LIMIT 1");
    const lastNum = last[0] ? parseInt(last[0].request_number.split("-")[1] || 0) : 0;
    const request_number = `LV-${String(lastNum+1).padStart(3,"0")}`;
    const { rows } = await pool.query(`
      INSERT INTO leave_requests (request_number, employee_id, type, from_date, to_date, days, reason)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [request_number, employee_id, type, from_date, to_date, days, reason]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/leaves/:id/approve", auth(["admin","hr"]), async (req, res) => {
  const { status } = req.body;
  if (!["معتمدة","مرفوضة"].includes(status))
    return res.status(400).json({ message: "الحالة غير صحيحة" });
  try {
    const { rows } = await pool.query(`
      UPDATE leave_requests SET status=$1, approved_by=$2, approved_at=NOW()
      WHERE id=$3 RETURNING *
    `, [status, req.user.id, req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: "الطلب غير موجود" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/payroll", auth(["admin","hr","accountant"]), async (req, res) => {
  const { month } = req.query;
  try {
    const { rows } = await pool.query(`
      SELECT p.*, e.name AS employee_name
      FROM payroll p JOIN employees e ON e.id = p.employee_id
      WHERE ($1::text IS NULL OR p.month = $1)
      ORDER BY e.name
    `, [month || null]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/payroll/generate", auth(["admin","hr"]), async (req, res) => {
  const { month } = req.body;
  if (!month) return res.status(400).json({ message: "الشهر مطلوب YYYY-MM" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: emps } = await client.query("SELECT * FROM employees WHERE status = 'نشط'");
    let created = 0;
    for (const emp of emps) {
      const allowances = (emp.housing_allowance||0) + (emp.transport_allowance||0);
      const net = emp.basic_salary + allowances;
      try {
        await client.query(`
          INSERT INTO payroll (employee_id, month, basic_salary, allowances, deductions, net_salary, created_by)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
        `, [emp.id, month, emp.basic_salary, allowances, 0, net, req.user.id]);
        created++;
      } catch(e) { if (e.code !== "23505") throw e; }
    }
    await client.query("COMMIT");
    res.json({ message: `تم إنشاء مسير لـ ${created} موظف` });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
});

router.get("/departments", auth(), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT d.*, COUNT(e.id) AS employee_count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id
      GROUP BY d.id ORDER BY d.name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// مسح موظف
router.delete('/employees/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // التأكد إن الموظف موجود الأول (استخدمنا pool)
    const check = await pool.query('SELECT id FROM employees WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'الموظف غير موجود' });
    }

    // تنفيذ أمر المسح (استخدمنا pool)
    await pool.query('DELETE FROM employees WHERE id = $1', [id]);
    
    res.json({ message: 'تم مسح الموظف بنجاح' });
  } catch (err) {
    next(err);
  }
});
module.exports = router;
