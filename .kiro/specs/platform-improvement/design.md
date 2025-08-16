# Design Document

## Overview

Este documento detalha o design para a **correção completa da plataforma BarberShop**, transformando-a de um sistema com dados mock e erros para uma aplicação totalmente funcional com integração real Node.js + Express + PostgreSQL. O foco é eliminar todos os problemas existentes: dados mock, erros TypeScript, testes falhando, problemas de UUID e integração inadequada com o backend.

**Problema Atual**: O projeto tem backend Node.js/Express/Sequelize/PostgreSQL funcional na pasta `/backend`, mas o frontend React/TypeScript está usando dados mock ao invés de consumir a API real. Existem erros de TypeScript em controllers, services e rotas, além de problemas com geração de UUIDs e testes falhando.

**Solução**: Integração completa frontend-backend, correção de todos os erros TypeScript, implementação de UUIDs corretos, remoção de dados mock e garantia de que todos os testes passem. O backend local será corrigido e depois sincronizado com o repositório separado.

## Architecture

### Current State (Problemas Identificados)
- ❌ Frontend usando dados mock ao invés de API real
- ❌ Função `getBarbershopBySlug` com dados fake
- ❌ Erros TypeScript em controllers, services e rotas do backend
- ❌ Problemas na função `registerBarbershop` (UUIDs inválidos)
- ❌ Testes falhando (`npm run test` com erros)
- ❌ IDs concatenados (`admin-<uuid>-<timestamp>`) causando erros PostgreSQL
- ❌ Tratamento inadequado de erros HTTP (500, 404)

### Target State (Correção Completa)
- ✅ Frontend consumindo dados reais via `/api/services` e outros endpoints
- ✅ Função `getBarbershopBySlug` buscando dados reais do PostgreSQL
- ✅ Zero erros TypeScript em todo o projeto
- ✅ Função `registerBarbershop` gerando UUIDs válidos com biblioteca `uuid`
- ✅ 100% dos testes passando (`npm run test` sem erros)
- ✅ UUIDs válidos para Users.id e Barbershops.id
- ✅ Tratamento correto de erros HTTP com mensagens amigáveis
- ✅ Logs claros para depuração e monitoramento

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

### Backend Correction Strategy
```typescript
// Correção da função registerBarbershop
interface RegisterBarbershopCorrection {
  generateValidUUID: boolean; // Usar biblioteca uuid
  associateUserCorrectly: boolean; // FK barbershopId válida
  avoidStringConcatenation: boolean; // Não usar admin-<uuid>-<timestamp>
  handleDatabaseErrors: boolean; // Tratamento adequado de erros Sequelize
}

// Correção de tipos TypeScript
interface TypeScriptCorrection {
  fixControllerTypes: boolean; // Request/Response tipados
  fixServiceTypes: boolean; // Métodos com tipos corretos
  fixRouteTypes: boolean; // Parâmetros e retornos tipados
  shareTypesWithFrontend: boolean; // Interfaces compartilhadas
}
```

### Frontend Integration Strategy
```typescript
// Remoção de dados mock
interface MockRemovalStrategy {
  replaceGetBarbershopBySlug: boolean; // Buscar dados reais do banco
  useRealServiceEndpoints: boolean; // /api/services ao invés de mock
  implementErrorHandling: boolean; // Tratar 500, 404, etc.
  validateDataIntegrity: boolean; // Garantir dados consistentes
}
```

