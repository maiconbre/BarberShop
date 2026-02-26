-- Arquivo para correção do banco de dados Supabase
-- Execute este script no SQL Editor do seu painel Supabase

-- 1. Remover a foreign key incorreta que aponta para uma tabela 'users' pública inexistente
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Adicionar a foreign key correta apontando para auth.users (onde os usuários do Supabase realmente ficam)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 3. Garantir que a tabela profiles tenha as colunas necessárias
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'client',
ADD COLUMN IF NOT EXISTS barbershop_id uuid REFERENCES public."Barbershops"(id) ON DELETE SET NULL;

-- 4. Habilitar RLS (Row Level Security) se não estiver habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de segurança simplificadas para facilitar o desenvolvimento
-- (Permite que usuários leiam/criem seus próprios perfis e donos leiam perfis da sua barbearia)

-- Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Política de Leitura Pública (simplificado para funcionar o login sem travas)
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Política de Inserção (o usuário pode criar seu próprio perfil)
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Política de Atualização (o usuário pode editar seu próprio perfil)
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 6. Garantir permissões de acesso
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
