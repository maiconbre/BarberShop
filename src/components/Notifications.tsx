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
  const {
    pendingComments,
    newAppointments,
    isNotificationDropdownOpen,
    notificationTab,
    setNotificationTab,
    handleCommentAction,
    handleAppointmentAction,
    toggleNotificationDropdown
  } = useNotifications();

  return (
    <div className="relative">
      <Bell
        className={`w-6 h-6 ${pendingComments.length > 0 || newAppointments.length > 0 ? 'text-[#F0B35B]' : 'text-gray-400'}`}
        onClick={toggleNotificationDropdown}
      />
      {(pendingComments.length > 0 || newAppointments.length > 0) && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
      )}

      {isNotificationDropdownOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={toggleNotificationDropdown}
          ></div>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-xs max-h-[70vh] overflow-y-auto rounded-lg shadow-lg bg-[#1A1F2E] ring-1 ring-black ring-opacity-5 z-50">
            <div className="flex justify-between items-center p-3 border-b border-gray-700/30">
              <h3 className="text-base font-semibold text-white">Notificações</h3>
              <button
                onClick={toggleNotificationDropdown}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Botões de alternância entre comentários e agendamentos */}
            <div className="flex border-b border-gray-700/30">
              <button
                onClick={() => setNotificationTab('comments')}
                className={`flex-1 py-1.5 text-xs sm:text-sm font-medium transition-colors ${notificationTab === 'comments' ? 'text-[#F0B35B] border-b-2 border-[#F0B35B]' : 'text-gray-400 hover:text-white'}`}
              >
                <div className="flex items-center justify-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Comentários
                  {pendingComments.length > 0 && (
                    <span className="ml-1 px-1 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">
                      {pendingComments.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setNotificationTab('appointments')}
                className={`flex-1 py-1.5 text-xs sm:text-sm font-medium transition-colors ${notificationTab === 'appointments' ? 'text-[#F0B35B] border-b-2 border-[#F0B35B]' : 'text-gray-400 hover:text-white'}`}
              >
                <div className="flex items-center justify-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Agendamentos
                  {newAppointments.length > 0 && (
                    <span className="ml-1 px-1 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">
                      {newAppointments.length}
                    </span>
                  )}
                </div>
              </button>
            </div>

            <div className="py-1" role="menu">
              {notificationTab === 'comments' ? (
                /* Conteúdo de comentários */
                pendingComments.length > 0 ? (
                  pendingComments.map((comment) => (
                    <div key={comment.id} className="px-3 py-2.5 border-b border-gray-700/30 last:border-0">
                      <p className="text-xs sm:text-sm text-white font-medium">{comment.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{comment.comment}</p>
                      <div className="flex gap-1.5 mt-1.5">
                        <button
                          onClick={() => handleCommentAction(comment.id, 'approve')}
                          className="text-xs px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleCommentAction(comment.id, 'reject')}
                          className="text-xs px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2.5 text-xs sm:text-sm text-gray-400">
                    Nenhum comentário pendente
                  </div>
                )
              ) : (
                /* Conteúdo de agendamentos */
                newAppointments.length > 0 ? (
                  newAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="px-3 py-2.5 border-b border-gray-700/30 last:border-0 hover:bg-[#252B3B] cursor-pointer transition-colors"
                      onClick={() => handleAppointmentAction(appointment.id, 'view')}
                    >
                      <p className="text-xs sm:text-sm text-white font-medium">{appointment.clientName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{appointment.service}</p>
                      <p className="text-xs font-bold mt-1.5 text-green-400">R$ {appointment.price.toFixed(2)}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs sm:text-sm text-[#F0B35B]">Dia {new Date(appointment.date).getDate()} às {appointment.time}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                          Novo
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-400">
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