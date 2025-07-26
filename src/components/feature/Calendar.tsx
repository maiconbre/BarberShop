import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { adjustToBrasilia } from '../../utils/DateTimeUtils';
import { loadAppointments, isTimeSlotAvailable as checkTimeSlotAvailability, checkLocalAvailability } from '../../services/AppointmentService';
import { toast } from 'react-hot-toast';
import { logger } from '../../utils/logger';
import CacheService from '../../services/CacheService';

interface CalendarProps {
  selectedBarber: string;
  onTimeSelect?: (date: Date, time: string) => void;
  preloadedAppointments?: CalendarAppointment[];
}

interface CalendarAppointment {
  id: string;
  date: string;
  time: string;
  barberId: string;
  barberName: string;
  isBlocked?: boolean;
  isRemoved?: boolean;
  isCancelled?: boolean;
}

const timeSlots = [
  '09:00', '10:00', '11:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00'
];

const Calendar: React.FC<CalendarProps> = ({
  selectedBarber,
  onTimeSelect,
  preloadedAppointments = []
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Gerar datas disponíveis (próximos 15 dias)
  const availableDates = useMemo(() => {
    const today = adjustToBrasilia(new Date());
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 15 }, (_, i) => {
      const date = addDays(today, i);
      date.setHours(0, 0, 0, 0);
      return date;
    });
  }, []);

  // Carregar agendamentos
  const fetchAppointments = useCallback(async () => {
    if (!selectedBarber) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await loadAppointments();
      
      // Garantir que sempre seja um array
      let appointmentsArray: CalendarAppointment[] = [];
      
      if (Array.isArray(data)) {
        appointmentsArray = data;
      } else if (data && typeof data === 'object' && 'data' in data) {
        appointmentsArray = Array.isArray((data as any).data) ? (data as any).data : [];
      }
      
      setAppointments(appointmentsArray);
      
      // Atualizar o cache global com os dados mais recentes
      try {
        // Atualizar o cache global geral de agendamentos
        await CacheService.set('/api/appointments', appointmentsArray);
        
        // Agrupar agendamentos por barbeiro e atualizar caches específicos
        const barberAppointments: Record<string, any[]> = {};
        
        appointmentsArray.forEach((appointment: any) => {
          if (appointment.barberId) {
            if (!barberAppointments[appointment.barberId]) {
              barberAppointments[appointment.barberId] = [];
            }
            barberAppointments[appointment.barberId].push(appointment);
          }
        });
        
        // Atualizar cache para cada barbeiro
        for (const [barberId, appointments] of Object.entries(barberAppointments)) {
          const barberCacheKey = `schedule_appointments_${barberId}`;
          await CacheService.set(barberCacheKey, appointments);
        }
      } catch (cacheError) {
        logger.componentError('Erro ao atualizar cache global:', cacheError);
      }
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
      setError('Não foi possível carregar os horários.');
      setAppointments([]); // Garantir array vazio em caso de erro
    } finally {
      setIsLoading(false);
    }
  }, [selectedBarber]);

  // Carregar agendamentos quando barbeiro for selecionado
  useEffect(() => {
    fetchAppointments();
    
    // Adicionar listener para o evento 'cacheUpdated'
     const handleCacheUpdated = (event: CustomEvent) => {
       const { keys, timestamp } = event.detail;
       logger.componentDebug('Evento cacheUpdated recebido:', { keys, timestamp });
       
       // Verificar se os caches relevantes foram atualizados
       const relevantKeys = [
         '/api/appointments',
         `schedule_appointments_${selectedBarber || ''}`
       ];
       
       const shouldRefresh = keys.some((key: string) => 
         relevantKeys.includes(key) || key.startsWith('schedule_appointments_')
       );
       
       if (shouldRefresh) {
         logger.componentInfo('Atualizando agendamentos após evento cacheUpdated');
         fetchAppointments();
       }
     };
    
    // Adicionar listener para eventos de atualização de cache
    window.addEventListener('cacheUpdated', handleCacheUpdated as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('cacheUpdated', handleCacheUpdated as EventListener);
    };
  }, [fetchAppointments, selectedBarber]);

  // Atualizar com agendamentos pré-carregados
  useEffect(() => {
    if (preloadedAppointments && Array.isArray(preloadedAppointments)) {
      setAppointments(prev => {
        const existingIds = new Set(prev.map(app => app.id));
        const newAppointments = preloadedAppointments.filter(app => !existingIds.has(app.id));
        return [...prev, ...newAppointments];
      });
    }
  }, [preloadedAppointments]);

  // Verificar disponibilidade de um horário de forma assíncrona
  const checkAsyncTimeSlotAvailability = useCallback(async (date: Date, time: string): Promise<boolean> => {
    if (!selectedBarber || !appointments || !Array.isArray(appointments)) {
      return true;
    }
    
    const dateInBrasilia = adjustToBrasilia(date);
    const formattedDate = format(dateInBrasilia, 'yyyy-MM-dd');
    
    try {
      // Usar a função isTimeSlotAvailable do AppointmentService que verifica todos os caches
      return await checkTimeSlotAvailability(
        formattedDate, 
        time, 
        selectedBarber, 
        appointments
      );
    } catch (error) {
      console.error('Erro ao verificar disponibilidade completa:', error);
      
      // Em caso de erro, verificar apenas no cache local
      return checkLocalAvailability(
        formattedDate, 
        time, 
        selectedBarber, 
        appointments
      );
    }
  }, [selectedBarber, appointments]);
  
  // Função para verificar disponibilidade local para feedback imediato na UI
  const isLocallyAvailable = useCallback((date: Date, time: string): boolean => {
    if (!selectedBarber || !appointments || !Array.isArray(appointments)) {
      return true;
    }
    
    const dateInBrasilia = adjustToBrasilia(date);
    const formattedDate = format(dateInBrasilia, 'yyyy-MM-dd');
    
    return !appointments.some(appointment => 
      appointment.date === formattedDate && 
      appointment.time === time && 
      (appointment.barberId === selectedBarber || appointment.barberName === selectedBarber) &&
      !appointment.isCancelled && 
      !appointment.isRemoved
    );
  }, [selectedBarber, appointments]);
  


  // Selecionar data
  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  }, []);

  // Selecionar horário
  const handleTimeClick = useCallback(async (time: string) => {
    if (!selectedDate) {
      toast.error('Selecione uma data primeiro', {
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
      return;
    }
    
    if (!selectedBarber) {
      toast.error('Selecione um barbeiro primeiro', {
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
      return;
    }
    
    // Verificar primeiro no cache local para feedback imediato
    if (!isLocallyAvailable(selectedDate, time)) {
      toast.error('Este horário já está ocupado', {
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
      return;
    }
    
    // Verificar disponibilidade de forma assíncrona
    try {
      const isAvailable = await checkAsyncTimeSlotAvailability(selectedDate, time);
      if (!isAvailable) {
        toast.error('Este horário acabou de ser ocupado por outro cliente', {
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
        return;
      }
    } catch (error) {
      // Se houver erro na verificação global, confiar na verificação local
       logger.componentError('Erro ao verificar disponibilidade global:', error);
    }

    const dateInBrasilia = adjustToBrasilia(selectedDate);
    setSelectedTime(time);
    
    if (onTimeSelect) {
      onTimeSelect(dateInBrasilia, time);
    }
  }, [selectedDate, selectedBarber, onTimeSelect, checkAsyncTimeSlotAvailability, isLocallyAvailable]);

  return (
    <div className="flex flex-col h-full space-y-2 overflow-hidden">
      {/* Seleção de Data */}
      <div className="flex-shrink-0">
        <div className="flex overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex space-x-1 px-1">
            {availableDates.slice(0, 7).map(date => (
              <button
                type="button"
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className={`
                  flex flex-col items-center justify-center p-1.5 rounded-md min-w-[60px] flex-shrink-0
                  transition-all duration-200
                  ${
                    selectedDate && isSameDay(date, selectedDate)
                      ? 'bg-[#F0B35B] text-black'
                      : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'
                  }
                `}
              >
                <span className="text-xs opacity-75">
                  {format(date, 'EEE', { locale: ptBR })}
                </span>
                <span className="text-sm font-bold">
                  {format(date, 'd')}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Seleção de Horário */}
      {selectedDate && (
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-3 gap-1 h-full">
            {isLoading ? (
              <div className="col-span-full flex justify-center items-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#F0B35B]" />
                <span className="ml-2 text-xs text-gray-400">Carregando...</span>
              </div>
            ) : error ? (
              <div className="col-span-full text-center text-red-500 py-2">
                <span className="text-xs">{error}</span>
                <button 
                  onClick={fetchAppointments}
                  className="block mx-auto mt-1 px-2 py-1 text-xs bg-[#F0B35B] text-black rounded-md hover:bg-[#F0B35B]/90 transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : (
              timeSlots.map(time => {
                // Verificar disponibilidade com base no cache local para feedback imediato
                const isLocallyAvailable = selectedDate ? !appointments.some(appointment => 
                  appointment.date === format(adjustToBrasilia(selectedDate), 'yyyy-MM-dd') && 
                  appointment.time === time && 
                  (appointment.barberId === selectedBarber || appointment.barberName === selectedBarber) && 
                  !appointment.isCancelled && 
                  !appointment.isRemoved
                ) : false;
                
                const isSelected = selectedTime === time;
                
                return (
                  <button
                    type="button"
                    key={time}
                    onClick={() => handleTimeClick(time)}
                    disabled={!isLocallyAvailable}
                    className={`
                      py-1.5 px-2 rounded-md text-xs font-medium transition-all duration-200 h-fit
                      ${
                        !isLocallyAvailable 
                          ? 'bg-red-500/20 text-red-300 cursor-not-allowed border border-red-500/30' 
                          : isSelected
                            ? 'bg-[#F0B35B] text-black border border-[#F0B35B]'
                            : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B] hover:border-[#F0B35B]/30 border border-transparent'
                      }
                    `}
                  >
                    <span>{time}</span>
                    {!isLocallyAvailable && (
                      <span className="text-xs block">
                        Ocupado
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
