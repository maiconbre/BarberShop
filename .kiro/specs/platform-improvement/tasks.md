# 🎯 BarberShop SaaS

**Objetivo**: Produto vendável em **3-4 semanas** que geSupabase + API externa) e foca em criar uma integração eficiente e código limpo. 

**Estratégia de Desenvolvimento**: Para agilizar o desenvolvimento coordenado, o backend será temporariamente clonado para uma pasta `/backend` local, permitindo desenvolvimento e testes integrados. As mudanças serão posteriormente aplicadas ao repositório backend separado, mantendo os deploys automáticos independentes.

## Fase 2.1: Correção de Testes de Hooks

- [x] 1. Analisar e corrigir testes de hooks falhando
  - Identificar os 8 testes de hooks que estão falhando
  - Analisar causas raiz dos problemas (isolamento, mocks, async)
  - Implementar correções mantendo cobertura de testes
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.1 Corrigir testes do useUsers hook


  - Revisar mocks do UserRepository nos testes
  - Corrigir problemas de estado assíncrono
  - Validar integração com ServiceFactory
  - _Requirements: 1.1, 1.2_

- [x] 1.2 Corrigir testes de hooks utilitários


  - Revisar useAsync e outros hooks de apoio
  - Garantir isolamento adequado entre testes
  - Implementar cleanup adequado após cada teste
  - _Requirements: 1.1, 1.2_

- [x] 1.3 Validar cobertura de testes após correções


  - Executar suite completa de testes
  - Verificar se cobertura foi mantida ou melhorada
  - Documentar mudanças realizadas
  - _Requirements: 1.3_

## Fase 2.2: Setup de Desenvolvimento Coordenado ✅

- [x] 2. Configurar ambiente de desenvolvimento integrado ✅
  - ✅ Backend já clonado para pasta `/backend`
  - ✅ Estrutura analisada: Express + Sequelize + PostgreSQL
  - ✅ Modelos identificados: User, Barber, Service, Appointment, Comment
  - ✅ Rotas mapeadas: 27 endpoints disponíveis
  - _Requirements: 6.1, 6.3_

- [x] 2.1 Configurar scripts de desenvolvimento coordenado ✅
  - ✅ Backend roda na porta 6543 (configurado)
  - ✅ Scripts identificados: npm run dev (nodemon)
  - ✅ Scripts configurados: npm run dev:fullstack
  - ✅ Proxy configurado: /api → localhost:6543
  - ✅ Concurrently adicionado como dependência
  - ✅ Documentação criada: SETUP_DESENVOLVIMENTO_COORDENADO.md
  - _Requirements: 6.1, 6.3_

- [x] 2.2 Mapear estrutura de dados real do backend





  - Documentar modelos Sequelize encontrados:
    - User: id(string), username, password, role, name
    - Barber: id(string), name, whatsapp, pix
    - Service: id(UUID), name, price
    - Appointment: id(string), clientName, serviceName, date, time, status, barberId, barberName, price, wppclient
    - Comment: id(string), name, comment, status
  - Identificar diferenças entre types frontend e modelos backend
  - _Requirements: 6.1, 6.3_

## Fase 2.3: Implementação de Repositórios

- [x] 3. Implementar AppointmentRepository baseado na estrutura real
  - Criar interface IAppointmentRepository baseada no modelo Sequelize:
    - Campos: id(string), clientName, serviceName, date, time, status, barberId, barberName, price, wppclient
    - GET /api/appointments (com query ?barberId para filtro)
    - POST /api/appointments (cria com id = Date.now().toString())
    - PATCH /api/appointments/:id (atualiza status)
    - DELETE /api/appointments/:id
  - Implementar métodos de filtro no frontend (por barberId, data, status)
  - Utilizar rate limiting otimizado do backend (200 req/min para leitura)
  - _Requirements: 3.1, 3.3, 6.1_

- [x] 3.1 Criar testes unitários para AppointmentRepository


  - Implementar testes para todas as operações CRUD
  - Testar filtros por barberId (query parameter)
  - Garantir mocks adequados para estrutura real da API
  - Validar integração com rate limiting do backend
  - _Requirements: 3.3_

