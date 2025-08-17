# Guia de Migrações de Banco de Dados

Este documento descreve como usar o sistema de migrações do Sequelize para gerenciar alterações no esquema do banco de dados.

## 📋 Visão Geral

O sistema utiliza um script customizado (`migration-runner.js`) que permite executar migrações SQL de forma programática, sem depender do CLI do Sequelize. As migrações são armazenadas no diretório `backend/migrations/`.

## 🚀 Como Usar

### Executar todas as migrações pendentes
```bash
npm run migrate
# ou
npm run migrate:dev
```

### Verificar status das migrações
```bash
npm run migrate:status
```

### Reverter última migração
```bash
npm run migrate:rollback
```

### Criar nova migração
```bash
npm run migrate:create nome-da-migracao
```

### Executar em produção
```bash
npm run migrate:prod
```

## 📁 Estrutura de Arquivos

```
backend/
├── migrations/
│   ├── 20240816-add-userid-to-barbers.sql
│   └── fix-barber-user-ids.sql
├── scripts/
│   └── migration-runner.js
└── .env.example
```

## 🔧 Configuração

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure as variáveis de ambiente no arquivo `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=sua_senha
   DB_NAME=barbershop
   ```

## 📋 Comandos Detalhados

### migration-runner.js

O script aceita os seguintes comandos:

#### `up`
Executa todas as migrações pendentes.
```bash
node scripts/migration-runner.js up
```

#### `down`
Reverte a última migração executada.
```bash
node scripts/migration-runner.js down
```

#### `status`
Mostra o status de todas as migrações.
```bash
node scripts/migration-runner.js status
```

#### `create <nome>`
Cria um novo arquivo de migração com timestamp.
```bash
node scripts/migration-runner.js create add-phone-to-users
```

## 📝 Criando Novas Migrações

### 1. Criar arquivo de migração
```bash
npm run migrate:create nome-descritivo
```

### 2. Estrutura do arquivo SQL

Cada migração deve conter duas seções: `UP` e `DOWN`.

```sql
-- UP: Alterações para aplicar a migração
-- Adicionar nova coluna
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Criar índice
CREATE INDEX idx_users_phone ON users(phone);

-- DOWN: Reverter as alterações (ordem inversa)
-- Remover índice
DROP INDEX IF EXISTS idx_users_phone;

-- Remover coluna
ALTER TABLE users DROP COLUMN IF EXISTS phone;
```

### 3. Exemplo Completo

```sql
-- File: 20240115-add-profile-picture-to-users.sql

-- UP
ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(500);
CREATE INDEX idx_users_profile_picture ON users(profile_picture_url);

-- DOWN
DROP INDEX IF EXISTS idx_users_profile_picture;
ALTER TABLE users DROP COLUMN IF EXISTS profile_picture_url;
```

## ⚠️ Boas Práticas

1. **Sempre inclua DOWN**: Cada migração deve ter uma seção DOWN para permitir reversão.

2. **Use IF EXISTS/IF NOT EXISTS**: Evite erros se objetos já existirem.
   ```sql
   ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
   ```

3. **Teste migrações**: Sempre teste as migrações em ambiente de desenvolvimento.

4. **Faça backups**: Antes de rodar migrações em produção, faça backup do banco.

5. **Migrações pequenas**: Prefira migrações pequenas e específicas ao invés de grandes alterações.

## 🔍 Troubleshooting

### Erro: "relation does not exist"
Verifique se a tabela existe antes de fazer alterações:
```sql
-- UP
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (...);
    END IF;
END $$;
```

### Erro: "column already exists"
Use `IF NOT EXISTS`:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS new_column VARCHAR(255);
```

### Verificar migrações executadas
```sql
SELECT * FROM migrations ORDER BY executed_at DESC;
```

## 🐳 Docker (Opcional)

Se estiver usando Docker, você pode executar migrações assim:

```bash
docker-compose exec backend npm run migrate
```

## 📊 Monitoramento

O script de migração registra logs detalhados:
- Console: logs coloridos para facilitar visualização
- Arquivo: logs salvos em `migration.log` (em desenvolvimento)

## 🤝 Suporte

Se encontrar problemas com migrações:
1. Verifique os logs do console
2. Confirme as credenciais do banco no arquivo `.env`
3. Verifique se o banco está acessível
4. Confirme se as tabelas existem antes de aplicar alterações