# Guia de Solução de Problemas - Erro de Autenticação PostgreSQL

## 🚨 Problema: "autenticação do tipo senha falhou para o usuário postgres"

Este erro ocorre quando as credenciais do banco de dados estão incorretas ou o PostgreSQL não está configurado corretamente.

## 🔍 Diagnóstico

### 1. Verificar credenciais no arquivo .env

```bash
# Abra o arquivo .env na pasta backend
cd backend
cat .env
```

### 2. Verificar se o PostgreSQL está rodando

```bash
# Windows (PowerShell)
Get-Service -Name "postgresql*"

# Verificar se está rodando na porta 5432
netstat -an | findstr :5432
```

## ✅ Soluções

### Solução 1: Configurar credenciais corretas

1. **Copiar arquivo de exemplo:**
   ```bash
   cd backend
   copy .env.example .env
   ```

2. **Editar o arquivo .env:**
   ```bash
   # Use o editor de sua preferência
   notepad .env
   ```

3. **Configurar com credenciais corretas:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=sua_senha_aqui
   DB_NAME=barbershop
   ```

### Solução 2: Verificar usuário e senha PostgreSQL

1. **Conectar via psql:**
   ```bash
   psql -U postgres -h localhost
   ```

2. **Se não souber a senha, redefina:**
   ```bash
   # Windows: Abra o terminal como administrador
   net user postgres nova_senha
   ```

### Solução 3: Configurar método de autenticação

1. **Editar pg_hba.conf:**
   ```bash
   # Localização típica no Windows:
   C:\Program Files\PostgreSQL\15\data\pg_hba.conf
   ```

2. **Alterar linha para:**
   ```conf
   # IPv4 local connections:
   host    all             all             127.0.0.1/32            md5
   ```

3. **Reiniciar PostgreSQL:**
   ```bash
   net stop postgresql-x64-15
   net start postgresql-x64-15
   ```

## 🧪 Testar conexão

### Teste 1: Usando script de teste
```bash
node scripts/test-migration.js
```

### Teste 2: Testar manualmente
```bash
# Instalar pg client globalmente
npm install -g pg

# Testar conexão
node -e "
const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'sua_senha',
  database: 'postgres'
});
client.connect().then(() => {
  console.log('✅ Conectado!');
  client.end();
}).catch(err => console.log('❌ Erro:', err.message));
"
```

## 🐛 Erros comuns e soluções

| Erro | Solução |
|------|---------|
| `FATAL: password authentication failed` | Verificar senha no .env |
| `FATAL: database "barbershop" does not exist` | Criar database: `createdb barbershop` |
| `Connection refused` | Verificar se PostgreSQL está rodando na porta 5432 |
| `role "postgres" does not exist` | Criar usuário: `CREATE USER postgres WITH PASSWORD 'senha';` |

## 📝 Passo a passo rápido

1. **Verificar PostgreSQL instalado:**
   ```bash
   psql --version
   ```

2. **Criar database se não existir:**
   ```bash
   createdb barbershop
   ```

3. **Configurar .env:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=barbershop
   ```

4. **Testar migração:**
   ```bash
   npm run migrate:dev
   ```

## 🆘 Se ainda tiver problemas

1. **Verificar logs PostgreSQL:**
   - Windows: `Event Viewer > Windows Logs > Application`

2. **Reinstalar PostgreSQL:**
   - Desinstalar via "Add or Remove Programs"
   - Reinstalar com configurações padrão
   - Lembrar da senha do superusuário postgres

3. **Usar Docker (alternativa):**
   ```bash
   docker run --name postgres-barbershop -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=barbershop -p 5432:5432 -d postgres
   ```

## 📞 Comandos úteis

```bash
# Verificar status PostgreSQL
systemctl status postgresql

# Iniciar/parar PostgreSQL
net start postgresql-x64-15
net stop postgresql-x64-15

# Listar databases
psql -U postgres -l

# Conectar ao database
psql -U postgres -d barbershop
```