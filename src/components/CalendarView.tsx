import React, { useMemo } from 'react';
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
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  // Dados para o gráfico de recorrência
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

  // Calcular estatísticas de clientes
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
        // Excluir agendamentos bloqueados
        if (app.isBlocked) return false;
        return true;
      }
      // Se não for admin, mostra apenas os agendamentos do barbeiro logado
      // e exclui agendamentos bloqueados
      return app.barberId === currentUser?.id && !app.isBlocked;
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
          {/* Removed the orange dots that indicate appointments */}
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
    <div>
      <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl p-4 sm:p-6 shadow-lg border border-[#F0B35B]/10 h-full flex flex-col">
    
      <div className="flex flex-col flex-grow">
        <div className="mb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-row justify-between items-stretch gap-3">
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

            <div className="flex flex-row gap-3 items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleRangeFilter}
                className={`flex-1 px-4 py-2.5 rounded-lg transition-all duration-300 ${isRangeFilterActive ? 'bg-[#F0B35B] text-black shadow-lg' : 'bg-[#252B3B] text-white hover:bg-[#2A3040]'}`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Filter className="w-4 h-4" />
                  {isRangeFilterActive ? '✓ Filtro Ativo' : 'Filtrar '}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onResetFilters}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#252B3B] text-white hover:bg-[#2A3040] transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Resetar Filtros
                </span>
              </motion.button>
            </div>

            {isRangeFilterActive && (startDate || endDate) && (
              <div className="mt-2 bg-[#252B3B] px-3 py-2 rounded-lg w-full">
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

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#F0B35B]/20"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#252B3B] px-4 text-sm text-gray-400">Calendário</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
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

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="h-8 flex items-center justify-center">
              <span className="text-xs text-gray-400">{day}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {generateCalendarGrid()}
        </div>

        <div className="mt-4 mb-4 text-center bg-[#252B3B] p-3 rounded-lg shadow-md border border-[#F0B35B]/20">
          <p className="text-[#F0B35B] text-base font-medium">
            {filteredAppointments.length} {filteredAppointments.length === 1 ? 'agendamento' : 'agendamentos'}
            {!isRangeFilterActive ? ` para o dia ${new Date(selectedDate).toLocaleDateString('pt-BR')}` : ' no período selecionado'}
          </p>
        </div>

      </div>
    </div>

    <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl p-4 sm:p-6 shadow-lg border border-[#F0B35B]/10 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="h-4 w-4 text-[#F0B35B]" />
          Análise de Clientes
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0D121E] p-3 rounded-lg">
          <h4 className="text-xs sm:text-sm font-medium text-gray-300 mb-3 text-center">Perfil de Visitas</h4>
          <div className="h-[200px] sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={recurrenceData}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                <XAxis type="number" domain={[0, 'dataMax']} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: '#9ca3af', fontSize: 10 }} 
                  width={60} 
                />
                <Tooltip
                  formatter={(value: any) => [`${value} clientes`, '']}
                  contentStyle={{
                    backgroundColor: 'rgba(26,31,46,0.95)',
                    border: '1px solid rgba(240,179,91,0.5)',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                  label={{ 
                    position: 'right', 
                    fill: '#fff', 
                    fontSize: 10,
                    formatter: (value: any) => value > 0 ? value : ''
                  }}
                >
                  {recurrenceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0D121E] p-3 rounded-lg">
          <h4 className="text-xs sm:text-sm font-medium text-gray-300 mb-3 text-center">Horários Mais Populares</h4>
          <div className="h-[200px] sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={useMemo(() => {
                  const allTimeSlots = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
                  const timeData = allTimeSlots.map(hour => ({
                    name: `${hour}h`,
                    value: 0
                  }));
                  
                  appointments.forEach(app => {
                    if (app.time) {
                      const hour = app.time.split(':')[0];
                      const index = allTimeSlots.indexOf(hour);
                      if (index !== -1) {
                        timeData[index].value += 1;
                      }
                    }
                  });
                  
                  return timeData;
                }, [appointments])}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                />
                <YAxis 
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value: any) => [`${value} agendamentos`, '']}
                  contentStyle={{
                    backgroundColor: 'rgba(26,31,46,0.95)',
                    border: '1px solid rgba(240,179,91,0.5)',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#F0B35B" 
                  fill="url(#colorGradient)" 
                  activeDot={{ r: 6, fill: '#F0B35B', stroke: '#fff' }}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F0B35B" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#F0B35B" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

        <div className="hidden lg:block mt-8">
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#F0B35B]/20"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#252B3B] px-4 text-sm text-gray-400">Métricas Adicionais</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-[#0D121E] p-3 rounded-lg">
              <h4 className="text-xs sm:text-sm font-medium text-gray-300 mb-3 text-center">Distribuição por Dia da Semana</h4>
              <div className="h-[200px] sm:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={useMemo(() => {
                      const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                      const counts = Array(7).fill(0);
                      
                      appointments.forEach(app => {
                        const date = new Date(app.date);
                        const day = date.getDay();
                        counts[day]++;
                      });
                      
                      return weekdays.map((name, index) => ({
                        name: name,
                        value: counts[index]
                      })).filter(item => item.value > 0);
                    }, [appointments])}
                    margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                    <XAxis type="number" domain={[0, 'dataMax']} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fill: '#9ca3af', fontSize: 10 }} 
                      width={60} 
                    />
                    <Tooltip
                      formatter={(value: any) => [`${value} agendamentos`, '']}
                      contentStyle={{
                        backgroundColor: 'rgba(26,31,46,0.95)',
                        border: '1px solid rgba(240,179,91,0.5)',
                        borderRadius: '8px',
                        padding: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#F0B35B" 
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                      label={{ 
                        position: 'right', 
                        fill: '#fff', 
                        fontSize: 10,
                        formatter: (value: any) => value > 0 ? value : ''
                      }}
                    >
                      {useMemo(() => {
                        const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                        const counts = Array(7).fill(0);
                        
                        appointments.forEach(app => {
                          const date = new Date(app.date);
                          const day = date.getDay();
                          counts[day]++;
                        });
                        
                        return weekdays.map((name, index) => ({
                          name: name,
                          value: counts[index]
                        })).filter(item => item.value > 0);
                      }, [appointments]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#0D121E] p-3 rounded-lg">
              <h4 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 text-center">Métricas de Desempenho</h4>
              <div className="h-[190px] sm:h-[240px] flex flex-col justify-between">
                <div className="bg-[#1A1F2E] p-2.5 rounded-lg mb-2">
                  <h5 className="text-xs font-medium text-white mb-1">Taxa de Conclusão</h5>
                  <div className="flex items-center justify-between">
                    <div className="text-[#F0B35B] text-lg font-bold">
                      {useMemo(() => {
                        const completed = appointments.filter(app => app.status === 'completed').length;
                        const total = appointments.length;
                        return total > 0 ? `${((completed / total) * 100).toFixed(1)}%` : '0%';
                      }, [appointments])}
                    </div>
                    <div className="text-xs text-gray-400">
                      {useMemo(() => {
                        const completed = appointments.filter(app => app.status === 'completed').length;
                        return `${completed} concluídos`;
                      }, [appointments])}
                    </div>
                  </div>
                  <div className="w-full bg-[#252B3B] h-2 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-[#F0B35B] h-full rounded-full" 
                      style={{ 
                        width: `${useMemo(() => {
                          const completed = appointments.filter(app => app.status === 'completed').length;
                          const total = appointments.length;
                          return total > 0 ? (completed / total) * 100 : 0;
                        }, [appointments])}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="bg-[#1A1F2E] p-2.5 rounded-lg mb-2">
                  <h5 className="text-xs font-medium text-white mb-1">Ticket Médio</h5>
                  <div className="flex items-center justify-between">
                    <div className="text-[#F0B35B] text-lg font-bold">
                      R$ {clientStats.ticketMedio.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {appointments.length} agendamentos
                    </div>
                  </div>
                </div>

                <div className="bg-[#1A1F2E] p-2.5 rounded-lg">
                  <h5 className="text-xs font-medium text-white mb-1">Serviços por Cliente</h5>
                  <div className="flex items-center justify-between">
                    <div className="text-[#F0B35B] text-lg font-bold">
                      {useMemo(() => {
                        const uniqueClients = new Set();
                        appointments.forEach(app => {
                          if (app.clientName) uniqueClients.add(app.clientName.toLowerCase());
                        });
                        const clientCount = uniqueClients.size;
                        return clientCount > 0 ? (appointments.length / clientCount).toFixed(1) : '0';
                      }, [appointments])}
                    </div>
                    <div className="text-xs text-gray-400">
                      média por cliente
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0D121E] p-3 rounded-lg">
              <h4 className="text-xs sm:text-sm font-medium text-gray-300 mb-3 text-center">Sugestões para Promoções</h4>
              <div className="h-[200px] sm:h-[250px] overflow-y-auto pr-1 custom-scrollbar hide-scrollbar">
                {appointments.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-3 bg-[#1A1F2E] rounded-lg border-l-2 border-[#F0B35B]">
                        <h4 className="font-medium text-white text-xs">Clientes Fiéis</h4>
                        <p className="text-gray-400 mt-1 text-xs">
                          {clientStats.returningClients} clientes visitaram mais de uma vez.
                          Considere um programa de fidelidade com desconto progressivo.
                        </p>
                      </div>

                      <div className="p-3 bg-[#1A1F2E] rounded-lg border-l-2 border-green-400">
                        <h4 className="font-medium text-white text-xs">Recuperação de Clientes</h4>
                        <p className="text-gray-400 mt-1 text-xs">
                          Envie mensagens personalizadas com ofertas exclusivas para clientes que não retornam há mais de 1 meses.
                        </p>
                      </div>

                      <div className="p-3 bg-[#1A1F2E] rounded-lg border-l-2 border-blue-400">
                        <h4 className="font-medium text-white text-xs">Pacotes Promocionais</h4>
                        <p className="text-gray-400 mt-1 text-xs">
                          Crie pacotes com desconto para clientes que agendarem múltiplos serviços em uma única visita.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Award className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-xs">Sem dados suficientes para gerar sugestões</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;