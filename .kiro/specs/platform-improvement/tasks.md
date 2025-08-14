# 🎯 BarberShop SaaS

**Objetivo**: Produto vendável em **3-4 semanas** que gere receita real através de plataforma multi-tenant SaaS.

**Estratégia de Desenvolvimento**: Para agilizar o desenvolvimento coordenado, o backend será temporariamente clonado para uma pasta `/backend` local, permitindo desenvolvimento e testes integrados. As mudanças serão posteriormente aplicadas ao repositório backend separado, mantendo os deploys automáticos independentes.

## 🚨 ALERTA CRÍTICO - MULTI-TENANT

**IMPORTANTE*

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

- [x] 5. Implementar BarberRepository baseado na estrutura real






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

- [x] 5.1 Implementar CommentRepository baseado na estrutura real



  - Criar interface baseada no modelo Comment:
    - Campos: id(string), name, comment, status(enum: pending/approved/rejected)
    - GET /api/comments?status=X (filtro por status)
    - GET /api/comments/admin (todos os comentários, requer admin)
    - POST /api/comments (criar comentário)
    - PATCH /api/comments/:id (atualizar status, requer admin)
    - DELETE /api/comments/:id (remover comentário, requer admin)
  - Integrar com sistema de autenticação para operações admin
  - _Requirements: 3.2, 3.3_
- [x] 6. Integrar todos os repositórios no ServiceFactory


  - Adicionar AppointmentRepository ao ServiceFactory
  - Adicionar BarberRepository ao ServiceFactory
  - Adicionar CommentRepository ao ServiceFactory
  - Atualizar ServiceRepository no factory
  - Implementar injeção de dependências adequada
  - Manter padrão enxuto e limpo
  - _Requirements: 3.4, 5.1_

## Fase 2.4: Migração de Componentes

- [x] 7. Criar hooks baseados na estrutura real do backend
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

- [x] 7.1 Criar testes para novos hooks baseados na API real


  - Implementar testes unitários para useAppointments (estrutura real)
  - Implementar testes unitários para useBarbers (IDs formatados)
  - Atualizar testes do useServices (UUIDs, associações)
  - Implementar testes para useComments (enum status)
  - Validar rate limiting e burst limits
  - _Requirements: 2.1, 2.3_

## Fase 2.4: Implementação Multi-Tenant (PRIORIDADE MÁXIMA) 🚨

**ATENÇÃO CRÍTICA**: Esta fase deve ser executada PRIMEIRO para evitar retrabalho massivo. O banco de dados pode ser recriado do zero sem problemas - não há necessidade de migração de dados.

### Entrega 1 – Base do Banco e Modelos Multi-Tenant

- [-] 8. Implementar Multi-Tenant no Backend Local (PRIORIDADE MÁXIMA)


  - **Meta**: Backend pronto para armazenar e relacionar dados por barbearia (tenant), sem alterar ainda o fluxo de rotas e autenticação
  - **BANCO PODE SER RECRIADO**: Dados atuais são obsoletos, sem necessidade de migração
  - Implementar mudanças multi-tenant no backend local (/backend)
  - Testar isolamento de dados localmente
  - Validar funcionalidades básicas com nova estrutura
  - _Requirements: 8.1, 8.2, 6.1_

- [x] 8.1 Modelos e Associações (Sequelize) - RECRIAR BANCO


  - **Criar modelo Barbershop**:
    - id(UUID), name, slug, owner_email, plan_type, settings, created_at
    - Validação de slug único
    - Índice único em slug
  - **Adicionar barbershopId (UUID) em todas as entidades**:
    - User, Barber, Service, Appointment, Comment
    - Foreign key: barbershopId → Barbershops.id
    - Criar índices compostos: (barbershopId, id) para performance
  - **IMPORTANTE**: Não criar lógicas de migração - banco será recriado
  - **📦 Saída**: Estrutura de banco multi-tenant definida
  - _Requirements: 8.1, 8.2_

