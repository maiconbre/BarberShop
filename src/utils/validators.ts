/**
 * Validation utilities
 */
import { VALIDATION_RULES } from '@/constants';

/**
 * Validates Brazilian phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH;
};

/**
 * Validates if a string contains only letters and spaces
 */
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
  return nameRegex.test(name) && name.trim().length > 0;
};

/**
 * Validates if a price is valid (positive number)
 */
export const isValidPrice = (price: number): boolean => {
  return price > 0 && Number.isFinite(price);
};

/**
 * Validates if duration is valid (positive integer)
 */
export const isValidDuration = (duration: number): boolean => {
  return Number.isInteger(duration) && duration > 0;
};

/**
 * Validates if a date is in the future
 */
export const isFutureDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() > Date.now();
};

/**
 * Validates if a date is today or in the future
 */
export const isTodayOrFuture = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const compareDate = new Date(dateObj);
  compareDate.setHours(0, 0, 0, 0);
  
  return compareDate.getTime() >= today.getTime();
};

/**
 * Validates if a time slot is within working hours
 */
export const isWithinWorkingHours = (
  time: string,
  startTime: string,
  endTime: string
): boolean => {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
};

/**
 * Converts time string (HH:MM) to minutes since midnight
 */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Converts minutes since midnight to time string (HH:MM)
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Validates if a file type is allowed
 */
export const isValidFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Validates if a file size is within limits
 */
export const isValidFileSize = (file: File, maxSizeInBytes: number): boolean => {
  return file.size <= maxSizeInBytes;
};

/**
 * Validates Brazilian CPF format
 */
export const isValidCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) {
    return false;
  }
  
  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }
  
  // Validate CPF algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  
  if (remainder !== parseInt(cleaned.charAt(9))) {
    return false;
  }
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  
  return remainder === parseInt(cleaned.charAt(10));
};

/**
 * Validates if a URL is valid
 */
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates if a string is not empty after trimming
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Validates if a value is within a numeric range
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};