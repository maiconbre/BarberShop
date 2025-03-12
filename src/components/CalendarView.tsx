import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter } from 'lucide-react';

interface Appointment {
  id: string;
  date: string;
  status: 'pending' | 'confirmed' | 'completed';
  barberId?: string;
}

interface CalendarViewProps {
  appointments: Appointment[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  currentUser?: {
    id: string;
    role?: string;
  };
  startDate?: string | null;
  endDate?: string | null;
  isRangeFilterActive?: boolean;
  onToggleRangeFilter?: () => void;
  onResetFilters?: () => void;
  totalValue?: number;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  selectedDate,
  onDateSelect,
  startDate,
  endDate,
  currentUser,
  isRangeFilterActive = false,
  onToggleRangeFilter = () => {},
  onResetFilters = () => {},
  totalValue = 0
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  // Função para obter o primeiro dia do mês
  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return firstDay.getDay();
  };

  // Função para obter o número de dias no mês
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Função para verificar se uma data tem agendamentos
  const hasAppointments = (date: string) => {
    // Filtra os agendamentos com base no usuário logado
    const filteredAppointments = appointments.filter(app => {
      // Se for admin, mostra todos os agendamentos
      if (currentUser?.role === 'admin') {
        return true;
      }
      // Se não for admin, mostra apenas os agendamentos do barbeiro logado
      return app.barberId === currentUser?.id;
    });
    
    return filteredAppointments.some(app => app.date === date);
  };

  // Função para verificar se uma data é hoje
  const isToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  // Função para navegar entre os meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isDateInRange = (date: string) => {
    if (!startDate || !endDate) return false;
    const current = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return current >= start && current <= end;
  };


  // Função para determinar o estilo da data baseado em seu estado
  const getDateStyles = (date: string, hasApps: boolean) => {
    const isRangeActive = startDate !== null;
    const isTodayDate = isToday(date);
    const isDateSelected = date === selectedDate || date === startDate;
    const isInRange = isDateInRange(date);

    if (isRangeActive) {
      if (isDateSelected) {
        return 'bg-[#F0B35B] text-black font-bold';
      }
      if (isInRange) {
        return 'bg-[#F0B35B]/30 text-white hover:bg-[#F0B35B]/40';
      }
      return hasApps ? 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]' : 'bg-[#252B3B]/50 text-gray-400 hover:bg-[#252B3B]';
    }

    if (isDateSelected) {
      return 'bg-[#F0B35B] text-black font-bold';
    }
    if (isTodayDate && !isRangeActive) {
      return 'bg-[#F0B35B]/20 text-white';
    }
    return hasApps ? 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]' : 'bg-[#252B3B]/50 text-gray-400 hover:bg-[#252B3B]';
  };

  // Gera o grid do calendário
  const generateCalendarGrid = () => {
    const firstDay = getFirstDayOfMonth(currentMonth);
    const daysInMonth = getDaysInMonth(currentMonth);
    const grid = [];

    // Adiciona os dias vazios no início do mês
    for (let i = 0; i < firstDay; i++) {
      grid.push(<div key={`empty-${i}`} className="h-10 sm:h-14"></div>);
    }

    // Adiciona os dias do mês com estilos atualizados
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        .toISOString()
        .split('T')[0];

      const hasApps = hasAppointments(date);
      const dateStyles = getDateStyles(date, hasApps);

      grid.push(
        <motion.button
          key={date}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDateSelect(date)}
          className={`relative h-10 sm:h-14 rounded-lg flex items-center justify-center transition-all duration-300
            ${dateStyles}
          `}
        >
          <span className="text-sm sm:text-base">
            {day}
          </span>
          {hasApps && !isDateInRange(date) && date !== selectedDate && date !== startDate && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
              <div className="w-1 h-1 rounded-full bg-[#F0B35B]"></div>
            </div>
          )}
        </motion.button>
      );
    }

    return grid;
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Filtrar agendamentos com base na data selecionada ou no intervalo de datas
  const filteredAppointments = appointments.filter(app => {
    if (!isRangeFilterActive || !startDate) {
      return app.date === selectedDate;
    }
    
    if (startDate && endDate) {
      const appDate = new Date(app.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return appDate >= start && appDate <= end;
    }
    
    return app.date === startDate;
  });

  return (
    <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl p-4 sm:p-6 shadow-lg border border-[#F0B35B]/10">
      {/* Card Unificado com Estatísticas e Filtros */}
      <div className="mb-6">
        <div className="flex flex-col gap-4">
          {/* Linha Superior - Valor Total e Total de Agendamentos */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch gap-3">
            <div className="flex-1 bg-[#252B3B] p-3 rounded-lg">
              <div className="text-gray-400 text-xs mb-1">Total de agendamentos</div>
              <div className="text-white text-lg font-medium">{filteredAppointments.length}</div>
            </div>
            <div className="flex-1 bg-[#252B3B] p-3 rounded-lg">
              <div className="text-gray-400 text-xs mb-1">Valor total do período</div>
              <div className="text-[#F0B35B] text-lg font-bold">
                R$ {totalValue.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Linha Inferior - Botões de Filtro */}
          <div className="flex flex-wrap gap-3 items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleRangeFilter}
              className={`flex-1 min-w-[160px] px-4 py-2.5 rounded-lg transition-all duration-300 ${isRangeFilterActive ? 'bg-[#F0B35B] text-black shadow-lg' : 'bg-[#252B3B] text-white hover:bg-[#2A3040]'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <Filter className="w-4 h-4" />
                {isRangeFilterActive ? '✓ Filtro Ativo' : 'Filtrar por Período'}
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onResetFilters}
              className="flex-1 min-w-[160px] px-4 py-2.5 rounded-lg bg-[#252B3B] text-white hover:bg-[#2A3040] transition-all duration-300"
            >
              <span className="flex items-center justify-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Resetar Filtros
              </span>
            </motion.button>

            {/* Indicador de Período Selecionado */}
            {isRangeFilterActive && (startDate || endDate) && (
              <div className="w-full sm:w-auto flex-1 bg-[#252B3B] px-4 py-2.5 rounded-lg">
                <div className="text-[#F0B35B] text-sm font-medium text-center">
                  {!endDate && startDate && (
                    <>Início: {new Date(startDate).toLocaleDateString('pt-BR')}</>
                  )}
                  {startDate && endDate && (
                    <>
                      {new Date(startDate).toLocaleDateString('pt-BR')} 
                      <span className="mx-2">→</span>
                      {new Date(endDate).toLocaleDateString('pt-BR')}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Separador Estilizado */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#F0B35B]/20"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#252B3B] px-4 text-sm text-gray-400">Calendário</span>
        </div>
      </div>

      {/* Cabeçalho do Calendário */}
      <div className="flex justify-between items-center mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-[#252B3B] rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </motion.button>

        <h2 className="text-lg sm:text-xl font-semibold text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-[#252B3B] rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </motion.button>
      </div>

      {/* Dias da Semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="h-8 flex items-center justify-center">
            <span className="text-xs text-gray-400">{day}</span>
          </div>
        ))}
      </div>

      {/* Grid do Calendário */}
      <div className="grid grid-cols-7 gap-1">
        {generateCalendarGrid()}
      </div>

      {/* Legenda */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-[#F0B35B] mr-2"></div>
          <span>Selecionado</span>
        </div>
        {startDate && (
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-[#F0B35B]/30 mr-2"></div>
            <span>Período</span>
          </div>
        )}
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-[#1A1F2E] mr-2"></div>
          <span>Com agendamentos</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
          <span>Hoje</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;