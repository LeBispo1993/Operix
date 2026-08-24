ALTER TABLE sectors ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES sectors(id);
ALTER TABLE people ADD COLUMN IF NOT EXISTS extension text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS target_team text CHECK (target_team IN ('MAINTENANCE','IT'));

CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
  role user_role NOT NULL, module text NOT NULL, can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false, can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false, UNIQUE(tenant_id,role,module)
);
CREATE TABLE IF NOT EXISTS service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL, description text, active boolean NOT NULL DEFAULT true, UNIQUE(tenant_id,name)
);
CREATE TABLE IF NOT EXISTS equipment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL, fields_schema jsonb NOT NULL DEFAULT '{}', active boolean NOT NULL DEFAULT true, UNIQUE(tenant_id,name)
);
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
  asset_id uuid REFERENCES assets(id), sector_id uuid REFERENCES sectors(id), checklist_id uuid REFERENCES checklists(id),
  priority_id uuid REFERENCES priorities(id), name text NOT NULL, periodicity text NOT NULL,
  next_date date NOT NULL, active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid REFERENCES tenants(id), title text NOT NULL,
  message text NOT NULL, audience_roles user_role[], starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz, active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id), title text NOT NULL,
  description text, due_date date, audience jsonb NOT NULL DEFAULT '{}', active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  widget_key text NOT NULL, visible boolean NOT NULL DEFAULT true, favorite boolean NOT NULL DEFAULT false,
  position int NOT NULL DEFAULT 0, UNIQUE(tenant_id,user_id,widget_key)
);
CREATE TABLE IF NOT EXISTS tenant_themes (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id), primary_color text NOT NULL DEFAULT '#0d9c89',
  nav_color text NOT NULL DEFAULT '#0d1f3c', updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY; ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY; ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY; ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboard_preferences ENABLE ROW LEVEL SECURITY; ALTER TABLE tenant_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_role_permissions ON role_permissions USING (tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_service_types ON service_types USING (tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_equipment_types ON equipment_types USING (tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_schedules ON maintenance_schedules USING (tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_announcements ON announcements USING (tenant_id IS NULL OR tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_trainings ON trainings USING (tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_dashboard_prefs ON user_dashboard_preferences USING (tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_themes_policy ON tenant_themes USING (tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);

INSERT INTO service_types(tenant_id,name) SELECT id,'Limpeza' FROM tenants ON CONFLICT DO NOTHING;
INSERT INTO service_types(tenant_id,name) SELECT id,'Preventiva' FROM tenants ON CONFLICT DO NOTHING;
INSERT INTO service_types(tenant_id,name) SELECT id,'Troca de equipamento' FROM tenants ON CONFLICT DO NOTHING;
INSERT INTO service_types(tenant_id,name) SELECT id,'Substituicao' FROM tenants ON CONFLICT DO NOTHING;
INSERT INTO equipment_types(tenant_id,name) SELECT id,'Computador' FROM tenants ON CONFLICT DO NOTHING;
INSERT INTO equipment_types(tenant_id,name) SELECT id,'Impressora' FROM tenants ON CONFLICT DO NOTHING;
INSERT INTO equipment_types(tenant_id,name) SELECT id,'Monitor' FROM tenants ON CONFLICT DO NOTHING;
INSERT INTO equipment_types(tenant_id,name) SELECT id,'CNC' FROM tenants ON CONFLICT DO NOTHING;
INSERT INTO equipment_types(tenant_id,name) SELECT id,'Plotter' FROM tenants ON CONFLICT DO NOTHING;

-- Administradores sao sempre liberados em todos os modulos conhecidos.
INSERT INTO role_permissions(tenant_id,role,module,can_view,can_create,can_edit,can_delete)
SELECT t.id,'ADMIN',m,true,true,true,true FROM tenants t CROSS JOIN (VALUES('DASHBOARD'),('TICKETS'),('WORK_ORDERS'),('MAINTENANCE'),('STOCK'),('SAFETY'),('ADMINISTRATION')) modules(m)
ON CONFLICT (tenant_id,role,module) DO UPDATE SET can_view=true,can_create=true,can_edit=true,can_delete=true;
