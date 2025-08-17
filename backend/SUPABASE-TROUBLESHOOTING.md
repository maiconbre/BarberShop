# 🔧 Troubleshooting - Erro SCRAM Supabase

## ❌ Problema Identificado

**Erro**: `SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing`

Este erro é comum ao conectar com Supabase e está relacionado à autenticação SASL/SCRAM.

## 🚀 Soluções Rápidas

### 1. Teste Alternativo
```bash
npm run supabase:fix
```

### 2. Verificar Configurações
```bash
# Verificar se as variáveis estão corretas
echo $DATABASE_URL
echo $VITE_SUPABASE_URL
```

### 3. Regenerar Credenciais
1. Acesse o painel do Supabase
2. Vá em Settings > Database
3. Regenere a senha do banco
4. Atualize o `.env.production`

## 🔍 Diagnóstico Detalhado

### Scripts de Teste Disponíveis

| Script | Descrição | Uso |
|--------|-----------|-----|
| `supabase:test` | Teste padrão | `npm run supabase:test` |
| `supabase:fix` | Teste alternativo com fixes | `npm run supabase:fix` |
| `prod:test` | Teste em modo produção | `npm run prod:test` |

### Verificações Implementadas

✅ **Configurações Aplicadas:**
- SSL obrigatório com `rejectUnauthorized: false`
- `application_name` definido
- `search_path` configurado para `public`
- Timeouts ajustados para Supabase
- Pool de conexões otimizado

## 🛠️ Fixes Implementados

### 1. Configuração do Database (`config/database.js`)
```javascript
dialectOptions: {
  ssl: {
    require: true,
    rejectUnauthorized: false
  },
  keepAlive: true,
  statement_timeout: 30000,
  idle_in_transaction_session_timeout: 30000,
  application_name: 'barbershop_backend',
  options: '--search_path=public'
}
```

### 2. Script de Teste Alternativo
- Teste com cliente `pg` nativo
- Teste com Sequelize alternativo
- Configurações específicas para SCRAM
- Retry logic melhorada

### 3. Pool de Conexões Otimizado
```javascript
pool: {
  max: 10,
  min: 2,
  idle: 30000,
  acquire: 60000,
  evict: 5000
}
```

## 🔄 Passos para Resolver

### Passo 1: Testar Conexão Alternativa
```bash
cd backend
npm run supabase:fix
```

### Passo 2: Se Falhar, Verificar URL
```bash
# Verificar formato da URL
echo $DATABASE_URL

# Deve estar no formato:
# postgresql://postgres.xxxxx:senha@host:6543/postgres
```

### Passo 3: Regenerar Credenciais no Supabase
1. **Acessar Supabase Dashboard**
   - https://xxxsgvqbnkftoswascds.supabase.co

2. **Ir para Settings > Database**
   - Clicar em "Reset database password"
   - Copiar nova senha

3. **Atualizar .env.production**
   ```env
   DATABASE_URL=postgresql://postgres.xxxsgvqbnkftoswascds:NOVA_SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```

4. **Testar Novamente**
   ```bash
   npm run supabase:fix
   ```

### Passo 4: Verificar Configurações de Rede
```bash
# Testar conectividade básica
telnet aws-0-sa-east-1.pooler.supabase.com 6543

# Ou usar PowerShell
Test-NetConnection aws-0-sa-east-1.pooler.supabase.com -Port 6543
```

## 🌐 Configurações de Rede

### Firewall/Proxy
- Verificar se a porta 6543 está liberada
- Verificar se não há proxy bloqueando
- Testar em rede diferente se necessário

### DNS
```bash
# Verificar resolução DNS
nslookup aws-0-sa-east-1.pooler.supabase.com
```

## 📋 Checklist de Troubleshooting

- [ ] Executar `npm run supabase:fix`
- [ ] Verificar formato da DATABASE_URL
- [ ] Regenerar senha no Supabase
- [ ] Atualizar .env.production
- [ ] Testar conectividade de rede
- [ ] Verificar firewall/proxy
- [ ] Testar em rede diferente
- [ ] Verificar status do Supabase

## 🔗 Links Úteis

- **Supabase Status**: https://status.supabase.com
- **Supabase Docs**: https://supabase.com/docs/guides/database/connecting-to-postgres
- **Dashboard**: https://xxxsgvqbnkftoswascds.supabase.co

## 🆘 Se Nada Funcionar

### Alternativa 1: Usar Connection Pooling
```env
# Trocar pooler por direct connection
DATABASE_URL=postgresql://postgres.xxxsgvqbnkftoswascds:senha@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

### Alternativa 2: Usar Supabase Client
```javascript
// Em vez de Sequelize, usar cliente Supabase
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);
```

### Alternativa 3: Contatar Suporte
- Abrir ticket no Supabase
- Fornecer logs completos
- Mencionar erro SCRAM-SERVER-FINAL-MESSAGE

## 📊 Logs Úteis

```bash
# Habilitar logs detalhados
set DEBUG=*
npm run supabase:fix

# Ou logs específicos do PostgreSQL
set DEBUG=pg:*
npm run supabase:fix
```

---

**💡 Dica**: O erro SCRAM é geralmente resolvido com regeneração de credenciais ou ajustes na configuração SSL/TLS.