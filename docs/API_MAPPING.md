# Mapeamento da API Backend - BarberShop

## Informações Gerais da API

- **Base URL**: https://barber-backend-spm8.onrender.com
- **Versão**: 1.0.0
- **Autenticação**: JWT Token (Bearer)
- **Formato**: JSON

## Endpoints Disponíveis

### 🔐 Autenticação (`/api/auth`)

| Método | Endpoint                   | Descrição                             | Auth Required |
| ------ | -------------------------- | ------------------------------------- | ------------- |
| POST   | `/api/auth/login`          | Autenticação de usuários              | ❌             |
| POST   | `/api/auth/validate-token` | Validação de token JWT                | ❌             |
| POST   | `/api/auth/register`       | Registro de novos usuários            | ✅ Admin       |
| POST   | `/api/auth/verify-admin`   | Verificação de senha de administrador | ❌             |
| GET    | `/api/auth/users`          | Listar todos os usuários (debug)      | ❌             |

### 👥 Usuários (`/api/users`)

| Método | Endpoint                     | Descrição                | Auth Required |
| ------ | ---------------------------- | ------------------------ | ------------- |
| GET    | `/api/users`                 | Listar todos os usuários | ❌             |
| GET    | `/api/users/:id`             | Obter usuário por ID     | ❌             |
| PATCH  | `/api/users/:id`             | Atualizar usuário        | ❌             |
| POST   | `/api/users/change-password` | Alterar senha do usuário | ❌             |

### ✂️ Barbeiros (`/api/barbers`)

| Método | Endpoint           | Descrição                 | Auth Required |
| ------ | ------------------ | ------------------------- | ------------- |
| GET    | `/api/barbers`     | Listar todos os barbeiros | ❌             |
| GET    | `/api/barbers/:id` | Obter barbeiro por ID     | ❌             |
| POST   | `/api/barbers`     | Criar novo barbeiro       | ✅             |
| PUT    | `/api/barbers/:id` | Atualizar barbeiro        | ✅             |
| DELETE | `/api/barbers/:id` | Excluir barbeiro          | ✅             |

### 📅 Agendamentos (`/api/appointments`)

| Método | Endpoint                | Descrição                       | Auth Required |
| ------ | ----------------------- | ------------------------------- | ------------- |
| GET    | `/api/appointments`     | Listar todos os agendamentos    | ❌             |
| POST   | `/api/appointments`     | Criar novo agendamento          | ❌             |
| PATCH  | `/api/appointments/:id` | Atualizar status do agendamento | ❌             |
| DELETE | `/api/appointments/:id` | Excluir agendamento             | ❌             |

### 🛠️ Serviços (`/api/services`)

| Método | Endpoint                         | Descrição                       | Auth Required |
| ------ | -------------------------------- | ------------------------------- | ------------- |
| GET    | `/api/services`                  | Listar todos os serviços        | ❌             |
| GET    | `/api/services/:id`              | Obter serviço por ID            | ❌             |
| GET    | `/api/services/barber/:barberId` | Obter serviços por barbeiro     | ❌             |
| POST   | `/api/services`                  | Criar novo serviço              | ✅             |
| PATCH  | `/api/services/:id`              | Atualizar serviço               | ✅             |
| DELETE | `/api/services/:id`              | Excluir serviço                 | ✅             |
| POST   | `/api/services/:id/barbers`      | Associar barbeiros a um serviço | ✅             |

### 💬 Comentários (`/api/comments`)

| Método | Endpoint              | Descrição                                 | Auth Required |
| ------ | --------------------- | ----------------------------------------- | ------------- |
| GET    | `/api/comments`       | Listar comentários (filtrados por status) | ❌             |
| GET    | `/api/comments/admin` | Listar todos os comentários               | ✅ Admin       |
| POST   | `/api/comments`       | Criar novo comentário                     | ❌             |
| PATCH  | `/api/comments/:id`   | Atualizar status do comentário            | ❌             |
| DELETE | `/api/comments/:id`   | Excluir comentário                        | ❌             |

