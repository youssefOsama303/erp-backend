-- ============================================================
-- NEXUS ERP v3.2 — EWM Extended Schema with 3D Coordinates
-- Run after: migration-sap-v3.sql
-- ============================================================

-- 1. EWM Warehouses (full hierarchy root)
CREATE TABLE IF NOT EXISTS ewm_warehouses (
    id           SERIAL PRIMARY KEY,
    code         VARCHAR(20) NOT NULL,
    name         VARCHAR(150) NOT NULL,
    address      TEXT,
    lat          NUMERIC(10,6),
    lon          NUMERIC(10,6),
    tenant_id    UUID NOT NULL,
    created_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE(code, tenant_id)
);

-- 2. Storage Types (Ambient, Cold Chain, Hazmat…)
CREATE TABLE IF NOT EXISTS ewm_storage_types (
    id               SERIAL PRIMARY KEY,
    warehouse_id     INT REFERENCES ewm_warehouses(id) ON DELETE CASCADE,
    code             VARCHAR(20) NOT NULL,
    name             VARCHAR(100) NOT NULL,
    temperature_zone VARCHAR(30) DEFAULT 'ambient',  -- ambient, chilled, frozen, hazmat
    tenant_id        UUID NOT NULL,
    UNIQUE(code, warehouse_id, tenant_id)
);

-- 3. Storage Sections (Aisles / Zones within a storage type)
CREATE TABLE IF NOT EXISTS ewm_storage_sections (
    id              SERIAL PRIMARY KEY,
    storage_type_id INT REFERENCES ewm_storage_types(id) ON DELETE CASCADE,
    code            VARCHAR(10) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    hazard_class    VARCHAR(10) DEFAULT 'none',
    tenant_id       UUID NOT NULL,
    UNIQUE(code, storage_type_id, tenant_id)
);

-- 4. Storage Bins (with full 3D position)
CREATE TABLE IF NOT EXISTS ewm_bins (
    id           SERIAL PRIMARY KEY,
    section_id   INT REFERENCES ewm_storage_sections(id) ON DELETE CASCADE,
    bin_code     VARCHAR(30) NOT NULL,
    x            NUMERIC(8,2) NOT NULL DEFAULT 0,   -- 3D X coordinate (aisle position)
    y            NUMERIC(8,2) NOT NULL DEFAULT 0,   -- 3D Y coordinate (rack level)
    z            NUMERIC(8,2) NOT NULL DEFAULT 0,   -- 3D Z coordinate (depth)
    rotation_deg NUMERIC(5,1) DEFAULT 0,            -- orientation in degrees
    capacity_kg  NUMERIC(10,2) DEFAULT 1000,
    status       VARCHAR(20)  DEFAULT 'empty',      -- empty, partial, full, blocked
    tenant_id    UUID NOT NULL,
    created_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE(bin_code, tenant_id)
);

-- 5. Materials / SKUs (product catalogue enriched with physical dims)
CREATE TABLE IF NOT EXISTS ewm_materials (
    id          SERIAL PRIMARY KEY,
    sku         VARCHAR(50) NOT NULL,
    name        VARCHAR(200) NOT NULL,
    length_cm   NUMERIC(8,2),
    width_cm    NUMERIC(8,2),
    height_cm   NUMERIC(8,2),
    weight_kg   NUMERIC(8,3),
    uom         VARCHAR(10) DEFAULT 'EA',
    tenant_id   UUID NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(sku, tenant_id)
);

-- 6. Stock snapshots per bin
CREATE TABLE IF NOT EXISTS ewm_stock (
    id          SERIAL PRIMARY KEY,
    bin_id      INT REFERENCES ewm_bins(id) ON DELETE CASCADE,
    material_id INT REFERENCES ewm_materials(id) ON DELETE CASCADE,
    qty         NUMERIC(12,3) NOT NULL DEFAULT 0,
    uom         VARCHAR(10) DEFAULT 'EA',
    updated_at  TIMESTAMP DEFAULT NOW(),
    tenant_id   UUID NOT NULL,
    UNIQUE(bin_id, material_id, tenant_id)
);

-- 7. Warehouse Tasks (Putaway / Picking / Transfer)
CREATE TABLE IF NOT EXISTS ewm_tasks (
    id           SERIAL PRIMARY KEY,
    task_type    VARCHAR(20) NOT NULL CHECK (task_type IN ('putaway','picking','transfer','inventory')),
    status       VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done','cancelled')),
    bin_from_id  INT REFERENCES ewm_bins(id),
    bin_to_id    INT REFERENCES ewm_bins(id),
    material_id  INT REFERENCES ewm_materials(id),
    qty          NUMERIC(12,3) NOT NULL DEFAULT 1,
    priority     SMALLINT DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    assigned_to  VARCHAR(100),   -- worker_id or robot_id or user UUID
    eta_minutes  INT,
    completed_at TIMESTAMP,
    notes        TEXT,
    tenant_id    UUID NOT NULL,
    created_at   TIMESTAMP DEFAULT NOW()
);

-- ── Indexes for performance ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ewm_bins_section   ON ewm_bins(section_id);
CREATE INDEX IF NOT EXISTS idx_ewm_bins_status    ON ewm_bins(status);
CREATE INDEX IF NOT EXISTS idx_ewm_stock_bin      ON ewm_stock(bin_id);
CREATE INDEX IF NOT EXISTS idx_ewm_tasks_status   ON ewm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ewm_tasks_type     ON ewm_tasks(task_type);
