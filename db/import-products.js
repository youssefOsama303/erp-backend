const pool = require('../config/db');

/* ── EMBEDDED PRODUCT DATA (from scraping) ───────────────── */
const RAW_PRODUCTS = [
  // ── MOBILES: Apple ──
  { name: 'IPhone 17 Pro Max With FaceTime - 256GB, 12GB RAM', price: 99900, brand: 'Apple', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/09/Apple-IPhone-17-Pro-Max-With-FaceTime-256GB-12GB-RAM-_Apple_23390_1.webp' },
  { name: 'IPhone 17 Pro Max With FaceTime - 512GB, 12GB RAM', price: 122777, brand: 'Apple', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/09/Apple-IPhone-17-Pro-Max-With-FaceTime-512GB-12GB-RAM-_Apple_23391_1.webp' },
  { name: 'IPhone 17 Pro With FaceTime - 256GB, 12GB RAM',     price: 91900,  brand: 'Apple', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/09/Apple-IPhone-17-Pro-With-FaceTime-256GB-12GB-RAM-_Apple_23387_1.webp' },
  { name: 'IPhone 17 Pro With FaceTime - 512GB, 12GB RAM',     price: 109900, brand: 'Apple', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/09/Apple-IPhone-17-Pro-With-FaceTime-512GB-12GB-RAM-_Apple_23388_1.webp' },
  { name: 'IPhone 17 Pro With FaceTime - 1TB, 12GB RAM',       price: 127888, brand: 'Apple', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/09/Apple-IPhone-17-Pro-With-FaceTime-1TB-12GB-RAM-_Apple_23389_1.webp' },
  { name: 'IPhone 17 With FaceTime - 256GB, 8GB RAM',          price: 69600,  brand: 'Apple', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/09/Apple-IPhone-17-With-FaceTime-256GB-8GB-RAM-_Apple_23382_1.webp' },
  { name: 'IPhone Air With FaceTime - 256GB, 8GB RAM',         price: 73000,  brand: 'Apple', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/09/Apple-IPhone-Air-With-FaceTime-256GB-8GB-RAM-_Apple_23384_1.webp' },
  { name: 'IPhone 16 Plus With FaceTime - 128GB, 8GB RAM',     price: 66000,  brand: 'Apple', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2024/11/Apple-IPhone-16-With-FaceTime-128GB-8GB-RAM_3992_1.jpeg' },
  { name: 'IPhone 16 Pro With FaceTime - 512GB, 8GB RAM',      price: 87600,  brand: 'Apple', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/10/Apple-IPhone-16-Pro-With-FaceTime-512GB-8GB-RAM_Apple_23562_1.jpeg' },
  { name: 'IPhone 16 Pro With FaceTime - 1TB, 8GB RAM',        price: 94900,  brand: 'Apple', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/10/Apple-IPhone-16-Pro-With-FaceTime-1TB-8GB-RAM-_Apple_23563_1.jpeg' },
  { name: 'IPhone 16 Pro Max With FaceTime - 1TB, 8GB RAM',    price: 105500, brand: 'Apple', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/10/Apple-IPhone-16-Pro-Max-With-FaceTime-1TB-8GB-RAM_Apple_23565_1.jpeg' },
  { name: 'IPhone 15 With FaceTime - 128GB, 6GB RAM',          price: 49333,  brand: 'Apple', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2024/04/Apple-IPhone-15-Plus-With-FaceTime-128GB-6GB-RAM_4177_2.jpeg' },
  // ── MOBILES: Samsung ──
  { name: 'Samsung Galaxy S26 Ultra Dual SIM - 256GB, 12GB RAM 5G',  price: 66999, brand: 'Samsung', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2026/02/S26-Ultra-256.webp' },
  { name: 'Samsung Galaxy A56 Dual Sim - 256GB, 12GB Ram, 5G',       price: 26799, brand: 'Samsung', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/05/A56-25666-G.jpg' },
  { name: 'Samsung Galaxy A56 Dual Sim - 256GB, 8GB Ram, 5G',        price: 24333, brand: 'Samsung', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/04/A56-256.jpg' },
  { name: 'Samsung Galaxy A36 Dual Sim - 256GB, 8GB Ram, 5G',        price: 19250, brand: 'Samsung', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/04/A36-KSp.jpg' },
  { name: 'Samsung Galaxy A36 Dual Sim - 128GB, 8GB Ram, 5G',        price: 17399, brand: 'Samsung', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/04/A36-128.jpg' },
  { name: 'Samsung Galaxy A26 Dual Sim - 256GB, 8GB Ram, 5G',        price: 15599, brand: 'Samsung', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/03/A26-256.jpg' },
  { name: 'Samsung Galaxy A17 Dual Sim - 256GB, 8GB Ram, 4G',        price: 10990, brand: 'Samsung', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/09/Samsung-A17-KSP-256.jpg' },
  { name: 'Samsung Galaxy A17 Dual Sim - 128GB, 6GB Ram, 4G',        price: 9290,  brand: 'Samsung', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/09/Samsung-A17-KSP-6G.jpg' },
  { name: 'Samsung A07 Dual Sim - 256GB, 8GB Ram, 4G',                price: 8830,  brand: 'Samsung', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/12/A07-KSP.jpg' },
  { name: 'Samsung A07 Dual Sim - 128GB, 6GB Ram, 4G',                price: 7300,  brand: 'Samsung', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/09/Samsung-A07-128.jpg' },
  { name: 'Samsung A07 Dual Sim - 128GB, 4GB Ram, 4G',                price: 6500,  brand: 'Samsung', category: 'موبايلات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/09/Samsung-A07-128-4G.jpg' },
  // ── LAPTOPS: Apple ──
  { name: 'MacBook Pro 16-inch M4 Pro - 24GB 512GB SSD', price: 148000, brand: 'Apple', category: 'لابتوبات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/11/MacBook-Pro-16-inch-M4-Pro-Chip-with-14-core-CPU-20-core-GPU-24GB-Unified-Memory-512GB-SSD-Storage-_MacBook_23891_1.webp' },
  { name: 'MacBook Pro 14-inch M5 - 16GB 512GB SSD',     price: 103000, brand: 'Apple', category: 'لابتوبات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2026/02/Apple-MacBook-Pro-14-inch-M5-Chip-with-10-Core-CPU-10-Core-GPU-16GB-512GB-SSD-Storage-_MacBook_24427_1.webp' },
  { name: 'MacBook Air 13-inch M4 - 24GB 512GB SSD',     price: 88000,  brand: 'Apple', category: 'لابتوبات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/10/Apple-MacBook-Air-15-inch-M4-Chip-with-10-Core-CPU-10-Core-GPU-16GB-256GB-SSD-_7434_1.webp' },
  { name: 'MacBook Air 13-inch M4 - 16GB 512GB SSD',     price: 73333,  brand: 'Apple', category: 'لابتوبات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/08/Apple-MacBook-Air-15-inch-M4-Chip-with-10-Core-CPU-10-Core-GPU-16GB-256GB-SSD-_7435_1.webp' },
  { name: 'MacBook Air 13-inch M4 - 16GB 256GB SSD',     price: 58500,  brand: 'Apple', category: 'لابتوبات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/04/Apple-MacBook-Air-15-inch-M4-Chip-with-10-Core-CPU-10-Core-GPU-16GB-256GB-SSD-_7435_1.webp' },
  { name: 'MacBook Air 13-inch M2 - 8GB 256GB SSD',      price: 47555,  brand: 'Apple', category: 'لابتوبات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2026/01/midnight.webp' },
  { name: 'MacBook Air 13-inch M1 - 8GB 256GB SSD',      price: 34500,  brand: 'Apple', category: 'لابتوبات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2023/12/Apple-MacBook-Air-M1-13In.-8G-Ram-256G-SSD_MacBook_206_2.png' },
  // ── LAPTOPS: ASUS ──
  { name: 'ASUS TUF Gaming A16 - RTX5050 Ryzen7 16GB 512GB 165Hz', price: 59199, brand: 'ASUS', category: 'لابتوبات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/09/FA608UH-RV007W-1.webp' },
  { name: 'ASUS Vivobook S14 M5406WA - Ryzen AI 9 365 24GB 1TB OLED', price: 59999, brand: 'ASUS', category: 'لابتوبات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/08/SUS-Vivobook-S14-M5406WA-PP009W-11.webp' },
  { name: 'ASUS V16 V3607VH - RTX5050 Core5 210H 16GB 1TB 144Hz',   price: 50999, brand: 'ASUS', category: 'لابتوبات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/09/V3607VH-EG005W.webp' },
  { name: 'ASUS Zenbook A14 - Snapdragon X1 16GB 1TB OLED',          price: 54599, brand: 'ASUS', category: 'لابتوبات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/07/ASUS-Zenbook-A14-UX3407QA-QD232W-1.webp' },
  { name: 'ASUS Vivobook S16 - Ultra7 255H 16GB 1TB OLED Arc',       price: 49999, brand: 'ASUS', category: 'لابتوبات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2026/02/ASUS-Vivobook-S16-S3607CA-SH070W-Ultra-7-255H-16GB-1TB-SSD-Intel-Arc-Graphics-16-inch-FHD-OLED-Windows-11_ASUS-Laptop_23308_1-1.webp' },
  { name: 'ASUS Vivobook 16 X1605VA - i7 16GB 512GB OLED',           price: 39999, brand: 'ASUS', category: 'لابتوبات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/05/ASUS-Vivobook-15-OLED-X1505VA-L1019W-i9-13900H.webp' },
  { name: 'ASUS Vivobook 16 X1605VA - i7 16GB 512GB FHD OLED',       price: 37599, brand: 'ASUS', category: 'لابتوبات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2026/01/ASUS-Vivobook-16-X1605VA-ACH007W.webp' },
  { name: 'ASUS TUF Gaming A15 FA506NCG - RTX3050 Ryzen7 8GB 512GB', price: 37799, brand: 'ASUS', category: 'لابتوبات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/11/FA506NCG-HN807W.webp' },
  { name: 'ASUS Vivobook 16 - i5-13420H 16GB 512GB OLED',            price: 35699, brand: 'ASUS', category: 'لابتوبات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2026/01/ASUS-Vivobook-16-X1605VA-ACH007W.webp' },
  // ── TABLETS ──
  { name: 'iPad mini A17 Pro (2024) - 8.3 Inch 128GB Wi-Fi', price: 29999, brand: 'Apple', category: 'تابلت', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/11/Apple-iPad-mini-A17-Pro-2024-8.3-Inch-128GB-Wi-Fi-_IPad_24028_1.webp' },
  // ── WATCHES: Apple ──
  { name: 'Apple Watch Series 11 46mm', price: 26333, brand: 'Apple', category: 'ساعات ذكية', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/11/Apple-Watch-Series-11-46mm-jet-black-2.jpg' },
  { name: 'Apple Watch Series 11 42mm', price: 24777, brand: 'Apple', category: 'ساعات ذكية', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/11/Apple-Watch-Series-11-42mm_6644_1.jpeg' },
  { name: 'Apple Watch Series 10 46mm', price: 19999, brand: 'Apple', category: 'ساعات ذكية', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2024/10/Apple-Watch-Series-10-46mm_3645_1.jpeg' },
  // ── WATCHES: Others ──
  { name: 'Huawei Watch Fit 4 Pro', price: 7999, brand: 'Huawei', category: 'ساعات ذكية', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/05/Huawei-Watch-Fit-4-Pro_Smart-Watch_22613_1.webp' },
  { name: 'Huawei Watch Fit 4',     price: 5999, brand: 'Huawei', category: 'ساعات ذكية', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/05/Huawei-Watch-Fit-4_Smart-Watch_22612_1.jpeg' },
  { name: 'Xiaomi Redmi Watch 5 Lite',   price: 2399, brand: 'Xiaomi', category: 'ساعات ذكية', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/01/Xiaomi-Redmi-Watch-5-Lite.webp' },
  { name: 'Xiaomi Redmi Watch 5 Active', price: 2050, brand: 'Xiaomi', category: 'ساعات ذكية', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2024/11/5-active.png' },
  { name: 'CardoO Watch X Apex',  price: 3399, brand: 'CardoO', category: 'ساعات ذكية', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/07/CardoO-Watch-X-Apex_Smart-Watch_22946_1.webp' },
  { name: 'CardoO Watch X Orbit', price: 3399, brand: 'CardoO', category: 'ساعات ذكية', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/07/CardoO-Watch-X-Orbit_Smart-Watch_22947_1.webp' },
  { name: 'Mibro Smart Watch Lite 3',  price: 2499, brand: 'Mibro',   category: 'ساعات ذكية', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/03/Mibro-Smart-Watch-Lite-3_Smart-Watch_22416_1.jpeg' },
  { name: 'Infinix XWatch 3 WE',       price: 1850, brand: 'Infinix', category: 'ساعات ذكية', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2024/11/Infinix-XWatch-3-WE_Smart-Watch_21959_1.jpeg' },
  { name: 'Infinix Smart Watch H4',    price: 1199, brand: 'Infinix', category: 'ساعات ذكية', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/08/Infinix-Smart-Watch-H4_Smart-Watch_23121_1.webp' },
  { name: 'Infinix Smart Watch N4',    price: 1499, brand: 'Infinix', category: 'ساعات ذكية', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/09/Infinix-Smart-Watch-N4_Smart-Watch_23522_1.webp' },
  { name: 'Oraimo Watch 5 Lite OSW-804', price: 899, brand: 'Oraimo', category: 'ساعات ذكية', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/01/watch-5-lite.webp' },
  // ── ACCESSORIES ──
  { name: 'AirPods Max USB-C',                    price: 32888, brand: 'Apple', category: 'إكسسوارات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2026/01/AirPods-Max-USB-C-blue.webp' },
  { name: 'Apple Pencil (USB-C)',                  price: 5999,  brand: 'Apple', category: 'إكسسوارات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/08/Apple-Pencil-USB-C_Touch-Pen_19747_1.webp' },
  { name: 'Apple Watch Magnetic Fast Charger 1m',  price: 2399,  brand: 'Apple', category: 'إكسسوارات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2024/10/Apple-Watch-Magnetic-Fast-Charger-To-USB-C-Cable-1m_3633_1.jpeg' },
  { name: 'Apple iPhone 16 Pro Max Clear Case MagSafe', price: 2499, brand: 'Apple', category: 'إكسسوارات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/02/Official-2.webp' },
  { name: 'ASUS TUF Gaming Backpack VP4700', price: 2199, brand: 'ASUS', category: 'إكسسوارات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/11/ASUS-TUF-Gaming-Backpack-VP4700_Bags_22969_1.webp' },
  { name: 'ASUS ROG Gaming Backpack BP4701', price: 2399, brand: 'ASUS', category: 'إكسسوارات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/11/ASUS-ROG-Gaming-Backpack-BP4701_Bags_22970_1.webp' },
  { name: 'ASUS AP4600 Backpack',            price: 1349, brand: 'ASUS', category: 'إكسسوارات', image: 'https://assets-dubaiphone.dubaiphone.net/dp-prod/wp-content/uploads/2025/11/ASUS-AP4600-Backpack-_Bags_22972_1.webp' },
];

async function importProducts() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // التأكد من وجود المستودع الرئيسي
    let warehouseRes = await client.query('SELECT id FROM warehouses WHERE code = $1', ['WH-MAIN']);
    let warehouseId;
    if (warehouseRes.rows.length === 0) {
      const insert = await client.query(
        `INSERT INTO warehouses (name, code, address, is_active) 
         VALUES ('المستودع الرئيسي', 'WH-MAIN', 'العنوان الافتراضي', true) RETURNING id`
      );
      warehouseId = insert.rows[0].id;
    } else {
      warehouseId = warehouseRes.rows[0].id;
    }

    // إضافة التصنيفات
    const categories = [...new Set(RAW_PRODUCTS.map(p => p.category))];
    const categoryMap = {};
    for (const cat of categories) {
      let catRes = await client.query('SELECT id FROM product_categories WHERE name = $1', [cat]);
      if (catRes.rows.length === 0) {
        const insert = await client.query(
          `INSERT INTO product_categories (name) VALUES ($1) RETURNING id`,
          [cat]
        );
        categoryMap[cat] = insert.rows[0].id;
      } else {
        categoryMap[cat] = catRes.rows[0].id;
      }
    }

    // إدخال المنتجات
    for (const prod of RAW_PRODUCTS) {
      const categoryId = categoryMap[prod.category];
      // إنشاء رمز فريد من الاسم
      const code = prod.code
        ? prod.code
        : prod.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 30);

      // حساب سعر التكلفة كـ 80% من سعر البيع
      const cost_price = Math.round(prod.price * 0.8);
      const sale_price = prod.price;
      const total_qty = 10; // كمية ابتدائية

      const productRes = await client.query(
        `INSERT INTO products (code, name, brand, sale_price, cost_price, image_url, category_id, total_qty, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           brand = EXCLUDED.brand,
           sale_price = EXCLUDED.sale_price,
           cost_price = EXCLUDED.cost_price,
           image_url = EXCLUDED.image_url,
           category_id = EXCLUDED.category_id,
           total_qty = EXCLUDED.total_qty,
           is_active = EXCLUDED.is_active
         RETURNING id`,
        [code, prod.name, prod.brand, sale_price, cost_price, prod.image, categoryId, total_qty]
      );
      const productId = productRes.rows[0].id;

      // حركة مخزون أولية
      const mov_number = `MOV-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
      await client.query(
        `INSERT INTO stock_movements (mov_number, product_id, warehouse_id, type, quantity, reference, notes)
         VALUES ($1, $2, $3, 'IN', $4, 'IMPORT', 'استيراد أولي')`,
        [mov_number, productId, warehouseId, total_qty]
      );
    }

    await client.query('COMMIT');
    console.log('✅ تم استيراد المنتجات بنجاح');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ خطأ:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

importProducts();