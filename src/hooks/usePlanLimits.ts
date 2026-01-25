import { useCallback } from 'react';
import { usePlan } from './usePlan';
import { PlanType } from '../types/plan';

export const usePlanLimits = () => {
  const { usage, loading, planInfo, upgradePlan } = usePlan();

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

  return {
    planType,
    loading,
    limits,
    metrics,
    canAddBarber,
    canAddAppointment,
    getBarberLimitMessage,
    getAppointmentLimitMessage,
    upgradePlan
  };
};