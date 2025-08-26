import React, { useState, useEffect, useCallback } from 'react';
import { Bell, MessageCircle, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { requestDebouncer } from '../../utils/requestDebouncer';
import ApiService from '../../services/ApiService';
import { safeFixed } from '../../utils/numberUtils';
import { useComments } from '../../hooks/useComments';
import { useAppointments } from '../../hooks/useAppointments';
import { useTenantCache } from '../../hooks/useTenantCache';

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed';
  barberId: string;
  barberName: string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
  viewed?: boolean;
}

interface Comment {
  id: string;
  name: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface RawAppointmentData {
  id: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed';
  barberId: string;
  barberName: string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

export const useNotifications = () => {
  const [pendingComments, setPendingComments] = useState<Comment[]>([]);
  const [newAppointments, setNewAppointments] = useState<Appointment[]>([]);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<'comments' | 'appointments'>('comments');
  const [hasError, setHasError] = useState(false);
  const [cachedAppointments, setCachedAppointments] = useState<Appointment[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshCompleted, setRefreshCompleted] = useState<boolean>(false);
  const [usingExpiredCache, setUsingExpiredCache] = useState<boolean>(false);
  const [rateLimitRetryCount, setRateLimitRetryCount] = useState<number>(0);

  const { getCurrentUser } = useAuth();
  const { isValidTenant } = useTenant();
  const { comments, loadComments } = useComments();
  const { appointments, loadAppointments: loadTenantAppointments } = useAppointments();
  const tenantCache = useTenantCache();
  const { getOrFetch } = tenantCache;

  useEffect(() => {
    try {
      const cachedData = localStorage.getItem('appointmentsCache');
      const cacheTimestamp = localStorage.getItem('appointmentsCacheTimestamp');

      if (cachedData && cacheTimestamp) {
        const parsedData = JSON.parse(cachedData);
        setCachedAppointments(parsedData);
        setLastFetchTime(parseInt(cacheTimestamp));

        const viewedAppointmentIds = JSON.parse(localStorage.getItem('viewedAppointments') || '[]');
        const newApps = parsedData.filter((app: Appointment) => !viewedAppointmentIds.includes(app.id));
        setNewAppointments(newApps);
      }
    } catch (error) {
      console.error('Erro ao carregar cache de agendamentos:', error);
    }
  }, []);

  const loadPendingComments = useCallback(async (): Promise<Comment[]> => {
    const requestKey = 'loadPendingComments';

    return requestDebouncer.execute(requestKey, async () => {
      if (!isValidTenant) {
        console.warn('Notifications: Tenant inválido, não carregando comentários');
        return [];
      }

      // Verificar cache local primeiro - cache mais longo para reduzir chamadas
      const cacheKey = 'pendingComments';
      const cachedData = tenantCache.get(cacheKey);

      if (cachedData && typeof cachedData === 'object' && 'data' in cachedData) {
        console.log('Usando comentários pendentes do cache');
        setPendingComments(cachedData.data as Comment[]);
        return cachedData.data;
      }

      try {
        // Usar hook tenant-aware para carregar comentários
        await loadComments();
        const pendingComments = comments?.filter(comment => comment.status === 'pending') || [];
        setPendingComments(pendingComments);
        setHasError(false);
        setUsingExpiredCache(false);
        setRateLimitRetryCount(0);

        // Cache por 10 minutos para reduzir chamadas
        tenantCache.set(cacheKey, { data: comments }, { ttl: 600 });
        return comments;
      } catch (error) {
        console.error('Erro ao buscar comentários pendentes:', error);
        setHasError(true);
        
        // Tentar usar cache expirado como último recurso
        const fallbackData = tenantCache.get(cacheKey);
        if (fallbackData && typeof fallbackData === 'object' && 'data' in fallbackData) {
          console.log('Usando cache expirado como último recurso');
          setPendingComments(fallbackData.data as Comment[]);
          setUsingExpiredCache(true);
          return fallbackData.data;
        }
        
        return [];
      } finally {
// Removed setIsLoading call since it's not defined in state

        if (isRefreshing && !refreshCompleted) {
          setTimeout(() => {
            setIsRefreshing(false);
            setRefreshCompleted(true);
          }, 800);
        }
      }
    });
  }, [isRefreshing, refreshCompleted]);

  const loadAppointments = useCallback(async (forceRefresh = false) => {
    const requestKey = `loadAppointments_${forceRefresh}`;

    return requestDebouncer.execute(requestKey, async () => {
      if (!isValidTenant) {
        console.warn('Notifications: Tenant inválido, não carregando agendamentos');
        return [];
      }

      try {
        if (forceRefresh) {
          setIsRefreshing(true);
          setRefreshCompleted(false);
        }
        const currentUser = getCurrentUser();

        // Registrar o momento da tentativa de busca
        const fetchStartTime = Date.now();

        return await getOrFetch('appointments', async () => {
          // Usar hook tenant-aware para carregar agendamentos
          await loadTenantAppointments();
          const appointmentsData = appointments || [];

          const viewedAppointmentIds = JSON.parse(localStorage.getItem('viewedAppointments') || '[]');
          let formattedAppointments = appointmentsData.map((app) => ({
            ...app,
            service: app.serviceName,
            viewed: viewedAppointmentIds.includes(app.id)
          }));

          // Filtrar por role: admin vê todos, barbeiros só veem os seus
          if ((currentUser as { role?: string })?.role !== 'admin') {
            formattedAppointments = formattedAppointments.filter(
              (app: Appointment) => app.barberId === (currentUser as { id: string })?.id
            );
          }

          // Filtrar apenas agendamentos dos últimos 3 dias até hoje
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          threeDaysAgo.setHours(0, 0, 0, 0);
          
          const today = new Date();
          today.setHours(23, 59, 59, 999);

          formattedAppointments = formattedAppointments.filter((app: Appointment) => {
            const appDate = new Date(app.date);
            return appDate >= threeDaysAgo && appDate <= today;
          });

          formattedAppointments.sort((a: Appointment, b: Appointment) => {
            return new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime();
          });

          const newApps = formattedAppointments.filter((app: Appointment) => !app.viewed);
          setNewAppointments(newApps);

          // Atualizar o cache e o timestamp
          setCachedAppointments(formattedAppointments);
          setLastFetchTime(fetchStartTime);
          setHasError(false);

          // Show completion state for refresh button
          if (forceRefresh) {
            setTimeout(() => {
              setIsRefreshing(false);
              setRefreshCompleted(true);
            }, 800);
          }

          return formattedAppointments;
        }, { ttl: forceRefresh ? 0 : 600 }); // Set TTL to 0 to force refresh or 10 minutes (600s) for normal cache
      } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        setHasError(true);

        // Se temos dados em cache, usamos como fallback
        if (cachedAppointments.length > 0) {
          console.log(`Usando ${cachedAppointments.length} agendamentos em cache devido a erro na requisição`);
          return cachedAppointments;
        }

        return [];
      } finally {
// Removed setIsLoading call since it's not defined in state
      }
    });
  }, [getCurrentUser, isValidTenant, loadTenantAppointments, appointments]);

  const handleCommentAction = async (commentId: string, action: 'approve' | 'reject') => {
    if (!commentId) return;

    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      
      // Usar o ApiService para requisições PATCH com retry e cache
      await ApiService.patch(`/api/comments/${commentId}`, { status: newStatus });
      
      // Se chegou aqui, a requisição foi bem-sucedida
      setPendingComments(prev => prev.filter(comment => comment.id !== commentId));
      setIsNotificationDropdownOpen(pendingComments.length > 1);
    } catch (error) {
      console.error(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} comentário:`, error);
    }
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'view') => {
    if (!appointmentId) return;
    try {
      if (action === 'view') {
        const viewedAppointmentIds = JSON.parse(localStorage.getItem('viewedAppointments') || '[]');
        if (!viewedAppointmentIds.includes(appointmentId)) {
          viewedAppointmentIds.push(appointmentId);
          localStorage.setItem('viewedAppointments', JSON.stringify(viewedAppointmentIds));

          setNewAppointments(prev => prev.filter(app => app.id !== appointmentId));
        }

        setIsNotificationDropdownOpen(false);

        const event = new CustomEvent('openAppointmentModal', { detail: { appointmentId } });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error(`Erro na ação ${action}:`, error);
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    let interval: NodeJS.Timeout | null = null;
    let lastFetchAttempt = 0;

    const fetchData = async () => {
      if (!isSubscribed) return;

      // Prevenir chamadas muito frequentes (debounce de 30 segundos)
      const now = Date.now();
      if (now - lastFetchAttempt < 30000) {
        console.log('Requisição de notificações ignorada - muito frequente');
        return;
      }
      lastFetchAttempt = now;

      try {
        // Verificar se o usuário está online antes de fazer requisições
        if (!navigator.onLine) {
          console.log('Dispositivo offline, adiando requisições de notificações');
          return;
        }

        // Verificar se o usuário está carregado antes de fazer requisições
        const currentUser = getCurrentUser();
        if (!currentUser) {
          console.log('Usuário não carregado, adiando requisições de notificações');
          return;
        }

        // Verificar se há requisições pendentes
        if (requestDebouncer.isPending('loadPendingComments') || requestDebouncer.isPending('loadAppointments_false')) {
          console.log('Requisições já em andamento - pulando fetch');
          return;
        }

        // Verificar se já temos dados recentes em cache antes de fazer novas requisições
        const cacheAge = Date.now() - lastFetchTime;
        const shouldSkipFetch = cacheAge < 300000; // Skip se cache tem menos de 5 minutos

        if (shouldSkipFetch) {
          console.log('Cache recente encontrado, pulando requisições desnecessárias');
          return;
        }

        // Fazer requisições de forma sequencial para evitar sobrecarga da API
        try {
          await loadPendingComments();
          // Delay maior entre requisições para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          await loadAppointments(false); // Não forçar refresh sempre
        } catch (error) {
          console.error('Erro ao buscar dados de notificações:', error);
          setHasError(true);
        }
      } catch (error) {
        console.error('Erro geral ao buscar dados de notificações:', error);
        setHasError(true);
      }
    };

    // Executar a primeira busca com atraso maior para evitar conflito com inicialização
    const initialFetchTimeout = setTimeout(fetchData, 10000);

    // Aumentar o intervalo para 60 minutos para reduzir drasticamente a frequência
    interval = setInterval(fetchData, 60 * 60 * 1000);

    return () => {
      isSubscribed = false;
      clearTimeout(initialFetchTimeout);
      if (interval) clearInterval(interval);
    };
  }, [getCurrentUser, loadPendingComments, loadAppointments, lastFetchTime, setHasError]);

  const toggleNotificationDropdown = () => {
    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
    // Reset refresh state when modal is reopened
    if (!isNotificationDropdownOpen) {
      setRefreshCompleted(false);
      setIsRefreshing(false);
    }
  };

  // Função para verificar se o cache está desatualizado (mais de 30 minutos)
  const isCacheStale = useCallback(() => {
    if (lastFetchTime === 0) return false;
    const thirtyMinutesMs = 30 * 60 * 1000;
    return Date.now() - lastFetchTime > thirtyMinutesMs;
  }, [lastFetchTime]);

  // Função para formatar o tempo desde a última atualização
  const getLastUpdateText = useCallback(() => {
    if (lastFetchTime === 0) return 'Nunca atualizado';

    const minutesAgo = Math.floor((Date.now() - lastFetchTime) / 60000);

    if (minutesAgo < 1) return 'Atualizado agora';
    if (minutesAgo === 1) return 'Atualizado há 1 minuto';
    if (minutesAgo < 60) return `Atualizado há ${minutesAgo} minutos`;

    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo === 1) return 'Atualizado há 1 hora';
    return `Atualizado há ${hoursAgo} horas`;
  }, [lastFetchTime]);

  return {
    pendingComments,
    newAppointments,
    isNotificationDropdownOpen,
    notificationTab,
    setNotificationTab,
    handleCommentAction,
    handleAppointmentAction,
    toggleNotificationDropdown,
    loadAppointments,
    hasError,
    cachedAppointments,
    lastFetchTime,
    isCacheStale,
    getLastUpdateText,
    isRefreshing,
    refreshCompleted,
    usingExpiredCache,
    rateLimitRetryCount
  };
};

const Notifications = React.memo(() => {
  const {
    pendingComments,
    newAppointments,
    isNotificationDropdownOpen,
    notificationTab,
    setNotificationTab,
    toggleNotificationDropdown,
    handleCommentAction,
    handleAppointmentAction,
    hasError,
    isCacheStale,
    getLastUpdateText,
    loadAppointments,
    isRefreshing,
    refreshCompleted,
    usingExpiredCache,
    rateLimitRetryCount
  } = useNotifications();

  const totalNotifications = pendingComments.length + newAppointments.length;

  return (
    <div className="relative">
      <button
        onClick={toggleNotificationDropdown}
        className="relative p-1.5 rounded-full bg-[#1A1F2E] hover:bg-[#252B3B] transition-colors duration-300 flex items-center justify-center"
        aria-label="Notificações"
      >
        <Bell className="w-4 h-4 text-white" />
        {totalNotifications > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500"></span>
        )}
      </button>

      {isNotificationDropdownOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={toggleNotificationDropdown}
          />
          <div className="fixed sm:absolute top-[20%] sm:top-full left-[50%] sm:left-auto right-auto sm:right-0 transform-gpu -translate-x-1/2 sm:translate-x-0 -translate-y-0 sm:-translate-y-0 mt-0 sm:mt-4 w-[90vw] sm:w-[450px] md:w-[500px] max-h-[70vh] xs:max-h-[75vh] sm:max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl bg-[#1A1F2E] ring-1 ring-[#F0B35B]/20 z-50 animate-fade-in-up">
            <div className="sticky top-0 flex flex-col p-3 sm:p-4 border-b border-gray-700/30 bg-[#1A1F2E] z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-semibold text-white">Notificações</h3>
                <button
                  onClick={toggleNotificationDropdown}
                  className="text-gray-400 hover:text-white transition-colors p-1.5 sm:p-2 hover:bg-gray-700/30 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* Status do cache e botão de atualização */}
              <div className="flex justify-between items-center mt-2 text-xs">
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-1.5 ${hasError ? 'bg-red-500' : isCacheStale() ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                  <span className="text-gray-400">{getLastUpdateText()}</span>
                </div>
                <button
                  onClick={() => !refreshCompleted && !isRefreshing && loadAppointments(true)}
                  disabled={refreshCompleted || isRefreshing}
                  className={`text-xs px-2 py-1 rounded-md transition-all duration-300 flex items-center gap-1 ${refreshCompleted
                      ? 'text-green-400 bg-green-500/20 cursor-not-allowed'
                      : isRefreshing
                        ? 'text-[#F0B35B] bg-[#F0B35B]/20 cursor-not-allowed'
                        : 'text-[#F0B35B] hover:text-[#F0B35B]/80 bg-[#F0B35B]/10 hover:bg-[#F0B35B]/20'
                    }`}
                >
                  {isRefreshing && (
                    <div className="w-3 h-3 border border-[#F0B35B] border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {refreshCompleted ? 'Atualizado' : isRefreshing ? 'Atualizando...' : 'Atualizar'}
                </button>
              </div>
            </div>

            <div className="flex border-b border-gray-700/30 sticky top-[60px] sm:top-[65px] bg-[#1A1F2E] z-10">
              <button
                onClick={() => setNotificationTab('comments')}
                className={`flex-1 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${notificationTab === 'comments' ? 'text-[#F0B35B] border-b-2 border-[#F0B35B]' : 'text-gray-400 hover:text-white'}`}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Comentários</span>
                  {pendingComments.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  )}
                </div>
              </button>
              <button
                onClick={() => setNotificationTab('appointments')}
                className={`flex-1 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${notificationTab === 'appointments' ? 'text-[#F0B35B] border-b-2 border-[#F0B35B]' : 'text-gray-400 hover:text-white'}`}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Agendamentos</span>
                  {newAppointments.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  )}
                </div>
              </button>
            </div>

            {/* Alerta de erro, cache desatualizado ou rate limiting */}
            {(hasError || isCacheStale() || usingExpiredCache) && (
              <div className={`mx-3 sm:mx-4 my-2 p-2 sm:p-3 rounded-lg text-xs sm:text-sm ${
                usingExpiredCache ? 'bg-orange-500/20 text-orange-300' :
                hasError ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
              }`}>
                {usingExpiredCache ? (
                  <div className="flex items-center gap-2">
                    <span>⚠️</span>
                    <div>
                      <div>Usando dados em cache devido ao limite de requisições</div>
                      {rateLimitRetryCount > 0 && (
                        <div className="text-xs opacity-75 mt-1">
                          Tentativa {rateLimitRetryCount + 1}/3 - Aguardando para tentar novamente
                        </div>
                      )}
                    </div>
                  </div>
                ) : hasError ? (
                  <p>Ocorreu um erro ao buscar os dados mais recentes. Estamos exibindo dados em cache.</p>
                ) : (
                  <p>Os dados podem estar desatualizados. Clique em "Atualizar" para obter as informações mais recentes.</p>
                )}
              </div>
            )}

            <div className="divide-y divide-gray-700/30" role="menu">
              {notificationTab === 'comments' ? (
                pendingComments.length > 0 ? (
                  pendingComments.map((comment) => (
                    <div key={comment.id} className="p-3 sm:p-4 hover:bg-[#252B3B] transition-colors">
                      <div className="flex justify-between items-start mb-1 sm:mb-2">
                        <p className="text-xs sm:text-sm md:text-base text-white font-medium">{comment.name}</p>
                        <span className="text-[10px] sm:text-xs text-gray-400">
                          {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-300 mt-1 sm:mt-2 p-2 sm:p-3 bg-[#0D121E]/50 rounded-lg">{comment.comment}</p>
                      <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-3 justify-end">
                        <button
                          onClick={() => handleCommentAction(comment.id, 'approve')}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs sm:text-sm font-medium transition-colors"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleCommentAction(comment.id, 'reject')}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs sm:text-sm font-medium transition-colors"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-400">
                    Nenhum comentário pendente
                  </div>
                )
              ) : (
                newAppointments.length > 0 ? (
                  newAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-3 sm:p-4 hover:bg-[#252B3B] cursor-pointer transition-colors"
                      onClick={() => handleAppointmentAction(appointment.id, 'view')}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs sm:text-sm md:text-base text-white font-medium">{appointment.clientName}</p>
                          <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">{appointment.service}</p>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5"></div>
                      </div>
                      <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-[#0D121E]/50 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                          <p className="text-xs sm:text-sm font-bold text-green-400">R$ {safeFixed(appointment.price, 2)}</p>
                          <p className="text-xs sm:text-sm text-[#F0B35B]">
                            {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}
                          </p>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2">Barbeiro: {appointment.barberName}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-400">
                    Nenhum agendamento novo
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

Notifications.displayName = 'Notifications';

export default Notifications;