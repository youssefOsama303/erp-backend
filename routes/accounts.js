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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id          SERIAL PRIMARY KEY,
        entry_date  DATE NOT NULL DEFAULT CURRENT_DATE,
        reference   TEXT NOT NULL,
        description TEXT,
        debit_account_id  INT REFERENCES accounts(id),
        credit_account_id INT REFERENCES accounts(id),
        amount      NUMERIC(14,2) NOT NULL,
        created_by  INT,
        created_at  TIMESTAMP DEFAULT NOW()
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
      
      console.log('📝 Seeding Journal Entries...');
      await pool.query(`
        INSERT INTO journal_entries (entry_date, reference, description, debit_account_id, credit_account_id, amount)
        SELECT
          CURRENT_DATE - INTERVAL '5 days', 'JE-001', 'Sales revenue recognition',
          (SELECT id FROM accounts WHERE code='1100'),
          (SELECT id FROM accounts WHERE code='4100'),
          250000
        WHERE NOT EXISTS (SELECT 1 FROM journal_entries);
        
        INSERT INTO journal_entries (entry_date, reference, description, debit_account_id, credit_account_id, amount)
        SELECT
          CURRENT_DATE - INTERVAL '2 days', 'JE-002', 'Office rent payment',
          (SELECT id FROM accounts WHERE code='5300'),
          (SELECT id FROM accounts WHERE code='1100'),
          15000
        WHERE NOT EXISTS (SELECT 1 FROM journal_entries WHERE reference='JE-002');
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

// GET /api/accounting/journal-entries
router.get('/journal-entries', checkPermission('accounting', 'read'), async (req, res, next) => {
  try {
    await ensureTables();
    const { rows } = await pool.query(`
      SELECT je.*, 
             da.code as dr_code, da.name as dr_name,
             ca.code as cr_code, ca.name as cr_name
      FROM journal_entries je
      LEFT JOIN accounts da ON je.debit_account_id = da.id
      LEFT JOIN accounts ca ON je.credit_account_id = ca.id
      ORDER BY je.entry_date DESC, je.id DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// POST /api/accounting/journal-entries
router.post('/journal-entries', checkPermission('accounting', 'write'), async (req, res, next) => {
  try {
    const { entry_date, reference, description, debit_account_id, credit_account_id, amount } = req.body;
    if (!reference || !debit_account_id || !credit_account_id || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid journal entry data' });
    }
    
    // We should ideally run this in a transaction and update account balances
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { rows } = await client.query(
        'INSERT INTO journal_entries (entry_date, reference, description, debit_account_id, credit_account_id, amount) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [entry_date || new Date(), reference, description, debit_account_id, credit_account_id, amount]
      );
      
      // Update balances (Debit nature accounts increase with Debit, Credit nature accounts increase with Credit)
      // Debit leg (assuming typical logic, simplifying here based on existing DB structure)
      await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND nature = $3', [amount, debit_account_id, 'debit']);
      await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND nature = $3', [amount, debit_account_id, 'credit']);
      
      // Credit leg
      await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND nature = $3', [amount, credit_account_id, 'credit']);
      await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND nature = $3', [amount, credit_account_id, 'debit']);
      
      await client.query('COMMIT');
      res.json({ success: true, message: 'Journal entry created', data: rows[0] });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
});

module.exports = router;