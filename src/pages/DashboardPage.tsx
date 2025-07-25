import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  LayoutDashboard,
  RefreshCw,
  Users,
  Scissors,
  UserCog,
  Lock,
  MessageSquare,
  Clock,
  X,
  LogOut,
  Home,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ArrowLeft,
  ArrowRight,
  User
} from 'lucide-react';
import AppointmentCardNew from '../components/feature/AppointmentCardNew';
import Stats from '../components/feature/Stats';
import ClientAnalytics from '../components/feature/ClientAnalytics';
import { useNotifications } from '../components/ui/Notifications';
import Notifications from '../components/ui/Notifications';
import AppointmentViewModal from '../components/feature/AppointmentViewModal';
import CalendarView from '../components/feature/CalendarView';
import { cacheService } from '../services/CacheService';

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
  isBlocked?: boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em millisegundos
const APPOINTMENTS_PER_PAGE = 6; // Número de agendamentos por página

const DashboardPage: React.FC = () => {
  const { getCurrentUser, logout } = useAuth();
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [revenueDisplayMode, setRevenueDisplayMode] = useState('month');
  const [filterMode, setFilterMode] = useState('today');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Removido sistema de páginas carregadas - agora mostra apenas 2 botões por vez
  const [activeView, setActiveView] = useState<'painel' | 'agenda' | 'analytics'>('painel');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isRangeFilterActive, setIsRangeFilterActive] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { loadAppointments } = useNotifications();

  // Detectar mudanças no tamanho da tela com breakpoints otimizados
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;

      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        setIsSidebarOpen(false);
        setIsSidebarCollapsed(false);
      } else {
        setIsSidebarOpen(true);
        // Auto-collapse sidebar em telas médias para mais espaço
        setIsSidebarCollapsed(tablet);
      }
    };

    // Configuração inicial
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Funções de navegação
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateToPage = (path: string) => {
    navigate(path);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const filteredAppointments = useMemo(() => {
    if (!appointments.length) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().split('T')[0];

    if (filterMode === 'today') {
      return appointments.filter(app => app.date === today);
    } else if (filterMode === 'tomorrow') {
      return appointments.filter(app => app.date === tomorrow);
    }
    return appointments;
  }, [appointments, filterMode]);

  const calendarFilteredAppointments = useMemo(() => {
    if (!appointments.length) return [];

    return appointments.filter(app => {
      if (app.isBlocked) return false;

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
  }, [appointments, selectedDate, isRangeFilterActive, startDate, endDate]);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const lastUpdate = await cacheService.get('appointments_last_update');
      const now = new Date().getTime();

      if (lastUpdate && (now - (typeof lastUpdate === 'string' ? new Date(lastUpdate).getTime() : 0)) < CACHE_DURATION) {
        console.log('Usando dados em cache');
        return;
      }

      const newAppointments = await loadAppointments(true);
      if (newAppointments && Array.isArray(newAppointments)) {
        setAppointments(newAppointments);
        await cacheService.set('appointments_last_update', new Date().getTime().toString());
      }
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadAppointments]);

  const handleViewChange = useCallback((view: 'painel' | 'agenda' | 'analytics') => {
    setCurrentPage(1);
    if (view !== 'agenda') {
      setIsRangeFilterActive(false);
      setStartDate(null);
      setEndDate(null);
    }
    setActiveView(view);
    // Fechar sidebar em mobile ao clicar nos itens do menu
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  const calculateTotalValue = (apps: Appointment[]) => {
    return apps.reduce((total, app) => total + (app.price || 0), 0);
  };

  const totalValue = calculateTotalValue(calendarFilteredAppointments);

  const indexOfLastAppointment = currentPage * APPOINTMENTS_PER_PAGE;
  const indexOfFirstAppointment = indexOfLastAppointment - APPOINTMENTS_PER_PAGE;
  const visibleAppointments = filteredAppointments.filter(app => !app.isBlocked);
  const currentAppointments = visibleAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(visibleAppointments.length / APPOINTMENTS_PER_PAGE);
  const calendarCurrentAppointments = calendarFilteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const calendarTotalPages = Math.ceil(calendarFilteredAppointments.length / APPOINTMENTS_PER_PAGE);

  // Sistema de paginação simplificado
  const paginate = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  // Resetar página quando mudar de view
  useEffect(() => {
    setCurrentPage(1);
  }, [activeView, filterMode]);

  const handleDateSelection = (date: string) => {
    if (!isRangeFilterActive) {
      setSelectedDate(date);
      setCurrentPage(1);
      return;
    }

    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
      setCurrentPage(1);
    } else {
      if (new Date(date) < new Date(startDate)) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
      setCurrentPage(1);
    }
  };

  const resetFilters = () => {
    setIsRangeFilterActive(false);
    setStartDate(null);
    setEndDate(null);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setCurrentPage(1);
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'complete' | 'delete' | 'toggle' | 'view', currentStatus?: string) => {
    if (!appointmentId) return;
    try {
      if (action === 'view') {
        const appointment = appointments.find(app => app.id === appointmentId);
        if (appointment) {
          setSelectedAppointment(appointment);
          setIsViewModalOpen(true);

          const viewedAppointmentIds = JSON.parse(localStorage.getItem('viewedAppointments') || '[]');
          if (!viewedAppointmentIds.includes(appointmentId)) {
            viewedAppointmentIds.push(appointmentId);
            localStorage.setItem('viewedAppointments', JSON.stringify(viewedAppointmentIds));
          }
        }
        return;
      }

      if (action === 'delete') {
        // Verifica se o ID é válido antes de fazer a requisição
        if (!appointmentId.trim()) {
          console.error('ID do agendamento inválido');
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointmentId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          mode: 'cors'
        });

        // Verifica se a resposta foi bem-sucedida
        if (response.ok) {
          // Usar o callback de atualização de estado para garantir que estamos trabalhando com o estado mais recente
          setAppointments(prevAppointments => prevAppointments.filter(app => app.id !== appointmentId));

          if (selectedAppointment?.id === appointmentId) {
            setIsViewModalOpen(false);
            setSelectedAppointment(null);
          }
        } else {
          // Se a resposta não for ok, tenta obter mais informações do erro
          const errorData = await response.json().catch(() => null);
          console.error('Erro ao deletar agendamento:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
          throw new Error(`Erro ao deletar agendamento: ${response.status} ${response.statusText}`);
        }
      } else {
        const newStatus = action === 'complete' ? 'completed' : (currentStatus === 'completed' ? 'pending' : 'completed');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointmentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          mode: 'cors',
          body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
          // Usar o callback de atualização de estado para garantir que estamos trabalhando com o estado mais recente
          setAppointments(prevAppointments =>
            prevAppointments.map(app =>
              app.id === appointmentId ? { ...app, status: newStatus } : app
            )
          );

          // Atualizar o agendamento selecionado se necessário
          if (selectedAppointment?.id === appointmentId) {
            setSelectedAppointment(prev => prev ? { ...prev, status: newStatus } : null);
          }
        } else {
          const errorData = await response.json().catch(() => null);
          console.error('Erro ao atualizar status:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
          throw new Error(`Erro ao atualizar status: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error(`Erro na ação ${action}:`, error);
      // Aqui você pode adicionar uma notificação visual para o usuário
      // Por exemplo, usando um toast ou alert
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    let retryTimeout: NodeJS.Timeout | null = null;

    const fetchData = async (retryCount = 0) => {
      if (!isSubscribed) return;

      try {
        if (!navigator.onLine) {
          console.log('Dispositivo offline, usando dados em cache');
          return;
        }

        // Usar memoização para evitar re-renderizações desnecessárias
        const formattedAppointments = await cacheService.fetchWithCache(
          'appointments',
          () => loadAppointments(false),
          { forceRefresh: false }
        );

        if (isSubscribed && Array.isArray(formattedAppointments)) {
          // Otimização: comparar arrays antes de atualizar o estado
          const currentIds = appointments.map(app => app.id).sort().join(',');
          const newIds = formattedAppointments.map(app => app.id).sort().join(',');

          if (currentIds !== newIds || appointments.length !== formattedAppointments.length) {
            setAppointments(formattedAppointments);
          }
        }
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);

        if (error.response?.status === 429 || (typeof error === 'object' && error.message?.includes('429'))) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 60000);
          console.warn(`Erro 429, tentando novamente em ${delay / 1000}s`);

          if (retryCount < 5) {
            retryTimeout = setTimeout(() => fetchData(retryCount + 1), delay);
          }
        } else {
          setAppointments([]);
        }
      }
    };

    const initialFetchTimeout = setTimeout(() => fetchData(), 500);

    return () => {
      isSubscribed = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      clearTimeout(initialFetchTimeout);
    };
  }, [loadAppointments, appointments]);

  useEffect(() => {
    console.log('Estado atual de appointments:', appointments);
  }, [appointments]);

  useEffect(() => {
    const handleOpenAppointmentModal = (event: CustomEvent) => {
      const { appointmentId } = event.detail;
      if (appointmentId) {
        handleAppointmentAction(appointmentId, 'view');
      }
    };

    window.addEventListener('openAppointmentModal', handleOpenAppointmentModal as EventListener);

    return () => {
      window.removeEventListener('openAppointmentModal', handleOpenAppointmentModal as EventListener);
    };
  }, [appointments]);

  useEffect(() => {
    if (revenueDisplayMode === 'day') {
      setFilterMode('today');
    } else if (revenueDisplayMode === 'week') {
      setFilterMode('all');
    } else if (revenueDisplayMode === 'month') {
      setFilterMode('all');
    }
    setCurrentPage(1);
  }, [revenueDisplayMode]);

  return (
    <div className="min-h-screen bg-[#0D121E] relative overflow-hidden">
      {/* Custom Styles */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #F0B35B20 transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #F0B35B30;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F0B35B50;
        }
        .optimize-scroll {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }
        @media (min-width: 768px) {
          .card-grid {
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.25rem;
          }
        }
        @media (min-width: 1024px) {
          .card-grid {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
          }
        }
        .glass-effect {
          background: rgba(13, 18, 30, 0.95);
        }
        @media (min-width: 768px) {
          .glass-effect {
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
          }
        }
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(240, 179, 91, 0.15);
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .loading-shimmer {
          background: linear-gradient(90deg, #1A1F2E 25%, #252B3B 50%, #1A1F2E 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .refresh-icon-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      {/* Background elements - Otimizado para mobile */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#F0B35B]/8 to-transparent rounded-full blur-xl translate-x-1/2 -translate-y-1/2 hidden md:block"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#F0B35B]/5 to-transparent rounded-full blur-lg -translate-x-1/3 translate-y-1/3 md:w-96 md:h-96 md:blur-xl"></div>

      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: 'linear-gradient(90deg, #F0B35B 1px, transparent 1px), linear-gradient(180deg, #F0B35B 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0D121E]/95 glass-effect border-b border-[#F0B35B]/20">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#F0B35B] rounded-md flex items-center justify-center">
                <Scissors className="w-3 h-3 text-black" />
              </div>
              <h1 className="text-lg font-semibold text-white">
                {activeView === 'painel' ? 'Painel' : activeView === 'agenda' ? 'Agenda' : 'Relatórios'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-[#1A1F2E] text-white hover:bg-[#252B3B] transition-colors duration-200 flex-shrink-0 border border-[#F0B35B]/30">
                <Notifications />
              </div>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-full bg-[#1A1F2E] text-white hover:bg-[#252B3B] transition-colors duration-200 flex-shrink-0 border border-[#F0B35B]/30"
              >
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || !isMobile) && (
          <>
            {/* Mobile Overlay */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <motion.div
              initial={{ 
                opacity: 0,
                x: isMobile ? 288 : 0 // 72 * 4 = 288px (w-72)
              }}
              animate={{ 
                opacity: 1,
                x: 0
              }}
              exit={{ 
                opacity: 0,
                x: isMobile ? 288 : 0
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`fixed top-0 h-screen max-h-screen bg-gradient-to-b from-[#1A1F2E] to-[#252B3B] z-50 glass-effect flex flex-col ${
                isMobile 
                  ? 'right-0 w-72 border-l border-[#F0B35B]/20 rounded-l-2xl shadow-2xl' 
                  : isSidebarCollapsed 
                    ? 'left-0 w-16 border-r border-[#F0B35B]/20' 
                    : 'left-0 w-64 border-r border-[#F0B35B]/20'
              } transition-all duration-300`}
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-[#F0B35B]/20">
                {isMobile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#F0B35B] to-[#E6A555] rounded-full flex items-center justify-center shadow-lg">
                        <User className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <h2 className="text-white font-semibold text-base">Perfil</h2>
                        <p className="text-gray-300 text-sm">{currentUser?.name || 'Usuário'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-2 rounded-full bg-[#252B3B] text-gray-400 hover:text-white hover:bg-[#2E354A] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    {!isSidebarCollapsed && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#F0B35B] rounded-lg flex items-center justify-center shadow-lg">
                          <Scissors className="w-4 h-4 text-black" />
                        </div>
                        <div>
                          <h2 className="text-white font-semibold text-sm">BarberGR</h2>
                          <p className="text-gray-400 text-xs">{currentUser?.name || 'Usuário'}</p>
                        </div>
                      </div>
                    )}
                    {isSidebarCollapsed && (
                      <div className="w-8 h-8 bg-[#F0B35B] rounded-lg flex items-center justify-center shadow-lg mx-auto">
                        <Scissors className="w-4 h-4 text-black" />
                      </div>
                    )}
                    <button
                      onClick={toggleSidebar}
                      className="p-2 rounded-lg bg-[#252B3B] text-white hover:bg-[#2E354A] transition-colors duration-200 shadow-sm flex-shrink-0"
                    >
                      {isSidebarCollapsed ? (
                        <ArrowRight className="w-4 h-4" />
                      ) : (
                        <ArrowLeft className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Menu */}
              <div className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar min-h-0">
                {/* Dashboard Views */}
                <div className="space-y-1">
                  {!isSidebarCollapsed && (
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Dashboard</p>
                  )}

                  <button
                    onClick={() => handleViewChange('painel')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-200 ${activeView === 'painel'
                        ? 'bg-[#F0B35B] text-black font-medium shadow-lg'
                        : 'text-white hover:bg-[#252B3B] hover:shadow-md'
                      }`}
                    title={isSidebarCollapsed ? 'Painel Principal' : ''}
                  >
                    <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm font-medium">Painel Principal</span>}
                  </button>

                  <button
                    onClick={() => handleViewChange('agenda')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-200 ${activeView === 'agenda'
                        ? 'bg-[#F0B35B] text-black font-medium shadow-lg'
                        : 'text-white hover:bg-[#252B3B] hover:shadow-md'
                      }`}
                    title={isSidebarCollapsed ? 'Agenda' : ''}
                  >
                    <Calendar className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm font-medium">Agenda</span>}
                  </button>

                  <button
                    onClick={() => handleViewChange('analytics')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-200 ${activeView === 'analytics'
                        ? 'bg-[#F0B35B] text-black font-medium shadow-lg'
                        : 'text-white hover:bg-[#252B3B] hover:shadow-md'
                      }`}
                    title={isSidebarCollapsed ? 'Relatórios' : ''}
                  >
                    <Users className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm font-medium">Relatórios</span>}
                  </button>
                </div>

                {/* Management Section */}
                <div className="space-y-1 pt-4">
                  {!isSidebarCollapsed && (
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Gerenciamento</p>
                  )}

                  <button
                    onClick={() => navigateToPage('/servicos')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-white hover:bg-[#252B3B] hover:shadow-md transition-all duration-200`}
                    title={isSidebarCollapsed ? 'Serviços' : ''}
                  >
                    <Scissors className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm">Serviços</span>}
                  </button>

                  <button
                    onClick={() => navigateToPage('/register')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-white hover:bg-[#252B3B] hover:shadow-md transition-all duration-200`}
                    title={isSidebarCollapsed ? 'Barbeiros' : ''}
                  >
                    <UserCog className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm">Barbeiros</span>}
                  </button>

                  <button
                    onClick={() => navigateToPage('/gerenciar-horarios')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-white hover:bg-[#252B3B] hover:shadow-md transition-all duration-200`}
                    title={isSidebarCollapsed ? 'Horários' : ''}
                  >
                    <Clock className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm">Horários</span>}
                  </button>

                  <button
                    onClick={() => navigateToPage('/gerenciar-comentarios')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-white hover:bg-[#252B3B] hover:shadow-md transition-all duration-200`}
                    title={isSidebarCollapsed ? 'Comentários' : ''}
                  >
                    <MessageSquare className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm">Comentários</span>}
                  </button>
                </div>

                {/* Settings Section */}
                <div className="space-y-1 pt-4">
                  {!isSidebarCollapsed && (
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Configurações</p>
                  )}

                  <button
                    onClick={() => navigateToPage('/trocar-senha')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-white hover:bg-[#252B3B] hover:shadow-md transition-all duration-200`}
                    title={isSidebarCollapsed ? 'Alterar Senha' : ''}
                  >
                    <Lock className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm">Alterar Senha</span>}
                  </button>

                  <button
                    onClick={() => navigateToPage('/')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-white hover:bg-[#252B3B] hover:shadow-md transition-all duration-200`}
                    title={isSidebarCollapsed ? 'Ir para Site' : ''}
                  >
                    <Home className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm">Ir para Site</span>}
                  </button>
                </div>
              </div>

              {/* User Profile Section */}
              {!isSidebarCollapsed && (
                <div className="p-4 border-t border-[#F0B35B]/20 flex-shrink-0">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#252B3B]/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#F0B35B] to-[#E6A555] rounded-full flex items-center justify-center shadow-lg">
                      <UserCog className="w-4 h-4 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {currentUser?.name || 'Usuário'}
                      </p>
                      <p className="text-xs text-gray-400">Barbeiro</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Logout Button */}
              <div className="p-4 border-t border-[#F0B35B]/20 flex-shrink-0">
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-200 shadow-sm`}
                  title={isSidebarCollapsed ? 'Sair' : ''}
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  {!isSidebarCollapsed && <span className="text-sm font-medium">Sair</span>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`relative z-10 transition-all duration-300 ${isMobile
          ? 'pt-16 px-3'
          : isSidebarCollapsed
            ? 'ml-16 p-4 lg:p-6'
            : 'ml-64 p-4 lg:p-6'
        }`}>

        <div className="max-w-[1600px] mx-auto">
          <AnimatePresence mode="wait">
            {activeView === 'painel' ? (
              <motion.div
                key="painel-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col"
              >
                {/* Layout Desktop Otimizado */}
                <div className={`flex-1 flex ${isMobile ? 'flex-col gap-4' : 'gap-6 h-full'}`}>
                  {/* Seção Esquerda - Stats */}
                  <div className={`${isMobile ? 'w-full' : 'w-1/2 flex flex-col'}`}>
                    <Stats
                      appointments={appointments}
                      revenueDisplayMode={revenueDisplayMode}
                      setRevenueDisplayMode={setRevenueDisplayMode}
                    />
                  </div>

                  {/* Seção Direita - Agendamentos */}
                  <div className={`${isMobile ? 'w-full' : 'w-1/2 flex flex-col'}`}>
                    <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-[#F0B35B]" />
                          Agendamentos Recentes
                        </h2>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={refreshData}
                            className="p-2 rounded-lg bg-[#F0B35B] text-black hover:bg-[#F0B35B]/90 transition-colors"
                            aria-label="Atualizar"
                          >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'refresh-icon-spin' : ''}`} />
                          </button>
                          <select
                            value={filterMode}
                            onChange={(e) => setFilterMode(e.target.value)}
                            className="appearance-none bg-[#252B3B] text-white text-xs sm:text-sm rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 pr-6 sm:pr-8 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] cursor-pointer"
                          >
                            <option value="today">Hoje</option>
                            <option value="tomorrow">Amanhã</option>
                            <option value="all">Todos</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col">
                        {currentAppointments.length === 0 ? (
                          <div className="text-center py-8 flex-1 flex flex-col justify-center">
                            <div className="w-20 h-20 bg-[#252B3B] rounded-full flex items-center justify-center mx-auto mb-4">
                              <Calendar className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-gray-400 text-lg mb-2">
                              {filterMode === 'today'
                                ? 'Nenhum agendamento para hoje'
                                : filterMode === 'tomorrow'
                                  ? 'Nenhum agendamento para amanhã'
                                  : 'Nenhum agendamento encontrado'}
                            </p>
                            <p className="text-gray-500 text-sm">
                              {filterMode === 'today' ? 'Aproveite para organizar sua agenda!' : 'Tente ajustar os filtros'}
                            </p>
                          </div>
                        ) : (
                          <div className={`flex-1 overflow-y-auto ${isMobile ? 'card-grid' : 'space-y-3 pr-2'}`}>
                            {currentAppointments.map((appointment) => (
                              <AppointmentCardNew
                                key={`appointment-${appointment.id}-${appointment.status}`}
                                appointment={appointment}
                                onDelete={() => handleAppointmentAction(appointment.id, 'delete')}
                                onToggleStatus={() => handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
                                onView={() => handleAppointmentAction(appointment.id, 'view')}
                                className={isMobile ? '' : 'h-fit'}
                              />
                            ))}

                            {totalPages > 1 && (
                              <div className={`${isMobile ? 'mt-8 pt-6 border-t border-[#F0B35B]/10' : 'mt-4 pt-4 border-t border-[#F0B35B]/10'}`}>
                                <div className="flex justify-center items-center gap-2">
                                  {/* Botão página anterior */}
                                  <button
                                    onClick={() => {
                                      const prevPage = currentPage - 1;
                                      if (prevPage >= 1) {
                                        paginate(prevPage);
                                      }
                                    }}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg bg-[#252B3B] text-white hover:bg-[#2E354A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>

                                  {/* Páginas limitadas a 2 botões */}
                                  {(() => {
                                    const startPage = Math.max(1, currentPage - 1);
                                    const endPage = Math.min(totalPages, startPage + 1);
                                    const pages = [];
                                    for (let i = startPage; i <= endPage; i++) {
                                      pages.push(i);
                                    }
                                    return pages.map((number) => (
                                      <button
                                        key={number}
                                        onClick={() => paginate(number)}
                                        className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${currentPage === number
                                            ? 'bg-[#F0B35B] text-black shadow-lg'
                                            : 'bg-[#252B3B] text-white hover:bg-[#2E354A] hover:shadow-md'
                                          }`}
                                      >
                                        {number}
                                      </button>
                                    ));
                                  })()}

                                  {/* Indicador de mais páginas */}
                                  {currentPage + 1 < totalPages && (
                                    <span className="text-gray-400 px-2 text-sm">...</span>
                                  )}

                                  {/* Botão próxima página */}
                                  <button
                                    onClick={() => {
                                      const nextPage = currentPage + 1;
                                      if (nextPage <= totalPages) {
                                        paginate(nextPage);
                                      }
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg bg-[#252B3B] text-white hover:bg-[#2E354A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
                className="space-y-6"
              >
                <div className="flex items-center justify-end mb-4">
                  <div className="text-xs text-gray-400 mt-2 mr-4">
                    {new Date().toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                <div className={`flex flex-col gap-4 ${isMobile ? '' : isTablet ? 'lg:flex-row lg:gap-6' : 'xl:flex-row xl:gap-8'
                  }`}>
                  <div className={`w-full ${isMobile ? '' : isTablet ? 'lg:w-7/12' : 'xl:w-8/12'
                    }`}>
                    <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
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
                          setCurrentPage(1);
                        }}
                        onResetFilters={resetFilters}
                        totalValue={totalValue}
                      />
                    </div>
                  </div>
                  <div className={`w-full ${isMobile ? '' : isTablet ? 'lg:w-5/12' : 'xl:w-4/12'
                    }`}>
                    <div className={`bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 ${isMobile ? '' : 'sticky top-24'
                      }`}>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#F0B35B]" />
                          Agendamentos
                        </h2>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={refreshData}
                            className={`p-1.5 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#252B3B] transition-all duration-300 ${isRefreshing ? 'text-[#F0B35B]' : ''}`}
                            aria-label="Atualizar"
                          >
                            <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isRefreshing ? 'refresh-icon-spin' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="text-xs sm:text-sm text-white bg-[#1A1F2E] px-2 sm:px-3 py-1.5 rounded-lg">
                          <span className="text-gray-400 mr-1 sm:mr-2">Total:</span>
                          <span>{calendarFilteredAppointments.length}</span>
                        </div>
                        <div className="text-xs sm:text-sm text-white bg-[#1A1F2E] px-2 sm:px-3 py-1.5 rounded-lg">
                          <span className="text-gray-400 mr-1 sm:mr-2">Valor:</span>
                          <span className="text-[#F0B35B] font-medium">R$ {totalValue.toFixed(2)}</span>
                        </div>
                      </div>

                      {calendarFilteredAppointments.length === 0 ? (
                        <div className="bg-[#0D121E] rounded-lg p-4 sm:p-6 text-center flex-grow flex items-center justify-center">
                          <p className="text-gray-400 text-sm">
                            {isRangeFilterActive
                              ? 'Nenhum agendamento no período selecionado'
                              : 'Nenhum agendamento para esta data'}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col flex-grow">
                          <div className={`grid grid-cols-1 gap-3 sm:gap-4 ${isMobile
                              ? 'max-h-[60vh]'
                              : 'max-h-[calc(100vh-20rem)]'
                            } overflow-y-auto pr-1 custom-scrollbar optimize-scroll`} style={{ transform: 'translate3d(0,0,0)' }}>
                            {calendarCurrentAppointments.map((appointment) => (
                              <AppointmentCardNew
                                key={`calendar-appointment-${appointment.id}-${appointment.status}`}
                                appointment={appointment}
                                onDelete={() => handleAppointmentAction(appointment.id, 'delete')}
                                onToggleStatus={() => handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
                                onView={() => handleAppointmentAction(appointment.id, 'view')}
                              />
                            ))}
                            {calendarCurrentAppointments.length > 0 && calendarCurrentAppointments.length < 3 &&
                              Array.from({ length: 3 - calendarCurrentAppointments.length }).map((_, index) => (
                                <div key={`empty-${index}`} className="h-[104px] bg-[#1A1F2E]/30 rounded-xl border border-white/5 border-l-4 border-l-gray-700/30"></div>
                              ))
                            }
                          </div>
                          {calendarTotalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-4 pt-3 border-t border-white/10">
                              {/* Botão página anterior */}
                              <button
                                onClick={() => {
                                  const prevPage = currentPage - 1;
                                  if (prevPage >= 1) {
                                    paginate(prevPage);
                                  }
                                }}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#252B3B] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>

                              {/* Páginas limitadas a 2 botões */}
                              {(() => {
                                const startPage = Math.max(1, currentPage - 1);
                                const endPage = Math.min(calendarTotalPages, startPage + 1);
                                const pages = [];
                                for (let i = startPage; i <= endPage; i++) {
                                  pages.push(i);
                                }
                                return pages.map((number) => (
                                  <button
                                    key={number}
                                    onClick={() => paginate(number)}
                                    className={`px-3 py-2 rounded-lg transition-all text-sm ${currentPage === number
                                        ? 'bg-[#F0B35B] text-black font-medium'
                                        : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'
                                      }`}
                                  >
                                    {number}
                                  </button>
                                ));
                              })()}

                              {/* Indicador de mais páginas */}
                              {currentPage + 1 < calendarTotalPages && (
                                <span className="text-gray-400 px-1 text-xs">...</span>
                              )}

                              {/* Botão próxima página */}
                              <button
                                onClick={() => {
                                  const nextPage = currentPage + 1;
                                  if (nextPage <= calendarTotalPages) {
                                    paginate(nextPage);
                                  }
                                }}
                                disabled={currentPage === calendarTotalPages}
                                className="p-2 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#252B3B] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
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
                className="h-full flex flex-col"
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg border border-[#F0B35B]/10 flex-1 flex flex-col overflow-hidden"
                >
                  <div className="p-3 sm:p-4 border-b border-white/10">
                    <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[#F0B35B]" />
                      Dashboard Analítico
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                      Insights do seu negócio
                    </p>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ClientAnalytics appointments={appointments} />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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

export default React.memo(DashboardPage);