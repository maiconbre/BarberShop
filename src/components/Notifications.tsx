import React, { useState, useEffect, useCallback } from 'react';
import { Bell, MessageCircle, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
  
  // Usar o hook useAuth para obter o usuário atual de forma consistente
  const { getCurrentUser } = useAuth();
  
  // Verificar se há dados em cache no localStorage para inicialização
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem('appointmentsCache');
      const cacheTimestamp = localStorage.getItem('appointmentsCacheTimestamp');
      
      if (cachedData && cacheTimestamp) {
        const parsedData = JSON.parse(cachedData);
        setCachedAppointments(parsedData);
        setLastFetchTime(parseInt(cacheTimestamp));
        
        // Filtrar agendamentos não visualizados para notificações
        const viewedAppointmentIds = JSON.parse(localStorage.getItem('viewedAppointments') || '[]');
        const newApps = parsedData.filter((app: Appointment) => !viewedAppointmentIds.includes(app.id));
        setNewAppointments(newApps);
      }
    } catch (error) {
      console.error('Erro ao carregar cache de agendamentos:', error);
    }
  }, []);

  const loadPendingComments = useCallback(async () => {
    // Verificar se já está carregando para evitar requisições simultâneas
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      // Configurar headers básicos sem necessidade de token
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // Adicionar token apenas se estiver disponível (para operações que possam precisar)
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
  }, []); // Removida dependência de isLoading para evitar re-renderizações desnecessárias

  const loadAppointments = useCallback(async (forceRefresh = false) => {
    // Verificar se temos dados em cache e se não passou muito tempo desde a última requisição
    const currentTime = Date.now();
    const cacheExpiry = 10 * 60 * 1000; // 10 minutos
    
    // Usar cache se disponível e não expirado, a menos que forceRefresh seja true
    const cachedData = localStorage.getItem('appointmentsCache');
    const cacheTimestamp = localStorage.getItem('appointmentsCacheTimestamp');
    
    if (!forceRefresh && 
        cachedData && 
        cacheTimestamp && 
        (currentTime - parseInt(cacheTimestamp)) < cacheExpiry) {
      // Usar dados do localStorage diretamente para evitar dependência de estado
      const parsedData = JSON.parse(cachedData);
      return parsedData;
    }
    
    // Evitar requisições simultâneas
    if (isLoading) {
      // Tentar usar o estado atual se disponível
      if (cachedAppointments.length > 0) {
        return cachedAppointments;
      }
      // Ou tentar usar o cache do localStorage
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      return [];
    }
    
    try {
      setIsLoading(true);
      
      // Obter o ID do barbeiro do armazenamento local (se disponível)
      const currentUser = getCurrentUser();
      
      // Configurar headers básicos sem necessidade de token
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // Adicionar token apenas se estiver disponível
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${(import.meta as any).env.VITE_API_URL}/api/appointments`,
        {
          method: 'GET',
          headers,
          mode: 'cors'
        }
      );
      
      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        console.error(`Erro na requisição: ${response.status}`);
        return cachedAppointments.length > 0 ? cachedAppointments : [];
      }
      
      const result = await response.json();

      if (result?.success) {
        // Recuperar IDs de agendamentos já visualizados do localStorage
        const viewedAppointmentIds = JSON.parse(localStorage.getItem('viewedAppointments') || '[]');

        let formattedAppointments = result.data
          .map((app: any) => ({
            ...app,
            service: app.serviceName,
            viewed: viewedAppointmentIds.includes(app.id)
          }));

        // Filtrar por barbeiro se não for admin
        if (currentUser?.role !== 'admin') {
          formattedAppointments = formattedAppointments.filter(
            (app: Appointment) => app.barberId === currentUser?.id
          );
        }

        // Ordenar por data e hora
        formattedAppointments.sort((a: Appointment, b: Appointment) => {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });

        // Filtrar agendamentos não visualizados para notificações
        const newApps = formattedAppointments.filter((app: Appointment) => !app.viewed);
        setNewAppointments(newApps);
        
        // Atualizar o cache no localStorage para persistência
        localStorage.setItem('appointmentsCache', JSON.stringify(formattedAppointments));
        localStorage.setItem('appointmentsCacheTimestamp', currentTime.toString());
        
        // Atualizar o cache e o timestamp no estado
        setCachedAppointments(formattedAppointments);
        setLastFetchTime(currentTime);
        setHasError(false);
        
        return formattedAppointments;
      } else {
        return cachedAppointments.length > 0 ? cachedAppointments : [];
      }
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      setHasError(true);
      return cachedAppointments.length > 0 ? cachedAppointments : [];
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentUser]); // Removidas dependências que causavam loops

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
        // Marcar agendamento como visualizado
        const viewedAppointmentIds = JSON.parse(localStorage.getItem('viewedAppointments') || '[]');
        if (!viewedAppointmentIds.includes(appointmentId)) {
          viewedAppointmentIds.push(appointmentId);
          localStorage.setItem('viewedAppointments', JSON.stringify(viewedAppointmentIds));

          // Atualizar estado local
          setNewAppointments(prev => prev.filter(app => app.id !== appointmentId));
        }

        // Fechar o dropdown de notificações
        setIsNotificationDropdownOpen(false);
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
        // Carregar comentários pendentes para todos os usuários
        await loadPendingComments();
        // Carregar agendamentos com forceRefresh=false para usar o cache quando possível
        await loadAppointments(false);
      } catch (error) {
        console.error('Erro ao buscar dados de notificações:', error);
        setHasError(true);
      }
    };

    // Fazer apenas uma requisição ao montar o componente
    fetchData();

    // Configurar um intervalo mais longo para atualização periódica
    // Usando uma referência para poder limpar corretamente
    interval = setInterval(fetchData, 5 * 60 * 1000); // 5 minutos

    return () => {
      isSubscribed = false;
      if (interval) clearInterval(interval);
    };
  }, []); // Removidas dependências que causavam loops


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

  // Calcular o total de notificações não lidas
  const totalNotifications = pendingComments.length + newAppointments.length;

  return (
    <div className="relative">
      <button
        onClick={toggleNotificationDropdown}
        className="relative p-2.5 rounded-full bg-[#1A1F2E] hover:bg-[#252B3B] transition-colors duration-300 flex items-center justify-center"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5 text-white" />
        {totalNotifications > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
            {totalNotifications}
          </span>
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
                  <MessageCircle className="w-6 h-6 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Comentários</span>
                  {pendingComments.length > 0 && (
                    <span className="px-1.5 sm:px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">
                      {pendingComments.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setNotificationTab('appointments')}
                className={`flex-1 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${notificationTab === 'appointments' ? 'text-[#F0B35B] border-b-2 border-[#F0B35B]' : 'text-gray-400 hover:text-white'}`}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <CalendarIcon className="w-6 h-6 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Agendamentos</span>
                  {newAppointments.length > 0 && (
                    <span className="px-2 sm:px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">
                      {newAppointments.length}
                    </span>
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
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] sm:text-xs font-medium">
                          Novo
                        </span>
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