# Boas Práticas para Manipulação de Valores Numéricos

## Problemas Identificados e Soluções Implementadas

### 1. Erros de Runtime com `.toFixed()`

**Problema:** Valores que chegam como `string`, `null` ou `undefined` do backend causam erros `TypeError: xxx.toFixed is not a function`.

**Solução:** Criado utilitário `numberUtils.ts` com funções seguras:

```typescript
import { safeNumber, safeFixed, safeReduceSum } from '../../utils/numberUtils';

// Ao invés de:
appointment.price.toFixed(2) // ❌ Pode quebrar

// Use:
safeFixed(appointment.price, 2) // ✅ Sempre funciona
```

### 2. Operações Matemáticas Inseguras

**Problema:** Somas e reduções podem falhar com valores não numéricos.

**Solução:**
```typescript
// Ao invés de:
appointments.reduce((sum, app) => sum + app.price, 0) // ❌ Pode quebrar

// Use:
safeReduceSum(appointments, 'price') // ✅ Sempre funciona
```

### 3. Arquivos Corrigidos

#### Frontend:
- ✅ `src/components/feature/Stats.tsx`
- ✅ `src/components/feature/AppointmentCardNew.tsx`
- ✅ `src/components/feature/BookingModal.tsx`
- ✅ `src/components/feature/Services.tsx`
- ✅ `src/components/feature/ClientAnalytics.tsx`
- ✅ `src/components/feature/Grafico.tsx`
- ✅ `src/components/feature/MonitoringDashboard.tsx`
- ✅ `src/pages/ServiceManagementPage.tsx`

## Funções Utilitárias Criadas

### `safeNumber(value, defaultValue = 0)`
Converte qualquer valor para número de forma segura.

### `safeFixed(value, decimals = 2, defaultValue = 0)`
Formata número com decimais de forma segura.

### `safeCurrency(value, defaultValue = 0)`
Formata como moeda brasileira de forma segura.

### `safeReduceSum(array, property)`
Soma propriedades de array de forma segura.

### `safeSum(values)`
Soma array de valores de forma segura.

### `safeAverage(values)`
Calcula média de forma segura.

### `isValidPrice(value)`
Valida se é um preço válido.

### `parseBrazilianCurrency(currencyString)`
Converte string de moeda brasileira para número.

## Boas Práticas Recomendadas

### 1. Sempre Use Funções Seguras
```typescript
// ❌ Evite
const total = items.reduce((sum, item) => sum + item.price, 0);
const formatted = total.toFixed(2);

// ✅ Prefira
const total = safeReduceSum(items, 'price');
const formatted = safeFixed(total, 2);
```

### 2. Validação de Dados do Backend
```typescript
// Valide dados recebidos do backend
const processAppointment = (appointment: any) => {
  return {
    ...appointment,
    price: safeNumber(appointment.price, 0),
    // outros campos...
  };
};
```

### 3. Tipagem TypeScript Rigorosa
```typescript
interface Appointment {
  id: string;
  price: number; // Sempre number, nunca string | number
  // outros campos...
}
```

### 4. Tratamento de Erros em Operações Financeiras
```typescript
const calculateTotal = (appointments: Appointment[]) => {
  try {
    return safeReduceSum(appointments, 'price');
  } catch (error) {
    console.error('Erro ao calcular total:', error);
    return 0;
  }
};
```

### 5. Formatação Consistente de Moeda
```typescript
// Use sempre a função safeCurrency para consistência
const displayPrice = (price: unknown) => safeCurrency(price);
```

## Verificações no Backend

### 1. Modelo de Dados
O backend já está configurado corretamente:
```javascript
// backend/models/Appointment.js
price: {
  type: DataTypes.FLOAT,
  allowNull: false
}
```

### 2. Validação de Entrada
Recomenda-se adicionar validação nos controllers:
```javascript
const validatePrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && numPrice >= 0 ? numPrice : 0;
};
```

## Testes Recomendados

### 1. Testes Unitários para Funções Utilitárias
```typescript
describe('numberUtils', () => {
  test('safeNumber handles null/undefined', () => {
    expect(safeNumber(null)).toBe(0);
    expect(safeNumber(undefined)).toBe(0);
    expect(safeNumber('invalid')).toBe(0);
  });

  test('safeFixed formats correctly', () => {
    expect(safeFixed(123.456, 2)).toBe('123.46');
    expect(safeFixed(null, 2)).toBe('0.00');
  });
});
```

### 2. Testes de Integração
```typescript
test('Stats component handles invalid prices', () => {
  const appointments = [
    { price: null },
    { price: 'invalid' },
    { price: 50 }
  ];
  
  // Deve renderizar sem erros
  render(<Stats appointments={appointments} />);
});
```

## Monitoramento e Alertas

### 1. Logs de Valores Inválidos
```typescript
const safeNumberWithLogging = (value: unknown, context: string) => {
  const result = safeNumber(value);
  if (result === 0 && value !== 0) {
    console.warn(`Valor inválido detectado em ${context}:`, value);
  }
  return result;
};
```

### 2. Métricas de Qualidade de Dados
Monitore quantos valores inválidos são recebidos do backend para identificar problemas na origem.

## Próximos Passos

1. **Implementar testes unitários** para as funções utilitárias
2. **Adicionar validação no backend** para garantir que apenas números válidos sejam salvos
3. **Criar middleware de validação** para APIs que recebem valores financeiros
4. **Implementar logging** para rastrear valores inválidos
5. **Adicionar alertas** para detectar problemas de qualidade de dados

## Resumo

Com essas implementações, o frontend agora está protegido contra erros de runtime causados por valores não numéricos. As funções utilitárias garantem que:

- ✅ Nunca mais ocorrerão erros `TypeError: xxx.toFixed is not a function`
- ✅ Operações matemáticas sempre retornam valores válidos
- ✅ A formatação de moeda é consistente em todo o app
- ✅ O código é mais robusto e confiável
- ✅ A experiência do usuário é preservada mesmo com dados inconsistentes