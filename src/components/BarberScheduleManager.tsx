import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Loader2, AlertCircle, CheckCircle2, Scissors, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Configuration constants
const SCHEDULE_CONFIG = {
  DEFAULT_TIME_SLOTS: [
    '09:00', '10:00', '11:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00', '20:00'
  ],
  AVAILABLE_DAYS: 15,
  SUCCESS_MESSAGE_DURATION: 2000
};

// Type definitions
interface BarberScheduleManagerProps {
  barberId: string;
  barberName: string;
  barbers?: {
    id: string;
    name: string;
    role: string;
  }[];
  onBarberSelect?: (barberId: string) => void;
}

interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

interface DaySchedule {
  date: string;
  timeSlots: TimeSlot[];
}

interface Appointment {
  date: string;
  time: string;
  barberId: string;
}

const BarberScheduleManager = forwardRef<{ save: () => Promise<void> }, BarberScheduleManagerProps>(
  ({ barberId, barberName, barbers = [], onBarberSelect }, ref) => {
    const { getCurrentUser } = useAuth();
    const currentUser = getCurrentUser();
    const isAdmin = currentUser?.role === 'admin';
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

    // Generate available dates with proper timezone handling
    const availableDates = useMemo(() => {
      const today = new Date();
      const brasiliaOffset = -3 * 60;
      const localOffset = today.getTimezoneOffset();
      const offsetDiff = localOffset + brasiliaOffset;
      today.setMinutes(today.getMinutes() + offsetDiff);
      today.setHours(0, 0, 0, 0);
      
      return Array.from({ length: SCHEDULE_CONFIG.AVAILABLE_DAYS }, (_, i) => {
        const date = addDays(new Date(today), i);
        date.setHours(0, 0, 0, 0);
        return date;
      });
    }, []);

    // Fetch appointments with improved error handling
    const fetchAppointments = useCallback(async (): Promise<Appointment[]> => {
      try {
        const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/appointments`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        return data.success 
          ? data.data.filter((app: Appointment) => app.barberId === barberId)
          : [];
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Unable to load appointments. Please try again.');
        return [];
      }
    }, [barberId]);

    // Fetch barber schedule
    const fetchBarberSchedule = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/barber-schedules/${barberId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        if (data.success) {
          // If barber has schedule, use it
          if (data.data && data.data.length > 0) {
            setSchedule(data.data);
          } else {
            // Otherwise, initialize with default schedule
            initializeDefaultSchedule();
          }
        } else {
          throw new Error(data.message || 'Error fetching barber schedule');
        }

        // Fetch appointments to mark booked slots
        const appointmentsData = await fetchAppointments();
        setAppointments(appointmentsData);
      } catch (err) {
        console.error('Error fetching barber schedule:', err);
        setError('Unable to load schedule. Please try again.');
        // Initialize with default schedule on error
        initializeDefaultSchedule();
      } finally {
        setIsLoading(false);
      }
    }, [barberId, fetchAppointments]);

    // Initialize default schedule for all available dates
    const initializeDefaultSchedule = useCallback(() => {
      const newSchedule: DaySchedule[] = availableDates.map(date => ({
        date: format(date, 'yyyy-MM-dd'),
        timeSlots: SCHEDULE_CONFIG.DEFAULT_TIME_SLOTS.map(time => ({
          time,
          isAvailable: true
        }))
      }));
      setSchedule(newSchedule);
    }, [availableDates]);

    // Toggle time slot availability
    const toggleTimeSlotAvailability = useCallback((date: string, time: string) => {
      setSchedule(prevSchedule => {
        return prevSchedule.map(day => {
          if (day.date === date) {
            return {
              ...day,
              timeSlots: day.timeSlots.map(slot => {
                if (slot.time === time) {
                  return { ...slot, isAvailable: !slot.isAvailable };
                }
                return slot;
              })
            };
          }
          return day;
        });
      });
    }, []);

    // Save barber schedule
    const saveBarberSchedule = useCallback(async (): Promise<void> => {
      try {
        const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/barber-schedules/${barberId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ schedule })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Error saving barber schedule');
        }

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), SCHEDULE_CONFIG.SUCCESS_MESSAGE_DURATION);
      } catch (err) {
        console.error('Error saving barber schedule:', err);
        setError('Unable to save schedule. Please try again.');
        throw err; // Re-throw to be caught by the parent component
      }
    }, [barberId, schedule]);

    // Expose save method to parent component
    useImperativeHandle(ref, () => ({
      save: saveBarberSchedule
    }), [saveBarberSchedule]);

    // Check if a time slot is booked
    const isTimeSlotBooked = useCallback((date: string, time: string): boolean => {
      return appointments.some(app => app.date === date && app.time === time);
    }, [appointments]);

    // Load data on component mount
    useEffect(() => {
      // Só busca dados quando o barberId for válido
      if (barberId) {
        fetchBarberSchedule();
      }
    }, [fetchBarberSchedule, barberId]);

    // Handle date selection
    const handleDateSelect = useCallback((date: string) => {
      setSelectedDate(date);
    }, []);

    return (
      <div id="barber-schedule-manager" className="space-y-6">
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl p-4 sm:p-6 shadow-lg border border-[#F0B35B]/10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Clock className="mr-2 text-[#F0B35B]" />
            Gerenciar Horários - {barberName}
          </h2>
          
          {/* Botões de seleção de barbeiros (apenas para administradores) */}
          {isAdmin && barbers.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <Users className="mr-2 text-[#F0B35B]" size={18} />
                <h3 className="text-white text-lg font-medium">Selecione um barbeiro:</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {barbers.map(barber => (
                  <button
                    key={barber.id}
                    onClick={() => onBarberSelect && onBarberSelect(barber.id)}
                    className={`
                      flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${barberId === barber.id
                        ? 'bg-[#F0B35B] text-black'
                        : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B] border border-[#F0B35B]/30'}
                    `}
                  >
                    <Scissors className="mr-2" size={16} />
                    {barber.name}
                  </button>
                ))}
              </div>
              <p className="text-gray-400 text-xs mt-2">
                Como administrador, você pode gerenciar os horários de todos os barbeiros.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              {error}
            </div>
          )}

          {saveSuccess && (
            <div className="bg-green-500/20 text-green-300 p-3 rounded-lg mb-4 flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Horários salvos com sucesso!
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#F0B35B]" />
            </div>
          ) : (
            <>
              {/* Calendar View */}
              <div className="mb-6">
                <h3 className="text-white text-lg font-medium mb-3">Selecione uma data:</h3>
                <div className="flex overflow-x-auto pb-2 hide-scrollbar">
                  <div className="flex space-x-2">
                    {availableDates.map(date => {
                      const formattedDate = format(date, 'yyyy-MM-dd');
                      const isSelected = selectedDate === formattedDate;
                      return (
                        <button
                          key={formattedDate}
                          onClick={() => handleDateSelect(formattedDate)}
                          className={`
                            flex flex-col items-center justify-center p-3 rounded-lg min-w-[80px]
                            transition-all duration-200 transform hover:scale-105
                            ${isSelected
                              ? 'bg-[#F0B35B] text-black'
                              : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}
                          `}
                        >
                          <span className="text-xs opacity-75">
                            {format(date, 'EEE', { locale: ptBR })}
                          </span>
                          <span className="text-lg font-bold">
                            {format(date, 'd')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div className="mt-6">
                  <h3 className="text-white text-lg font-medium mb-3">
                    Horários para {format(parseISO(selectedDate), 'dd/MM/yyyy')}:
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Clique nos horários para marcar como disponível ou indisponível.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {schedule
                      .find(day => day.date === selectedDate)?.timeSlots
                      .map(slot => {
                        const isBooked = isTimeSlotBooked(selectedDate, slot.time);
                        return (
                          <button
                            key={slot.time}
                            onClick={() => !isBooked && toggleTimeSlotAvailability(selectedDate, slot.time)}
                            disabled={isBooked}
                            className={`
                              py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200
                              ${isBooked
                                ? 'bg-red-500/20 text-red-300 cursor-not-allowed'
                                : slot.isAvailable
                                  ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                                  : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'}
                            `}
                          >
                            <span>{slot.time}</span>
                            {isBooked && <span className="block text-xs mt-1">(Reservado)</span>}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
);

export default React.memo(BarberScheduleManager);