### 🔒 Segurança (`/api/security`) - Admin Only

| Método | Endpoint                       | Descrição                    | Auth Required |
| ------ | ------------------------------ | ---------------------------- | ------------- |
| GET    | `/api/security/report`         | Relatório de segurança       | ✅ Admin       |
| GET    | `/api/security/logs`           | Logs de segurança detalhados | ✅ Admin       |
| DELETE | `/api/security/logs/cleanup`   | Limpar logs antigos          | ✅ Admin       |
| GET    | `/api/security/stats/realtime` | Estatísticas em tempo real   | ✅ Admin       |

### 📱 QR Codes (`/api/qr-codes`)

| Método | Endpoint                  | Descrição                            | Auth Required |
| ------ | ------------------------- | ------------------------------------ | ------------- |
| POST   | `/api/qr-codes/upload`    | Upload de QR code SVG para barbeiro  | ❌             |
| GET    | `/api/qr-codes/list`      | Listar todos os QR codes disponíveis | ❌             |
| DELETE | `/api/qr-codes/:filename` | Deletar QR code específico           | ❌             |

## Mapeamento para Repositórios

### UserRepository ✅ (Já implementado)
- **Base**: `/api/users`
- **Métodos disponíveis**: CRUD básico + change password
- **Filtros**: Implementar no frontend

### AppointmentRepository 🆕 (A implementar)
- **Base**: `/api/appointments`
- **Métodos disponíveis**: CRUD completo
- **Filtros necessários no frontend**:
  - `findByUserId(userId)`
  - `findByBarberId(barberId)`
  - `findByDateRange(start, end)`
  - `findByStatus(status)`
  - `findUpcoming()`

### ServiceRepository 🔄 (Expandir existente)
- **Base**: `/api/services`
- **Novos métodos da API**:
  - `findByBarber(barberId)` → `GET /api/services/barber/:barberId`
  - `associateBarbers(serviceId, barberIds)` → `POST /api/services/:id/barbers`
- **Filtros no frontend**:
  - `findByCategory(category)`
  - `findActive()`
  - `findByPriceRange(min, max)`

### BarberRepository 🆕 (A implementar)
- **Base**: `/api/barbers`
- **Métodos disponíveis**: CRUD completo (CUD requer auth)
- **Filtros no frontend**:
  - `findActive()`
  - `findByService(serviceId)`

### CommentRepository 🆕 (Opcional)
- **Base**: `/api/comments`
- **Métodos específicos**:
  - `findByStatus(status)` → `GET /api/comments?status=X`
  - `findAllForAdmin()` → `GET /api/comments/admin`
  - `updateStatus(id, status)` → `PATCH /api/comments/:id`

## Considerações de Implementação

### Autenticação
- Endpoints que requerem auth precisam do header: `Authorization: Bearer <token>`
- Admin endpoints requerem verificação adicional
- Implementar interceptors no HttpClient para adicionar tokens automaticamente

### Cache Strategy
- **Serviços**: Cache longo (5min) - dados estáticos
- **Barbeiros**: Cache médio (3min) - dados semi-estáticos  
- **Agendamentos**: Cache curto (1min) - dados dinâmicos
- **Comentários**: Cache médio (2min) - dados moderados

### Error Handling
- Implementar retry logic para falhas de rede
- Fallback para endpoints alternativos quando disponível
- Tratamento específico para erros de autenticação (401/403)

### Filtros Frontend vs Backend
- **Backend**: Usar quando endpoint específico existe
- **Frontend**: Implementar quando não há endpoint específico
- **Performance**: Preferir filtros backend quando possível

## Próximos Passos

1. **Testar endpoints** para entender estrutura de dados exata
2. **Implementar repositórios** seguindo padrão existente
3. **Criar hooks** baseados nos repositórios
4. **Migrar componentes** para usar nova arquitetura
5. **Otimizar performance** com cache adequado