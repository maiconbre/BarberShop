# 🚀 Guia de Deploy - Koyeb

## Por que Koyeb?

- ✅ **Interface super simples** - Deploy via GitHub em poucos cliques
- ✅ **PostgreSQL com 1 clique** - Banco de dados gerenciado
- ✅ **Plano gratuito** - Até 2 apps gratuitas
- ✅ **Deploy automático** - Conecta direto com GitHub
- ✅ **Sem CLI necessária** - Tudo via interface web
- ✅ **Global por padrão** - Edge computing

## 📋 Pré-requisitos

1. **Conta no GitHub** - Repositório do projeto
2. **Conta no Koyeb** - [Criar conta gratuita](https://app.koyeb.com/auth/signup)
3. **Código no GitHub** - Push do projeto

## 🚀 Deploy em 5 Passos

### 1. Preparar o Repositório

Certifique-se que o código está no GitHub:
```bash
git add .
git commit -m "Preparando para deploy no Koyeb"
git push origin main
```

### 2. Acessar o Koyeb

1. Acesse [app.koyeb.com](https://app.koyeb.com)
2. Faça login com GitHub
3. Clique em **"Create App"**

### 3. Configurar a Aplicação

1. **Source**: Selecione **"GitHub"**
2. **Repository**: Escolha seu repositório `Barber-Backend`
3. **Branch**: `main`
4. **Build Command**: `npm install`
5. **Run Command**: `npm start`

### 4. Configurar Variáveis de Ambiente

Na seção **Environment Variables**, adicione:

```
NODE_ENV=production
PORT=8000
HOST=0.0.0.0
JWT_SECRET=seu_jwt_secret_aqui
REFRESH_TOKEN_SECRET=seu_refresh_secret_aqui
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=7d
ENABLE_SQL_LOGS=false
```

### 5. Adicionar PostgreSQL

1. Na mesma tela, vá para **"Services"**
2. Clique em **"Add Service"**
3. Selecione **"PostgreSQL"**
4. Escolha o plano **"Free"**
5. Nome: `barber-postgres`

### 6. Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-3 minutos)
3. Sua API estará disponível em: `https://seu-app.koyeb.app`

## 🔐 Gerando Secrets JWT

Use estes comandos para gerar chaves seguras:

```bash
# JWT Secret (64 caracteres)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Refresh Token Secret (64 caracteres)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🔗 Conectar PostgreSQL

Após criar o PostgreSQL:

1. Vá para **"Services" → "PostgreSQL"**
2. Copie a **Connection String**
3. Adicione como variável de ambiente:
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://user:password@host:port/database`

## 📊 Monitoramento

### Dashboard Koyeb
- **Logs**: Acesse via dashboard do Koyeb
- **Métricas**: CPU, memória, requests
- **Status**: Health checks automáticos

### Testar a API
```bash
# Testar endpoint principal
curl https://seu-app.koyeb.app/

# Testar API
curl https://seu-app.koyeb.app/api/services
```

## 🔄 Atualizações Automáticas

O Koyeb faz deploy automático quando você faz push:

```bash
# Fazer mudanças no código
git add .
git commit -m "Atualização da API"
git push origin main

# Deploy automático será iniciado
```

## 🐘 Configuração do PostgreSQL

### Variáveis Automáticas
O Koyeb cria automaticamente:
- `DATABASE_URL` - String de conexão completa
- `POSTGRES_HOST` - Host do banco
- `POSTGRES_PORT` - Porta (5432)
- `POSTGRES_DB` - Nome do banco
- `POSTGRES_USER` - Usuário
- `POSTGRES_PASSWORD` - Senha

### Conectar ao Banco
Use a `DATABASE_URL` que é criada automaticamente.

## 💰 Custos

### Plano Gratuito
- ✅ **2 Apps** gratuitas
- ✅ **PostgreSQL** 1GB gratuito
- ✅ **100GB** bandwidth/mês
- ✅ **Compute**: 512MB RAM

### Limites
- **Apps**: 2 apps simultâneas
- **RAM**: 512MB por app
- **Storage**: 1GB PostgreSQL
- **Bandwidth**: 100GB/mês

## 🔧 Troubleshooting

### App não inicia
1. Verifique os logs no dashboard
2. Confirme as variáveis de ambiente
3. Teste localmente: `npm start`

### Erro de conexão com banco
1. Verifique se PostgreSQL foi criado
2. Confirme a `DATABASE_URL`
3. Teste a conexão no dashboard

### Build falha
1. Verifique o `package.json`
2. Confirme as dependências
3. Teste localmente: `npm install`

## 📈 Otimizações

### Performance
- ✅ **Auto-scaling**: Ajuste automático
- ✅ **CDN**: Global por padrão
- ✅ **Health checks**: Monitoramento contínuo
- ✅ **SSL**: HTTPS automático

### Configurações Avançadas
```yaml
# koyeb.yaml (opcional)
name: barber-backend-api
services:
  - name: api
    type: web
    instance_type: nano
    regions:
      - fra
    scaling:
      min: 1
      max: 2
```

## 🌍 Domínio Customizado

1. Vá para **"Settings" → "Domains"**
2. Clique em **"Add Domain"**
3. Configure DNS:
   ```
   CNAME: seu-dominio.com → seu-app.koyeb.app
   ```

## 🎯 Vantagens do Koyeb

- 🚀 **Deploy mais simples** que Heroku/Railway
- 💰 **Plano gratuito generoso**
- 🔄 **Deploy automático** via GitHub
- 🌍 **Global por padrão**
- 📊 **Dashboard intuitivo**
- 🔒 **SSL automático**
- 📈 **Auto-scaling**

## 🆘 Suporte

- **Documentação**: [docs.koyeb.com](https://docs.koyeb.com)
- **Community**: [community.koyeb.com](https://community.koyeb.com)
- **Status**: [status.koyeb.com](https://status.koyeb.com)

---

**✨ Resumo**: Koyeb é a opção mais simples para deploy - conecte GitHub, configure PostgreSQL e pronto! 🎉