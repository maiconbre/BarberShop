import React, { createContext, useContext, ReactNode } from 'react';
import { usePlan } from '../hooks/usePlan';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { PlanUsage, PlanInfo, PlanHistoryResponse, UpgradeRequest, UpgradeResponse, PlanError } from '../types/plan';

interface PlanContextValue {
  // Estado do plano
  usage: PlanUsage | null;
  planInfo: PlanInfo | null;
  history: PlanHistoryResponse | null;
  loading: boolean;
  error: string | null;
  
  // Ações do plano
  refreshUsage: () => Promise<void>;
  refreshPlanInfo: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  upgradePlan: (request: UpgradeRequest) => Promise<UpgradeResponse>;
  
  // Verificação de limites
  checkLimits: (feature: 'barbers' | 'appointments') => Promise<boolean>;
  checkAndExecute: (
    feature: 'barbers' | 'appointments',
    action: () => Promise<void> | void,
    onLimitExceeded?: (error: PlanError) => void
  ) => Promise<boolean>;
  
  // Estado dos limites
  lastLimitError: PlanError | null;
  clearLimitError: () => void;
  
  // Utilitários
  canCreateBarber: boolean;
  canCreateAppointment: boolean;
  shouldShowUpgradeNotification: boolean;
  isNearLimit: boolean;
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

interface PlanProviderProps {
  children: ReactNode;
}

export const PlanProvider: React.FC<PlanProviderProps> = ({ children }) => {
  const planHook = usePlan();
  const limitsHook = usePlanLimits();

  const contextValue: PlanContextValue = {
    // Estado do plano
    usage: planHook.usage,
    planInfo: planHook.planInfo,
    history: planHook.history,
    loading: planHook.loading,
    error: planHook.error,
    
    // Ações do plano
    refreshUsage: planHook.refreshUsage,
    refreshPlanInfo: planHook.refreshPlanInfo,
    refreshHistory: planHook.refreshHistory,
    upgradePlan: planHook.upgradePlan,
    
    // Verificação de limites
    checkLimits: limitsHook.checkLimits,
    checkAndExecute: limitsHook.checkAndExecute,
    
    // Estado dos limites
    lastLimitError: limitsHook.lastError,
    clearLimitError: limitsHook.clearError,
    
    // Utilitários
    canCreateBarber: planHook.canCreateBarber,
    canCreateAppointment: planHook.canCreateAppointment,
    shouldShowUpgradeNotification: planHook.shouldShowUpgradeNotification,
    isNearLimit: planHook.isNearLimit
  };

  return (
    <PlanContext.Provider value={contextValue}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlanContext = (): PlanContextValue => {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlanContext must be used within a PlanProvider');
  }
  return context;
};