import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import toast from 'react-hot-toast';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import AppointmentCardNew from '../components/feature/AppointmentCardNew';
import AppointmentViewModal from '../components/feature/AppointmentViewModal';
import CalendarView from '../components/feature/CalendarView';
import StandardLayout from '../components/layout/StandardLayout';
import { useAppointments } from '../hooks/useAppointments';
import type { Appointment as BaseAppointment, AppointmentStatus } from '@/types';

// Interface local para compatibilidade com componentes
interface Appointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  barberId: string;
  barberName: string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
  isBlocked?: boolean;
}

// Interfaces Service e RawAppointmentData removidas - gerenciadas pelo hook useAppointments

const APPOINTMENTS_PER_PAGE = 6;

// Função para converter BaseAppointment para Appointment local
const convertAppointment = (baseAppointment: BaseAppointment): Appointment => {
  return {
    id: baseAppointment.id,
    clientName: baseAppointment._backendData?.clientName || (baseAppointment as unknown as { clientName: string }).clientName || baseAppointment.clientId,

    service: baseAppointment._backendData?.serviceName || (baseAppointment as unknown as { serviceName: string }).serviceName || baseAppointment.serviceId,
    date: baseAppointment.date.toISOString().split('T')[0],
    time: baseAppointment._backendData ? baseAppointment.startTime : (baseAppointment.time || baseAppointment.startTime),
    status: baseAppointment.status,
    barberId: baseAppointment.barberId,
    barberName: baseAppointment._backendData?.barberName || baseAppointment.barberName || '',
    price: baseAppointment._backendData?.price || (baseAppointment as unknown as { price: number }).price || 0,
    createdAt: baseAppointment.createdAt?.toISOString(),
    updatedAt: baseAppointment.updatedAt?.toISOString()
  };
};