- [x] 4. Expandir ServiceRepository com endpoints específicos





  - Implementar método findByBarber usando GET /api/services/barber/:barberId
  - Adicionar método associateBarbers usando POST /api/services/:id/barbers (requer auth)
  - Implementar filtros frontend baseados no modelo real:
    - Service: id(UUID), name, price
    - Filtros: por nome, faixa de preço, barbeiro associado
  - Aproveitar rate limiting generoso (300 req/min para leitura)
  - _Requirements: 3.2, 3.3, 6.1_

- [x] 4.1 Criar testes unitários para ServiceRepository expandido


  - Implementar testes para método findByBarber
  - Testar associateBarbers com autenticação
  - Validar filtros frontend baseados na estrutura real
  - Testar integração com rate limiting otimizado do backend
  - _Requirements: 3.3_

- [ ] 5. Implementar BarberRepository baseado na estrutura real
  - Criar interface IBarberRepository baseada no modelo Sequelize:
    - Campos: id(string), name, whatsapp, pix + username do User relacionado
    - GET /api/barbers (retorna barber + username)
    - GET /api/barbers/:id (com ID formatado "01", "02", etc.)
    - POST /api/barbers (cria User + Barber com ID sequencial)
    - PATCH /api/barbers/:id (atualiza User + Barber)
    - DELETE /api/barbers/:id (remove User + Barber + Appointments)
  - Implementar métodos de filtro frontend
  - Aproveitar rate limiting otimizado (150 req/min para leitura)
  - _Requirements: 3.1, 3.3, 6.1_

- [ ] 5.1 Implementar CommentRepository baseado na estrutura real
  - Criar interface baseada no modelo Comment:
    - Campos: id(string), name, comment, status(enum: pending/approved/rejected)
    - GET /api/comments?status=X (filtro por status)
    - GET /api/comments/admin (todos os comentários, requer admin)
    - POST /api/comments (criar comentário)
    - PATCH /api/comments/:id (atualizar status, requer admin)
    - DELETE /api/comments/:id (remover comentário, requer admin)
  - Integrar com sistema de autenticação para operações admin
  - _Requirements: 3.2, 3.3_

- [ ] 6. Integrar todos os repositórios no ServiceFactory
  - Adicionar AppointmentRepository ao ServiceFactory
  - Adicionar BarberRepository ao ServiceFactory
  - Adicionar CommentRepository ao ServiceFactory
  - Atualizar ServiceRepository no factory
  - Implementar injeção de dependências adequada
  - Manter padrão enxuto e limpo
  - _Requirements: 3.4, 5.1_

## Fase 2.3: Implementação de Repositórios

## Fase 2.4: Migração de Componentes

- [ ] 7. Criar hooks baseados na estrutura real do backend
  - Implementar useAppointments hook com estrutura real:
    - Campos: clientName, serviceName, date, time, status, barberId, barberName, price, wppclient
    - Filtros por barberId, data, status
    - Rate limiting otimizado (200 req/min leitura, 20 req/min escrita)
  - Implementar useBarbers hook:
    - Campos: id(string), name, whatsapp, pix, username
    - IDs formatados ("01", "02")
    - Operações CUD com User relacionado
  - Expandir useServices hook:
    - Campos: id(UUID), name, price
    - Método findByBarber, associateBarbers
    - Rate limiting generoso (300 req/min)
  - Implementar useComments hook:
    - Campos: name, comment, status(enum)
    - Filtros por status, operações admin
  - _Requirements: 2.1, 2.3_

- [ ] 7.1 Criar testes para novos hooks baseados na API real
  - Implementar testes unitários para useAppointments (estrutura real)
  - Implementar testes unitários para useBarbers (IDs formatados)
  - Atualizar testes do useServices (UUIDs, associações)
  - Implementar testes para useComments (enum status)
  - Validar rate limiting e burst limits
  - _Requirements: 2.1, 2.3_

