# Design Document

## Overview

Este documento detalha o design para o plano de melhoria da plataforma BarberShop, focando na correção de testes falhando, migração de componentes para a nova arquitetura SOLID, implementação de repositórios restantes e adição de testes de integração. O objetivo é criar uma plataforma enxuta, mantendo os benefícios já alcançados na Fase 1 da implementação SOLID.

**Backend Integration**: O projeto utiliza um backend híbrido com Supabase para autenticação/storage e API externa (https://barber-backend-spm8.onrender.com) para operações CRUD. A arquitetura frontend deve se adaptar a esta infraestrutura existente, otimizando a comunicação e propondo melhorias pontuais quando necessário.

**Development Strategy**: Para acelerar o desenvolvimento coordenado, o backend será temporariamente clonado para desenvolvimento local integrado, permitindo testes e melhorias coordenadas. As mudanças serão posteriormente sincronizadas com o repositório backend separado, mantendo os deploys automáticos independentes.

## Architecture

### Current State (Fase 1 Completed)
- ✅ Princípios SOLID implementados
- ✅ Serviços core criados (HttpClient, ErrorHandler, ApiMetrics, ApiServiceV2)
- ✅ UserRepository implementado
- ✅ ServiceFactory para injeção de dependências
- ✅ 142 testes unitários (hooks corrigidos)
- ✅ Interfaces bem definidas
- ✅ Backend híbrido: Supabase + API externa configurados

### Target State (Fase 2)
- 🎯 Todos os testes de hooks funcionando ✅
- 🎯 Componentes migrados para nova arquitetura
- 🎯 Repositórios completos (Appointment, Service) adaptados ao backend existente
- 🎯 Testes de integração implementados
- 🎯 Plataforma enxuta e otimizada
- 🎯 Integração backend otimizada com mínimas mudanças necessárias

### Backend Integration Strategy
A integração com o backend existente seguirá os seguintes princípios:

1. **Adaptação ao Existente**: Repositórios se adaptam às APIs já disponíveis
2. **Desenvolvimento Coordenado**: Backend clonado temporariamente para desenvolvimento integrado
3. **Mínimas Mudanças**: Propor mudanças no backend apenas quando essenciais
4. **Compatibilidade**: Manter compatibilidade com funcionalidades existentes
5. **Sincronização Controlada**: Mudanças aplicadas de forma coordenada nos repositórios separados
6. **Deploy Independente**: Manter estrutura de deploy automático separado

### Migration Strategy
A migração será incremental, mantendo a funcionalidade existente enquanto aplica as melhorias:

1. **Correção de Testes**: Prioridade máxima para estabilizar a base de testes
2. **Migração Gradual**: Componentes migrados um por vez
3. **Repositórios**: Implementação seguindo padrões estabelecidos
4. **Integração**: Testes que validam fluxos completos

## Components and Interfaces

### Hook Testing Strategy
```typescript
// Estrutura para correção de testes de hooks
interface HookTestStrategy {
  isolateHooks: boolean;
  mockDependencies: boolean;
  validateStateChanges: boolean;
  testAsyncBehavior: boolean;
}
```

### Component Migration Pattern
```typescript
// Padrão para migração de componentes
interface ComponentMigrationPattern {
  useRepositoryPattern: boolean;
  implementHooks: boolean;
  followSOLIDPrinciples: boolean;
  maintainExistingAPI: boolean;
}
```

### Repository Implementation
```typescript
// Interfaces adaptadas aos endpoints reais da API
interface IAppointmentRepository extends IRepository<Appointment> {
  // Métodos baseados em GET /api/appointments com filtros frontend
  findByUserId(userId: string): Promise<Appointment[]>;
  findByDateRange(start: Date, end: Date): Promise<Appointment[]>;
  findByStatus(status: AppointmentStatus): Promise<Appointment[]>;
  findByBarberId(barberId: string): Promise<Appointment[]>;
  findUpcoming(): Promise<Appointment[]>;
  
  // Método específico da API para atualizar status
  updateStatus(id: string, status: AppointmentStatus): Promise<Appointment>;
}

interface IServiceRepository extends IRepository<Service> {
  // Métodos com filtros implementados no frontend
  findByCategory(category: string): Promise<Service[]>;
  findActive(): Promise<Service[]>;
  findByPriceRange(min: number, max: number): Promise<Service[]>;
  
  // Método específico da API
  findByBarber(barberId: string): Promise<Service[]>; // GET /api/services/barber/:barberId
  
  // Método específico da API para associar barbeiros
  associateBarbers(serviceId: string, barberIds: string[]): Promise<void>;
}

interface IBarberRepository extends IRepository<Barber> {
  // CRUD completo disponível na API
  // Todos os métodos CUD requerem autenticação
  findActive(): Promise<Barber[]>;
  findByService(serviceId: string): Promise<Barber[]>;
}

interface ICommentRepository extends IRepository<Comment> {
  // Métodos baseados na API de comentários
  findByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<Comment[]>;
  findAllForAdmin(): Promise<Comment[]>; // GET /api/comments/admin
  updateStatus(id: string, status: string): Promise<Comment>;
}

// Adaptador para integração com backend híbrido
interface IBackendAdapter {
  // Supabase operations
  uploadFile(bucket: string, path: string, file: File): Promise<string>;
  getPublicUrl(bucket: string, path: string): string;
  
  // External API operations
  makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T>;
  handleApiError(error: unknown): Error;
}
```

## Data Models

### Appointment Model
```typescript
interface Appointment {
  id: string;
  userId: string;
  serviceId: string;
  date: Date;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}
```

### Service Model Enhancement
```typescript
interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // em minutos
  price: number;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

### Test Error Recovery
- Implementar retry logic para testes flaky
- Isolamento de testes para evitar interferência
- Mocks consistentes para dependências externas

### Migration Error Prevention
- Validação de compatibilidade antes da migração
- Rollback strategy para cada componente
- Testes de regressão automáticos

## Testing Strategy

### Hook Testing Fixes
1. **Isolamento**: Cada hook testado independentemente
2. **Mocking**: Dependências externas mockadas consistentemente
3. **State Management**: Validação de mudanças de estado
4. **Async Handling**: Testes para operações assíncronas

### Integration Testing Approach
1. **End-to-End Flows**: Testes que simulam jornadas completas do usuário
2. **API Integration**: Validação de integração com APIs
3. **Component Integration**: Testes de interação entre componentes
4. **Repository Integration**: Validação de operações de dados

### Test Structure
```
tests/
├── unit/                 # Testes unitários (existentes)
├── integration/          # Novos testes de integração
│   ├── components/       # Integração de componentes
│   ├── repositories/     # Integração de repositórios
│   └── flows/           # Fluxos end-to-end
└── fixtures/            # Dados de teste compartilhados
```

## Performance Considerations

### Lean Platform Principles
1. **Minimal Dependencies**: Remover dependências não utilizadas
2. **Code Splitting**: Carregamento sob demanda
3. **Efficient Rendering**: Otimização de re-renders
4. **Memory Management**: Limpeza adequada de recursos
5. **Backend Optimization**: Aproveitar cache e otimizações já implementadas

### Migration Performance
- Migração incremental para evitar impacto na performance
- Monitoramento de métricas durante a migração
- Rollback automático se performance degradar
- Manter configurações de cache e retry já otimizadas

### Backend Integration Performance
1. **Cache Strategy**: Utilizar cache existente (5min TTL para serviços, 2min para appointments)
2. **Request Optimization**: Aproveitar debounce e retry logic já implementados
3. **Fallback Endpoints**: Usar endpoints alternativos já configurados
4. **Adaptive Configuration**: Manter configuração adaptativa por ambiente

### Clean Code Principles
1. **Single Responsibility**: Cada repositório com responsabilidade única
2. **DRY (Don't Repeat Yourself)**: Reutilizar lógica de API existente
3. **KISS (Keep It Simple, Stupid)**: Soluções simples e diretas
4. **YAGNI (You Aren't Gonna Need It)**: Implementar apenas o necessário

### Lean Implementation Strategy
```typescript
// ❌ Evitar: Abstrações desnecessárias
interface IComplexServiceManager {
  createAdvancedServiceWithMetadata(service: Service, metadata: unknown): Promise<void>;
  performComplexServiceAnalysis(): Promise<AnalysisResult>;
}

// ✅ Preferir: Implementação direta e simples
interface IServiceRepository extends IRepository<Service> {
  findByBarber(barberId: string): Promise<Service[]>; // Endpoint específico
  associateBarbers(serviceId: string, barberIds: string[]): Promise<void>; // Endpoint específico
  // Filtros simples implementados no frontend quando necessário
}

// ✅ Reutilizar configurações existentes
const serviceRepository = new ServiceRepository(
  httpClient, // Já configurado com retry, cache, etc.
  cacheService, // Já otimizado
  errorHandler // Já implementado
);
```

### Code Organization Principles
1. **Minimal Files**: Evitar criar arquivos desnecessários
2. **Clear Naming**: Nomes que refletem exatamente a funcionalidade
3. **No Over-Engineering**: Não criar abstrações para casos futuros hipotéticos
4. **Reuse Existing**: Aproveitar máximo da infraestrutura já criada

## Backend Integration Details

### Current Backend Architecture
```
Frontend (React + Vite)
    ↓
ServiceFactory (Dependency Injection)
    ↓
Repositories (Data Layer)
    ↓
HttpClient (Communication Layer)
    ↓
Backend Services:
├── Supabase (Auth + Storage)
└── External API (https://barber-backend-spm8.onrender.com)
```

### API Endpoints Mapping (Baseado na Documentação Real)
```typescript
// Endpoints disponíveis confirmados pela documentação da API
const CONFIRMED_ENDPOINTS = {
  // Autenticação
  auth: {
    login: 'POST /api/auth/login',
    validateToken: 'POST /api/auth/validate-token',
    register: 'POST /api/auth/register', // Requer admin
    verifyAdmin: 'POST /api/auth/verify-admin',
    listUsers: 'GET /api/auth/users' // Debug only
  },
  
  // Usuários
  users: {
    list: 'GET /api/users',
    getById: 'GET /api/users/:id',
    update: 'PATCH /api/users/:id',
    changePassword: 'POST /api/users/change-password'
  },
  
  // Barbeiros
  barbers: {
    list: 'GET /api/barbers',
    getById: 'GET /api/barbers/:id',
    create: 'POST /api/barbers', // Requer auth
    update: 'PUT /api/barbers/:id', // Requer auth
    delete: 'DELETE /api/barbers/:id' // Requer auth
  },
  
  // Agendamentos - ✅ CONFIRMADO
  appointments: {
    list: 'GET /api/appointments',
    create: 'POST /api/appointments',
    updateStatus: 'PATCH /api/appointments/:id',
    delete: 'DELETE /api/appointments/:id'
  },
  
  // Serviços
  services: {
    list: 'GET /api/services',
    getById: 'GET /api/services/:id',
    getByBarber: 'GET /api/services/barber/:barberId',
    create: 'POST /api/services', // Requer auth
    update: 'PATCH /api/services/:id', // Requer auth
    delete: 'DELETE /api/services/:id', // Requer auth
    associateBarbers: 'POST /api/services/:id/barbers' // Requer auth
  },
  
  // Comentários
  comments: {
    list: 'GET /api/comments', // Filtrados por status
    listAll: 'GET /api/comments/admin', // Requer admin
    create: 'POST /api/comments',
    updateStatus: 'PATCH /api/comments/:id',
    delete: 'DELETE /api/comments/:id'
  },
  
  // Recursos adicionais disponíveis
  security: {
    report: 'GET /api/security/report', // Requer admin
    logs: 'GET /api/security/logs', // Requer admin
    cleanup: 'DELETE /api/security/logs/cleanup', // Requer admin
    realtimeStats: 'GET /api/security/stats/realtime' // Requer admin
  },
  
  qrCodes: {
    upload: 'POST /api/qr-codes/upload',
    list: 'GET /api/qr-codes/list',
    delete: 'DELETE /api/qr-codes/:filename'
  }
};

// Configuração adaptativa já implementada
const API_CONFIG = {
  BASE_URL: 'https://barber-backend-spm8.onrender.com',
  CACHE_TTL: 5 * 60 * 1000, // 5 minutos
  MAX_RETRIES: 3,
  FALLBACK_ENDPOINTS: { /* já configurados */ }
};
```

### Repository Adaptation Strategy (Baseado na API Real)
1. **UserRepository**: ✅ Já implementado - mapear para `/api/users`
2. **ServiceRepository**: Expandir baseado em `/api/services` com métodos:
   - `findByBarber(barberId)` usando `/api/services/barber/:barberId`
   - Manter métodos de filtro no frontend para `findByCategory`, `findActive`
3. **AppointmentRepository**: ✅ Implementar baseado em `/api/appointments`:
   - CRUD completo disponível na API
   - Filtros por usuário, data, status implementados no frontend
4. **BarberRepository**: Implementar baseado em `/api/barbers`:
   - CRUD completo disponível na API
   - Métodos de autenticação necessários para CUD operations
5. **CommentRepository**: Opcional - baseado em `/api/comments`
6. **QRCodeRepository**: Opcional - baseado em `/api/qr-codes` (novo recurso)

### Backend Change Recommendations
Se necessário, propor mudanças mínimas no backend:

1. **Padronização de Responses**: Garantir formato consistente
2. **Filtros Adicionais**: Endpoints com query parameters para filtros
3. **Paginação**: Implementar paginação consistente se não existir
4. **Status Codes**: Padronizar códigos de resposta HTTP

## Security Considerations

### Repository Security
- Validação de entrada em todos os repositórios
- Sanitização de dados antes de persistência
- Controle de acesso baseado em roles
- Utilizar autenticação Supabase existente

### Component Security
- Validação de props em componentes migrados
- Escape de dados renderizados
- Proteção contra XSS em formulários
- Manter tokens de autenticação seguros

### Backend Security
- Utilizar HTTPS para todas as comunicações
- Validar tokens de autenticação em cada requisição
- Implementar rate limiting se necessário
- Logs de segurança para auditoria