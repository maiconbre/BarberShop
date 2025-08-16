import React, { useState } from 'react';
import { usePlanContext } from '../../contexts/PlanContext';
import { PlanLimitNotification } from './PlanLimitNotification';
import { PlanError } from '../../types/plan';

interface PlanLimitGuardProps {
  feature: 'barbers' | 'appointments';
  action: () => Promise<void> | void;
  children: (props: { 
    canExecute: boolean; 
    execute: () => Promise<void>; 
    loading: boolean;
  }) => React.ReactNode;
  onUpgrade?: () => void;
  fallbackMessage?: string;
}

export const PlanLimitGuard: React.FC<PlanLimitGuardProps> = ({
  feature,
  action,
  children,
  onUpgrade,
  fallbackMessage
}) => {
  const { checkAndExecute, usage } = usePlanContext();
  const [loading, setLoading] = useState(false);
  const [limitError, setLimitError] = useState<PlanError | null>(null);

  // Determinar se pode executar baseado no usage atual
  const canExecute = usage ? (
    feature === 'barbers' 
      ? usage.usage.barbers.remaining > 0
      : usage.usage.appointments.remaining > 0
  ) : true;

  const execute = async () => {
    setLoading(true);
    setLimitError(null);

    try {
      const success = await checkAndExecute(
        feature,
        action,
        (error) => {
          setLimitError(error);
        }
      );

      if (!success && !limitError) {
        // Se não teve sucesso mas não há erro específico, criar um genérico
        const genericError: PlanError = {
          code: feature === 'barbers' ? 'BARBER_LIMIT_EXCEEDED' : 'APPOINTMENT_LIMIT_EXCEEDED',
          message: fallbackMessage || `Limite de ${feature === 'barbers' ? 'barbeiros' : 'agendamentos'} atingido`,
          data: {
            current: usage?.usage[feature].current || 0,
            limit: usage?.usage[feature].limit || 0,
            planType: usage?.planType || 'free',
            upgradeRequired: true
          }
        };
        setLimitError(genericError);
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      // Re-throw para que o componente pai possa tratar
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {children({ canExecute, execute, loading })}
      
      {limitError && (
        <div className="mt-4">
          <PlanLimitNotification
            error={limitError}
            onUpgrade={onUpgrade}
            onClose={() => setLimitError(null)}
          />
        </div>
      )}
    </div>
  );
};