# 🎯 MVP Enxuto - BarberShop SaaS - Tasks

**Objetivo**: Produto vendável em **3-4 semanas** que gera receita real.
**Foco**: Funcionalidades essenciais, não arquitetura perfeita.

## Sprint 1 (Semana 1): Core Essencial

**Objetivo**: Sistema básico de agendamento funcionando end-to-end

### 1. Simplificar Arquitetura Atual (2 dias)
- [ ] 1.1 Remover complexidade desnecessária
  - Remover pasta backend/ local (usar backend remoto)
  - Simplificar hooks para fetch direto com axios
  - Remover ServiceFactory e abstrações SOLID complexas
  - Manter apenas 3 telas: Login, Dashboard, Booking
  - Reduzir testes para apenas fluxos críticos

- [ ] 1.2 Setup de produção simples
  - Configurar DB gerenciado (Supabase ou Neon)
  - Deploy automático: Render (backend) + Vercel (frontend)
  - Variáveis de ambiente de produção
  - SSL e domínio básico

### 2. Auth Simples (2 dias)
- [ ] 2.1 Implementar autenticação básica
  - Login/register com email/senha
  - JWT simples (sem refresh token ainda)
  - Roles básicos: owner, barber, client
  - Proteção de rotas essenciais

### 3. CRUD Essencial (3 dias)
- [ ] 3.1 Barbeiros básico
  - Criar/editar barbeiro (nome, contato)
  - Listar barbeiros ativos
  - Associar ao estabelecimento

- [ ] 3.2 Serviços básico
  - Criar/editar serviço (nome, duração, preço)
  - Listar serviços ativos
  - Associar serviços a barbeiros

- [ ] 3.3 Agendamentos core
  - Cliente cria agendamento (barbeiro + serviço + data/hora)
  - Validação básica de conflitos
  - Lista de agendamentos por barbeiro/dia

## Sprint 2 (Semana 2): Gestão Básica

**Objetivo**: Barbeiro consegue gerenciar agenda

### 4. Dashboard Barbeiro (3 dias)
- [ ] 4.1 Tela principal do barbeiro
  - Lista agendamentos do dia
  - Confirmar/cancelar agendamentos
  - Status visual (pendente/confirmado/concluído)

- [ ] 4.2 Gestão de horários
  - Definir horários de trabalho
  - Marcar indisponibilidades
  - Validação de conflitos melhorada

### 5. Notificações Básicas (2 dias)
- [ ] 5.1 Email simples
  - Confirmação de agendamento (cliente)
  - Notificação de novo agendamento (barbeiro)
  - Usar SendGrid ou Resend

### 6. Perfil do Estabelecimento (2 dias)
- [ ] 6.1 Dados básicos
  - Nome, endereço, contato
  - Horário de funcionamento
  - Configurações básicas

## Sprint 3 (Semana 3): Monetização

**Objetivo**: Começar a cobrar

### 7. Multi-tenant Básico (2 dias)
- [ ] 7.1 Implementar tenant_id
  - Adicionar tenant_id em todas as tabelas
  - Filtrar dados por tenant automaticamente
  - Registro de estabelecimento

### 8. Planos e Billing (3 dias)
- [ ] 8.1 Estrutura de planos
  - Plano Grátis: 1 barbeiro, 50 agendamentos/mês
  - Plano Pro: Ilimitado, R$ 29/mês
  - Middleware de verificação de limites

- [ ] 8.2 Integração de pagamento
  - Mercado Pago ou Stripe
  - Webhook para status de pagamento
  - Upgrade/downgrade de planos

### 9. Landing Page (2 dias)
- [ ] 9.1 Página de conversão
  - Hero section com proposta de valor
  - Demonstração do produto
  - Formulário de cadastro
  - Preços e planos

## Sprint 4 (Semana 4): Polish + Launch

**Objetivo**: Produto vendável

### 10. WhatsApp Básico (2 dias)
- [ ] 10.1 Notificações WhatsApp
  - Integração com Twilio ou similar
  - Confirmação de agendamento
  - Lembretes automáticos

### 11. Relatórios Simples (2 dias)
- [ ] 11.1 Dashboard básico
  - Agendamentos por período
  - Receita estimada
  - Barbeiros mais procurados

### 12. Testes Críticos (1 dia)
- [ ] 12.1 E2E essencial
  - Fluxo de agendamento completo
  - Fluxo de pagamento
  - Fluxo de gestão de agenda

### 13. Beta Launch (2 dias)
- [ ] 13.1 Lançamento beta
  - Convidar 5-10 estabelecimentos
  - Coleta de feedback
  - Ajustes baseados no uso real

## Pós-MVP (Após validação)

### Funcionalidades Avançadas (só após ter clientes pagantes)
- [ ] Integração com calendários externos
- [ ] App mobile
- [ ] Analytics avançados
- [ ] Multi-estabelecimento
- [ ] API pública
- [ ] Integrações com POS

### Otimizações (só após ter tráfego real)
- [ ] Rate limiting refinado
- [ ] Cache inteligente
- [ ] Otimizações de performance
- [ ] Testes de integração completos
- [ ] Monitoramento avançado

## Métricas de Sucesso

### Semana 1-2: Validação Técnica
- [ ] Agendamento funciona end-to-end
- [ ] Deploy automático funcionando
- [ ] 0 bugs críticos

### Semana 3-4: Validação de Produto
- [ ] 5-10 estabelecimentos testando
- [ ] 50+ agendamentos criados
- [ ] Feedback positivo sobre usabilidade

### Mês 1-2: Validação de Negócio
- [ ] 3+ clientes pagantes
- [ ] Churn < 20%
- [ ] NPS > 7

## Stack Simplificada

### Frontend
```typescript
// React + Vite (manter atual)
// Axios para API calls (remover abstrações)
// Zustand para estado global mínimo
// Tailwind para UI rápida
```

### Backend
```javascript
// Express + Sequelize (simplificar atual)
// PostgreSQL gerenciado
// JWT simples
// Webhooks para pagamento
```

### Deploy
```bash
# Frontend: Vercel (automático)
# Backend: Render (automático)
# DB: Supabase/Neon (gerenciado)
# Monitoramento: Sentry básico
```

---

**Princípio**: Funcionalidade > Arquitetura perfeita
**Foco**: Receita e feedback re