import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface StatsProps {
  appointments: any[];
  revenueDisplayMode: string;
  setRevenueDisplayMode: (mode: string) => void;
}

const Stats: React.FC<StatsProps> = ({ appointments, revenueDisplayMode, setRevenueDisplayMode }) => {
  
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

    switch (revenueDisplayMode) {
      case 'day':
        return appointments.filter(app => app.date === hoje);
      case 'week':
        return appointments.filter(app => {
          const appDate = new Date(app.date);
          return appDate >= startOfWeek && appDate <= endOfWeek;
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

    const receitaHoje = appointments.filter(app => app.date === hoje).reduce((sum, app) => sum + app.price, 0);
    const receitaSemana = appointments.filter(app => {
      const appDate = new Date(app.date);
      return appDate >= startOfWeek && appDate <= endOfWeek;
    }).reduce((sum, app) => sum + app.price, 0);
    const ticketMedio = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;
    const taxaConclusao = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

    const clientesHoje = appointments.filter(app => app.date === hoje).length;
    const clientesSemana = appointments.filter(app => {
      const appDate = new Date(app.date);
      return appDate >= startOfWeek && appDate <= endOfWeek;
    }).length;

    return { receitaHoje, receitaSemana, ticketMedio, taxaConclusao, clientesHoje, clientesSemana };
  };

  const { receitaHoje, receitaSemana, ticketMedio, taxaConclusao, clientesHoje, clientesSemana } = calculateStats();

  return (
    <div className="mb-6 sm:mb-8 sm:px-0">
      <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full">
        <div className="flex flex-col gap-4">
          <div className="flex justify-center gap-2">
            <button 
              onClick={() => setRevenueDisplayMode('total')}
              className={`px-4 py-2 rounded-md transition-all duration-300 ${revenueDisplayMode === 'total' ? 'bg-[#F0B35B] text-black' : 'bg-[#252B3B] text-white hover:bg-[#F0B35B]/20'}`}
            >
              Total
            </button>
            <button 
              onClick={() => setRevenueDisplayMode('week')}
              className={`px-4 py-2 rounded-md transition-all duration-300 ${revenueDisplayMode === 'week' ? 'bg-[#F0B35B] text-black' : 'bg-[#252B3B] text-white hover:bg-[#F0B35B]/20'}`}
            >
              Semana
            </button>
            <button 
              onClick={() => setRevenueDisplayMode('day')}
              className={`px-4 py-2 rounded-md transition-all duration-300 ${revenueDisplayMode === 'day' ? 'bg-[#F0B35B] text-black' : 'bg-[#252B3B] text-white hover:bg-[#F0B35B]/20'}`}
            >
              Hoje
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <motion.div className="flex-1 w-full">
              <AnimatePresence mode="wait">
                {revenueDisplayMode === 'total' ? (
                  <motion.div
                    key="total"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="text-center sm:text-left"
                  >
                    <p className="text-gray-400 text-sm sm:text-base mb-2">Receita Total</p>
                    <h4 className="text-3xl sm:text-4xl font-bold text-[#F0B35B] bg">
                      R$ {totalRevenue.toFixed(2)}
                    </h4>
                    <div className="flex items-center text-sm text-green-400 mt-2 justify-center sm:justify-start">
                      <span className="inline-block mr-1">↑</span>
                      <span>+{((receitaHoje / totalRevenue) * 100).toFixed(1)}% hoje</span>
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
                    <h4 className="text-3xl sm:text-4xl font-bold text-[#F0B35B] bg">
                      R$ {receitaSemana.toFixed(2)}
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
                    <h4 className="text-3xl sm:text-4xl font-bold text-[#F0B35B] bg">
                      R$ {receitaHoje.toFixed(2)}
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
                    Ticket Médio: <span className="text-white font-semibold block mt-1">R$ {ticketMedio.toFixed(2)}</span>
                  </p>
                  <p className="text-sm text-gray-400 text-right">
                    Taxa de Conclusão: <span className="text-white font-semibold block mt-1">{taxaConclusao.toFixed(1)}%</span>
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-col w-full lg:w-auto">
              <p className="text-gray-400 text-sm mb-2">Status dos Agendamentos {revenueDisplayMode === 'day' ? 'de Hoje' : revenueDisplayMode === 'week' ? 'da Semana' : 'Totais'}</p>
              
              <div className="flex flex-row items-center gap-3">
                <div className="h-[140px] w-[140px] sm:h-[160px] sm:w-[160px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
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
                      >
                        <Cell fill="#FFD700" className="drop-shadow-lg" />
                        <Cell fill="#4CAF50" className="drop-shadow-lg" />
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#1A1F2E]/90 backdrop-blur-sm p-2 rounded-lg border border-gray-700/50 shadow-2xl">
                                <p className="text-xs font-medium text-white">{payload[0].name}</p>
                                <p className="text-xs text-gray-400">Quantidade: {payload[0].value}</p>
                                <p className="text-xs text-gray-400">R$ {payload[0].payload.revenue.toFixed(2)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between bg-[#252B3B]/50 p-2 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      <p className="text-xs text-white">Pendente</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-sm font-bold text-yellow-500">{filteredPendingAppointments}</p>
                      <p className="text-xs text-yellow-500">R$ {filteredPendingRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-[#252B3B]/50 p-2 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <p className="text-xs text-white">Concluído</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-sm font-bold text-green-500">{filteredCompletedAppointments}</p>
                      <p className="text-xs text-green-500">R$ {filteredCompletedRevenue.toFixed(2)}</p>
                    </div>
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
