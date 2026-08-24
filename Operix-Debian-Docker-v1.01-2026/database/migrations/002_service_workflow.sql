ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS requester_name text,
  ADD COLUMN IF NOT EXISTS requester_extension text,
  ADD COLUMN IF NOT EXISTS requester_signature_key text,
  ADD COLUMN IF NOT EXISTS decision_at timestamptz,
  ADD COLUMN IF NOT EXISTS decided_by uuid REFERENCES people(id),
  ADD COLUMN IF NOT EXISTS denial_reason text,
  ADD COLUMN IF NOT EXISTS decision_signature_key text;

ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS priority_id uuid REFERENCES priorities(id),
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES people(id),
  ADD COLUMN IF NOT EXISTS technician_id uuid REFERENCES people(id),
  ADD COLUMN IF NOT EXISTS service_description text,
  ADD COLUMN IF NOT EXISTS before_photo_key text,
  ADD COLUMN IF NOT EXISTS after_photo_key text,
  ADD COLUMN IF NOT EXISTS technician_signature_key text,
  ADD COLUMN IF NOT EXISTS checklist_id uuid REFERENCES checklists(id);

CREATE TABLE IF NOT EXISTS work_order_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id),
  description text NOT NULL,
  source text NOT NULL CHECK (source IN ('STOCK','PURCHASE','OTHER')),
  warehouse_id uuid REFERENCES warehouses(id),
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit_cost numeric(14,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_order_checklist_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  checklist_id uuid NOT NULL REFERENCES checklists(id),
  answers jsonb NOT NULL DEFAULT '{}',
  completed_by uuid REFERENCES people(id),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_work_orders_open ON work_orders(tenant_id,status,started_at);
CREATE INDEX IF NOT EXISTS idx_wo_materials_order ON work_order_materials(tenant_id,work_order_id);
ALTER TABLE work_order_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_checklist_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_wo_materials ON work_order_materials USING (tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_wo_checklists ON work_order_checklist_results USING (tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid);

INSERT INTO sectors(tenant_id,name) SELECT id,'Producao' FROM tenants ON CONFLICT DO NOTHING;
INSERT INTO sectors(tenant_id,name) SELECT id,'Expedicao' FROM tenants ON CONFLICT DO NOTHING;
INSERT INTO sectors(tenant_id,name) SELECT id,'Tecnologia da Informacao' FROM tenants ON CONFLICT DO NOTHING;
INSERT INTO sectors(tenant_id,name) SELECT id,'Manutencao' FROM tenants ON CONFLICT DO NOTHING;
