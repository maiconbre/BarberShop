# Implementation Plan - Fase 2: Integração SOLID

## Fase 2.1: Correção de Testes de Hooks

- [-] 1. Analisar e corrigir testes de hooks falhando



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

- [-] 1.3 Validar cobertura de testes após correções

  - Executar suite completa de testes
  - Verificar se cobertura foi mantida ou melhorada
  - Documentar mudanças realizadas
  - _Requirements: 1.3_

## Fase 2.2: Implementação de Repositórios Restantes

- [ ] 2. Implementar AppointmentRepository
  - Criar interface IAppointmentRepository seguindo padrão existente
  - Implementar classe AppointmentRepository com operações CRUD
  - Adicionar métodos específicos (findByUserId, findByDateRange, findByStatus)
  - _Requirements: 3.1, 3.3_

- [ ] 2.1 Criar testes unitários para AppointmentRepository
  - Implementar testes para todas as operações CRUD
  - Testar métodos específicos de busca
  - Garantir mocks adequados para dependências
  - _Requirements: 3.3_

- [ ] 3. Implementar ServiceRepository completo
  - Expandir ServiceRepository existente com operações faltantes
  - Adicionar métodos findByCategory, findActive, findByPriceRange
  - Garantir consistência com padrão dos outros repositórios
  - _Requirements: 3.2, 3.3_

- [ ] 3.1 Criar testes unitários para ServiceRepository
  - Implementar testes para novos métodos
  - Validar operações de filtragem e busca
  - Testar integração com cache service
  - _Requirements: 3.3_

- [ ] 4. Integrar novos repositórios no ServiceFactory
  - Adicionar AppointmentRepository ao ServiceFactory
  - Atualizar ServiceRepository no factory
  - Implementar injeção de dependências adequada
  - _Requirements: 3.4_

## Fase 2.3: Migração de Componentes

- [ ] 5. Criar hooks para novos domínios
  - Implementar useAppointments hook seguindo padrão do useUsers
  - Implementar useServices hook para gerenciar serviços
  - Garantir reutilização e testabilidade dos hooks
  - _Requirements: 2.1, 2.3_

- [ ] 5.1 Criar testes para novos hooks
  - Implementar testes unitários para useAppointments
  - Implementar testes unitários para useServices
  - Validar comportamento assíncrono e estados
  - _Requirements: 2.1, 2.3_

- [ ] 6. Migrar componentes de usuário
  - Identificar componentes que usam dados de usuário
  - Migrar para usar useUsers hook em vez de chamadas diretas
  - Manter funcionalidade existente durante migração
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 6.1 Migrar componentes de agendamento
  - Atualizar componentes para usar useAppointments hook
  - Refatorar lógica de negócio para repositórios
  - Implementar tratamento de erro consistente
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 6.2 Migrar componentes de serviços
  - Atualizar componentes para usar useServices hook
  - Aplicar padrões SOLID na refatoração
  - Garantir componentes mais testáveis
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 7. Atualizar stores Zustand
  - Migrar stores para usar repositórios em vez de API direta
  - Manter compatibilidade com componentes existentes
  - Implementar transição gradual
  - _Requirements: 2.1, 2.2_

## Fase 2.4: Testes de Integração

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

## Fase 2.5: Otimização e Limpeza

- [ ] 10. Remover código legado não utilizado
  - Identificar e remover imports não utilizados
  - Limpar dependências desnecessárias
  - Refatorar código duplicado
  - _Requirements: 5.2, 5.3_

- [ ] 10.1 Otimizar performance da aplicação
  - Implementar lazy loading onde apropriado
  - Otimizar re-renders desnecessários
  - Revisar e otimizar queries de dados
  - _Requirements: 5.1, 5.4_

- [ ] 11. Documentar mudanças e padrões
  - Atualizar documentação de arquitetura
  - Criar guias de uso para novos hooks
  - Documentar padrões de migração para futuros desenvolvimentos
  - _Requirements: 2.4, 5.4_

- [ ] 11.1 Validar implementação completa
  - Executar suite completa de testes (unitários + integração)
  - Verificar cobertura de código
  - Validar performance da aplicação
  - Confirmar que todos os requisitos foram atendidos
  - _Requirements: 1.3, 2.4, 3.4, 4.4, 5.4_