import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Settings, ArrowLeft } from 'lucide-react';
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
  const { logout, getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRangeFilterActive, setIsRangeFilterActive] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

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
      return;
    }

    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else {
      if (new Date(date) < new Date(startDate)) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
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
              className="p-2 rounded-full bg-[#1A1F2E] text-white hover:bg-[#252B3B] transition-colors duration-300 flex items-center justify-center"
              title="Voltar para o Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="relative"></div>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2 rounded-full bg-[#F0B35B] transition-colors duration-300"
            >
              <Settings className="w-6 h-6 text-black" />
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

        {/* Seção de Filtros e Valores */}
        <div className="bg-[#1A1F2E] p-4 rounded-lg mb-6 shadow-lg border border-[#F0B35B]/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Filtro por Período */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                onClick={() => {
                  setIsRangeFilterActive(!isRangeFilterActive);
                  setStartDate(null);
                  setEndDate(null);
                }}
                className={`px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                  isRangeFilterActive 
                    ? 'bg-[#F0B35B] text-black shadow-lg' 
                    : 'bg-[#252B3B] text-white hover:bg-[#2A3040]'
                }`}
              >
                {isRangeFilterActive ? '✓ Filtro por Período' : 'Filtrar por Período'}
              </button>

              {isRangeFilterActive && (
                <div className="text-[#F0B35B] text-sm font-medium bg-[#252B3B] px-4 py-2 rounded-lg">
                  {startDate && !endDate && `Início: ${new Date(startDate).toLocaleDateString('pt-BR')}`}
                  {startDate && endDate && (
                    <span>
                      {new Date(startDate).toLocaleDateString('pt-BR')} → 
                      {new Date(endDate).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Informações de Valor e Quantidade */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
              <div className="text-gray-400 text-sm">
                Total de agendamentos: 
                <span className="text-white ml-1 font-medium">
                  {filteredAppointments.length}
                </span>
              </div>
              <div className="text-[#F0B35B] text-lg font-bold bg-[#252B3B] px-4 py-2 rounded-lg">
                R$ {totalValue.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Calendário com estilo melhorado */}
        <div className="bg-[#1A1F2E] p-4 rounded-lg mb-6 shadow-lg border border-[#F0B35B]/10">
          <CalendarView
            appointments={appointments}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelection}
            startDate={startDate}
            endDate={endDate}
          />
        </div>

        {/* Lista de Agendamentos */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
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
      </main>
    </div>
  );
};

export default CalendarPage;