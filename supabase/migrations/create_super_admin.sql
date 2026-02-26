-- ==============================================================
-- CRIAR USUÁRIO SUPER ADMIN
-- Execute este script APENAS UMA VEZ
-- ==============================================================

-- PASSO 1: Criar usuário no Supabase Auth
-- IMPORTANTE: Substitua os valores abaixo com suas credenciais

-- Email: admin@barbershop.com
-- Senha: (você definirá abaixo)

-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/aefnjlhnjzirevxgeaqy/sql

-- ==============================================================
-- OPÇÃO 1: Via SQL (Recomendado)
-- ==============================================================

-- Criar o usuário admin no auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'maiconbre27@gmail.com', -- SEU EMAIL DE ADMIN
  crypt('mg884891', gen_salt('bf')), 
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Super Admin","role":"super_admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Pegar o ID do usuário recém-criado
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar o ID do usuário admin
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@barbershop.com';

  -- Criar perfil do admin
  INSERT INTO profiles (id, email, name, username, role, created_at, updated_at)
  VALUES (
    admin_user_id,
    'admin@barbershop.com',
    'Super Admin',
    'superadmin',
    'super_admin',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Adicionar à tabela admin_users
  INSERT INTO admin_users (user_id, role, is_active, permissions, created_at, updated_at)
  VALUES (
    admin_user_id,
    'super_admin',
    true,
    '{"full_access": true, "can_suspend": true, "can_delete": true}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Super Admin criado com sucesso! ID: %', admin_user_id;
END $$;

-- ==============================================================
-- OPÇÃO 2: Via Dashboard do Supabase (Mais Fácil)
-- ==============================================================

-- 1. Acesse: https://supabase.com/dashboard/project/aefnjlhnjzirevxgeaqy/auth/users
-- 2. Clique em "Add user" -> "Create new user"
-- 3. Preencha:
--    - Email: admin@barbershop.com
--    - Password: (sua senha segura)
--    - Auto Confirm User: ✅ Marcar
-- 4. Após criar, copie o User ID
-- 5. Execute o SQL abaixo substituindo YOUR_USER_ID:

/*
INSERT INTO admin_users (user_id, role, is_active, permissions)
VALUES (
  'YOUR_USER_ID', -- Colar o User ID aqui
  'super_admin',
  true,
  '{"full_access": true, "can_suspend": true, "can_delete": true}'::jsonb
);
*/

-- ==============================================================
-- VERIFICAR SE FOI CRIADO COM SUCESSO
-- ==============================================================

-- Verificar usuário
SELECT 
  u.id,
  u.email,
  u.created_at,
  au.role as admin_role,
  au.is_active
FROM auth.users u
LEFT JOIN admin_users au ON au.user_id = u.id
WHERE u.email = 'admin@barbershop.com';

-- ==============================================================
-- CREDENCIAIS DE ACESSO
-- ==============================================================

-- Email: admin@barbershop.com
-- Senha: (a que você definiu acima)
-- Rota de acesso: /admin/login

-- ==============================================================
-- IMPORTANTE - SEGURANÇA
-- ==============================================================

-- 1. Use uma senha FORTE (mínimo 12 caracteres)
-- 2. Combine letras maiúsculas, minúsculas, números e símbolos
-- 3. Exemplo: Adm!nB@rb3r$h0p2024
-- 4. NUNCA compartilhe essas credenciais
-- 5. Considere usar autenticação de 2 fatores (futuro)

-- ==============================================================
-- REMOVER ACESSO DE ADMIN (SE NECESSÁRIO)
-- ==============================================================

/*
-- Para remover um admin:
UPDATE admin_users 
SET is_active = false 
WHERE user_id = 'USER_ID_AQUI';

-- Para deletar completamente:
DELETE FROM admin_users WHERE user_id = 'USER_ID_AQUI';
*/
