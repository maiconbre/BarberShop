# Workflow de Desenvolvimento Coordenado Frontend + Backend

## 🎯 Objetivo

Desenvolver melhorias coordenadas no frontend e backend mantendo os repositórios separados e deploys automáticos independentes.

## 📋 Estratégia

```
┌─────────────────┐    ┌─────────────────┐
│   Repo Frontend │    │   Repo Backend  │
│   (Principal)   │    │   (Separado)    │
└─────────────────┘    └─────────────────┘
         │                       │
         │ 1. Clone temporário    │
         ▼                       │
┌─────────────────┐              │
│ Desenvolvimento │              │
│    Integrado    │              │
│                 │              │
│ /frontend       │              │
│ /backend ←──────┼──────────────┘
│ /shared (temp)  │
└─────────────────┘
         │
         │ 2. Desenvolvimento coordenado
         │ 3. Testes integrados
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│ Aplicar mudanças│    │ Aplicar mudanças│
│ no Frontend     │    │ no Backend      │
└─────────────────┘    └─────────────────┘
         │                       │
         │ 4. Remove /backend    │
         │ 5. Commit frontend    │ 6. Commit backend
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ Deploy Auto     │    │ Deploy Auto     │
│ Frontend        │    │ Backend         │
└─────────────────┘    └─────────────────┘
```

## 🚀 Fase 1: Setup Inicial

### 1.1 Preparar Ambiente
```bash
# No projeto frontend atual
mkdir temp-backend
cd temp-backend
git clone [URL_DO_REPO_BACKEND] .
cd ..
mv temp-backend backend

# Estrutura resultante:
# projeto-frontend/
# ├── src/           # Frontend atual
# ├── backend/       # Backend clonado (temporário)
# ├── package.json   # Frontend
# └── .git/          # Git do frontend
```

### 1.2 Configurar Scripts de Desenvolvimento
```json
// package.json (adicionar scripts)
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "vite",
    "dev:backend": "cd backend && npm run dev",
    "install:backend": "cd backend && npm install",
    "test:integration": "# Testes E2E locais"
  }
}
```

### 1.3 Configurar Proxy/CORS
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Backend local
        changeOrigin: true
      }
    }
  }
})
```

## 🔧 Fase 2: Desenvolvimento Coordenado

### 2.1 Workflow Diário
```bash
# 1. Iniciar desenvolvimento
npm run dev  # Roda frontend + backend

# 2. Fazer mudanças coordenadas
# - Frontend: src/
# - Backend: backend/src/
# - Shared types: criar pasta shared/ temporária

# 3. Testar integração
npm run test:integration
```

### 2.2 Sincronização de Types
```typescript
// shared/types/api.ts (temporário)
export interface User {
  id: string;
  name: string;
  email: string;
  // ... campos sincronizados
}

// Frontend usa: import { User } from '../shared/types/api'
// Backend usa: import { User } from '../shared/types/api'
```

### 2.3 Documentar Mudanças
```markdown
# MUDANCAS_BACKEND.md
## Endpoints Adicionados
- GET /api/appointments/user/:userId
- PATCH /api/services/:id/status

## Campos Modificados
- User.role: string -> enum
- Service.duration: number (em minutos)

## Melhorias de Performance
- Cache em endpoints de listagem
- Paginação padronizada
```

## 📤 Fase 3: Sincronização com Repositórios

### 3.1 Aplicar Mudanças no Backend
```bash
# 1. Ir para repositório backend separado
cd ../repositorio-backend-separado

# 2. Aplicar mudanças da pasta backend/
cp -r ../projeto-frontend/backend/src/* ./src/
# (ou usar diff/merge tools)

# 3. Testar mudanças
npm test
npm run dev

# 4. Commit e deploy
git add .
git commit -m "feat: melhorias coordenadas com frontend"
git push origin main  # Deploy automático
```

### 3.2 Limpar e Finalizar Frontend
```bash
# No projeto frontend
# 1. Validar que funciona com backend remoto
npm run dev  # Testar com backend em produção

# 2. Remover pasta backend temporária
rm -rf backend/
rm -rf shared/  # Se criou pasta shared

# 3. Atualizar configurações
# - Remover proxy local do vite.config.ts
# - Atualizar API_CONFIG para usar backend remoto

# 4. Commit frontend
git add .
git commit -m "feat: implementa integração otimizada com backend"
git push origin main  # Deploy automático
```

## ✅ Benefícios Desta Abordagem

### Desenvolvimento
- **Testes integrados**: Validação completa local
- **Debugging coordenado**: Debug full-stack
- **Sincronização de types**: Evita incompatibilidades
- **Desenvolvimento ágil**: Mudanças coordenadas

### Deploy
- **Repositórios separados**: Mantém estrutura atual
- **Deploy independente**: Frontend e backend podem deployar separadamente
- **Rollback independente**: Problemas em um não afetam o outro
- **CI/CD mantido**: Pipelines existentes continuam funcionando

### Manutenção
- **Histórico limpo**: Commits separados por responsabilidade
- **Equipes independentes**: Podem trabalhar separadamente após sync
- **Flexibilidade**: Pode repetir processo quando necessário

## 🔄 Workflow para Futuras Melhorias

1. **Clone temporário** do backend quando necessário
2. **Desenvolvimento coordenado** com testes integrados
3. **Aplicação das mudanças** nos repositórios separados
4. **Limpeza** do ambiente local
5. **Deploy automático** independente

## 📋 Checklist de Execução

### Setup Inicial
- [ ] Clonar backend para pasta temporária
- [ ] Configurar scripts de desenvolvimento
- [ ] Configurar proxy/CORS
- [ ] Testar ambiente integrado

### Desenvolvimento
- [ ] Implementar melhorias coordenadas
- [ ] Criar types compartilhados (temporário)
- [ ] Testar integração localmente
- [ ] Documentar mudanças necessárias

### Sincronização
- [ ] Aplicar mudanças no repositório backend
- [ ] Testar backend em produção
- [ ] Remover arquivos temporários
- [ ] Atualizar configurações frontend
- [ ] Commit e deploy frontend

### Validação
- [ ] Testar integração em produção
- [ ] Validar que deploys automáticos funcionam
- [ ] Documentar processo para futuras melhorias

---

**Resultado**: Desenvolvimento ágil e coordenado mantendo a estrutura de repositórios separados e deploys automáticos independentes.