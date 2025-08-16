# Exemplo de Implementação das Validações

## Como Usar as Funções de Validação nos Hooks

### 1. No useAppointments Hook

```typescript
import { validateAppointments, ValidatedAppointment } from '../utils/dataValidation';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<ValidatedAppointment[]>([]);

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await apiService.getAppointments();
      // Validar dados antes de usar
      const validatedAppointments = validateAppointments(response.data);
      setAppointments(validatedAppointments);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      setAppointments([]); // Fallback seguro
    }
  }, []);

  return { appointments, fetchAppointments };
};
```

### 2. No useServices Hook

```typescript
import { validateServices, ValidatedService } from '../utils/dataValidation';

export const useServices = () => {
  const [services, setServices] = useState<ValidatedService[]>([]);

  const fetchServices = useCallback(async () => {
    try {
      const response = await apiService.getServices();
      const validatedServices = validateServices(response.data);
      setServices(validatedServices);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      setServices([]);
    }
  }, []);

  return { services, fetchServices };
};
```

### 3. Nos Componentes

```typescript
import { safeFixed, safeNumber } from '../utils/numberUtils';

const AppointmentCard = ({ appointment }) => {
  return (
    <div>
      <h3>{appointment.clientName}</h3>
      <p>Preço: R$ {safeFixed(appointment.price, 2)}</p>
      <p>Status: {appointment.status}</p>
    </div>
  );
};
```

### 4. Em Cálculos Financeiros

```typescript
import { safeReduceSum, safeAverage } from '../utils/numberUtils';

const calculateStats = (appointments: ValidatedAppointment[]) => {
  const totalRevenue = safeReduceSum(appointments, 'price');
  const averageTicket = safeAverage(appointments.map(a => a.price));
  
  return {
    totalRevenue,
    averageTicket,
    totalAppointments: appointments.length
  };
};
```

## Middleware para APIs

### 1. Interceptor de Response

```typescript
// Em ApiService.ts
import { validateAppointments } from '../utils/dataValidation';

class ApiService {
  async getAppointments() {
    try {
      const response = await this.api.get('/appointments');
      // Validar automaticamente
      return {
        ...response,
        data: validateAppointments(response.data)
      };
    } catch (error) {
      console.error('API Error:', error);
      return { data: [] }; // Fallback seguro
    }
  }
}
```

### 2. Cache Validation

```typescript
// Em CacheService.ts
import { validateCacheData } from '../utils/dataValidation';

class CacheService {
  get(key: string) {
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return validateCacheData(parsed);
      } catch {
        return null;
      }
    }
    return null;
  }
}
```

## Testes Unitários

### 1. Testes para numberUtils

```typescript
// numberUtils.test.ts
import { safeNumber, safeFixed, safeReduceSum } from '../utils/numberUtils';

describe('numberUtils', () => {
  describe('safeNumber', () => {
    test('converts valid numbers', () => {
      expect(safeNumber(123)).toBe(123);
      expect(safeNumber('123')).toBe(123);
      expect(safeNumber('123.45')).toBe(123.45);
    });

    test('handles invalid values', () => {
      expect(safeNumber(null)).toBe(0);
      expect(safeNumber(undefined)).toBe(0);
      expect(safeNumber('invalid')).toBe(0);
      expect(safeNumber(NaN)).toBe(0);
      expect(safeNumber(Infinity)).toBe(0);
    });

    test('uses default value', () => {
      expect(safeNumber(null, 100)).toBe(100);
      expect(safeNumber('invalid', -1)).toBe(-1);
    });
  });

  describe('safeFixed', () => {
    test('formats valid numbers', () => {
      expect(safeFixed(123.456, 2)).toBe('123.46');
      expect(safeFixed(123, 2)).toBe('123.00');
    });

    test('handles invalid values', () => {
      expect(safeFixed(null, 2)).toBe('0.00');
      expect(safeFixed('invalid', 2)).toBe('0.00');
    });
  });

  describe('safeReduceSum', () => {
    test('sums valid prices', () => {
      const items = [
        { price: 10 },
        { price: 20 },
        { price: 30 }
      ];
      expect(safeReduceSum(items, 'price')).toBe(60);
    });

    test('handles invalid prices', () => {
      const items = [
        { price: 10 },
        { price: null },
        { price: 'invalid' },
        { price: 20 }
      ];
      expect(safeReduceSum(items, 'price')).toBe(30);
    });
  });
});
```

### 2. Testes para dataValidation

```typescript
// dataValidation.test.ts
import { validateAppointment, validateAppointments } from '../utils/dataValidation';

describe('dataValidation', () => {
  describe('validateAppointment', () => {
    test('validates complete appointment', () => {
      const input = {
        id: '123',
        clientName: 'João',
        price: 50,
        status: 'completed'
      };
      
      const result = validateAppointment(input);
      expect(result.price).toBe(50);
      expect(result.clientName).toBe('João');
    });

    test('handles invalid price', () => {
      const input = {
        id: '123',
        clientName: 'João',
        price: 'invalid',
        status: 'completed'
      };
      
      const result = validateAppointment(input);
      expect(result.price).toBe(0);
    });
  });
});
```

## Monitoramento e Logs

### 1. Log de Valores Inválidos

```typescript
import { safeNumber } from '../utils/numberUtils';

const safeNumberWithLogging = (value: unknown, context: string) => {
  const result = safeNumber(value);
  
  if (result === 0 && value !== 0 && value !== '0') {
    console.warn(`Valor inválido detectado em ${context}:`, {
      value,
      type: typeof value,
      timestamp: new Date().toISOString()
    });
    
    // Opcional: enviar para serviço de monitoramento
    // monitoringService.logInvalidValue(context, value);
  }
  
  return result;
};
```

### 2. Métricas de Qualidade de Dados

```typescript
class DataQualityMonitor {
  private invalidValueCount = 0;
  private totalValueCount = 0;

  trackValue(value: unknown, isValid: boolean) {
    this.totalValueCount++;
    if (!isValid) {
      this.invalidValueCount++;
    }
  }

  getQualityMetrics() {
    return {
      totalValues: this.totalValueCount,
      invalidValues: this.invalidValueCount,
      qualityRate: this.totalValueCount > 0 
        ? ((this.totalValueCount - this.invalidValueCount) / this.totalValueCount) * 100 
        : 100
    };
  }
}
```

## Resumo da Implementação

1. **Sempre use funções seguras** para operações numéricas
2. **Valide dados na entrada** dos hooks e componentes
3. **Implemente fallbacks** para casos de erro
4. **Monitore qualidade dos dados** para identificar problemas
5. **Teste todas as funções** com casos extremos
6. **Documente o uso** para outros desenvolvedores

Com essa implementação, o frontend estará completamente protegido contra erros de runtime relacionados a valores numéricos inválidos.