/**
 * Date manipulation utilities
 */

/**
 * Gets the start of day for a given date
 */
export const getStartOfDay = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
};

/**
 * Gets the end of day for a given date
 */
export const getEndOfDay = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
};

/**
 * Checks if a date is today
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
};

/**
 * Checks if a date is tomorrow
 */
export const isTomorrow = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return (
    dateObj.getDate() === tomorrow.getDate() &&
    dateObj.getMonth() === tomorrow.getMonth() &&
    dateObj.getFullYear() === tomorrow.getFullYear()
  );
};

/**
 * Checks if a date is in the past
 */
export const isPast = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() < Date.now();
};

/**
 * Checks if a date is in the future
 */
export const isFuture = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() > Date.now();
};

/**
 * Adds days to a date
 */
export const addDays = (date: Date | string, days: number): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
};

/**
 * Adds hours to a date
 */
export const addHours = (date: Date | string, hours: number): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(dateObj.getHours() + hours);
  return dateObj;
};

/**
 * Adds minutes to a date
 */
export const addMinutes = (date: Date | string, minutes: number): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setMinutes(dateObj.getMinutes() + minutes);
  return dateObj;
};

/**
 * Gets the difference in days between two dates
 */
export const getDaysDifference = (date1: Date | string, date2: Date | string): number => {
  const dateObj1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const dateObj2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const timeDifference = Math.abs(dateObj2.getTime() - dateObj1.getTime());
  return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
};

/**
 * Gets the difference in hours between two dates
 */
export const getHoursDifference = (date1: Date | string, date2: Date | string): number => {
  const dateObj1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const dateObj2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const timeDifference = Math.abs(dateObj2.getTime() - dateObj1.getTime());
  return Math.ceil(timeDifference / (1000 * 60 * 60));
};

/**
 * Gets the difference in minutes between two dates
 */
export const getMinutesDifference = (date1: Date | string, date2: Date | string): number => {
  const dateObj1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const dateObj2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const timeDifference = Math.abs(dateObj2.getTime() - dateObj1.getTime());
  return Math.ceil(timeDifference / (1000 * 60));
};

/**
 * Creates a date from date and time strings
 */
export const createDateTime = (dateStr: string, timeStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  return new Date(year, month - 1, day, hours, minutes);
};

/**
 * Gets the current date in YYYY-MM-DD format
 */
export const getCurrentDateString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Gets the current time in HH:MM format
 */
export const getCurrentTimeString = (): string => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

/**
 * Converts a date to ISO string format for API
 */
export const toISOString = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString();
};

/**
 * Converts a date to date string (YYYY-MM-DD)
 */
export const toDateString = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
};

/**
 * Converts a date to time string (HH:MM)
 */
export const toTimeString = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toTimeString().slice(0, 5);
};

/**
 * Gets the week day name in Portuguese
 */
export const getWeekDayName = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const weekDays = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];
  
  return weekDays[dateObj.getDay()];
};

/**
 * Gets the month name in Portuguese
 */
export const getMonthName = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ];
  
  return months[dateObj.getMonth()];
};

/**
 * Checks if two dates are the same day
 */
export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const dateObj1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const dateObj2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return (
    dateObj1.getDate() === dateObj2.getDate() &&
    dateObj1.getMonth() === dateObj2.getMonth() &&
    dateObj1.getFullYear() === dateObj2.getFullYear()
  );
};

/**
 * Gets an array of dates between two dates
 */
export const getDateRange = (startDate: Date | string, endDate: Date | string): Date[] => {
  const start = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate);
  const end = typeof endDate === 'string' ? new Date(endDate) : new Date(endDate);
  const dates: Date[] = [];
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};