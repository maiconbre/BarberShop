import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Calendar,ChevronDown, ChevronLeft, ChevronRight, LayoutDashboard, RefreshCw, Users } from 'lucide-react';
import AppointmentCardNew from '../components/AppointmentCardNew';
import Stats from '../components/Stats';
import Grafico from '../components/Grafico';
import Notifications, { useNotifications } from '../components/Notifications';
import AppointmentViewModal from '../components/AppointmentViewModal';
import CalendarView from '../components/CalendarView';
import ClientAnalytics from '../components/ClientAnalytics';
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

// Hook personalizado para filtrar agendamentos
const useFilteredAppointments = (appointments: Appointment[], filterMode: string) => {
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().split('T')[0];

    if (filterMode === 'today') {
      setFilteredAppointments(appointments.filter(app => app.date === today));
    } else if (filterMode === 'tomorrow') {
      setFilteredAppointments(appointments.filter(app => app.date === tomorrow));
    } else {
      setFilteredAppointments(appointments);
    }
  }, [appointments, filterMode]);

  return filteredAppointments;
};

const DashboardPage: React.FC = () => {
  const { logout, getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isChartExpanded, setIsChartExpanded] = useState(true);
  const [revenueDisplayMode, setRevenueDisplayMode] = useState('month');
  const [filterMode, setFilterMode] = useState('today');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Modal state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 9; // Aumentado para 9 para melhor harmonia visual com a coluna da esquerda
  // View mode state (painel, agenda ou analytics)
  const [activeView, setActiveView] = useState<'painel' | 'agenda' | 'analytics'>('painel');
  // Calendar view states
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isRangeFilterActive, setIsRangeFilterActive] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  // Estado para controlar a animação do botão de atualização
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Função para atualizar dados usando CacheService
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const newAppointments = await loadAppointments(true);
      if (newAppointments && Array.isArray(newAppointments)) {
        // Substituir os dados existentes ao invés de concatenar
        setAppointments(newAppointments);
        await CacheService.setLastUpdateTime('appointments', new Date().toISOString());
      }
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Usando o hook de notificações
  const { loadAppointments } = useNotifications();

  // Usando o hook personalizado para filtrar agendamentos
  const filteredAppointments = useFilteredAppointments(appointments, filterMode);

  // Pagination logic
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);

  // Lógica para filtrar agendamentos na visualização de agenda
  const calendarFilteredAppointments = appointments.filter(app => {
    if (!isRangeFilterActive || !startDate) {
      return app.date === selectedDate;
    }

    if (startDate && endDate) {
      const appDate = new Date(app.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return appDate >= start && appDate <= end;
    }

    return app.date === startDate;
  });

  // Calcular valor total para a visualização de agenda
  const calculateTotalValue = (apps: Appointment[]) => {
    return apps.reduce((total, app) => total + (app.price || 0), 0);
  };

  const totalValue = calculateTotalValue(calendarFilteredAppointments);

  // Pagination logic para visualização de agenda
  const calendarCurrentAppointments = calendarFilteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const calendarTotalPages = Math.ceil(calendarFilteredAppointments.length / appointmentsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Efeito para rolar para o topo da página quando o componente for renderizado
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []); // Executar apenas uma vez na montagem do componente

  useEffect(() => {
    let isSubscribed = true;
    let retryTimeout: NodeJS.Timeout | null = null;

    const fetchData = async (retryCount = 0) => {
      if (!isSubscribed) return;

      try {
        // Verificar se o usuário está online antes de fazer requisições
        if (!navigator.onLine) {
          console.log('Dispositivo offline, usando dados em cache');
          return;
        }

        const formattedAppointments = await loadAppointments(false);
        if (isSubscribed && Array.isArray(formattedAppointments)) {
          setAppointments(formattedAppointments);
        }
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);

        // Se for erro 429, implementar retry com backoff exponencial
        if (error.response?.status === 429 || (typeof error === 'object' && error.message?.includes('429'))) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 60000); // Máximo de 1 minuto
          console.warn(`Erro 429, tentando novamente em ${delay / 1000}s`);

          if (retryCount < 5) { // Máximo de 5 tentativas
            retryTimeout = setTimeout(() => fetchData(retryCount + 1), delay);
          }
        } else {
          setAppointments([]);
        }
      }
    };

    // Adicionar um pequeno atraso antes da primeira requisição
    const initialFetchTimeout = setTimeout(() => fetchData(), 500);

    return () => {
      isSubscribed = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      clearTimeout(initialFetchTimeout);
    };
  }, [loadAppointments]);

  // Efeito para verificar se os agendamentos foram carregados corretamente
  useEffect(() => {
    console.log('Estado atual de appointments:', appointments);
  }, [appointments]);

  // Efeito para escutar eventos de abertura de modal vindos das notificações
  useEffect(() => {
    const handleOpenAppointmentModal = (event: CustomEvent) => {
      const { appointmentId } = event.detail;
      if (appointmentId) {
        handleAppointmentAction(appointmentId, 'view');
      }
    };

    // Adicionar o listener de evento
    window.addEventListener('openAppointmentModal', handleOpenAppointmentModal as EventListener);

    // Remover o listener quando o componente for desmontado
    return () => {
      window.removeEventListener('openAppointmentModal', handleOpenAppointmentModal as EventListener);
    };
  }, [appointments]); // Dependência de appointments para garantir que temos os dados mais recentes

  useEffect(() => {
    if (revenueDisplayMode === 'day') {
      setFilterMode('today');
    } else if (revenueDisplayMode === 'week') {
      setFilterMode('all');
    } else if (revenueDisplayMode === 'month') {
      setFilterMode('all');
    }
    setCurrentPage(1); // Reset to first page when revenue display mode changes
  }, [revenueDisplayMode]);

  // Função para lidar com a seleção de data na visualização de agenda
  const handleDateSelection = (date: string) => {
    if (!isRangeFilterActive) {
      setSelectedDate(date);
      setCurrentPage(1); // Reset to first page when date changes
      return;
    }

    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
      setCurrentPage(1); // Reset to first page when date range changes
    } else {
      if (new Date(date) < new Date(startDate)) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
      setCurrentPage(1); // Reset to first page when date range is completed
    }
  };

  // Função para resetar filtros na visualização de agenda
  const resetFilters = () => {
    setIsRangeFilterActive(false);
    setStartDate(null);
    setEndDate(null);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setCurrentPage(1); // Reset to first page when filters are reset
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'complete' | 'delete' | 'toggle' | 'view', currentStatus?: string) => {
    if (!appointmentId) return;
    try {
      if (action === 'view') {
        // Encontrar o agendamento pelo ID
        const appointment = appointments.find(app => app.id === appointmentId);
        if (appointment) {
          setSelectedAppointment(appointment);
          setIsViewModalOpen(true);

          // Marcar como visualizado se estiver no localStorage
          const viewedAppointmentIds = JSON.parse(localStorage.getItem('viewedAppointments') || '[]');
          if (!viewedAppointmentIds.includes(appointmentId)) {
            viewedAppointmentIds.push(appointmentId);
            localStorage.setItem('viewedAppointments', JSON.stringify(viewedAppointmentIds));
          }
        }
        return;
      }

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
          // Fechar o modal se o agendamento excluído for o que está sendo visualizado
          if (selectedAppointment?.id === appointmentId) {
            setIsViewModalOpen(false);
            setSelectedAppointment(null);
          }
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
          const updatedAppointments = appointments.map(app =>
            app.id === appointmentId ? { ...app, status: newStatus } : app
          );
          setAppointments(updatedAppointments as Appointment[]);

          // Atualizar o agendamento selecionado se estiver sendo visualizado
          if (selectedAppointment?.id === appointmentId) {
            setSelectedAppointment({ ...selectedAppointment, status: newStatus });
          }
        }
      }
    } catch (error) {
      console.error(`Erro na ação ${action}:`, error);
    }
  }

  return (
    <div className="min-h-screen bg-[#0D121E] pt-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#F0B35B]/5 to-transparent rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gradient-to-tr from-[#F0B35B]/5 to-transparent rounded-full blur-3xl opacity-30"></div>

      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: 'linear-gradient(90deg, #F0B35B 1px, transparent 1px), linear-gradient(180deg, #F0B35B 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 xl:px-0 relative z-10">
        <div className="flex flex-col-2 sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-3">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto hide-scrollbar w-full sm:w-auto pb-2 sm:pb-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveView('painel')}
              className={`px-1.5 sm:px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-1 sm:gap-2 flex-shrink-0 ${activeView === 'painel' ? 'bg-[#F0B35B] text-black font-medium' : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}`}
            >
              <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm whitespace-nowrap">Painel</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveView('agenda')}
              className={`px-1.5 sm:px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-1 sm:gap-2 flex-shrink-0 ${activeView === 'agenda' ? 'bg-[#F0B35B] text-black font-medium' : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}`}
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm whitespace-nowrap">Agenda</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveView('analytics')}
              className={`px-1.5 sm:px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-1 sm:gap-2 flex-shrink-0 ${activeView === 'analytics' ? 'bg-[#F0B35B] text-black font-medium' : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}`}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm whitespace-nowrap">Clientes</span>
            </motion.button>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <Notifications />
            </div>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-2 sm:p-2 rounded-full bg-[#F0B35B] transition-colors duration-300"
              >
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
              </button>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="fixed sm:absolute top-[20%] sm:top-full left-[50%] sm:left-auto right-auto sm:right-0 transform-gpu -translate-x-1/2 sm:translate-x-0 -translate-y-0 sm:-translate-y-0 mt-0 sm:mt-4 w-[90vw] sm:w-[350px] md:w-[400px] max-h-[70vh] xs:max-h-[75vh] sm:max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl bg-[#1A1F2E] ring-1 ring-[#F0B35B]/20 z-50 animate-fade-in-up">
                    <div className="sticky top-0 flex justify-between items-center p-3 sm:p-4 border-b border-gray-700/30 bg-[#1A1F2E] z-10">
                      <h3 className="text-lg sm:text-xl font-semibold text-white">Configurações</h3>
                      <button
                        onClick={() => setIsDropdownOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors p-1.5 sm:p-2 hover:bg-gray-700/30 rounded-lg"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="divide-y divide-gray-700/30" role="menu">
                      {/* Opções para admin */}
                      {currentUser?.role === 'admin' ? (
                        <>
                          <button
                            onClick={() => navigate('/register')}
                            className="flex w-full items-center text-left px-4 py-3 text-sm text-white hover:bg-[#252B3B] transition-colors"
                            role="menuitem"
                          >
                            <span>Gerenciar Barbeiros</span>
                          </button>
                          <button
                            onClick={() => navigate('/gerenciar-horarios')}
                            className="flex w-full items-center text-left px-4 py-3 text-sm text-white hover:bg-[#252B3B] transition-colors"
                            role="menuitem"
                          >
                            <span>Gerenciar Horários</span>
                          </button>
                          <button
                            onClick={() => navigate('/gerenciar-comentarios')}
                            className="flex w-full items-center text-left px-4 py-3 text-sm text-white hover:bg-[#252B3B] transition-colors"
                            role="menuitem"
                          >
                            <span>Gerenciar Comentários</span>
                          </button>
                          <button
                            onClick={() => navigate('/servicos')}
                            className="flex w-full items-center text-left px-4 py-3 text-sm text-white hover:bg-[#252B3B] transition-colors"
                            role="menuitem"
                          >
                            <span>Gerenciar Serviços</span>
                          </button>
                          <button
                            onClick={() => navigate('/configuracoes-site')}
                            className="flex w-full items-center text-left px-4 py-3 text-sm text-white hover:bg-[#252B3B] transition-colors"
                            role="menuitem"
                          >
                            <span>Configurações do Site</span>
                          </button>
                        </>
                      ) : (
                        // Opções para barbeiros
                        <>
                          <button
                            onClick={() => navigate('/register')}
                            className="flex w-full items-center text-left px-4 py-3 text-sm text-white hover:bg-[#252B3B] transition-colors"
                            role="menuitem"
                          >
                            <span>Editar Meus Dados</span>
                          </button>
                          <button
                            onClick={() => navigate('/gerenciar-horarios')}
                            className="flex w-full items-center text-left px-4 py-3 text-sm text-white hover:bg-[#252B3B] transition-colors"
                            role="menuitem"
                          >
                            <span>Gerenciar Meus Horários</span>
                          </button>
                          <button
                            onClick={() => navigate('/gerenciar-comentarios')}
                            className="flex w-full items-center text-left px-4 py-3 text-sm text-white hover:bg-[#252B3B] transition-colors"
                            role="menuitem"
                          >
                            <span>Gerenciar Meus Comentários</span>
                          </button>
                        </>
                      )}

                      {/* Opções comuns para ambos */}
                      <button
                        onClick={() => navigate('/trocar-senha')}
                        className="flex w-full items-center text-left px-4 py-3 text-sm text-white hover:bg-[#252B3B] transition-colors"
                        role="menuitem"
                      >
                        <span>Trocar Senha</span>
                      </button>
                      <button
                        onClick={logout}
                        className="flex w-full items-center text-left px-4 py-3 text-sm text-white hover:bg-[#252B3B] transition-colors"
                        role="menuitem"
                      >
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Renderização condicional baseada na visualização ativa */}
        <AnimatePresence mode="wait">
          {activeView === 'painel' ? (
            <motion.div
              key="painel-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {/* Layout para desktop com melhor distribuição de espaço */}
              <div className="flex flex-col xl:flex-row gap-6 xl:gap-8">
                {/* Coluna principal - Stats e Gráfico */}
                <div className="w-full xl:w-8/12">
                  {/* Stats com mais espaço e melhor visualização */}
                  <div className="mb-6 xl:mb-8">
                    <Stats
                      appointments={appointments}
                      revenueDisplayMode={revenueDisplayMode}
                      setRevenueDisplayMode={setRevenueDisplayMode}
                    />
                  </div>
                  
                  {/* Gráfico com mais espaço */}
                  <div className="mb-6 xl:mb-8">
                    <Grafico
                      appointments={appointments}
                      isChartExpanded={isChartExpanded}
                      setIsChartExpanded={setIsChartExpanded}
                    />
                  </div>
                </div>
                
                {/* Coluna lateral - Agendamentos */}
                <div className="w-full xl:w-4/12">
                  <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg p-4 sm:p-6 mb-6 sticky top-20">
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#F0B35B]" />
                        Agendamentos
                      </h2>
                      <div className="flex items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={refreshData}
                          className={`p-2 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#252B3B] transition-all duration-300 ${isRefreshing ? 'animate-spin' : ''}`}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </motion.button>
                        <div className="relative">
                          <select
                            value={filterMode}
                            onChange={(e) => setFilterMode(e.target.value)}
                            className="appearance-none bg-[#1A1F2E] text-white text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-[#F0B35B] cursor-pointer hover:bg-[#252B3B] transition-colors"
                          >
                            <option value="today">Hoje</option>
                            <option value="tomorrow">Amanhã</option>
                            <option value="all">Todos</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {currentAppointments.length === 0 ? (
                      <div className="bg-[#0D121E] rounded-lg p-6 text-center">
                        <p className="text-gray-400">
                          {filterMode === 'today'
                            ? 'Nenhum agendamento para hoje'
                            : filterMode === 'tomorrow'
                              ? 'Nenhum agendamento para amanhã'
                              : 'Nenhum agendamento encontrado'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {calendarCurrentAppointments.map((appointment) => (
                          <AppointmentCardNew
                            key={appointment.id}
                            appointment={appointment}
                            onDelete={() => handleAppointmentAction(appointment.id, 'delete')}
                            onToggleStatus={() => handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
                            onView={() => handleAppointmentAction(appointment.id, 'view')}
                          />
                        ))}
                      </div>
                    )}

                    {/* Paginação removida daqui - agora usando o componente de paginação global */}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeView === 'agenda' ? (
            <motion.div
              key="agenda-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {/* Layout melhorado para visualização de agenda */}
              <div className="flex flex-col xl:flex-row gap-6 xl:gap-8">
                {/* Coluna principal - Calendário */}
                <div className="w-full xl:w-8/12">
                  <div className="mb-6 xl:mb-8">
                    <CalendarView
                      appointments={appointments}
                      selectedDate={selectedDate}
                      onDateSelect={handleDateSelection}
                      startDate={startDate}
                      endDate={endDate}
                      currentUser={currentUser}
                      isRangeFilterActive={isRangeFilterActive}
                      onToggleRangeFilter={() => {
                        setIsRangeFilterActive(!isRangeFilterActive);
                        setStartDate(null);
                        setEndDate(null);
                        setCurrentPage(1); // Reset to first page when filter is toggled
                      }}
                      onResetFilters={resetFilters}
                      totalValue={totalValue}
                    />
                  </div>
                </div>
                
                {/* Coluna lateral - Agendamentos filtrados por data */}
                <div className="w-full xl:w-4/12">
                  <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg p-4 sm:p-6 mb-6 sticky top-20">
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#F0B35B]" />
                        Agendamentos
                      </h2>
                      <div className="flex items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={refreshData}
                          className={`p-2 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#252B3B] transition-all duration-300 ${isRefreshing ? 'animate-spin' : ''}`}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-white bg-[#1A1F2E] px-3 py-1.5 rounded-lg">
                        <span className="text-gray-400 mr-2">Total:</span>
                        <span>{calendarFilteredAppointments.length}</span>
                      </div>
                      <div className="text-sm text-white bg-[#1A1F2E] px-3 py-1.5 rounded-lg">
                        <span className="text-gray-400 mr-2">Valor:</span>
                        <span className="text-[#F0B35B] font-medium">R$ {totalValue.toFixed(2)}</span>
                      </div>
                    </div>

                    {calendarFilteredAppointments.length === 0 ? (
                      <div className="bg-[#0D121E] rounded-lg p-6 text-center">
                        <p className="text-gray-400">
                          {isRangeFilterActive
                            ? 'Nenhum agendamento no período selecionado'
                            : 'Nenhum agendamento para esta data'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {calendarCurrentAppointments.map((appointment) => (
                          <AppointmentCardNew
                            key={appointment.id}
                            appointment={appointment}
                            onDelete={() => handleAppointmentAction(appointment.id, 'delete')}
                            onToggleStatus={() => handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
                            onView={() => handleAppointmentAction(appointment.id, 'view')}
                          />
                        ))}
                      </div>
                    )}

                    {/* Paginação */}
                    {/* Paginação removida daqui - agora usando o componente de paginação global */}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="analytics-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {/* Layout melhorado para visualização de analytics */}
              <div className="w-full">
                <div className="mb-6 xl:mb-8">
                  <ClientAnalytics appointments={appointments} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination Controls - Componente único otimizado */}
        {((activeView === 'painel' && filteredAppointments.length > appointmentsPerPage) || 
          (activeView !== 'painel' && calendarFilteredAppointments.length > appointmentsPerPage)) && (
          <div className="flex justify-center mt-6 mb-4">
            <div className="flex items-center space-x-2">
              {/* Previous Page Button */}
              {currentPage > 1 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => paginate(currentPage - 1)}
                  className="p-2 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#252B3B] transition-colors duration-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
              )}

              {/* First Page */}
              {currentPage > 1 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => paginate(currentPage - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1A1F2E] text-white hover:bg-[#252B3B] transition-colors duration-300"
                >
                  {currentPage - 1}
                </motion.button>
              )}

              {/* Current Page */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F0B35B] text-black font-medium transition-colors duration-300"
              >
                {currentPage}
              </motion.button>

              {/* Next Page */}
              {((activeView === 'painel' && currentPage < totalPages) || 
                (activeView !== 'painel' && currentPage < calendarTotalPages)) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => paginate(currentPage + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1A1F2E] text-white hover:bg-[#252B3B] transition-colors duration-300"
                >
                  {currentPage + 1}
                </motion.button>
              )}

              {/* Next Page Button */}
              {((activeView === 'painel' && currentPage < totalPages) || 
                (activeView !== 'painel' && currentPage < calendarTotalPages)) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => paginate(currentPage + 1)}
                  className="p-2 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#252B3B] transition-colors duration-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        )}
      </main>

      <AppointmentViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        appointment={selectedAppointment}
        onDelete={() => {
          if (selectedAppointment) {
            handleAppointmentAction(selectedAppointment.id, 'delete');
            setIsViewModalOpen(false);
          }
        }}
        onToggleStatus={() => {
          if (selectedAppointment) {
            handleAppointmentAction(selectedAppointment.id, 'toggle', selectedAppointment.status);
          }
        }}
      />
    </div>

  );
};

export default DashboardPage;