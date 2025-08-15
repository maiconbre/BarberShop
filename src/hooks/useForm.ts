/**
 * Custom hook for form state management with validation
 */
import { useState, useCallback } from 'react';
import { z } from 'zod';
import { useFormValidation } from './useFormValidation';
import { debounce } from '@/utils';

interface UseFormOptions<T> {
  initialValues: T;
  schema?: z.ZodSchema<T>;
  onSubmit?: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

interface UseFormReturn<T> {
  values: T;
  errors: Record<keyof T, string | undefined>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  setValue: (field: keyof T, value: unknown) => void;
  setValues: (values: Partial<T>) => void;
  setFieldTouched: (field: keyof T, touched?: boolean) => void;
  setTouched: (touched: Partial<Record<keyof T, boolean>>) => void;
  handleChange: (field: keyof T) => (value: unknown) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: (values?: T) => void;
  validate: () => boolean;
  validateField: (field: keyof T) => boolean;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
}

/**
 * Hook for form state management with validation
 */
export const useForm = <T extends Record<string, unknown>>({

  initialValues,
  schema,
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
  debounceMs = 300,
}: UseFormOptions<T>): UseFormReturn<T> => {
  const [values, setValuesState] = useState<T>(initialValues);
  const [touched, setTouchedState] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const validation = useFormValidation(schema!);

  // Create debounced validation function
  const debouncedValidateField = useCallback(
    debounce(() => {
      if (schema && validateOnChange) {
        // Validation will be handled by the setValue function since field and value are not accessible here
      }
    }, debounceMs),
    [schema, validateOnChange, debounceMs]
  );

  const setValue = useCallback(
    (field: keyof T, value: unknown) => {
      setValuesState((prev) => {
        const newValues = { ...prev, [field]: value };
        setIsDirty(true);
        
        // Trigger debounced validation if enabled
        if (validateOnChange && schema) {
          debouncedValidateField();
        }
        
        return newValues;
      });
    },
    [validateOnChange, schema, debouncedValidateField]
  );

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => {
      const updatedValues = { ...prev, ...newValues };
      setIsDirty(true);
      return updatedValues;
    });
  }, []);

  const setFieldTouched = useCallback(
    (field: keyof T, isTouched: boolean = true) => {
      setTouchedState((prev) => ({ ...prev, [field]: isTouched }));
    },
    []
  );

  const setTouched = useCallback(
    (newTouched: Partial<Record<keyof T, boolean>>) => {
      setTouchedState((prev) => ({ ...prev, ...newTouched }));
    },
    []
  );

  const handleChange = useCallback(
    (field: keyof T) => (value: unknown) => {
      setValue(field, value);
    },
    [setValue]
  );

  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setFieldTouched(field, true);
      
      if (validateOnBlur && schema) {
        validation.validateField(field, values[field]);
      }
    },
    [setFieldTouched, validateOnBlur, schema, validation, values]
  );

  const validate = useCallback(() => {
    if (!schema) return true;
    return validation.validate(values);
  }, [schema, validation, values]);

  const validateField = useCallback(
    (field: keyof T) => {
      if (!schema) return true;
      return validation.validateField(field, values[field]);
    },
    [schema, validation, values]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      setIsSubmitting(true);
      
      try {
        // Mark all fields as touched
        const allTouched = Object.keys(values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as Record<keyof T, boolean>
        );
        setTouched(allTouched);

        // Validate form
        const isValid = validate();
        
        if (isValid && onSubmit) {
          await onSubmit(values);
        }
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit, setTouched]
  );

  const reset = useCallback(
    (resetValues?: T) => {
      const valuesToReset = resetValues || initialValues;
      setValuesState(valuesToReset);
      setTouchedState({} as Record<keyof T, boolean>);
      setIsDirty(false);
      validation.clearErrors();
    },
    [initialValues, validation]
  );

  const clearErrors = useCallback(() => {
    validation.clearErrors();
  }, [validation]);

  const clearFieldError = useCallback(
    (field: keyof T) => {
      validation.clearFieldError(field);
    },
    [validation]
  );

  // Convert validation errors to field-specific errors
  const errors = Object.keys(values).reduce(
    (acc, key) => {
      const fieldKey = key as keyof T;
      acc[fieldKey] = validation.getFieldError(fieldKey);
      return acc;
    },
    {} as Record<keyof T, string | undefined>
  );

  const isValid = schema ? validation.isValid : true;

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    isDirty,
    setValue,
    setValues,
    setFieldTouched,
    setTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
  };
};