import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarIcon, Filter, Calendar, Scissors, User, X, Search, CalendarDays, CalendarRange, Grid } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, startOfMonth, endOfMonth, getMonth, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  barbers?: {id: string; name: string}[];
  services?: {id: string; name: string}[];
}


const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  selectedDate,
  onDateSelect,
  startDate,
  endDate,
  currentUser,
  onResetFilters = () => { },
  barbers = [],
  services = []
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentDay, setCurrentDay] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [compactMode, setCompactMode] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const swipeDistance = 50; // Distância mínima para considerar um swipe

  // Detectar tamanho da tela
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsSmallScreen(width < 480);
      setCompactMode(width < 320);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
    
    // Filtro por usuário logado (se não for admin)
    if (currentUser?.role !== 'admin' && currentUser?.id) {
      filtered = filtered.filter(app => app.barberId === currentUser.id);
    }
    
    // Aplicar filtros específicos
    return filtered.filter(app => {
      // Filtro por barbeiro
      if (selectedBarber && app.barberId !== selectedBarber) {
        return false;
      }

      // Filtro por serviço
      if (selectedService && app.service !== selectedService) {
        return false;
      }

      // Filtro por status
      if (selectedStatus && app.status !== selectedStatus) {
        return false;
      }

      // Filtro por faixa de horário
      if (timeRangeFilter) {
        const appHour = parseInt(app.time.split(':')[0]);
        
        switch (timeRangeFilter) {
          case 'morning': // Manhã (6h-12h)
            if (appHour < 6 || appHour >= 12) return false;
            break;
          case 'afternoon': // Tarde (12h-18h)
            if (appHour < 12 || appHour >= 18) return false;
            break;
          case 'evening': // Noite (18h-23h)
            if (appHour < 18 || appHour >= 23) return false;
            break;
        }
      }

      // Filtro por termo de busca (nome do cliente)
      if (searchTerm && !app.clientName?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [appointments, selectedBarber, selectedService, selectedStatus, timeRangeFilter, searchTerm, currentUser]);

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
        return 'bg-[#F0B35B] text-black font-bold';
      }
      if (isInRange) {
        return 'bg-[#F0B35B]/30 text-white';
      }
      return hasApps ? 'bg-[#1A1F2E] text-white' : 'bg-[#252B3B]/50 text-gray-400';
    }

    if (isDateSelected) {
      return 'bg-[#F0B35B] text-black font-bold';
    }
    if (isTodayDate && !isRangeActive) {
      return 'bg-[#F0B35B]/20 text-white';
    }
    return hasApps ? 'bg-[#1A1F2E] text-white' : 'bg-[#252B3B]/50 text-gray-400';
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
      const appointmentsCount = filteredAppointments.filter(app => app.date === date).length;

      grid.push(
        <motion.button
          key={date}
          onClick={() => onDateSelect(date)}
          className={`relative h-10 sm:h-14 rounded-lg flex flex-col items-center justify-center
            ${dateStyles}
          `}
        >
          <span className="text-sm sm:text-base">
            {day}
          </span>
          {hasApps && (
            <div className="absolute bottom-1 flex justify-center space-x-0.5">
              {appointmentsCount > 3 ? (
                <span className="text-[9px] text-[#F0B35B] font-medium">{appointmentsCount}</span>
              ) : (
                Array.from({ length: Math.min(3, appointmentsCount) }).map((_, i) => (
                  <span key={i} className="w-1 h-1 rounded-full bg-[#F0B35B]"></span>
                ))
              )}
            </div>
          )}
        </motion.button>
      );
    }

    return grid;
  }, [currentMonth, hasAppointments, getDateStyles, onDateSelect]);
  
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
              <div className="text-xs text-center text-gray-400 mb-1">
                {day.dayName}
              </div>
              <motion.button
                onClick={() => onDateSelect(day.formattedDate)}
                className={`
                  relative flex flex-col items-center justify-center p-2 rounded-lg
                  ${dateStyles} ${day.isToday ? 'ring-1 ring-[#F0B35B]/50' : ''}
                `}
              >
                <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>
                  {day.dayOfMonth}
                </span>
                {hasApps && (
                  <div className="mt-1 flex space-x-0.5">
                    {Array.from({ length: Math.min(3, filteredAppointments.filter(a => a.date === day.formattedDate).length) }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#F0B35B]"></div>
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

  // Limpar todos os filtros
  const handleClearFilters = () => {
    setSelectedBarber('');
    setSelectedService('');
    setSelectedStatus('');
    setTimeRangeFilter('');
    setSearchTerm('');
    onResetFilters();
  };
  
  // Renderiza a visualização diária com virtualização para melhor performance
  const renderDayView = useCallback(() => {
    const formattedDate = format(currentDay, 'EEEE, d MMMM', { locale: ptBR });
    
    // Preparar dados para virtualização
    const flattenedAppointments = dayHours.flatMap((hourData) => {
      if (hourData.appointments.length === 0) {
        return [{
          type: 'empty',
          hour: hourData.hour,
          formattedHour: hourData.formattedHour
        }];
      }
      
      return [
        {
          type: 'header',
          hour: hourData.hour,
          formattedHour: hourData.formattedHour
        },
        ...hourData.appointments.map(app => ({
          type: 'appointment',
          hour: hourData.hour,
          appointment: app
        }))
      ];
    });
    
    return (
      <div className="mt-2">
        <div className="text-sm text-center text-gray-300 mb-3 capitalize">
          {formattedDate}
        </div>
        <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 hide-scrollbar">
          {dayHours.map((hourData) => {
            const hasApps = hourData.appointments.length > 0;
            
            return (
              <div key={hourData.hour} className="flex">
                <div className="w-12 flex-shrink-0 text-xs text-gray-400 pt-2">
                  {hourData.formattedHour}
                </div>
                <div className={`flex-grow rounded-lg p-2 min-h-[60px] transition-colors ${hasApps ? 'bg-[#1A1F2E]' : 'bg-[#252B3B]/30'}`}>
                  {hasApps ? (
                    <div className="space-y-1">
                      {hourData.appointments.map(app => (
                        <motion.div 
                          key={app.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-2 rounded text-xs ${getAppointmentColorByStatus(app.status)}`}
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">{app.clientName}</span>
                            <span>{app.time}</span>
                          </div>
                          <div className="text-[10px] opacity-80 mt-0.5">
                            {app.service} • {app.barberName}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <button 
                        onClick={() => {
                          const date = format(currentDay, 'yyyy-MM-dd');
                          onDateSelect(date);
                        }}
                        className="text-xs text-gray-500"
                      >
                        Horário disponível
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
              className={`
                p-3 rounded-lg flex flex-col items-center justify-center
                ${isCurrentMonth ? 'bg-[#F0B35B]/20 ring-1 ring-[#F0B35B]/50' : ''}
                ${month.hasAppointments ? 'bg-[#1A1F2E] text-white' : 'bg-[#252B3B]/50 text-gray-400'}
              `}
            >
              <span className="text-sm font-medium capitalize">{month.monthName}</span>
              {month.hasAppointments && (
                <div className="mt-1 text-[10px] text-[#F0B35B]">
                  {month.appointmentsCount} {month.appointmentsCount === 1 ? 'agendamento' : 'agendamentos'}
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
      default: // pending
        return 'bg-yellow-500/20 text-yellow-300 border-l-2 border-yellow-500 pl-1';
    }
  };

  return (
    <div className="space-y-4">
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
          <div className="flex items-center">
            <button
              onClick={() => setViewMode('day')}
              className={`p-1.5 rounded-lg ${viewMode === 'day' ? 'bg-[#F0B35B]/20 text-[#F0B35B]' : 'text-gray-400'}`}
              aria-label="Visualização diária"
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`p-1.5 rounded-lg ${viewMode === 'week' ? 'bg-[#F0B35B]/20 text-[#F0B35B]' : 'text-gray-400'}`}
              aria-label="Visualização semanal"
            >
              <CalendarRange className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`p-1.5 rounded-lg ${viewMode === 'month' ? 'bg-[#F0B35B]/20 text-[#F0B35B]' : 'text-gray-400'}`}
              aria-label="Visualização mensal"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`p-1.5 rounded-lg ${viewMode === 'year' ? 'bg-[#F0B35B]/20 text-[#F0B35B]' : 'text-gray-400'}`}
              aria-label="Visualização anual"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg ${showFilters ? 'bg-[#F0B35B]/20 text-[#F0B35B]' : 'text-gray-400'}`}
              aria-label="Filtros"
            >
              <Filter className="w-4 h-4" />
            </button>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-64 bg-[#1A1F2E] rounded-lg shadow-lg p-3 z-10 border border-gray-700"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-white">Filtros</h3>
                    <button 
                      onClick={() => setShowFilters(false)}
                      className="text-gray-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                        <Search className="w-3 h-3" /> Buscar cliente
                      </label>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nome do cliente"
                        className="w-full bg-[#252B3B] text-white text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#F0B35B]"
                      />
                    </div>
                    
                    {barbers.length > 0 && (
                      <div>
                        <label className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                          <User className="w-3 h-3" /> Barbeiro
                        </label>
                        <select
                          value={selectedBarber}
                          onChange={(e) => setSelectedBarber(e.target.value)}
                          className="w-full bg-[#252B3B] text-white text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#F0B35B]"
                        >
                          <option value="">Todos os barbeiros</option>
                          {barbers.map(barber => (
                            <option key={barber.id} value={barber.id}>{barber.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {services.length > 0 && (
                      <div>
                        <label className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                          <Scissors className="w-3 h-3" /> Serviço
                        </label>
                        <select
                          value={selectedService}
                          onChange={(e) => setSelectedService(e.target.value)}
                          className="w-full bg-[#252B3B] text-white text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#F0B35B]"
                        >
                          <option value="">Todos os serviços</option>
                          {services.map(service => (
                            <option key={service.id} value={service.id}>{service.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div className="pt-1">
                      <button
                        onClick={handleClearFilters}
                        className="w-full bg-[#F0B35B]/10 text-[#F0B35B] text-xs rounded-md py-1.5"
                      >
                        Limpar filtros
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                switch(viewMode) {
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
              className={`p-1.5 rounded-lg
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => {
                switch(viewMode) {
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
              className={`p-1.5 rounded-lg
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

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
      {(selectedBarber || selectedService || searchTerm) && (
        <div className="flex items-center justify-between bg-[#252B3B]/50 rounded-lg p-2 mt-2">
          <div className="flex items-center gap-2 text-xs text-gray-300 overflow-x-auto hide-scrollbar">
            <span className="text-[#F0B35B]">Filtros ativos:</span>
            {selectedBarber && (
              <span className="bg-[#1A1F2E] px-2 py-0.5 rounded-full text-xs whitespace-nowrap">
                Barbeiro: {barbers.find(b => b.id === selectedBarber)?.name || selectedBarber}
              </span>
            )}
            {selectedService && (
              <span className="bg-[#1A1F2E] px-2 py-0.5 rounded-full text-xs whitespace-nowrap">
                Serviço: {services.find(s => s.id === selectedService)?.name || selectedService}
              </span>
            )}
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