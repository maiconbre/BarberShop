import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarIcon, Filter, Users, Award, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, AreaChart, Area, CartesianGrid } from 'recharts';

interface Appointment {
  id: string;
  clientName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed';
  barberId?: string;
  barberName?: string;
  price?: number;
  service?: string;
  isBlocked?: boolean;
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#F0B35B'];

const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  selectedDate,
  onDateSelect,
  startDate,
  endDate,
  currentUser,
  isRangeFilterActive = false,
  onToggleRangeFilter = () => { },
  onResetFilters = () => { },
  totalValue = 0
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Detectar se é dispositivo móvel
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Manipuladores de toque para gestos em dispositivos móveis
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current && touchEndX.current) {
      const diff = touchStartX.current - touchEndX.current;
      if (Math.abs(diff) > 50) {
        // Swipe para esquerda ou direita
        navigateMonth(diff > 0 ? 'next' : 'prev');
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Dados para o gráfico de recorrência com memoização
  const recurrenceData = useMemo(() => {
    const recurrenceMap: { [key: string]: number } = {
      '1 visita': 0,
      '2 visitas': 0,
      '3 visitas': 0,
      '4 visitas': 0,
      '5+ visitas': 0
    };

    // Mapa para contar visitas por cliente
    const clientVisits: Record<string, number> = {};

    // Contar visitas por cliente
    appointments.forEach(app => {
      if (app.clientName) {
        const clientKey = app.clientName.toLowerCase();
        clientVisits[clientKey] = (clientVisits[clientKey] || 0) + 1;
      }
    });

    // Preencher o mapa de recorrência
    Object.values(clientVisits).forEach(visits => {
      if (visits === 1) recurrenceMap['1 visita']++;
      else if (visits === 2) recurrenceMap['2 visitas']++;
      else if (visits === 3) recurrenceMap['3 visitas']++;
      else if (visits === 4) recurrenceMap['4 visitas']++;
      else recurrenceMap['5+ visitas']++;
    });

    return Object.entries(recurrenceMap)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [appointments]);

  // Calcular estatísticas de clientes com memoização
  const clientStats = useMemo(() => {
    // Extrair nomes de clientes únicos
    const uniqueClients = new Set<string>();
    appointments.forEach(app => {
      if (app.clientName) {
        uniqueClients.add(app.clientName.toLowerCase());
      }
    });

    // Mapa para contar visitas por cliente
    const clientVisits: Record<string, number> = {};
    appointments.forEach(app => {
      if (app.clientName) {
        const clientKey = app.clientName.toLowerCase();
        clientVisits[clientKey] = (clientVisits[clientKey] || 0) + 1;
      }
    });

    // Calcular clientes que retornam (com mais de uma visita)
    const returningClients = Object.values(clientVisits).filter(visits => visits > 1).length;

    // Calcular clientes novos (com apenas uma visita)
    const newClients = Object.values(clientVisits).filter(visits => visits === 1).length;

    // Calcular ticket médio
    const totalRevenue = appointments.reduce((sum, app) => sum + (app.price || 0), 0);
    const ticketMedio = appointments.length > 0 ? totalRevenue / appointments.length : 0;

    return {
      totalClients: uniqueClients.size,
      returningClients,
      newClients,
      ticketMedio
    };
  }, [appointments]);

  // Função para obter o primeiro dia do mês com memoização
  const getFirstDayOfMonth = useCallback((date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return firstDay.getDay();
  }, []);

  // Função para obter o número de dias no mês com memoização
  const getDaysInMonth = useCallback((date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }, []);

  // Função para verificar se uma data tem agendamentos com memoização
  const hasAppointments = useCallback((date: string) => {
    // Filtra os agendamentos com base no usuário logado
    const filteredAppointments = appointments.filter(app => {
      // Se for admin, mostra todos os agendamentos
      if (currentUser?.role === 'admin') {
        // Excluir agendamentos bloqueados
        if (app.isBlocked) return false;
        return true;
      }
      // Se não for admin, mostra apenas os agendamentos do barbeiro logado
      // e exclui agendamentos bloqueados
      return app.barberId === currentUser?.id && !app.isBlocked;
    });

    return filteredAppointments.some(app => app.date === date);
  }, [appointments, currentUser]);

  // Função para verificar se uma data é hoje com memoização
  const isToday = useCallback((date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  }, []);

  // Função para navegar entre os meses com feedback visual
  const navigateMonth = useCallback(async (direction: 'prev' | 'next') => {
    setIsLoading(true);
    try {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isDateInRange = useCallback((date: string) => {
    if (!startDate || !endDate) return false;
    const current = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return current >= start && current <= end;
  }, [startDate, endDate]);

  // Função para determinar o estilo da data baseado em seu estado com memoização
  const getDateStyles = useCallback((date: string, hasApps: boolean) => {
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
  }, [selectedDate, startDate, endDate]);

  // Gera o grid do calendário com memoização
  const generateCalendarGrid = useCallback(() => {
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
          className={`relative h-10 sm:h-14 rounded-lg flex items-center justify-center transition-all duration-300 will-change-transform
            ${dateStyles}
          `}
        >
          <span className="text-sm sm:text-base">
            {day}
          </span>
        </motion.button>
      );
    }

    return grid;
  }, [currentMonth, hasAppointments, getDateStyles, onDateSelect]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[#F0B35B]" />
          <h2 className="text-lg font-medium text-white">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            disabled={isLoading}
            className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            disabled={isLoading}
            className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div
        ref={calendarRef}
        className="grid grid-cols-7 gap-1 sm:gap-2 select-none optimize-scroll"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: 'translate3d(0,0,0)',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden'
        }}
      >
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs text-gray-400"
          >
            {day}
          </div>
        ))}
        {generateCalendarGrid()}
      </div>
    </div>
  );
};

export default React.memo(CalendarView);