import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StatsProps {
  appointments: any[];
  revenueDisplayMode: string;
  setRevenueDisplayMode: (mode: string) => void;
}

// Componente para animação de contagem
const CountUp = ({ end, duration = 0.8, prefix = '' }: { end: number; duration?: number; prefix?: string }) => {
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
  const [chartKey, setChartKey] = useState(0);
  
  const totalAppointments = appointments.length;
  const totalRevenue = appointments.reduce((sum, app) => sum + app.price, 0);
  const completedAppointments = appointments.filter(app => app.status === 'completed').length;

  // Função para filtrar agendamentos por data
  const getFilteredAppointmentsByDate = () => {
    const hoje = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    switch (revenueDisplayMode) {
      case 'day':
        return appointments.filter(app => app.date === hoje);
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

  const currentFilteredAppointments = getFilteredAppointmentsByDate();
  const filteredPendingAppointments = currentFilteredAppointments.filter(app => app.status === 'pending').length;
  const filteredCompletedAppointments = currentFilteredAppointments.filter(app => app.status === 'completed').length;
  const filteredPendingRevenue = currentFilteredAppointments.filter(app => app.status === 'pending').reduce((sum, app) => sum + app.price, 0);
  const filteredCompletedRevenue = currentFilteredAppointments.filter(app => app.status === 'completed').reduce((sum, app) => sum + app.price, 0);

  // Cálculo de estatísticas detalhadas
  const calculateStats = () => {
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
    
    const ticketMedio = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;
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

    return { receitaHoje, receitaSemana, receitaMes, ticketMedio, taxaConclusao, clientesHoje, clientesSemana, clientesMes };
  };

  const { receitaHoje, receitaSemana, receitaMes, ticketMedio, taxaConclusao, clientesHoje, clientesSemana, clientesMes } = calculateStats();

  // Função para atualizar o modo de exibição e forçar animação do gráfico
  const handleModeChange = (mode: string) => {
    setRevenueDisplayMode(mode);
    setChartKey(prev => prev + 1);
  };
  
  // Atualiza o chartKey sempre que os dados relevantes para o gráfico mudarem
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [filteredPendingAppointments, filteredCompletedAppointments, filteredPendingRevenue, filteredCompletedRevenue, revenueDisplayMode]);
  
  // Também atualiza o chartKey quando os appointments mudarem
  useEffect(() => {
    if (appointments.length > 0) {
      setChartKey(prev => prev + 1);
    }
  }, [appointments]);

  return (
    <div className="mb-6 sm:mb-8 sm:px-0">
      <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full">
        <div className="flex flex-col gap-4">
          <div className="flex justify-center gap-2">
            <button 
              onClick={() => handleModeChange('month')}
              className={`px-4 py-2 rounded-md transition-all duration-300 ${revenueDisplayMode === 'month' ? 'bg-[#F0B35B] text-black' : 'bg-[#252B3B] text-white hover:bg-[#F0B35B]/20'}`}
            >
              Mensal
            </button>
            <button 
              onClick={() => handleModeChange('week')}
              className={`px-4 py-2 rounded-md transition-all duration-300 ${revenueDisplayMode === 'week' ? 'bg-[#F0B35B] text-black' : 'bg-[#252B3B] text-white hover:bg-[#F0B35B]/20'}`}
            >
              Semana
            </button>
            <button 
              onClick={() => handleModeChange('day')}
              className={`px-4 py-2 rounded-md transition-all duration-300 ${revenueDisplayMode === 'day' ? 'bg-[#F0B35B] text-black' : 'bg-[#252B3B] text-white hover:bg-[#F0B35B]/20'}`}
            >
              Hoje
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/calendar')}
              className="p-2 rounded-md bg-[#252B3B] text-white hover:bg-[#F0B35B]/20 transition-all duration-300 flex items-center justify-center"
              title="Ver calendário"
            >
              <Calendar className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
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
                    <p className="text-gray-400 text-sm sm:text-base mb-2">Receita Mensal (30 dias)</p>
                    <h4 className="text-3xl sm:text-4xl font-bold text-[#F0B35B]">
                      R$ <CountUp end={receitaMes} />
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
                    <p className="text-gray-400 text-sm sm:text-base mb-2">Receita Semanal</p>
                    <h4 className="text-3xl sm:text-4xl font-bold text-[#F0B35B]">
                      R$ <CountUp end={receitaSemana} />
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
                    <p className="text-gray-400 text-sm sm:text-base mb-2">Receita Hoje</p>
                    <h4 className="text-3xl sm:text-4xl font-bold text-[#F0B35B]">
                      R$ <CountUp end={receitaHoje} />
                    </h4>
                    <div className="flex items-center text-sm text-green-400 mt-2 justify-center sm:justify-start">
                      <span className="inline-block mr-1">↑</span>
                      <span>{clientesHoje} clientes hoje</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-4 pt-4 border-t border-gray-700/30">
                <div className="grid grid-cols-2 gap-4">
                  <p className="text-sm text-gray-400">
                    Ticket Médio: <span className="text-white font-semibold block mt-1">R$ <CountUp end={ticketMedio} /></span>
                  </p>
                  <p className="text-sm text-gray-400 text-right">
                    Taxa de Conclusão: <span className="text-white font-semibold block mt-1"><CountUp end={taxaConclusao} />%</span>
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-col w-full lg:w-auto">
              <p className="text-gray-400 text-sm mb-2">Status dos Agendamentos {revenueDisplayMode === 'day' ? 'de Hoje' : revenueDisplayMode === 'week' ? 'da Semana' : 'do Mês'}</p>
              
              <div className="flex flex-row items-center gap-3">
                <div className="h-[140px] w-[140px] sm:h-[160px] sm:w-[160px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart key={chartKey}>
                      <Pie
                        data={[
                          { name: 'Pendentes', value: filteredPendingAppointments, revenue: filteredPendingRevenue },
                          { name: 'Concluídos', value: filteredCompletedAppointments, revenue: filteredCompletedRevenue }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={8}
                        dataKey="value"
                        startAngle={90}
                        endAngle={450}
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      >
                        <Cell key="cell-0" fill="#F59E0B" />
                        <Cell key="cell-1" fill="#4CAF50" />
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [
                          `R$ ${props.payload.revenue.toFixed(2)}`, 
                          `${name} (${value})`
                        ]}
                        contentStyle={{ 
                          backgroundColor: '#1A1F2E', 
                          borderColor: '#374151',
                          borderRadius: '0.375rem',
                          color: '#F3F4F6'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
                    <p className="text-sm text-gray-300">
                      Pendentes: <span className="font-semibold">{filteredPendingAppointments}</span>
                      <span className="block text-xs text-gray-400">R$ {filteredPendingRevenue.toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#4CAF50]"></div>
                    <p className="text-sm text-gray-300">
                      Concluídos: <span className="font-semibold">{filteredCompletedAppointments}</span>
                      <span className="block text-xs text-gray-400">R$ {filteredCompletedRevenue.toFixed(2)}</span>
                    </p>
                  </div>
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
