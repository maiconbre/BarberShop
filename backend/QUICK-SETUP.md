# 🚀 Configuração Rápida - Resolver Erro de Ambiente

## ⚡ Solução Imediata

### Passo 1: Executar Configuração Automática
```bash
cd backend
npm run db:setup
```

### Passo 2: Escolher Opção no Menu
- **Opção 1**: PostgreSQL local (recomendado)
- **Opção 2**: PostgreSQL via Docker
- **Opção 3**: Manter Supabase

### Passo 3: Executar Migrações
```bash
npm run migrate:dev
```

### Passo 4: Testar
```bash
npm run dev
```

---

## 🔧 Configuração Manual Alternativa

### Opção A: PostgreSQL Local

#### 1. Instalar PostgreSQL
- Download: https://www.postgresql.org/download/windows/
- Instalar com senha: `postgres`
- Porta: `5432`

#### 2. Criar Banco de Dados
```bash
# Via psql
psql -U postgres -c "CREATE DATABASE barbershop;"

# Ou via createdb
createdb barbershop -U postgres -h localhost
```

#### 3. Configurar .env
```bash
# Copiar configuração local
copy .env.local .env
```

#### 4. Configuração .env final:
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=barbershop
DB_SSL=false
JWT_SECRET=dev_secret
JWT_EXPIRES_IN=1d
PORT=8000
```

### Opção B: Usar PowerShell (Windows)

#### Executar script PowerShell:
```powershell
# Abrir PowerShell como administrador
cd backend
powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1
```

#### Ou executar diretamente:
```powershell
# Configuração local rápida
npm run env:local

# Testar conexão
npm run db:test
```

---

## 🐳 Opção C: Docker (Sem Instalação)

#### 1. Instalar Docker Desktop
- Download: https://www.docker.com/products/docker-desktop

#### 2. Iniciar PostgreSQL via Docker
```bash
# Via script
cd backend
npm run env:setup
# Escolher opção 2 (Docker)
```

#### 3. Ou manualmente:
```bash
docker run --name postgres-barber \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=barbershop \
  -p 5432:5432 \
  -d postgres:latest
```

---

## 🎯 Verificação Final

### Testar Tudo:
```bash
# 1. Verificar configuração
cat .env

# 2. Testar conexão
npm run db:test

# 3. Executar migrações
npm run migrate:dev

# 4. Iniciar servidor
npm run dev
```

### Comandos Úteis:
```bash
# Verificar status das migrações
npm run migrate:status

# Resetar banco (se necessário)
npm run db:reset

# Ver logs detalhados
npm run dev 2>&1 | findstr "error"
```

---

## 📞 Suporte Rápido

### Erros Comuns:

#### "password authentication failed"
```bash
# Resetar senha PostgreSQL
psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';"
```

#### "database does not exist"
```bash
# Criar banco
psql -U postgres -c "CREATE DATABASE barbershop;"
```

#### "connection refused"
```bash
# Verificar serviço (Windows)
net start postgresql-x64-15
```

### Contatos:
- **Documentação**: `backend/ENV-SETUP.md`
- **Script**: `backend/scripts/setup-windows.ps1`
- **Configurador**: `npm run db:setup`