- [ ] 8. Migrar componentes de agendamento
  - Identificar componentes que usam appointmentStore
  - Migrar para usar useAppointments hook com estrutura real
  - Atualizar BookingModal para campos: clientName, serviceName, wppclient
  - Refatorar Calendar/CalendarView para filtros por barberId
  - Implementar tratamento de status: pending/confirmed/completed/cancelled
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 8.1 Migrar componentes de barbeiros
  - Identificar componentes que usam barberStore
  - Migrar para usar useBarbers hook com IDs formatados
  - Atualizar componentes para campos: name, whatsapp, pix, username
  - Implementar criação coordenada User + Barber
  - Tratar exclusão em cascata (User + Barber + Appointments)
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 8.2 Migrar componentes de serviços
  - Atualizar componentes para usar useServices expandido
  - Implementar associação barbeiro-serviço (N:N)
  - Usar endpoint específico /api/services/barber/:barberId
  - Aplicar padrões SOLID na refatoração
  - Aproveitar rate limiting generoso para UX
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 9. Atualizar stores Zustand gradualmente
  - Migrar appointmentStore para usar AppointmentRepository
    - Adaptar para estrutura real (clientName, wppclient, etc.)
    - Usar filtros por barberId
  - Migrar barberStore para usar BarberRepository
    - Adaptar para IDs formatados e User relacionado
    - Implementar operações coordenadas
  - Atualizar commentStore para usar CommentRepository
    - Adaptar para enum status
    - Implementar filtros por status
  - Manter compatibilidade durante transição
  - _Requirements: 2.1, 2.2_

## Fase 2.5: Testes de Integração

- [ ] 8. Implementar testes de integração de repositórios
  - Criar testes que validam integração entre repositórios
  - Testar fluxos de dados completos
  - Validar comportamento com dados reais (mock)
  - _Requirements: 4.1, 4.3_

- [ ] 8.1 Implementar testes de integração de componentes
  - Criar testes que validam interação entre componentes
  - Testar fluxos de usuário completos
  - Validar integração com hooks e repositórios
  - _Requirements: 4.1, 4.2_

- [ ] 9. Implementar testes end-to-end de fluxos críticos
  - Criar testes para fluxo de agendamento completo
  - Testar fluxo de gerenciamento de usuários
  - Validar fluxo de gerenciamento de serviços
  - _Requirements: 4.1, 4.3_

- [ ] 9.1 Configurar ambiente de testes de integração
  - Configurar dados de teste (fixtures)
  - Implementar setup e teardown adequados
  - Garantir isolamento entre testes de integração
  - _Requirements: 4.4_

## Fase 2.5: Sincronização com Backend Separado

- [ ] 12. Identificar mudanças necessárias no backend
  - Documentar todas as mudanças propostas para o backend
  - Criar lista de endpoints que precisam ser adicionados/modificados
  - Identificar melhorias de performance no backend
  - Propor padronizações de resposta se necessário
  - _Requirements: 6.2, 6.4_

- [ ] 12.1 Aplicar mudanças no repositório backend
  - Aplicar mudanças identificadas no repositório backend separado
  - Testar mudanças no ambiente de desenvolvimento
  - Validar que não há breaking changes
  - Fazer deploy das mudanças backend primeiro
  - _Requirements: 6.1, 6.3_

- [ ] 12.2 Sincronizar e limpar ambiente local
  - Validar que frontend funciona com backend atualizado
  - Remover pasta `/backend` do projeto frontend
  - Atualizar configurações para apontar para backend remoto
  - Documentar mudanças aplicadas em ambos os repositórios
  - _Requirements: 6.3, 6.4_

## Fase 2.6: Arquitetura Multi-Tenant SaaS

- [ ] 10. Implementar arquitetura multi-tenant escalável
  - Criar modelo de dados para isolamento por barbearia (tenant)
  - Implementar middleware de tenant context
  - Garantir isolamento completo de dados entre barbearias
  - Criar sistema de roteamento dinâmico por tenant
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 10.1 Modelo de dados multi-tenant
  - Adicionar campo `barbershopId` (tenant_id) em todas as tabelas
  - Criar tabela `Barbershops` com dados da barbearia:
    - id, name, slug, owner_email, plan_type, created_at, settings
  - Implementar foreign keys e constraints para isolamento
  - Criar índices otimizados para queries por tenant
  - _Requirements: 8.1, 8.2_

