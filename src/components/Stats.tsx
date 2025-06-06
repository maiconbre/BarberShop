import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Clock, Eye, EyeOff, TrendingUp, Users, DollarSign, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface StatsProps {
  appointments: any[];
  revenueDisplayMode: string;
  setRevenueDisplayMode: (mode: string) => void;
}

// Componente para animação de contagem
const CountUp = ({ end, duration = 0.4, prefix = '', suffix = '' }: { end: number; duration?: number; prefix?: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const prevEndRef = useRef(end);

  useEffect(() => {
    // Resetar a contagem se o valor final mudar
    if (prevEndRef.current !== end) {
      setCount(0);
      prevEndRef.current = end;
    }

    const startTime = Date.now();
    const timer = setInterval(() => {
      const timePassed = Date.now() - startTime;
      const progress = Math.min(timePassed / (duration * 1000), 1);
      const currentCount = Math.floor(progress * end);

      if (progress === 1 || currentCount === end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(currentCount);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration]);

  return (
    <span>{prefix}{count.toFixed(2)}{suffix}</span>
  );
};

const Stats: React.FC<StatsProps> = ({ appointments, revenueDisplayMode, setRevenueDisplayMode }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const { getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();
  
  // Estado para controlar a animação do olho
  const [isBlinking, setIsBlinking] = useState(false);
  
  // Função para alternar a visibilidade dos valores
  const toggleValueVisibility = () => {
    setIsBlinking(true);
    setTimeout(() => {
      setShowValues(!showValues);
      setIsBlinking(false);
    }, 300);
  };

  const totalAppointments = appointments.length;
  const totalRevenue = appointments.reduce((sum, app) => sum + app.price, 0);
  const completedAppointments = appointments.filter(app => app.status === 'completed').length;

  // Função para filtrar agendamentos por data
  const getFilteredAppointmentsByDate = () => {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    switch (revenueDisplayMode) {
      case 'day':
        return appointments.filter(app => {
          const appDate = new Date(app.date);
          return appDate.toISOString().split('T')[0] === hojeStr;
        });
      case 'week':
        return appointments.filter(app => {
          const appDate = new Date(app.date);
          return appDate >= startOfWeek && appDate <= endOfWeek;
        });
      case 'month':
        return appointments.filter(app => {
          const appDate = new Date(app.date);
          return appDate >= thirtyDaysAgo;
        });
      default:
        return appointments;
    }
  };

  // Usando useMemo para evitar recálculos desnecessários
  const currentFilteredAppointments = useMemo(() => getFilteredAppointmentsByDate(),
    [appointments, revenueDisplayMode]);

  const filteredPendingAppointments = useMemo(() =>
    currentFilteredAppointments.filter(app => app.status === 'pending').length,
    [currentFilteredAppointments]);

  const filteredCompletedAppointments = useMemo(() =>
    currentFilteredAppointments.filter(app => app.status === 'completed').length,
    [currentFilteredAppointments]);

  const filteredPendingRevenue = useMemo(() =>
    currentFilteredAppointments.filter(app => app.status === 'pending')
      .reduce((sum, app) => sum + app.price, 0),
    [currentFilteredAppointments]);

  const filteredCompletedRevenue = useMemo(() =>
    currentFilteredAppointments.filter(app => app.status === 'completed')
      .reduce((sum, app) => sum + app.price, 0),
    [currentFilteredAppointments]);


  // Função para calcular o próximo agendamento e o tempo restante
  const getNextAppointment = useMemo(() => {
    // Obter a data e hora atual
    const now = new Date();
    
    // Filtrar agendamentos futuros (hoje ou depois) e não concluídos
    let futureAppointments = appointments.filter(app => {
      const appDate = new Date(`${app.date}T${app.time}`);
      return (appDate >= now && app.status !== 'completed');
    });

    // Se o usuário for um barbeiro (não admin), filtrar apenas seus agendamentos
    if (currentUser?.role === 'barber') {
      futureAppointments = futureAppointments.filter(app => app.barberId === currentUser.id);
    }

    // Ordenar por data e hora (mais próximo primeiro)
    futureAppointments.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

    // Pegar o próximo agendamento
    const nextAppointment = futureAppointments.length > 0 ? futureAppointments[0] : null;

    // Calcular tempo restante
    let timeRemaining = null;
    let formattedTimeRemaining = 'Nenhum agendamento';
    
    if (nextAppointment) {
      const appointmentDateTime = new Date(`${nextAppointment.date}T${nextAppointment.time}`);
      const diffMs = appointmentDateTime.getTime() - now.getTime();
      
      // Converter para minutos e horas
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffMinutes < 60) {
        formattedTimeRemaining = `${diffMinutes} minutos`;
      } else {
        const remainingMinutes = diffMinutes % 60;
        if (remainingMinutes > 0) {
          formattedTimeRemaining = `${diffHours} horas e ${remainingMinutes} minutos`;
        } else {
          formattedTimeRemaining = `${diffHours} horas`;
        }
      }
      
      timeRemaining = {
        appointment: nextAppointment,
        formattedTime: formattedTimeRemaining
      };
    }

    return timeRemaining;
  }, [appointments, currentUser]);

  // Cálculo de estatísticas detalhadas usando useMemo
  const calculatedStats = useMemo(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const receitaHoje = appointments.filter(app => app.date === hoje).reduce((sum, app) => sum + app.price, 0);
    const receitaSemana = appointments.filter(app => {
      const appDate = new Date(app.date);
      return appDate >= startOfWeek && appDate <= endOfWeek;
    }).reduce((sum, app) => sum + app.price, 0);

    const receitaMes = appointments.filter(app => {
      const appDate = new Date(app.date);
      return appDate >= thirtyDaysAgo;
    }).reduce((sum, app) => sum + app.price, 0);

    const taxaConclusao = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

    const clientesHoje = appointments.filter(app => app.date === hoje).length;
    const clientesSemana = appointments.filter(app => {
      const appDate = new Date(app.date);
      return appDate >= startOfWeek && appDate <= endOfWeek;
    }).length;

    const clientesMes = appointments.filter(app => {
      const appDate = new Date(app.date);
      return appDate >= thirtyDaysAgo;
    }).length;

    return { receitaHoje, receitaSemana, receitaMes, taxaConclusao, clientesHoje, clientesSemana, clientesMes };
  }, [appointments, totalAppointments, totalRevenue, completedAppointments]);

  const { receitaHoje, receitaSemana, receitaMes, clientesHoje, clientesSemana, clientesMes } = calculatedStats;

  // Função para atualizar o modo de exibição
  const handleModeChange = (mode: string) => {
    setIsTransitioning(true);
    setRevenueDisplayMode(mode);
    // Reset do estado após a transição
    setTimeout(() => setIsTransitioning(false), 50);
  };

  // Dados do gráfico memoizados para evitar recriação a cada renderização
  const pieChartData = useMemo(() => {
    const pending = filteredPendingAppointments || 0;
    const completed = filteredCompletedAppointments || 0;
    const pendingRev = filteredPendingRevenue || 0;
    const completedRev = filteredCompletedRevenue || 0;

    // Sempre retornar um array com dois elementos para manter consistência
    return [
      { name: 'Pendentes', value: pending, revenue: pendingRev },
      { name: 'Concluídos', value: completed, revenue: completedRev }
    ];
  }, [filteredPendingAppointments, filteredCompletedAppointments, filteredPendingRevenue, filteredCompletedRevenue]);

  const periodTexts: Record<string, string> = {
    day: 'Hoje',
    week: 'semana',
    month: 'mês'
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300 w-full overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col gap-5">
        {/* Período de visualização */}
        <div className="flex justify-center items-center gap-2 bg-[#252B3B]/30 p-1 rounded-lg">
          {(['month', 'week', 'day'] as const).map((mode) => (
            <motion.button
              key={mode}
              onClick={() => handleModeChange(mode)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative px-3 py-2 text-xs sm:text-sm rounded-lg transition-all duration-300 flex-1 ${
                revenueDisplayMode === mode 
                  ? 'bg-[#F0B35B] text-black font-medium shadow-lg' 
                  : 'bg-[#252B3B] text-white hover:bg-[#F0B35B]/20'
              }`}
          >
              {periodTexts[mode]}
              {revenueDisplayMode === mode && (
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F0B35B]/80"
                  layoutId="indicator"
                />
              )}
            </motion.button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          <motion.div 
            className="flex-1 w-full"
            layout
          >
            <AnimatePresence mode="wait">
                <motion.div
                key={`${revenueDisplayMode}`}
                initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                className="text-center py-4 px-3 bg-[#252B3B]/20 rounded-xl border border-white/5"
              >
                <p className="text-gray-400 text-sm sm:text-base mb-3 flex items-center justify-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Receita {periodTexts[revenueDisplayMode]}</span>
                  </p>
                  <h4 className="text-3xl sm:text-4xl font-bold text-[#F0B35B] flex items-center justify-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleValueVisibility();
                      }}
                    className="text-[#F0B35B] hover:text-[#F0B35B]/80 transition-colors bg-[#252B3B]/40 p-1.5 rounded-full"
                    >
                      <AnimatePresence mode="wait">
                        {isBlinking ? (
                          <motion.div
                            key="blinking"
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            exit={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Eye size={16} />
                          </motion.div>
                        ) : showValues ? (
                          <Eye size={16} />
                        ) : (
                          <EyeOff size={16} />
                        )}
                      </AnimatePresence>
                    </button>
                    {showValues ? (
                    <CountUp 
                      end={revenueDisplayMode === 'day' 
                        ? receitaHoje 
                        : revenueDisplayMode === 'week' 
                        ? receitaSemana 
                        : receitaMes} 
                      prefix="R$ "
                      suffix=""
                    />
                    ) : (
                      "R$ ******"
                    )}
                  </h4>
                <div className="flex items-center text-sm text-green-400 mt-3 justify-center">
                  <ArrowUpRight className="w-4 h-4 mr-1.5" />
                  <span>
                    {revenueDisplayMode === 'day' 
                      ? `${clientesHoje} clientes hoje` 
                      : revenueDisplayMode === 'week' 
                      ? `${clientesSemana} clientes esta semana` 
                      : `${clientesMes} clientes este mês`}
                  </span>
                  </div>
                </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Gráfico de Pizza com melhoria visual */}
          <motion.div 
            className="flex flex-col items-center gap-4 bg-[#252B3B]/20 p-4 rounded-xl border border-white/5"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-sm text-gray-300 font-medium">Visão Geral</h3>
            <div className="flex flex-row lg:flex-col items-center gap-6">
              <div className="w-[120px] h-[120px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={55}
                    innerRadius={35}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={1}
                      animationDuration={800}
                      animationBegin={200}
                  >
                    <Cell key="pending" fill="#FFD700" />
                    <Cell key="completed" fill="#4CAF50" />
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: string, props: any) => {
                      const data = props.payload;
                      return [`${value} agendamentos - R$ ${data.revenue.toFixed(2)}`, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(26,31,46,0.95)',
                      border: '1px solid rgba(240,179,91,0.5)',
                      borderRadius: '8px',
                      padding: '8px',
                      color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
                {pieChartData[0].value + pieChartData[1].value > 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-300">
                    Total: {pieChartData[0].value + pieChartData[1].value}
            </div>
                ) : null}
              </div>
              <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FFD700]"></div>
                <span className="text-xs text-gray-300">Pendentes ({filteredPendingAppointments})</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#4CAF50]"></div>
                <span className="text-xs text-gray-300">Concluídos ({filteredCompletedAppointments})</span>
                </div>
                {showValues && (
                  <div className="mt-1 text-xs text-gray-400">
                    R$ {(filteredPendingRevenue + filteredCompletedRevenue).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Cards de estatísticas adicionais com design melhorado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <motion.div 
            className="bg-[#252B3B]/20 p-4 rounded-lg border border-white/5 hover:border-[#F0B35B]/20 transition-colors"
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(37,43,59,0.3)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between">
              <div>
            <p className="text-gray-400 text-xs mb-2 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#F0B35B]" />
              Próximo Agendamento
            </p>
            <h5 className="text-sm font-medium text-white">
              {getNextAppointment ? (
                getNextAppointment.formattedTime
              ) : (
                "Nenhum agendamento"
              )}
            </h5>
            {getNextAppointment?.appointment && (
              <p className="text-xs text-gray-400 mt-1 truncate">
                {getNextAppointment.appointment.clientName} - {getNextAppointment.appointment.time}
              </p>
            )}
          </div>
              {getNextAppointment?.appointment && (
                <div className="bg-[#F0B35B]/10 p-1.5 rounded-full">
                  <Clock className="h-5 w-5 text-[#F0B35B]" />
                </div>
              )}
            </div>
          </motion.div>
          <motion.div 
            className="bg-[#252B3B]/20 p-4 rounded-lg border border-white/5 hover:border-[#F0B35B]/20 transition-colors"
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(37,43,59,0.3)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between">
              <div>
            <p className="text-gray-400 text-xs mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-[#F0B35B]" />
              Tendência de Crescimento
            </p>
            <h5 className="text-sm font-medium">
              {clientesMes > clientesSemana/4 ? (
                <span className="text-green-400">Em alta</span>
              ) : clientesMes < clientesSemana/4 ? (
                <span className="text-red-400">Em queda</span>
              ) : (
                <span className="text-yellow-400">Estável</span>
              )}
            </h5>
            <div className="flex items-center gap-1.5 mt-1">
              <Users className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs text-gray-400">{clientesMes} clientes no mês</span>
            </div>
          </div>
              <div className={`p-1.5 rounded-full ${
                clientesMes > clientesSemana/4 
                  ? 'bg-green-500/10' 
                  : clientesMes < clientesSemana/4 
                  ? 'bg-red-500/10' 
                  : 'bg-yellow-500/10'
              }`}>
                <TrendingUp className={`h-5 w-5 ${
                  clientesMes > clientesSemana/4 
                    ? 'text-green-400' 
                    : clientesMes < clientesSemana/4 
                    ? 'text-red-400' 
                    : 'text-yellow-400'
                }`} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Stats;
