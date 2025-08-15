# Setup de Desenvolvimento Coordenado - Frontend + Backend

## 🎯 Objetivo

Configurar ambiente para desenvolvimento simultâneo do frontend e backend, permitindo testes integrados e desenvolvimento ágil.

## ✅ Status Atual

- ✅ **Backend clonado** em `/backend`
- ✅ **Scripts configurados** no package.json
- ✅ **Proxy configurado** no vite.config.ts
- ✅ **Concurrently adicionado** como dependência

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
# Instalar dependências do frontend (incluindo concurrently)
npm install

# Instalar dependências do backend
npm run install:backend
```

### 2. Rodar Desenvolvimento Integrado

```bash
# Roda frontend (porta 5173) + backend (porta 6543) simultaneamente
npm run dev:fullstack
```

### 3. Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev:fullstack    # Frontend + Backend juntos
npm run dev:frontend     # Apenas frontend (porta 5173)
npm run dev:backend      # Apenas backend (porta 6543)

# Instalação
npm run install:backend  # Instalar deps do backend

# Testes
npm run test:integration # Testes integrados (a implementar)
```

## 🔧 Configurações Aplicadas

### Frontend (Vite)
```typescript
// vite.config.ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:6543', // Backend local
      changeOrigin: true,
      secure: false,
    },
  },
}
```

### Backend (Express)
```javascript
// backend/server.js
const PORT = process.env.PORT || 6543; // Porta configurada
const HOST = process.env.HOST || '0.0.0.0';

// CORS já configurado para desenvolvimento
```

### Package.json
```json
{
  "scripts": {
    "dev:fullstack": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "vite",
    "dev:backend": "cd backend && npm run dev"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

## 🌐 URLs de Desenvolvimento

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:6543
- **API Proxy**: http://localhost:5173/api/* → http://localhost:6543/api/*

## 📋 Estrutura de Desenvolvimento

```
BarberShop/
├── src/                    # Frontend React
├── backend/                # Backend Node.js (temporário)
│   ├── server.js          # Entry point (porta 6543)
│   ├── package.json       # Deps do backend
│   └── ...
├── package.json           # Deps do frontend + scripts coordenados
├── vite.config.ts         # Proxy configurado
└── ...
```

## 🔄 Workflow de Desenvolvimento

### 1. Iniciar Ambiente
```bash
npm run dev:fullstack
```

### 2. Desenvolver
- **Frontend**: Modificar arquivos em `src/`
- **Backend**: Modificar arquivos em `backend/`
- **Hot Reload**: Ambos recarregam automaticamente

### 3. Testar Integração
- Frontend faz chamadas para `/api/*`
- Vite proxy redireciona para `localhost:6543`
- Backend responde com dados reais

### 4. Debug
- **Frontend**: DevTools do navegador
- **Backend**: Logs no terminal
- **Network**: Ver requisições no DevTools

## 🧪 Testes de Integração

### Endpoints para Testar
```bash
# Testar se backend está rodando
curl http://localhost:6543/

# Testar proxy do frontend
curl http://localhost:5173/api/

# Testar endpoints específicos
curl http://localhost:5173/api/barbers
curl http://localhost:5173/api/services
curl http://localhost:5173/api/appointments
```

### Validar Integração
1. **Abrir frontend**: http://localhost:5173
2. **Verificar Network tab**: Requisições para `/api/*`
3. **Confirmar respostas**: Dados do backend real
4. **Testar CRUD**: Criar, ler, atualizar, deletar

## 🐛 Troubleshooting

### Backend não inicia
```bash
# Verificar se porta 6543 está livre
netstat -an | findstr 6543

# Verificar dependências do backend
cd backend && npm install

# Verificar variáveis de ambiente
cd backend && cat .env
```

### Proxy não funciona
```bash
# Verificar configuração do Vite
cat vite.config.ts

# Verificar se backend está na porta correta
curl http://localhost:6543/
```

### CORS errors
```bash
# Verificar configuração CORS do backend
cd backend && cat config/cors.js

# Verificar se origins estão corretos
```

## 📝 Próximos Passos

### Após Setup
1. **Testar integração** com endpoints reais
2. **Implementar repositórios** baseados na API real
3. **Criar hooks** usando estrutura real do backend
4. **Migrar componentes** para nova arquitetura

### Antes do Deploy
1. **Aplicar mudanças** no repositório backend separado
2. **Remover pasta backend** do frontend
3. **Atualizar configurações** para backend remoto
4. **Commit separado** em cada repositório

---

**Status**: ✅ Ambiente configurado e pronto para desenvolvimento coordenado