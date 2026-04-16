-- Phase 2: Notifications fanout
-- Run after: migration-phase2-activity.sql

-- 1) Per-user notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_log_id BIGINT NOT NULL REFERENCES activity_logs(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT notifications_user_activity_unique UNIQUE (user_id, activity_log_id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created
  ON notifications (user_id, is_read, created_at DESC);

-- 2) Redirect mapping (reuse from activity migration, but keep resilient)
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

-- 3) Trigger function: write activity_logs + fanout notifications
CREATE OR REPLACE FUNCTION log_entity_activity_and_notify()
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

  activity_id BIGINT;
  invoice_creator_uuid UUID;
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    rec_json := to_jsonb(NEW);
    action_name := 'ADD';
  ELSIF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'products'
    AND OLD.is_active = true AND NEW.is_active = false THEN
    rec_json := to_jsonb(NEW);
    action_name := 'DELETE';
  ELSIF TG_OP = 'DELETE' THEN
    rec_json := to_jsonb(OLD);
    action_name := 'DELETE';
  ELSE
    RETURN NULL;
  END IF;

  entity_id_value := COALESCE(
    rec_json->>'id',
    rec_json->>'code',
    rec_json->>'invoice_number',
    rec_json->>'order_number'
  );

  entity_label_value := COALESCE(
    rec_json->>'name',
    rec_json->>'code',
    rec_json->>'invoice_number',
    rec_json->>'email',
    entity_id_value,
    'Unknown'
  );

  title_value := CASE
    WHEN action_name = 'ADD' THEN 'New ' || entity_name || ' item'
    ELSE 'Deleted ' || entity_name || ' item'
  END;

  message_value := CASE
    WHEN action_name = 'ADD' THEN 'Added "' || entity_label_value || '" to ' || entity_name
    ELSE 'Deleted "' || entity_label_value || '" from ' || entity_name
  END;

  redirect_value := map_activity_redirect(entity_name, rec_json);

  -- Insert activity event
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
  ) RETURNING id INTO activity_id;

  -- Fanout notifications
  IF entity_name = 'products' THEN
    INSERT INTO notifications (user_id, activity_log_id)
    SELECT u.id, activity_id
    FROM users u
    WHERE u.role IN ('admin', 'warehouse', 'sales');

  ELSIF entity_name = 'customers' THEN
    INSERT INTO notifications (user_id, activity_log_id)
    SELECT u.id, activity_id
    FROM users u
    WHERE u.role IN ('admin', 'sales');

  ELSIF entity_name = 'invoices' THEN
    -- Base recipients
    INSERT INTO notifications (user_id, activity_log_id)
    SELECT u.id, activity_id
    FROM users u
    WHERE u.role IN ('admin', 'accountant');

    -- If invoice creator is a sales rep, notify only that creator
    invoice_creator_uuid := NULLIF(rec_json->>'created_by', '')::UUID;
    IF invoice_creator_uuid IS NOT NULL THEN
      IF EXISTS (
        SELECT 1 FROM users WHERE id = invoice_creator_uuid AND role = 'sales'
      ) THEN
        INSERT INTO notifications (user_id, activity_log_id)
        VALUES (invoice_creator_uuid, activity_id)
        ON CONFLICT (user_id, activity_log_id) DO NOTHING;
      END IF;
    END IF;

  ELSIF entity_name = 'accounts' THEN
    INSERT INTO notifications (user_id, activity_log_id)
    SELECT u.id, activity_id
    FROM users u
    WHERE u.role IN ('admin', 'accountant');

  ELSIF entity_name = 'employees' THEN
    INSERT INTO notifications (user_id, activity_log_id)
    SELECT u.id, activity_id
    FROM users u
    WHERE u.role IN ('admin', 'hr');
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4) Rebind triggers to the new function
DROP TRIGGER IF EXISTS tr_activity_products ON products;
CREATE TRIGGER tr_activity_products
AFTER INSERT OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION log_entity_activity_and_notify();

DROP TRIGGER IF EXISTS tr_activity_products_soft_delete ON products;
CREATE TRIGGER tr_activity_products_soft_delete
AFTER UPDATE OF is_active ON products
FOR EACH ROW EXECUTE FUNCTION log_entity_activity_and_notify();

DROP TRIGGER IF EXISTS tr_activity_customers ON customers;
CREATE TRIGGER tr_activity_customers
AFTER INSERT OR DELETE ON customers
FOR EACH ROW EXECUTE FUNCTION log_entity_activity_and_notify();

DROP TRIGGER IF EXISTS tr_activity_invoices ON invoices;
CREATE TRIGGER tr_activity_invoices
AFTER INSERT OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION log_entity_activity_and_notify();

DROP TRIGGER IF EXISTS tr_activity_accounts ON accounts;
CREATE TRIGGER tr_activity_accounts
AFTER INSERT OR DELETE ON accounts
FOR EACH ROW EXECUTE FUNCTION log_entity_activity_and_notify();

DROP TRIGGER IF EXISTS tr_activity_employees ON employees;
CREATE TRIGGER tr_activity_employees
AFTER INSERT OR DELETE ON employees
FOR EACH ROW EXECUTE FUNCTION log_entity_activity_and_notify();

