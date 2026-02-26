-- ==============================================================
-- CORREÇÃO DE ERROS NA CRIAÇÃO DE USUÁRIOS
-- Garante que a tabela profiles existe e o trigger é robusto
-- ==============================================================

-- 1. Garantir que a tabela profiles existe com a estrutura correta
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  name VARCHAR(255),
  username VARCHAR(255),
  role VARCHAR(50) DEFAULT 'owner',
  barbershop_id VARCHAR(255), -- Referência à barbearia (pode ser nulo inicialmente)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Garantir que barbershop_id pode ser NULO (causa comum de erro no trigger)
DO $$
BEGIN
    ALTER TABLE public.profiles ALTER COLUMN barbershop_id DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignora se coluna não existir
END $$;

-- 3. Melhorar o Trigger para ser mais robusto e não travar o cadastro (erro 500)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, name, username, role, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      'owner', -- Default role
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
      
  EXCEPTION WHEN OTHERS THEN
    -- Loga o erro mas NÃO aborta a transação, permitindo que o usuário seja criado no Auth
    RAISE WARNING 'Falha ao criar perfil para usuário %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Habilitar RLS na tabela profiles (segurança)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Garantir políticas de acesso básicas
DROP POLICY IF EXISTS "profiles_own_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_insert" ON public.profiles;

CREATE POLICY "profiles_own_read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
