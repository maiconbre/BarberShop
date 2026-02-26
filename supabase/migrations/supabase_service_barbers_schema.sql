-- =====================================================
-- TABELA DE ASSOCIAÇÃO SERVIÇOS-BARBEIROS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Criar tabela de associação service_barbers
-- =====================================================
CREATE TABLE IF NOT EXISTS "service_barbers" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES "Services"(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES "tenants"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_id, barber_id)
);

-- 2. Criar índices para performance
-- =====================================================
CREATE INDEX idx_service_barbers_service_id ON "service_barbers"(service_id);
CREATE INDEX idx_service_barbers_barber_id ON "service_barbers"(barber_id);
CREATE INDEX idx_service_barbers_tenant_id ON "service_barbers"(tenant_id);

-- 3. Habilitar RLS (Row Level Security)
-- =====================================================
ALTER TABLE "service_barbers" ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS
-- =====================================================

-- Política: Permitir SELECT para todos (leitura pública)
DROP POLICY IF EXISTS "service_barbers: Enable read access for all users" ON "service_barbers";
CREATE POLICY "service_barbers: Enable read access for all users"
ON "service_barbers"
FOR SELECT
USING (true);

-- Política: Permitir INSERT para usuários autenticados
DROP POLICY IF EXISTS "service_barbers: Enable insert for authenticated users" ON "service_barbers";
CREATE POLICY "service_barbers: Enable insert for authenticated users"
ON "service_barbers"
FOR INSERT
WITH CHECK (true);

-- Política: Permitir UPDATE para usuários autenticados
DROP POLICY IF EXISTS "service_barbers: Enable update for authenticated users" ON "service_barbers";
CREATE POLICY "service_barbers: Enable update for authenticated users"
ON "service_barbers"
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política: Permitir DELETE para usuários autenticados
DROP POLICY IF EXISTS "service_barbers: Enable delete for authenticated users" ON "service_barbers";
CREATE POLICY "service_barbers: Enable delete for authenticated users"
ON "service_barbers"
FOR DELETE
USING (true);

-- 5. Criar trigger para updated_at
-- =====================================================
DROP TRIGGER IF EXISTS update_service_barbers_updated_at ON "service_barbers";
CREATE TRIGGER update_service_barbers_updated_at
BEFORE UPDATE ON "service_barbers"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. Criar função para obter barbeiros de um serviço
-- =====================================================
CREATE OR REPLACE FUNCTION get_service_barbers(p_service_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', b.id,
            'name', b.name,
            'phone', b.phone,
            'whatsapp', b.whatsapp,
            'specialty', b.specialty,
            'avatar_url', b.avatar_url,
            'is_active', b.is_active
        )
    )
    FROM "Barbers" b
    INNER JOIN "service_barbers" sb ON sb.barber_id = b.id
    WHERE sb.service_id = p_service_id AND b.is_active = true
    INTO result;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar função para obter serviços de um barbeiro
-- =====================================================
CREATE OR REPLACE FUNCTION get_barber_services(p_barber_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', s.id,
            'name', s.name,
            'description', s.description,
            'price', s.price,
            'duration', s.duration,
            'is_active', s.is_active
        )
    )
    FROM "Services" s
    INNER JOIN "service_barbers" sb ON sb.service_id = s.id
    WHERE sb.barber_id = p_barber_id AND s.is_active = true
    INTO result;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- INSTRUÇÕES:
-- 1. Copie todo este script
-- 2. Vá ao Supabase Dashboard > SQL Editor
-- 3. Cole o script e clique em "Run"
-- 4. Verifique se não há erros
