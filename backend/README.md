# 💈 Barber Backend API

> Sistema de gerenciamento completo para barbearias com API RESTful robusta e segura.

## 📋 Visão Geral

Este é um sistema backend completo para gerenciamento de barbearias, desenvolvido em Node.js com Express e PostgreSQL. O sistema oferece funcionalidades completas para agendamentos, gerenciamento de barbeiros, serviços, usuários e comentários, com autenticação JWT e proteção contra abuso de requisições.

## 🏗️ Arquitetura

### Estrutura do Projeto

```
Barber-Backend/
├── 📁 config/                 # Configurações do sistema
│   ├── cors.js               # Configuração CORS por ambiente
│   ├── database.js           # Configuração do banco de dados
│   └── jwt.js                # Configuração JWT e tokens
├── 📁 controllers/            # Lógica de negócio
│   ├── authController.js     # Autenticação e autorização
│   └── serviceController.js  # Gerenciamento de serviços
├── 📁 middleware/             # Middlewares customizados
│   ├── authMiddleware.js     # Proteção de rotas e autorização
│   ├── rateLimitMiddleware.js # Rate limiting global
│   └── requestLimitMiddleware.js # Limitação de chamadas repetidas
├── 📁 models/                 # Modelos de dados (Sequelize)
│   ├── Appointment.js        # Agendamentos
│   ├── Barber.js            # Barbeiros
│   ├── BarberServices.js    # Relação barbeiros-serviços
│   ├── Comment.js           # Comentários/avaliações
│   ├── Service.js           # Serviços oferecidos
│   ├── User.js              # Usuários do sistema
│   ├── database.js          # Conexão com banco
│   └── index.js             # Associações entre modelos
├── 📁 routes/                 # Definição de rotas
│   ├── appointmentRoutes.js  # Rotas de agendamentos
│   ├── authRoutes.js        # Rotas de autenticação
│   ├── barberRoutes.js      # Rotas de barbeiros
│   ├── commentRoutes.js     # Rotas de comentários
│   ├── serviceRoutes.js     # Rotas de serviços
│   └── users.js             # Rotas de usuários
├── 📁 scripts/                # Scripts utilitários
│   ├── insertSampleAppointments.js
│   ├── seed-data.js         # Dados iniciais
│   ├── seedAppointments.js
│   ├── test-db-connection.js
│   └── testComments.js
└── server.js                  # Ponto de entrada da aplicação
```

### Padrão Arquitetural

O projeto segue o padrão **MVC (Model-View-Controller)** adaptado para APIs:

- **Models**: Definição das entidades e relacionamentos (Sequelize ORM)
- **Controllers**: Lógica de negócio e processamento de dados
- **Routes**: Definição de endpoints e middlewares
- **Middlewares**: Funcionalidades transversais (autenticação, rate limiting, logs)

## 🗄️ Modelo de Dados

### Entidades Principais

#### 👤 User (Usuário)
```javascript
{
  id: String (PK),
  username: String (unique),
  password: String (hashed),
  role: String (client/barber/admin),
  name: String
}
```

#### ✂️ Barber (Barbeiro)
```javascript
{
  id: String (PK),
  name: String,
  whatsapp: String,
  pix: String
}
```

#### 🛠️ Service (Serviço)
```javascript
{
  id: UUID (PK),
  name: String (unique),
  price: Float
}
```

#### 📅 Appointment (Agendamento)
```javascript
{
  id: String (PK),
  clientName: String,
  serviceName: String,
  date: Date,
  time: String,
  status: String (pending/confirmed/completed/cancelled),
  barberId: String (FK),
  barberName: String,
  price: Float,
  wppclient: String
}
```

#### 💬 Comment (Comentário)
```javascript
{
  id: String (PK),
  name: String,
  comment: Text,
  status: Enum (pending/approved/rejected)
}
```

#### 🔗 BarberServices (Relação N:N)
```javascript
{
  BarberId: String (FK),
  ServiceId: UUID (FK)
}
```

### Relacionamentos

- **Barber ↔ Service**: Muitos para muitos (através de BarberServices)
- **User → Barber**: Um para um (barbeiros são usuários com role específica)
- **Appointment → Barber**: Muitos para um

