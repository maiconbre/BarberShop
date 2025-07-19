# BarberGR

BarberGR é um sistema de agendamento para barbearias, permitindo que clientes escolham um barbeiro, selecione um serviço e agendem um horário de forma simples e rápida.

## Tecnologias Utilizadas

- React.js
- TypeScript
- Tailwind CSS
- Lucide Icons

## Instalação

<<<<<<< Updated upstream
Para rodar o projeto localmente, siga os seguintes passos:
=======
### Para Barbeiros
- Visualização de agenda
- Gerenciamento de horários disponíveis
- Confirmação de agendamentos
- Histórico de atendimentos
- Métricas de desempenho

### Para Administradores
- Gerenciamento de barbeiros
- Configuração de serviços
- Análise de métricas e relatórios
- Moderação de comentários
- Configuração de horários de funcionamento

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React.js** - Biblioteca para construção de interfaces
- **TypeScript** - Superset tipado de JavaScript
- **Tailwind CSS** - Framework CSS utilitário
- **Framer Motion** - Biblioteca para animações
- **Zustand** - Gerenciamento de estado global
- **React Router** - Roteamento da aplicação
- **Zod** - Validação de dados
- **Recharts** - Biblioteca para visualização de dados
- **React Window** - Virtualização para listas de alta performance

### Ferramentas de Build
- **Vite** - Ferramenta de build rápida
- **ESLint** - Linter para JavaScript/TypeScript
- **PostCSS** - Processador CSS

## 🏗️ Arquitetura

O BarberGR é construído seguindo rigorosamente os princípios SOLID, garantindo código limpo, manutenível e extensível:

### Princípios SOLID Implementados

#### 1. Single Responsibility Principle (SRP)
Cada classe e módulo tem uma única responsabilidade bem definida:
- **CacheService**: Responsável exclusivamente pelo gerenciamento de cache
- **ApiService**: Focado apenas em comunicação com APIs
- **AuthContext**: Gerencia apenas o estado de autenticação
- **ValidationSchemas**: Contém apenas regras de validação

#### 2. Open/Closed Principle (OCP)
O sistema é aberto para extensão, mas fechado para modificação:
- **Service Pattern**: Novos serviços podem ser adicionados sem modificar os existentes
- **Hook Pattern**: Hooks personalizados podem ser estendidos sem alterar a implementação base
- **Component Pattern**: Componentes UI são extensíveis através de props

#### 3. Liskov Substitution Principle (LSP)
Subtipos podem substituir seus tipos base sem quebrar a funcionalidade:
- **Storage Strategy**: Diferentes estratégias de armazenamento (localStorage, memory) são intercambiáveis
- **Validation Strategy**: Diferentes esquemas de validação seguem a mesma interface

#### 4. Interface Segregation Principle (ISP)
Interfaces específicas e coesas evitam dependências desnecessárias:
- **TypeScript Interfaces**: Interfaces granulares para diferentes domínios
- **Hook Interfaces**: Cada hook expõe apenas os métodos necessários
- **Component Props**: Props específicas para cada responsabilidade

#### 5. Dependency Inversion Principle (DIP)
Módulos de alto nível não dependem de módulos de baixo nível:
- **Service Injection**: Serviços são injetados através de contextos
- **Hook Composition**: Hooks dependem de abstrações, não de implementações concretas
- **Configuration Management**: Configurações são externalizadas em constantes

### Estrutura de Diretórios

```
src/
├── components/          # Componentes React organizados por responsabilidade
│   ├── feature/        # Componentes específicos de funcionalidades
│   └── ui/             # Componentes de interface reutilizáveis
├── constants/          # Configurações e constantes centralizadas
├── contexts/           # Contextos React para injeção de dependências
├── hooks/              # Hooks personalizados seguindo SRP
├── models/             # Modelos de domínio e entidades
├── pages/              # Componentes de página (containers)
├── services/           # Camada de serviços (business logic)
├── stores/             # Gerenciamento de estado global (Zustand)
├── types/              # Definições de tipos TypeScript
├── utils/              # Funções utilitárias puras
└── validation/         # Esquemas de validação (Zod)
```

### Padrões de Design Implementados

#### Repository Pattern
Abstração da camada de dados com interfaces bem definidas:
```typescript
// ApiService atua como repository
class ApiService {
  async get<T>(endpoint: string): Promise<T>
  async post<T>(endpoint: string, data: any): Promise<T>
  // Métodos específicos para cada entidade
}
```

#### Strategy Pattern
Diferentes estratégias para cache e armazenamento:
```typescript
// CacheService com estratégias intercambiáveis
interface CacheStrategy {
  get(key: string): any
  set(key: string, value: any): void
}
```

#### Observer Pattern
Gerenciamento de estado reativo com Zustand:
```typescript
// Stores observáveis para diferentes domínios
const useAppointmentStore = create((set) => ({
  appointments: [],
  setAppointments: (appointments) => set({ appointments })
}))
```

#### Factory Pattern
Criação de instâncias através de factories:
```typescript
// Hook factories para diferentes tipos de formulários
export const useForm = <T>(options: UseFormOptions<T>)
export const useCache = <T>(key: string, fetchFn: () => Promise<T>)
```