const AgendaPage: React.FC = memo(() => {
  const { user: currentUser } = useAuth();
  const { isValidTenant } = useTenant();

  // Hook de agendamentos com suporte a tenant
  const {
    appointments: baseAppointments,
    deleteAppointment,
    updateAppointmentStatus
  } = useAppointments();

  // Converter appointments para o tipo local
  const appointments = useMemo(() => {
    if (!baseAppointments) return null;
    return baseAppointments.map(convertAppointment);
  }, [baseAppointments]);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  const calendarFilteredAppointments = useMemo(() => {
    if (!appointments || !appointments.length) return [];

    let filtered = appointments;

    // Filtro por role do usuário: barbeiros veem apenas seus agendamentos
    if (currentUser && typeof currentUser === 'object' && 'role' in currentUser && currentUser.role === 'barber' && 'id' in currentUser) {
      filtered = filtered.filter(app => app.barberId === (currentUser as { id: string | number }).id.toString());
    }

    return filtered.filter(app => {
      // Filtro de data
      if (app.date !== selectedDate) return false;

      // Filtro de bloqueio
      if (app.isBlocked === true) return false;

      // Filtro de status
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;

      return true;
    });
  }, [appointments, selectedDate, currentUser, statusFilter]);

  const indexOfLastAppointment = currentPage * APPOINTMENTS_PER_PAGE;
  const indexOfFirstAppointment = indexOfLastAppointment - APPOINTMENTS_PER_PAGE;
  const calendarCurrentAppointments = calendarFilteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const calendarTotalPages = Math.ceil(calendarFilteredAppointments.length / APPOINTMENTS_PER_PAGE);

  const paginate = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  const handleDateSelection = (date: string) => {
    setSelectedDate(date);
    setCurrentPage(1);
  };

  const handleAppointmentAction = useCallback(async (appointmentId: string, action: 'complete' | 'delete' | 'toggle' | 'view', currentStatus?: string) => {
    if (!appointmentId) return;
    try {
      if (action === 'view') {
        const appointment = (appointments || []).find(app => app.id === appointmentId);
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

        // Usar o método tenant-aware do hook
        await deleteAppointment(appointmentId);

        if (selectedAppointment?.id === appointmentId) {
          setIsViewModalOpen(false);
          setSelectedAppointment(null);
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
      } else if (action === 'toggle' && currentStatus) {
        let newStatus: string;

        // Define o próximo status baseado no status atual
        switch (currentStatus) {
          case 'pending':
            newStatus = 'confirmed';
            break;
          case 'confirmed':
            newStatus = 'completed';
            break;
          case 'completed':
            newStatus = 'scheduled';
            break;
          default:
            newStatus = 'confirmed';
        }

        // Usar o método tenant-aware do hook
        await updateAppointmentStatus(appointmentId, newStatus as AppointmentStatus);

        if (selectedAppointment?.id === appointmentId) {
          setSelectedAppointment(prev => prev ? { ...prev, status: newStatus as AppointmentStatus } : null);
        }

        let statusMessage: string;
        switch (newStatus) {
          case 'confirmed':
            statusMessage = 'Agendamento confirmado!';
            break;
          case 'completed':
            statusMessage = 'Agendamento finalizado!';
            break;
          case 'scheduled':
            statusMessage = 'Agendamento reaberto!';
            break;
          default:
            statusMessage = 'Status atualizado!';
        }

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
  }, [appointments, selectedAppointment, deleteAppointment, updateAppointmentStatus]);

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
  }, [handleAppointmentAction]);

  if (!isValidTenant) {
    return (
      <StandardLayout
        title="Agenda"
        subtitle="Gerencie seus agendamentos e visualize o calendário"
        icon={<Calendar className="w-6 h-6" />}
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Contexto de tenant inválido</p>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout
      title="Agenda"
      subtitle="Gerencie seus agendamentos e visualize o calendário"
      icon={<Calendar className="w-6 h-6" />}
    >
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
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }
        /* Mobile fixes for calendar container */
        .calendar-container {
             height: auto;
             min-height: 400px;
        }
        @media (min-width: 1024px) {
            .calendar-container {
                height: 100%;
            }
        }
      `}</style>

      <div className="space-y-6">
        {/* Layout Flex para Desktop / Column para Mobile */}
        <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-180px)]">

          {/* Coluna Esquerda: Calendário */}
          <div className="w-full lg:w-1/3 xl:w-1/4 shrink-0">
            <div className="bg-surface/50 backdrop-blur-md p-4 border border-white/5 rounded-2xl shadow-xl calendar-container h-full">
              <CalendarView
                appointments={(appointments || []).filter(app => !app.isBlocked)}
                onDateSelect={handleDateSelection}
                selectedDate={selectedDate}
              />
            </div>
          </div>

          {/* Coluna Direita: Lista de Agendamentos */}
          <div className="flex-1 flex flex-col bg-surface/30 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl overflow-hidden min-h-[500px]">
            {/* Header da Lista com Filtros */}
            <div className="p-4 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  Agendamentos
                </h3>
                <p className="text-gray-400 text-sm mt-1 ml-11">
                  {new Date(selectedDate).toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                </p>
              </div>

              {/* Filtros de Status (Tabs) */}
              <div className="flex p-1 bg-[#1A1F2E] rounded-lg border border-white/5 self-start sm:self-auto overflow-x-auto max-w-full">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'pending', label: 'Pendentes' },
                  { id: 'confirmed', label: 'Confirmados' },
                  { id: 'completed', label: 'Concluídos' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setStatusFilter(filter.id as any)}
                    className={`
                            px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap
                            ${statusFilter === filter.id
                        ? 'bg-primary text-black shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista Scrollável */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              {calendarCurrentAppointments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                  <div className="w-20 h-20 bg-background-paper rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-10 h-10 text-gray-600" />
                  </div>
                  <h4 className="text-gray-300 text-lg font-medium mb-1">
                    {statusFilter === 'all' ? 'Nenhum agendamento' : 'Nenhum agendamento encontrado'}
                  </h4>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    {statusFilter === 'all'
                      ? 'Não há horários marcados para este dia.'
                      : `Não há agendamentos com status "${statusFilter}" para este dia.`}
                  </p>

                  {statusFilter !== 'all' && (
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="mt-4 text-primary text-sm hover:underline"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {calendarCurrentAppointments.map((appointment) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      layout
                    >
                      <AppointmentCardNew
                        appointment={appointment as any}
                        onDelete={() => handleAppointmentAction(appointment.id, 'delete')}
                        onToggleStatus={() => handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
                        onView={() => handleAppointmentAction(appointment.id, 'view')}
                        className="h-full"
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Paginação */}
            {calendarTotalPages > 1 && (
              <div className="p-4 border-t border-white/5 bg-surface/50">
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-background-paper text-white hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-sm text-gray-400 px-3 font-medium">
                    {currentPage} / {calendarTotalPages}
                  </span>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === calendarTotalPages}
                    className="p-2 rounded-lg bg-background-paper text-white hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/5"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de visualização */}
      <AppointmentViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment as any}
        onDelete={() => handleAppointmentAction(selectedAppointment?.id || '', 'delete')}
        onToggleStatus={() => handleAppointmentAction(selectedAppointment?.id || '', 'toggle', selectedAppointment?.status)}
        allAppointments={(appointments || []) as any}
      />
    </StandardLayout>
  );
});

export default AgendaPage;