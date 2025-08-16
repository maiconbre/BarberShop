# Checklist de Deploy para Produção

## Pré-Deploy

### 🔧 Configuração do Ambiente

- [ ] **Variáveis de ambiente configuradas**
  - [ ] `VITE_API_URL` apontando para backend de produção
  - [ ] `VITE_SUPABASE_URL` configurada
  - [ ] `VITE_SUPABASE_ANON_KEY` configurada
  - [ ] `VITE_DEV_MODE=false`
  - [ ] `VITE_DEBUG_API=false`
  - [ ] `VITE_MOCK_DATA=false`

- [ ] **Backend configurado**
  - [ ] `DATABASE_URL` configurada com PostgreSQL de produção
  - [ ] `JWT_SECRET` gerado com 64+ caracteres
  - [ ] `REFRESH_TOKEN_SECRET` gerado com 64+ caracteres
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=8000` (ou conforme provedor)
  - [ ] `HOST=0.0.0.0`

### 🧪 Testes e Validação

- [ ] **Testes locais passando**
  ```bash
  npm run test:run
  npm run lint
  npm run build:prod
  ```

- [ ] **Build de produção funcionando**
  ```bash
  npm run preview:prod
  ```

- [ ] **Health check local**
  ```bash
  npm run health-check
  ```

### 🗄️ Banco de Dados

- [ ] **PostgreSQL configurado**
  - [ ] Banco criado no provedor (Render, AWS RDS, etc.)
  - [ ] Conexão testada
  - [ ] Backup inicial realizado

- [ ] **Migrações aplicadas**
  - [ ] Estrutura multi-tenant criada
  - [ ] Seeders executados se necessário
  - [ ] Índices de performance criados

## Deploy

### 🚀 Backend Deploy

- [ ] **Render.com (ou provedor escolhido)**
  - [ ] Repositório conectado
  - [ ] Build command: `npm install`
  - [ ] Start command: `npm start`
  - [ ] Todas as variáveis de ambiente configuradas
  - [ ] Deploy realizado com sucesso

- [ ] **Verificação do backend**
  - [ ] URL acessível: `https://seu-backend.onrender.com`
  - [ ] Health check: `GET /api/health`
  - [ ] Endpoints críticos respondendo

### 🌐 Frontend Deploy

- [ ] **Render.com Static Site (ou provedor escolhido)**
  - [ ] Repositório conectado
  - [ ] Build command: `npm run build:prod`
  - [ ] Publish directory: `dist`
  - [ ] Variáveis VITE_* configuradas
  - [ ] Deploy realizado com sucesso

- [ ] **Verificação do frontend**
  - [ ] URL acessível: `https://seu-frontend.onrender.com`
  - [ ] Página carrega corretamente
  - [ ] Assets estáticos carregando

### 🔗 Integração

- [ ] **Comunicação frontend-backend**
  - [ ] API calls funcionando
  - [ ] CORS configurado corretamente
  - [ ] Autenticação funcionando
  - [ ] Multi-tenant funcionando

## Pós-Deploy

### ✅ Testes de Produção

- [ ] **Fluxo completo de cadastro**
  - [ ] Cadastro de nova barbearia
  - [ ] Verificação de email (se implementado)
  - [ ] Login na barbearia criada
  - [ ] Dashboard carregando

- [ ] **Funcionalidades críticas**
  - [ ] Criação de agendamento
  - [ ] Listagem de serviços
  - [ ] Gestão de barbeiros
  - [ ] Isolamento multi-tenant

- [ ] **Performance**
  - [ ] Tempo de carregamento < 3s
  - [ ] API response time < 2s
  - [ ] Sem erros no console

### 🔒 Segurança

- [ ] **HTTPS ativo**
  - [ ] Frontend usando HTTPS
  - [ ] Backend usando HTTPS
  - [ ] Redirecionamento HTTP → HTTPS

- [ ] **Headers de segurança**
  - [ ] Content Security Policy
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options

### 📊 Monitoramento

- [ ] **Logs funcionando**
  - [ ] Logs do backend visíveis
  - [ ] Logs do frontend (se configurado)
  - [ ] Erros sendo capturados

- [ ] **Métricas básicas**
  - [ ] Uptime monitoring
  - [ ] Response time monitoring
  - [ ] Error rate monitoring

### 🔄 Backup

- [ ] **Backup automático configurado**
  - [ ] Script de backup testado
  - [ ] Agendamento configurado (cron/scheduler)
  - [ ] Restore testado

## Configuração de Domínio (Opcional)

### 🌐 Custom Domain

- [ ] **DNS configurado**
  - [ ] CNAME para frontend: `app.seudominio.com`
  - [ ] CNAME para backend: `api.seudominio.com`
  - [ ] Propagação DNS verificada

- [ ] **SSL configurado**
  - [ ] Certificados válidos
  - [ ] Auto-renewal configurado

## Monitoramento Contínuo

### 📈 Métricas de Saúde

- [ ] **Uptime**
  - [ ] Frontend > 99%
  - [ ] Backend > 99%
  - [ ] Database > 99%

- [ ] **Performance**
  - [ ] Page load time < 3s
  - [ ] API response time < 2s
  - [ ] Database query time < 500ms

- [ ] **Erros**
  - [ ] Error rate < 1%
  - [ ] No critical errors
  - [ ] Logs being monitored

### 🚨 Alertas

- [ ] **Configurar alertas para:**
  - [ ] Service downtime
  - [ ] High error rates
  - [ ] Slow response times
  - [ ] Database connection issues
  - [ ] Disk space low
  - [ ] Memory usage high

## Rollback Plan

### 🔄 Plano de Contingência

- [ ] **Rollback preparado**
  - [ ] Versão anterior identificada
  - [ ] Processo de rollback documentado
  - [ ] Backup de dados recente

- [ ] **Comunicação**
  - [ ] Stakeholders identificados
  - [ ] Canal de comunicação definido
  - [ ] Processo de escalação documentado

## Checklist Final

### ✅ Validação Completa

- [ ] **Funcionalidade**
  - [ ] Todos os fluxos críticos testados
  - [ ] Multi-tenant funcionando
  - [ ] Performance aceitável
  - [ ] Sem erros críticos

- [ ] **Segurança**
  - [ ] HTTPS ativo
  - [ ] Dados sensíveis protegidos
  - [ ] Rate limiting funcionando
  - [ ] Logs de auditoria ativos

- [ ] **Monitoramento**
  - [ ] Health checks ativos
  - [ ] Alertas configurados
  - [ ] Backup funcionando
  - [ ] Logs sendo coletados

- [ ] **Documentação**
  - [ ] Processo de deploy documentado
  - [ ] Configurações documentadas
  - [ ] Contatos de emergência definidos
  - [ ] Runbook de troubleshooting criado

## Comandos Úteis

```bash
# Validar configuração local
npm run production:validate

# Health check de produção
npm run health-check

# Backup manual
npm run backup:db

# Build e preview local
npm run build:prod && npm run preview:prod

# Verificar logs (Render)
# Acessar dashboard do Render > Logs

# Testar endpoints críticos
curl https://seu-backend.onrender.com/api/health
curl https://seu-backend.onrender.com/api/barbershops
```

## Contatos de Emergência

- **Desenvolvedor Principal:** [seu-email@exemplo.com]
- **DevOps/Infraestrutura:** [devops@exemplo.com]
- **Suporte Render:** [support@render.com]
- **Suporte Supabase:** [support@supabase.io]

---

**Data do Deploy:** ___________  
**Responsável:** ___________  
**Versão:** ___________  
**Status:** ___________