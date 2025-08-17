-- ========================================
-- SEED INICIAL COM DUAS BARBEARIAS (FREE + PRO)
-- ========================================
-- Execute para popular o banco com dados de teste

-- 1. Inserir barbearia FREE
INSERT INTO "Barbershops" (
    "name", 
    "slug", 
    "owner_email", 
    "plan_type", 
    "settings"
) VALUES (
    'Barbearia Free',
    'barbearia-free',
    'free@exemplo.com',
    'free',
    '{
        "theme": "light",
        "notifications": true,
        "booking_advance_days": 15
    }'::jsonb
);

-- 2. Inserir barbearia PRO
INSERT INTO "Barbershops" (
    "name", 
    "slug", 
    "owner_email", 
    "plan_type", 
    "settings"
) VALUES (
    'Barbearia Pro',
    'barbearia-pro',
    'pro@exemplo.com',
    'pro',
    '{
        "theme": "dark",
        "notifications": true,
        "booking_advance_days": 30
    }'::jsonb
);

-- 3. Inserir usuários admin para cada barbearia
-- Senha: admin123 (hash bcrypt)
INSERT INTO "Users" ("username","password","role","name","barbershopId")
VALUES
(
    'admin_free',
    '$2a$10$wJzbROHOWaYz7x5mx.Rw0.DcgAGWwZ0D3bH3Pfu7trr.Fft.UtdDu', -- admin123
    'admin',
    'Administrador Free',
    (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-free')
),
(
    'admin_pro',
    '$2a$10$wJzbROHOWaYz7x5mx.Rw0.DcgAGWwZ0D3bH3Pfu7trr.Fft.UtdDu', -- admin123
    'admin',
    'Administrador Pro',
    (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-pro')
);

-- 4. Inserir barbeiros
-- FREE: apenas 1 barbeiro (limitação do plano)
INSERT INTO "Barbers" ("name","whatsapp","pix","userId","barbershopId")
VALUES (
    'Carlos Free',
    '11999990001',
    'carlos@free.com',
    (SELECT id FROM "Users" WHERE username = 'admin_free'),
    (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-free')
);

-- PRO: até 3 barbeiros
INSERT INTO "Barbers" ("name","whatsapp","pix","userId","barbershopId")
VALUES 
(
    'João Pro',
    '11999990002',
    'joao@pro.com',
    (SELECT id FROM "Users" WHERE username = 'admin_pro'),
    (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-pro')
),
(
    'Pedro Pro',
    '11999990003',
    'pedro@pro.com',
    (SELECT id FROM "Users" WHERE username = 'admin_pro'),
    (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-pro')
),
(
    'Lucas Pro',
    '11999990004',
    'lucas@pro.com',
    (SELECT id FROM "Users" WHERE username = 'admin_pro'),
    (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-pro')
);

-- 5. Inserir serviços padrão para cada barbearia
INSERT INTO "Services" ("name","price","barbershopId")
VALUES 
-- Free (serviços básicos)
('Corte Simples', 30.00, (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-free')),
('Barba', 20.00, (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-free')),

-- Pro (serviços premium)
('Corte Degradê', 50.00, (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-pro')),
('Barba Completa', 30.00, (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-pro')),
('Corte + Barba', 70.00, (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-pro')),
('Tratamento Capilar', 80.00, (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-pro'));

-- 6. Relacionar barbeiros aos serviços (automático para cada barbearia)
INSERT INTO "BarberServices" ("BarberId","ServiceId","barbershopId")
SELECT b.id, s.id, b."barbershopId"
FROM "Barbers" b
JOIN "Services" s ON s."barbershopId" = b."barbershopId";

-- 7. Inserir alguns agendamentos de exemplo
INSERT INTO "Appointments" (
    "clientName", "serviceName", "date", "time", "status", 
    "barberId", "barberName", "price", "wppclient", "barbershopId"
)
VALUES 
-- Agendamentos Free
(
    'Cliente Teste Free', 'Corte Simples', CURRENT_DATE + INTERVAL '1 day', '10:00', 'pending',
    (SELECT id FROM "Barbers" WHERE name = 'Carlos Free'),
    'Carlos Free', 30.00, '11999999001',
    (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-free')
),
-- Agendamentos Pro
(
    'Cliente Teste Pro', 'Corte Degradê', CURRENT_DATE + INTERVAL '2 days', '14:00', 'confirmed',
    (SELECT id FROM "Barbers" WHERE name = 'João Pro'),
    'João Pro', 50.00, '11999999002',
    (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-pro')
),
(
    'Cliente VIP Pro', 'Corte + Barba', CURRENT_DATE + INTERVAL '3 days', '16:00', 'pending',
    (SELECT id FROM "Barbers" WHERE name = 'Pedro Pro'),
    'Pedro Pro', 70.00, '11999999003',
    (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-pro')
);

-- 8. Comentários iniciais aprovados
INSERT INTO "Comments" ("name","comment","status","barbershopId")
VALUES 
('Cliente Satisfeito Free', 'Ótimo corte na barbearia Free! Preço justo.', 'approved',
    (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-free')
),
('Cliente VIP Pro', 'Serviço premium na barbearia Pro! Vale cada centavo.', 'approved',
    (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-pro')
),
('Maria Silva', 'Ambiente muito agradável e profissionais qualificados.', 'approved',
    (SELECT id FROM "Barbershops" WHERE slug = 'barbearia-pro')
);

-- ========================================
-- SEED COMPLETO EXECUTADO
-- ========================================
-- Dados de teste criados:
-- ✅ 2 Barbearias (Free + Pro)
-- ✅ 2 Usuários admin (admin_free / admin_pro)
-- ✅ 4 Barbeiros (1 Free + 3 Pro)
-- ✅ 6 Serviços (2 Free + 4 Pro)
-- ✅ 3 Agendamentos de exemplo
-- ✅ 3 Comentários aprovados
-- 
-- Credenciais de teste:
-- Free: admin_free / admin123
-- Pro: admin_pro / admin123

SELECT 'Seed inicial executado com sucesso (2 barbearias: Free + Pro)' as status;