- [x] 8.2 Seeders para Desenvolvimento


  - **Criar barbearia padrão**:
    - slug: "dev-barbershop"
    - Dados fake para desenvolvimento
  - **Popular com dados de teste**:
    - 1 usuário admin
    - 2 barbeiros
    - 2 serviços
    - 3 agendamentos
  - **Script npm run seed:reset**:
    - Recriar banco completo
    - Popular com dados de teste
  - **📦 Saída**: Ambiente de desenvolvimento funcional com dados multi-tenant
  - _Requirements: 8.1, 8.2_

- [x] 8.3 Validação Local da Estrutura


  - **Garantir limpeza**:
    - Dados antigos não existem (banco recriado)
    - Todas as tabelas têm barbershopId
  - **Testar CRUD básico**:
    - Todas as entidades (User, Barber, Service, Appointment, Comment)
    - Validar chaves estrangeiras funcionando
    - Confirmar que dados são criados com barbershopId
  - **📦 Saída**: Backend com estrutura multi-tenant no banco, CRUD funcional, sem middleware ainda
  - _Requirements: 8.1, 8.2_

### Entrega 2 – Middleware e Isolamento de Dados

- [x] 8.4 Middleware de Tenant


  - **Meta**: Garantir que nenhuma query no backend possa acessar dados de outra barbearia
  - **Detectar slug via rota**:
    - Capturar de /app/:barbershopSlug/*
    - Buscar barbershopId correspondente
    - Injetar no req.context
  - **Hooks Sequelize**:
    - beforeFind: incluir automaticamente barbershopId em todas queries
    - beforeCreate: incluir automaticamente barbershopId em todas criações
    - beforeUpdate: validar que barbershopId não muda
  - **📦 Saída**: Middleware funcional injetando tenant em todas as operações
  - _Requirements: 8.1, 8.2_

- [x] 8.5 Validação de Acesso e Segurança


  - **Bloquear queries sem tenant**:
    - Rejeitar requisições sem barbershopId válido
    - Retornar erro 403 para tentativas de acesso cross-tenant
  - **Logs de segurança**:
    - Registrar tentativas de acesso indevido
    - Log de queries executadas por tenant
  - **Garantir isolamento**:
    - Usuário só acessa dados da própria barbearia
    - Validar que middleware está funcionando em todos os endpoints
  - **📦 Saída**: Sistema de segurança ativo impedindo vazamento de dados
  - _Requirements: 8.1, 8.2_

- [x] 8.6 Testes de Isolamento Multi-Tenant



  - **Teste unitário de middleware**:
    - Validar detecção de slug
    - Validar injeção de barbershopId
    - Validar bloqueio de acesso indevido
  - **Teste de integração com 2 barbearias**:
    - Criar 2 barbearias diferentes
    - Validar isolamento completo de dados
    - Confirmar que queries não vazam entre tenants
  - **📦 Saída**: Backend isolado por tenant, com segurança ativa e testada
  - _Requirements: 8.1, 8.2_

### Entrega 3 – Cadastro, Roteamento e Frontend Multi-Tenant

- [x] 8.7 Endpoints de Cadastro e Gestão de Barbearias




  - **Meta**: Permitir criar novas barbearias, acessar via slug e consumir dados isolados no frontend
  - **Novos Endpoints**:
    - POST /api/barbershops/register (cria barbearia + admin inicial)
    - GET /api/barbershops/check-slug/:slug (verificar disponibilidade)
    - GET /api/barbershops/current (dados do tenant logado)
  - **Fluxo de Cadastro**:
    - Validação de slug único
    - Criação de estrutura inicial (primeiro admin, dados básicos)
    - Retornar dados da barbearia criada
  - **📦 Saída**: Endpoints funcionais para gestão de barbearias
  - _Requirements: 8.3, 8.4, 8.6_

- [x] 8.8 Frontend - Context e Routing Multi-Tenant








  - **Criar TenantContext**:
    - Armazenar barbershopId, slug, settings
    - Provider para toda a aplicação
    - Hook useTenant() para consumir context
  - **Adaptar hooks existentes**:
    - useAppointments, useBarbers, useServices, useComments
    - Incluir tenant automaticamente em todas as requisições
    - Cache por tenant
  - **Roteamento**:
    - Configurar rotas no formato /app/:barbershopSlug/*
    - Capturar slug da URL
    - Redirecionar usuário para /app/:slug/dashboard após login
  - **📦 Saída**: Frontend preparado para multi-tenant
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 8.9 Teste Final de Fluxo Multi-Tenant







  - **Criar 2 barbearias**:
    - Usar endpoint de cadastro
    - Validar slugs únicos
  - **Logar em cada barbearia**:
    - Testar autenticação por tenant
    - Validar redirecionamento correto
  - **Validar isolamento no dashboard**:
    - Cadastro, login, agendamento
    - Listagem de serviços por slug
    - Confirmar que dados não vazam entre tenants
  - **📦 Saída**: Multi-tenant completo e funcional, pronto para migração de componentes
  - _Requirements: 8.1, 8.2, 8.3_

## Fase 2.5: Migração de Componentes (Após Multi-Tenant)

- [x] 9. Migrar componentes de agendamento





  - Identificar componentes que usam appointmentStore
  - Migrar para usar useAppointments hook com estrutura real + barbershopId
  - Atualizar BookingModal para campos: clientName, serviceName, wppclient, barbershopId
  - Refatorar Calendar/CalendarView para filtros por barberId + tenant
  - Implementar tratamento de status: pending/confirmed/completed/cancelled
  - _Requirements: 2.1, 2.2, 2.4_



- [x] 9.1 Migrar componentes de barbeiros





  - Identificar componentes que usam barberStore
  - Migrar para usar useBarbers hook com IDs formatados + barbershopId
  - Atualizar componentes para campos: name, whatsapp, pix, username, barbershopId
  - Implementar criação coordenada User + Barber + tenant
  - Tratar exclusão em cascata (User + Barber + Appointments) por tenant


  - _Requirements: 2.1, 2.2, 2.4_

- [x] 9.2 Migrar componentes de serviços





  - Atualizar componentes para usar useServices expandido + barbershopId
  - Implementar associação barbeiro-serviço (N:N) por tenant
  - Usar endpoint específico /api/services/barber/:barberId com tenant


  - Aplicar padrões SOLID na refatoração
  - Aproveitar rate limiting generoso para UX
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 9.3 Atualizar stores Zustand para Multi-Tenant





  - Migrar appointmentStore para usar AppointmentRepository + tenant
    - Adaptar para estrutura real (clientName, wppclient, etc.) + barbershopId
    - Usar filtros por barberId + tenant
  - Migrar barberStore para usar BarberRepository + tenant
    - Adaptar para IDs formatados e User relacionado + barbershopId
    - Implementar operações coordenadas por tenant
  - Atualizar commentStore para usar CommentRepository + tenant
    - Adaptar para enum status + barbershopId
    - Implementar filtros por status + tenant
  - Manter compatibilidade durante transição
  - _Requirements: 2.1, 2.2_

## Fase 2.6: Testes de Integração Multi-Tenant

- [-] 10. Implementar testes de integração multi-tenant






  - Criar testes que validam isolamento de dados entre tenants
  - Testar fluxos de dados completos por barbearia
  - Validar alterações anteriores e erros sanar erros presentes
  - Validar sempre usando "npm run lint" ao final. 
  - Codigo limpo e manutenível
  - _Requirements: 4.1, 4.3_

- [-] 10.1 Implementar testes de integração de componentes multi-tenant


  - Criar testes que validam interação entre componentes por tenant
  - Testar fluxos de usuário completos por barbearia
  - Validar integração com hooks e repositórios multi-tenant
  - _Requirements: 4.1, 4.2_

- [ ] 10.2 Implementar testes end-to-end de fluxos críticos multi-tenant
  - Criar testes para fluxo de agendamento completo por tenant
  - Testar fluxo de gerenciamento de usuários por barbearia
  - Validar fluxo de gerenciamento de serviços por tenant
  - _Requirements: 4.1, 4.3_

- [x] 10.3 Configurar ambiente de testes multi-tenant


  - Configurar dados de teste por tenant (fixtures)
  - Implementar setup e teardown adequados para múltiplos tenants
  - Garantir isolamento entre testes de diferentes barbearias
  - _Requirements: 4.4_

## Fase 2.7: Arquitetura SaaS Completa

- [-] 11. Implementar sistema de cadastro e onboarding




- [x] 11.1 Sistema de cadastro gratuito com verificação de email fake(inicial)


  - **Backend - Endpoints de Cadastro**:
    - POST /api/barbershops/register - Cadastro de nova barbearia
    - POST /api/barbershops/verify-email - Verificação de email
    - GET /api/barbershops/check-slug/:slug - Verificar disponibilidade
    - GET /api/barbershops/current - Dados da barbearia atual
  - **Frontend - Fluxo de Cadastro**:
    - Formulário de cadastro de barbearia (nome, email, slug)
    - Validação de dados e disponibilidade de slug
    - Página de verificação de email com código
    - Redirecionamento para setup inicial da barbearia
  - **Integração**:
    - Gerar slug único para cada barbearia (ex: /minha-barbearia)
    - Sistema de verificação de email com código de 6 dígitos
    - Criar estrutura inicial: primeiro usuário admin, dados básicos
    - Integrar com n8n para automação de emails
  - _Requirements: 8.3, 8.4, 8.6_

- [ ] 11.2 Sistema de verificação de email e onboarding


  - Gerar código de verificação de 6 dígitos
  - Enviar email de confirmação via webhook n8n (logica pronta para inserção webhookurl)
  - Criar página de inserção do código de verificação
  - Implementar validação e expiração do código (15 minutos)
  - Bloquear criação da barbearia até confirmação do email
  - _Requirements: 8.6, 8.7_

- [ ] 11.3 Integração com n8n para emails
  - Configurar webhook n8n para envio de emails
  - Criar template de email de verificação
  - Criar template de email de boas-vindas com link personalizado
  - Implementar fallback para envio direto caso n8n falhe
  - Configurar logs de entrega de emails
  - _Requirements: 8.6, 8.7_

- [ ] 11.4 Fluxo completo de onboarding
  - Email de verificação → Código → Confirmação
  - Criação automática da estrutura da barbearia
  - Setup inicial: primeiro barbeiro, serviços básicos
  - Email de boas-vindas com link de acesso personalizado
  - Tutorial inicial na primeira entrada
  - _Requirements: 8.4, 8.6, 8.7_

- [ ] 11.5 Página de login com verificação de plano
  - Atualizar página de login existente
  - Adicionar botão "Começar Grátis" que direciona para cadastro
  - Implementar verificação de status de pagamento
  - Criar redirecionamento para página específica da barbearia
  - _Requirements: 8.3, 8.4_

## Fase 2.8: Sistema de Planos e Billing

- [ ] 12. Planos e Billing Multi-Tenant
  - Implementar estrutura de planos por barbearia
  - Integrar gateway de pagamento Mercado Pago
  - Criar middleware de verificação de limites por tenant
  - Implementar dashboard de billing por barbearia
  - _Requirements: 7.1, 7.2, 7.3, 8.2_

- [ ] 12.1 Estrutura de planos por barbearia
  - Plano Grátis: 1 barbeiro, 20 agendamentos/mês por barbearia
  - Plano Pro: Ilimitado, R$ 39/mês por barbearia
  - Middleware de verificação de limites por tenant
  - Sistema de upgrade/downgrade de planos
  - _Requirements: 7.1, 7.2, 8.2_

- [ ] 12.2 Integração Mercado Pago Multi-Tenant
  - Configurar SDK do Mercado Pago com suporte a múltiplos tenants
  - Implementar fluxo de pagamento por barbearia
  - Criar webhook para confirmação de pagamento por tenant
  - Implementar renovação automática de assinaturas por barbearia
  - _Requirements: 7.2, 7.3, 8.2_

- [ ] 12.3 Middleware de verificação por tenant
  - Criar middleware para verificar limites do plano por barbearia
  - Implementar bloqueio de funcionalidades quando limite excedido
  - Criar sistema de notificações de limite próximo por tenant
  - Implementar upgrade automático de plano quando necessário
  - _Requirements: 7.1, 7.3, 8.2_

- [ ] 12.4 Interface de billing por barbearia
  - Criar página de planos e preços personalizada por tenant
  - Implementar dashboard de uso atual por barbearia
  - Criar página de gerenciamento de assinatura por tenant
  - Implementar histórico de pagamentos por barbearia
  - _Requirements: 7.2, 7.4, 8.4_

## Fase 2.9: Isolamento e Segurança Multi-Tenant

- [ ] 13. Implementar isolamento completo de dados
  - Garantir que todas as queries incluam filtro por barbershopId
  - Implementar testes de isolamento de dados
  - Criar auditoria de acesso cross-tenant
  - Implementar backup e restore por tenant
  - _Requirements: 8.1, 8.2, 8.5_

- [ ] 13.1 Segurança e autenticação por tenant
  - Implementar autenticação isolada por barbearia
  - Criar sistema de roles e permissões por tenant
  - Implementar JWT com claim de tenant
  - Garantir que usuários só acessem dados da própria barbearia
  - _Requirements: 8.2, 8.5_

- [ ] 13.2 Configurações personalizadas por barbearia
  - Criar sistema de configurações por tenant (tema, logo, etc.)
  - Implementar personalização de domínio/subdomain
  - Criar sistema de templates personalizáveis
  - Implementar configurações de horário de funcionamento por barbearia
  - _Requirements: 8.4, 8.5_

## Fase 2.10: Otimização e Limpeza (Código Enxuto)

- [ ] 14. Auditoria e limpeza de código
  - Identificar e remover imports não utilizados
  - Limpar dependências desnecessárias do package.json
  - Refatorar código duplicado seguindo DRY
  - Remover console.logs e código de debug desnecessário
  - _Requirements: 5.2, 5.3_

- [ ] 14.1 Otimizar integração com backend
  - Revisar e otimizar configurações de cache existentes
  - Validar se todos os fallback endpoints são necessários
  - Otimizar retry logic para reduzir latência
  - Implementar lazy loading onde apropriado
  - _Requirements: 5.1, 5.4, 6.3_

- [ ] 14.2 Simplificar arquitetura onde possível
  - Identificar abstrações desnecessárias
  - Consolidar interfaces similares
  - Simplificar fluxos de dados complexos
  - Aplicar princípio KISS (Keep It Simple, Stupid)
  - _Requirements: 5.1, 5.3, 5.4_

- [ ] 15. Documentar integração com backend
  - Documentar endpoints utilizados e suas respostas
  - Criar guia de integração para novos desenvolvedores
  - Documentar configurações de ambiente necessárias
  - Listar mudanças propostas para o backend (se houver)
  - _Requirements: 2.4, 5.4, 6.2, 6.4_

- [ ] 15.1 Validar implementação completa e enxuta
  - Executar suite completa de testes (unitários + integração)
  - Verificar cobertura de código mantida/melhorada
  - Validar performance da aplicação (não degradar)
  - Confirmar que código está limpo e enxuto
  - Validar integração eficiente com backend existente
  - _Requirements: 1.3, 2.4, 3.4, 4.4, 5.4, 6.3_