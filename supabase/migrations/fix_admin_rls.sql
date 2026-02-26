-- ==============================================================
-- CORRIGIR POLICY RLS DE ADMIN_USERS
-- Executar este SQL para corrigir recursão infinita
-- ==============================================================

-- Remover policy problemática
DROP POLICY IF EXISTS "super_admin_manage_admins" ON "admin_users";

-- Criar policies corretas sem recursão

-- 1. Qualquer usuário autenticado pode ler seus próprios dados de admin
CREATE POLICY "users_read_own_admin_data"
    ON "admin_users"
    FOR SELECT
    USING (user_id = auth.uid());

-- 2. Super admins podem gerenciar outros admins
-- Mas precisamos de uma forma de verificar sem causar recursão
-- Solução: usar uma função SECURITY DEFINER

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agora criar policy que usa a função
CREATE POLICY "super_admin_manage_others"
    ON "admin_users"
    FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- ==============================================================
-- VERIFICAR SE FUNCIONOU
-- ==============================================================

-- Testar se consegue ler seus próprios dados
SELECT * FROM admin_users WHERE user_id = auth.uid();
