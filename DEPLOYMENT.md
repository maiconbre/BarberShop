# 🚀 Guia de Deploy - Barbershop SaaS

Este documento descreve o processo de deploy da plataforma Barbershop SaaS para produção.

## 📋 Pré-requisitos

### Infraestrutura Necessária
- **Frontend**: Vercel, Netlify ou servidor com Node.js
- **Backend**: Servidor com Node.js + PostgreSQL ou Render/Railway
- **Banco de Dados**: PostgreSQL (recomendado) ou MySQL
- **Storage**: Supabase ou AWS S3 para arquivos
- **Email**: Serviço de email (n8n webhook ou SendGrid)

### Variáveis de Ambiente

#### Frontend (.env.production)
```bash
# API Configuration
VITE_API_URL=https://sua-api.com
VITE_DEV_MODE=false
VITE_DEBUG_API=false

# Supabase Configuration
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# Production Monitoring
VITE_LOG_ENDPOINT=https://sua-api.com/api/logs
VITE_LOG_API_KEY=sua-chave-de-logs
VITE_ALERT_ENDPOINT=https://sua-api.com/api/alerts
VITE_ALERT_API_KEY=sua-chave-de-alertas
```

#### Backend (.env.production)
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database
DB_HOST=seu-host-postgres
DB_PORT=5432
DB_NAME=barbershop_prod
DB_USER=seu-usuario
DB_PASSWORD=sua-senha

# Server
PORT=3000
NODE_ENV=production
JWT_SECRET=sua-chave-jwt-super-secreta

# CORS
CORS_ORIGIN=https://seu-frontend.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Service
EMAIL_WEBHOOK_URL=https://seu-n8n.com/webhook/email
EMAIL_API_KEY=sua-chave-email
```

## 🏗️ Processo de Deploy

### 1. Preparação do Backend

```bash
# 1. Clone e configure o backend
git clone https://github.com/seu-usuario/barbershop-backend.git
cd barbershop-backend

# 2. Instale dependências
npm install --production

# 3. Configure variáveis de ambiente
cp .env.example .env.production
# Edite .env.production com suas configurações

# 4. Execute migrações do banco
npm run migrate:prod

# 5. Popule dados iniciais (opcional)
npm run seed:prod

# 6. Teste a aplicação
npm run test:prod
npm start
```

### 2. Deploy do Backend

#### Opção A: Render/Railway (Recomendado)
1. Conecte seu repositório backend
2. Configure as variáveis de ambiente
3. Configure o comando de build: `npm install`
4. Configure o comando de start: `npm start`
5. Configure o health check: `/api/health`

#### Opção B: Servidor Próprio
```bash
# 1. Configure PM2 para gerenciamento de processos
npm install -g pm2

# 2. Crie arquivo ecosystem.config.js
module.exports = {
  apps: [{
    name: 'barbershop-api',
    script: 'server.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}

# 3. Inicie com PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 3. Preparação do Frontend

```bash
# 1. Configure variáveis de produção
cp .env.production.template .env.production
# Edite .env.production com suas configurações

# 2. Execute testes
npm test

# 3. Execute linting
npm run lint

# 4. Build para produção
npm run build:prod

# 5. Teste o build localmente
npm run preview:prod
```

### 4. Deploy do Frontend

#### Opção A: Vercel (Recomendado)
```bash
# 1. Instale Vercel CLI
npm install -g vercel

# 2. Configure o projeto
vercel

# 3. Configure variáveis de ambiente no dashboard
# 4. Deploy
vercel --prod
```

#### Opção B: Netlify
1. Conecte seu repositório no Netlify
2. Configure build command: `npm run build:prod`
3. Configure publish directory: `dist`
4. Configure variáveis de ambiente
5. Deploy automático

## 🔧 Configurações de Produção

### Nginx (se usando servidor próprio)
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name seu-dominio.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Frontend
    location / {
        root /var/www/barbershop/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Database Setup (PostgreSQL)
```sql
-- 1. Criar banco de dados
CREATE DATABASE barbershop_prod;

-- 2. Criar usuário
CREATE USER barbershop_user WITH PASSWORD 'senha-super-secreta';

-- 3. Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE barbershop_prod TO barbershop_user;

-- 4. Configurar conexões
ALTER DATABASE barbershop_prod OWNER TO barbershop_user;
```

## 📊 Monitoramento

### Health Checks
Configure health checks para:
- **Frontend**: Verificar se a aplicação carrega
- **Backend**: `GET /api/health`
- **Database**: Conexão e queries básicas

### Logs
- **Frontend**: Logs enviados para endpoint configurado
- **Backend**: Logs estruturados com Winston
- **Nginx**: Logs de acesso e erro

### Métricas
- **Performance**: Core Web Vitals
- **Errors**: Taxa de erro < 1%
- **Uptime**: > 99.9%
- **Response Time**: < 200ms

## 🔒 Segurança

### SSL/TLS
- Certificado SSL válido
- HTTPS obrigatório
- HSTS headers

### Headers de Segurança
```javascript
// Helmet.js configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

### Rate Limiting
- Configurado no backend
- Limites por IP e por usuário
- Proteção contra DDoS

## 🔄 CI/CD

### GitHub Actions (Exemplo)
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:prod
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Erro de CORS
```javascript
// Backend: configure CORS adequadamente
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
```

#### 2. Variáveis de Ambiente
- Verifique se todas as variáveis estão configuradas
- Use `console.log` para debug (remover em produção)

#### 3. Database Connection
```javascript
// Teste a conexão
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};
```

#### 4. Build Errors
```bash
# Limpe cache e reinstale
rm -rf node_modules package-lock.json
npm install
npm run build:prod
```

## 📞 Suporte

Para problemas de deploy:
1. Verifique os logs de erro
2. Confirme todas as variáveis de ambiente
3. Teste localmente com `npm run preview:prod`
4. Abra uma issue no repositório

---

**Deploy realizado com sucesso! 🎉**