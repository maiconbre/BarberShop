import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Calendar as CalendarIcon, X, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cacheService } from '../../services/CacheService';
import { adjustToBrasilia, formatToISODate } from '../../utils/DateTimeUtils';


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

interface AppointmentData {
  id?: string;
  date?: string;
  time?: string;
  barberId?: string;
  barberName?: string;
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

  const fetchAppointments = useCallback(async (forceRefresh = false) => {
    try {
      const cacheKey = `schedule_appointments_${selectedBarber}`;
      
      // Se não for refresh forçado, tentar usar cache primeiro
      if (!forceRefresh) {
        const cachedData = await cacheService.get(cacheKey);
        if (cachedData && Array.isArray(cachedData)) {
          setAppointments(cachedData);
          setError(null);
          // Continuar com fetch em background para atualizar cache
        }
      }
      
      const response = await cacheService.getOrFetch(
        cacheKey,
        async () => {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/appointments?barberId=${selectedBarber}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          if (!response.ok) throw new Error('Falha ao buscar agendamentos');
          
          const data = await response.json();
          const appointments = data.data || data || [];
          
          // Filtrar apenas agendamentos válidos
          return appointments.filter((apt: AppointmentData) => 
            apt && 
            apt.date && 
            apt.time && 
            timeSlots.includes(apt.time) && 
            !apt.isCancelled
          );
        },
        { ttl: forceRefresh ? 0 : undefined }
      );

      setAppointments(Array.isArray(response) ? response : []);
      setError(null);
      
      // Disparar evento para sincronizar com BookingModal
      window.dispatchEvent(new Event('appointmentsUpdated'));
      
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      setError('Erro ao carregar agendamentos. Tente novamente mais tarde.');
      
      // Tentar usar cache em caso de erro
      const cachedData = await cacheService.get(`schedule_appointments_${selectedBarber}`);
      if (cachedData) {
        setAppointments(Array.isArray(cachedData) ? cachedData : []);
      }
    }
  }, [selectedBarber, timeSlots]);

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
        if (keys.includes(cacheKey) || keys.includes('/api/appointments')) {
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
      const cachedData = await cacheService.get(cacheKey) || [];
      const updatedCache = Array.isArray(cachedData) ? [...cachedData, tempAppointment] : [tempAppointment];
      await cacheService.set(cacheKey, updatedCache);
      
      // Atualizar também o cache global de agendamentos
      const globalCacheKey = '/api/appointments';
      const globalCachedData = await cacheService.get(globalCacheKey) || [];
      const updatedGlobalCache = Array.isArray(globalCachedData) ? [...globalCachedData, tempAppointment] : [tempAppointment];
      await cacheService.set(globalCacheKey, updatedGlobalCache);
    } catch (cacheError) {
      console.warn('Erro ao atualizar cache:', cacheError);
    }

    // Disparar evento de bloqueio
    window.dispatchEvent(new CustomEvent('timeSlotBlocked', {
      detail: tempAppointment
    }));

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          clientName: blockedAppointmentData.name,
          wppclient: blockedAppointmentData.phone,
          serviceName: blockedAppointmentData.service,
          date: formattedDate,
          time: selectedTime,
          barberId: selectedBarber,
          barberName: barberName,
          price: blockedAppointmentData.price,
          isBlocked: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        const confirmedAppointment = {
          ...tempAppointment,
          id: result.data.id
        };

        // Atualizar o appointment com o ID real no estado
        setAppointments(prev => prev.map(app => 
          app.id === tempAppointment.id ? confirmedAppointment : app
        ));

