# Guia de Configuração para Produção

## Visão Geral

Este documento detalha o processo completo de configuração e deploy da plataforma BarberShop SaaS em ambiente de produção.

## Pré-requisitos

- Node.js 18+ 
- PostgreSQL 14+
- Conta no Render.com (ou similar)
- Conta no Supabase
- Domínio configurado (opcional)

## 1. Configuração do Banco de Dados

### PostgreSQL em Produção

1. **Criar banco PostgreSQL no Render:**
   ```bash
   # No dashboard do Render:
   # 1. New > PostgreSQL
   # 2. Nome: barbershop-saas-prod
   # 3. Região: Oregon (US West)
   # 4. Plan: Starter ($7/mês)
   ```

2. **Configurar variáveis de ambiente:**
   ```env
   DATABASE_URL=postgresql://username:password@hostname:port/database_name
   ```

### Backup Automático

O Render.com já fornece backup automático para bancos PostgreSQL:
- Backups diários automáticos
- Retenção de 7 dias no plano Starter
- Restore via dashboard do Render

## 2. Configuração do Backend

### Variáveis de Ambiente Obrigatórias

```env
# Ambiente
NODE_ENV=production

# Servidor
PORT=8000
HOST=0.0.0.0

# Banco de dados
DATABASE_URL=postgresql://username:password@hostname:port/database_name

# JWT (GERAR CHAVES SEGURAS)
JWT_SECRET=sua_chave_jwt_segura_64_caracteres_minimo
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=sua_chave_refresh_token_segura_64_caracteres_minimo
REFRESH_TOKEN_EXPIRES_IN=7d

# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
SUPABASE_SERVICE_KEY=sua_chave_servico_supabase

# Email (n8n webhook)
N8N_EMAIL_WEBHOOK_URL=https://sua-instancia-n8n.com/webhook/send-email

# Logs
ENABLE_SQL_LOGS=false
```

### Gerar Chaves Seguras

```bash
# JWT Secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Refresh Token Secret  
node -e "console.log('REFRESH_TOKEN_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

## 3. Configuração do Frontend

### Variáveis de Ambiente

```env
# API
VITE_API_URL=https://seu-backend.onrender.com

# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_supabase

# Configurações de produção
VITE_DEV_MODE=false
VITE_DEBUG_API=false
VITE_MOCK_DATA=false
```

### Build de Produção

```bash
# Instalar dependências
npm install

# Build otimizado
npm run build:prod

# Preview local (opcional)
npm run preview:prod
```

## 4. Deploy no Render

### Backend

1. **Conectar repositório:**
   - New > Web Service
   - Conectar repositório GitHub
   - Root Directory: `backend`

2. **Configurações de build:**
   ```yaml
   Build Command: npm install
   Start Command: npm start
   ```

3. **Configurar variáveis de ambiente:**
   - Adicionar todas as variáveis listadas acima
   - Usar chaves seguras geradas

### Frontend

1. **Conectar repositório:**
   - New > Static Site
   - Conectar repositório GitHub
   - Root Directory: `/` (raiz)

2. **Configurações de build:**
   ```yaml
   Build Command: npm run build:prod
   Publish Directory: dist
   ```

3. **Configurar variáveis de ambiente:**
   - Adicionar variáveis VITE_* listadas acima

## 5. Configuração de Domínio (Opcional)

### Custom Domain

1. **No Render:**
   - Settings > Custom Domains
   - Adicionar domínio: `app.seudominio.com`

2. **DNS:**
   ```
   CNAME app.seudominio.com -> seu-app.onrender.com
   ```

### SSL

- SSL automático fornecido pelo Render
- Certificados Let's Encrypt renovados automaticamente

## 6. Monitoramento e Logs

### Logs de Aplicação

Os logs são automaticamente coletados pelo Render:
- Acesso via dashboard > Logs
- Retenção de 7 dias
- Filtros por severidade

### Métricas Básicas

Render fornece métricas básicas:
- CPU usage
- Memory usage
- Response time
- Request count

### Alertas

Configurar alertas no Render:
- Deploy failures
- Service downtime
- High error rates

## 7. Segurança

### HTTPS

- Forçado automaticamente pelo Render
- Redirecionamento HTTP → HTTPS

### Variáveis de Ambiente

- Nunca commitar secrets no código
- Usar variáveis de ambiente do Render
- Rotacionar chaves JWT periodicamente

### Rate Limiting

Rate limiting já implementado no backend:
- 200 req/min para leitura
- 20 req/min para escrita
- Bloqueio automático de IPs suspeitos

## 8. Backup e Recuperação

### Banco de Dados

- Backup automático diário (Render)
- Restore via dashboard
- Export manual quando necessário

### Código

- Repositório Git como backup
- Tags para releases
- Rollback via Render dashboard

## 9. Checklist de Deploy

### Pré-Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Chaves JWT geradas e seguras
- [ ] Banco PostgreSQL criado
- [ ] Supabase configurado
- [ ] Testes passando localmente

### Deploy

- [ ] Backend deployado no Render
- [ ] Frontend deployado no Render
- [ ] Domínio configurado (se aplicável)
- [ ] SSL ativo
- [ ] Logs funcionando

### Pós-Deploy

- [ ] Teste de cadastro de barbearia
- [ ] Teste de login/logout
- [ ] Teste de agendamento
- [ ] Teste de upgrade de plano
- [ ] Monitoramento ativo

## 10. Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco:**
   - Verificar DATABASE_URL
   - Confirmar que banco está ativo
   - Testar conexão local

2. **Erro de JWT:**
   - Verificar se JWT_SECRET tem 64+ caracteres
   - Confirmar que não há espaços extras
   - Regenerar chaves se necessário

3. **Erro de CORS:**
   - Verificar VITE_API_URL no frontend
   - Confirmar configuração de CORS no backend

4. **Deploy falha:**
   - Verificar logs de build
   - Confirmar dependências no package.json
   - Testar build local

### Logs Úteis

```bash
# Ver logs do backend
curl https://seu-backend.onrender.com/api/health

# Testar conexão com banco
curl https://seu-backend.onrender.com/api/auth/users
```

## 11. Manutenção

### Atualizações

- Deploy automático via Git push
- Rollback via Render dashboard se necessário
- Testar em staging antes de produção

### Monitoramento Contínuo

- Verificar logs diariamente
- Monitorar métricas de performance
- Acompanhar uso de recursos

### Backup Regular

- Verificar backups automáticos
- Fazer export manual mensal
- Testar restore periodicamente