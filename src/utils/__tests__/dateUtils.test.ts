import { describe, it, expect } from 'vitest';
import { addDays, isSameDay } from '../dateUtils';
import { formatDate } from '../formatters';

// Helper function to check if date is valid
const isValidDate = (date: unknown): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should handle invalid date', () => {
      const invalidDate = new Date('invalid');
      const formatted = formatDate(invalidDate);
      expect(formatted).toBe('Invalid Date');
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid date', () => {
      const validDate = new Date('2024-01-15');
      expect(isValidDate(validDate)).toBe(true);
    });

    it('should return false for invalid date', () => {
      const invalidDate = new Date('invalid');
      expect(isValidDate(invalidDate)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isValidDate(null as unknown)).toBe(false);
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, 5);
      const expected = new Date('2024-01-20');
      expect(result.getDate()).toBe(expected.getDate());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getFullYear()).toBe(expected.getFullYear());
    });

    it('should subtract days when negative number provided', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, -5);
      // 15 - 5 = 10, but we need to account for month boundaries
      const expected = new Date('2024-01-10');
      expect(result.getDate()).toBe(expected.getDate());
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2024-01-15T10:30:00');
      const date2 = new Date('2024-01-15T15:45:00');
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-16');
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });
});