const pool = require("../config/db");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const hash = await bcrypt.hash("admin123", 10);
    await client.query(`
      INSERT INTO users (name, email, password, role) VALUES
        ('احمد محمد','admin@erp.sa',$1,'admin'),
        ('سارة خالد','accountant@erp.sa',$1,'accountant'),
        ('محمد علي','sales@erp.sa',$1,'sales'),
        ('فيصل عمر','warehouse@erp.sa',$1,'warehouse'),
        ('نورة عبدالله','hr@erp.sa',$1,'hr')
      ON CONFLICT (email) DO NOTHING
    `, [hash]);

    await client.query(`
      INSERT INTO departments (name) VALUES
        ('تقنية المعلومات'),('المالية'),
        ('المبيعات'),('الادارة'),('المخازن')
      ON CONFLICT (name) DO NOTHING
    `);

    await client.query(`
      INSERT INTO customers (code, name, phone, city) VALUES
        ('C-001','شركة النور','0501234567','الرياض'),
        ('C-002','مؤسسة الافق','0551234567','جدة'),
        ('C-003','شركة البناء','0531234567','الدمام')
      ON CONFLICT (code) DO NOTHING
    `);

    await client.query(`
      INSERT INTO suppliers (code, name, phone, city, rating) VALUES
        ('S-001','مصنع الجودة','0501111111','الرياض',5),
        ('S-002','شركة التوريد','0551111111','جدة',4),
        ('S-003','موردو التقنية','0531111111','الدمام',3)
      ON CONFLICT (code) DO NOTHING
    `);

    await client.query(`
      INSERT INTO warehouses (code, name, location, capacity) VALUES
        ('WH-01','المخزن الرئيسي','الرياض',5000),
        ('WH-02','مخزن فرعي','جدة',2000)
      ON CONFLICT (code) DO NOTHING
    `);

    await client.query(`
      INSERT INTO product_categories (name) VALUES
        ('الكترونيات'),('اثاث'),('مستلزمات')
      ON CONFLICT (name) DO NOTHING
    `);

    await client.query(`
      INSERT INTO products (code,name,category_id,unit,cost_price,sale_price,min_quantity)
      SELECT p.code,p.name,c.id,p.unit,p.cp,p.sp,p.mq
      FROM (VALUES
        ('PRD-001','لابتوب Dell','الكترونيات','قطعة',8500,11000,10),
        ('PRD-002','شاشة Samsung','الكترونيات','قطعة',1800,2500,5),
        ('PRD-003','كرسي مكتبي','اثاث','قطعة',750,1200,3)
      ) AS p(code,name,cat,unit,cp,sp,mq)
      JOIN product_categories c ON c.name=p.cat
      ON CONFLICT (code) DO NOTHING
    `);

    await client.query(`
      INSERT INTO stock (product_id,warehouse_id,quantity)
      SELECT p.id,w.id,s.qty
      FROM (VALUES
        ('PRD-001','WH-01',42),
        ('PRD-002','WH-01',25),
        ('PRD-003','WH-01',18)
      ) AS s(pc,wc,qty)
      JOIN products p ON p.code=s.pc
      JOIN warehouses w ON w.code=s.wc
      ON CONFLICT (product_id,warehouse_id) DO NOTHING
    `);

    await client.query(`
      INSERT INTO employees (code,name,department_id,job_title,basic_salary,join_date)
      SELECT e.code,e.name,d.id,e.title,e.salary,e.jd::DATE
      FROM (VALUES
        ('EMP-001','احمد محمد','تقنية المعلومات','مدير تقنية',18000,'2020-03-15'),
        ('EMP-002','سارة خالد','المالية','محاسب',12000,'2021-06-01'),
        ('EMP-003','محمد علي','المبيعات','مدير مبيعات',15000,'2019-09-10')
      ) AS e(code,name,dept,title,salary,jd)
      JOIN departments d ON d.name=e.dept
      ON CONFLICT (code) DO NOTHING
    `);

    await client.query("COMMIT");
    console.log("✅ Database seeded successfully");
    console.log("👤 Login: admin@erp.sa / admin123");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
