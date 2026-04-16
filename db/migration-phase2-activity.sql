-- Phase 2: Activity log + notifications (auto trigger-based)

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('ADD', 'DELETE')),
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100),
  entity_label VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  redirect_url TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_unread ON activity_logs (is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs (entity_type, entity_id);

CREATE OR REPLACE FUNCTION map_activity_redirect(entity_name TEXT, rec_json JSONB)
RETURNS TEXT AS $$
DECLARE
  item_id TEXT := COALESCE(rec_json->>'id', '');
BEGIN
  CASE entity_name
    WHEN 'products' THEN
      RETURN '/admin/index.html#stock-section?productId=' || item_id;
    WHEN 'customers' THEN
      RETURN '/admin/index.html#orders-section?customerId=' || item_id;
    WHEN 'invoices' THEN
      RETURN '/admin/index.html?invoiceId=' || item_id;
    WHEN 'accounts' THEN
      RETURN '/admin/index.html?accountId=' || item_id;
    WHEN 'employees' THEN
      RETURN '/admin/index.html?employeeId=' || item_id;
    ELSE
      RETURN '/admin/index.html';
  END CASE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_entity_activity()
RETURNS TRIGGER AS $$
DECLARE
  rec_json JSONB;
  action_name TEXT;
  entity_name TEXT := TG_TABLE_NAME;
  entity_id_value TEXT;
  entity_label_value TEXT;
  title_value TEXT;
  message_value TEXT;
  redirect_value TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    rec_json := to_jsonb(NEW);
    action_name := 'ADD';
  ELSIF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'products' AND OLD.is_active = true AND NEW.is_active = false THEN
    rec_json := to_jsonb(NEW);
    action_name := 'DELETE';
  ELSIF TG_OP = 'DELETE' THEN
    rec_json := to_jsonb(OLD);
    action_name := 'DELETE';
  ELSE
    RETURN NULL;
  END IF;

  entity_id_value := COALESCE(rec_json->>'id', rec_json->>'code', rec_json->>'invoice_number', rec_json->>'order_number');
  entity_label_value := COALESCE(rec_json->>'name', rec_json->>'code', rec_json->>'invoice_number', rec_json->>'email', entity_id_value, 'Unknown');
  title_value := CASE WHEN action_name = 'ADD' THEN 'New ' || entity_name || ' item'
                      ELSE 'Deleted ' || entity_name || ' item' END;
  message_value := CASE WHEN action_name = 'ADD' THEN 'Added "' || entity_label_value || '" to ' || entity_name
                        ELSE 'Deleted "' || entity_label_value || '" from ' || entity_name END;
  redirect_value := map_activity_redirect(entity_name, rec_json);

  INSERT INTO activity_logs (
    action_type,
    entity_type,
    entity_id,
    entity_label,
    title,
    message,
    redirect_url,
    payload
  ) VALUES (
    action_name,
    entity_name,
    entity_id_value,
    entity_label_value,
    title_value,
    message_value,
    redirect_value,
    rec_json
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_activity_products ON products;
CREATE TRIGGER tr_activity_products
AFTER INSERT OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION log_entity_activity();

DROP TRIGGER IF EXISTS tr_activity_products_soft_delete ON products;
CREATE TRIGGER tr_activity_products_soft_delete
AFTER UPDATE OF is_active ON products
FOR EACH ROW EXECUTE FUNCTION log_entity_activity();

DROP TRIGGER IF EXISTS tr_activity_customers ON customers;
CREATE TRIGGER tr_activity_customers
AFTER INSERT OR DELETE ON customers
FOR EACH ROW EXECUTE FUNCTION log_entity_activity();

DROP TRIGGER IF EXISTS tr_activity_invoices ON invoices;
CREATE TRIGGER tr_activity_invoices
AFTER INSERT OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION log_entity_activity();

DROP TRIGGER IF EXISTS tr_activity_accounts ON accounts;
CREATE TRIGGER tr_activity_accounts
AFTER INSERT OR DELETE ON accounts
FOR EACH ROW EXECUTE FUNCTION log_entity_activity();

DROP TRIGGER IF EXISTS tr_activity_employees ON employees;
CREATE TRIGGER tr_activity_employees
AFTER INSERT OR DELETE ON employees
FOR EACH ROW EXECUTE FUNCTION log_entity_activity();
