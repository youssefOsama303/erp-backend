-- Migration: Sprint 2 - Shipping & Payments Fields
-- Run: psql -d your_db -f migration-sprint2.sql (Neon DB)

-- Add columns safely (IF NOT EXISTS)
ALTER TABLE sales_orders 
ADD COLUMN IF NOT EXISTS shipping_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_carrier VARCHAR(50),
ADD COLUMN IF NOT EXISTS shipping_service VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_payment_status ON sales_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);

-- Update existing orders
UPDATE sales_orders SET payment_status = 'pending' WHERE payment_status IS NULL;

-- Verify
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'sales_orders' AND column_name IN ('shipping_amount', 'shipping_carrier', 'shipping_service', 'payment_status');

