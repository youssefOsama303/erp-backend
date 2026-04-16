-- Add missing fields to products table for frontend sync
ALTER TABLE products
ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS total_qty INT DEFAULT 0;
