-- ==============================================================
-- MIGRATIONS PARA SISTEMA DE PLANOS E ADMIN
-- ==============================================================

-- ==============================================================
-- 1. ADICIONAR CAMPOS DE PLANO À TABELA BARBERSHOPS
-- ==============================================================

-- Adicionar campos relacionados a planos
ALTER TABLE "Barbershops" 
ADD COLUMN IF NOT EXISTS "plan_status" VARCHAR(50) DEFAULT 'active' 
  CHECK ("plan_status" IN ('active', 'suspended', 'cancelled', 'trial')),
ADD COLUMN IF NOT EXISTS "trial_ends_at" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "subscription_id" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "payment_status" VARCHAR(50) DEFAULT 'pending'
  CHECK ("payment_status" IN ('pending', 'active', 'failed', 'cancelled'));

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "barbershops_plan_type_idx" ON "Barbershops"("plan_type");
CREATE INDEX IF NOT EXISTS "barbershops_plan_status_idx" ON "Barbershops"("plan_status");
CREATE INDEX IF NOT EXISTS "barbershops_payment_status_idx" ON "Barbershops"("payment_status");

-- ==============================================================
-- 2. TABELA DE MÉTRICAS DE USO
-- ==============================================================

CREATE TABLE IF NOT EXISTS "usage_metrics" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "barbershop_id" VARCHAR(255) REFERENCES "Barbershops"("id") ON DELETE CASCADE,
  "metric_type" VARCHAR(100) NOT NULL CHECK ("metric_type" IN ('barbers', 'appointments', 'services', 'storage')),
  "count" INTEGER DEFAULT 0,
  "period_start" TIMESTAMP WITH TIME ZONE NOT NULL,
  "period_end" TIMESTAMP WITH TIME ZONE NOT NULL,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "usage_metrics_barbershop_idx" ON "usage_metrics"("barbershop_id");
CREATE INDEX IF NOT EXISTS "usage_metrics_type_idx" ON "usage_metrics"("metric_type");
CREATE INDEX IF NOT EXISTS "usage_metrics_period_idx" ON "usage_metrics"("period_start", "period_end");

-- ==============================================================
-- 3. TABELA DE ADMIN USERS
-- ==============================================================

CREATE TABLE IF NOT EXISTS "admin_users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "role" VARCHAR(50) DEFAULT 'support' CHECK ("role" IN ('super_admin', 'admin', 'support')),
  "permissions" JSONB DEFAULT '{}',
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("user_id")
);

CREATE INDEX IF NOT EXISTS "admin_users_user_id_idx" ON "admin_users"("user_id");
CREATE INDEX IF NOT EXISTS "admin_users_role_idx" ON "admin_users"("role");

-- ==============================================================
-- 4. TABELA DE AUDIT LOGS
-- ==============================================================

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "admin_user_id" UUID REFERENCES "admin_users"("id"),
  "action" VARCHAR(100) NOT NULL,
  "resource_type" VARCHAR(50),
  "resource_id" VARCHAR(255),
  "changes" JSONB,
  "ip_address" VARCHAR(50),
  "user_agent" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "audit_logs_admin_idx" ON "audit_logs"("admin_user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_resource_idx" ON "audit_logs"("resource_type", "resource_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_idx" ON "audit_logs"("created_at");

-- ==============================================================
-- 5. TABELA DE MÉTRICAS GLOBAIS
-- ==============================================================

CREATE TABLE IF NOT EXISTS "global_metrics" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "metric_date" DATE NOT NULL UNIQUE,
  "total_barbershops" INTEGER DEFAULT 0,
  "active_barbershops" INTEGER DEFAULT 0,
  "trial_barbershops" INTEGER DEFAULT 0,
  "free_plan_count" INTEGER DEFAULT 0,
  "pro_plan_count" INTEGER DEFAULT 0,
  "enterprise_plan_count" INTEGER DEFAULT 0,
  "total_appointments" INTEGER DEFAULT 0,
  "total_barbers" INTEGER DEFAULT 0,
  "total_services" INTEGER DEFAULT 0,
  "revenue" DECIMAL(10,2) DEFAULT 0,
  "mrr" DECIMAL(10,2) DEFAULT 0,
  "churn_rate" DECIMAL(5,2) DEFAULT 0,
  "metrics" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "global_metrics_date_idx" ON "global_metrics"("metric_date" DESC);

-- ==============================================================
-- 6. TABELA DE TRANSAÇÕES DE PAGAMENTO (FUTURO)
-- ==============================================================

CREATE TABLE IF NOT EXISTS "payment_transactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "barbershop_id" VARCHAR(255) REFERENCES "Barbershops"("id"),
  "subscription_id" VARCHAR(255),
  "transaction_type" VARCHAR(50) NOT NULL CHECK ("transaction_type" IN ('subscription', 'upgrade', 'downgrade', 'refund')),
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" VARCHAR(3) DEFAULT 'BRL',
  "status" VARCHAR(50) DEFAULT 'pending' CHECK ("status" IN ('pending', 'completed', 'failed', 'refunded')),
  "payment_method" VARCHAR(50),
  "external_id" VARCHAR(255),
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "payment_transactions_barbershop_idx" ON "payment_transactions"("barbershop_id");
CREATE INDEX IF NOT EXISTS "payment_transactions_status_idx" ON "payment_transactions"("status");
CREATE INDEX IF NOT EXISTS "payment_transactions_created_idx" ON "payment_transactions"("created_at" DESC);

-- ==============================================================
-- 7. TRIGGER PARA UPDATED_AT
-- ==============================================================

-- Aplicar trigger de updated_at nas novas tabelas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_usage_metrics_updated_at') THEN
        CREATE TRIGGER update_usage_metrics_updated_at 
        BEFORE UPDATE ON "usage_metrics" 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_admin_users_updated_at') THEN
        CREATE TRIGGER update_admin_users_updated_at 
        BEFORE UPDATE ON "admin_users" 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_global_metrics_updated_at') THEN
        CREATE TRIGGER update_global_metrics_updated_at 
        BEFORE UPDATE ON "global_metrics" 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_transactions_updated_at') THEN
        CREATE TRIGGER update_payment_transactions_updated_at 
        BEFORE UPDATE ON "payment_transactions" 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ==============================================================
-- 8. RLS POLICIES PARA ADMIN
-- ==============================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "global_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usage_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_transactions" ENABLE ROW LEVEL SECURITY;

-- Policies para admin_users (apenas super admins podem gerenciar)
CREATE POLICY "super_admin_manage_admins"
    ON "admin_users"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "admin_users" 
            WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
        )
    );

