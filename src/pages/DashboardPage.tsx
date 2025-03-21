import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import AppointmentCardNew from '../components/AppointmentCardNew';
import Stats from '../components/Stats';
import Grafico from '../components/Grafico';
import Notifications, { useNotifications } from '../components/Notifications';
import AppointmentViewModal from '../components/AppointmentViewModal';

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
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [revenueDisplayMode, setRevenueDisplayMode] = useState('month');
  const [filterMode, setFilterMode] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Modal state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 8;

  // Usando o hook de notificações
  const { loadAppointments } = useNotifications();

  // Usando o hook personalizado para filtrar agendamentos
  const filteredAppointments = useFilteredAppointments(appointments, filterMode);
  
  // Pagination logic
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);

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

    const fetchData = async () => {
      if (!isSubscribed) return;

      try {
        // Verificar se temos informações do usuário para filtrar os dados
        const currentUser = getCurrentUser();

        console.log('Iniciando carregamento de agendamentos no DashboardPage...');
        console.log('Usuário atual:', currentUser);

        // Fazer apenas uma requisição e usar o cache
        const formattedAppointments = await loadAppointments(true);
        console.log('Agendamentos recebidos no DashboardPage:', formattedAppointments);

        if (formattedAppointments && Array.isArray(formattedAppointments)) {
          console.log('Número de agendamentos:', formattedAppointments.length);
          if (formattedAppointments.length > 0) {
            console.log('Exemplo do primeiro agendamento:', formattedAppointments[0]);
          }
          setAppointments(formattedAppointments);
        } else {
          console.error('Dados de agendamentos inválidos:', formattedAppointments);
          // Definir um array vazio para evitar erros
          setAppointments([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Definir um array vazio para evitar erros
        setAppointments([]);
      }
    };

    // Fazer apenas uma requisição ao montar o componente
    fetchData();

    return () => {
      isSubscribed = false;
    };
  }, []); // Removendo dependências para evitar requisições duplicadas


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
              <Notifications />
            </div>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-2 rounded-full bg-[#F0B35B] transition-colors duration-300"
              >
                <Settings className="w-6 h-6 text-black" />
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
                      {currentUser?.role === 'admin' && (
                        <>
                          <button
                            onClick={() => navigate('/register')}
                            className="flex w-full items-center text-left px-4 py-3 text-sm text-white hover:bg-[#252B3B] transition-colors"
                            role="menuitem"
                          >
                            <span>Gerenciar Barbeiros</span>
                          </button>
                          <button
                            onClick={() => navigate('/gerenciar-comentarios')}
                            className="flex w-full items-center text-left px-4 py-3 text-sm text-white hover:bg-[#252B3B] transition-colors"
                            role="menuitem"
                          >
                            <span>Gerenciar Comentários</span>
                          </button>
                        </>
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

        {/* Componentes de estatísticas e gráficos */}
        <div className="mb-6">
          <Stats
            appointments={appointments}
            revenueDisplayMode={revenueDisplayMode}
            setRevenueDisplayMode={setRevenueDisplayMode}
          />
        </div>

        <div className="mb-6">
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
              onClick={() => setFilterMode('today')}
              className={`w-full sm:w-auto px-4 py-2 rounded-md transition-all duration-300 ${filterMode === 'today' ? 'bg-[#F0B35B] text-black' : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}`}
            >
              Hoje
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterMode('tomorrow')}
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

        {/* Lista de agendamentos */}
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
                    onView={() => handleAppointmentAction(appointment.id, 'view')}
                    filterMode={filterMode}
                    revenueDisplayMode={revenueDisplayMode}
                    appointments={appointments}
                  />
                ))}
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

      {/* Modal de visualização de agendamento */}
      <AppointmentViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        appointment={selectedAppointment}
        onDelete={() => selectedAppointment && handleAppointmentAction(selectedAppointment.id, 'delete')}
        onToggleStatus={() => selectedAppointment && handleAppointmentAction(selectedAppointment.id, 'toggle', selectedAppointment.status)}
      />
    </div>
  );

};

export default DashboardPage;