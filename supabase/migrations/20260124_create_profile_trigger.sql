-- ==============================================================
-- TRIGGER PARA AUTO-CRIAÇÃO DE PERFIL
-- Garante que todo usuário do Auth tenha um perfil
-- ==============================================================

-- Função que será executada quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar perfil automaticamente para novo usuário
  INSERT INTO public.profiles (id, email, name, username, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), -- Usar nome do metadata ou email
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), -- Usar username do metadata ou email
    'owner', -- Novo usuário começa como owner (será atualizado depois do registro da barbearia)
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Evitar erro se o perfil já existir
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger se já existir (para re-execução segura)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger que executa a função quando um usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================
-- COMENTÁRIOS
-- ==============================================================
-- Este trigger garante que:
-- 1. Todo usuário criado no Auth.users automaticamente tem um perfil
-- 2. O perfil é criado com role 'owner' inicialmente
-- 3. O barbershop_id será preenchido posteriormente no registro da barbearia
-- 4. Evita erros 406 ao buscar perfis que não existem
