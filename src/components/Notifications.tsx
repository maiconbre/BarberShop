import React, { useState, useEffect, useCallback } from 'react';
import { Bell, MessageCircle, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CacheService from '../services/CacheService';

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

export const useNotifications = () => {
  const [pendingComments, setPendingComments] = useState<Comment[]>([]);
  const [newAppointments, setNewAppointments] = useState<Appointment[]>([]);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<'comments' | 'appointments'>('comments');
  const [hasError, setHasError] = useState(false);
  const [cachedAppointments, setCachedAppointments] = useState<Appointment[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { getCurrentUser } = useAuth();
  
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

  const loadPendingComments = useCallback(async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(
        `${(import.meta as any).env.VITE_API_URL}/api/comments?status=pending`,
        {
          method: 'GET',
          headers,
          mode: 'cors'
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPendingComments(result.data || []);
          setHasError(false);
        }
      } else {
        console.error(`Erro ao buscar comentários: ${response.status}`);
        setHasError(true);
      }
    } catch (error) {
      console.error('Erro ao buscar comentários pendentes:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAppointments = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      const currentUser = getCurrentUser();
      
      return await CacheService.fetchWithCache('appointments', async () => {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        };

        const response = await fetch(
          `${(import.meta as any).env.VITE_API_URL}/api/appointments`,
          { method: 'GET', headers, mode: 'cors' }
        );

        if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
        
        const result = await response.json();
        if (!result?.success) throw new Error('Dados inválidos');

        const viewedAppointmentIds = JSON.parse(localStorage.getItem('viewedAppointments') || '[]');
        let formattedAppointments = result.data.map((app: any) => ({
          ...app,
          service: app.serviceName,
          viewed: viewedAppointmentIds.includes(app.id)
        }));

        if (currentUser?.role !== 'admin') {
          formattedAppointments = formattedAppointments.filter(
            (app: Appointment) => app.barberId === currentUser?.id
          );
        }

        formattedAppointments.sort((a: Appointment, b: Appointment) => {
          return new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime();
        });

        const newApps = formattedAppointments.filter((app: Appointment) => !app.viewed);
        setNewAppointments(newApps);
        
        return formattedAppointments;
      }, forceRefresh);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentUser]);

  const handleCommentAction = async (commentId: string, action: 'approve' | 'reject') => {
    if (!commentId) return;

    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setPendingComments(prev => prev.filter(comment => comment.id !== commentId));
        setIsNotificationDropdownOpen(pendingComments.length > 1);
      }
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
    
    const fetchData = async () => {
      if (!isSubscribed) return;

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

        // Usar Promise.all para fazer as requisições em paralelo
        await Promise.all([
          loadPendingComments(),
          loadAppointments(true) // Forçar refresh para garantir filtragem correta
        ]);
      } catch (error) {
        console.error('Erro ao buscar dados de notificações:', error);
        setHasError(true);
      }
    };

    // Executar a primeira busca com um pequeno atraso para evitar sobrecarga na inicialização
    const initialFetchTimeout = setTimeout(fetchData, 1000);

    // Aumentar o intervalo para 15 minutos para reduzir a frequência de requisições
    interval = setInterval(fetchData, 15 * 60 * 1000);

    return () => {
      isSubscribed = false;
      clearTimeout(initialFetchTimeout);
      if (interval) clearInterval(interval);
    };
  }, [getCurrentUser, loadPendingComments, loadAppointments]);

  const toggleNotificationDropdown = () => {
    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
  };

  return {
    pendingComments,
    newAppointments,
    isNotificationDropdownOpen,
    notificationTab,
    setNotificationTab,
    handleCommentAction,
    handleAppointmentAction,
    toggleNotificationDropdown,
    loadAppointments
  };
};

const Notifications: React.FC = () => {
  const { pendingComments, newAppointments, isNotificationDropdownOpen, notificationTab, setNotificationTab, toggleNotificationDropdown, handleCommentAction, handleAppointmentAction } = useNotifications();

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
            <div className="sticky top-0 flex justify-between items-center p-3 sm:p-4 border-b border-gray-700/30 bg-[#1A1F2E] z-10">
              <h3 className="text-lg sm:text-xl font-semibold text-white">Notificações</h3>
              <button
                onClick={toggleNotificationDropdown}
                className="text-gray-400 hover:text-white transition-colors p-1.5 sm:p-2 hover:bg-gray-700/30 rounded-lg"
              >
                ✕
              </button>
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
                          <p className="text-xs sm:text-sm font-bold text-green-400">R$ {appointment.price.toFixed(2)}</p>
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
};

export default Notifications;