#### Decorator Pattern
Enriquecimento de funcionalidades através de HOCs e hooks:
```typescript
// useCache decora funções de fetch com cache
const { data, loading } = useCache('appointments', fetchAppointments)
```

### Arquitetura em Camadas

#### 1. Camada de Apresentação (Presentation Layer)
- **Components**: Componentes React puros e funcionais
- **Pages**: Containers que orquestram componentes
- **Hooks**: Lógica de apresentação reutilizável

#### 2. Camada de Aplicação (Application Layer)
- **Contexts**: Gerenciamento de estado da aplicação
- **Stores**: Estado global compartilhado
- **Custom Hooks**: Lógica de negócio específica

#### 3. Camada de Domínio (Domain Layer)
- **Types**: Definições de entidades e value objects
- **Models**: Regras de negócio e validações
- **Validation**: Esquemas de validação de domínio

#### 4. Camada de Infraestrutura (Infrastructure Layer)
- **Services**: Comunicação com APIs externas
- **Utils**: Funções utilitárias e helpers
- **Constants**: Configurações e constantes

### Sistema de Cache Inteligente
Implementação sofisticada seguindo princípios SOLID:

```typescript
// CacheService - Single Responsibility
class CacheService {
  private memoryCache = new Map()
  private config = CACHE_CONFIG
  
  // Interface segregada para diferentes operações
  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void>
  async fetchWithCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T>
}

// Hook useCache - Dependency Inversion
export const useCache = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: CacheOptions
) => {
  // Depende da abstração CacheService, não da implementação
  const [data, setData] = useState<T | null>(null)
  // ...
}
```

### Sistema de Validação Tipado
Validação robusta com Zod seguindo princípios SOLID:

```typescript
// Schemas específicos - Single Responsibility
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['client', 'barber', 'admin'])
})

// Hook de validação - Open/Closed
export const useFormValidation = <T>(schema: z.ZodSchema<T>) => {
  // Extensível para qualquer schema sem modificação
}
```

### Gerenciamento de Estado
Estado global organizado por domínios:

```typescript
// appointmentStore - Single Responsibility
interface AppointmentStore {
  appointments: Appointment[]
  loading: boolean
  error: string | null
  
  // Actions específicas do domínio
  fetchAppointments: () => Promise<void>
  createAppointment: (data: CreateAppointmentData) => Promise<void>
  updateAppointment: (id: string, data: UpdateAppointmentData) => Promise<void>
}
```

### Sistema de Autenticação
Autenticação segura com separação de responsabilidades:

```typescript
// AuthContext - Interface Segregation
interface AuthContextType {
  // Apenas métodos relacionados à autenticação
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => void
  getCurrentUser: () => User | null
}

// AuthService - Dependency Inversion
class AuthService {
  constructor(private apiService: ApiService) {}
  
  async authenticate(credentials: LoginCredentials): Promise<AuthTokens>
  async refreshToken(token: string): Promise<AuthTokens>
}
```

## 📊 Recursos Avançados

### Sistema de Notificações
Implementação de um sistema de notificações em tempo real para alertar sobre novos agendamentos e comentários pendentes.

### Virtualização de Listas
Utilização de técnicas de virtualização para renderizar listas longas de forma eficiente, melhorando o desempenho em dispositivos com recursos limitados.

### Análise de Dados
Painéis analíticos com gráficos e métricas para acompanhamento de desempenho, tendências de agendamento e satisfação de clientes.


## 🚀 Instalação e Uso

### Pré-requisitos
- Node.js (v16 ou superior)
- npm ou yarn

### Passos para Instalação
>>>>>>> Stashed changes

1. Clone o repositório:
   ```sh
   git clone https://github.com/maiconbre/BarberGR.git
   ```
2. Acesse o diretório do projeto:
   ```sh
   cd BarberGR
   ```
3. Instale as dependências:
   ```sh
   npm install
   ```
4. Inicie o servidor de desenvolvimento:
   ```sh
   npm run dev
   ```

No final da pagina no rodape tem um
botao de "area do barbeiro" leva pra login 
credenciais teste: admin/123123; gabrielle/123123, marcos/123123

O projeto ja entá disponível e responsivo para mobiles no Vercel somente clicando aqui: [BarberGR no Vercel](https://barber.targetweb.tech/).



## 📸 Capturas de Tela

### Tela Inicial                                      Horarios disponiveis                   Dashboard                               
<img src="./Img1.PNG" alt="Tela Inicial" width="200px" />                     <img src="./Img2.PNG" alt="Horarios disponiveis" width="200px" />                     <img src="./Img3.PNG" alt="Dashboard" width="200px" />

 

   


### Cards de agendamento                 Agenda do barbeiro                 Métricas
<img src="./Img4.PNG" alt="agendamento" width="200px" />                    <img src="./Img5.PNG" alt="Agenda" width="200px" />                    <img src="./Img6.PNG" alt="Metricas" width="200px" />


### (Projeto ainda em desenvolvimento para melhor experiencia desktops)


## Licença

Este projeto está licenciado sob a MIT License .

