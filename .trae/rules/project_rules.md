# Regras de Arquitetura - BarberGR

## Estrutura de Diretórios
- `/src/types` - Definições de tipos TypeScript
- `/src/models` - Modelos de domínio com lógica de negócio
- `/src/services` - Camada de serviços para comunicação com API
- `/src/stores` - Gerenciamento de estado global (Zustand)
- `/src/hooks` - Hooks customizados reutilizáveis
- `/src/validators` - Esquemas de validação (Zod)
- `/src/business` - Regras de negócio puras
- `/src/components/ui` - Componentes de interface reutilizáveis
- `/src/components/feature` - Componentes específicos de funcionalidades

## Princípios SOLID
1. **SRP**: Cada classe/componente deve ter uma única responsabilidade
2. **OCP**: Aberto para extensão, fechado para modificação
3. **LSP**: Subtipos devem ser substituíveis por seus tipos base
4. **ISP**: Interfaces específicas são melhores que interfaces gerais
5. **DIP**: Dependa de abstrações, não de implementações concretas

## Padrões Obrigatórios
- Use TypeScript estrito (strict: true)
- Componentes funcionais com hooks
- Props tipadas com interfaces
- Validação com Zod
- Sempre responda em português
- Estado global com Zustand
- Testes unitários para regras de negócio
- Documentação JSDoc para funções públicas

## Convenções de Nomenclatura
- Componentes: PascalCase (ex: AppointmentCard)
- Hooks: camelCase iniciando com 'use' (ex: useAppointmentFilters)
- Serviços: PascalCase terminando com 'Service' (ex: AppointmentService)
- Stores: camelCase terminando com 'Store' (ex: appointmentStore)
- Tipos: PascalCase (ex: Appointment, User)
- Constantes: UPPER_SNAKE_CASE (ex: AVAILABLE_TIME_SLOTS)

## Regras de Importação
- Imports absolutos usando alias '@/'
- Agrupar imports: externos, internos, relativos
- Usar named imports quando possível
- Evitar imports circulares