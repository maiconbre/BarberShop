/**
 * Utilitário para padronizar o tratamento de fuso horário em toda a aplicação
 * Centraliza as funções de ajuste para o horário de Brasília (UTC-3)
 */

// Constante para o fuso horário de Brasília
export const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

/**
 * Classe utilitária para operações de data e hora
 */
export class DateTimeUtils {
  /**
   * Obtém a data atual no fuso horário de Brasília
   */
  static getCurrentBrasiliaDate(): Date {
    return getBrasiliaDate();
  }

  /**
   * Formata uma data para exibição amigável
   */
  static formatFriendlyDate(date: Date): string {
    const brasiliaDate = adjustToBrasilia(date);
    return brasiliaDate.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Formata uma data e hora para exibição amigável
   */
  static formatFriendlyDateTime(date: Date): string {
    const brasiliaDate = adjustToBrasilia(date);
    const dateStr = formatToISODate(brasiliaDate);
    const timeStr = brasiliaDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return formatFriendlyDateTime(dateStr, timeStr);
  }

  /**
   * Verifica se duas datas são o mesmo dia
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return isSameDayInBrasilia(date1, date2);
  }
}

/**
 * Ajusta uma data para o fuso horário de Brasília
 * @param date Data a ser ajustada
 * @returns Data ajustada para o fuso horário de Brasília
 */
export const adjustToBrasilia = (date: Date): Date => {
  const adjusted = new Date(date);
  const brasiliaOffset = -3 * 60; // UTC-3 em minutos
  const localOffset = adjusted.getTimezoneOffset();
  const offsetDiff = localOffset + brasiliaOffset;
  adjusted.setMinutes(adjusted.getMinutes() + offsetDiff);
  return adjusted;
};

/**
 * Cria uma nova data no fuso horário de Brasília
 * @returns Data atual no fuso horário de Brasília
 */
export const getBrasiliaDate = (): Date => {
  const now = new Date();
  return adjustToBrasilia(now);
};

/**
 * Formata uma data para o formato ISO (YYYY-MM-DD) no fuso horário de Brasília
 * @param date Data a ser formatada
 * @returns String no formato YYYY-MM-DD
 */
export const formatToISODate = (date: Date): string => {
  const brasiliaDate = adjustToBrasilia(date);
  return brasiliaDate.toISOString().split('T')[0];
};

/**
 * Verifica se duas datas são o mesmo dia no fuso horário de Brasília
 * @param date1 Primeira data
 * @param date2 Segunda data
 * @returns true se as datas representam o mesmo dia
 */
export const isSameDayInBrasilia = (date1: Date, date2: Date): boolean => {
  const d1 = adjustToBrasilia(date1);
  const d2 = adjustToBrasilia(date2);
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Formata uma data e hora para exibição amigável (Hoje, Amanhã, etc)
 * @param dateStr String de data no formato YYYY-MM-DD
 * @param timeStr String de hora no formato HH:MM
 * @returns String formatada para exibição
 */
export const formatFriendlyDateTime = (dateStr: string, timeStr: string): string => {
  // Configurar timezone para Brasília
  const timeZone = BRASILIA_TIMEZONE;
  
  // Criar data atual no fuso horário correto
  const today = new Date().toLocaleString('en-US', { timeZone });
  const todayDate = new Date(today);
  
  // Criar data de amanhã
  const tomorrow = new Date(todayDate);
  tomorrow.setDate(todayDate.getDate() + 1);
  
  // Criar data do agendamento no fuso horário correto
  const [year, month, day] = dateStr.split('-');
  const appointmentDate = new Date(
    `${year}-${month}-${day}T00:00:00`
  ).toLocaleString('en-US', { timeZone });
  const appointmentDateTime = new Date(appointmentDate);
  
  // Remover horários para comparação apenas das datas
  todayDate.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  appointmentDateTime.setHours(0, 0, 0, 0);

  // Comparar as datas
  if (appointmentDateTime.getTime() === todayDate.getTime()) {
    return `Hoje às ${timeStr}`;
  }
  
  if (appointmentDateTime.getTime() === tomorrow.getTime()) {
    return `Amanhã às ${timeStr}`;
  }

  // Para outras datas, mostrar dia e mês formatados para pt-BR
  return appointmentDateTime.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'numeric'
  }).replace(',', '') + ` às ${timeStr}`;
};