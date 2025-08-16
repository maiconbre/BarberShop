-- ========================================
-- DIAGNÓSTICO DO BANCO DE DADOS
-- ========================================
-- Execute para verificar o estado atual do banco

-- 1. Verificar se as tabelas existem
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('Barbershops', 'Users', 'Barbers', 'Services', 'Appointments', 'Comments', 'BarberServices')
ORDER BY table_name;

-- 2. Verificar estrutura das colunas de timestamp
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('Barbershops', 'Users', 'Barbers', 'Services', 'Appointments', 'Comments', 'BarberServices')
    AND column_name IN ('created_at', 'updated_at', 'createdAt', 'updatedAt')
ORDER BY table_name, column_name;

-- 3. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('Barbershops', 'Users', 'Barbers', 'Services', 'Appointments', 'Comments', 'BarberServices');

-- 4. Verificar políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public';

-- 5. Verificar funções customizadas
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND routine_name IN (
        'update_updated_at_column',
        'is_valid_email',
        'generate_unique_slug',
        'check_appointment_conflict',
        'get_barbershop_stats'
    );

-- 6. Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- 7. Verificar dados de teste (se existirem)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Barbershops') THEN
        RAISE NOTICE 'Verificando dados de teste...';
        
        -- Contar registros por tabela
        PERFORM (
            SELECT 
                'Barbershops: ' || COUNT(*) || ' registros'
            FROM "Barbershops"
        );
        
        PERFORM (
            SELECT 
                'Users: ' || COUNT(*) || ' registros'
            FROM "Users"
        );
        
        -- Verificar se usuários de teste existem
        IF EXISTS (SELECT 1 FROM "Users" WHERE username IN ('admin_free', 'admin_pro')) THEN
            RAISE NOTICE 'Usuários de teste encontrados: admin_free, admin_pro';
        ELSE
            RAISE NOTICE 'Usuários de teste NÃO encontrados';
        END IF;
        
    ELSE
        RAISE NOTICE 'Tabela Barbershops não existe - execute o schema primeiro';
    END IF;
END $$;

-- 8. Verificar índices
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN ('Barbershops', 'Users', 'Barbers', 'Services', 'Appointments', 'Comments', 'BarberServices')
ORDER BY tablename, indexname;

-- ========================================
-- DIAGNÓSTICO COMPLETO
-- ========================================
SELECT 'Diagnóstico executado com sucesso!' as status;