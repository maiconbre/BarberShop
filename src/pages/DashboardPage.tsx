import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Calendar, Bell } from 'lucide-react';
import AppointmentCardNew from '../components/AppointmentCardNew';
import Stats from '../components/Stats';
import Grafico from '../components/Grafico';

// [ID: INTERFACES-001] - Definição das interfaces principais
// Interface que define a estrutura de um agendamento
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

// Interface que define a estrutura dos dados do gráfico
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
  // Hooks de autenticação e navegação
  const { logout, getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [weeklyData, setWeeklyData] = useState<ChartData[]>([]);
  const [isChartExpanded, setIsChartExpanded] = useState(true);
  const navigate = useNavigate();
  const [revenueDisplayMode, setRevenueDisplayMode] = useState('total');
  const [filterMode, setFilterMode] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [pendingComments, setPendingComments] = useState<Comment[]>([]);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 7;
  // [ID: STATS-001] - Estatísticas básicas movidas para o componente Stats
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

  // [ID: API-001] - Carregamento de dados da API
  // Função para carregar agendamentos do backend
  const loadAppointments = useCallback(async () => {
    try {
      const response = await fetch(`https://barber-backend-spm8.onrender.com/api/appointments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        mode: 'cors'
      });
      const result = await response.json();
      if (result.success) {
        let formattedAppointments = result.data
          .map((app: any) => ({
            ...app,
            service: app.serviceName
          }));

        // Filtra os agendamentos se o usuário não for admin
        if (currentUser?.role !== 'admin') {
          formattedAppointments = formattedAppointments.filter(
            (app: Appointment) => app.barberId === currentUser?.id
          );
        }

        // Ordena os agendamentos por data e hora
        formattedAppointments.sort((a: Appointment, b: Appointment) => {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });

        setAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
    }
  }, []);

  // Função para carregar comentários pendentes
  const loadPendingComments = useCallback(async () => {
    if (currentUser?.role !== 'admin') return;
    
    try {
      const response = await fetch('https://barber-backend-spm8.onrender.com/api/comments?status=pending', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        mode: 'cors'
      });
      
      const result = await response.json();
      if (result.success) {
        setPendingComments(result.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar comentários pendentes:', error);
    }
  }, [currentUser]);

  // Função para gerenciar ações nos comentários (aprovar/recusar)
  const handleCommentAction = async (commentId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`https://barber-backend-spm8.onrender.com/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        mode: 'cors',
        body: JSON.stringify({
          status: action === 'approve' ? 'approved' : 'rejected'
        })
      });
      
      if (response.ok) {
        // Remove o comentário da lista de pendentes
        setPendingComments(prev => prev.filter(comment => comment.id !== commentId));
        setIsNotificationDropdownOpen(false);
      }
    } catch (error) {
      console.error(`Erro na ação ${action} do comentário:`, error);
    }
  };

  // Carrega os agendamentos e comentários ao montar o componente e configura o polling
  useEffect(() => {
    loadAppointments();
    if (currentUser?.role === 'admin') {
      loadPendingComments();
    }
    
    const appointmentsInterval = setInterval(loadAppointments, 30000);
    const commentsInterval = currentUser?.role === 'admin' ? setInterval(loadPendingComments, 60000) : null;
    
    // [ID: UI-001] - Renderização da interface do usuário
    // Estrutura principal do dashboard com cards, gráficos e lista de agendamentos
    return () => {
      clearInterval(appointmentsInterval);
      if (commentsInterval) clearInterval(commentsInterval);
    };
  }, [loadAppointments, loadPendingComments, currentUser]);
  // [ID: CHART-001] - Processamento de dados para gráficos movido para o componente Grafico
  // Calcula os dados semanais para o gráfico
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
    // Sincroniza o filterMode com o revenueDisplayMode
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

  // Gerencia ações de completar, deletar ou alternar status dos agendamentos
  const handleAppointmentAction = async (appointmentId: string, action: 'complete' | 'delete' | 'toggle', currentStatus?: string) => {
    if (!appointmentId) return;
    try {
      if (action === 'delete') {
        const response = await fetch(`https://barber-backend-spm8.onrender.com/api/appointments/${appointmentId}`, {
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
        const response = await fetch(`https://barber-backend-spm8.onrender.com/api/appointments/${appointmentId}`, {
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
  // Pagination logic
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);
  const handlePageChange = (pageNumber: number): void => {
    setCurrentPage(pageNumber);
  };
  // Estrutura principal do dashboard com cards, gráficos e lista de agendamentos
  return (
    <div className="min-h-screen bg-[#0D121E] pt-16 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#F0B35B]/5 to-transparent rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>
      
      {/* Padrão de linhas decorativas */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{ 
          backgroundImage: 'linear-gradient(90deg, #F0B35B 1px, transparent 1px), linear-gradient(180deg, #F0B35B 1px, transparent 1px)', 
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-white">Painel de Controle</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
                className="p-2 rounded-full bg-[#1A1F2E] transition-colors duration-300 relative"
              >
                <Bell className="w-6 h-6 text-[#F0B35B]" />
                {pendingComments.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    {pendingComments.length}
                  </span>
                )}
              </button>
              {isNotificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-[#1A1F2E] ring-1 ring-black ring-opacity-5 z-50">
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
              )}
            </div>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2 rounded-full bg-[#F0B35B] transition-colors duration-300"
            >
              <Settings className="w-6 h-6 text-black " />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[#1A1F2E] ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="menu">
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => navigate('/register')}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#F0B35B] hover:text-white bg"
                      role="menuitem"
                    >
                      Gerenciar Barbeiros
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/trocar-senha')}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#F0B35B] hover:text-white bg"
                    role="menuitem"
                  >
                    Trocar Senha
                  </button>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#F0B35B] hover:text-white bg"
                    role="menuitem"
                  >
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <Stats
          appointments={appointments}
          revenueDisplayMode={revenueDisplayMode}
          setRevenueDisplayMode={setRevenueDisplayMode}
        />

        {/* Seção do Gráfico */}
        <Grafico
          weeklyData={weeklyData}
          isChartExpanded={isChartExpanded}
          setIsChartExpanded={setIsChartExpanded}
        />

        {/* Seção de Agendamentos */}
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
        {/* Lista de Agendamentos */}
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

                {/* Controles de Paginação */}
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
                          : 'bg-[#1A1F2E] text-gray-400 hover:bg-[#252B3B]'}`}
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
                  {filterMode === 'today' ? 'Nenhum agendamento para hoje' :
                    filterMode === 'tomorrow' ? 'Nenhum agendamento para amanhã' :
                      'Nenhum agendamento encontrado'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;