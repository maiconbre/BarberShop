# Utilitários do Sistema

## DateTimeUtils

Este módulo centraliza todas as funções relacionadas ao tratamento de datas e horários no sistema, garantindo consistência no uso do fuso horário de Brasília (UTC-3) em toda a aplicação.

### Funções Disponíveis

- `adjustToBrasilia(date: Date)`: Ajusta uma data para o fuso horário de Brasília
- `getBrasiliaDate()`: Retorna a data atual no fuso horário de Brasília
- `formatToISODate(date: Date)`: Formata uma data para o formato ISO (YYYY-MM-DD) no fuso horário de Brasília
- `isSameDayInBrasilia(date1: Date, date2: Date)`: Verifica se duas datas são o mesmo dia no fuso horário de Brasília
- `formatFriendlyDateTime(dateStr: string, timeStr: string)`: Formata uma data e hora para exibição amigável (Hoje, Amanhã, etc)

### Constantes

- `BRASILIA_TIMEZONE`: 'America/Sao_Paulo' - Constante para o fuso horário de Brasília

### Como Usar

```typescript
import { adjustToBrasilia, formatToISODate, BRASILIA_TIMEZONE } from '../utils/DateTimeUtils';

// Obter data atual no fuso horário de Brasília
const today = adjustToBrasilia(new Date());

// Formatar data para ISO
const formattedDate = formatToISODate(today);

// Formatar data e hora para exibição amigável
const friendlyDate = formatFriendlyDateTime('2023-05-15', '14:30');
```

### Implementação

O sistema utiliza duas abordagens para garantir o correto funcionamento do fuso horário:

1. **Ajuste manual de offset**: Calcula a diferença entre o fuso horário local e o de Brasília (UTC-3)
2. **Uso do timeZone**: Utiliza a API de internacionalização do JavaScript com o timeZone 'America/Sao_Paulo'

Esta implementação centralizada resolve problemas de inconsistência no tratamento de datas e horários em diferentes componentes da aplicação.