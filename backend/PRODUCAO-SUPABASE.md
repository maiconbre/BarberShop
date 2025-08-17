# Configuração de Produção com Supabase

## 🚀 Configuração Rápida

### 1. Configurar Ambiente de Produção
```bash
npm run env:production
```

### 2. Executar Migrações
```bash
npm run prod:migrate
```

### 3. Iniciar Aplicação
```bash
npm run prod:start
```

## 📋 Configurações do Supabase

### Banco de Dados
- **Host**: `aws-0-sa-east-1.pooler.supabase.com`
- **Porta**: `6543`
- **Usuário**: `postgres.xxxsgvqbnkftoswascds`
- **Banco**: `postgres`
- **SSL**: Habilitado

### URLs e Chaves
- **Supabase URL**: `https://xxxsgvqbnkftoswascds.supabase.co`
- **Anon Key**: Configurada
- **Service Key**: Configurada

### CORS
- **Domínios Permitidos**:
  - `https://barber.targetweb.tech`
  - `https://barber-shop-ten-mu.vercel.app`

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|----------|
| `npm run env:production` | Configura ambiente para produção |
| `npm run prod:setup` | Setup completo (env + migrate) |
| `npm run prod:migrate` | Executa migrações em produção |
| `npm run prod:start` | Inicia aplicação em produção |
| `npm run migrate:prod` | Alias para migrações de produção |

## 📁 Arquivos de Configuração

### `.env.production`
Contém todas as configurações de produção:
- Conexão com Supabase
- Configurações de segurança
- CORS para domínios de produção
- Otimizações de performance

### Variáveis Importantes
```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres.xxxsgvqbnkftoswascds:rDazZ1zCjD3PkOKJ@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
CORS_ORIGIN=https://barber.targetweb.tech,https://barber-shop-ten-mu.vercel.app
SQL_LOGGING=false
BCRYPT_ROUNDS=12
```

## 🔒 Segurança

### Configurações Aplicadas
- **BCrypt Rounds**: 12 (alta segurança)
- **Rate Limiting**: 100 requests/15min
- **SQL Logging**: Desabilitado
- **SSL**: Obrigatório
- **CORS**: Restrito aos domínios autorizados

### JWT
- **Secret**: Configurado
- **Expiração**: 24 horas
- **Refresh Token**: 7 dias

## 🚀 Deploy

### Pré-requisitos
1. Conta no Supabase configurada
2. Domínios de produção configurados
3. Variáveis de ambiente validadas

### Passos para Deploy
1. **Configurar Ambiente**:
   ```bash
   npm run env:production
   ```

2. **Instalar Dependências**:
   ```bash
   npm install --production
   ```

3. **Executar Migrações**:
   ```bash
   npm run prod:migrate
   ```

4. **Iniciar Aplicação**:
   ```bash
   npm run prod:start
   ```

## 🔍 Verificação

### Testar Conexão
```bash
npm run db:test
```

### Verificar Status das Migrações
```bash
npm run migrate:status
```

### Logs de Produção
- SQL Logging: Desabilitado
- Error Logging: Habilitado
- Performance Monitoring: Recomendado

## 🌐 URLs de Produção

- **Frontend**: https://barber-shop-ten-mu.vercel.app
- **API**: https://barber.targetweb.tech
- **Supabase Dashboard**: https://xxxsgvqbnkftoswascds.supabase.co

## 📞 Suporte

Em caso de problemas:
1. Verificar logs da aplicação
2. Validar configurações do Supabase
3. Testar conectividade com `npm run db:test`
4. Consultar documentação do Supabase

## ⚠️ Notas Importantes

- **Backup**: Configure backups automáticos no Supabase
- **Monitoramento**: Implemente logs de erro e performance
- **Segurança**: Mantenha as chaves secretas seguras
- **Updates**: Mantenha dependências atualizadas
- **SSL**: Sempre use HTTPS em produção