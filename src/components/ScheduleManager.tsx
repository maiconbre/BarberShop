import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Calendar as CalendarIcon, X, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import CacheService from '../services/CacheService';
import { adjustToBrasilia, formatToISODate, BRASILIA_TIMEZONE } from '../utils/DateTimeUtils';

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
}

const timeSlots = [
  '09:00', '10:00', '11:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00'
];

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

  // Usando a função importada do utilitário centralizado
  // Não precisamos mais definir esta função localmente

  const fetchAppointments = useCallback(async () => {
    if (!selectedBarber) return;
    
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
      
      // Filtrar apenas os agendamentos do barbeiro selecionado
      const filteredAppointments = jsonData.data.filter(
        (appointment: Appointment) => 
          appointment.barberId === selectedBarber || 
          appointment.barberName === selectedBarber
      );
      
      setAppointments(filteredAppointments);
      
      // Salvar no cache para acesso offline
      await CacheService.setCache(`appointments_${selectedBarber}`, filteredAppointments);
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
      setError('Não foi possível carregar os horários. Tente novamente.');
      
      // Tentar carregar do cache se a API falhar
      try {
        const cachedAppointments = await CacheService.getCache<Appointment[]>(`appointments_${selectedBarber}`);
        if (cachedAppointments && cachedAppointments.length > 0) {
          setAppointments(cachedAppointments);
          setError('Usando dados em cache. Alguns dados podem estar desatualizados.');
        }
      } catch (cacheErr) {
        console.error('Erro ao carregar do cache:', cacheErr);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedBarber]);

  useEffect(() => {
    if (selectedBarber) {
      fetchAppointments();
      const interval = setInterval(fetchAppointments, 30000); // Atualiza a cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [selectedBarber, fetchAppointments]);

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

    setIsLoading(true);
    try {
      const barberName = barbers.find(b => b.id === selectedBarber)?.name || 'Desconhecido';
      // Usar a função do utilitário para formatar a data no fuso horário de Brasília
      const formattedDate = formatToISODate(selectedDate);

      // Criar um agendamento bloqueado
      const appointmentData = {
        clientName: blockedAppointmentData.name,
        wppclient: blockedAppointmentData.phone,
        serviceName: blockedAppointmentData.service,
        date: formattedDate,
        time: selectedTime,
        barberId: selectedBarber,
        barberName: barberName,
        price: blockedAppointmentData.price,
        isBlocked: true
      };

      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(appointmentData)
      });

      if (response.ok) {
        const result = await response.json();
        
        const newAppointment = {
          id: result.data.id,
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
        
        setAppointments(prev => [...prev, newAppointment]);
        toast.success('Horário bloqueado com sucesso!');
        setIsConfirmOpen(false);
        setSelectedTime(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao bloquear horário');
      }
    } catch (error) {
      console.error('Erro ao bloquear horário:', error);
      toast.error('Erro ao bloquear horário');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAppointment = async () => {
    if (!appointmentToDelete) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/appointments/${appointmentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setAppointments(prev => 
          prev.filter(app => app.id !== appointmentToDelete.id)
        );
        toast.success(appointmentToDelete.isBlocked 
          ? 'Horário desbloqueado com sucesso!' 
          : 'Agendamento cancelado com sucesso!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir agendamento');
      }
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      toast.error('Erro ao excluir agendamento');
    } finally {
      setIsLoading(false);
      setIsDeleteConfirmOpen(false);
      setAppointmentToDelete(null);
    }
  };

  const getAppointmentForTimeSlot = useCallback((date: Date, time: string): Appointment | null => {
    if (!date) return null;
    
    const dateInBrasilia = adjustToBrasilia(date);
    const formattedDate = format(dateInBrasilia, 'yyyy-MM-dd');
    
    return appointments.find(
      appointment => 
        appointment.date === formattedDate && 
        appointment.time === time && 
        (appointment.barberId === selectedBarber || appointment.barberName === selectedBarber)
    ) || null;
  }, [appointments, selectedBarber]);

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
                  const appointment = getAppointmentForTimeSlot(selectedDate, time);
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
          <Calendar className="w-12 h-12 text-gray-500 mb-3 opacity-50" />
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
          // Ordenar por horário
          dateAppointments.sort((a, b) => {
            return a.time.localeCompare(b.time);
          });

          return (
            <div key={date} className="bg-[#1A1F2E] rounded-lg p-5 shadow-lg border border-[#F0B35B]/20">
              <h3 className="text-[#F0B35B] font-medium mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#F0B35B]" />
                {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <div className="space-y-3">
                {dateAppointments.map(appointment => (
                  <div 
                    key={`${appointment.id}-${appointment.time}`} 
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