- [ ] 10.2 Sistema de cadastro gratuito com verificação de email
  - Criar formulário de cadastro de barbearia
  - Implementar validação de dados (nome da barbearia, email, etc.)
  - Gerar slug único para cada barbearia (ex: /minha-barbearia)
  - Implementar sistema de verificação de email com código
  - Criar fluxo automático de setup inicial após confirmação
  - Integrar com n8n para automação de emails
  - _Requirements: 8.3, 8.4, 8.6_

- [ ] 10.2.1 Sistema de verificação de email
  - Gerar código de verificação de 6 dígitos
  - Enviar email de confirmação via webhook n8n
  - Criar página de inserção do código de verificação
  - Implementar validação e expiração do código (15 minutos)
  - Bloquear criação da barbearia até confirmação do email
  - _Requirements: 8.6, 8.7_

- [ ] 10.2.2 Integração com n8n para emails
  - Configurar webhook n8n para envio de emails
  - Criar template de email de verificação
  - Criar template de email de boas-vindas com link personalizado
  - Implementar fallback para envio direto caso n8n falhe
  - Configurar logs de entrega de emails
  - _Requirements: 8.6, 8.7_

- [ ] 10.2.3 Fluxo completo de onboarding
  - Email de verificação → Código → Confirmação
  - Criação automática da estrutura da barbearia
  - Setup inicial: primeiro barbeiro, serviços básicos
  - Email de boas-vindas com link de acesso personalizado
  - Tutorial inicial na primeira entrada
  - _Requirements: 8.4, 8.6, 8.7_

- [ ] 10.3 Página de login com verificação de plano
  - Atualizar página de login existente
  - Adicionar botão "Começar Grátis" que direciona para cadastro
  - Implementar verificação de status de pagamento
  - Criar redirecionamento para página específica da barbearia
  - _Requirements: 8.3, 8.4_

- [ ] 10.4 Roteamento dinâmico por barbearia
  - Implementar sistema de subdomínios ou paths únicos
  - Criar middleware para detectar tenant pela URL
  - Implementar context provider para tenant atual
  - Garantir que todas as queries incluam filtro por tenant
  - _Requirements: 8.1, 8.2_

## Fase 2.7: Sistema de Planos e Billing

- [ ] 11. Planos e Billing Multi-Tenant
  - Implementar estrutura de planos por barbearia
  - Integrar gateway de pagamento Mercado Pago
  - Criar middleware de verificação de limites por tenant
  - Implementar dashboard de billing por barbearia
  - _Requirements: 7.1, 7.2, 7.3, 8.2_

- [ ] 11.1 Estrutura de planos por barbearia
  - Plano Grátis: 1 barbeiro, 20 agendamentos/mês por barbearia
  - Plano Pro: Ilimitado, R$ 39/mês por barbearia
  - Middleware de verificação de limites por tenant
  - Sistema de upgrade/downgrade de planos
  - _Requirements: 7.1, 7.2, 8.2_

- [ ] 11.2 Integração Mercado Pago Multi-Tenant
  - Configurar SDK do Mercado Pago com suporte a múltiplos tenants
  - Implementar fluxo de pagamento por barbearia
  - Criar webhook para confirmação de pagamento por tenant
  - Implementar renovação automática de assinaturas por barbearia
  - _Requirements: 7.2, 7.3, 8.2_

- [ ] 11.3 Middleware de verificação por tenant
  - Criar middleware para verificar limites do plano por barbearia
  - Implementar bloqueio de funcionalidades quando limite excedido
  - Criar sistema de notificações de limite próximo por tenant
  - Implementar upgrade automático de plano quando necessário
  - _Requirements: 7.1, 7.3, 8.2_

- [ ] 11.4 Interface de billing por barbearia
  - Criar página de planos e preços personalizada por tenant
  - Implementar dashboard de uso atual por barbearia
  - Criar página de gerenciamento de assinatura por tenant
  - Implementar histórico de pagamentos por barbearia
  - _Requirements: 7.2, 7.4, 8.4_

