import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import AppointmentCardNew from '../components/feature/AppointmentCardNew';
import Stats from '../components/feature/Stats';
import StandardLayout from '../components/layout/StandardLayout';
import AppointmentViewModal from '../components/feature/AppointmentViewModal';
import { loadAppointments as loadAppointmentsService } from '../services/AppointmentService';
import { cacheService } from '../services/CacheService';
import toast from 'react-hot-toast';

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

const APPOINTMENTS_PER_PAGE = 6;

const DashboardPageNew: React.FC = () => {
  const { getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [revenueDisplayMode, setRevenueDisplayMode] = useState('month');
  const [filterMode, setFilterMode] = useState('today');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredAppointments = useMemo(() => {
    if (!appointments.length) return [];

    let filtered = appointments;

    // Filtro por role do usuário: barbeiros veem apenas seus agendamentos
    if (currentUser?.role === 'barber' && currentUser?.id) {
      filtered = filtered.filter(app => app.barberId === currentUser.id);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().split('T')[0];

    if (filterMode === 'today') {
      return filtered.filter(app => app.date === today);
    } else if (filterMode === 'tomorrow') {
      return filtered.filter(app => app.date === tomorrow);
    }
    return filtered;
  }, [appointments, filterMode, currentUser]);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Limpar cache específico do usuário
      const userId = currentUser?.id;
      if (userId) {
        cacheService.remove(`/api/appointments_user_${userId}`);
        cacheService.remove(`schedule_appointments_${userId}`);
      }
      cacheService.remove('appointments');
      cacheService.remove('/api/appointments');
      
      const newAppointments = await loadAppointmentsService();
      if (newAppointments && Array.isArray(newAppointments)) {
        setAppointments(newAppointments);
      }
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [currentUser?.id]);

  const indexOfLastAppointment = currentPage * APPOINTMENTS_PER_PAGE;
  const indexOfFirstAppointment = indexOfLastAppointment - APPOINTMENTS_PER_PAGE;
  const visibleAppointments = filteredAppointments.filter(app => !app.isBlocked);
  const currentAppointments = visibleAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(visibleAppointments.length / APPOINTMENTS_PER_PAGE);

  const paginate = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterMode]);

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

        if (response.ok) {
          setAppointments(prevAppointments => prevAppointments.filter(app => app.id !== appointmentId));

          if (selectedAppointment?.id === appointmentId) {
            setIsViewModalOpen(false);
            setSelectedAppointment(null);
          }

          // Invalidar cache específico do usuário após exclusão
          const userId = currentUser?.id;
          if (userId) {
            window.dispatchEvent(new CustomEvent('cacheUpdated', {
              detail: {
                keys: [
                  `/api/appointments_user_${userId}`,
                  '/api/appointments',
                  `schedule_appointments_${userId}`
                ],
                timestamp: Date.now()
              }
            }));
          }

          toast.success('Agendamento excluído com sucesso!', {
            duration: 4000,
            style: {
              background: '#1A1F2E',
              color: '#fff',
              border: '1px solid #F0B35B',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '12px',
              fontWeight: '500'
            },
            iconTheme: {
              primary: '#F0B35B',
              secondary: '#1A1F2E'
            }
          });
        } else {
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
          setAppointments(prevAppointments =>
            prevAppointments.map(app =>
              app.id === appointmentId ? { ...app, status: newStatus } : app
            )
          );
          if (selectedAppointment?.id === appointmentId) {
            setSelectedAppointment(prev => prev ? { ...prev, status: newStatus } : null);
          }

          // Invalidar cache específico do usuário após atualização
          const userId = currentUser?.id;
          if (userId) {
            window.dispatchEvent(new CustomEvent('cacheUpdated', {
              detail: {
                keys: [
                  `/api/appointments_user_${userId}`,
                  '/api/appointments',
                  `schedule_appointments_${userId}`
                ],
                timestamp: Date.now()
              }
            }));
          }

          const statusMessage = newStatus === 'completed'
            ? 'Agendamento marcado como concluído!'
            : 'Agendamento marcado como pendente!';

          toast.success(statusMessage, {
            duration: 4000,
            style: {
              background: '#1A1F2E',
              color: '#fff',
              border: '1px solid #F0B35B',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '12px',
              fontWeight: '500'
            },
            iconTheme: {
              primary: '#F0B35B',
              secondary: '#1A1F2E'
            }
          });
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

      if (action === 'delete') {
        toast.error('Erro ao excluir agendamento', {
          duration: 4000,
          style: {
            background: '#1A1F2E',
            color: '#fff',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '12px',
            fontWeight: '500'
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#1A1F2E'
          }
        });
      } else {
        toast.error('Erro ao atualizar agendamento', {
          duration: 4000,
          style: {
            background: '#1A1F2E',
            color: '#fff',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '12px',
            fontWeight: '500'
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#1A1F2E'
          }
        });
      }
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    let timeoutId: NodeJS.Timeout;

    const fetchData = async () => {
      if (!isSubscribed || !navigator.onLine) return;

      try {
        const appointments = await loadAppointmentsService();
        if (isSubscribed && Array.isArray(appointments)) {
          setAppointments(appointments);
        }
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        if (isSubscribed && appointments.length === 0) {
          setAppointments(prev => prev.length > 0 ? prev : []);
        }
      }
    };

    timeoutId = setTimeout(fetchData, 50);

    return () => {
      isSubscribed = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

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

  return (
    <StandardLayout>
      {/* Dashboard sem título - apenas cards */}
      <style>{`
        .refresh-icon-spin {
          animation: spin 1.2s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .refresh-button {
          transition: all 0.3s ease;
          transform: scale(1);
        }
        .refresh-button:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(240, 179, 91, 0.3);
        }
        .refresh-button:active {
          transform: scale(0.95);
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
      `}</style>

      <div className="space-y-6">
        {/* Layout principal do dashboard */}
        <div className="flex flex-col lg:flex-row h-full">
          {/* Seção de Estatísticas */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <Stats 
              appointments={appointments} 
              revenueDisplayMode={revenueDisplayMode} 
              setRevenueDisplayMode={setRevenueDisplayMode}
            />
          </div>

          {/* Seção de Agendamentos */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="bg-[#1A1F2E]/50 shadow-lg p-6 flex-1 flex flex-col border border-[#F0B35B]/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#F0B35B]" />
                    Agendamentos
                  </h2>
                  <select
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                    className="appearance-none bg-[#252B3B] text-white text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] cursor-pointer border border-[#F0B35B]/30"
                  >
                    <option value="today">Hoje</option>
                    <option value="tomorrow">Amanhã</option>
                    <option value="all">Todos</option>
                  </select>
                </div>
                <button
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="refresh-button p-3 rounded-lg bg-[#F0B35B] text-black hover:bg-[#F0B35B]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Atualizar agendamentos"
                  title="Atualizar agendamentos"
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'refresh-icon-spin' : ''}`} />
                </button>
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
                  <div className="flex-1 space-y-3">
                    {currentAppointments.map((appointment) => (
                      <AppointmentCardNew
                        key={`appointment-${appointment.id}-${appointment.status}`}
                        appointment={appointment}
                        onDelete={() => handleAppointmentAction(appointment.id, 'delete')}
                        onToggleStatus={() => handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
                        onView={() => handleAppointmentAction(appointment.id, 'view')}
                        className="h-fit"
                      />
                    ))}

                    {totalPages > 1 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex justify-center items-center gap-2 flex-wrap overflow-x-hidden">
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
                                className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                                  currentPage === number
                                    ? 'bg-[#F0B35B] text-black shadow-lg'
                                    : 'bg-[#252B3B] text-white hover:bg-[#2E354A] hover:shadow-md'
                                }`}
                              >
                                {number}
                              </button>
                            ));
                          })()}

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
      </div>

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
        onToggleStatus={async () => {
          if (selectedAppointment) {
            await handleAppointmentAction(selectedAppointment.id, 'toggle', selectedAppointment.status);
            setIsViewModalOpen(false);
          }
        }}
      />
    </StandardLayout>
  );
};

export default DashboardPageNew;