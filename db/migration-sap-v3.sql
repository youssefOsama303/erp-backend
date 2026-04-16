-- ==========================================
-- 🧩 NEXUS ERP v3.0: SAP MODULES EXPANSION
-- ==========================================

-- 1. EWM (Extended Warehouse Management)
CREATE TABLE IF NOT EXISTS storage_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    warehouse_id INT REFERENCES warehouses(id),
    tenant_id UUID NOT NULL,
    UNIQUE(code, tenant_id)
);

CREATE TABLE IF NOT EXISTS storage_bins (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    storage_type_id INT REFERENCES storage_types(id),
    warehouse_id INT REFERENCES warehouses(id),
    aisle VARCHAR(5),
    section VARCHAR(5),
    bin_level VARCHAR(5),
    capacity_kg NUMERIC(10,2),
    status VARCHAR(20) DEFAULT 'فارغ', -- فارغ، محجوز، ممتلئ
    tenant_id UUID NOT NULL,
    UNIQUE(code, tenant_id)
);

-- 2. GRC (Governance, Risk & Compliance)
CREATE TABLE IF NOT EXISTS grc_risks (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- مالي، تشغيلي، تقني
    owner_id UUID REFERENCES users(id),
    likelihood SMALLINT CHECK (likelihood BETWEEN 1 AND 5),
    impact SMALLINT CHECK (impact BETWEEN 1 AND 5),
    score INT GENERATED ALWAYS AS (likelihood * impact) STORED,
    mitigation_plan TEXT,
    status VARCHAR(20) DEFAULT 'نشط',
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_controls (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50), -- تلقائي، يدوي، وقائي
    last_test_date DATE,
    effectiveness_score INT DEFAULT 0,
    tenant_id UUID NOT NULL
);

-- 3. PP (Production Planning)
CREATE TABLE IF NOT EXISTS bom (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    version VARCHAR(10) DEFAULT '1.0',
    status VARCHAR(20) DEFAULT 'نشط',
    tenant_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS bom_items (
    id SERIAL PRIMARY KEY,
    bom_id INT REFERENCES bom(id) ON DELETE CASCADE,
    component_id INT REFERENCES products(id),
    quantity NUMERIC(10,3) NOT NULL,
    tenant_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS production_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(30) UNIQUE NOT NULL,
    product_id INT REFERENCES products(id),
    quantity NUMERIC(10,2) NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'مخطط', -- مخطط، قيد التنفيذ، مكتمل
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. BTP & Integrations (Business Technology Platform)
CREATE TABLE IF NOT EXISTS integration_logs (
    id SERIAL PRIMARY KEY,
    system_name VARCHAR(50),
    endpoint TEXT,
    method VARCHAR(10),
    request_payload JSONB,
    response_payload JSONB,
    status_code INT,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Finance & Assets (Plant Maintenance)
CREATE TABLE IF NOT EXISTS fixed_assets (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name_ar VARCHAR(150) NOT NULL,
    category VARCHAR(50),
    purchase_date DATE,
    initial_value NUMERIC(15,2),
    depreciation_rate NUMERIC(5,2),
    location VARCHAR(100),
    tenant_id UUID NOT NULL
);