## Fase 2.8: Sistema de Emails e Notificações

- [ ] 13. Implementar sistema de emails automatizados
  - Integrar com n8n para automação de emails
  - Criar templates de emails responsivos
  - Implementar sistema de filas de email
  - Configurar logs e monitoramento de entrega
  - _Requirements: 8.6, 8.7, 8.8_

- [ ] 13.1 Templates de emails
  - Email de verificação de cadastro com código
  - Email de boas-vindas com link personalizado
  - Email de confirmação de agendamento
  - Email de lembrete de agendamento (24h antes)
  - Email de upgrade de plano
  - Email de cobrança e renovação
  - _Requirements: 8.7, 8.8_

- [ ] 13.2 Webhooks n8n para automação
  - Configurar webhook para verificação de email
  - Configurar webhook para boas-vindas pós-cadastro
  - Configurar webhook para notificações de agendamento
  - Configurar webhook para billing e cobrança
  - Implementar retry logic para falhas de webhook
  - _Requirements: 8.6, 8.7_

- [ ] 13.3 Sistema de notificações em tempo real
  - Implementar notificações push no dashboard
  - Criar sistema de notificações por email
  - Implementar notificações WhatsApp (futuro)
  - Configurar preferências de notificação por usuário
  - _Requirements: 8.8, 8.9_

## Fase 2.9: Isolamento e Segurança Multi-Tenant

- [ ] 14. Implementar isolamento completo de dados
  - Garantir que todas as queries incluam filtro por barbershopId
  - Implementar testes de isolamento de dados
  - Criar auditoria de acesso cross-tenant
  - Implementar backup e restore por tenant
  - _Requirements: 8.1, 8.2, 8.5_

- [ ] 14.1 Segurança e autenticação por tenant
  - Implementar autenticação isolada por barbearia
  - Criar sistema de roles e permissões por tenant
  - Implementar JWT com claim de tenant
  - Garantir que usuários só acessem dados da própria barbearia
  - _Requirements: 8.2, 8.5_

- [ ] 14.2 Configurações personalizadas por barbearia
  - Criar sistema de configurações por tenant (tema, logo, etc.)
  - Implementar personalização de domínio/subdomain
  - Criar sistema de templates personalizáveis
  - Implementar configurações de horário de funcionamento por barbearia
  - _Requirements: 8.4, 8.5_

## Fase 2.10: Otimização e Limpeza (Código Enxuto)

- [ ] 15. Auditoria e limpeza de código
  - Identificar e remover imports não utilizados
  - Limpar dependências desnecessárias do package.json
  - Refatorar código duplicado seguindo DRY
  - Remover console.logs e código de debug desnecessário
  - _Requirements: 5.2, 5.3_

- [ ] 15.1 Otimizar integração com backend
  - Revisar e otimizar configurações de cache existentes
  - Validar se todos os fallback endpoints são necessários
  - Otimizar retry logic para reduzir latência
  - Implementar lazy loading onde apropriado
  - _Requirements: 5.1, 5.4, 6.3_

- [ ] 15.2 Simplificar arquitetura onde possível
  - Identificar abstrações desnecessárias
  - Consolidar interfaces similares
  - Simplificar fluxos de dados complexos
  - Aplicar princípio KISS (Keep It Simple, Stupid)
  - _Requirements: 5.1, 5.3, 5.4_

- [ ] 16. Documentar integração com backend
  - Documentar endpoints utilizados e suas respostas
  - Criar guia de integração para novos desenvolvedores
  - Documentar configurações de ambiente necessárias
  - Listar mudanças propostas para o backend (se houver)
  - _Requirements: 2.4, 5.4, 6.2, 6.4_

- [ ] 16.1 Validar implementação completa e enxuta
  - Executar suite completa de testes (unitários + integração)
  - Verificar cobertura de código mantida/melhorada
  - Validar performance da aplicação (não degradar)
  - Confirmar que código está limpo e enxuto
  - Validar integração eficiente com backend existente
  - _Requirements: 1.3, 2.4, 3.4, 4.4, 5.4, 6.3_