### Real API Integration
```typescript
// Integração com endpoints reais do backend Node.js
interface IRealAPIIntegration {
  // Serviços - dados reais do PostgreSQL
  getServices(): Promise<Service[]>; // GET /api/services
  getServiceById(id: string): Promise<Service>; // GET /api/services/:id
  
  // Barbearias - dados reais do banco
  getBarbershopBySlug(slug: string): Promise<Barbershop>; // GET /api/barbershops/:slug
  registerBarbershop(data: BarbershopData): Promise<Barbershop>; // POST /api/barbershops/register
  
  // Usuários - integração com Sequelize
  getUsers(): Promise<User[]>; // GET /api/users
  createUser(userData: CreateUserData): Promise<User>; // POST /api/users
  
  // Agendamentos - CRUD completo
  getAppointments(): Promise<Appointment[]>; // GET /api/appointments
  createAppointment(data: AppointmentData): Promise<Appointment>; // POST /api/appointments
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

### Corrected UUID Models
```typescript
// Modelos corrigidos com UUIDs válidos
interface User {
  id: string; // UUID válido gerado com biblioteca uuid
  username: string;
  password: string;
  role: 'admin' | 'barber' | 'client';
  name: string;
  barbershopId: string; // FK para Barbershops.id (UUID)
  createdAt: Date;
  updatedAt: Date;
}

interface Barbershop {
  id: string; // UUID válido (já correto)
  name: string;
  slug: string;
  ownerEmail: string;
  planType: 'free' | 'pro';
  settings: object;
  createdAt: Date;
  updatedAt: Date;
}

