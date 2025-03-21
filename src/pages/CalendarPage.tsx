import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppointmentCardNew from '../components/AppointmentCardNew';
import CalendarView from '../components/CalendarView';

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

const CalendarPage: React.FC = () => {
  const { getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isRangeFilterActive, setIsRangeFilterActive] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 8;

  const resetFilters = () => {
    setIsRangeFilterActive(false);
    setStartDate(null);
    setEndDate(null);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setCurrentPage(1); // Reset to first page when filters are reset
  };

  // Função para carregar agendamentos do backend
  const loadAppointments = useCallback(async () => {
    try {
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
      
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/appointments`, {
        method: 'GET',
        headers,
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
  }, [currentUser]);

  // Carrega os agendamentos ao montar o componente e configura o polling
  useEffect(() => {
    loadAppointments();
    const interval = setInterval(loadAppointments, 30000);
    return () => clearInterval(interval);
  }, [loadAppointments]);

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

  const calculateTotalValue = (apps: Appointment[]) => {
    return apps.reduce((total, app) => total + (app.price || 0), 0);
  };

  // Modifica a lógica de filtro para suportar intervalo de datas
  const filteredAppointments = appointments.filter(app => {
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

  const totalValue = calculateTotalValue(filteredAppointments);

  // Pagination logic
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Gerencia ações de completar, deletar ou alternar status dos agendamentos
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

  return (
    <div className="min-h-screen bg-[#0D121E] pt-18 relative overflow-hidden">
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
        {/* Header com navegação */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-white">Agenda</h1>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#F0B35B] hover:text-black transition-colors duration-300 flex items-center justify-center gap-2 font-medium border border-[#F0B35B]/30 shadow-lg"
              title="Voltar para o Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </motion.button>
        </div>
      </div>

        {/* Calendário unificado com filtros e estatísticas */}
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

        {/* Lista de Agendamentos */}
        <div className="my-4">
          <AnimatePresence>
            {currentAppointments.length > 0 ? (
              currentAppointments.map((appointment) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="mb-2"
                >
                  <AppointmentCardNew
                    appointment={appointment}
                    onDelete={() => handleAppointmentAction(appointment.id, 'delete')}
                    onToggleStatus={() => handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
                    filterMode="all"
                    revenueDisplayMode="total"
                    appointments={appointments}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#1A1F2E] p-6 rounded-lg text-center border border-[#F0B35B]/10"
              >
                <p className="text-gray-400">
                  Nenhum agendamento encontrado para este período
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination Controls */}
        {filteredAppointments.length > appointmentsPerPage && (
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
              
              {/* Separator */}
              <span className="text-gray-400">.</span>
              
              {/* Next Page */}
              {currentPage < totalPages && (
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
              {currentPage < totalPages && (
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
    </div>
  );
};

export default CalendarPage;