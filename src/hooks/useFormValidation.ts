/**
 * Custom hook for form validation using Zod schemas
 */
import { useState, useCallback } from 'react';
import { z } from 'zod';

interface ValidationError {
  field: string;
  message: string;
}

interface UseFormValidationReturn<T> {
  errors: ValidationError[];
  isValid: boolean;
  validate: (data: T) => boolean;
  validateField: (field: keyof T, value: any) => boolean;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
  getFieldError: (field: keyof T) => string | undefined;
}

/**
 * Hook for form validation using Zod schemas
 */
export const useFormValidation = <T extends Record<string, any>>(
  schema: z.ZodSchema<T>
): UseFormValidationReturn<T> => {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const validate = useCallback(
    (data: T): boolean => {
      try {
        schema.parse(data);
        setErrors([]);
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const validationErrors: ValidationError[] = error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          }));
          setErrors(validationErrors);
        }
        return false;
      }
    },
    [schema]
  );

  const validateField = useCallback(
    (field: keyof T, value: any): boolean => {
      try {
        // Create a partial schema for the specific field
        const fieldSchema = (schema as any)._def.shape?.[field as string];
        if (fieldSchema) {
          fieldSchema.parse(value);
          // Remove any existing errors for this field
          setErrors((prev) => prev.filter((error) => error.field !== field));
          return true;
        }
        return false;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError: ValidationError = {
            field: field as string,
            message: error.issues[0]?.message || 'Valor inválido',
          };
          
          setErrors((prev) => {
            const filtered = prev.filter((error) => error.field !== field);
            return [...filtered, fieldError];
          });
        }
        return false;
      }
    },
    [schema]
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => prev.filter((error) => error.field !== field));
  }, []);

  const getFieldError = useCallback(
    (field: keyof T): string | undefined => {
      return errors.find((error) => error.field === field)?.message;
    },
    [errors]
  );

  const isValid = errors.length === 0;

  return {
    errors,
    isValid,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    getFieldError,
  };
};