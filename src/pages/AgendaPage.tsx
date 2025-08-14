import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
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
  viewed?: boolean;
  isBlocked?: boolean;
}
import ApiService from '../services/ApiService';

// Interfaces Service e RawAppointmentData removidas - gerenciadas pelo hook useAppointments

const APPOINTMENTS_PER_PAGE = 6;

// Função para converter BaseAppointment para Appointment local
const convertAppointment = (baseAppointment: BaseAppointment): Appointment => {
  return {
    id: baseAppointment.id,
    clientName: baseAppointment._backendData?.clientName || baseAppointment.clientName || baseAppointment.clientId,
    service: baseAppointment._backendData?.serviceName || baseAppointment.service || baseAppointment.serviceId,
    date: baseAppointment.date.toISOString().split('T')[0],
    time: baseAppointment._backendData ? baseAppointment.startTime : (baseAppointment.time || baseAppointment.startTime),
    status: baseAppointment.status,
    barberId: baseAppointment.barberId,
    barberName: baseAppointment._backendData?.barberName || baseAppointment.barberName || '',
    price: baseAppointment._backendData?.price || baseAppointment.price || 0,
    createdAt: baseAppointment.createdAt?.toISOString(),
    updatedAt: baseAppointment.updatedAt?.toISOString(),
    viewed: baseAppointment.viewed,
    isBlocked: baseAppointment.isBlocked
  };
};

const AgendaPage: React.FC = memo(() => {
  const { getCurrentUser } = useAuth();
  const currentUser = useMemo(() => getCurrentUser(), [getCurrentUser]);

  // Hook de agendamentos com suporte a tenant
  const { 
    appointments: baseAppointments, 
    deleteAppointment, 
    updateAppointmentStatus,
    deleting,
    updating 
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


  const calendarFilteredAppointments = useMemo(() => {
    if (!appointments || !appointments.length) return [];

    let filtered = appointments;

    // Filtro por role do usuário: barbeiros veem apenas seus agendamentos
    if (currentUser && typeof currentUser === 'object' && 'role' in currentUser && currentUser.role === 'barber' && 'id' in currentUser) {
      filtered = filtered.filter(app => app.barberId === (currentUser as { id: string | number }).id.toString());
    }

    return filtered.filter(app => {
      if (app.isBlocked === true) return false;
      return app.date === selectedDate;
    });
  }, [appointments, selectedDate, currentUser]);





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
      } else {
        const newStatus = action === 'complete' ? 'completed' : (currentStatus === 'completed' ? 'scheduled' : 'completed');
        
        // Usar o método tenant-aware do hook
        await updateAppointmentStatus(appointmentId, newStatus as any);
        
        if (selectedAppointment?.id === appointmentId) {
          setSelectedAppointment(prev => prev ? { ...prev, status: newStatus as any } : null);
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

  // useEffect removido - agendamentos agora são gerenciados pelo hook useAppointments

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


        {/* Calendário */}
        <div className="bg-[#1A1F2E]/50 p-4 border border-[#F0B35B]/20">
          <CalendarView
            appointments={(appointments || []).filter(app => !app.isBlocked)}
            onDateSelect={handleDateSelection}
            selectedDate={selectedDate}
          />
        </div>

        {/* Lista de agendamentos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Agendamentos ({selectedDate})
          </h3>
          
          {calendarCurrentAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">Nenhum agendamento encontrado</p>
              <p className="text-gray-500 text-sm">
                Selecione uma data no calendário
              </p>
            </div>
          ) : (
            <>
              <div className="card-grid">
                {calendarCurrentAppointments.map((appointment) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AppointmentCardNew
                      appointment={appointment}
                      onDelete={() => handleAppointmentAction(appointment.id, 'delete')}
                      onToggleStatus={() => handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
                      onView={() => handleAppointmentAction(appointment.id, 'view')}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Paginação */}
              {calendarTotalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#252B3B] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-[#F0B35B]/30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="text-sm text-gray-400 px-3">
                    {currentPage} de {calendarTotalPages}
                  </span>
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === calendarTotalPages}
                    className="p-2 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#252B3B] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-[#F0B35B]/30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de visualização */}
      <AppointmentViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onDelete={() => handleAppointmentAction(selectedAppointment?.id || '', 'delete')}
        onToggleStatus={() => handleAppointmentAction(selectedAppointment?.id || '', 'toggle', selectedAppointment?.status)}
        allAppointments={appointments || []}
      />
    </StandardLayout>
  );
});

export default AgendaPage;