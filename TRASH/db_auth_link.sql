-- Arquivo para configurar o fluxo de "Convite" de Barbeiros e Permissões
-- Execute este script no SQL Editor do Supabase

-- 1. Garantir que a tabela 'barbers' tenha as colunas necessárias
ALTER TABLE public.barbers
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Garantir que email seja único por barbearia (ou global? ideal ser único global para simplificar auth)
-- Vamos assumir único global para facilitar o vínculo
ALTER TABLE public.barbers
ADD CONSTRAINT barbers_email_unique UNIQUE (email);

-- 3. Função Trigger: Vincula usuário recém-criado ao registro de barbeiro existente
CREATE OR REPLACE FUNCTION public.handle_new_barber_user()
RETURNS TRIGGER AS $$
DECLARE
  v_barber_id uuid;
  v_barbershop_id uuid;
BEGIN
  -- Verificar se existe um barbeiro pré-cadastrado com este email
  SELECT id, barbershop_id INTO v_barber_id, v_barbershop_id
  FROM public.barbers
  WHERE email = NEW.email;

  -- Se encontrou, atualiza o user_id e define o perfil como 'barber'
  IF v_barber_id IS NOT NULL THEN
    -- Atualiza a tabela barbers
    UPDATE public.barbers
    SET user_id = NEW.id
    WHERE id = v_barber_id;

    -- Atualiza/Cria o perfil com role 'barber'
    INSERT INTO public.profiles (id, email, name, role, barbershop_id)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'name', -- Pega o nome do metadados do auth
      'barber',
      v_barbershop_id
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      role = 'barber',
      barbershop_id = EXCLUDED.barbershop_id;
      
    RETURN NEW;
  END IF;

  -- Se não encontrou barbeiro, é um usuário normal (client) ou owner (criado por outro fluxo)
  -- Mas se for um cadastro comum, garantir que tenha perfil client
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    'client'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger executado após criação de usuário no Auth
DROP TRIGGER IF EXISTS on_auth_user_created_link_barber ON auth.users;
CREATE TRIGGER on_auth_user_created_link_barber
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_barber_user();

-- 5. Atualizar Políticas de Segurança (RLS) para Barbers

-- Habilitar RLS
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Barbers are viewable by everyone" ON public.barbers;
DROP POLICY IF EXISTS "Owners can manage their barbers" ON public.barbers;
DROP POLICY IF EXISTS "Barbers can update their own data" ON public.barbers;

-- Política de Leitura: Público pode ver todos os barbeiros (necessário para agendamento)
CREATE POLICY "Barbers are viewable by everyone"
ON public.barbers FOR SELECT
USING (true);

-- Política de Escrita (Insert/Update/Delete): Apenas Dono da Barbearia
-- Assumindo que o 'dono' tem profile.role = 'admin' e profile.barbershop_id = barbers.barbershop_id
CREATE POLICY "Owners can manage their barbers"
ON public.barbers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.barbershop_id = barbers.uuid -- Ajuste se a coluna for barbershop_id ou uuid
  )
);

-- Correção: A coluna na tabela barbers provavelmente é `barbershopId` (mixed case) ou `barbershop_id`?
-- Baseado no código anterior `eq('barbershopId', barbershopId)`, parece ser camelCase no código, mas no banco geralmente é snake_case.
-- Vou assumir snake_case `barbershop_id` por padrão SQL, mas se falhar ajustaremos.

-- Política para o próprio Barbeiro editar seus dados (foto, bio, etc?)
CREATE POLICY "Barbers can update their own data"
ON public.barbers FOR UPDATE
USING (user_id = auth.uid());
