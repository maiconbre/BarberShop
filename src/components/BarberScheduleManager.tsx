import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Loader2, AlertCircle, CheckCircle2, Scissors, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SCHEDULE_CONFIG = {
  DEFAULT_TIME_SLOTS: [
    '09:00', '10:00', '11:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00', '20:00'
  ],
  AVAILABLE_DAYS: 15,
  SUCCESS_MESSAGE_DURATION: 2000
};

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

const BarberScheduleManager = forwardRef<{ save: () => Promise<void> }, BarberScheduleManagerProps>(
  ({ barberId, barberName, barbers = [], onBarberSelect }, ref) => {
    const { getCurrentUser } = useAuth();
    const currentUser = getCurrentUser();
    const isAdmin = currentUser?.role === 'admin';
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTimeSlots, setSelectedTimeSlots] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set());

    // Gerar datas disponíveis
    const availableDates = useMemo(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return Array.from({ length: SCHEDULE_CONFIG.AVAILABLE_DAYS }, (_, i) => 
        addDays(today, i)
      );
    }, []);

    // Carregar slots bloqueados ao iniciar
    useEffect(() => {
      const loadBlockedSlots = async () => {
        try {
          const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/appointments`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const data = await response.json();
          if (data.success) {
            const blocked = new Set<string>(
              data.data
                .filter((app: any) => app.barberId === barberId)
                .map((app: any) => `${app.date}-${app.time}`)
            );
            setBlockedSlots(blocked);
          }
        } catch (err) {
          console.error('Erro ao carregar horários bloqueados:', err);
        }
      };

      if (barberId) {
        loadBlockedSlots();
      }
    }, [barberId]);

    // Toggle seleção de horário
    const toggleTimeSlot = useCallback((date: string, time: string) => {
      const slotKey = `${date}-${time}`;
      setSelectedTimeSlots(prev => {
        const newSet = new Set(prev);
        if (newSet.has(slotKey)) {
          newSet.delete(slotKey);
        } else {
          newSet.add(slotKey);
        }
        return newSet;
      });
    }, []);

    // Salvar horários bloqueados como agendamentos
    const saveBarberSchedule = useCallback(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const appointments = Array.from(selectedTimeSlots).map(slot => {
          const [date, time] = slot.split('-');
          return {
            barberId,
            barberName,
            date,
            time,
            clientName: 'BLOCKED',
            serviceName: 'BLOCKED',
            status: 'confirmed',
            price: 0
          };
        });

        const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/appointments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(appointments)
        });

        if (!response.ok) throw new Error('Erro ao salvar horários');

        const data = await response.json();
        if (data.success) {
          setSaveSuccess(true);
          setBlockedSlots(prev => new Set([...prev, ...selectedTimeSlots]));
          setSelectedTimeSlots(new Set());
          setTimeout(() => setSaveSuccess(false), SCHEDULE_CONFIG.SUCCESS_MESSAGE_DURATION);
        }
      } catch (err) {
        console.error('Erro ao salvar horários:', err);
        setError('Não foi possível salvar os horários');
      } finally {
        setIsLoading(false);
      }
    }, [barberId, barberName, selectedTimeSlots]);

    useImperativeHandle(ref, () => ({
      save: saveBarberSchedule
    }), [saveBarberSchedule]);

    return (
      <div className="space-y-6 bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl p-4 sm:p-6 shadow-lg border border-[#F0B35B]/10">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Clock className="mr-2 text-[#F0B35B]" />
          Gerenciar Horários - {barberName}
        </h2>

        {/* Seleção de barbeiro para admins */}
        {isAdmin && barbers.length > 0 && (
          <div className="mb-4">
            <h3 className="text-white text-lg font-medium mb-3 flex items-center">
              <Users className="mr-2 text-[#F0B35B]" />
              Selecionar Barbeiro:
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {barbers.map((barber) => (
                <button
                  key={barber.id}
                  onClick={() => onBarberSelect?.(barber.id)}
                  className={`
                    py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200
                    ${barber.id === barberId 
                      ? 'bg-[#F0B35B] text-black' 
                      : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'}
                  `}
                >
                  <Scissors className="w-4 h-4 mx-auto mb-1" />
                  {barber.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensagens de feedback */}
        {error && (
          <div className="p-4 bg-red-500/20 text-red-300 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 bg-green-500/20 text-green-300 rounded-lg flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Horários salvos com sucesso!
          </div>
        )}

        {/* Seleção de data */}
        <div className="mb-6">
          <h3 className="text-white text-lg font-medium mb-3">Selecione uma data:</h3>
          <div className="flex overflow-x-auto pb-2 hide-scrollbar">
            <div className="flex space-x-2">
              {availableDates.map(date => {
                const formattedDate = format(date, 'yyyy-MM-dd');
                return (
                  <button
                    key={formattedDate}
                    onClick={() => setSelectedDate(formattedDate)}
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-lg min-w-[80px]
                      transition-all duration-200 transform hover:scale-105
                      ${selectedDate === formattedDate 
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

        {/* Grade de horários */}
        {selectedDate && (
          <div className="mt-6">
            <h3 className="text-white text-lg font-medium mb-3">
              Horários para {format(parseISO(selectedDate), 'dd/MM/yyyy')}:
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {SCHEDULE_CONFIG.DEFAULT_TIME_SLOTS.map(time => {
                const slotKey = `${selectedDate}-${time}`;
                const isBlocked = blockedSlots.has(slotKey);
                const isSelected = selectedTimeSlots.has(slotKey);

                return (
                  <button
                    key={time}
                    onClick={() => !isBlocked && toggleTimeSlot(selectedDate, time)}
                    disabled={isBlocked}
                    className={`
                      py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200
                      ${isBlocked || isSelected
                        ? 'bg-red-500/20 text-red-300 cursor-not-allowed hover:bg-red-500/30' 
                        : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'}
                    `}
                  >
                    {time}
                    {isBlocked && <span className="block text-xs mt-1">(Bloqueado)</span>}
                    {isSelected && <span className="block text-xs mt-1">(Selecionado)</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#F0B35B]" />
          </div>
        )}
      </div>
    );
  }
);

export default React.memo(BarberScheduleManager);