interface Service {
  id: string; // UUID válido
  name: string;
  description: string;
  duration: number;
  price: number;
  barbershopId: string; // FK para isolamento multi-tenant
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Appointment {
  id: string; // UUID válido (não mais Date.now().toString())
  clientName: string;
  serviceName: string;
  date: Date;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  barberId: string;
  barberName: string;
  price: number;
  wppclient?: string;
  barbershopId: string; // FK para isolamento multi-tenant
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

### Backend Error Correction
```typescript
// Tratamento correto de erros no backend
interface BackendErrorHandling {
  sequelizeErrors: {
    handleUniqueConstraint: boolean;
    handleForeignKeyViolation: boolean;
    handleValidationErrors: boolean;
    logDatabaseErrors: boolean;
  };
  
  httpErrors: {
    return400ForBadRequest: boolean;
    return404ForNotFound: boolean;
    return500ForServerError: boolean;
    returnFriendlyMessages: boolean;
  };
  
  uuidErrors: {
    validateUUIDFormat: boolean;
    generateValidUUIDs: boolean;
    avoidStringConcatenation: boolean;
  };
}
```

### Frontend Error Handling
```typescript
// Tratamento de erros HTTP no frontend
interface FrontendErrorHandling {
  axiosInterceptors: {
    handle500Errors: boolean;
    handle404Errors: boolean;
    handle401Unauthorized: boolean;
    showUserFriendlyMessages: boolean;
  };
  
  apiIntegration: {
    retryFailedRequests: boolean;
    fallbackToCache: boolean;
    validateResponseData: boolean;
    logErrorsInDevelopment: boolean;
  };
}
```

## Testing Strategy

### Test Correction Approach
```typescript
// Estratégia para corrigir testes falhando
interface TestCorrectionStrategy {
  unitTests: {
    fixMockingIssues: boolean; // Mocks consistentes
    fixAsyncTestHandling: boolean; // Promises e async/await
    fixTypeScriptErrors: boolean; // Tipos corretos nos testes
    removeFlakiness: boolean; // Testes determinísticos
  };
  
  integrationTests: {
    useRealDatabaseConnections: boolean; // Testes com PostgreSQL real
    testActualAPIEndpoints: boolean; // Testar /api/* endpoints
    validateDataPersistence: boolean; // Dados salvos corretamente
    testErrorScenarios: boolean; // Cenários de erro
  };
  
  e2eTests: {
    testCompleteUserFlows: boolean; // Fluxos completos
    validateUIIntegration: boolean; // Frontend + Backend
    testMultiTenantIsolation: boolean; // Isolamento de dados
  };
}
```

### Test Data Strategy
```typescript
// Estratégia para dados de teste
interface TestDataStrategy {
  realData: {
    usePostgreSQLTestDatabase: boolean;
    createValidUUIDs: boolean;
    maintainReferentialIntegrity: boolean;
    cleanupAfterTests: boolean;
  };
  
  mockData: {
    onlyWhenNecessary: boolean; // Preferir dados reais
    consistentWithRealAPI: boolean;
    matchActualDataStructure: boolean;
    updateWhenAPIChanges: boolean;
  };
}
```

### Corrected Test Structure
```
tests/
├── unit/                    # Testes unitários corrigidos
│   ├── backend/            # Testes do Node.js/Express
│   │   ├── controllers/    # Controllers com tipos corretos
│   │   ├── services/       # Services sem erros TypeScript
│   │   └── models/         # Modelos Sequelize
│   └── frontend/           # Testes do React/TypeScript
│       ├── components/     # Componentes sem dados mock
│       ├── hooks/          # Hooks usando API real
│       └── services/       # Serviços de integração
├── integration/            # Testes de integração
│   ├── api/               # Testes dos endpoints reais
│   ├── database/          # Testes com PostgreSQL
│   └── fullstack/         # Frontend + Backend
└── fixtures/              # Dados de teste com UUIDs válidos
    ├── users.json         # Usuários com UUIDs corretos
    ├── barbershops.json   # Barbearias com dados reais
    └── services.json      # Serviços do banco
```

## Performance Considerations

### Database Performance
```typescript
// Otimizações de performance no PostgreSQL
interface DatabasePerformance {
  indexing: {
    createUUIDIndexes: boolean; // Índices em campos UUID
    createForeignKeyIndexes: boolean; // Índices em FKs
    createCompositeIndexes: boolean; // Índices compostos
  };
  
  queries: {
    useEfficientJoins: boolean; // JOINs otimizados
    implementPagination: boolean; // Paginação para listas grandes
    usePreparedStatements: boolean; // Statements preparados
    avoidNPlusOneQueries: boolean; // Evitar queries N+1
  };
  
  connections: {
    useConnectionPooling: boolean; // Pool de conexões
    setProperTimeouts: boolean; // Timeouts adequados
    handleConnectionErrors: boolean; // Tratamento de erros
  };
}
```

### API Performance
```typescript
// Otimizações de performance na API
interface APIPerformance {
  caching: {
    implementResponseCaching: boolean; // Cache de respostas
    useETags: boolean; // ETags para cache condicional
    cacheStaticData: boolean; // Cache de dados estáticos
  };
  
  compression: {
    enableGzipCompression: boolean; // Compressão gzip
    optimizeJSONResponses: boolean; // Respostas JSON otimizadas
  };
  
  validation: {
    validateInputEarly: boolean; // Validação precoce
    useSchemaValidation: boolean; // Validação de schema
    sanitizeInputs: boolean; // Sanitização de entradas
  };
}
```

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

### SOLID Architecture Implementation
```typescript
// Implementação dos princípios SOLID
interface SOLIDImplementation {
  singleResponsibility: {
    separateControllers: boolean; // Um controller por recurso
    dedicatedServices: boolean; // Serviços específicos
    focusedRepositories: boolean; // Repositórios com foco único
  };
  
  openClosed: {
    extensibleInterfaces: boolean; // Interfaces extensíveis
    pluggableServices: boolean; // Serviços plugáveis
    configurableComponents: boolean; // Componentes configuráveis
  };
  
  liskovSubstitution: {
    consistentInterfaces: boolean; // Interfaces consistentes
    replaceableImplementations: boolean; // Implementações substituíveis
  };
  
  interfaceSegregation: {
    smallFocusedInterfaces: boolean; // Interfaces pequenas
    noFatInterfaces: boolean; // Evitar interfaces gordas
  };
  
  dependencyInversion: {
    dependOnAbstractions: boolean; // Depender de abstrações
    injectDependencies: boolean; // Injeção de dependências
    useServiceFactory: boolean; // Factory para serviços
  };
}
```

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