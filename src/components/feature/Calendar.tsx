import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { adjustToBrasilia } from '../../utils/DateTimeUtils';

interface CalendarProps {
  selectedBarber: string;
  onTimeSelect?: (date: Date, time: string) => void;
  onTimeRemove?: (date: string, time: string) => void;
  preloadedAppointments?: Appointment[];
  onAppointmentConfirmed?: (appointment: Appointment) => void;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  barberId: string;
  barberName: string;
  isBlocked?: boolean;
  isRemoved?: boolean;
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
  const [appointmentsCache, setAppointmentsCache] = useState<Appointment[]>(preloadedAppointments);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<{date: string, time: string} | null>(null);

  const availableDates = useMemo(() => {
    const today = adjustToBrasilia(new Date());
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 15 }, (_, i) => {
      const date = addDays(today, i);
      date.setHours(0, 0, 0, 0);
      return date;
    });
  }, []);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/appointments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': localStorage.getItem('token') ? 'Bearer ' + localStorage.getItem('token') : ''
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();
      if (!jsonData.success) {
        throw new Error('Erro na resposta da API');
      }
      setAppointmentsCache(jsonData.data);
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
      setError('Não foi possível carregar os horários. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBarber) {
      fetchAppointments();
      const interval = setInterval(fetchAppointments, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedBarber, fetchAppointments]);

  useEffect(() => {
    if (preloadedAppointments?.length > 0) {
      setAppointmentsCache(prev => {
        const existingIds = new Set(prev.map(app => app.id));
        const newAppointments = preloadedAppointments.filter(app => !existingIds.has(app.id));
        return [...prev, ...newAppointments];
      });
    }
  }, [preloadedAppointments]);

  useEffect(() => {
    const handleAppointmentUpdate = (event: CustomEvent) => {
      const updatedAppointment = event.detail;
      if (updatedAppointment.isRemoved) {
        setAppointmentsCache(prev => prev.filter(app => 
          !(app.date === updatedAppointment.date && 
            app.time === updatedAppointment.time && 
            app.barberId === updatedAppointment.barberId)
        ));
      } else {
        setAppointmentsCache(prev => {
          const filtered = prev.filter(app => 
            !(app.date === updatedAppointment.date && 
              app.time === updatedAppointment.time && 
              app.barberId === updatedAppointment.barberId)
          );
          return [...filtered, updatedAppointment];
        });
      }
    };

    window.addEventListener('appointmentUpdate', handleAppointmentUpdate as EventListener);
    window.addEventListener('timeSlotBlocked', handleAppointmentUpdate as EventListener);
    window.addEventListener('timeSlotUnblocked', handleAppointmentUpdate as EventListener);

    return () => {
      window.removeEventListener('appointmentUpdate', handleAppointmentUpdate as EventListener);
      window.removeEventListener('timeSlotBlocked', handleAppointmentUpdate as EventListener);
      window.removeEventListener('timeSlotUnblocked', handleAppointmentUpdate as EventListener);
    };
  }, []);

  const isTimeSlotAvailable = useCallback((date: Date, time: string): boolean => {
    if (!selectedBarber || !date) return false;
    
    const dateInBrasilia = adjustToBrasilia(date);
    const formattedDate = format(dateInBrasilia, 'yyyy-MM-dd');
    
    return !appointmentsCache.some(appointment => 
      appointment.date === formattedDate && 
      appointment.time === time && 
      (appointment.barberId === selectedBarber || appointment.barberName === selectedBarber) && 
      !appointment.isRemoved
    );
  }, [selectedBarber, appointmentsCache]);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  }, []);

  const handleTimeClick = useCallback((time: string) => {
    if (!selectedDate) return;

    const dateInBrasilia = adjustToBrasilia(selectedDate);
    const formattedDate = format(dateInBrasilia, 'yyyy-MM-dd');

    if (!isTimeSlotAvailable(selectedDate, time)) {
      return;
    }

    setSelectedTime(time);
    setPendingSelection({ date: formattedDate, time });
    
    if (onTimeSelect) {
      onTimeSelect(dateInBrasilia, time);
    }
  }, [selectedDate, onTimeSelect, isTimeSlotAvailable]);

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

      {selectedDate && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-[#F0B35B]" />
            </div>
          ) : error ? (
            <div className="col-span-full text-center text-red-500 py-4">
              {error}
            </div>
          ) : (
            timeSlots.map(time => {
              const isPending = pendingSelection?.time === time && 
                              pendingSelection?.date === format(adjustToBrasilia(selectedDate), 'yyyy-MM-dd');
              const isAvailable = isTimeSlotAvailable(selectedDate, time);
              const isSelected = selectedTime === time;
              
              return (
                <button
                  type="button"
                  key={time}
                  onClick={() => handleTimeClick(time)}
                  disabled={!isAvailable}
                  className={`
                    py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300
                    ${!isAvailable 
                      ? 'bg-red-500/20 text-red-300 cursor-not-allowed border border-red-500/30' 
                      : isPending
                        ? 'bg-[#F0B35B] text-black transform scale-105 shadow-md shadow-[#F0B35B]/20' 
                        : isSelected
                          ? 'bg-[#F0B35B]/80 text-black border border-[#F0B35B]'
                          : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B] hover:scale-105 hover:border-[#F0B35B]/30 border border-transparent'}
                  `}
                >
                  <span className="relative z-10">{time}</span>
                  {!isAvailable && (
                    <span className="text-xs block mt-1">
                      Ocupado
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Calendar;
