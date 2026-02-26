import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarIcon, Calendar, Search, CalendarDays, CalendarRange, Grid } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, startOfMonth, endOfMonth, getMonth, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTenant } from '../../contexts/TenantContext';

interface Appointment {
  id: string;
  clientName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  barberId?: string;
  barberName?: string;
  price?: number;
  service?: string;
  isBlocked?: boolean;
  duration?: number; // Duração em minutos
  barbershopId?: string;
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
  barbershopId?: string;
  miniMode?: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  selectedDate,
  onDateSelect,
  startDate,
  endDate,
  currentUser,
  barbershopId: propBarbershopId,
  miniMode = false,
}) => {
  // Multi-tenant context
  const { barbershopId: contextBarbershopId, isValidTenant } = useTenant();
  const activeBarbershopId = propBarbershopId || contextBarbershopId;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentDay, setCurrentDay] = useState(new Date());

  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);

  const [searchTerm, setSearchTerm] = useState<string>('');

  const calendarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const swipeDistance = 50; // Distância mínima para considerar um swipe

  // Screen size detection removed as it was not being used

  // Manipuladores de toque aprimorados para gestos em dispositivos móveis
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current && touchEndX.current && touchStartY.current && touchEndY.current) {
      const diffX = touchStartX.current - touchEndX.current;
      const diffY = touchStartY.current - touchEndY.current;

      // Determinar se o gesto é mais horizontal ou vertical
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Gesto horizontal
        if (Math.abs(diffX) > swipeDistance) {
          // Navegação baseada no modo de visualização atual
          switch (viewMode) {
            case 'day':
              navigateDay(diffX > 0 ? 'next' : 'prev');
              break;
            case 'week':
              navigateWeek(diffX > 0 ? 'next' : 'prev');
              break;
            case 'month':
              navigateMonth(diffX > 0 ? 'next' : 'prev');
              break;
            case 'year':
              navigateYear(diffX > 0 ? 'next' : 'prev');
              break;
          }
        }
      } else {
        // Gesto vertical - pode ser usado para alternar entre modos de visualização
        if (Math.abs(diffY) > swipeDistance * 1.5) {
          if (diffY > 0) {
            // Swipe para baixo - zoom out (mês -> ano)
            zoomOut();
          } else {
            // Swipe para cima - zoom in (ano -> mês)
            zoomIn();
          }
        }
      }
    }

    // Resetar valores
    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;
  };

  // Funções para alternar entre níveis de zoom
  const zoomIn = () => {
    setViewMode(prev => {
      switch (prev) {
        case 'year': return 'month';
        case 'month': return 'week';
        case 'week': return 'day';
        default: return prev;
      }
    });
  };

  const zoomOut = () => {
    setViewMode(prev => {
      switch (prev) {
        case 'day': return 'week';
        case 'week': return 'month';
        case 'month': return 'year';
        default: return prev;
      }
    });
  };





  // Função para obter o primeiro dia do mês com memoização
  const getFirstDayOfMonth = useCallback((date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return firstDay.getDay();
  }, []);

  // Função para obter o número de dias no mês com memoização
  const getDaysInMonth = useCallback((date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }, []);

  // Efeito para fechar o filtro quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtra os agendamentos com base nos filtros selecionados com otimização de performance
  const filteredAppointments = useMemo(() => {
    // Aplicar filtros em etapas para melhorar a performance
    let filtered = appointments;

    // Primeiro aplicar filtros que podem reduzir significativamente o conjunto de dados
    filtered = filtered.filter(app => !app.isBlocked);

    // Filtro por tenant (barbershopId) - crítico para multi-tenant
    if (activeBarbershopId && isValidTenant) {
      // Note: Assuming appointments already come filtered by tenant from the backend
      // This is an additional safety check
      filtered = filtered.filter(app => {
        // If appointment has barbershopId, check it matches
        const appBarbershopId = app.barbershopId;
        return !appBarbershopId || appBarbershopId === activeBarbershopId;
      });
    }

    // Filtro por usuário logado (se não for admin)
    if (currentUser?.role !== 'admin' && currentUser?.id) {
      filtered = filtered.filter(app => app.barberId === currentUser.id);
    }

    // Aplicar filtros específicos
    return filtered.filter(app => {
      // Filtro por termo de busca (nome do cliente)
      if (searchTerm && !app.clientName?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [appointments, searchTerm, currentUser, activeBarbershopId, isValidTenant]);

  // Função para verificar se uma data tem agendamentos com memoização
  const hasAppointments = useCallback((date: string) => {
    return filteredAppointments.some(app => app.date === date);
  }, [filteredAppointments]);

  // Função para verificar se uma data é hoje com memoização
  const isToday = useCallback((date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  }, []);

  // Função para navegar entre os dias
  const navigateDay = useCallback((direction: 'prev' | 'next') => {
    setIsLoading(true);
    try {
      setCurrentDay(prev => {
        const newDate = new Date(prev);
        if (direction === 'prev') {
          newDate.setDate(prev.getDate() - 1);
        } else {
          newDate.setDate(prev.getDate() + 1);
        }
        return newDate;
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para navegar entre as semanas com animação suave
  const navigateWeek = useCallback((direction: 'prev' | 'next') => {
    setIsLoading(true);
    try {
      setCurrentWeek(prev => {
        const newDate = new Date(prev);
        if (direction === 'prev') {
          newDate.setDate(prev.getDate() - 7);
        } else {
          newDate.setDate(prev.getDate() + 7);
        }
        return newDate;
      });
    } finally {
      setIsLoading(false);
    }
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

  // Função para navegar entre os anos
  const navigateYear = useCallback((direction: 'prev' | 'next') => {
    setIsLoading(true);
    try {
      setCurrentYear(prev => {
        return direction === 'prev' ? prev - 1 : prev + 1;
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Gerar dias da semana atual
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i);
      return {
        date,
        formattedDate: format(date, 'yyyy-MM-dd'),
        dayOfMonth: format(date, 'd'),
        dayName: format(date, 'EEE', { locale: ptBR }),
        isToday: isSameDay(date, new Date())
      };
    });
  }, [currentWeek]);

  // Gerar horas do dia atual para visualização diária
  const dayHours = useMemo(() => {
    // Horário de funcionamento: 8h às 22h
    return Array.from({ length: 15 }, (_, i) => {
      const hour = i + 8; // Começando às 8h
      return {
        hour,
        formattedHour: `${hour}:00`,
        appointments: filteredAppointments.filter(app => {
          const appDate = app.date;
          const appHour = parseInt(app.time.split(':')[0]);
          return appDate === format(currentDay, 'yyyy-MM-dd') && appHour === hour;
        })
      };
    });
  }, [currentDay, filteredAppointments]);

  // Gerar meses do ano atual para visualização anual
  const yearMonths = useMemo(() => {
    const firstDayOfYear = new Date(currentYear, 0, 1);
    const lastDayOfYear = new Date(currentYear, 11, 31);

    return eachMonthOfInterval({
      start: firstDayOfYear,
      end: lastDayOfYear
    }).map(date => {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const hasAppointmentsInMonth = filteredAppointments.some(app => {
        const appDate = new Date(app.date);
        return appDate >= monthStart && appDate <= monthEnd;
      });

      return {
        date,
        monthName: format(date, 'MMM', { locale: ptBR }),
        monthNumber: getMonth(date),
        hasAppointments: hasAppointmentsInMonth,
        appointmentsCount: filteredAppointments.filter(app => {
          const appDate = new Date(app.date);
          return appDate >= monthStart && appDate <= monthEnd;
        }).length
      };
    });
  }, [currentYear, filteredAppointments]);

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
        return 'bg-primary text-black font-bold shadow-lg shadow-primary/20';
      }
      if (isInRange) {
        return 'bg-primary/30 text-white';
      }
      return hasApps ? 'bg-surface text-white border border-primary/20' : 'bg-background-paper/50 text-gray-400 hover:bg-surface';
    }

    if (isDateSelected) {
      return 'bg-primary text-black font-bold shadow-lg shadow-primary/20 scale-105';
    }
    if (isTodayDate && !isRangeActive) {
      return 'bg-primary/20 text-primary border border-primary/30';
    }
    return hasApps ? 'bg-surface text-white border border-primary/10 hover:border-primary/30' : 'bg-background-paper/50 text-gray-500 hover:bg-surface hover:text-gray-300';
  }, [selectedDate, startDate, endDate, isToday, isDateInRange]);

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
      const appointmentsCount = filteredAppointments.filter(app => app.date === date).length;

      grid.push(
        <motion.button
          key={date}
          onClick={() => onDateSelect(date)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative h-10 sm:h-14 rounded-xl flex flex-col items-center justify-center transition-all duration-200
            ${dateStyles}
          `}
        >
          <span className="text-sm sm:text-base z-10">
            {day}
          </span>
          {hasApps && (
            <div className="absolute bottom-1.5 flex justify-center space-x-0.5">
              {appointmentsCount > 3 ? (
                <span className="text-[9px] text-primary font-bold bg-black/40 px-1 rounded-full">{appointmentsCount}</span>
              ) : (
                Array.from({ length: Math.min(3, appointmentsCount) }).map((_, i) => (
                  <span key={i} className={`w-1 h-1 rounded-full ${date === selectedDate ? 'bg-black' : 'bg-primary'}`}></span>
                ))
              )}
            </div>
          )}
        </motion.button>
      );
    }

    return grid;
  }, [currentMonth, hasAppointments, getDateStyles, onDateSelect, filteredAppointments, getFirstDayOfMonth, getDaysInMonth]);

  // Renderiza a visualização semanal
  const renderWeekView = useCallback(() => {
    return (
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-2">
        {weekDays.map((day) => {
          const hasApps = hasAppointments(day.formattedDate);
          const dateStyles = getDateStyles(day.formattedDate, hasApps);
          const isSelected = day.formattedDate === selectedDate;

          return (
            <div key={day.formattedDate} className="flex flex-col">
              <div className="text-xs text-center text-gray-400 mb-1 font-medium caption">
                {day.dayName}
              </div>
              <motion.button
                onClick={() => onDateSelect(day.formattedDate)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative flex flex-col items-center justify-center p-2 rounded-xl transition-all
                  ${dateStyles} ${day.isToday && !isSelected ? 'ring-1 ring-primary/50' : ''}
                `}
              >
                <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>
                  {day.dayOfMonth}
                </span>
                {hasApps && (
                  <div className="mt-1 flex space-x-0.5">
                    {Array.from({ length: Math.min(3, filteredAppointments.filter(a => a.date === day.formattedDate).length) }).map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-primary'}`}></div>
                    ))}
                  </div>
                )}
              </motion.button>
            </div>
          );
        })}
      </div>
    );
  }, [weekDays, hasAppointments, getDateStyles, selectedDate, onDateSelect, filteredAppointments]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];



  // Renderiza a visualização diária com virtualização para melhor performance
  const renderDayView = useCallback(() => {
    const formattedDate = format(currentDay, 'EEEE, d MMMM', { locale: ptBR });

    return (
      <div className="mt-4 bg-surface/30 rounded-xl p-4 border border-white/5">
        <div className="text-sm text-center text-gray-300 mb-3 capitalize font-medium">
          {formattedDate}
        </div>
        <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 custom-scrollbar">
          {dayHours.map((hourData) => {
            const hasApps = hourData.appointments.length > 0;

            return (
              <div key={hourData.hour} className="flex group">
                <div className="w-12 flex-shrink-0 text-xs text-gray-500 pt-2 font-mono group-hover:text-primary transition-colors">
                  {hourData.formattedHour}
                </div>
                <div className={`flex-grow rounded-lg p-2 min-h-[60px] transition-all duration-200 border border-transparent ${hasApps ? 'bg-surface border-white/5' : 'bg-background-paper/30 hover:bg-surface/50 hover:border-primary/10'}`}>
                  {hasApps ? (
                    <div className="space-y-1">
                      {hourData.appointments.map(app => (
                        <motion.div
                          key={app.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-2 rounded text-xs ${getAppointmentColorByStatus(app.status)} shadow-sm`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">{app.clientName}</span>
                            <span className="font-mono text-[10px] opacity-80">{app.time}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <div className="text-[10px] opacity-80 truncate max-w-[120px]">
                              {app.service}
                            </div>
                            {app.barberName && <div className="text-[9px] px-1.5 py-0.5 bg-black/20 rounded-full">{app.barberName}</div>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          const date = format(currentDay, 'yyyy-MM-dd');
                          onDateSelect(date);
                        }}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        + Agendar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [currentDay, dayHours, onDateSelect]);

  // Renderiza a visualização anual
  const renderYearView = useCallback(() => {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
        {yearMonths.map((month) => {
          const isCurrentMonth = new Date().getMonth() === month.monthNumber &&
            new Date().getFullYear() === currentYear;

          return (
            <motion.button
              key={month.monthNumber}
              onClick={() => {
                setCurrentMonth(month.date);
                setViewMode('month');
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                p-3 rounded-xl flex flex-col items-center justify-center transition-all border
                ${isCurrentMonth ? 'bg-primary/20 ring-1 ring-primary border-primary/30' : 'border-transparent'}
                ${month.hasAppointments ? 'bg-surface text-white border-white/5 hover:border-primary/30' : 'bg-background-paper/30 text-gray-500 hover:bg-surface hover:text-gray-300'}
              `}
            >
              <span className="text-sm font-medium capitalize">{month.monthName}</span>
              {month.hasAppointments && (
                <div className="mt-1 text-[10px] text-primary font-bold">
                  {month.appointmentsCount}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  }, [yearMonths, currentYear]);

  // Função para obter a cor do agendamento baseado no status
  const getAppointmentColorByStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-l-2 border-green-500 pl-1';
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-300 border-l-2 border-blue-500 pl-1';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-l-2 border-red-500 pl-1';
      case 'pending':
      default:
        return 'bg-yellow-500/20 text-yellow-300 border-l-2 border-yellow-500 pl-1';
    }
  };

  return (
    <div className="space-y-4">
      {miniMode ? (
        <div className="flex items-center justify-between mb-4 px-2">
          <button
            onClick={() => navigateMonth('prev')}
            disabled={isLoading}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <span className="text-white font-medium capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            disabled={isLoading}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#F0B35B]" />
            <h2 className="text-lg font-medium text-white truncate">
              {viewMode === 'day' && `${format(currentDay, 'd MMMM yyyy', { locale: ptBR })}`}
              {viewMode === 'week' && `Semana de ${format(weekDays[0].date, 'd MMM', { locale: ptBR })} - ${format(weekDays[6].date, 'd MMM', { locale: ptBR })}`}
              {viewMode === 'month' && `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`}
              {viewMode === 'year' && `${currentYear}`}
            </h2>
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-end">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('day')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'day' ? 'bg-[#F0B35B]/20 text-[#F0B35B]' : 'text-gray-400 hover:text-white hover:bg-[#252B3B]'}`}
                aria-label="Visualização diária"
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'week' ? 'bg-[#F0B35B]/20 text-[#F0B35B]' : 'text-gray-400 hover:text-white hover:bg-[#252B3B]'}`}
                aria-label="Visualização semanal"
              >
                <CalendarRange className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'month' ? 'bg-[#F0B35B]/20 text-[#F0B35B]' : 'text-gray-400 hover:text-white hover:bg-[#252B3B]'}`}
                aria-label="Visualização mensal"
              >
                <CalendarDays className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'year' ? 'bg-[#F0B35B]/20 text-[#F0B35B]' : 'text-gray-400 hover:text-white hover:bg-[#252B3B]'}`}
                aria-label="Visualização anual"
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>

            <div className="relative flex items-center" ref={filterRef}>
              <AnimatePresence>
                {showFilters ? (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex items-center overflow-hidden"
                  >
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar cliente..."
                      className="w-40 sm:w-48 bg-[#252B3B] text-white text-sm rounded-lg px-3 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] border border-gray-600 focus:border-[#F0B35B] transition-colors"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        setShowFilters(false);
                        setSearchTerm('');
                      }}
                      className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#252B3B] transition-colors"
                      aria-label="Fechar busca"
                    >

                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowFilters(true)}
                    className="w-8 h-8 bg-[#252B3B] rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1A1F2E] transition-colors border border-gray-600"
                    aria-label="Buscar cliente"
                  >
                    <Search className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  switch (viewMode) {
                    case 'day':
                      navigateDay('prev');
                      break;
                    case 'week':
                      navigateWeek('prev');
                      break;
                    case 'month':
                      navigateMonth('prev');
                      break;
                    case 'year':
                      navigateYear('prev');
                      break;
                  }
                }}
                disabled={isLoading}
                className={`p-2 rounded-lg hover:bg-[#252B3B] transition-colors
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Anterior"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={() => {
                  switch (viewMode) {
                    case 'day':
                      navigateDay('next');
                      break;
                    case 'week':
                      navigateWeek('next');
                      break;
                    case 'month':
                      navigateMonth('next');
                      break;
                    case 'year':
                      navigateYear('next');
                      break;
                  }
                }}
                disabled={isLoading}
                className={`p-2 rounded-lg hover:bg-[#252B3B] transition-colors
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Próximo"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {viewMode === 'month' && (
          <motion.div
            key="month-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
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
          </motion.div>
        )}
        {viewMode === 'week' && (
          <motion.div
            key="week-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderWeekView()}
          </motion.div>
        )}
        {viewMode === 'day' && (
          <motion.div
            key="day-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderDayView()}
          </motion.div>
        )}
        {viewMode === 'year' && (
          <motion.div
            key="year-view"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {renderYearView()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filters indicator */}
      {searchTerm && (
        <div className="flex items-center justify-between bg-[#252B3B]/50 rounded-lg p-2 mt-2">
          <div className="flex items-center gap-2 text-xs text-gray-300 overflow-x-auto hide-scrollbar">
            <span className="text-[#F0B35B]">Filtros ativos:</span>
            {searchTerm && (
              <span className="bg-[#1A1F2E] px-2 py-0.5 rounded-full text-xs whitespace-nowrap">
                Cliente: {searchTerm}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CalendarView);