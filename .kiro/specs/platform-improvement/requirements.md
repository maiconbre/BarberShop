# Requirements Document

## Introduction

Este documento define os requisitos para a **correção completa e funcionalização** da plataforma BarberShop. O objetivo é corrigir todos os problemas existentes, implementar integração real com API Node.js + Express + PostgreSQL, remover mocks, corrigir erros TypeScript e garantir que todos os testes passem.

**Contexto**: O projeto possui backend Node.js/Express/Sequelize/PostgreSQL funcional mas com problemas de integração. O frontend React/TypeScript tem dados mock que precisam ser substituídos por serviços reais. Existem erros de TypeScript e falhas em testes que impedem o funcionamento adequado.

**Objetivo**: Plataforma totalmente funcional com arquitetura SOLID, dados reais do banco, zero erros TypeScript e 100% dos testes passando.

## Requirements - Correção Completa

### Requirement 1: Frontend com Dados Reais

**User Story:** Como desenvolvedor, eu quero que o frontend consuma dados reais do backend via API, para que não existam mais dados mock e o sistema funcione com informações reais do banco PostgreSQL.

#### Acceptance Criteria

1. WHEN o frontend busca serviços THEN ele SHALL usar endpoint real `/api/services` do backend Node.js
2. WHEN dados de barbearia são carregados THEN a função `getBarbershopBySlug` SHALL buscar dados reais do banco PostgreSQL
3. WHEN chamadas Axios falham THEN o sistema SHALL tratar corretamente erros 500, 404 e outros códigos HTTP
4. WHEN o frontend carrega THEN todos os dados SHALL vir do banco de dados real via API REST

### Requirement 2: Backend Node.js Corrigido

**User Story:** Como sistema backend, eu quero funcionar corretamente com PostgreSQL e Sequelize, para que todas as operações de banco sejam executadas sem erros.

#### Acceptance Criteria

1. WHEN `registerBarbershop` é chamada THEN ela SHALL gerar UUID válido para usuário usando biblioteca `uuid`
2. WHEN usuário administrador é criado THEN ele SHALL ser associado corretamente à barbearia recém-criada
3. WHEN endpoint `/api/barbershops/register` é chamado THEN ele SHALL funcionar sem erros de banco de dados
4. WHEN endpoints de API são acessados THEN eles SHALL retornar dados reais do PostgreSQL via Sequelize

### Requirement 3: Banco de Dados PostgreSQL Corrigido

**User Story:** Como banco de dados, eu quero ter estrutura correta com UUIDs válidos e integridade referencial, para que todas as operações sejam executadas sem erros.

#### Acceptance Criteria

1. WHEN `Users.id` é criado THEN ele SHALL ser UUID válido gerado pela biblioteca `uuid`
2. WHEN `Barbershops.id` é criado THEN ele SHALL manter formato UUID e vincular corretamente com usuários
3. WHEN integridade referencial é verificada THEN FK `barbershopId` em `Users` SHALL funcionar corretamente
4. WHEN IDs são gerados THEN o sistema SHALL evitar concatenações como `admin-<uuid>-<timestamp>` que causam erros PostgreSQL

### Requirement 4: Testes Funcionando

**User Story:** Como desenvolvedor, eu quero que todos os testes unitários e de integração passem, para que o código seja confiável e manutenível.

#### Acceptance Criteria

1. WHEN `npm run test` é executado THEN todos os testes unitários SHALL passar sem erros
2. WHEN testes de integração são executados THEN eles SHALL usar dados reais do banco onde necessário
3. WHEN testes TypeScript são executados THEN eles SHALL passar sem warnings ou erros de tipagem
4. WHEN dados mock são usados em testes THEN eles SHALL ser substituídos por dados reais quando apropriado

### Requirement 5: TypeScript Sem Erros

**User Story:** Como desenvolvedor, eu quero código TypeScript limpo e sem erros, para que o desenvolvimento seja produtivo e o código seja type-safe.

#### Acceptance Criteria

1. WHEN controllers são compilados THEN eles SHALL não ter erros de TypeScript
2. WHEN services são compilados THEN eles SHALL ter tipagem correta e consistente
3. WHEN rotas são definidas THEN elas SHALL ter tipos corretos para request/response
4. WHEN frontend e backend compartilham tipos THEN eles SHALL ser consistentes (Barbershop, Service, User)

### Requirement 6: Logs e Depuração

**User Story:** Como sistema, eu quero ter logs claros e tratamento de erros adequado, para que problemas sejam facilmente identificados e resolvidos.

#### Acceptance Criteria

1. WHEN endpoints são acessados THEN logs claros SHALL ser registrados para cada operação
2. WHEN erros ocorrem THEN mensagens detalhadas SHALL ser exibidas no console apenas em desenvolvimento
3. WHEN erros internos (500) acontecem THEN eles SHALL não quebrar o frontend e retornar mensagens amigáveis
4. WHEN operações de banco falham THEN logs específicos SHALL ajudar na depuração

### Requirement 7: UUIDs e Identificadores

**User Story:** Como sistema de identificação, eu quero usar UUIDs válidos gerados corretamente, para que não haja conflitos ou erros de formato.

#### Acceptance Criteria

1. WHEN UUIDs são gerados THEN eles SHALL usar a biblioteca `uuid` do npm
2. WHEN usuários são criados THEN seus IDs SHALL ser UUIDs válidos sem concatenações
3. WHEN barbearias são criadas THEN seus IDs SHALL ser UUIDs válidos
4. WHEN referências são feitas THEN elas SHALL usar UUIDs corretos sem strings concatenadas

### Requirement 8: Arquitetura SOLID

**User Story:** Como arquitetura de software, eu quero seguir princípios SOLID, para que o código seja manutenível, testável e extensível.

#### Acceptance Criteria

1. WHEN classes são criadas THEN elas SHALL seguir Single Responsibility Principle
2. WHEN interfaces são definidas THEN elas SHALL seguir Interface Segregation Principle  
3. WHEN dependências são injetadas THEN elas SHALL seguir Dependency Inversion Principle
4. WHEN código é estendido THEN ele SHALL seguir Open/Closed Principle