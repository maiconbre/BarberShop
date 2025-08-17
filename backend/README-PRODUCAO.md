# 🚀 Configuração de Produção - Supabase

## ⚡ Setup Rápido

```bash
# 1. Configurar ambiente de produção
npm run env:production

# 2. Testar conexão com Supabase
npm run supabase:test

# 3. Executar migrações
npm run prod:migrate

# 4. Iniciar aplicação
npm run prod:start
```

## 📋 Configurações Aplicadas

### 🗄️ Banco de Dados (Supabase)
- **Provider**: Supabase PostgreSQL
- **Host**: `aws-0-sa-east-1.pooler.supabase.com`
- **Porta**: `6543`
- **SSL**: Obrigatório
- **Pool de Conexões**: 10 máx, 2 mín
- **Timeouts**: Otimizados para produção

### 🌐 CORS
- **Domínios Permitidos**:
  - `https://barber.targetweb.tech`
  - `https://barber-shop-ten-mu.vercel.app`

### 🔒 Segurança
- **JWT**: Configurado com secret seguro
- **BCrypt**: 12 rounds
- **Rate Limiting**: 100 req/15min
- **SQL Logging**: Desabilitado

### ⚙️ Performance
- **Node.js**: Otimizado para produção
- **Keep-Alive**: Habilitado
- **Connection Pooling**: Configurado
- **Timeouts**: Ajustados para Supabase

## 🛠️ Scripts Disponíveis

| Script | Descrição | Uso |
|--------|-----------|-----|
| `env:production` | Configura .env para produção | `npm run env:production` |
| `prod:setup` | Setup completo (env + migrate) | `npm run prod:setup` |
| `prod:test` | Testa conexão em modo produção | `npm run prod:test` |
| `supabase:test` | Testa conexão com Supabase | `npm run supabase:test` |
| `prod:migrate` | Executa migrações | `npm run prod:migrate` |
| `prod:start` | Inicia aplicação | `npm run prod:start` |

## 📁 Arquivos de Configuração

### `.env.production`
```env
# Configurações principais
NODE_ENV=production
DATABASE_URL=postgresql://postgres.xxxsgvqbnkftoswascds:rDazZ1zCjD3PkOKJ@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
CORS_ORIGIN=https://barber.targetweb.tech,https://barber-shop-ten-mu.vercel.app

# Supabase
VITE_SUPABASE_URL=https://xxxsgvqbnkftoswascds.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Segurança
JWT_SECRET=b65db4bb3eab8f60a7ebc4bcba976d62...
SQL_LOGGING=false
BCRYPT_ROUNDS=12
```

### `config/database.js`
Otimizado para Supabase com:
- Pool de conexões aumentado
- Timeouts ajustados
- SSL obrigatório
- Retry logic melhorada

## 🔍 Verificação e Testes

### Testar Conexão
```bash
# Teste completo do Supabase
npm run supabase:test

# Teste em modo produção
npm run prod:test
```

### Verificar Migrações
```bash
# Status das migrações
npm run migrate:status

# Executar migrações pendentes
npm run prod:migrate
```

### Logs de Verificação
O script de teste verifica:
- ✅ Variáveis de ambiente
- ✅ Conexão Sequelize
- ✅ Cliente Supabase
- ✅ Configurações de produção
- ✅ Informações da conexão

## 🚀 Deploy

### Pré-requisitos
- [x] Conta Supabase configurada
- [x] Domínios de produção configurados
- [x] Variáveis de ambiente validadas
- [x] SSL/HTTPS configurado

### Processo de Deploy

1. **Preparar Ambiente**
   ```bash
   npm install --production
   npm run env:production
   ```

2. **Validar Configuração**
   ```bash
   npm run supabase:test
   ```

3. **Executar Migrações**
   ```bash
   npm run prod:migrate
   ```

4. **Iniciar Aplicação**
   ```bash
   npm run prod:start
   ```

## 🌐 URLs de Produção

- **Frontend**: https://barber-shop-ten-mu.vercel.app
- **API Backend**: https://barber.targetweb.tech
- **Supabase Dashboard**: https://xxxsgvqbnkftoswascds.supabase.co

## 📊 Monitoramento

### Métricas Importantes
- **Conexões de DB**: Monitorar pool de conexões
- **Response Time**: APIs devem responder < 500ms
- **Error Rate**: Manter < 1%
- **Uptime**: Objetivo 99.9%

### Logs
```bash
# Logs da aplicação
tail -f logs/app.log

# Logs de erro
tail -f logs/error.log
```

## 🔧 Troubleshooting

### Problemas Comuns

#### Erro de Conexão
```bash
# Testar conectividade
npm run supabase:test

# Verificar variáveis
echo $DATABASE_URL
```

#### Migrações Falhando
```bash
# Verificar status
npm run migrate:status

# Rollback se necessário
npm run migrate:rollback
```

#### Performance Lenta
- Verificar pool de conexões
- Analisar queries lentas no Supabase
- Verificar índices no banco

### Suporte
- **Documentação Supabase**: https://supabase.com/docs
- **Status Supabase**: https://status.supabase.com
- **Logs da Aplicação**: Verificar logs de erro

## ⚠️ Checklist de Produção

- [ ] Variáveis de ambiente configuradas
- [ ] Teste de conexão passou
- [ ] Migrações executadas
- [ ] CORS configurado corretamente
- [ ] SSL/HTTPS habilitado
- [ ] Logs de produção configurados
- [ ] Backup automático configurado
- [ ] Monitoramento ativo
- [ ] Domínios apontando corretamente
- [ ] Rate limiting configurado

## 🔄 Manutenção

### Backup
- Supabase faz backup automático
- Configurar backup adicional se necessário

### Updates
```bash
# Atualizar dependências
npm update

# Testar após update
npm run supabase:test
```

### Rollback
```bash
# Rollback de migração
npm run migrate:rollback

# Rollback de deploy
# (processo específico da plataforma)
```

---

**✅ Sistema configurado para produção com Supabase!**

Para iniciar: `npm run prod:setup && npm run prod:start`