## 🛡️ Segurança e Proteção

### Autenticação JWT
- **Access Token**: Válido por 1 dia (configurável)
- **Refresh Token**: Válido por 7 dias (configurável)
- **Roles**: client, barber, admin

### Rate Limiting Inteligente

#### 1. Rate Limiting Global (rateLimitMiddleware.js)
- Controla requisições por IP
- Cooldown configurável
- Limpeza automática de cache

#### 2. Limitação de Chamadas Repetidas (requestLimitMiddleware.js)
- **Limite padrão**: 50 chamadas idênticas
- **Bloqueio**: 5 minutos após exceder limite
- **Identificação única**: Hash baseado em IP + método + URL + parâmetros + body
- **Configuração por rota**: Limites específicos para diferentes endpoints

### Configurações de Segurança por Rota

| Rota | Limite Repetidas | Tempo Bloqueio | Observação |
|------|------------------|----------------|-----------|
| Serviços | 3 | 5 min | Padrão |
| Autenticação | 2 | 10 min | Mais restritivo |
| Agendamentos | 3 | 5 min | Padrão |
| Barbeiros | 3 | 5 min | Padrão |
| Comentários (CRUD) | 2 | 10 min | Anti-spam |
| Comentários (Read) | 3 | 5 min | Menos restritivo |
| Usuários (Read) | 3 | 5 min | Padrão |
| Usuários (Sensitive) | 2 | 10 min | Alteração senha/dados |

## 🚀 Endpoints da API

### 🔐 Autenticação (`/api/auth`)
- `POST /login` - Login de usuário
- `POST /validate-token` - Validação de token
- `POST /refresh-token` - Renovação de token
- `POST /register` 🔒 - Registro de usuário (protegido)
- `POST /verify-admin` 🔒 - Verificação de admin (protegido)
- `GET /users` 🔒 - Listar usuários (debug, protegido)

### 👥 Usuários (`/api/users`)
- `GET /` - Listar todos os usuários
- `GET /:id` - Buscar usuário por ID
- `PATCH /:id` - Atualizar usuário
- `POST /change-password` - Alterar senha

### ✂️ Barbeiros (`/api/barbers`)
- `GET /` - Listar todos os barbeiros
- `GET /:id` - Buscar barbeiro por ID
- `PATCH /:id` - Atualizar barbeiro
- `POST /` - Criar novo barbeiro
- `DELETE /:id` - Deletar barbeiro

### 🛠️ Serviços (`/api/services`)
- `GET /` - Listar todos os serviços
- `GET /:id` - Buscar serviço por ID
- `GET /barber/:barberId` - Serviços de um barbeiro específico
- `POST /` 🔒 - Criar serviço (protegido)
- `PATCH /:id` 🔒 - Atualizar serviço (protegido)
- `DELETE /:id` 🔒 - Deletar serviço (protegido)
- `POST /:id/barbers` 🔒 - Associar barbeiros ao serviço (protegido)

### 📅 Agendamentos (`/api/appointments`)
- `GET /` - Listar agendamentos (com filtro por barbeiro)
- `POST /` - Criar novo agendamento
- `PATCH /:id` - Atualizar agendamento
- `DELETE /:id` - Deletar agendamento

### 💬 Comentários (`/api/comments`)
- `GET /` - Listar comentários (com filtro por status)
- `POST /` - Criar comentário
- `GET /admin` 🔒 - Listar todos os comentários (admin)
- `PATCH /:id` 🔒 - Atualizar status do comentário (admin)
- `DELETE /:id` 🔒 - Deletar comentário (admin)

**Legenda**: 🔒 = Rota protegida (requer autenticação)

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js 16+
- PostgreSQL
- npm ou yarn

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
DATABASE_URL=postgresql://username:password@host:port/database

# JWT
JWT_SECRET=sua_chave_secreta_jwt
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=sua_chave_secreta_refresh
REFRESH_TOKEN_EXPIRES_IN=7d

# Ambiente
NODE_ENV=development

# Logs SQL (produção)
ENABLE_SQL_LOGS=false
```

### Instalação

```bash
# 1. Clone o repositório
git clone <repository-url>
cd Barber-Backend

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# 4. Teste a conexão com o banco
npm run test:db

