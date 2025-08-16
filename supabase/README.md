# Configuração do Banco de Dados Supabase

Este diretório contém os scripts SQL para configurar o banco de dados do projeto de barbearias no Supabase.

## Ordem de Execução

### Para Banco Novo ou Reset Completo

Execute os scripts na seguinte ordem no **Supabase SQL Editor**:

### 0. Reset (Opcional - apenas se necessário)
```sql
-- Execute: 00-reset-database.sql
```
**⚠️ ATENÇÃO**: Apaga TODOS os dados existentes! Use apenas se quiser começar do zero.

### 1. Schema Principal
```sql
-- Execute: 01-schema.sql
```
Cria todas as tabelas, relacionamentos e índices necessários.

### 2. Funções e Triggers
```sql
-- Execute: 02-functions.sql
```
Adiciona funções utilitárias e triggers automáticos para:
- Atualização automática de timestamps
- Validação de emails
- Geração de slugs únicos
- Prevenção de conflitos de agendamento
- Estatísticas da barbearia

### 3. Políticas de Segurança
```sql
-- Execute: 03-rls-policies.sql
```
Configura Row Level Security (RLS) para:
- Isolamento multi-tenant
- Acesso público controlado
- Permissões baseadas em proprietário

### 4. Dados de Teste (Recomendado)
```sql
-- Execute: 04-seed-data.sql
```
Popula o banco com dados de teste incluindo:
- 2 Barbearias (Free + Pro)
- Usuários admin para cada plano
- Barbeiros e serviços de exemplo
- Agendamentos e comentários iniciais

## Estrutura das Tabelas

### Barbershops
- Entidade principal do sistema
- Cada barbearia é isolada das outras
- Contém configurações e plano

### Users
- Usuários do sistema (admin, barbeiros, etc.)
- Vinculados a uma barbearia específica

### Barbers
- Barbeiros que trabalham na barbearia
- Informações de contato (WhatsApp, PIX)

### Services
- Serviços oferecidos pela barbearia
- Preços configuráveis

### Appointments
- Agendamentos dos clientes
- Controle de status e conflitos

### Comments
- Avaliações e comentários dos clientes
- Sistema de moderação (pending/approved)

### BarberServices
- Relacionamento many-to-many
- Define quais barbeiros oferecem quais serviços

## Recursos Implementados

### Segurança
- ✅ Row Level Security (RLS) habilitado
- ✅ Isolamento multi-tenant
- ✅ Políticas de acesso granulares

### Automação
- ✅ Timestamps automáticos (createdAt/updatedAt)
- ✅ Geração automática de slugs
- ✅ Validação de emails
- ✅ Prevenção de conflitos de agendamento

### Performance
- ✅ Índices otimizados
- ✅ Consultas eficientes
- ✅ Relacionamentos bem definidos

## Configuração de Ambiente

Certifique-se de que as variáveis de ambiente estão configuradas:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Migração de Dados Existentes

Se você já possui dados no formato antigo (IDs numéricos), use o script de migração no backend:

```sql
-- Execute: backend/migrations/fix-barber-user-ids.sql
```

## Troubleshooting

### Erro de Permissão
Se encontrar erros de permissão, verifique se:
1. RLS está habilitado nas tabelas
2. Políticas estão criadas corretamente
3. JWT contém as claims necessárias

### Conflitos de Agendamento
O sistema previne automaticamente conflitos através de triggers. Se precisar desabilitar temporariamente:

```sql
DROP TRIGGER IF EXISTS prevent_appointment_conflict_trigger ON "Appointments";
```

### Reset Completo
Para resetar completamente o banco:

```sql
-- Execute novamente: 01-schema.sql
-- Isso irá dropar e recriar todas as tabelas
```

## Próximos Passos

Após executar os scripts:

1. Configure a autenticação no Supabase Dashboard
2. Teste as políticas RLS
3. Configure webhooks se necessário
4. Implemente backup automático
5. Configure monitoramento

## Suporte

Para dúvidas sobre a configuração do banco, consulte:
- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)