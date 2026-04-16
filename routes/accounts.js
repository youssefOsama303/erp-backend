const router = require('express').Router();
const pool   = require('../config/db');
const { checkPermission } = require('../middleware/rbac');

// ── Auto-create table & Seed Chart of Accounts ──────────────────────────────
let ready = false;
async function ensureTables() {
  if (ready) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id      SERIAL PRIMARY KEY,
        code    TEXT UNIQUE NOT NULL,
        name    TEXT NOT NULL,
        type    TEXT NOT NULL DEFAULT 'Asset',
        nature  TEXT NOT NULL DEFAULT 'debit',
        balance NUMERIC(14,2) DEFAULT 0
      )
    `);
    const { rows } = await pool.query(`SELECT COUNT(*) AS count FROM accounts`);
    if (parseInt(rows[0].count, 10) === 0) {
      console.log('💰 Seeding Chart of Accounts...');
      await pool.query(`
        INSERT INTO accounts (code, name, type, nature, balance) VALUES
        ('1100', 'Cash & Bank',          'Asset',     'debit',  1450200),
        ('1200', 'Accounts Receivable',  'Asset',     'debit',   320000),
        ('1300', 'Inventory',            'Asset',     'debit',   840000),
        ('1400', 'Prepaid Expenses',     'Asset',     'debit',    45000),
        ('2100', 'Accounts Payable',     'Liability', 'credit',  210000),
        ('2200', 'Short-term Loans',     'Liability', 'credit',  500000),
        ('3100', 'Share Capital',        'Equity',    'credit', 2000000),
        ('3200', 'Retained Earnings',    'Equity',    'credit',  450000),
        ('4100', 'Sales Revenue',        'Revenue',   'credit', 3200000),
        ('4200', 'Service Revenue',      'Revenue',   'credit',  180000),
        ('5100', 'Cost of Goods Sold',   'Expense',   'debit',  1800000),
        ('5200', 'Payroll Expense',      'Expense',   'debit',   450000),
        ('5300', 'Operating Expenses',   'Expense',   'debit',   120000),
        ('5400', 'Depreciation',         'Expense',   'debit',    36000)
      `);
    }
    ready = true;
  } catch(e) { console.warn('⚠️ [Accounting] Table setup failed:', e.message); }
}

// GET /api/accounting — Chart of Accounts list
router.get('/', checkPermission('accounting', 'read'), async (req, res, next) => {
  try {
    await ensureTables();
    const { rows } = await pool.query('SELECT * FROM accounts ORDER BY code');
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/accounting/summary — KPI dashboard data
router.get('/summary', checkPermission('accounting', 'read'), async (req, res) => {
  try {
    await ensureTables();
    const { rows } = await pool.query(`
      SELECT
        SUM(CASE WHEN code='1100'              THEN balance ELSE 0 END) AS cash_position,
        SUM(CASE WHEN code='1200'              THEN balance ELSE 0 END) AS receivables,
        SUM(CASE WHEN code='2100'              THEN balance ELSE 0 END) AS payables,
        SUM(CASE WHEN type='Revenue'           THEN balance ELSE 0 END) AS total_revenue,
        SUM(CASE WHEN type='Expense'           THEN balance ELSE 0 END) AS total_expenses,
        SUM(CASE WHEN type='Asset' AND nature='debit' THEN balance ELSE 0 END) AS total_assets
      FROM accounts
    `);
    const d = rows[0] || {};
    const revenue  = parseFloat(d.total_revenue  || 0);
    const expenses = parseFloat(d.total_expenses || 0);
    res.json({ success: true, data: {
      cash_position:  parseFloat(d.cash_position || 0),
      receivables:    parseFloat(d.receivables   || 0),
      payables:       parseFloat(d.payables      || 0),
      total_revenue:  revenue,
      total_expenses: expenses,
      net_profit:     revenue - expenses,
      total_assets:   parseFloat(d.total_assets  || 0),
    }});
  } catch(e) { res.json({ success: false, message: e.message }); }
});

// POST /api/accounting — Add account
router.post('/', checkPermission('accounting', 'write'), async (req, res, next) => {
  try {
    const { code, name, type, nature, balance } = req.body;
    await pool.query(
      'INSERT INTO accounts (code, name, type, nature, balance) VALUES ($1,$2,$3,$4,$5)',
      [code, name, type, nature, balance]
    );
    res.json({ success: true, message: 'Account created' });
  } catch (err) { next(err); }
});

// DELETE /api/accounting/:id
router.delete('/:id', checkPermission('accounting', 'write'), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM accounts WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) { next(err); }
});

// GET /api/accounting/cost-centers (graceful fallback)
router.get('/cost-centers', checkPermission('accounting', 'read'), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const result = await pool.query('SELECT * FROM cost_centers WHERE tenant_id=$1', [tenantId]).catch(() => ({ rows: [] }));
    res.json({ success: true, data: result.rows });
  } catch (err) { res.json({ success: true, data: [] }); }
});

// GET /api/accounting/fixed-assets (graceful fallback)
router.get('/fixed-assets', checkPermission('accounting', 'read'), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const result = await pool.query('SELECT * FROM fixed_assets WHERE tenant_id=$1', [tenantId]).catch(() => ({ rows: [] }));
    res.json({ success: true, data: result.rows });
  } catch (err) { res.json({ success: true, data: [] }); }
});

module.exports = router;