-- Policies para audit_logs (admins podem ler)
CREATE POLICY "admins_read_audit_logs"
    ON "audit_logs"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "admin_users" 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "system_insert_audit_logs"
    ON "audit_logs"
    FOR INSERT
    WITH CHECK (true); -- Sistema pode inserir logs

-- Policies para global_metrics (admins podem ler)
CREATE POLICY "admins_read_global_metrics"
    ON "global_metrics"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "admin_users" 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Policies para usage_metrics (owners veem da própria barbearia, admins veem tudo)
CREATE POLICY "owners_read_own_usage"
    ON "usage_metrics"
    FOR SELECT
    USING (
        barbershop_id IN (
            SELECT id FROM "Barbershops" WHERE owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM "admin_users" 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- ==============================================================
-- 9. FUNÇÃO PARA CALCULAR MÉTRICAS GLOBAIS
-- ==============================================================

CREATE OR REPLACE FUNCTION calculate_daily_metrics()
RETURNS void AS $$
DECLARE
    today DATE := CURRENT_DATE;
    total_shops INTEGER;
    active_shops INTEGER;
    trial_shops INTEGER;
    free_count INTEGER;
    pro_count INTEGER;
    enterprise_count INTEGER;
BEGIN
    -- Contar barbearias
    SELECT COUNT(*) INTO total_shops FROM "Barbershops";
    SELECT COUNT(*) INTO active_shops FROM "Barbershops" WHERE plan_status = 'active';
    SELECT COUNT(*) INTO trial_shops FROM "Barbershops" WHERE plan_status = 'trial';
    
    -- Contar por plano
    SELECT COUNT(*) INTO free_count FROM "Barbershops" WHERE plan_type = 'free' AND plan_status = 'active';
    SELECT COUNT(*) INTO pro_count FROM "Barbershops" WHERE plan_type = 'pro' AND plan_status = 'active';
    SELECT COUNT(*) INTO enterprise_count FROM "Barbershops" WHERE plan_type = 'enterprise' AND plan_status = 'active';
    
    -- Inserir ou atualizar métricas
    INSERT INTO "global_metrics" (
        metric_date,
        total_barbershops,
        active_barbershops,
        trial_barbershops,
        free_plan_count,
        pro_plan_count,
        enterprise_plan_count
    ) VALUES (
        today,
        total_shops,
        active_shops,
        trial_shops,
        free_count,
        pro_count,
        enterprise_count
    )
    ON CONFLICT (metric_date) DO UPDATE SET
        total_barbershops = EXCLUDED.total_barbershops,
        active_barbershops = EXCLUDED.active_barbershops,
        trial_barbershops = EXCLUDED.trial_barbershops,
        free_plan_count = EXCLUDED.free_plan_count,
        pro_plan_count = EXCLUDED.pro_plan_count,
        enterprise_plan_count = EXCLUDED.enterprise_plan_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ==============================================================
-- COMENTÁRIOS
-- ==============================================================
-- Execute este script no Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/aefnjlhnjzirevxgeaqy/sql
