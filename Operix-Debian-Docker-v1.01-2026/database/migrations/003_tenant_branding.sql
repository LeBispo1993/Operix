CREATE TABLE IF NOT EXISTS tenant_branding (
    tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    logo_data text,
    background_data text,
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO tenant_branding(tenant_id)
SELECT id
FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;
