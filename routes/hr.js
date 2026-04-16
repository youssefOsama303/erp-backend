const router = require("express").Router();
const pool = require("../config/db");
const { checkPermission } = require("../middleware/rbac");

// ── Auto-create tables & Seed Data ─────────────────────────────────────────
let ready = false;
async function ensureTables() {
  if (ready) return;
  try {
    // Note: The main schema.sql creates departments, employees, leave_requests, payroll
    // We gently verify departments exists, and if empty, we seed HR data
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM departments');
    if (parseInt(rows[0].count, 10) === 0) {
      console.log('👥 Seeding initial Human Resources data into database...');
      
      await pool.query(`
        INSERT INTO departments (name) VALUES
        ('Operations & Production'),
        ('Sales & Marketing'),
        ('Information Technology'),
        ('Human Resources')
      `);

      const deptRes = await pool.query('SELECT id, name FROM departments');
      const depts = {};
      deptRes.rows.forEach(d => depts[d.name] = d.id);

      await pool.query(`
        INSERT INTO employees (code, name, department_id, job_title, basic_salary, join_date, status) VALUES
        ('EMP-001', 'Ahmed Mohamed', $1, 'Software Developer', 15000, CURRENT_DATE - INTERVAL '365 days', 'نشط'),
        ('EMP-002', 'Sara Youssef', $2, 'Senior Sales Executive', 12000, CURRENT_DATE - INTERVAL '200 days', 'نشط'),
        ('EMP-003', 'Khaled Hassan', $3, 'Logistics Manager', 18000, CURRENT_DATE - INTERVAL '500 days', 'نشط')
      `, [depts['Information Technology'], depts['Sales & Marketing'], depts['Operations & Production']]);

      const empRes = await pool.query('SELECT id FROM employees ORDER BY id LIMIT 3');
      const emps = empRes.rows.map(e => e.id);

      await pool.query(`
        INSERT INTO leave_requests (request_number, employee_id, type, from_date, to_date, days, reason, status) VALUES
        ('LV-001', $1, 'Annual Leave', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '8 days', 3, 'Family vacation', 'معلقة'),
        ('LV-002', $2, 'Sick Leave', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '1 days', 1, 'Medical emergency', 'معتمدة'),
        ('LV-003', $3, 'Annual Leave', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '15 days', 5, 'Travel', 'معلقة')
      `, [emps[0], emps[1], emps[2]]);
    }
    ready = true;
  } catch(e) { console.warn('⚠️ [HR] Table setup/seeding failed:', e.message); }
}

router.get("/employees", checkPermission('hr', 'read'), async (req, res) => {
  const { search, status } = req.query;
  try {
    await ensureTables();
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

router.post("/employees", checkPermission('hr', 'write'), async (req, res) => {
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

router.get("/leaves", checkPermission('hr', 'read'), async (req, res) => {
  const { status } = req.query;
  try {
    await ensureTables();
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

router.post("/leaves", checkPermission('hr', 'write'), async (req, res) => {
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

router.patch("/leaves/:id/approve", checkPermission('hr', 'write'), async (req, res) => {
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

router.get("/payroll", checkPermission('hr', 'read'), async (req, res) => {
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

router.post("/payroll/generate", checkPermission('hr', 'write'), async (req, res) => {
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

router.get("/departments", checkPermission('hr', 'read'), async (req, res) => {
  try {
    await ensureTables();
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
router.delete('/employees/:id', checkPermission('hr', 'write'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // التأكد إن الموظف موجود الأول
    const check = await pool.query('SELECT id FROM employees WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'الموظف غير موجود' });
    }

    // تنفيذ أمر المسح
    await pool.query('DELETE FROM employees WHERE id = $1', [id]);
    
    res.json({ message: 'تم مسح الموظف بنجاح' });
  } catch (err) {
    next(err);
  }
});

// ------------------- SAP SuccessFactors (Human Capital Management) -------------------

// GET /api/hr/requisitions
router.get('/requisitions', checkPermission('hr', 'read'), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const result = await pool.query('SELECT * FROM job_requisitions WHERE tenant_id = $1', [tenantId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching requisitions' });
  }
});

module.exports = router;
