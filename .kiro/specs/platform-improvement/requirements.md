# Requirements Document

## Introduction

Este documento define os requisitos para um **MVP enxuto e vendável** da plataforma BarberShop SaaS. O objetivo é criar um produto funcional em **3-4 semanas** que gere receita real, focando em funcionalidades essenciais ao invés de arquitetura perfeita.

**Contexto**: O projeto possui backend funcional. O foco agora é **validar o produto com clientes pagantes** antes de otimizar arquitetura. Prioridade: **receita > código perfeito**.

## Requirements - MVP Enxuto

### Requirement 1: Core Funcional

**User Story:** Como dono de barbearia, eu quero um sistema básico de agendamentos, para que meus clientes possam agendar e eu possa gerenciar minha agenda.

#### Acceptance Criteria

1. WHEN um cliente acessa o sistema THEN ele SHALL conseguir ver barbeiros e serviços disponíveis
2. WHEN um cliente seleciona barbeiro, serviço e horário THEN o sistema SHALL criar o agendamento
3. WHEN há conflito de horário THEN o sistema SHALL impedir o agendamento duplo
4. WHEN um barbeiro acessa sua agenda THEN ele SHALL ver todos os agendamentos do dia

### Requirement 2: Gestão Básica

**User Story:** Como barbeiro, eu quero gerenciar meus agendamentos, para que eu possa confirmar, cancelar e organizar meu trabalho.

#### Acceptance Criteria

1. WHEN um novo agendamento é criado THEN eu SHALL receber notificação
2. WHEN eu acesso minha agenda THEN eu SHALL poder confirmar ou cancelar agendamentos
3. WHEN eu defino meus horários de trabalho THEN o sistema SHALL respeitar minha disponibilidade
4. WHEN eu marco indisponibilidade THEN novos agendamentos SHALL ser bloqueados

### Requirement 3: Monetização

**User Story:** Como empreendedor, eu quero cobrar pelo uso do sistema, para que o negócio seja sustentável.

#### Acceptance Criteria

1. WHEN um estabelecimento se cadastra THEN ele SHALL ter acesso ao plano gratuito limitado
2. WHEN um estabelecimento excede os limites THEN ele SHALL ser direcionado para upgrade
3. WHEN um pagamento é processado THEN o plano SHALL ser ativado automaticamente
4. WHEN um pagamento falha THEN o sistema SHALL notificar e bloquear recursos premium

### Requirement 4: Multi-tenant

**User Story:** Como plataforma SaaS, eu quero suportar múltiplos estabelecimentos, para que cada um tenha seus dados isolados.

#### Acceptance Criteria

1. WHEN um estabelecimento acessa o sistema THEN ele SHALL ver apenas seus próprios dados
2. WHEN dados são criados THEN eles SHALL ser associados ao estabelecimento correto
3. WHEN um usuário troca de estabelecimento THEN os dados SHALL ser filtrados adequadamente
4. WHEN há problemas de isolamento THEN dados de outros estabelecimentos SHALL permanecer seguros

### Requirement 5: Simplicidade

**User Story:** Como desenvolvedor, eu quero manter o código simples e funcional, para que o produto seja entregue rapidamente e seja fácil de manter.

#### Acceptance Criteria

1. WHEN funcionalidades são implementadas THEN elas SHALL focar no essencial para o negócio
2. WHEN código é escrito THEN ele SHALL ser direto e sem abstrações desnecessárias
3. WHEN testes são criados THEN eles SHALL cobrir apenas fluxos críticos
4. WHEN otimizações são feitas THEN elas SHALL ser baseadas em necessidades reais de usuários

### Requirement 6: Validação de Mercado

**User Story:** Como produto, eu quero ser validado por clientes reais, para que as próximas funcionalidades sejam baseadas em necessidades reais.

#### Acceptance Criteria

1. WHEN o MVP é lançado THEN ele SHALL ter pelo menos 5 estabelecimentos testando
2. WHEN clientes usam o sistema THEN suas ações SHALL ser monitoradas para entender padrões de uso
3. WHEN feedback é coletado THEN ele SHALL guiar as próximas funcionalidades
4. WHEN clientes pagam THEN isso SHALL validar a proposta de valor do produto