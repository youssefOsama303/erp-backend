const { Pool } = require('pg');
require('dotenv').config();

(async () => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    const res = await pool.query(`SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'stock_movements' ORDER BY ordinal_position`);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();