# 5. Execute as migrações e seeds
npm run seed

# 6. Inicie o servidor
npm run dev
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm start              # Produção
npm run dev            # Desenvolvimento com nodemon
npm run dev:local      # Desenvolvimento local
npm run build          # Build para produção

# Banco de Dados
npm run test:db        # Teste de conexão com banco
npm run seed           # Executar seeds

# Monitoramento
npm run health-check   # Verificação de saúde

# Testes
npm test               # Executar testes (quando implementados)
```

## 🔧 Tecnologias Utilizadas

### Core
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Sequelize** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados relacional

### Segurança
- **bcryptjs** - Hash de senhas
- **jsonwebtoken** - Autenticação JWT
- **cors** - Controle de CORS
- **express-rate-limit** - Rate limiting

### Desenvolvimento
- **nodemon** - Auto-reload em desenvolvimento
- **dotenv** - Gerenciamento de variáveis de ambiente
- **cross-env** - Compatibilidade de variáveis entre SO

## 📊 Logs e Monitoramento

### Sistema de Logs Detalhado

#### 1. Logs HTTP
- Todas as requisições são logadas com timestamp
- Inclui IP, User-Agent, método, URL
- Rastreamento de duração da requisição
- Status code de resposta

#### 2. Logs SQL (Desenvolvimento)
- Queries SQL com timestamp
- Identificação do caller (stack trace)
- Duração da execução
- Número de registros retornados
- ID único para rastreamento

#### 3. Logs de Serviços
- Logs específicos para operações de serviços
- Rastreamento de início e fim de operações
- Identificação única por requisição


## 🚀 Deploy e Produção

### 📋 Guia de Deploy

Para instruções detalhadas de deploy, consulte o guia:
- **[KOYEB_DEPLOY_GUIDE.md](./KOYEB_DEPLOY_GUIDE.md)** - Deploy no Koyeb

#### Plataforma Recomendada

**🎯 Koyeb (MAIS SIMPLES)**
- ✅ **Interface super simples** - Deploy via GitHub em poucos cliques
- ✅ **PostgreSQL com 1 clique** - Banco de dados gerenciado
- ✅ **Plano gratuito** - Até 2 apps gratuitas
- ✅ **Deploy automático** - Conecta direto com GitHub
- ✅ **Sem CLI necessária** - Tudo via interface web
- ✅ **Global por padrão** - Edge computing

#### Como fazer Deploy

1. **Acesse**: [app.koyeb.com](https://app.koyeb.com)
2. **Login**: Com sua conta GitHub
3. **Create App**: Conecte seu repositório
4. **Configure**: Variáveis de ambiente
5. **Add PostgreSQL**: Banco gratuito
6. **Deploy**: Automático!

#### Scripts Disponíveis

```bash
# Verificar saúde da aplicação
npm run health-check
```

#### Arquivos de Configuração

- `koyeb.yaml` - Configuração do Koyeb (opcional)
- `.env.example` - Template de variáveis
- `scripts/health-check.js` - Verificação de saúde

### Configurações de Produção

#### Banco de Dados
- Pool de conexões otimizado (max: 10)
- SSL obrigatório
- Retry automático em falhas
- Logs SQL opcionais (via `ENABLE_SQL_LOGS`)

#### CORS
- Origins específicos configurados
- Credentials habilitados
- Headers permitidos controlados

#### Rate Limiting
- Limites mais restritivos em produção
- Limpeza automática de cache
- Proteção contra DDoS

### Ambientes Suportados

- **Development**: Configurações flexíveis, logs detalhados
- **Production**: Configurações otimizadas, segurança máxima
- **Test**: Configurações para testes automatizados

## 🤝 Contribuição

### Padrões de Código
- Use ESLint para formatação
- Siga os padrões de nomenclatura existentes
- Documente funções complexas
- Mantenha logs informativos

### Estrutura de Commits
```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
refactor: refatora código
test: adiciona testes
```

## 📝 Licença

ISC License - Maicon Brendon

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através dos canais oficiais do projeto.

---

**Desenvolvido com ❤️ para a comunidade de barbearias**
