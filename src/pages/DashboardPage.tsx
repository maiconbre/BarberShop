import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { FaChartLine, FaMoneyBillWave, FaChevronDown } from 'react-icons/fa';
import AppointmentCardNew from '../components/AppointmentCardNew';

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed';
  barberId: string;
  barberName: string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ChartData {
  date: string;
  pending: number;
  completed: number;
  fullDate: string;
}

const DashboardPage: React.FC = () => {
  const { logout } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [weeklyData, setWeeklyData] = useState<ChartData[]>([]);
  const [isChartExpanded, setIsChartExpanded] = useState(true);
  const [revenueDisplayMode, setRevenueDisplayMode] = useState('total');
  const [filterMode, setFilterMode] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


  // Estatísticas
  const totalAppointments = appointments.length;
  const totalRevenue = appointments.reduce((sum, app) => sum + app.price, 0);
  const completedAppointments = appointments.filter(app => app.status === 'completed').length;
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
  const getFilteredAppointments = useCallback(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeStr = hoje.toISOString().split('T')[0];

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    // First check revenueDisplayMode
    if (revenueDisplayMode !== 'total') {
      switch (revenueDisplayMode) {
        case 'day':
          return appointments.filter(app => app.date === hojeStr);
        case 'week':
          return appointments.filter(app => {
            const appDate = new Date(app.date);
            return appDate >= startOfWeek && appDate <= endOfWeek;
          });
      }
    }

    // Then check filterMode if revenueDisplayMode is 'total'
    switch (filterMode) {
      case 'today':
        return appointments.filter(app => app.date === hojeStr);
      case 'tomorrow':
        return appointments.filter(app => app.date === amanhaStr);
      default:
        return appointments;
    }
  }, [appointments, filterMode, revenueDisplayMode]);

  const filteredAppointments = getFilteredAppointments();
  const { receitaHoje, receitaSemana, ticketMedio, taxaConclusao, clientesHoje, clientesSemana } = calculateStats();

  const loadAppointments = useCallback(async () => {
    try {
      const response = await fetch(`https://barber-backend-spm8.onrender.com/api/appointments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        mode: 'cors'
      });
      const result = await response.json();
      if (result.success) {
        const formattedAppointments = result.data
          .map((app: any) => ({
            ...app,
            service: app.serviceName
          }))
          .sort((a: Appointment, b: Appointment) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA.getTime() - dateB.getTime();
          });
        setAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
    }
  }, []);

  // Carrega os agendamentos ao montar o componente e configura o polling a cada 30 segundos
  useEffect(() => {
    loadAppointments();
    const interval = setInterval(loadAppointments, 30000);
    return () => clearInterval(interval);
  }, [loadAppointments]);

  // Calcula os dados semanais para o gráfico
  const calculateWeeklyData = useCallback(() => {
    const appointmentsByDate = appointments.reduce((acc, app) => {
      if (!acc[app.date]) {
        acc[app.date] = { pending: 0, completed: 0 };
      }
      if (app.status === 'pending') {
        acc[app.date].pending++;
      } else if (app.status === 'completed') {
        acc[app.date].completed++;
      }
      return acc;
    }, {} as { [key: string]: { pending: number; completed: number } });

    const sortedDates = Object.keys(appointmentsByDate).sort();
    const data = sortedDates.map(date => {
      const dayDate = new Date(date + 'T12:00:00-03:00');
      const fullDate = dayDate.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric'
      }).replace('.', '').replace('-feira', '');

      return {
        date: String(dayDate.getDate()),
        fullDate: fullDate.charAt(0).toUpperCase() + fullDate.slice(1),
        pending: appointmentsByDate[date].pending,
        completed: appointmentsByDate[date].completed
      };
    });
    setWeeklyData(data);
  }, [appointments]);

  useEffect(() => {
    if (appointments?.length > 0) {
      calculateWeeklyData();
    } else {
      setWeeklyData([]);
    }
  }, [appointments, calculateWeeklyData]);

  // Atualiza localmente o estado dos agendamentos após ações (delete, toggle status)
  const handleAppointmentAction = async (appointmentId: string, action: 'complete' | 'delete' | 'toggle', currentStatus?: string) => {
    if (!appointmentId) return;
    try {
      if (action === 'delete') {
        const response = await fetch(`https://barber-backend-spm8.onrender.com/api/appointments/${appointmentId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
          mode: 'cors'
        });
        if (response.ok) {
          setAppointments(prev => prev.filter(app => app.id !== appointmentId));
        }
      } else {
        const newStatus = action === 'complete' ? 'completed' : (currentStatus === 'completed' ? 'pending' : 'completed');
        const response = await fetch(`https://barber-backend-spm8.onrender.com/api/appointments/${appointmentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
          mode: 'cors',
          body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
          setAppointments(prev =>
            prev.map(app =>
              app.id === appointmentId ? { ...app, status: newStatus } : app
            )
          );
        }
      }
    } catch (error) {
      console.error(`Erro na ação ${action}:`, error);
    }
  };

  

  return (
    <div className="min-h-screen bg-[#0D121E] pt-16">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-white">Painel de Controle</h1>
          <button
            onClick={logout}
            className="bg-[#F0B35B] text-black px-4 py-2 rounded-md hover:bg-[#F0B35B]/80 transition-all duration-300 transform hover:scale-105"
          >
            Sair
          </button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer w-full"
            onClick={() => setRevenueDisplayMode(revenueDisplayMode === 'total' ? 'week' : revenueDisplayMode === 'week' ? 'day' : 'total')}
          >
            <div className="flex justify-between items-start">
              <motion.div className="flex-1 p-2 rounded-lg">
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
                      <h4 className="text-3xl sm:text-4xl font-bold text-[#F0B35B]">
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
                      <h4 className="text-3xl sm:text-4xl font-bold text-[#F0B35B]">
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
                      <h4 className="text-3xl sm:text-4xl font-bold text-[#F0B35B]">
                        R$ {receitaHoje.toFixed(2)}
                      </h4>
                      <div className="flex items-center text-sm text-green-400 mt-2 justify-center sm:justify-start">
                        <span className="inline-block mr-1">↑</span>
                        <span>{clientesHoje} clientes hoje</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <div className="p-3 bg-[#F0B35B]/10 rounded-lg hidden sm:block">
                <FaMoneyBillWave className="text-[#F0B35B] text-2xl" />
              </div>
            </div>
            <div className="mt-4 pt-4">
              <p className="text-sm sm:text-base text-gray-400">
                Ticket Médio: <span className="text-white font-semibold">R$ {ticketMedio.toFixed(2)}</span>
              </p>
              <p className="text-sm sm:text-base text-gray-400 mt-2">
                Taxa de Conclusão: <span className="text-white font-semibold">{taxaConclusao.toFixed(1)}%</span>
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-gray-400 text-sm mb-4">Status dos Agendamentos {revenueDisplayMode === 'day' ? 'de Hoje' : revenueDisplayMode === 'week' ? 'da Semana' : 'Totais'}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-yellow-500 text-xs">Pendente</p>
                    <p className="text-2xl font-bold text-yellow-500">{filteredPendingAppointments}</p>
                    <p className="text-sm text-yellow-500">R$ {filteredPendingRevenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-green-500 text-xs">Concluídos</p>
                    <p className="text-2xl font-bold text-green-500">{filteredCompletedAppointments}</p>
                    <p className="text-sm text-green-500">R$ {filteredCompletedRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="w-[120px] h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Aguardando', value: filteredPendingAppointments, color: '#FFD700' },
                        { name: 'Concluídos', value: filteredCompletedAppointments, color: '#4CAF50' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={5}
                      dataKey="value"
                      onClick={(data) => {
                        const percentage = ((data.value / (filteredPendingAppointments + filteredCompletedAppointments)) * 100).toFixed(1);
                        alert(`${data.name === 'Aguardando' ? 'Pendentes' : 'Concluídos'}: ${data.value} (${percentage}%)`);
                      }}
                    >
                      {[
                        { name: 'Aguardando', value: filteredPendingAppointments, color: '#FFD700' },
                        { name: 'Concluídos', value: filteredCompletedAppointments, color: '#4CAF50' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Seção do Gráfico */}
        <motion.div
          className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg overflow-hidden mb-6"
          animate={{ height: isChartExpanded ? 'auto' : '80px' }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="p-4 flex justify-between items-center cursor-pointer hover:bg-[#1F2737] transition-colors"
            onClick={() => setIsChartExpanded(!isChartExpanded)}
          >
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaChartLine className="text-[#F0B35B]" />
              Agendamentos por Data
            </h2>
            <motion.div
              animate={{ rotate: isChartExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <FaChevronDown className="text-gray-400 text-xl" />
            </motion.div>
          </div>
          <AnimatePresence>
            {isChartExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2 sm:p-4"
              >
                <div className="h-[300px] sm:h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weeklyData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#333"
                        vertical={false}
                        horizontalPoints={[0, 30, 60, 90]}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#fff"
                        tick={{ fontSize: 10, fill: '#fff' }}
                        axisLine={{ stroke: '#333' }}
                        tickLine={{ stroke: '#333' }}
                        height={30}
                      />
                      <YAxis
                        stroke="#fff"
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: '#fff' }}
                        axisLine={{ stroke: '#333' }}
                        tickLine={{ stroke: '#333' }}
                        width={30}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        contentStyle={{
                          backgroundColor: '#252B3B',
                          border: '1px solid #F0B35B',
                          borderRadius: '4px',
                          padding: '8px',
                          fontSize: '12px',
                          color: '#fff',
                          maxWidth: '200px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        labelStyle={{
                          color: '#F0B35B',
                          fontWeight: 'bold',
                          marginBottom: '4px',
                          fontSize: '11px'
                        }}
                        formatter={(value: any, name: string) => [
                          value,
                          name === 'pending' ? 'Pendente' : 'Concluído'
                        ]}
                        labelFormatter={(label: string, payload: any[]) => {
                          const date = payload?.[0]?.payload?.fullDate || label;
                          return date.length > 20 ? date.substring(0, 20) + '...' : date;
                        }}
                        wrapperStyle={{ zIndex: 1000, maxWidth: '90vw' }}
                      />
                      <Legend
                        formatter={(value) => value === 'pending' ? 'Pendente' : 'Concluído'}
                        wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                        height={30}
                      />
                      <Bar
                        dataKey="pending"
                        fill="#FFD700"
                        name="pending"
                        radius={[2, 2, 0, 0]}
                        maxBarSize={30}
                      />
                      <Bar
                        dataKey="completed"
                        fill="#4CAF50"
                        name="completed"
                        radius={[2, 2, 0, 0]}
                        maxBarSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Seção de Agendamentos */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs text-gray-400">Agendamentos</h2>
            <span className="text-xs text-gray-400">({filteredAppointments.length} total)</span>
          </div>
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-[#F0B35B] text-black px-4 py-2 rounded-md hover:bg-[#F0B35B]/80 transition-all duration-300 flex items-center gap-2"
            >
              {filterMode === 'today' ? 'Hoje' : filterMode === 'tomorrow' ? 'Amanhã' : 'Todos'}
              <FaChevronDown className={`transform transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </motion.button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[#1A1F2E] ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <button
                    onClick={() => {
                      setFilterMode('all');
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-sm text-white hover:bg-[#252B3B] text-left"
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode('today');
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-sm text-white hover:bg-[#252B3B] text-left"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode('tomorrow');
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-sm text-white hover:bg-[#252B3B] text-left"
                  >
                    Amanhã
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.map((appointment) => (
            <motion.div
              key={appointment.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnimatePresence mode="wait">
                <AppointmentCardNew
                  key={appointment.id}
                  appointment={appointment}
                  onDelete={() => handleAppointmentAction(appointment.id, 'delete')}
                  onToggleStatus={() => handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
                />
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;