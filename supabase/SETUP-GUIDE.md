# Guia de Configuração Completa - Supabase

## 🚀 Configuração Rápida

### Pré-requisitos
- Conta no Supabase
- Projeto criado no Supabase Dashboard
- Acesso ao SQL Editor

### 🔧 Problema Atual Detectado

Seu banco está com **inconsistência de timestamps**:
- Banco tem: `createdAt`, `updatedAt` (camelCase)
- Backend espera: `created_at`, `updated_at` (snake_case)

### 🛠️ Solução Rápida

**Opção 1: Reset Completo (Recomendado)**

Execute os scripts **na ordem exata** no Supabase SQL Editor:

```sql
-- 0️⃣ RESET: Limpar banco atual (APAGA TUDO!)
-- Copie e execute: supabase/00-reset-database.sql
```

```sql
-- 1️⃣ PRIMEIRO: Estrutura do banco
-- Copie e execute: supabase/01-schema.sql
```

```sql
-- 2️⃣ SEGUNDO: Funções automáticas
-- Copie e execute: supabase/02-functions.sql
```

```sql
-- 3️⃣ TERCEIRO: Segurança RLS
-- Copie e execute: supabase/03-rls-policies.sql
```

```sql
-- 4️⃣ QUARTO: Dados de teste (recomendado)
-- Copie e execute: supabase/04-seed-data.sql
```

**Opção 2: Diagnóstico (Para investigar)**

```sql
-- 🔍 DIAGNÓSTICO: Verificar estado atual
-- Copie e execute: supabase/99-diagnostics.sql
```

## 🎯 O que será criado

### Estrutura do Banco
- ✅ 7 tabelas com relacionamentos UUID
- ✅ Índices otimizados para performance
- ✅ Constraints e validações

### Automação
- ✅ Timestamps automáticos (created_at/updated_at)
- ✅ Validação de emails
- ✅ Geração automática de slugs únicos
- ✅ Prevenção de conflitos de agendamento

### Segurança
- ✅ Row Level Security (RLS) habilitado
- ✅ Isolamento multi-tenant completo
- ✅ Políticas granulares de acesso
- ✅ Acesso público controlado para booking

### Dados de Teste
- ✅ 2 Barbearias (Free + Pro)
- ✅ 2 Usuários admin (admin_free / admin_pro)
- ✅ 4 Barbeiros (1 Free + 3 Pro)
- ✅ 6 Serviços diferenciados por plano
- ✅ 3 Agendamentos de exemplo
- ✅ 3 Comentários aprovados

## 🔑 Credenciais de Teste

### Barbearia Free
- **Usuário:** admin_free
- **Senha:** admin123
- **Limitações:** 1 barbeiro, serviços básicos

### Barbearia Pro
- **Usuário:** admin_pro  
- **Senha:** admin123
- **Recursos:** 3 barbeiros, serviços premium

## 🔧 Configuração do Backend

Certifique-se de que o `.env` do backend está configurado:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Database (se usando Supabase como DB principal)
DATABASE_URL=postgresql://postgres:[password]@db.[projeto].supabase.co:5432/postgres
```

## 🧪 Testando a Configuração

### 1. Verificar Tabelas
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 2. Verificar Dados de Teste
```sql
SELECT 
    b.name as barbearia,
    b.plan_type,
    COUNT(DISTINCT br.id) as barbeiros,
    COUNT(DISTINCT s.id) as servicos
FROM "Barbershops" b
LEFT JOIN "Barbers" br ON br."barbershopId" = b.id
LEFT JOIN "Services" s ON s."barbershopId" = b.id
GROUP BY b.id, b.name, b.plan_type;
```

### 3. Testar RLS
```sql
-- Deve retornar apenas dados públicos
SELECT name, plan_type FROM "Barbershops";
```

## 🚨 Troubleshooting

### ❌ Erro: "column created_at does not exist"
**Causa**: Banco tem `createdAt` mas backend espera `created_at`
**Solução**: Execute o reset completo (00-reset-database.sql + setup completo)

### ❌ Erro: "invalid input syntax for type uuid"
**Causa**: IDs não são UUIDs válidos ou tipos inconsistentes
**Solução**: 
1. Execute 99-diagnostics.sql para verificar
2. Reset completo se necessário

### ❌ Erro: "Senha incorreta" (admin_pro/admin123)
**Causa**: Hash da senha incorreto no banco
**Solução**: O novo seed (04-seed-data.sql) tem o hash correto

### Erro: "relation does not exist"
- Verifique se executou o 01-schema.sql primeiro
- Confirme que não há erros na criação das tabelas

### Erro: "permission denied"
- Verifique se RLS está configurado (03-rls-policies.sql)
- Confirme as políticas de acesso

### Erro: "function does not exist"
- Execute o 02-functions.sql
- Verifique se não há conflitos de nomes

### Dados não aparecem
- Confirme que executou 04-seed-data.sql
- Verifique se as políticas RLS permitem acesso

## 📊 Monitoramento

### Verificar Performance
```sql
-- Consultas mais lentas
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Verificar Uso de Índices
```sql
-- Índices não utilizados
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes 
WHERE idx_scan = 0;
```

## 🔄 Backup e Restore

### Backup Automático
O Supabase faz backup automático, mas para backup manual:

```bash
# Via CLI do Supabase
supabase db dump --file backup.sql
```

### Restore
```bash
# Restaurar backup
supabase db reset --file backup.sql
```

## 📈 Próximos Passos

1. **Configurar Webhooks** (se necessário)
2. **Implementar Backup Automático**
3. **Configurar Monitoramento**
4. **Otimizar Consultas** baseado no uso
5. **Implementar Cache** para consultas frequentes

## 🆘 Suporte

- [Documentação Supabase](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**✅ Configuração Completa!** Seu banco está pronto para produção com segurança multi-tenant e dados de teste.