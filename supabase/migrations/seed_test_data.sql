-- ==============================================================
-- SEED DATA - DADOS DE TESTE PARA ADMIN DASHBOARD
-- Cria 35 barbearias: 20 Free, 10 Pro, 5 Enterprise
-- Com barbeiros e agendamentos para cada uma
-- ==============================================================

-- Limpar dados antigos de teste (opcional - descomente se quiser resetar)
-- DELETE FROM "Appointments" WHERE barbershopId LIKE 'test-%';
-- DELETE FROM "Barbers" WHERE barbershopId LIKE 'test-%';
-- DELETE FROM "Services" WHERE barbershopId LIKE 'test-%';
-- DELETE FROM "Barbershops" WHERE id LIKE 'test-%';

-- ==============================================================
-- CRIAR BARBEARIAS - PLANO FREE (20)
-- ==============================================================

INSERT INTO "Barbershops" (id, name, slug, owner_email, plan_type, plan_status, created_at, updated_at) VALUES
('test-free-01', 'Barbearia do João', 'barbearia-joao', 'joao@teste.com', 'free', 'active', NOW() - INTERVAL '60 days', NOW()),
('test-free-02', 'Corte & Estilo', 'corte-estilo', 'marcos@teste.com', 'free', 'active', NOW() - INTERVAL '45 days', NOW()),
('test-free-03', 'Barbearia Vintage', 'barbearia-vintage', 'pedro@teste.com', 'free', 'active', NOW() - INTERVAL '30 days', NOW()),
('test-free-04', 'Studio Hair Men', 'studio-hair-men', 'carlos@teste.com', 'free', 'active', NOW() - INTERVAL '25 days', NOW()),
('test-free-05', 'Barbearia Central', 'barbearia-central', 'andre@teste.com', 'free', 'active', NOW() - INTERVAL '20 days', NOW()),
('test-free-06', 'Navalha de Ouro', 'navalha-ouro', 'lucas@teste.com', 'free', 'active', NOW() - INTERVAL '18 days', NOW()),
('test-free-07', 'Barbearia Top', 'barbearia-top', 'rafael@teste.com', 'free', 'active', NOW() - INTERVAL '15 days', NOW()),
('test-free-08', 'Corte Certo', 'corte-certo', 'bruno@teste.com', 'free', 'active', NOW() - INTERVAL '14 days', NOW()),
('test-free-09', 'Barbearia Moderna', 'barbearia-moderna', 'paulo@teste.com', 'free', 'active', NOW() - INTERVAL '12 days', NOW()),
('test-free-10', 'Salão do Bigode', 'salao-bigode', 'thiago@teste.com', 'free', 'active', NOW() - INTERVAL '10 days', NOW()),
('test-free-11', 'Barbearia Express', 'barbearia-express', 'felipe@teste.com', 'free', 'active', NOW() - INTERVAL '9 days', NOW()),
('test-free-12', 'Cortes Premium', 'cortes-premium', 'gustavo@teste.com', 'free', 'active', NOW() - INTERVAL '8 days', NOW()),
('test-free-13', 'Barbearia Clássica', 'barbearia-classica', 'rodrigo@teste.com', 'free', 'active', NOW() - INTERVAL '7 days', NOW()),
('test-free-14', 'Studio do Barbeiro', 'studio-barbeiro', 'fernando@teste.com', 'free', 'active', NOW() - INTERVAL '6 days', NOW()),
('test-free-15', 'Navalha Afiada', 'navalha-afiada', 'daniel@teste.com', 'free', 'active', NOW() - INTERVAL '5 days', NOW()),
('test-free-16', 'Barbearia Elegance', 'barbearia-elegance', 'leandro@teste.com', 'free', 'active', NOW() - INTERVAL '4 days', NOW()),
('test-free-17', 'Corte Show', 'corte-show', 'william@teste.com', 'free', 'active', NOW() - INTERVAL '3 days', NOW()),
('test-free-18', 'Barbearia Style', 'barbearia-style', 'matheus@teste.com', 'free', 'active', NOW() - INTERVAL '2 days', NOW()),
('test-free-19', 'Hair Master', 'hair-master', 'vinicius@teste.com', 'free', 'active', NOW() - INTERVAL '1 day', NOW()),
('test-free-20', 'Barbearia Prime', 'barbearia-prime', 'ricardo@teste.com', 'free', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==============================================================
-- CRIAR BARBEARIAS - PLANO PRO (10)
-- ==============================================================

INSERT INTO "Barbershops" (id, name, slug, owner_email, plan_type, plan_status, created_at, updated_at) VALUES
('test-pro-01', 'Barbearia Premium SP', 'barbearia-premium-sp', 'premium.sp@teste.com', 'pro', 'active', NOW() - INTERVAL '90 days', NOW()),
('test-pro-02', 'Elite Barber', 'elite-barber', 'elite@teste.com', 'pro', 'active', NOW() - INTERVAL '75 days', NOW()),
('test-pro-03', 'The Gentleman', 'the-gentleman', 'gentleman@teste.com', 'pro', 'active', NOW() - INTERVAL '60 days', NOW()),
('test-pro-04', 'Barbearia Luxo', 'barbearia-luxo', 'luxo@teste.com', 'pro', 'active', NOW() - INTERVAL '50 days', NOW()),
('test-pro-05', 'Royal Barber Shop', 'royal-barber', 'royal@teste.com', 'pro', 'active', NOW() - INTERVAL '40 days', NOW()),
('test-pro-06', 'Classic Cuts Pro', 'classic-cuts-pro', 'classic.pro@teste.com', 'pro', 'active', NOW() - INTERVAL '35 days', NOW()),
('test-pro-07', 'Barber King', 'barber-king', 'king@teste.com', 'pro', 'active', NOW() - INTERVAL '30 days', NOW()),
('test-pro-08', 'Victory Barber', 'victory-barber', 'victory@teste.com', 'pro', 'active', NOW() - INTERVAL '25 days', NOW()),
('test-pro-09', 'Prestige Hair', 'prestige-hair', 'prestige@teste.com', 'pro', 'active', NOW() - INTERVAL '20 days', NOW()),
('test-pro-10', 'Diamond Cuts', 'diamond-cuts', 'diamond@teste.com', 'pro', 'active', NOW() - INTERVAL '15 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ==============================================================
-- CRIAR BARBEARIAS - PLANO ENTERPRISE (5)
-- ==============================================================

INSERT INTO "Barbershops" (id, name, slug, owner_email, plan_type, plan_status, created_at, updated_at) VALUES
('test-ent-01', 'Rede Barbearias Brasil', 'rede-barbearias-brasil', 'rede.brasil@teste.com', 'enterprise', 'active', NOW() - INTERVAL '120 days', NOW()),
('test-ent-02', 'Grupo Imperial Barber', 'grupo-imperial', 'imperial@teste.com', 'enterprise', 'active', NOW() - INTERVAL '100 days', NOW()),
('test-ent-03', 'Franchise Cuts', 'franchise-cuts', 'franchise@teste.com', 'enterprise', 'active', NOW() - INTERVAL '80 days', NOW()),
('test-ent-04', 'Mega Barber Network', 'mega-barber', 'mega@teste.com', 'enterprise', 'active', NOW() - INTERVAL '60 days', NOW()),
('test-ent-05', 'Supreme Barber Chain', 'supreme-chain', 'supreme@teste.com', 'enterprise', 'active', NOW() - INTERVAL '45 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ==============================================================
-- CRIAR BARBEIROS PARA CADA BARBEARIA
-- Free: 1 barbeiro cada, Pro: 3-5 cada, Enterprise: 8-10 cada
-- ==============================================================

-- Barbeiros Free (1 por barbearia)
INSERT INTO "Barbers" (id, "barbershopId", name, phone, is_active, created_at) 
SELECT 
    'barb-free-' || row_number() OVER (),
    b.id,
    'Barbeiro ' || row_number() OVER (),
    '11999990' || LPAD((row_number() OVER ())::text, 3, '0'),
    true,
    NOW()
FROM "Barbershops" b WHERE b.id LIKE 'test-free-%'
ON CONFLICT (id) DO NOTHING;

-- Barbeiros Pro (3 por barbearia = 30 total)
DO $$
DECLARE
    barb_shop RECORD;
    i INT;
BEGIN
    FOR barb_shop IN SELECT id FROM "Barbershops" WHERE id LIKE 'test-pro-%' LOOP
        FOR i IN 1..3 LOOP
            INSERT INTO "Barbers" (id, "barbershopId", name, phone, is_active, created_at)
            VALUES (
                'barb-pro-' || barb_shop.id || '-' || i,
                barb_shop.id,
                'Barbeiro Pro ' || i,
                '11988880' || LPAD(i::text, 3, '0'),
                true,
                NOW()
            )
            ON CONFLICT (id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Barbeiros Enterprise (8 por barbearia = 40 total)
DO $$
DECLARE
    barb_shop RECORD;
    i INT;
BEGIN
    FOR barb_shop IN SELECT id FROM "Barbershops" WHERE id LIKE 'test-ent-%' LOOP
        FOR i IN 1..8 LOOP
            INSERT INTO "Barbers" (id, "barbershopId", name, phone, is_active, created_at)
            VALUES (
                'barb-ent-' || barb_shop.id || '-' || i,
                barb_shop.id,
                'Barbeiro Enterprise ' || i,
                '11977770' || LPAD(i::text, 3, '0'),
                true,
                NOW()
            )
            ON CONFLICT (id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ==============================================================
-- CRIAR SERVIÇOS PADRÃO PARA CADA BARBEARIA
-- ==============================================================

INSERT INTO "Services" (id, "barbershopId", name, price, duration, is_active, created_at)
SELECT 
    'svc-' || b.id || '-corte',
    b.id,
    'Corte de Cabelo',
    35.00,
    30,
    true,
    NOW()
FROM "Barbershops" b WHERE b.id LIKE 'test-%'
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Services" (id, "barbershopId", name, price, duration, is_active, created_at)
SELECT 
    'svc-' || b.id || '-barba',
    b.id,
    'Barba',
    25.00,
    20,
    true,
    NOW()
FROM "Barbershops" b WHERE b.id LIKE 'test-%'
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Services" (id, "barbershopId", name, price, duration, is_active, created_at)
SELECT 
    'svc-' || b.id || '-combo',
    b.id,
    'Corte + Barba',
    50.00,
    45,
    true,
    NOW()
FROM "Barbershops" b WHERE b.id LIKE 'test-%'
ON CONFLICT (id) DO NOTHING;

-- ==============================================================
-- CRIAR AGENDAMENTOS PARA SIMULAR ATIVIDADE
-- Free: 5-10 agendamentos, Pro: 30-50, Enterprise: 100+
-- ==============================================================

-- Agendamentos para barbearias Free
DO $$
DECLARE
    barb_shop RECORD;
    barber_id TEXT;
    i INT;
BEGIN
    FOR barb_shop IN SELECT id FROM "Barbershops" WHERE id LIKE 'test-free-%' LOOP
        -- Buscar barbeiro da barbearia
        SELECT id INTO barber_id FROM "Barbers" WHERE "barbershopId" = barb_shop.id LIMIT 1;
        
        IF barber_id IS NOT NULL THEN
            FOR i IN 1..10 LOOP
                INSERT INTO "Appointments" (id, "barbershopId", "barberId", "clientName", "clientPhone", date, time, status, created_at)
                VALUES (
                    'apt-free-' || barb_shop.id || '-' || i,
                    barb_shop.id,
                    barber_id,
                    'Cliente Free ' || i,
                    '11966660' || LPAD(i::text, 3, '0'),
                    CURRENT_DATE - (random() * 30)::int,
                    (9 + (random() * 9)::int)::text || ':00',
                    CASE WHEN random() > 0.3 THEN 'completed' ELSE 'pending' END,
                    NOW() - (random() * 30 || ' days')::interval
                )
                ON CONFLICT (id) DO NOTHING;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Agendamentos para barbearias Pro (40 cada)
DO $$
DECLARE
    barb_shop RECORD;
    barber_rec RECORD;
    i INT;
BEGIN
    FOR barb_shop IN SELECT id FROM "Barbershops" WHERE id LIKE 'test-pro-%' LOOP
        FOR barber_rec IN SELECT id FROM "Barbers" WHERE "barbershopId" = barb_shop.id LOOP
            FOR i IN 1..15 LOOP
                INSERT INTO "Appointments" (id, "barbershopId", "barberId", "clientName", "clientPhone", date, time, status, created_at)
                VALUES (
                    'apt-pro-' || barber_rec.id || '-' || i,
                    barb_shop.id,
                    barber_rec.id,
                    'Cliente Pro ' || i,
                    '11955550' || LPAD(i::text, 3, '0'),
                    CURRENT_DATE - (random() * 30)::int,
                    (9 + (random() * 9)::int)::text || ':00',
                    CASE WHEN random() > 0.2 THEN 'completed' ELSE 'pending' END,
                    NOW() - (random() * 30 || ' days')::interval
                )
                ON CONFLICT (id) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Agendamentos para barbearias Enterprise (100+ cada)
DO $$
DECLARE
    barb_shop RECORD;
    barber_rec RECORD;
    i INT;
BEGIN
    FOR barb_shop IN SELECT id FROM "Barbershops" WHERE id LIKE 'test-ent-%' LOOP
        FOR barber_rec IN SELECT id FROM "Barbers" WHERE "barbershopId" = barb_shop.id LOOP
            FOR i IN 1..15 LOOP
                INSERT INTO "Appointments" (id, "barbershopId", "barberId", "clientName", "clientPhone", date, time, status, created_at)
                VALUES (
                    'apt-ent-' || barber_rec.id || '-' || i,
                    barb_shop.id,
                    barber_rec.id,
                    'Cliente Enterprise ' || i,
                    '11944440' || LPAD(i::text, 3, '0'),
                    CURRENT_DATE - (random() * 30)::int,
                    (9 + (random() * 9)::int)::text || ':00',
                    CASE WHEN random() > 0.15 THEN 'completed' ELSE 'pending' END,
                    NOW() - (random() * 30 || ' days')::interval
                )
                ON CONFLICT (id) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- ==============================================================
-- VERIFICAÇÃO FINAL
-- ==============================================================

SELECT 'Barbearias por plano:' as info;
SELECT plan_type, COUNT(*) as total 
FROM "Barbershops" 
WHERE id LIKE 'test-%'
GROUP BY plan_type;

SELECT 'Total de barbeiros:' as info, COUNT(*) as total FROM "Barbers" WHERE id LIKE 'barb-%';
SELECT 'Total de agendamentos:' as info, COUNT(*) as total FROM "Appointments" WHERE id LIKE 'apt-%';

-- ==============================================================
-- RESUMO ESPERADO:
-- - 35 Barbearias (20 Free + 10 Pro + 5 Enterprise)
-- - ~90 Barbeiros (20 + 30 + 40)
-- - ~1300 Agendamentos (200 + 450 + 600)
-- ==============================================================
