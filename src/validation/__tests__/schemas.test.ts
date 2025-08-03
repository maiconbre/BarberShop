import { describe, it, expect } from 'vitest';
import {
  LoginCredentialsSchema,
  RegisterDataSchema,
  BookingFormDataSchema,
  ServiceFormDataSchema,
  UserSchema,
  AppointmentSchema
} from '../schemas';

describe('Validation Schemas', () => {
  describe('LoginCredentialsSchema', () => {
    it('should validate correct login credentials', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const result = LoginCredentialsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      };
      
      const result = LoginCredentialsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123'
      };
      
      const result = LoginCredentialsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('RegisterDataSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
        phone: '(11) 99999-9999'
      };
      
      const result = RegisterDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
      const invalidData = {
        name: 'J', // Too short (minimum 2 characters)
        email: 'joao@example.com',
        password: 'password123',
        phone: '(11) 99999-9999'
      };
      
      const result = RegisterDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('BookingFormDataSchema', () => {
    it('should validate correct booking data', () => {
      const validData = {
        serviceId: '123e4567-e89b-12d3-a456-426614174000',
        barberId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-12-25',
        time: '14:30'
      };
      
      const result = BookingFormDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid time format', () => {
      const invalidData = {
        serviceId: '123e4567-e89b-12d3-a456-426614174000',
        barberId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-12-25',
        time: '25:70' // Invalid time
      };
      
      const result = BookingFormDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('ServiceFormDataSchema', () => {
    it('should validate correct service data', () => {
      const validData = {
        name: 'Corte Masculino',
        description: 'Corte moderno e estiloso',
        price: 25.00,
        duration: 30,
        isActive: true
      };
      
      const result = ServiceFormDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative price', () => {
      const invalidData = {
        name: 'Corte Masculino',
        description: 'Corte moderno e estiloso',
        price: -10.00,
        duration: 30,
        isActive: true
      };
      
      const result = ServiceFormDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid duration', () => {
      const invalidData = {
        name: 'Corte Masculino',
        description: 'Corte moderno e estiloso',
        price: 25.00,
        duration: 5, // Too short
        isActive: true
      };
      
      const result = ServiceFormDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});