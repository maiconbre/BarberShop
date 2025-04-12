import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, ChevronLeft, ChevronRight, LayoutDashboard, RefreshCw, Users } from 'lucide-react';
import AppointmentCardNew from '../components/AppointmentCardNew';
import Stats from '../components/Stats';
import Grafico from '../components/Grafico';
import { useNotifications } from '../components/Notifications';
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
  isBlocked?: boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em millisegundos

const DashboardPage: React.FC = () => {
  const { getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isChartExpanded, setIsChartExpanded] = useState(true);
  const [revenueDisplayMode, setRevenueDisplayMode] = useState('month');
  const [filterMode, setFilterMode] = useState('today');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 9;
  const [activeView, setActiveView] = useState<'painel' | 'agenda' | 'analytics'>('painel');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isRangeFilterActive, setIsRangeFilterActive] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { loadAppointments } = useNotifications();

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
      const lastUpdate = await CacheService.getLastUpdateTime('appointments');
      const now = new Date().getTime();

      if (lastUpdate && (now - new Date(lastUpdate).getTime()) < CACHE_DURATION) {
        console.log('Usando dados em cache');
        return;
      }

      const newAppointments = await loadAppointments(true);
      if (newAppointments && Array.isArray(newAppointments)) {
        setAppointments(newAppointments);
        await CacheService.setLastUpdateTime('appointments', new Date().getTime());
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
  }, []);

  const calculateTotalValue = (apps: Appointment[]) => {
    return apps.reduce((total, app) => total + (app.price || 0), 0);
  };

  const totalValue = calculateTotalValue(calendarFilteredAppointments);

  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const visibleAppointments = filteredAppointments.filter(app => !app.isBlocked);
  const currentAppointments = visibleAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(visibleAppointments.length / appointmentsPerPage);
  const calendarCurrentAppointments = calendarFilteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const calendarTotalPages = Math.ceil(calendarFilteredAppointments.length / appointmentsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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

        const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/appointments/${appointmentId}`, {
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
          setAppointments(prev => prev.filter(app => app.id !== appointmentId));
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
        const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/appointments/${appointmentId}`, {
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
          const updatedAppointments = appointments.map(app =>
            app.id === appointmentId ? { ...app, status: newStatus } : app
          );
          setAppointments(updatedAppointments as Appointment[]);

          if (selectedAppointment?.id === appointmentId) {
            setSelectedAppointment({ ...selectedAppointment, status: newStatus });
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

        const formattedAppointments = await CacheService.fetchWithCache(
          'appointments',
          () => loadAppointments(false),
          false
        );

        if (isSubscribed && Array.isArray(formattedAppointments)) {
          setAppointments(formattedAppointments);
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
  }, [loadAppointments]);

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
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleViewChange('painel')}
              className={`px-4 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 flex-shrink-0 ${activeView === 'painel' ? 'bg-[#F0B35B] text-black font-medium shadow-lg' : 'bg-[#252B3B] text-white hover:bg-[#2E354A]'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-sm whitespace-nowrap">Painel</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleViewChange('agenda')}
              className={`px-4 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 flex-shrink-0 ${activeView === 'agenda' ? 'bg-[#F0B35B] text-black font-medium shadow-lg' : 'bg-[#252B3B] text-white hover:bg-[#2E354A]'}`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-sm whitespace-nowrap">Agenda</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleViewChange('analytics')}
              className={`px-4 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 flex-shrink-0 ${activeView === 'analytics' ? 'bg-[#F0B35B] text-black font-medium shadow-lg' : 'bg-[#252B3B] text-white hover:bg-[#2E354A]'}`}
            >
              <Users className="w-5 h-5" />
              <span className="text-sm whitespace-nowrap">Clientes</span>
            </motion.button>
          </div>
        </div>

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
              <div className="flex flex-col xl:flex-row gap-6 min-h-screen">
                <div className="w-full xl:w-8/12 flex flex-col gap-6">
                  <div className="flex-none">
                    <Stats
                      appointments={appointments}
                      revenueDisplayMode={revenueDisplayMode}
                      setRevenueDisplayMode={setRevenueDisplayMode}
                    />
                  </div>
                  <div className="flex-1 min-h-[500px] xl:min-h-[600px]">
                    <Grafico
                      appointments={appointments}
                      isChartExpanded={isChartExpanded}
                      setIsChartExpanded={setIsChartExpanded}
                    />
                  </div>
                </div>
                <div className="w-full xl:w-4/12">
                  <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg flex flex-col xl:sticky xl:top-24 h-[calc(100vh-8rem)] max-h-[900px]">
                    <div className="flex-none p-4 sm:p-6 border-b border-white/5">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-[#F0B35B]" />
                          Agendamentos
                        </h2>
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={refreshData}
                            className={`p-1.5 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#252B3B] transition-all duration-300 ${isRefreshing ? 'animate-spin text-[#F0B35B]' : ''}`}
                            aria-label="Atualizar"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </motion.button>
                          <div className="relative">
                            <select
                              value={filterMode}
                              onChange={(e) => setFilterMode(e.target.value)}
                              className="appearance-none bg-[#1A1F2E] text-white text-xs rounded-lg px-2 py-1.5 pr-6 focus:outline-none focus:ring-1 focus:ring-[#F0B35B] cursor-pointer hover:bg-[#252B3B] transition-colors"
                            >
                              <option value="today">Hoje</option>
                              <option value="tomorrow">Amanhã</option>
                              <option value="all">Todos</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden">
                      {currentAppointments.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center p-6">
                          <p className="text-gray-400">
                            {filterMode === 'today'
                              ? 'Nenhum agendamento para hoje'
                              : filterMode === 'tomorrow'
                                ? 'Nenhum agendamento para amanhã'
                                : 'Nenhum agendamento encontrado'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 p-4">
                            <div className="grid grid-cols-1 gap-2 auto-rows-max">
                              {currentAppointments.slice(0, 15).map((appointment) => (
                                <AppointmentCardNew
                                  key={appointment.id}
                                  appointment={appointment}
                                  onDelete={() => handleAppointmentAction(appointment.id, 'delete')}
                                  onToggleStatus={() => handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
                                  onView={() => handleAppointmentAction(appointment.id, 'view')}
                                />
                              ))}
                            </div>
                          </div>
                          {totalPages > 1 && (
                            <div className="flex-none p-4 border-t border-white/10 bg-[#1A1F2E]/80 backdrop-blur-sm">
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => paginate(currentPage - 1)}
                                  disabled={currentPage === 1}
                                  className="p-2 rounded-lg bg-[#252B3B] text-white hover:bg-[#2E354A] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                  <span className="text-sm hidden sm:inline">Anterior</span>
                                </button>
                                <div className="flex items-center gap-1.5">
                                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                                    let pageNumber;
                                    if (totalPages <= 5) {
                                      pageNumber = idx + 1;
                                    } else if (currentPage <= 3) {
                                      pageNumber = idx + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                      pageNumber = totalPages - (4 - idx);
                                    } else {
                                      pageNumber = currentPage - 2 + idx;
                                    }
                                    
                                    return (
                                      <button
                                        key={idx}
                                        onClick={() => paginate(pageNumber)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                                          currentPage === pageNumber
                                            ? 'bg-[#F0B35B] text-black'
                                            : 'bg-[#252B3B] text-white hover:bg-[#2E354A]'
                                        }`}
                                      >
                                        {pageNumber}
                                      </button>
                                    );
                                  })}
                                </div>
                                <button
                                  onClick={() => paginate(currentPage + 1)}
                                  disabled={currentPage === totalPages}
                                  className="p-2 rounded-lg bg-[#252B3B] text-white hover:bg-[#2E354A] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                >
                                  <span className="text-sm hidden sm:inline">Próximo</span>
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
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
              className="overflow-hidden"
            >
              <div className="flex flex-col xl:flex-row gap-6 xl:gap-8">
                <div className="w-full xl:w-8/12">
                  <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg p-4 sm:p-6 mb-6">
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
                <div className="w-full xl:w-4/12">
                  <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg p-4 sm:p-6 sticky top-24">
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#F0B35B]" />
                        Agendamentos
                      </h2>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={refreshData}
                          className={`p-1.5 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#252B3B] transition-all duration-300 ${isRefreshing ? 'animate-spin text-[#F0B35B]' : ''}`}
                          aria-label="Atualizar"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </motion.button>
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
                      <div className="bg-[#0D121E] rounded-lg p-6 text-center flex-grow flex items-center justify-center">
                        <p className="text-gray-400">
                          {isRangeFilterActive
                            ? 'Nenhum agendamento no período selecionado'
                            : 'Nenhum agendamento para esta data'}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col flex-grow">
                        <div className="grid grid-cols-1 gap-4 flex-grow overflow-y-auto pr-1 custom-scrollbar hide-scrollbar">
                          {calendarCurrentAppointments.map((appointment) => (
                            <AppointmentCardNew
                              key={appointment.id}
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
                          <div className="flex justify-center items-center space-x-2 mt-4 pt-3 border-t border-white/10">
                            <button
                              onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                              disabled={currentPage === 1}
                              className="p-2 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#252B3B] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-white">
                              {currentPage} / {calendarTotalPages}
                            </span>
                            <button
                              onClick={() => paginate(currentPage < calendarTotalPages ? currentPage + 1 : calendarTotalPages)}
                              disabled={currentPage === calendarTotalPages}
                              className="p-2 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#252B3B] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
                <div className="xl:col-span-8">
                  <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg p-4 sm:p-6">
                    <ClientAnalytics appointments={appointments} />
                  </div>
                </div>
                <div className="xl:col-span-4">
                  <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg p-4 sm:p-6 sticky top-24">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#F0B35B]" />
                        Resumo
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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