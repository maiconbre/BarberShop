# Implementação de Dados Padrão

## Resumo das Mudanças

Este documento descreve as modificações implementadas para remover seeders iniciais e criar dados padrão apenas após o registro da primeira barbearia.

## Mudanças Realizadas

### 1. Remoção de Seeders Iniciais

- **Arquivo modificado**: `backend/scripts/seed-reset.js`
- **Mudança**: Removida a chamada para `seedDevelopmentData()`
- **Resultado**: O banco de dados agora inicia completamente vazio

### 2. Criação de Utilitário para Dados Padrão

- **Arquivo criado**: `backend/utils/defaultData.js`
- **Função**: `createDefaultBarbershopData(barbershop, firstBarber)`
- **Dados criados**:
  - 2 serviços padrão: "Corte Masculino" (R$ 25,00) e "Barba" (R$ 15,00)
  - 1 agendamento teste para o dia seguinte às 10:00

### 3. Integração com Controller de Barbearia

- **Arquivo modificado**: `backend/controllers/barbershopController.js`
- **Mudança**: Adicionada chamada para `createDefaultBarbershopData()` após criação da barbearia
- **Momento**: Executado automaticamente após o registro bem-sucedido de uma nova barbearia

### 4. Deprecação do Seeder Antigo

- **Arquivo modificado**: `backend/seeders/dev-seed.js`
- **Mudança**: Adicionado comentário de deprecação
- **Status**: Mantido para referência, mas não mais utilizado

### 5. Script de Teste

- **Arquivo criado**: `backend/scripts/test-default-data.js`
- **Função**: Testa a criação automática de dados padrão
- **Comando**: `npm run test:default-data`

## Como Funciona Agora

1. **Reset do Banco**: `npm run seed:reset` cria um banco completamente vazio
2. **Registro de Barbearia**: Quando uma barbearia é registrada via API
3. **Criação Automática**: O sistema automaticamente cria:
   - 2 serviços padrão
   - 1 agendamento de teste
4. **Isolamento**: Cada barbearia tem seus próprios dados padrão

## Benefícios

- ✅ Banco de dados inicia limpo
- ✅ Dados padrão criados apenas quando necessário
- ✅ Cada barbearia tem seus próprios dados isolados
- ✅ Processo automatizado e transparente
- ✅ Facilita testes e desenvolvimento

## Comandos Úteis

```bash
# Resetar banco (vazio)
npm run seed:reset

# Testar criação de dados padrão
npm run test:default-data

# Iniciar servidor
npm run dev
```

## Estrutura dos Dados Padrão

### Serviços Criados
- **Corte Masculino**: R$ 25,00
- **Barba**: R$ 15,00

### Agendamento Teste
- **Cliente**: "Cliente Teste"
- **Serviço**: "Corte Masculino"
- **Data**: Dia seguinte ao registro
- **Horário**: 10:00
- **Status**: "confirmed"
- **WhatsApp**: "11999999999"

## Notas Técnicas

- Os dados são criados usando o mesmo barbeiro criado automaticamente no registro
- O agendamento é sempre para o dia seguinte para evitar conflitos de data
- Todos os dados são associados ao `barbershopId` correto para isolamento multi-tenant
- A função é executada dentro da transação de registro da barbearia