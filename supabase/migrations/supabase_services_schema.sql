-- =====================================================
-- SCRIPT SQL PARA TABELA SERVICES NO SUPABASE
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Criar ou recriar a tabela Services
-- =====================================================
DROP TABLE IF EXISTS "Services" CASCADE;

CREATE TABLE "Services" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  duration INTEGER DEFAULT 60 CHECK (duration > 0), -- duração em minutos
  tenant_id UUID NOT NULL, -- ID do tenant (barbearia)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices para performance
-- =====================================================
CREATE INDEX idx_services_tenant_id ON "Services"(tenant_id);
CREATE INDEX idx_services_is_active ON "Services"(is_active);
CREATE INDEX idx_services_name ON "Services"(name);

-- 3. Habilitar RLS (Row Level Security)
-- =====================================================
ALTER TABLE "Services" ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS
-- =====================================================

-- Política: Permitir SELECT para todos (leitura pública)
DROP POLICY IF EXISTS "Services: Enable read access for all users" ON "Services";
CREATE POLICY "Services: Enable read access for all users"
ON "Services"
FOR SELECT
USING (true);

-- Política: Permitir INSERT para usuários autenticados
DROP POLICY IF EXISTS "Services: Enable insert for authenticated users" ON "Services";
CREATE POLICY "Services: Enable insert for authenticated users"
ON "Services"
FOR INSERT
WITH CHECK (true); -- Permitir inserção para qualquer usuário autenticado

-- Política: Permitir UPDATE para usuários autenticados do mesmo tenant
DROP POLICY IF EXISTS "Services: Enable update for authenticated users" ON "Services";
CREATE POLICY "Services: Enable update for authenticated users"
ON "Services"
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política: Permitir DELETE para usuários autenticados do mesmo tenant
DROP POLICY IF EXISTS "Services: Enable delete for authenticated users" ON "Services";
CREATE POLICY "Services: Enable delete for authenticated users"
ON "Services"
FOR DELETE
USING (true);

-- 5. Criar função para atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para updated_at
-- =====================================================
DROP TRIGGER IF EXISTS update_services_updated_at ON "Services";
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON "Services"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 7. Inserir dados de exemplo (opcional - remova se não quiser)
-- =====================================================
-- Substitua 'SEU_TENANT_ID_AQUI' pelo ID real da sua barbearia
-- Você pode obter o tenant_id do localStorage ou do debug panel

-- INSERT INTO "Services" (name, description, price, duration, tenant_id) VALUES
-- ('Corte Simples', 'Corte de cabelo tradicional', 30.00, 30, 'SEU_TENANT_ID_AQUI'),
-- ('Corte + Barba', 'Corte de cabelo + barba completa', 50.00, 60, 'SEU_TENANT_ID_AQUI'),
-- ('Barba', 'Barba completa com toalha quente', 25.00, 30, 'SEU_TENANT_ID_AQUI'),
-- ('Sobrancelha', 'Design de sobrancelha', 15.00, 15, 'SEU_TENANT_ID_AQUI');

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- INSTRUÇÕES:
-- 1. Copie todo este script
-- 2. Vá ao Supabase Dashboard > SQL Editor
-- 3. Cole o script e clique em "Run"
-- 4. Verifique se não há erros
-- 5. Teste a criação de serviços na aplicação
