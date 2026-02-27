import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  PlanUsage, 
  PlanInfo, 
  UpgradeRequest, 
  UpgradeResponse, 
  PlanHistoryResponse,
  PlanType
} from '../types/plan';
import * as PlanService from '../services/PlanService';
import { useTenant } from '../contexts/TenantContext';

interface UsePlanReturn {
  // Estado
  usage: PlanUsage | null;
  planInfo: PlanInfo | null;
  history: PlanHistoryResponse | null;
  loading: boolean;
  error: string | null;
  
  // Ações
  refreshUsage: () => Promise<void>;
  refreshPlanInfo: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  upgradePlan: (request: UpgradeRequest) => Promise<UpgradeResponse>;
  checkLimits: (feature: 'barbers' | 'appointments') => Promise<boolean>;
  
  // Utilitários
  canCreateBarber: boolean;
  canCreateAppointment: boolean;
  shouldShowUpgradeNotification: boolean;
  isNearLimit: boolean;
}

export const usePlan = (): UsePlanReturn => {
  const [usage, setUsage] = useState<PlanUsage | null>(null);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [history, setHistory] = useState<PlanHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get tenant context
  const { barbershopId, slug: contextSlug } = useTenant();
  
  // Get barbershop slug from URL params or context
  const { barbershopSlug: urlSlug } = useParams<{ barbershopSlug: string }>();
  const activeSlug = urlSlug || contextSlug || '';

  // Carregar estatísticas de uso
  const refreshUsage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PlanService.getUsageStats(activeSlug || barbershopId || undefined);
      setUsage(data as any);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar estatísticas de uso';
      setError(errorMessage);
      console.error('Erro ao carregar usage:', err);
    } finally {
      setLoading(false);
    }
  }, [activeSlug, barbershopId]);

  // Carregar informações do plano
  const refreshPlanInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PlanService.getCurrentPlan(activeSlug || barbershopId || undefined);
      setPlanInfo(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar informações do plano';
      setError(errorMessage);
      console.error('Erro ao carregar plan info:', err);
    } finally {
      setLoading(false);
    }
  }, [activeSlug, barbershopId]);

  // Carregar histórico
  const refreshHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PlanService.getPlanHistory(activeSlug || barbershopId || undefined);
      setHistory(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar histórico';
      setError(errorMessage);
      console.error('Erro ao carregar history:', err);
    } finally {
      setLoading(false);
    }
  }, [activeSlug, barbershopId]);

  // Fazer upgrade do plano
  const upgradePlan = useCallback(async (request: UpgradeRequest): Promise<UpgradeResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      // Inject barbershopId if missing
      const enrichedRequest = {
        ...request,
        barbershopId: request.barbershopId || barbershopId || undefined
      };
      
      const response = await PlanService.upgradePlan(enrichedRequest);
      
      // Atualizar dados após upgrade
      await refreshPlanInfo();
      await refreshUsage();
      await refreshHistory();
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upgrade';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshUsage, refreshPlanInfo, refreshHistory, barbershopId]);

  // Verificar limites
  const checkLimits = useCallback(async (feature: 'barbers' | 'appointments'): Promise<boolean> => {
    try {
      return await PlanService.checkPlanLimits(feature);
    } catch (err) {
      console.error('Erro ao verificar limites:', err);
      return true; // Fail-safe: permitir operação em caso de erro
    }
  }, []);

  // Carregar dados iniciais quando slug ou ID muda
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        refreshUsage(),
        refreshPlanInfo()
      ]);
    };

    loadInitialData();
  }, [refreshUsage, refreshPlanInfo]);

  // Valores computados
  const canCreateBarber = (usage?.usage?.barbers?.remaining ?? 1) > 0;
  const canCreateAppointment = (usage?.usage?.appointments?.remaining ?? 1) > 0;
  const shouldShowUpgradeNotification = usage ? PlanService.shouldShowUpgradeNotification(usage) : false;
  const isNearLimit = usage ? (
    usage?.usage?.barbers?.nearLimit || usage?.usage?.appointments?.nearLimit
  ) : false;

  return {
    // Estado
    usage,
    planInfo,
    history,
    loading,
    error,
    
    // Ações
    refreshUsage,
    refreshPlanInfo,
    refreshHistory,
    upgradePlan,
    checkLimits,
    
    // Utilitários
    canCreateBarber,
    canCreateAppointment,
    shouldShowUpgradeNotification,
    isNearLimit
  };
};