# Guia de Multi-Tenancy - BarberShop

## Visão Geral

Este projeto foi refatorado para suportar multi-tenancy, permitindo que múltiplas barbearias utilizem a mesma aplicação de forma isolada e segura.

## Arquitetura Implementada

### 1. Sistema de Contexto de Tenant

#### TenantContext (`src/contexts/TenantContext.tsx`)
- Gerencia o estado global do tenant atual
- Fornece validação de tenant
- Controla carregamento e estados de erro
- Expõe hooks para acesso ao contexto

#### Hook useTenant
```typescript
const { tenantId, isValidTenant, tenantLoading } = useTenant();
```

### 2. Estrutura de Rotas

Todas as rotas agora incluem o `tenantId` como parâmetro obrigatório:

```
/:tenantId/dashboard
/:tenantId/appointments
/:tenantId/clients
/:tenantId/services
/:tenantId/barbers
/:tenantId/reports
```

### 3. Componentes Principais Atualizados

#### Páginas com Validação de Tenant
- `DashboardPage.tsx`
- `DashboardPageNew.tsx`
- `AppointmentsPage.tsx`
- `ClientsPage.tsx`
- `ServicesPage.tsx`
- `BarbersPage.tsx`
- `ReportsPage.tsx`

Todas as páginas incluem:
- Validação de tenant antes da renderização
- Estados de carregamento apropriados
- Tratamento de erros de tenant inválido

#### Componentes de Navegação
- `Sidebar.tsx`: Links atualizados com tenantId
- `Header.tsx`: Contexto de tenant integrado

### 4. Serviços e Hooks Atualizados

#### Hooks com Contexto de Tenant
- `useAppointments.ts`: Filtragem por tenant
- `useClients.ts`: Isolamento de dados por tenant
- `useServices.ts`: Serviços específicos do tenant
- `useBarbers.ts`: Barbeiros do tenant
- `useReports.ts`: Relatórios isolados por tenant

#### Serviços API
- `appointmentService.ts`: Endpoints com tenant
- `clientService.ts`: Operações isoladas por tenant
- `serviceService.ts`: Gerenciamento de serviços por tenant
- `barberService.ts`: Barbeiros específicos do tenant

### 5. Componentes de UI Adaptados

#### Formulários
- `AppointmentForm.tsx`: Contexto de tenant
- `ClientForm.tsx`: Validação com tenant
- `ServiceForm.tsx`: Criação isolada por tenant
- `BarberForm.tsx`: Barbeiros do tenant

#### Listas e Tabelas
- `AppointmentList.tsx`: Filtros por tenant
- `ClientList.tsx`: Dados isolados
- `ServiceList.tsx`: Serviços do tenant
- `BarberList.tsx`: Lista filtrada por tenant

## Como Usar

### 1. Acessando a Aplicação

Para acessar a aplicação de um tenant específico:
```
http://localhost:3000/[TENANT_ID]/dashboard
```

Exemplo:
```
http://localhost:3000/barbearia-central/dashboard
http://localhost:3000/salao-moderno/appointments
```

### 2. Desenvolvimento

#### Adicionando Novas Páginas
1. Importe e use o hook `useTenant`
2. Adicione validação de tenant
3. Configure rota com parâmetro `tenantId`

```typescript
import { useTenant } from '../contexts/TenantContext';

function NovaPage() {
  const { tenantId, isValidTenant, tenantLoading } = useTenant();

  if (tenantLoading) {
    return <LoadingComponent />;
  }

  if (!isValidTenant) {
    return <TenantInvalidComponent />;
  }

  // Sua lógica aqui
}
```

#### Criando Novos Hooks
1. Importe o contexto de tenant
2. Use o tenantId em todas as operações
3. Implemente filtragem por tenant

```typescript
import { useTenant } from '../contexts/TenantContext';

export function useNovoHook() {
  const { tenantId } = useTenant();

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    // Usar tenantId nas requisições
  }, [tenantId]);
}
```

### 3. Navegação

Para navegar entre páginas, sempre inclua o tenantId:

```typescript
import { useTenant } from '../contexts/TenantContext';
import { useNavigate } from 'react-router-dom';

function Component() {
  const { tenantId } = useTenant();
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate(`/${tenantId}/appointments`);
  };
}
```

## Segurança e Isolamento

### 1. Isolamento de Dados
- Todos os dados são filtrados por `tenantId`
- Nenhum tenant pode acessar dados de outro
- Validação em todas as operações CRUD

### 2. Validação de Rotas
- Todas as rotas validam o tenant antes da renderização
- Redirecionamento automático para tenants inválidos
- Estados de carregamento apropriados

### 3. Contexto Seguro
- Validação contínua do tenant
- Limpeza de estado ao trocar de tenant
- Tratamento de erros robusto

## Estrutura de Arquivos

```
src/
├── contexts/
│   └── TenantContext.tsx          # Contexto principal de tenant
├── hooks/
│   ├── useAppointments.ts         # Hook com contexto de tenant
│   ├── useClients.ts              # Hook isolado por tenant
│   ├── useServices.ts             # Serviços por tenant
│   └── useBarbers.ts              # Barbeiros por tenant
├── services/
│   ├── appointmentService.ts      # API com tenant
│   ├── clientService.ts           # Operações isoladas
│   ├── serviceService.ts          # Serviços por tenant
│   └── barberService.ts           # Barbeiros por tenant
├── pages/
│   ├── DashboardPage.tsx          # Dashboard com validação
│   ├── AppointmentsPage.tsx       # Agendamentos isolados
│   ├── ClientsPage.tsx            # Clientes por tenant
│   ├── ServicesPage.tsx           # Serviços do tenant
│   └── BarbersPage.tsx            # Barbeiros do tenant
└── components/
    ├── layout/
    │   ├── Sidebar.tsx            # Navegação com tenant
    │   └── Header.tsx             # Header com contexto
    └── forms/
        ├── AppointmentForm.tsx    # Formulário com tenant
        ├── ClientForm.tsx         # Cliente por tenant
        ├── ServiceForm.tsx        # Serviço isolado
        └── BarberForm.tsx         # Barbeiro por tenant
```

## Próximos Passos

1. **Testes**: Implementar testes unitários e de integração
2. **Performance**: Otimizar carregamento de dados por tenant
3. **Monitoramento**: Adicionar logs e métricas por tenant
4. **Backup**: Implementar backup isolado por tenant
5. **Configurações**: Sistema de configurações por tenant

## Troubleshooting

### Problemas Comuns

1. **Tenant não encontrado**
   - Verificar se o tenantId está correto na URL
   - Validar se o tenant existe no sistema

2. **Dados não carregando**
   - Verificar se o contexto de tenant está ativo
   - Confirmar se os hooks estão usando o tenantId

3. **Navegação quebrada**
   - Verificar se todas as rotas incluem o tenantId
   - Confirmar se os links estão usando o contexto correto

### Debug

Para debugar problemas de tenant:

```typescript
const { tenantId, isValidTenant, tenantLoading } = useTenant();
console.log('Tenant Debug:', { tenantId, isValidTenant, tenantLoading });
```

## Conclusão

A implementação de multi-tenancy garante:
- Isolamento completo de dados entre tenants
- Segurança robusta
- Escalabilidade para múltiplas barbearias
- Manutenção simplificada
- Experiência de usuário consistente

Todos os componentes foram atualizados para trabalhar com o novo sistema, mantendo a funcionalidade original enquanto adiciona o suporte completo a multi-tenancy.