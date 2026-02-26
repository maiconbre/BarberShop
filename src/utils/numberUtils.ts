/**
 * Utilitários para manipulação segura de valores numéricos
 * Evita erros de runtime com valores null, undefined ou string
 */

/**
 * Converte um valor para número de forma segura
 * @param value - Valor a ser convertido
 * @param defaultValue - Valor padrão se a conversão falhar (default: 0)
 * @returns Número válido
 */
export const safeNumber = (value: unknown, defaultValue: number = 0): number => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? defaultValue : value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
  }
  
  return defaultValue;
};

/**
 * Formata um valor como moeda brasileira de forma segura
 * @param value - Valor a ser formatado
 * @param defaultValue - Valor padrão se a conversão falhar (default: 0)
 * @returns String formatada como moeda
 */
export const safeCurrency = (value: unknown, defaultValue: number = 0): string => {
  const numValue = safeNumber(value, defaultValue);
  return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
};

/**
 * Formata um valor com decimais de forma segura
 * @param value - Valor a ser formatado
 * @param decimals - Número de casas decimais (default: 2)
 * @param defaultValue - Valor padrão se a conversão falhar (default: 0)
 * @returns String formatada com decimais
 */
export const safeFixed = (value: unknown, decimals: number = 2, defaultValue: number = 0): string => {
  const numValue = safeNumber(value, defaultValue);
  return numValue.toFixed(decimals);
};

/**
 * Soma valores de forma segura, ignorando valores inválidos
 * @param values - Array de valores para somar
 * @returns Soma total dos valores válidos
 */
export const safeSum = (values: unknown[]): number => {
  return values.reduce((sum, value) => sum + safeNumber(value, 0), 0);
};

/**
 * Calcula a média de valores de forma segura
 * @param values - Array de valores
 * @returns Média dos valores válidos ou 0 se não houver valores válidos
 */
export const safeAverage = (values: unknown[]): number => {
  const validValues = values.map(v => safeNumber(v, 0)).filter(v => v !== 0);
  return validValues.length > 0 ? validValues.reduce((sum, v) => sum + v, 0) / validValues.length : 0;
};

/**
 * Reduz um array de objetos somando uma propriedade específica de forma segura
 * @param array - Array de objetos
 * @param property - Nome da propriedade a ser somada
 * @returns Soma total da propriedade
 */
export const safeReduceSum = <T>(array: T[], property: keyof T): number => {
  return array.reduce((sum, item) => {
    const value = item[property];
    return sum + safeNumber(value, 0);
  }, 0);
};

/**
 * Valida se um valor é um número válido para operações financeiras
 * @param value - Valor a ser validado
 * @returns true se o valor é um número válido e positivo
 */
export const isValidPrice = (value: unknown): boolean => {
  const num = safeNumber(value, -1);
  return num >= 0 && isFinite(num);
};

/**
 * Converte string de moeda brasileira para número
 * @param currencyString - String no formato "R$ 123,45" ou "123,45"
 * @returns Número convertido ou 0 se inválido
 */
export const parseBrazilianCurrency = (currencyString: string): number => {
  if (typeof currencyString !== 'string') {
    return 0;
  }
  
  // Remove "R$", espaços e converte vírgula para ponto
  const cleaned = currencyString
    .replace(/R\$\s?/, '')
    .replace(/\./g, '') // Remove pontos de milhares
    .replace(',', '.') // Converte vírgula decimal para ponto
    .trim();
  
  return safeNumber(cleaned, 0);
};