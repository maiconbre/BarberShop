# 🔧 Guia Passo a Passo - Resolver Erro de Autenticação PostgreSQL

## 📋 Problema Atual
O erro "autenticação do tipo senha falhou para o usuário postgres" indica que as credenciais do banco de dados estão incorretas ou o PostgreSQL não está configurado corretamente.

## 🎯 Solução Completa - Passo a Passo

### 🔍 Passo 1: Verificar o Problema Atual

#### 1.1 Verificar arquivo .env atual
```bash
# Ver conteúdo atual do .env
cat .env
```

#### 1.2 Testar conexão manual
```bash
# Testar conexão com configuração atual
npm run db:test
```

### 🛠️ Passo 2: Escolher Solução

#### Opção A: Configuração Automática (Recomendado)
```bash
cd backend
npm run db:setup
```

#### Opção B: Configuração Manual Detalhada

### 🔧 Passo 3: Configuração Manual - PostgreSQL Local

#### 3.1 Instalar PostgreSQL (se necessário)

**Windows:**
1. Baixar em: https://www.postgresql.org/download/windows/
2. Instalar com configurações padrão
3. Definir senha do superusuário como: `postgres`
4. Porta padrão: `5432`

**Verificar instalação:**
```bash
# Verificar se PostgreSQL está rodando
netstat -an | findstr :5432

# Verificar serviço (Windows)
sc query postgresql-x64-15
```

#### 3.2 Criar Banco de Dados

**Opção 1 - Via psql:**
```bash
# Conectar ao PostgreSQL
psql -U postgres

# No prompt psql, executar:
CREATE DATABASE barbershop;
\q
```

**Opção 2 - Via createdb:**
```bash
# Criar banco diretamente
createdb barbershop -U postgres -h localhost
```

**Opção 3 - Via script:**
```bash
# Usar script do projeto
npm run db:create
```

#### 3.3 Configurar arquivo .env

**Backup do .env atual:**
```bash
# Fazer backup do .env atual
copy .env .env.backup
```

**Criar novo .env para desenvolvimento local:**
```bash
# Copiar configuração local
copy .env.development.local .env
```

**Ou criar manualmente:**
```bash
# Criar .env com configuração local
notepad .env
```

**Conteúdo do .env:**
```env
# Configuração de desenvolvimento local
NODE_ENV=development

# PostgreSQL local
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=barbershop

# JWT configuration
JWT_SECRET=dev_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=1d

# Refresh token configuration
REFRESH_TOKEN_SECRET=dev_refresh_secret_key_change_in_production
REFRESH_TOKEN_EXPIRES_IN=7d

# Server configuration
PORT=8000
HOST=localhost

# Database SSL (desabilitar para desenvolvimento local)
DB_SSL=false

# Enable SQL logs for development
ENABLE_SQL_LOGS=true
```

### 🧪 Passo 4: Testar Conexão

#### 4.1 Testar conexão com banco
```bash
# Testar conexão
npm run db:test
```

#### 4.2 Testar manualmente (se necessário)
```bash
# Testar via psql
psql -h localhost -p 5432 -U postgres -d barbershop -c "SELECT version();"
```

### 🚀 Passo 5: Executar Migrações

#### 5.1 Verificar status das migrações
```bash
# Verificar status
npm run migrate:status
```

#### 5.2 Executar migrações
```bash
# Executar todas as migrações pendentes
npm run migrate:dev
```

#### 5.3 Verificar se funcionou
```bash
# Verificar tabelas criadas
psql -U postgres -d barbershop -c "\dt"
```

### ✅ Passo 6: Iniciar Aplicação

#### 6.1 Iniciar servidor
```bash
# Iniciar em modo desenvolvimento
npm run dev
```

#### 6.2 Verificar endpoints
```bash
# Testar endpoints
curl http://localhost:8000/api/health
curl http://localhost:8000/api/services
```

---

## 🐳 Alternativa: Docker (Sem Instalar PostgreSQL)

### Passo 1: Instalar Docker Desktop
- Download: https://www.docker.com/products/docker-desktop

### Passo 2: Iniciar PostgreSQL via Docker
```bash
# Iniciar container PostgreSQL
docker run --name postgres-barber \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=barbershop \
  -p 5432:5432 \
  -d postgres:latest
```

### Passo 3: Configurar .env para Docker
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=barbershop
```

---

## 🔧 Solução de Problemas Comuns

### Erro: "password authentication failed"

**Solução 1 - Resetar senha PostgreSQL:**
```bash
# Como administrador PostgreSQL
psql -U postgres
c ALTER USER postgres PASSWORD 'postgres';
\q
```

**Solução 2 - Verificar pg_hba.conf:**
```bash
# Localização (Windows):
# C:\Program Files\PostgreSQL\15\data\pg_hba.conf

# Adicionar linhas:
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
```

### Erro: "database does not exist"
```bash
# Criar banco manualmente
psql -U postgres -c "CREATE DATABASE barbershop;"
```

### Erro: "connection refused"
```bash
# Verificar serviço PostgreSQL (Windows)
net start postgresql-x64-15

# Verificar porta
netstat -an | findstr :5432
```

---

## 📋 Checklist Final

- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados 'barbershop' criado
- [ ] Arquivo .env configurado com credenciais corretas
- [ ] Teste de conexão passando (`npm run db:test`)
- [ ] Migrações executadas (`npm run migrate:dev`)
- [ ] Servidor iniciando sem erros (`npm run dev`)

---

## 🚀 Comandos Úteis Resumidos

```bash
# Configuração rápida (escolher uma):
npm run db:setup           # Configuração interativa
copy .env.development.local .env   # Configuração local rápida

# Testes:
npm run db:test            # Testar conexão
npm run migrate:status     # Verificar migrações
npm run migrate:dev        # Executar migrações
npm run dev                # Iniciar servidor

# Reset (se necessário):
npm run db:reset          # Resetar banco completo
```