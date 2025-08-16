import { useState, useCallback } from 'react';
import { PlanError } from '../types/plan';
import * as PlanService from '../services/PlanService';

interface UsePlanLimitsReturn {
  checkAndExecute: (
    feature: 'barbers' | 'appointments',
    action: () => Promise<void> | void,
    onLimitExceeded?: (error: PlanError) => void
  ) => Promise<boolean>;
  
  checkLimits: (feature: 'barbers' | 'appointments') => Promise<boolean>;
  
  lastError: PlanError | null;
  clearError: () => void;
}

export const usePlanLimits = (): UsePlanLimitsReturn => {
  const [lastError, setLastError] = useState<PlanError | null>(null);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const checkLimits = useCallback(async (feature: 'barbers' | 'appointments'): Promise<boolean> => {
    try {
      return await PlanService.checkPlanLimits(feature);
    } catch (error) {
      console.error('Erro ao verificar limites:', error);
      return true; // Fail-safe
    }
  }, []);

  const checkAndExecute = useCallback(async (
    feature: 'barbers' | 'appointments',
    action: () => Promise<void> | void,
    onLimitExceeded?: (error: PlanError) => void
  ): Promise<boolean> => {
    try {
      clearError();
      
      // Verificar limites antes de executar
      const canExecute = await checkLimits(feature);
      
      if (!canExecute) {
        // Tentar obter informações mais detalhadas do erro
        try {
          await PlanService.getUsageStats();
        } catch (usageError) {
          if (usageError && typeof usageError === 'object' && 'code' in usageError) {
            const planError = usageError as PlanError;
            setLastError(planError);
            onLimitExceeded?.(planError);
            return false;
          }
        }
        
        // Erro genérico se não conseguir obter detalhes
        const genericError: PlanError = {
          code: feature === 'barbers' ? 'BARBER_LIMIT_EXCEEDED' : 'APPOINTMENT_LIMIT_EXCEEDED',
          message: `Limite de ${feature === 'barbers' ? 'barbeiros' : 'agendamentos'} atingido`,
          data: {
            current: 0,
            limit: 0,
            planType: 'free',
            upgradeRequired: true
          }
        };
        
        setLastError(genericError);
        onLimitExceeded?.(genericError);
        return false;
      }
      
      // Executar ação se dentro dos limites
      await action();
      return true;
      
    } catch (error) {
      // Se o erro for relacionado a limites de plano
      if (error && typeof error === 'object' && 'code' in error) {
        const planError = error as PlanError;
        
        if (planError.code === 'BARBER_LIMIT_EXCEEDED' || planError.code === 'APPOINTMENT_LIMIT_EXCEEDED') {
          setLastError(planError);
          onLimitExceeded?.(planError);
          return false;
        }
      }
      
      // Re-throw outros tipos de erro
      throw error;
    }
  }, [checkLimits, clearError]);

  return {
    checkAndExecute,
    checkLimits,
    lastError,
    clearError
  };
};