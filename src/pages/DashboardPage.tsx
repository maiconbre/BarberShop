import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Calendar, Bell } from 'lucide-react';
import AppointmentCardNew from '../components/AppointmentCardNew';
import Stats from '../components/Stats';
import Grafico from '../components/Grafico';

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
}

interface Comment {
  id: string;
  name: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface ChartData {
  date: string;
  pending: number;
  completed: number;
  fullDate: string;
}
const DashboardPage: React.FC = () => {
  const { logout, getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [weeklyData, setWeeklyData] = useState<ChartData[]>([]);
  const [isChartExpanded, setIsChartExpanded] = useState(true);
  const [revenueDisplayMode, setRevenueDisplayMode] = useState('total');
  const [filterMode, setFilterMode] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [pendingComments, setPendingComments] = useState<Comment[]>([]);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const appointmentsPerPage = 7;
  const FETCH_COOLDOWN = 5000;
  const MAX_RETRIES = 3;

  const filteredAppointments = appointments.filter(app => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeStr = hoje.toISOString().split('T')[0];

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().split('T')[0];

    switch (filterMode) {
      case 'today':
        return app.date === hojeStr;
      case 'tomorrow':
        return app.date === amanhaStr;
      default:
        return true;
    }
  });

  const fetchWithRetry = useCallback(async (url: string, options: RequestInit, maxRetries = MAX_RETRIES) => {
    let attempts = 0;
    const now = Date.now();

    if (now - lastFetchTime < FETCH_COOLDOWN) {
      return null;
    }

    // Ensure we have a valid token in the headers
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      setHasError(true);
      logout();
      return null;
    }

    // Make sure Authorization header is properly set
    if (!options.headers) {
      options.headers = {};
    }
    
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    while (attempts < maxRetries) {
      try {
        const response = await fetch(url, options);
        setLastFetchTime(Date.now());
        
        if (response.status === 403 || response.status === 401) {
          console.error(`Authentication error: ${response.status}`);
          // For 403 errors, we should stop retrying immediately as it indicates
          // the user doesn't have permission to access this resource
          if (response.status === 403) {
            // Don't logout on 403, just return null to indicate permission error
            setHasError(true);
            return null;
          }
          
          // For 401 errors, retry until max attempts then logout
          if (attempts === maxRetries - 1) {
            logout();
            return null;
          }
        }
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        setHasError(false);
        setRetryCount(0);
        return data;
      } catch (error) {
        attempts++;
        setRetryCount(attempts);
        setHasError(true);
        console.error(`Tentativa ${attempts} falhou:`, error);
        if (attempts === maxRetries) {
          console.error('Número máximo de tentativas atingido');
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
    return null;
  }, [lastFetchTime, logout]);

  const loadAppointments = useCallback(async () => {
    const result = await fetchWithRetry(
      `${(import.meta as any).env.VITE_API_URL}/api/appointments`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        mode: 'cors'
      }
    );

    if (result?.success) {
      let formattedAppointments = result.data
        .map((app: any) => ({
          ...app,
          service: app.serviceName
        }));

      if (currentUser?.role !== 'admin') {
        formattedAppointments = formattedAppointments.filter(
          (app: Appointment) => app.barberId === currentUser?.id
        );
      }

      formattedAppointments.sort((a: Appointment, b: Appointment) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      setAppointments(formattedAppointments);
    }
  }, [currentUser, fetchWithRetry]);

  const loadPendingComments = useCallback(async () => {
    // Removida verificação de admin para permitir acesso público aos comentários pendentes
    
    // Don't retry if we've already reached the maximum retry count
    if (retryCount >= MAX_RETRIES) {
      console.log('Maximum retry attempts reached for pending comments');
      return;
    }

    try {
      // Fazendo requisição sem autenticação
      const response = await fetch(
        `${(import.meta as any).env.VITE_API_URL}/api/comments?status=pending`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
            // Removido o token de autorização para permitir acesso público
          },
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
      console.error('Error fetching pending comments:', error);
      setHasError(true);
    }
  }, [retryCount]); // Removida dependência de fetchWithRetry e logout

  useEffect(() => {
    let isSubscribed = true;
    let interval: NodeJS.Timeout;

    const fetchData = async () => {
      if (!isSubscribed) return;
      
      try {
        // Always load appointments for all users
        await loadAppointments();
        
        // Carregar comentários pendentes para todos os usuários, sem verificação de admin
        await loadPendingComments();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setHasError(true);
      }
    };

    fetchData();

    // Only set up polling if there are no errors
    if (!hasError) {
      interval = setInterval(fetchData, 30000);
    }

    return () => {
      isSubscribed = false;
      if (interval) clearInterval(interval);
    };
  }, [loadAppointments, loadPendingComments, hasError]); // Removida dependência de currentUser


  const handleCommentAction = async (commentId: string, action: 'approve' | 'reject') => {
    if (!commentId) return;

    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
          // Removido o token de autorização para permitir acesso público
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
  const calculateWeeklyData = useCallback(() => {
    const appointmentsByDate = appointments.reduce((acc, app) => {
      if (!acc[app.date]) {
        acc[app.date] = { pending: 0, completed: 0 };
      }
      if (app.status === 'pending') {
        acc[app.date].pending++;
      } else if (app.status === 'completed') {
        acc[app.date].completed++;
      }
      return acc;
    }, {} as { [key: string]: { pending: number; completed: number } });

    const sortedDates = Object.keys(appointmentsByDate).sort();
    const data = sortedDates.map(date => {
      const dayDate = new Date(date + 'T12:00:00-03:00');
      const fullDate = dayDate.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric'
      }).replace('.', '').replace('-feira', '');

      return {
        date: String(dayDate.getDate()),
        fullDate: fullDate.charAt(0).toUpperCase() + fullDate.slice(1),
        pending: appointmentsByDate[date].pending,
        completed: appointmentsByDate[date].completed
      };
    });
    setWeeklyData(data);
  }, [appointments]);
  useEffect(() => {
    if (revenueDisplayMode === 'day') {
      setFilterMode('today');
    } else if (revenueDisplayMode === 'week') {
      setFilterMode('all');
    }
  }, [revenueDisplayMode]);
  useEffect(() => {
    if (appointments?.length > 0) {
      calculateWeeklyData();
    } else {
      setWeeklyData([]);
    }
  }, [appointments, calculateWeeklyData, revenueDisplayMode]);

  const handleAppointmentAction = async (appointmentId: string, action: 'complete' | 'delete' | 'toggle', currentStatus?: string) => {
    if (!appointmentId) return;
    try {
      if (action === 'delete') {
        const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/appointments/${appointmentId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
          mode: 'cors'
        });
        if (response.ok) {
          setAppointments(prev => prev.filter(app => app.id !== appointmentId));
        }
      } else {
        const newStatus = action === 'complete' ? 'completed' : (currentStatus === 'completed' ? 'pending' : 'completed');
        const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/appointments/${appointmentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
          mode: 'cors',
          body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
          setAppointments(prev =>
            prev.map(app =>
              app.id === appointmentId ? { ...app, status: newStatus } : app
            )
          );
        }
      }
    } catch (error) {
      console.error(`Erro na ação ${action}:`, error);
    }
  };
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);
  const handlePageChange = (pageNumber: number): void => {
    setCurrentPage(pageNumber);
  };
  return (
    <div className="min-h-screen bg-[#0D121E] pt-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#F0B35B]/5 to-transparent rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>

      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: 'linear-gradient(90deg, #F0B35B 1px, transparent 1px), linear-gradient(180deg, #F0B35B 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-white">Painel de Controle</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell
                className={`w-6 h-6 ${pendingComments.length > 0 ? 'text-[#F0B35B]' : 'text-gray-400'}`}
                onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
              />
              {pendingComments.length > 0 && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </div>
            {isNotificationDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 bg-black/50 z-40"
                  onClick={() => setIsNotificationDropdownOpen(false)}
                ></div>
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm max-h-[80vh] overflow-y-auto rounded-lg shadow-lg bg-[#1A1F2E] ring-1 ring-black ring-opacity-5 z-50">
                  <div className="flex justify-between items-center p-4 border-b border-gray-700/30">
                    <h3 className="text-lg font-semibold text-white">Notificações</h3>
                    <button
                      onClick={() => setIsNotificationDropdownOpen(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="py-1" role="menu">
                    {pendingComments.length > 0 ? (
                      pendingComments.map((comment) => (
                        <div key={comment.id} className="px-4 py-3 border-b border-gray-700/30 last:border-0">
                          <p className="text-sm text-white font-medium">{comment.name}</p>
                          <p className="text-xs text-gray-400 mt-1">{comment.comment}</p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleCommentAction(comment.id, 'approve')}
                              className="text-xs px-3 py-1 rounded-md bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleCommentAction(comment.id, 'reject')}
                              className="text-xs px-3 py-1 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            >
                              Recusar
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-400">
                        Nenhum comentário pendente
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 rounded-full bg-[#F0B35B] transition-colors duration-300"
          >
            <Settings className="w-6 h-6 text-black" />
          </button>
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm max-h-[80vh] overflow-y-auto rounded-lg shadow-lg bg-[#1A1F2E] ring-1 ring-black ring-opacity-5 z-50">
                <div className="flex justify-between items-center p-4 border-b border-gray-700/30">
                  <h3 className="text-lg font-semibold text-white">Configurações</h3>
                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="py-1" role="menu">
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => navigate('/register')}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#F0B35B] hover:text-white"
                      role="menuitem"
                    >
                      Gerenciar Barbeiros
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/trocar-senha')}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#F0B35B] hover:text-white"
                    role="menuitem"
                  >
                    Trocar Senha
                  </button>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#F0B35B] hover:text-white"
                    role="menuitem"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <Stats
          appointments={appointments}
          revenueDisplayMode={revenueDisplayMode}
          setRevenueDisplayMode={setRevenueDisplayMode}
        />

        <Grafico
          weeklyData={weeklyData}
          isChartExpanded={isChartExpanded}
          setIsChartExpanded={setIsChartExpanded}
        />

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs pl-10 text-gray-400">{filteredAppointments.length} total</span>
          </div>
          <div className="relative">
            <div className="flex flex-row items-center justify-start gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setFilterMode('today');
                  setIsFilterDropdownOpen(false);
                }}
                className={`w-full sm:w-auto px-4 py-2 rounded-md transition-all duration-300 ${filterMode === 'today' ? 'bg-[#F0B35B] text-black' : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}`}
              >
                Hoje
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setFilterMode('tomorrow');
                  setIsFilterDropdownOpen(false);
                }}
                className={`w-full sm:w-auto px-4 py-2 rounded-md transition-all duration-300 ${filterMode === 'tomorrow' ? 'bg-[#F0B35B] text-black' : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}`}
              >
                Amanhã
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/calendar')}
                className="p-2 rounded-md bg-[#252B3B] text-white hover:bg-[#F0B35B]/20 transition-all duration-300 flex items-center justify-center"
                title="Ver calendário"
              >
                <Calendar className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <AnimatePresence>
            {filteredAppointments.length > 0 ? (
              <>
                {currentAppointments.map((appointment) => (
                  <AppointmentCardNew
                    key={appointment.id}
                    appointment={appointment}
                    onDelete={() => handleAppointmentAction(appointment.id, 'delete')}
                    onToggleStatus={() => handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
                    filterMode={filterMode}
                    revenueDisplayMode={revenueDisplayMode}
                    appointments={appointments}
                  />
                ))}

                {totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center items-center gap-2 mt-6"
                  >
                    {Array.from({ length: totalPages }, (_, index) => (
                      <motion.button
                        key={index + 1}
                        onClick={() => handlePageChange(index + 1)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${currentPage === index + 1
                          ? 'bg-[#F0B35B] text-black'
                          : 'bg-[#1A1F2E] text-gray-400 hover:bg-[#252B3B]'
                          }`}
                      >
                        {index + 1}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#1A1F2E] p-6 rounded-lg text-center"
              >
                <p className="text-gray-400">
                  {filterMode === 'today'
                    ? 'Nenhum agendamento para hoje'
                    : filterMode === 'tomorrow'
                      ? 'Nenhum agendamento para amanhã'
                      : 'Nenhum agendamento encontrado'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>

  );
}

export default DashboardPage;