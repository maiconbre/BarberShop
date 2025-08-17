-- ========================================
-- FUNÇÕES E TRIGGERS UTILITÁRIOS
-- ========================================
-- Execute após criar o schema para adicionar funcionalidades automáticas

-- 1. Função para atualizar timestamps automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Criar triggers para atualização automática de timestamps
CREATE TRIGGER update_barbershops_updated_at 
    BEFORE UPDATE ON "Barbershops" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON "Users" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barbers_updated_at 
    BEFORE UPDATE ON "Barbers" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON "Services" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON "Appointments" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON "Comments" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barber_services_updated_at 
    BEFORE UPDATE ON "BarberServices" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Função para validar formato de email
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- 4. Função para gerar slug único
CREATE OR REPLACE FUNCTION generate_unique_slug(barbershop_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Converter nome para slug
    base_slug := lower(trim(regexp_replace(barbershop_name, '[^a-zA-Z0-9\s]', '', 'g')));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    
    final_slug := base_slug;
    
    -- Verificar se slug já existe e adicionar número se necessário
    WHILE EXISTS (SELECT 1 FROM "Barbershops" WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- 5. Função para verificar conflitos de agendamento
CREATE OR REPLACE FUNCTION check_appointment_conflict(
    p_barber_id UUID,
    p_date DATE,
    p_time VARCHAR(255),
    p_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM "Appointments"
        WHERE "barberId" = p_barber_id
        AND "date" = p_date
        AND "time" = p_time
        AND "status" != 'cancelled'
        AND (p_appointment_id IS NULL OR "id" != p_appointment_id)
    );
END;
$$ LANGUAGE plpgsql;

-- 6. Função para obter estatísticas da barbearia
CREATE OR REPLACE FUNCTION get_barbershop_stats(p_barbershop_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_barbers', (
            SELECT COUNT(*) FROM "Barbers" 
            WHERE "barbershopId" = p_barbershop_id
        ),
        'total_services', (
            SELECT COUNT(*) FROM "Services" 
            WHERE "barbershopId" = p_barbershop_id
        ),
        'total_appointments', (
            SELECT COUNT(*) FROM "Appointments" 
            WHERE "barbershopId" = p_barbershop_id
        ),
        'pending_appointments', (
            SELECT COUNT(*) FROM "Appointments" 
            WHERE "barbershopId" = p_barbershop_id 
            AND "status" = 'pending'
        ),
        'approved_comments', (
            SELECT COUNT(*) FROM "Comments" 
            WHERE "barbershopId" = p_barbershop_id 
            AND "status" = 'approved'
        ),
        'pending_comments', (
            SELECT COUNT(*) FROM "Comments" 
            WHERE "barbershopId" = p_barbershop_id 
            AND "status" = 'pending'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para validar email ao inserir barbearia
CREATE OR REPLACE FUNCTION validate_barbershop_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT is_valid_email(NEW.owner_email) THEN
        RAISE EXCEPTION 'Email inválido: %', NEW.owner_email;
    END IF;
    
    -- Gerar slug automaticamente se não fornecido
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_unique_slug(NEW.name);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_barbershop_before_insert
    BEFORE INSERT ON "Barbershops"
    FOR EACH ROW EXECUTE FUNCTION validate_barbershop_email();

-- 8. Trigger para prevenir conflitos de agendamento
CREATE OR REPLACE FUNCTION prevent_appointment_conflict()
RETURNS TRIGGER AS $$
BEGIN
    IF check_appointment_conflict(NEW."barberId", NEW."date", NEW."time", NEW."id") THEN
        RAISE EXCEPTION 'Conflito de agendamento: Barbeiro já possui agendamento neste horário';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_appointment_conflict_trigger
    BEFORE INSERT OR UPDATE ON "Appointments"
    FOR EACH ROW EXECUTE FUNCTION prevent_appointment_conflict();

-- ========================================
-- FUNÇÕES E TRIGGERS CONFIGURADOS
-- ========================================
-- Timestamps automáticos ativados
-- Validações de negócio implementadas
-- Funções utilitárias disponíveis