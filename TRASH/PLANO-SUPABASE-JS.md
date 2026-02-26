✅ Checklist de Migração SaaS Barbershop para Supabase-first
🔹 Etapa 1 — Preparar ambiente

 Instalar e configurar Supabase CLI no projeto.
 Garantir que os migrations fiquem versionados em supabase/migrations.
 para serem executados automaticamente ou diretamente no painel supabase.

 Configurar .env no front com NEXT_PUBLIC_SUPABASE_URL(https://qyrfsjhacpigawempkjv.supabase.co) e NEXT_PUBLIC_SUPABASE_ANON_KEY(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cmZzamhhY3BpZ2F3ZW1wa2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwODk2MzcsImV4cCI6MjA3MTY2NTYzN30.YBwF5TgqwhKEyHk-c7RhSJ-ZOakgz73j5coh7tPAhpg
).

🔹 Etapa 2 — Modelagem de Banco de Dados

 Criar tabela tenants (id, name, slug, created_at).

 Criar tabela tenant_members (tenant_id, user_id, role).

 Adicionar coluna tenant_id em todas tabelas de negócio (customers, services, bookings, etc.).

 Criar constraints (NOT NULL, CHECK) para reforçar integridade.

 Criar índices compostos começando por tenant_id para performance.

🔹 Etapa 3 — Segurança e Isolamento (RLS)

 Criar função current_tenant_id() para extrair tenant_id do JWT.

 Ativar Row Level Security (RLS) em todas as tabelas multi-tenant.

 Criar policies de SELECT (tenant_id = current_tenant_id()).

 Criar policies de INSERT/UPDATE/DELETE com with check (tenant_id = current_tenant_id()).

 Testar com diferentes usuários para confirmar que cada tenant só enxerga seus dados.

🔹 Etapa 4 — RPCs (SQL Functions)

 Migrar rotas de criação (ex.: criar cliente, agendamento, serviço) para funções SQL.

 Definir todas como SECURITY DEFINER para garantir que o servidor injete tenant_id.

 Testar chamadas via supabase.rpc() no front.

 Remover tenant_id dos payloads do front (sempre setado no servidor).

🔹 Etapa 5 — Edge Functions (Substituindo Express)

 Criar função create-tenant:

Cria barbearia (tenant) com slug.

Insere usuário como owner em tenant_members.

Atualiza app_metadata.default_tenant_id do usuário.

 Criar função set-tenant:

Atualiza default_tenant_id no JWT ao trocar de barbearia.

 Migrar integrações externas (ex.: Mercado Pago, WhatsApp, envio de e-mail) para Edge Functions.

 Configurar secrets (SUPABASE_SERVICE_ROLE_KEY, API keys externas) em cada Edge Function.

🔹 Etapa 6 — Storage

 Criar bucket único (barbershop).

 Definir padrão de pastas: barbershop/<tenant_id>/<categoria>/arquivo.

 Criar policies de leitura e escrita baseadas no default_tenant_id.

 Testar uploads/downloads no front com supabase.storage.

🔹 Etapa 7 — Frontend (React/Next.js)

 Substituir chamadas Axios → supabase-js.

 Implementar login e signUp com supabase.auth.

 Ajustar fluxo de cadastro para chamar Edge Function create-tenant.

 Ajustar rota /app/:slug para resolver tenant_id e, se necessário, chamar set-tenant.

 Atualizar CRUDs para chamar supabase.from(...) ou supabase.rpc(...).

 Implementar paginação (.range() / .limit()).

 Garantir selects enxutos (.select("id, name") em vez de *).

🔹 Etapa 8 — Monitoramento e Qualidade

 Habilitar logs de Edge Functions para capturar erros de produção.

 Testar queries com pg_stat_statements para encontrar lentas.

 Criar testes manuais de fluxo completo (cadastro → tenant → agendamento → upload → troca de barbearia).

 Configurar fallback de erro no front (loading, retry).

🔹 Etapa 9 — Migração Final

 Desativar backend Node/Express (após migrar todas rotas).

 Garantir que toda lógica de segurança e regras de negócio estão no banco (RLS + RPC).

 Garantir que integrações externas funcionam nas Edge Functions.

 Revisar políticas de Storage e acesso público/privado.

 Fazer auditoria de roles (authenticated, anon, service_role).

🎯 Resultado

Backend Node/Express eliminado.

Supabase como único backend (Auth + Postgres + RLS + RPC + Storage + Edge Functions).

Arquitetura mais limpa, segura e escalável para SaaS multi-tenant.

Front se comunica direto com Supabase via supabase-js.