        // Atualizar cache com o ID real do servidor
        try {
          const cacheKey = `schedule_appointments_${selectedBarber}`;
          const cachedData = await cacheService.get(cacheKey) || [];
          const updatedCache = Array.isArray(cachedData) 
            ? cachedData.map(app => app.id === tempAppointment.id ? confirmedAppointment : app)
            : [confirmedAppointment];
          await cacheService.set(cacheKey, updatedCache);
          
          // Atualizar também o cache global
          const globalCacheKey = '/api/appointments';
          const globalCachedData = await cacheService.get(globalCacheKey) || [];
          const updatedGlobalCache = Array.isArray(globalCachedData)
            ? globalCachedData.map(app => app.id === tempAppointment.id ? confirmedAppointment : app)
            : [confirmedAppointment];
          await cacheService.set(globalCacheKey, updatedGlobalCache);
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
            keys: [`schedule_appointments_${selectedBarber}`, '/api/appointments'],
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
      } else {
        // Reverter a atualização otimista no estado
        setAppointments(prev => prev.filter(app => app.id !== tempAppointment.id));
        
        // Reverter também no cache
        try {
          const cacheKey = `schedule_appointments_${selectedBarber}`;
          const cachedData = await cacheService.get(cacheKey) || [];
          const revertedCache = Array.isArray(cachedData) 
            ? cachedData.filter(app => app.id !== tempAppointment.id)
            : [];
          await cacheService.set(cacheKey, revertedCache);
          
          // Reverter também o cache global
          const globalCacheKey = '/api/appointments';
          const globalCachedData = await cacheService.get(globalCacheKey) || [];
          const revertedGlobalCache = Array.isArray(globalCachedData)
            ? globalCachedData.filter(app => app.id !== tempAppointment.id)
            : [];
          await cacheService.set(globalCacheKey, revertedGlobalCache);
        } catch (cacheError) {
          console.warn('Erro ao reverter cache:', cacheError);
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao bloquear horário');
      }
    } catch (error) {
      // Reverter a atualização otimista no estado
      setAppointments(prev => prev.filter(app => app.id !== tempAppointment.id));
      
      // Reverter também no cache
      try {
        const cacheKey = `schedule_appointments_${selectedBarber}`;
        const cachedData = await cacheService.get(cacheKey) || [];
        const revertedCache = Array.isArray(cachedData) 
          ? cachedData.filter(app => app.id !== tempAppointment.id)
          : [];
        await cacheService.set(cacheKey, revertedCache);
        
        // Reverter também o cache global
        const globalCacheKey = '/api/appointments';
        const globalCachedData = await cacheService.get(globalCacheKey) || [];
        const revertedGlobalCache = Array.isArray(globalCachedData)
          ? globalCachedData.filter(app => app.id !== tempAppointment.id)
          : [];
        await cacheService.set(globalCacheKey, revertedGlobalCache);
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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/appointments/${deletedAppointment.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        // Notificação visual mais elaborada para exclusão
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
        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) {
          const updatedCache = Array.isArray(cachedData) 
            ? cachedData.filter(app => app.id !== deletedAppointment.id)
            : [];
          await cacheService.set(cacheKey, updatedCache);
        }
        
        // Atualizar também o cache específico do usuário
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = currentUser?.id;
        if (userId) {
          const userCacheKey = `/api/appointments_user_${userId}`;
          const userCachedData = await cacheService.get(userCacheKey);
          if (userCachedData) {
            const updatedUserCache = Array.isArray(userCachedData)
              ? userCachedData.filter(app => app.id !== deletedAppointment.id)
              : [];
            await cacheService.set(userCacheKey, updatedUserCache);
          }
        }
        
        // Atualizar também o cache global de agendamentos
        const globalCacheKey = '/api/appointments';
        const globalCachedData = await cacheService.get(globalCacheKey);
        if (globalCachedData) {
          const updatedGlobalCache = Array.isArray(globalCachedData)
            ? globalCachedData.filter(app => app.id !== deletedAppointment.id)
            : [];
          await cacheService.set(globalCacheKey, updatedGlobalCache);
        }
        
        // Disparar evento para notificar outros componentes sobre a atualização do cache
        window.dispatchEvent(new CustomEvent('cacheUpdated', {
          detail: {
            keys: [
              `schedule_appointments_${selectedBarber}`, 
              '/api/appointments',
              userId ? `/api/appointments_user_${userId}` : null
            ].filter(Boolean),
            timestamp: Date.now()
          }
        }));
        
        // Recarregar os agendamentos
        fetchAppointments();
      } else {
        // Reverter a atualização otimista
        setAppointments(prev => [...prev, deletedAppointment]);
        
        // Reverter o evento
        window.dispatchEvent(new CustomEvent('appointmentUpdate', {
          detail: deletedAppointment
        }));
        
        throw new Error('Erro ao excluir agendamento');
      }
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
      <div className="space-y-4">
        <div className="flex overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex space-x-2">
            {availableDates.map(date => (
              <button
                type="button"
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-lg min-w-[80px]
                  transition-all duration-200 transform hover:scale-105 relative overflow-hidden
                  ${selectedDate && isSameDay(date, selectedDate)
                    ? 'bg-[#F0B35B] text-black'
                    : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}
                `}
              >
                <span className="text-xs opacity-75 relative z-10">
                  {format(date, 'EEE', { locale: ptBR })}
                </span>
                <span className="text-lg font-bold relative z-10">
                  {format(date, 'd')}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/20 to-[#F0B35B]/0 -skew-x-45 opacity-0 group-hover:animate-shine"></div>
              </button>
            ))}
          </div>
        </div>

          <div className="flex justify-center">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-4 max-w-3xl mx-auto">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-6">
                  <Loader2 className="w-7 h-7 animate-spin text-[#F0B35B]" />
                </div>
              ) : error ? (
                <div className="col-span-full text-center text-red-500 py-6">
                  {error}
                </div>
              ) : (
                timeSlots.map(time => {
                  const appointment = selectedDate ? getAppointmentForTimeSlot(selectedDate, time) : null;
                  const isBooked = !!appointment;
                  const isBlocked = appointment?.isBlocked;
                  
                  return (
                    <button
                      type="button"
                      key={time}
                      onClick={() => handleTimeClick(time, appointment)}
                      className={`
                        py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden
                        ${isBlocked 
                          ? 'bg-orange-500/20 text-orange-300 cursor-pointer border border-orange-500/30' 
                          : isBooked
                            ? 'bg-red-500/20 text-red-300 cursor-pointer border border-red-500/30' 
                            : time === selectedTime
                              ? 'bg-[#F0B35B] text-black transform scale-105 shadow-md shadow-[#F0B35B]/20' 
                              : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B] hover:scale-105 cursor-pointer border border-[#F0B35B]/10'}
                      `}
                    >
                      <div className="flex flex-col items-center justify-center text-center gap-1">
                        <span className="relative z-10 font-bold">{time}</span>
                        {isBlocked && (
                          <span className="text-xs bg-orange-500/30 text-orange-200 px-2 py-0.5 rounded-full w-full">Bloqueado</span>
                        )}
                        {isBooked && !isBlocked && (
                          <span className="text-xs bg-red-500/30 text-red-200 px-2 py-0.5 rounded-full w-full">Ocupado</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        
      </div>
    );
  };

  const renderListView = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#F0B35B]" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-500 py-8">
          {error}
        </div>
      );
    }

    if (appointments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center text-gray-400 py-12 bg-[#252B3B]/30 rounded-xl border border-[#F0B35B]/10">
          <CalendarIcon className="w-12 h-12 text-gray-500 mb-3 opacity-50" />
          <p>Nenhum agendamento encontrado para este barbeiro.</p>
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
      <div className="space-y-6 max-w-3xl mx-auto">
        {sortedDates.map(date => {
          const dateAppointments = groupedAppointments[date];
          dateAppointments.sort((a, b) => a.time.localeCompare(b.time));

          return (
            <div key={date} className="bg-[#1A1F2E] rounded-lg p-5 shadow-lg border border-[#F0B35B]/20">
              <h3 className="text-[#F0B35B] font-medium mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#F0B35B]" />
                {(() => {
                  const dateParts = date.split('-');
                  const year = parseInt(dateParts[0]);
                  const month = parseInt(dateParts[1]) - 1;
                  const day = parseInt(dateParts[2]);
                  const dateObj = new Date(year, month, day, 12, 0, 0);
                  return dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
                })()}
              </h3>
              <div className="space-y-3">
                {dateAppointments.map(appointment => (
                  <div 
                    key={appointment.id} 
                    className={`flex justify-between items-center p-4 rounded-lg transition-all duration-200 hover:shadow-md
                      ${appointment.isBlocked 
                        ? 'bg-orange-500/10 border border-orange-500/30' 
                        : 'bg-[#252B3B] border border-[#F0B35B]/10'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-[#1A1F2E] p-2 rounded-lg">
                        <Clock className="w-5 h-5 text-[#F0B35B]" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">{appointment.time}</p>
                        <p className="text-sm text-gray-400">
                          {appointment.isBlocked 
                            ? 'Horário Bloqueado' 
                            : `${appointment.clientName || 'Cliente'} - ${appointment.serviceName || 'Serviço'}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAppointmentToDelete(appointment);
                        setIsDeleteConfirmOpen(true);
                      }}
                      className="p-2 hover:bg-red-500/20 rounded-full transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
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
    <div className="bg-[#1A1F2E] rounded-xl border border-[#F0B35B]/20 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#F0B35B] to-[#D4943D]">
          Gerenciamento de Horários
        </h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-[#F0B35B]/10 rounded-full">
          <Clock className="w-4 h-4 text-[#F0B35B]" />
          <span className="text-sm text-[#F0B35B]">Agenda</span>
        </div>
      </div>

      {userRole === 'admin' ? (
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Selecione o Barbeiro</label>
          <select
            value={selectedBarber}
            onChange={(e) => setSelectedBarber(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[#252B3B] border border-[#F0B35B]/20 text-white focus:border-[#F0B35B] transition-all"
          >
            <option value="">Selecione...</option>
            {barbers.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* Botões de alternância de visualização */}
      <div className="flex justify-center mb-2">
        <div className="bg-[#252B3B] p-1.5 rounded-lg flex space-x-1 shadow-lg border border-[#F0B35B]/10">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2
              ${viewMode === 'calendar' 
                ? 'bg-[#F0B35B] text-black shadow-inner' 
                : 'bg-transparent text-white hover:bg-[#1A1F2E]'}
            `}
          >
            <CalendarIcon className="w-4 h-4" />
            Calendário
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2
              ${viewMode === 'list' 
                ? 'bg-[#F0B35B] text-black shadow-inner' 
                : 'bg-transparent text-white hover:bg-[#1A1F2E]'}
            `}
          >
            <Clock className="w-4 h-4" />
            Lista
          </button>
        </div>
      </div>

      {selectedBarber && (
        <div className="space-y-4">
          {viewMode === 'calendar' ? renderCalendarView() : renderListView()}
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