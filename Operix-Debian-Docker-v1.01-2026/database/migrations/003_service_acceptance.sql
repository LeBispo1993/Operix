ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS requester_signature_key text,
  ADD COLUMN IF NOT EXISTS requester_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS service_rating text CHECK (service_rating IN ('NOT_PERFORMED','EXCELLENT','GOOD','REGULAR','BAD','TERRIBLE')),
  ADD COLUMN IF NOT EXISTS requester_feedback text;

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id,read_at,created_at DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_notifications ON notifications USING (tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid);
