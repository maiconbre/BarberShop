# 🔧 Configuração de Ambiente - Barber Backend

Guia completo para configurar o ambiente de desenvolvimento e resolver problemas de conexão com PostgreSQL.

## 🚀 Configuração Rápida

### Opção 1: Configuração Automática (Recomendado)
```bash
# Executar o configurador interativo
npm run db:setup
```

### Opção 2: Configuração Manual
```bash
# Copiar configuração local padrão
copy .env.local .env

# Ou editar .env manualmente
notepad .env
```

## 📋 Configurações Disponíveis

### 1. PostgreSQL Local (Desenvolvimento)

#### Windows - PostgreSQL Local
```bash
# Instalar PostgreSQL (se ainda não tiver)
# Download: https://www.postgresql.org/download/windows/

# Configuração padrão para desenvolvimento:
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=barbershop
DB_SSL=false
```

#### Testar PostgreSQL Local
```bash
# Verificar se PostgreSQL está rodando
netstat -an | findstr :5432

# Testar conexão
npm run db:test
```

#### Criar banco de dados local
```bash
# Se o banco não existir, criar:
createdb barbershop -U postgres -h localhost

# Ou via psql:
psql -U postgres -c "CREATE DATABASE barbershop;"
```

### 2. Supabase (Produção/Cloud)

#### Configuração Supabase
```bash
# Usar configuração existente do arquivo .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Configuração do banco via Supabase
DATABASE_URL=postgresql://postgres:password@your-project.supabase.co:5432/postgres
```

## 🔧 Comandos de Configuração

### Scripts Disponíveis
```bash
# Configuração interativa do ambiente
npm run env:setup

# Configuração rápida para desenvolvimento local
npm run env:local

# Configuração para Supabase
npm run env:supabase

# Testar conexão com banco
npm run db:test

# Verificar status das migrações
npm run migrate:status

# Executar migrações em desenvolvimento
npm run migrate:dev

# Resetar banco (apagar, criar e migrar)
npm run db:reset
```

## 🛠️ Solução de Problemas

### Erro: "password authentication failed"

#### Solução 1: Verificar credenciais
```bash
# Testar conexão manualmente
psql -h localhost -U postgres -d barbershop
```

#### Solução 2: Resetar senha do PostgreSQL
```bash
# Como administrador do PostgreSQL:
psql -U postgres
ALTER USER postgres PASSWORD 'postgres';
```

#### Solução 3: Editar pg_hba.conf (Windows)
```bash
# Localização típica: C:\Program Files\PostgreSQL\15\data\pg_hba.conf

# Adicionar/modificar:
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
```

### Erro: "database does not exist"

#### Criar banco manualmente
```bash
# Via psql
psql -U postgres -c "CREATE DATABASE barbershop;"

# Via createdb
createdb barbershop -U postgres -h localhost
```

### Erro: "connection refused"

#### Verificar serviço PostgreSQL
```bash
# Windows: Verificar serviço
sc query postgresql-x64-15

# Iniciar serviço
net start postgresql-x64-15
```

## 📁 Estrutura de Arquivos de Configuração

### Arquivos Importantes
```
backend/
├── .env                    # Configuração ativa (criado por você)
├── .env.example           # Template de configuração
├── .env.local             # Configuração local padrão
├── config/
│   └── database.js        # Configuração do Sequelize
├── scripts/
│   ├── configure-env.js   # Configurador interativo
│   ├── test-migration.js  # Testador de conexão
│   └── migration-runner.js # Executador de migrações
└── migrations/
    └── *.sql              # Arquivos de migração
```

## 🐳 Alternativa Docker

### Usar PostgreSQL via Docker
```bash
# Iniciar PostgreSQL no Docker
docker run --name postgres-barber -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:latest

# Configuração .env para Docker
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=barbershop
DB_SSL=false
```

## ✅ Checklist de Configuração

- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados 'barbershop' criado
- [ ] Arquivo .env configurado corretamente
- [ ] Teste de conexão passando (`npm run db:test`)
- [ ] Migrações executadas (`npm run migrate:dev`)
- [ ] Aplicação iniciando sem erros (`npm run dev`)

## 📞 Suporte

### Comandos de debug úteis
```bash
# Verificar variáveis de ambiente
node -e "console.log(process.env.DB_HOST, process.env.DB_PORT)"

# Testar conexão com Node.js
node -e "
const { Client } = require('pg');
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
client.connect().then(() => console.log('Conectado!')).catch(console.error);
"
```

### Logs e diagnóstico
```bash
# Ver logs do PostgreSQL (Windows)
type "C:\Program Files\PostgreSQL\15\data\log\*.log"

# Ver logs da aplicação
npm run dev 2>&1 | findstr "error"
```