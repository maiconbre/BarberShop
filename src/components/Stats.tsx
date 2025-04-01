import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar, Clock, Eye, EyeOff, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface StatsProps {
  appointments: any[];
  revenueDisplayMode: string;
  setRevenueDisplayMode: (mode: string) => void;
}

// Componente para animação de contagem
const CountUp = ({ end, duration = 0.4, prefix = '' }: { end: number; duration?: number; prefix?: string }) => {
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
    <span>{prefix}{count.toFixed(2)}</span>
  );
};

const Stats: React.FC<StatsProps> = ({ appointments, revenueDisplayMode, setRevenueDisplayMode }) => {
  const navigate = useNavigate();
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
    const today = now.toISOString().split('T')[0];
    
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

  return (
    <div className="mb-6 sm:mb-8 sm:px-0">
      <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full relative">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center flex-wrap gap-2 sm:gap-3 sm:pr-0">
            <div className="flex flex-1 justify-center gap-2">
             
              <button
                onClick={() => handleModeChange('month')}
                className={`px-3 py-2 text-sm rounded-md transition-all duration-300 w-24 ${revenueDisplayMode === 'month' ? 'bg-[#F0B35B] text-black' : 'bg-[#252B3B] text-white hover:bg-[#F0B35B]/20'}`}
              >
                Mensal 
              </button>
              <button
                onClick={() => handleModeChange('week')}
                className={`px-3 py-2 text-sm rounded-md transition-all duration-300 w-24 ${revenueDisplayMode === 'week' ? 'bg-[#F0B35B] text-black' : 'bg-[#252B3B] text-white hover:bg-[#F0B35B]/20'}`}
              >
                Semana
              </button>
              <button
                onClick={() => handleModeChange('day')}
                className={`px-3 py-2 text-sm rounded-md transition-all duration-300 w-24 ${revenueDisplayMode === 'day' ? 'bg-[#F0B35B] text-black' : 'bg-[#252B3B] text-white hover:bg-[#F0B35B]/20'}`}
              >
                Hoje
              </button>
            </div>

          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-center sm:items-start">
            <motion.div className="flex-1 w-full">
              <AnimatePresence mode="wait">
                {revenueDisplayMode === 'month' ? (
                  <motion.div
                    key="month"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="text-center sm:text-left"
                  >
                    <p className="text-gray-400 text-sm sm:text-base mb-2 text-center sm:text-left">
                      Receita Mensal (30 dias)
                    </p>
                    <h4 className="text-3xl sm:text-4xl font-bold text-[#F0B35B] flex items-center justify-center sm:justify-start gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleValueVisibility();
                        }}
                        className="text-[#F0B35B] hover:text-[#F0B35B]/80 transition-colors"
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
                        <>R$ <CountUp end={receitaMes} /></>
                      ) : (
                        "R$ ******"
                      )}
                    </h4>
                    <div className="flex items-center text-sm text-green-400 mt-2 justify-center sm:justify-start">
                      <span className="inline-block mr-1">↑</span>
                      <span>{clientesMes} clientes nos últimos 30 dias</span>
                    </div>
                  </motion.div>
                ) : revenueDisplayMode === 'week' ? (
                  <motion.div
                    key="week"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="text-center sm:text-left"
                  >
                    <p className="text-gray-400 text-sm sm:text-base mb-2 text-center sm:text-left">
                      Receita Semanal
                    </p>
                    <h4 className="text-3xl sm:text-4xl font-bold text-[#F0B35B] flex items-center justify-center sm:justify-start gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleValueVisibility();
                        }}
                        className="text-[#F0B35B] hover:text-[#F0B35B]/80 transition-colors"
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
                        <>R$ <CountUp end={receitaSemana} /></>
                      ) : (
                        "R$ ******"
                      )}
                    </h4>
                    <div className="flex items-center text-sm text-green-400 mt-2 justify-center sm:justify-start">
                      <span className="inline-block mr-1">↑</span>
                      <span>{clientesSemana} clientes nesta semana</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="day"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="text-center sm:text-left"
                  >
                    <p className="text-gray-400 text-sm sm:text-base mb-2 text-center sm:text-left">
                      Receita Hoje
                    </p>
                    <h4 className="text-3xl sm:text-4xl font-bold text-[#F0B35B] flex items-center justify-center sm:justify-start gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleValueVisibility();
                        }}
                        className="text-[#F0B35B] hover:text-[#F0B35B]/80 transition-colors"
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
                              <Eye size={20} />
                            </motion.div>
                          ) : showValues ? (
                            <Eye size={20} />
                          ) : (
                            <EyeOff size={20} />
                          )}
                        </AnimatePresence>
                      </button>
                      {showValues ? (
                        <>R$ <CountUp end={receitaHoje} /></>
                      ) : (
                        "R$ ******"
                      )}
                    </h4>
                    <div className="flex items-center text-sm text-green-400 mt-2 justify-center sm:justify-start">
                      <span className="inline-block mr-1">↑</span>
                      <span>{clientesHoje} clientes hoje</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Gráfico de Pizza */}
            <div className="w-full lg:w-auto flex flex-row items-center justify-center gap-4">
              <div className="w-[140px] h-[140px]">  {/* Increased from 120px to 140px */}
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={60} 
                      innerRadius={35} 
                      fill="#8884d8"
                      dataKey="value"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth={1}
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
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#FFD700]"></div>
                  <span className="text-xs text-gray-300">Pendentes ({filteredPendingAppointments})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#4CAF50]"></div>
                  <span className="text-xs text-gray-300">Concluídos ({filteredCompletedAppointments})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas adicionais */}
          <div className="flex flex-col xs:flex-row gap-3 mt-4">
            <div className="flex-1 bg-[#1A1F2E]/50 p-1.5 sm:p-2 rounded-lg text-center">
              <p className="text-gray-400 text-[10px] xs:text-xs my-1 sm:my-2 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3 text-[#F0B35B]" />
                Próximo Agendamento
              </p>
              <h5 className="text-base sm:text-lg font-semibold flex items-center justify-center text-white">
                {getNextAppointment ? (
                  getNextAppointment.formattedTime
                ) : (
                  "Nenhum agendamento"
                )}
              </h5>
              {getNextAppointment?.appointment && (
                <p className="text-[10px] xs:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate px-1">
                  {getNextAppointment.appointment.clientName} - {getNextAppointment.appointment.time}
                </p>
              )}
            </div>
            <div className="flex-1 bg-[#1A1F2E]/50 p-1.5 sm:p-2 rounded-lg">
              <p className="text-gray-400 text-[10px] xs:text-xs mb-0.5 text-center xs:text-left flex items-center justify-center xs:justify-start gap-1">
                <TrendingUp className="h-3 w-3 text-[#F0B35B]" />
                Tendência de Crescimento
              </p>
              <div className="flex flex-col gap-0.5 sm:gap-1">
                <h5 className="text-base sm:text-lg font-semibold text-white text-center xs:text-left">
                  {clientesMes > clientesSemana/4 ? (
                    <span className="text-green-400">Em alta</span>
                  ) : clientesMes < clientesSemana/4 ? (
                    <span className="text-red-400">Em queda</span>
                  ) : (
                    <span className="text-yellow-400">Estável</span>
                  )}
                </h5>
                <div className="flex items-center justify-center xs:justify-start gap-2 text-[10px] xs:text-xs text-gray-400">
                  <Users className="h-3 w-3" />
                  <span>{clientesMes} clientes no mês</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
