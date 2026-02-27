import { useCallback, useState } from 'react';
import { usePlan } from './usePlan';
import { PlanType, PlanError } from '../types/plan';
import * as PlanService from '../services/PlanService';

export const usePlanLimits = () => {
  const { usage, loading, planInfo, upgradePlan, refreshUsage } = usePlan();
  const [lastError, setLastError] = useState<PlanError | null>(null);

  const clearError = useCallback(() => setLastError(null), []);

  const planType = (planInfo?.planType || 'free') as PlanType;

  // Limites específicos para UI
  const limits = usage?.limits;
  const metrics = usage?.usage;

  // Verificações booleanas
  const canAddBarber = (metrics?.barbers?.remaining ?? 0) > 0;
  const canAddAppointment = (metrics?.appointments?.remaining ?? 0) > 0;
  
  // Mensagens de erro/aviso
  const getBarberLimitMessage = useCallback(() => {
    if (canAddBarber) return null;
    
    if (planType === 'free') {
      return "O plano Grátis permite apenas 1 barbeiro. Faça upgrade para adicionar sua equipe.";
    }
    if (planType === 'start') {
      return "O plano Start inclui 1 barbeiro. Mude para o Premium para ter até 6 profissionais.";
    }
    return `Limite de ${limits?.barbers || 0} barbeiros atingido.`;
  }, [canAddBarber, planType, limits]);

  const getAppointmentLimitMessage = useCallback(() => {
    if (canAddAppointment) return null;
    const limit = limits?.appointments_per_month || 0;
    
    return `Você atingiu o limite de ${limit} agendamentos mensais. Faça upgrade para continuar recebendo reservas.`;
  }, [canAddAppointment, limits]);

  // Implementação de checkLimits
  const checkLimits = useCallback(async (feature: 'barbers' | 'appointments'): Promise<boolean> => {
    const isAllowed = await PlanService.checkPlanLimits(feature);
    if (!isAllowed) {
      const error: PlanError = {
        code: 'LIMIT_EXCEEDED',
        message: feature === 'barbers' ? getBarberLimitMessage() || '' : getAppointmentLimitMessage() || '',
        data: {
          current: metrics?.[feature]?.current || 0,
          limit: metrics?.[feature]?.limit || 0,
          planType: planType,
          upgradeRequired: true
        }
      };
      setLastError(error);
    }
    return isAllowed;
  }, [getBarberLimitMessage, getAppointmentLimitMessage, metrics, planType]);

  // Implementação de checkAndExecute
  const checkAndExecute = useCallback(async (
    feature: 'barbers' | 'appointments',
    action: () => Promise<any> | any,
    onLimitExceeded?: (error: PlanError) => void
  ): Promise<boolean> => {
    const isAllowed = await checkLimits(feature);
    
    if (isAllowed) {
      try {
        await action();
        await refreshUsage(); // Refresh usage after successful action
        return true;
      } catch (err) {
        console.error('Erro na ação após checkLimits:', err);
        throw err;
      }
    } else {
      if (onLimitExceeded && lastError) {
        onLimitExceeded(lastError);
      }
      return false;
    }
  }, [checkLimits, lastError, refreshUsage]);

  return {
    planType,
    loading,
    limits,
    metrics,
    canAddBarber,
    canAddAppointment,
    getBarberLimitMessage,
    getAppointmentLimitMessage,
    upgradePlan,
    checkLimits,
    checkAndExecute,
    lastError,
    clearError
  };
};