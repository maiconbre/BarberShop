import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar as CalendarIcon, X, AlertCircle } from 'lucide-react';
import Calendar from './Calendar';
import toast from 'react-hot-toast';
import CacheService from '../services/CacheService';

interface BlockAppointmentProps {
  barbers: Array<{ id: string; name: string }>;
  userRole: 'admin' | 'barber';
  currentBarberId?: string;
}

interface BlockedTime {
  id?: string;
  date: string;
  time: string;
  barberId: string;
  barberName?: string;
  isBlocked: boolean;
}

const BlockAppointment: React.FC<BlockAppointmentProps> = ({
  barbers,
  userRole,
  currentBarberId
}) => {
  const [selectedBarber, setSelectedBarber] = useState(currentBarberId || '');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [preloadedAppointments, setPreloadedAppointments] = useState<any[]>([]);

  // Dados genéricos para agendamento fake
  const fakeClientData = {
    name: "Horário Bloqueado",
    phone: "00000000000",
    email: "bloqueado@sistema.com"
  };
  
  // Função para carregar horários bloqueados do cache
  const loadBlockedTimes = useCallback(async () => {
    try {
      // Primeiro tenta buscar do CacheService
      const cachedBlockedTimes = await CacheService.getCache<BlockedTime[]>('blockedTimes');
      
      if (cachedBlockedTimes && cachedBlockedTimes.length > 0) {
        setBlockedTimes(cachedBlockedTimes);
        
        // Converter para o formato de appointments para o componente Calendar
        const formattedAppointments = cachedBlockedTimes.map(block => ({
          id: block.id || `blocked-${block.date}-${block.time}`,
          date: block.date,
          time: block.time,
          barberId: block.barberId,
          barberName: block.barberName || barbers.find(b => b.id === block.barberId)?.name || 'Desconhecido',
          status: 'pending' as const,
          service: 'Horário Bloqueado',
          clientName: 'Bloqueado',
          price: 0
        }));
        
        setPreloadedAppointments(formattedAppointments);
      } else {
        // Fallback para localStorage se não encontrar no cache
        const localBlockedTimes = localStorage.getItem('blockedTimes');
        if (localBlockedTimes) {
          const parsedTimes = JSON.parse(localBlockedTimes) as BlockedTime[];
          setBlockedTimes(parsedTimes);
          
          // Migrar do localStorage para o CacheService
          await CacheService.setCache('blockedTimes', parsedTimes);
          
          // Converter para o formato de appointments
          const formattedAppointments = parsedTimes.map(block => ({
            id: block.id || `blocked-${block.date}-${block.time}`,
            date: new Date(block.date).toISOString().split('T')[0],
            time: block.time,
            barberId: block.barberId,
            barberName: block.barberName || barbers.find(b => b.id === block.barberId)?.name || 'Desconhecido',
            status: 'pending' as const,
            service: 'Horário Bloqueado',
            clientName: 'Bloqueado',
            price: 0
          }));
          
          setPreloadedAppointments(formattedAppointments);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar horários bloqueados:', error);
    }
  }, [barbers]);

  const handleTimeSelect = useCallback((date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setIsConfirmOpen(true);
  }, []);

  // Efeito para carregar horários bloqueados quando o componente montar
  useEffect(() => {
    loadBlockedTimes();
  }, [loadBlockedTimes]);

  const createFakeAppointment = async () => {
    if (!selectedDate || !selectedTime || !selectedBarber) return;

    setIsLoading(true);
    try {
      // Obter o nome do barbeiro selecionado
      const barberName = barbers.find(b => b.id === selectedBarber)?.name || 'Desconhecido';
      
      // Formatar a data para o formato yyyy-MM-dd
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      // Criar novo bloco de horário
      const newBlock: BlockedTime = {
        id: `blocked-${formattedDate}-${selectedTime}`,
        date: formattedDate,
        time: selectedTime,
        barberId: selectedBarber,
        barberName: barberName,
        isBlocked: true
      };
      
      // Atualizar o estado local
      const updatedBlockedTimes = [...blockedTimes, newBlock];
      setBlockedTimes(updatedBlockedTimes);
      
      // Salvar no CacheService
      await CacheService.setCache('blockedTimes', updatedBlockedTimes);
      
      // Manter compatibilidade com localStorage
      localStorage.setItem('blockedTimes', JSON.stringify(updatedBlockedTimes));
      
      // Atualizar os agendamentos pré-carregados para o Calendar
      const newAppointment = {
        id: newBlock.id,
        date: formattedDate,
        time: selectedTime,
        barberId: selectedBarber,
        barberName: barberName,
        status: 'pending' as const,
        service: 'Horário Bloqueado',
        clientName: 'Bloqueado',
        price: 0
      };
      
      setPreloadedAppointments(prev => [...prev, newAppointment]);

      toast.success('Horário bloqueado com sucesso!');
      setIsConfirmOpen(false);
      setSelectedDate(null);
      setSelectedTime(null);
    } catch (error) {
      toast.error('Erro ao bloquear horário. Tente novamente.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#1A1F2E] rounded-xl border border-[#F0B35B]/20 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#F0B35B] to-[#D4943D]">
          Bloquear Horários
        </h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-[#F0B35B]/10 rounded-full">
          <Clock className="w-4 h-4 text-[#F0B35B]" />
          <span className="text-sm text-[#F0B35B]">Gerenciamento</span>
        </div>
      </div>

      {userRole === 'admin' && (
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
      )}

      {selectedBarber && (
        <div className="space-y-4">
          <Calendar
            selectedBarber={selectedBarber}
            onTimeSelect={handleTimeSelect}
            preloadedAppointments={preloadedAppointments}
          />
        </div>
      )}

      {/* Modal de Confirmação */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#1A1F2E] rounded-xl border border-[#F0B35B]/20 p-6 max-w-md w-full space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#F0B35B]">Confirmar Bloqueio</h3>
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
                  Este horário será marcado como ocupado e não estará disponível para agendamentos de clientes.
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
                onClick={createFakeAppointment}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-[#F0B35B] text-black font-medium hover:bg-[#D4943D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Bloqueando...' : 'Confirmar Bloqueio'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BlockAppointment;
