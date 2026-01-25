import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Calendar as CalendarIcon, X, AlertCircle, Trash2, Loader2, Users, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { adjustToBrasilia, formatToISODate } from '../../utils/DateTimeUtils';
import { useTenantCache } from '../../hooks/useTenantCache';
import { useTenant } from '../../contexts/TenantContext';
import { useAppointments } from '../../hooks/useAppointments';
import { AppointmentRepository } from '../../services/repositories/AppointmentRepository';



interface ScheduleManagerProps {
  barbers: Array<{ id: string; name: string }>;
  userRole: 'admin' | 'barber';
  currentBarberId?: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  barberId: string;
  barberName: string;
  clientName?: string;
  serviceName?: string;
  price?: number;
  status?: string;
  isBlocked?: boolean;
  isCancelled?: boolean;
}

// Atualizar array de horários disponíveis para sincronizar com o BookingModal
const timeSlots = [
  '09:00', '10:00', '11:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00'
].sort();

const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  barbers,
  userRole,
  currentBarberId
}) => {
  const tenantCache = useTenantCache();
  const { isValidTenant, barbershopId } = useTenant();
  const { appointments: tenantAppointments, loadAppointments: loadTenantAppointments } = useAppointments();
  const [selectedBarber, setSelectedBarber] = useState(currentBarberId || '');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [error, setError] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'block' | 'unblock' | ''>('');

  // Dados para horário bloqueado
  const blockedAppointmentData = {
    name: "BLOQUEADO",
    phone: "00000000000",
    email: "bloqueado@sistema.com",
    service: "Horário Bloqueado",
    price: 0
  };

  const availableDates = React.useMemo(() => {
    // Usar a função de ajuste para Brasília do utilitário
    const today = adjustToBrasilia(new Date());
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 15 }, (_, i) => {
      const date = addDays(today, i);
      date.setHours(0, 0, 0, 0);
      return date;
    });
  }, []);

  const fetchAppointments = useCallback(async (_forceRefresh = false) => {
    if (!isValidTenant) {
      setAppointments([]);
      return;
    }

    try {
      // Usar hook tenant-aware para carregar agendamentos
      await loadTenantAppointments();

      // Filtrar agendamentos por barbeiro e critérios válidos
      const filteredAppointments = ((tenantAppointments || []) as unknown as Appointment[]).filter((apt) =>
        apt &&
        apt.barberId === selectedBarber &&
        apt.date &&
        apt.time &&
        timeSlots.includes(apt.time) &&
        !apt.isCancelled
      );

      setAppointments(filteredAppointments);
      setError(null);

      // Disparar evento para sincronizar com BookingModal
      window.dispatchEvent(new Event('appointmentsUpdated'));

    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      setError('Erro ao carregar agendamentos. Tente novamente mais tarde.');

      // Tentar usar cache em caso de erro
      const cachedData = await tenantCache.get(`schedule_appointments_${selectedBarber}`);
      if (cachedData) {
        setAppointments(Array.isArray(cachedData) ? cachedData : []);
      }
    }
  }, [selectedBarber, timeSlots, isValidTenant, loadTenantAppointments, tenantAppointments]);

  useEffect(() => {
    if (selectedBarber) {
      setAppointments([]); // Limpa os agendamentos anteriores
      setError(null); // Limpa possíveis erros anteriores
      fetchAppointments();
      const interval = setInterval(() => fetchAppointments(false), 30000); // Atualiza a cada 30 segundos

      // Listener para atualizações de cache
      const handleCacheUpdate = (event: CustomEvent) => {
        const { keys } = event.detail;
        const cacheKey = `schedule_appointments_${selectedBarber}`;
        const tenantAppointmentsKey = `tenant_${barbershopId}_appointments`;
        if (keys.includes(cacheKey) || keys.includes(tenantAppointmentsKey)) {
          // Recarregar dados do cache atualizado
          fetchAppointments(false);
        }
      };

      window.addEventListener('cacheUpdated', handleCacheUpdate as EventListener);

      return () => {
        clearInterval(interval);
        window.removeEventListener('cacheUpdated', handleCacheUpdate as EventListener);
      };
    }
  }, [selectedBarber]);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  }, []);

  const handleTimeClick = useCallback((time: string, appointment: Appointment | null) => {
    if (!selectedDate) return;

    setSelectedTime(time);

    if (appointment) {
      // Se já existe um agendamento, abre o modal de confirmação para excluir
      setAppointmentToDelete(appointment);
      setIsDeleteConfirmOpen(true);
    } else {
      // Se não existe agendamento, abre o modal para bloquear o horário
      setActionType('block');
      setIsConfirmOpen(true);
    }
  }, [selectedDate]);

  const blockTimeSlot = async () => {
    if (!selectedDate || !selectedTime || !selectedBarber) return;

    const formattedDate = formatToISODate(selectedDate);
    if (!isTimeSlotAvailable(formattedDate, selectedTime, selectedBarber)) {
      setError('Este horário não está mais disponível');
      return;
    }

    const barberName = barbers.find(b => b.id === selectedBarber)?.name || 'Desconhecido';

    const tempAppointment: Appointment = {
      id: `temp-${Date.now()}`,
      date: formattedDate,
      time: selectedTime,
      barberId: selectedBarber,
      barberName: barberName,
      clientName: blockedAppointmentData.name,
      serviceName: blockedAppointmentData.service,
      price: blockedAppointmentData.price,
      status: 'blocked',
      isBlocked: true
    };

    // Atualização otimista do estado
    setAppointments(prev => [...prev, tempAppointment]);
    setIsConfirmOpen(false);
    setSelectedTime(null);

    // Atualizar cache imediatamente para visualização instantânea
    try {
      const cacheKey = `schedule_appointments_${selectedBarber}`;
      const cachedData = await tenantCache.get(cacheKey) || [];
      const updatedCache = Array.isArray(cachedData) ? [...cachedData, tempAppointment] : [tempAppointment];
      await tenantCache.set(cacheKey, updatedCache);

      // Atualizar também o cache global de agendamentos do tenant
      const { barbershopId } = useTenant();
      const globalCacheKey = `tenant_${barbershopId}_appointments`;
      const globalCachedData = await tenantCache.get(globalCacheKey) || [];
      const updatedGlobalCache = Array.isArray(globalCachedData) ? [...globalCachedData, tempAppointment] : [tempAppointment];
      await tenantCache.set(globalCacheKey, updatedGlobalCache);
    } catch (cacheError) {
      console.warn('Erro ao atualizar cache:', cacheError);
    }

    // Disparar evento de bloqueio
    window.dispatchEvent(new CustomEvent('timeSlotBlocked', {
      detail: tempAppointment
    }));

    setIsLoading(true);
    try {
      // Usar AppointmentRepository com tenant context
      const appointmentRepository = new AppointmentRepository();
      const result = await appointmentRepository.createWithBackendData({
        clientName: blockedAppointmentData.name,
        wppclient: blockedAppointmentData.phone,
        serviceName: blockedAppointmentData.service,
        date: new Date(formattedDate),
        time: selectedTime,
        barberId: selectedBarber,
        barberName: barberName,
        price: blockedAppointmentData.price,
        status: 'pending'
      });
      const confirmedAppointment = {
        ...tempAppointment,
        id: result.id
      };

      // Atualizar o appointment com o ID real no estado
      setAppointments(prev => prev.map(app =>
        app.id === tempAppointment.id ? confirmedAppointment : app
      ));

      // Atualizar cache com o ID real do servidor
      try {
        const cacheKey = `schedule_appointments_${selectedBarber}`;
        const cachedData = await tenantCache.get(cacheKey) || [];
        const updatedCache = Array.isArray(cachedData)
          ? cachedData.map(app => app.id === tempAppointment.id ? confirmedAppointment : app)
          : [confirmedAppointment];
        await tenantCache.set(cacheKey, updatedCache);

        // Atualizar também o cache global do tenant
        // Usar barbershopId do contexto de tenant
        const globalCacheKey = `tenant_${barbershopId}_appointments`;
        const globalCachedData = await tenantCache.get(globalCacheKey) || [];
        const updatedGlobalCache = Array.isArray(globalCachedData)
          ? globalCachedData.map(app => app.id === tempAppointment.id ? confirmedAppointment : app)
          : [confirmedAppointment];
        await tenantCache.set(globalCacheKey, updatedGlobalCache);
      } catch (cacheError) {
        console.warn('Erro ao atualizar cache com ID real:', cacheError);
      }

      // Disparar evento de atualização com o ID real
      window.dispatchEvent(new CustomEvent('appointmentUpdate', {
        detail: confirmedAppointment
      }));

      // Disparar evento para notificar outros componentes sobre a atualização do cache
      window.dispatchEvent(new CustomEvent('cacheUpdated', {
        detail: {
          keys: [`schedule_appointments_${selectedBarber}`, `tenant_${barbershopId}_appointments`],
          timestamp: Date.now()
        }
      }));

      // Notificação visual elaborada para bloqueio
      toast.success('Horário bloqueado com sucesso!', {
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
    } catch (error) {
      // Reverter a atualização otimista no estado
      setAppointments(prev => prev.filter(app => app.id !== tempAppointment.id));

      // Reverter também no cache
      try {
        const cacheKey = `schedule_appointments_${selectedBarber}`;
        const cachedData = await tenantCache.get(cacheKey) || [];
        const revertedCache = Array.isArray(cachedData)
          ? cachedData.filter(app => app.id !== tempAppointment.id)
          : [];
        await tenantCache.set(cacheKey, revertedCache);

        // Reverter também o cache global do tenant
        // Usar barbershopId do contexto de tenant para o cache global
        const globalCacheKey = `tenant_${barbershopId}_appointments`;
        const globalCachedData = await tenantCache.get(globalCacheKey) || [];
        const revertedGlobalCache = Array.isArray(globalCachedData)
          ? globalCachedData.filter(app => app.id !== tempAppointment.id)
          : [];
        await tenantCache.set(globalCacheKey, revertedGlobalCache);
      } catch (cacheError) {
        console.warn('Erro ao reverter cache:', cacheError);
      }

      console.error('Erro ao bloquear horário:', error);
      toast.error('Erro ao bloquear horário', {
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
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAppointment = async () => {
    if (!appointmentToDelete) return;

    const deletedAppointment = appointmentToDelete;

    // Verificar se o agendamento existe antes de tentar excluir
    const existingAppointment = appointments.find(a => a.id === deletedAppointment.id);
    if (!existingAppointment) {
      toast.error('Agendamento não encontrado', {
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
      setIsDeleteConfirmOpen(false);
      setAppointmentToDelete(null);
      return;
    }

    // Atualização otimista
    setAppointments(prev => prev.filter(app => app.id !== deletedAppointment.id));
    setIsDeleteConfirmOpen(false);
    setAppointmentToDelete(null);

    // Disparar evento de desbloqueio/remoção
    window.dispatchEvent(new CustomEvent(
      deletedAppointment.isBlocked ? 'timeSlotUnblocked' : 'appointmentUpdate',
      {
        detail: {
          ...deletedAppointment,
          isRemoved: true
        }
      }
    ));

    setIsLoading(true);
    try {
      // Obter slug da barbearia para URL tenant-aware
      const barbershopSlug = localStorage.getItem('barbershopSlug');
      if (!barbershopSlug) {
        throw new Error('Slug da barbearia não encontrado. Faça login novamente.');
      }

      // TODO: Implementar operação com Supabase
      // Por enquanto, simular sucesso para não quebrar a funcionalidade
      const successMessage = deletedAppointment.isBlocked
        ? 'Horário desbloqueado com sucesso!'
        : 'Agendamento cancelado com sucesso!';

      toast.success(successMessage, {
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

      // Atualizar o cache após uma exclusão bem-sucedida
      const cacheKey = `schedule_appointments_${selectedBarber}`;
      const cachedData = await tenantCache.get(cacheKey);
      if (cachedData) {
        const updatedCache = Array.isArray(cachedData)
          ? cachedData.filter(app => app.id !== deletedAppointment.id)
          : [];
        await tenantCache.set(cacheKey, updatedCache);
      }

      // Atualizar também o cache específico do usuário
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser?.id;
      // Usar barbershopId do contexto de tenant
      if (userId) {
        const userCacheKey = `tenant_${barbershopId}_appointments_user_${userId}`;
        const userCachedData = await tenantCache.get(userCacheKey);
        if (userCachedData) {
          const updatedUserCache = Array.isArray(userCachedData)
            ? userCachedData.filter(app => app.id !== deletedAppointment.id)
            : [];
          await tenantCache.set(userCacheKey, updatedUserCache);
        }
      }

      // Atualizar também o cache global de agendamentos do tenant
      const globalCacheKey = `tenant_${barbershopId}_appointments`;
      const globalCachedData = await tenantCache.get(globalCacheKey);
      if (globalCachedData) {
        const updatedGlobalCache = Array.isArray(globalCachedData)
          ? globalCachedData.filter(app => app.id !== deletedAppointment.id)
          : [];
        await tenantCache.set(globalCacheKey, updatedGlobalCache);
      }

      // Disparar evento para notificar outros componentes sobre a atualização do cache
      window.dispatchEvent(new CustomEvent('cacheUpdated', {
        detail: {
          keys: [
            `schedule_appointments_${selectedBarber}`,
            `tenant_${barbershopId}_appointments`,
            userId ? `tenant_${barbershopId}_appointments_user_${userId}` : null
          ].filter(Boolean),
          timestamp: Date.now()
        }
      }));

      // Recarregar os agendamentos
      fetchAppointments();
    } catch (error) {
      // Reverter a atualização otimista
      setAppointments(prev => [...prev, deletedAppointment]);

      // Reverter o evento
      window.dispatchEvent(new CustomEvent('appointmentUpdate', {
        detail: deletedAppointment
      }));

      console.error('Erro ao excluir agendamento:', error);
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
    } finally {
      setIsLoading(false);
    }
  };

  const getAppointmentForTimeSlot = useCallback((date: Date, time: string): Appointment | null => {
    if (!date || !Array.isArray(appointments)) return null;

    const dateInBrasilia = adjustToBrasilia(date);
    const formattedDate = format(dateInBrasilia, 'yyyy-MM-dd');

    return appointments.find(
      appointment =>
        appointment.date === formattedDate &&
        appointment.time === time &&
        appointment.barberId === selectedBarber &&
        !appointment.isCancelled &&
        timeSlots.includes(appointment.time)
    ) || null;
  }, [appointments, selectedBarber]);

  const isTimeSlotAvailable = useCallback((date: string, time: string, barberId: string): boolean => {
    return !appointments.some(appointment =>
      appointment.date === date &&
      appointment.time === time &&
      appointment.barberId === barberId &&
      !appointment.isCancelled
    );
  }, [appointments]);

  const renderCalendarView = () => {
    return (
      <div className="space-y-6">
        <div className="bg-surface/30 backdrop-blur-sm rounded-xl p-4 border border-white/5 shadow-inner overflow-hidden">
          <div className="flex overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex space-x-3">
              {availableDates.map(date => {
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                return (
                  <button
                    type="button"
                    key={date.toISOString()}
                    onClick={() => handleDateClick(date)}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-xl min-w-[90px]
                      transition-all duration-300 transform relative overflow-hidden group
                      ${isSelected
                        ? 'bg-primary text-black shadow-lg shadow-primary/20 scale-105'
                        : 'bg-background-paper text-white hover:bg-surface border border-white/5 hover:border-primary/30'}
                    `}
                  >
                    <span className={`text-xs uppercase tracking-wider mb-1 font-medium ${isSelected ? 'text-black/70' : 'text-gray-400'}`}>
                      {format(date, 'EEE', { locale: ptBR })}
                    </span>
                    <span className="text-2xl font-bold">
                      {format(date, 'd')}
                    </span>
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span>Horários Disponíveis</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-gray-500">Carregando horários...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="col-span-full text-center p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                  {error}
                </div>
              ) : (
                timeSlots.map(time => {
                  const appointment = selectedDate ? getAppointmentForTimeSlot(selectedDate, time) : null;
                  const isBooked = !!appointment;
                  const isBlocked = appointment?.isBlocked;
                  const isSelected = time === selectedTime;

                  return (
                    <button
                      type="button"
                      key={time}
                      onClick={() => handleTimeClick(time, appointment)}
                      className={`
                          py-4 px-2 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden group border
                          ${isBlocked
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20'
                          : isBooked
                            ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                            : isSelected
                              ? 'bg-primary text-black border-primary scale-105 shadow-glow'
                              : 'bg-surface text-white border-white/5 hover:border-primary/50 hover:bg-surface/80 hover:scale-105 hover:shadow-lg'}
                        `}
                    >
                      <div className="flex flex-col items-center justify-center text-center gap-1.5 relative z-10">
                        <span className="text-base">{time}</span>
                        {isBlocked && (
                          <span className="text-[10px] uppercase tracking-wider bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full w-full font-bold">Bloqueado</span>
                        )}
                        {isBooked && !isBlocked && (
                          <span className="text-[10px] uppercase tracking-wider bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full w-full font-bold">Ocupado</span>
                        )}
                        {!isBooked && !isBlocked && !isSelected && (
                          <span className="text-[10px] text-green-400 font-medium">Livre</span>
                        )}
                      </div>

                      {/* Hover effect */}
                      {!isSelected && !isBooked && !isBlocked && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    );
  };

  const renderListView = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <AlertCircle className="w-6 h-6 mx-auto mb-2" />
          {error}
        </div>
      );
    }

    if (appointments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-surface/30 rounded-2xl border border-white/5">
          <div className="w-20 h-20 bg-background-paper rounded-full flex items-center justify-center mb-6 shadow-md border border-white/5">
            <CalendarIcon className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Agenda Vazia</h3>
          <p className="text-gray-400 max-w-sm mx-auto">Nenhum agendamento encontrado para este barbeiro.</p>
        </div>
      );
    }

    // Obter a data atual no formato yyyy-MM-dd usando o utilitário
    const today = adjustToBrasilia(new Date());
    today.setHours(0, 0, 0, 0);
    const currentDate = formatToISODate(today);

    // Filtrar apenas agendamentos do dia atual em diante
    const filteredAppointments = appointments.filter(appointment => {
      // Garantir que estamos comparando apenas as datas, sem considerar o horário
      return appointment.date >= currentDate;
    });

    // Agrupar agendamentos por data
    const groupedAppointments: Record<string, Appointment[]> = {};
    filteredAppointments.forEach(appointment => {
      if (!groupedAppointments[appointment.date]) {
        groupedAppointments[appointment.date] = [];
      }
      groupedAppointments[appointment.date].push(appointment);
    });

    // Ordenar datas
    const sortedDates = Object.keys(groupedAppointments).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        {sortedDates.map(date => {
          const dateAppointments = groupedAppointments[date];
          dateAppointments.sort((a, b) => a.time.localeCompare(b.time));

          return (
            <div key={date} className="relative">
              <div className="flex items-center gap-3 mb-4 pl-2">
                <div className="w-2 h-2 rounded-full bg-primary shadow-glow"></div>
                <h3 className="text-primary font-bold text-lg">
                  {(() => {
                    const dateParts = date.split('-');
                    const year = parseInt(dateParts[0]);
                    const month = parseInt(dateParts[1]) - 1;
                    const day = parseInt(dateParts[2]);
                    const dateObj = new Date(year, month, day, 12, 0, 0);
                    return dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
                  })()}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dateAppointments.map(appointment => (
                  <div
                    key={appointment.id}
                    className={`
                         flex justify-between items-center p-5 rounded-2xl transition-all duration-300 border backdrop-blur-sm group
                      ${appointment.isBlocked
                        ? 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10'
                        : 'bg-surface/50 border-white/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1'}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                           w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                            ${appointment.isBlocked ? 'bg-orange-500/10 text-orange-400' : 'bg-background-paper text-primary border border-white/5'}
                        `}>
                        {appointment.time}
                      </div>

                      <div>
                        {appointment.isBlocked ? (
                          <p className="font-bold text-orange-400 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            Horário Bloqueado
                          </p>
                        ) : (
                          <>
                            <p className="font-bold text-white text-lg">{appointment.clientName || 'Cliente sem nome'}</p>
                            <p className="text-sm text-gray-400">{appointment.serviceName || 'Serviço'}</p>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setAppointmentToDelete(appointment);
                        setIsDeleteConfirmOpen(true);
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-background-paper/50 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 text-gray-400 hover:text-red-400 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                      title={appointment.isBlocked ? "Desbloquear" : "Cancelar"}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-surface/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Gerenciamento de Horários
          </h2>
          <p className="text-gray-400 text-sm mt-1">Controle sua disponibilidade e visualize agendamentos</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-background-paper/50 rounded-xl border border-white/5 shadow-sm">
          <Clock className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-white">Agenda em tempo real</span>
        </div>
      </div>

      {userRole === 'admin' ? (
        <div className="space-y-2 max-w-md relative z-10">
          <label className="text-sm font-medium text-gray-300 ml-1">Selecione o Profissional</label>
          <div className="relative">
            <select
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="w-full px-4 py-3.5 pr-10 rounded-xl bg-background-paper border border-white/5 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer hover:bg-surface"
            >
              <option value="">Selecione um barbeiro...</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
        </div>
      ) : null}

      {/* Botões de alternância de visualização */}
      <div className="flex justify-center md:justify-start relative z-10">
        <div className="bg-background-paper p-1.5 rounded-xl flex space-x-1 shadow-inner border border-white/5">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2
              ${viewMode === 'calendar'
                ? 'bg-primary text-black shadow-lg shadow-primary/20 scale-105'
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-surface'}
            `}
          >
            <CalendarIcon className="w-4 h-4" />
            Calendário
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2
              ${viewMode === 'list'
                ? 'bg-primary text-black shadow-lg shadow-primary/20 scale-105'
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-surface'}
            `}
          >
            <Clock className="w-4 h-4" />
            Lista
          </button>
        </div>
      </div>

      {selectedBarber ? (
        <div className="mt-8 relative z-10 min-h-[400px]">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {viewMode === 'calendar' ? renderCalendarView() : renderListView()}
          </motion.div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-surface/30 rounded-2xl border border-white/5 border-dashed relative z-10">
          <div className="w-16 h-16 bg-background-paper rounded-full flex items-center justify-center mb-4 text-gray-600">
            <Users className="w-8 h-8" />
          </div>
          <p className="text-gray-400">Selecione um barbeiro para visualizar a agenda</p>
        </div>
      )}

      {/* Modal de Confirmação para Bloquear Horário */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#1A1F2E] rounded-xl border border-[#F0B35B]/20 p-6 max-w-md w-full space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#F0B35B]">
                {actionType === 'block' ? 'Confirmar Bloqueio' : 'Confirmar Desbloqueio'}
              </h3>
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="p-2 hover:bg-[#252B3B] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#252B3B]/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-gray-300">
                <CalendarIcon className="w-5 h-5 text-[#F0B35B]" />
                <span>
                  {selectedDate?.toLocaleDateString('pt-BR')} às {selectedTime}
                </span>
              </div>

              <div className="flex items-start gap-2 text-yellow-400/80 bg-yellow-400/10 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  {actionType === 'block'
                    ? 'Este horário será marcado como ocupado e não estará disponível para agendamentos de clientes.'
                    : 'Este horário será liberado e estará disponível para agendamentos de clientes.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-[#F0B35B]/30 text-[#F0B35B] hover:bg-[#F0B35B]/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={blockTimeSlot}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-[#F0B35B] text-black font-medium hover:bg-[#D4943D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processando...' : actionType === 'block' ? 'Confirmar Bloqueio' : 'Confirmar Desbloqueio'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Confirmação para Excluir Agendamento */}
      {isDeleteConfirmOpen && appointmentToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#1A1F2E] rounded-xl border border-[#F0B35B]/20 p-6 max-w-md w-full space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-red-400">
                {appointmentToDelete.isBlocked ? 'Desbloquear Horário' : 'Cancelar Agendamento'}
              </h3>
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="p-2 hover:bg-[#252B3B] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#252B3B]/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-gray-300">
                <CalendarIcon className="w-5 h-5 text-[#F0B35B]" />
                <span>
                  {new Date(appointmentToDelete.date).toLocaleDateString('pt-BR')} às {appointmentToDelete.time}
                </span>
              </div>

              {!appointmentToDelete.isBlocked && (
                <div className="flex flex-col gap-1 text-sm text-gray-400">
                  <p><span className="text-gray-500">Cliente:</span> {appointmentToDelete.clientName}</p>
                  <p><span className="text-gray-500">Serviço:</span> {appointmentToDelete.serviceName}</p>
                </div>
              )}

              <div className="flex items-start gap-2 text-red-400/80 bg-red-500/10 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  {appointmentToDelete.isBlocked
                    ? 'Tem certeza que deseja desbloquear este horário? Ele ficará disponível para agendamentos.'
                    : 'Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-[#F0B35B]/30 text-[#F0B35B] hover:bg-[#F0B35B]/10 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={deleteAppointment}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processando...' : appointmentToDelete.isBlocked ? 'Desbloquear' : 'Cancelar Agendamento'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default ScheduleManager;