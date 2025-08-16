# 🚀 Guia de Deploy - BarberShop SaaS

Este documento contém instruções completas para deploy da aplicação BarberShop SaaS em produção.

## 📋 Pré-requisitos

### Infraestrutura Necessária

- **Frontend**: Vercel, Netlify ou servidor com Node.js 18+
- **Backend**: Render, Railway ou servidor com Node.js 18+
- **Banco de Dados**: PostgreSQL (Supabase recomendado)
- **Storage**: Supabase Storage para uploads
- **Email**: n8n webhook ou serviço SMTP

### Variáveis de Ambiente

#### Frontend (.env.production)
```bash
# API Configuration
VITE_API_URL=https://your-backend-domain.com
VITE_DEV_MODE=false
VITE_DEBUG_API=false
VITE_MOCK_DATA=false

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Application Configuration
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=BarberShop SaaS
VITE_SUPPORT_EMAIL=suporte@barbershopsaas.com

# Monitoring (opcional)
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ANALYTICS_ID=your-analytics-id
```

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=your-super-secure-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Email Configuration
N8N_EMAIL_WEBHOOK_URL=https://your-n8n-instance.com/webhook/email

# Environment
NODE_ENV=production
PORT=3000

# Security
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=warn
```

## 🏗️ Deploy do Backend

### 1. Preparação do Código

```bash
# Clone o repositório
git clone https://github.com/your-repo/barbershop-backend.git
cd barbershop-backend

# Instalar dependências
npm install --production

# Executar migrações do banco
npm run migrate

# Executar seeders (opcional, apenas para dados iniciais)
npm run seed
```

### 2. Deploy no Render

1. **Conectar Repositório**
   - Acesse [Render Dashboard](https://dashboard.render.com)
   - Clique em "New +" → "Web Service"
   - Conecte seu repositório GitHub

2. **Configurar Serviço**
   ```yaml
   Name: barbershop-backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

3. **Configurar Variáveis de Ambiente**
   - Adicione todas as variáveis listadas acima
   - Configure DATABASE_URL com seu banco PostgreSQL

4. **Deploy**
   - Clique em "Create Web Service"
   - Aguarde o deploy completar

### 3. Deploy no Railway (Alternativa)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar projeto
railway init

# Configurar variáveis
railway variables set DATABASE_URL="your-database-url"
railway variables set JWT_SECRET="your-jwt-secret"
# ... outras variáveis

# Deploy
railway up
```

## 🌐 Deploy do Frontend

### 1. Preparação do Build

```bash
# Clone o repositório
git clone https://github.com/your-repo/barbershop-frontend.git
cd barbershop-frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.production .env.local
# Editar .env.local com suas configurações

# Build para produção
npm run build

