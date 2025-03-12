import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Calendar } from 'lucide-react';
import AppointmentCardNew from '../components/AppointmentCardNew';
import Stats from '../components/Stats';
import Grafico from '../components/Grafico';
import Notifications, { useNotifications } from '../components/Notifications';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Appointment {
  id: string;
  date: string;
  status: 'completed' | 'pending' | 'confirmed';
  clientName: string;
  service: string;
  time: string;
  price: number;
  barberName: string;
}

type RevenueDisplayMode = 'day' | 'week' | 'month';
type FilterMode = 'today' | 'tomorrow' | 'all';
type AppointmentAction = 'complete' | 'delete' | 'toggle';

const API_URL = (import.meta as any).env.VITE_API_URL;

const DashboardPage: React.FC = () => {
  const { logout, getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isChartExpanded, setIsChartExpanded] = useState<boolean>(true);
  const [revenueDisplayMode, setRevenueDisplayMode] = useState<RevenueDisplayMode>('month');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Modifique a função de consulta para extrair os dados corretamente
  const { data: appointmentsResponse = { success: true, data: [] }, isLoading } = useQuery<{ success: boolean, data: Appointment[] }>({
    queryKey: ['appointments'],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_URL}/api/appointments`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar agendamentos');
        }

        const data = await response.json();
        console.log('Dados carregados:', data);
        return data;
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });

  // Extraia os appointments do response
  const appointments = appointmentsResponse.data || [];

  // Modifique o useMemo para usar o array correto
  const filteredAppointments = useMemo(() => {
    console.log('Appointments recebidos:', appointments);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      .toISOString()
      .split('T')[0];
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      .toISOString()
      .split('T')[0];

    return appointments.filter(app => {
      if (filterMode === 'today') return app.date === today;
      if (filterMode === 'tomorrow') return app.date === tomorrow;
      return true;
    });
  }, [appointments, filterMode]);

  // Rola para o topo ao montar o componente
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Atualiza o cache dos agendamentos de forma otimista após ações
  const handleAppointmentAction = useCallback(
    async (
      appointmentId: string,
      action: AppointmentAction,
      currentStatus?: string
    ) => {
      if (!appointmentId) return;
      try {
        if (action === 'delete') {
          const response = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: 'Bearer ' + localStorage.getItem('token'),
            },
            mode: 'cors',
          });
          if (response.ok) {
            queryClient.setQueryData<Appointment[]>(['appointments'], oldAppointments =>
              oldAppointments ? oldAppointments.filter(app => app.id !== appointmentId) : []
            );
          }
        } else {
          const newStatus =
            action === 'complete'
              ? 'completed'
              : currentStatus === 'completed'
                ? 'pending'
                : 'completed';
          const response = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: 'Bearer ' + localStorage.getItem('token'),
            },
            mode: 'cors',
            body: JSON.stringify({ status: newStatus }),
          });
          if (response.ok) {
            queryClient.setQueryData<Appointment[]>(['appointments'], oldAppointments =>
              oldAppointments
                ? oldAppointments.map(app =>
                  app.id === appointmentId ? { ...app, status: newStatus } : app
                )
                : []
            );
          }
        }
      } catch (error) {
        console.error(`Erro na ação ${action}:`, error);
      }
    },
    [queryClient]
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token não encontrado');
      navigate('/login');
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D121E] pt-16 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D121E] pt-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#F0B35B]/5 to-transparent rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>
      <div className="absolute inset-0 opacity-5">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'linear-gradient(90deg, #F0B35B 1px, transparent 1px), linear-gradient(180deg, #F0B35B 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-white">Painel de Controle</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Notifications />
            </div>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="p-2 rounded-full bg-[#F0B35B] transition-colors duration-300"
              >
                <Settings className="w-6 h-6 text-black" />
              </button>
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="fixed sm:absolute top-[20%] sm:top-full left-[50%] sm:left-auto right-auto sm:right-0 transform-gpu -translate-x-1/2 sm:translate-x-0 mt-0 sm:mt-4 w-[90vw] sm:w-[350px] md:w-[400px] max-h-[70vh] xs:max-h-[75vh] sm:max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl bg-[#1A1F2E] ring-1 ring-[#F0B35B]/20 z-50 animate-fade-in-up">
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
                      {currentUser?.role === 'admin' && (
                        <button
                          onClick={() => navigate('/register')}
                          className="flex w-full items-center text-left px-4 py-3 text-sm text-white hover:bg-[#252B3B] transition-colors"
                          role="menuitem"
                        >
                          <span>Gerenciar Barbeiros</span>
                        </button>
                      )}
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
        {/* Estatísticas e Gráficos */}
        <div className="mb-6"><Stats
          appointments={appointments}
          revenueDisplayMode={revenueDisplayMode}
          setRevenueDisplayMode={setRevenueDisplayMode}
        />
          <Grafico
            appointments={appointments}
            isChartExpanded={isChartExpanded}
            setIsChartExpanded={setIsChartExpanded}
          />             
          </div>
        {/* Filtros de agendamentos */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Total: {filteredAppointments.length}</span>
          </div>
          <div className="flex flex-row items-center justify-start gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setFilterMode('today');
                setRevenueDisplayMode('day'); // Garantir que ambos os estados são atualizados
              }}
              className={`w-full sm:w-auto px-4 py-2 rounded-md transition-all duration-300 ${filterMode === 'today'
                  ? 'bg-[#F0B35B] text-black'
                  : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'
                }`}
            >
              Hoje
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterMode('tomorrow')}
              className={`w-full sm:w-auto px-4 py-2 rounded-md transition-all duration-300 ${filterMode === 'tomorrow'
                  ? 'bg-[#F0B35B] text-black'
                  : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'
                }`}
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

        {/* Lista de Agendamentos */}
        <div className="space-y-4 mb-8">
          <AnimatePresence mode="wait">
            {filteredAppointments.length > 0 ? (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {filteredAppointments.map(appointment => (
                  <AppointmentCardNew
                    key={appointment.id}
                    appointment={appointment}
                    onDelete={() => handleAppointmentAction(appointment.id, 'delete')}
                    onToggleStatus={() =>
                      handleAppointmentAction(appointment.id, 'toggle', appointment.status)
                    }
                    filterMode={filterMode}
                    revenueDisplayMode={revenueDisplayMode}
                    appointments={appointments}
                  />
                ))}
              </motion.div>
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
};

export default memo(DashboardPage);