# Testar build localmente
npm run preview
```

### 2. Deploy na Vercel

1. **Via Dashboard**
   - Acesse [Vercel Dashboard](https://vercel.com/dashboard)
   - Clique em "New Project"
   - Conecte seu repositório GitHub
   - Configure as variáveis de ambiente
   - Deploy automático

2. **Via CLI**
   ```bash
   # Instalar Vercel CLI
   npm install -g vercel

   # Login
   vercel login

   # Deploy
   vercel --prod
   ```

### 3. Deploy na Netlify (Alternativa)

1. **Via Dashboard**
   - Acesse [Netlify Dashboard](https://app.netlify.com)
   - Drag & drop da pasta `dist/` ou conecte repositório
   - Configure variáveis de ambiente
   - Configure redirects para SPA

2. **Configurar _redirects**
   ```
   # Arquivo: public/_redirects
   /*    /index.html   200
   ```

## 🗄️ Configuração do Banco de Dados

### 1. Supabase (Recomendado)

1. **Criar Projeto**
   - Acesse [Supabase Dashboard](https://app.supabase.com)
   - Clique em "New Project"
   - Configure nome, senha e região

2. **Configurar Tabelas**
   ```sql
   -- Execute no SQL Editor do Supabase
   -- As migrações estão em backend/migrations/
   ```

3. **Configurar Storage**
   - Vá para Storage → Create Bucket
   - Nome: `barbershop-assets`
   - Configurar políticas de acesso

### 2. PostgreSQL Externo

```bash
# Conectar ao banco
psql -h your-host -U your-user -d your-database

# Executar migrações
\i backend/migrations/001_initial_schema.sql
\i backend/migrations/002_multi_tenant.sql
# ... outras migrações
```

## 📧 Configuração de Email

### 1. n8n Webhook (Recomendado)

1. **Configurar Workflow**
   ```json
   {
     "nodes": [
       {
         "name": "Webhook",
         "type": "n8n-nodes-base.webhook",
         "parameters": {
           "path": "barbershop-email"
         }
       },
       {
         "name": "Email",
         "type": "n8n-nodes-base.emailSend",
         "parameters": {
           "fromEmail": "noreply@barbershopsaas.com",
           "toEmail": "={{ $json.to }}",
           "subject": "={{ $json.subject }}",
           "html": "={{ $json.html }}"
         }
       }
     ]
   }
   ```

2. **Configurar Variável**
   ```bash
   N8N_EMAIL_WEBHOOK_URL=https://your-n8n.com/webhook/barbershop-email
   ```

### 2. SMTP Direto (Alternativa)

```bash
# Configurar no backend
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🔒 Configurações de Segurança

### 1. HTTPS

- **Vercel/Netlify**: HTTPS automático
- **Servidor próprio**: Configure certificado SSL

### 2. CORS

```javascript
// backend/middleware/cors.js
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://your-domain.com',
  credentials: true,
  optionsSuccessStatus: 200
};
```

### 3. Rate Limiting

```javascript
// backend/middleware/rateLimiting.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Muitas tentativas, tente novamente em 15 minutos'
});
```

### 4. Variáveis Sensíveis

- Use gerenciadores de secrets (Vercel Secrets, Railway Variables)
- Nunca commite secrets no código
- Rotacione chaves regularmente

## 📊 Monitoramento

### 1. Logs de Aplicação

```javascript
// backend/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 2. Monitoramento de Erros

```bash
# Sentry (Recomendado)
npm install @sentry/node @sentry/tracing

# Configurar no backend
SENTRY_DSN=your-sentry-dsn
```

### 3. Métricas de Performance

```javascript
// backend/middleware/metrics.js
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});
```

## 🔄 CI/CD Pipeline

### 1. GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 2. Hooks de Deploy

```bash
# Render Deploy Hook
curl -X POST "https://api.render.com/deploy/srv-your-service-id"

# Vercel Deploy Hook
curl -X POST "https://api.vercel.com/v1/integrations/deploy/your-hook-id"
```

## 🧪 Testes em Produção

### 1. Health Checks

```javascript
// backend/routes/health.js
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
    uptime: process.uptime()
  });
});
```

### 2. Smoke Tests

```bash
# Testar endpoints críticos
curl https://your-api.com/health
curl https://your-api.com/api/barbershops/check-slug/test
```

### 3. Monitoramento Contínuo

```bash
# Uptime monitoring
# Configure no UptimeRobot, Pingdom ou similar
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **CORS Errors**
   ```javascript
   // Verificar configuração de CORS
   // Certificar que frontend domain está na whitelist
   ```

2. **Database Connection**
   ```bash
   # Testar conexão
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. **Environment Variables**
   ```bash
   # Verificar se todas as variáveis estão definidas
   echo $VITE_API_URL
   ```

4. **Build Errors**
   ```bash
   # Limpar cache e reinstalar
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

### Logs Úteis

```bash
# Backend logs
heroku logs --tail -a your-app-name

# Vercel logs
vercel logs your-deployment-url

# Render logs
# Acessar via dashboard
```

## 📈 Otimizações de Performance

### 1. Frontend

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react']
        }
      }
    }
  }
});
```

### 2. Backend

```javascript
// Compression
app.use(compression());

// Static files caching
app.use(express.static('public', {
  maxAge: '1y',
  etag: false
}));
```

### 3. Database

```sql
-- Índices importantes
CREATE INDEX idx_appointments_barbershop_date ON appointments(barbershop_id, date);
CREATE INDEX idx_users_barbershop ON users(barbershop_id);
```

## 🔐 Backup e Recuperação

### 1. Backup Automático

```bash
# Script de backup diário
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/
```

### 2. Recuperação

```bash
# Restaurar backup
psql $DATABASE_URL < backup_20231201.sql
```

## 📞 Suporte

Para problemas de deploy, contate:
- **Email**: dev@barbershopsaas.com
- **Slack**: #deploy-support
- **Documentação**: https://docs.barbershopsaas.com

---

**Última atualização**: Dezembro 2024
**Versão**: 1.0.0