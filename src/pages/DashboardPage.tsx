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
  fullDate: string; // Nova propriedade para data completa
}

const DashboardPage: React.FC = () => {
  const { logout } = useAuth();
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [weeklyData, setWeeklyData] = useState<ChartData[]>([]);
  const [isChartExpanded, setIsChartExpanded] = useState(true);

  const calculateWeeklyData = useCallback(() => {
    // Agrupar todos os agendamentos por data
    const appointmentsByDate = appointments.reduce((acc, app) => {
      if (!acc[app.date]) {
        acc[app.date] = {
          pending: 0,
          completed: 0
        };
      }
      if (app.status === 'pending') {
        acc[app.date].pending++;
      } else if (app.status === 'completed') {
        acc[app.date].completed++;
      }
      return acc;
    }, {} as { [key: string]: { pending: number; completed: number } });

    // Ordenar as datas
    const sortedDates = Object.keys(appointmentsByDate).sort();

    // Criar dados do gráfico
    const data = sortedDates.map(date => {
      const dayDate = new Date(date + 'T12:00:00-03:00');
      const fullDate = dayDate.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric'
      }).replace('.', '').replace('-feira', '');
      
      return {
        date: String(dayDate.getDate()),
        fullDate: fullDate.charAt(0).toUpperCase() + fullDate.slice(1), // Capitaliza a primeira letra
        pending: appointmentsByDate[date].pending,
        completed: appointmentsByDate[date].completed
      };
    });

    setWeeklyData(data);
  }, [appointments]);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    if (appointments?.length > 0) {
      calculateWeeklyData();
    } else {
      setWeeklyData([]); // Definir um array vazio quando não houver dados
    }
  }, [appointments, calculateWeeklyData]);

  const loadAppointments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
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
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'complete' | 'delete' | 'toggle', currentStatus?: string) => {
    if (!appointmentId) return;

    try {
      if (action === 'delete') {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointmentId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          setAppointments(prev => prev.filter(app => app.id !== appointmentId));
        }
      } else {
        const newStatus = action === 'complete' ? 'completed' : 
          (currentStatus === 'completed' ? 'pending' : 'completed');

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointmentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
          setAppointments(prev => 
            prev.map(app => app.id === appointmentId 
              ? { ...app, status: newStatus } 
              : app
            )
          );
        }
      }
    } catch (error) {
      console.error(`Erro na ação ${action}:`, error);
    }
  };

  // Calcular estatísticas
  const totalAppointments = appointments.length;
  const totalRevenue = appointments.reduce((sum, app) => sum + app.price, 0);
  const pendingAppointments = appointments.filter(app => app.status === 'pending').length;
  const completedAppointments = appointments.filter(app => app.status === 'completed').length;
  const pendingRevenue = appointments
    .filter(app => app.status === 'pending')
    .reduce((sum, app) => sum + app.price, 0);
  const completedRevenue = appointments
    .filter(app => app.status === 'completed')
    .reduce((sum, app) => sum + app.price, 0);


    // Adicionar cálculos de estatísticas financeiras
  const calculateStats = () => {
    const hoje = new Date().toISOString().split('T')[0];
    const receitaHoje = appointments
      .filter(app => app.date === hoje)
      .reduce((sum, app) => sum + app.price, 0);
    
    const ticketMedio = totalAppointments > 0 
      ? totalRevenue / totalAppointments 
      : 0;

    const taxaConclusao = totalAppointments > 0 
      ? (completedAppointments / totalAppointments) * 100 
      : 0;

    return { receitaHoje, ticketMedio, taxaConclusao };
  };

  const { receitaHoje, ticketMedio, taxaConclusao } = calculateStats();

  // Filtrar agendamentos baseado no estado showCompleted
  const filteredAppointments = showCompleted 
    ? appointments 
    : appointments.filter(app => app.status !== 'completed');

  return (
    <div className="min-h-screen bg-[#0D121E] pt-16">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-white">Painel de Controle</h1>
          <button
            onClick={logout}
            className="bg-[#F0B35B] text-black px-4 py-2 rounded-md hover:bg-[#F0B35B]/80 transition-all duration-300 transform hover:scale-105"
          >
            Sair
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Card 1 - Receita Total */}
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm mb-1">Receita Total</p>
                <h3 className="text-2xl font-bold text-[#F0B35B] mb-2">
                  R$ {totalRevenue.toFixed(2)}
                </h3>
                <p className="text-xs text-green-400">
                  <span className="inline-block mr-1">↑</span>
                  Hoje: R$ {receitaHoje.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-[#F0B35B]/10 rounded-lg">
                <FaMoneyBillWave className="text-[#F0B35B] text-xl" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Ticket Médio: <span className="text-white">R$ {ticketMedio.toFixed(2)}</span>
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Taxa de Conclusão: <span className="text-white">{taxaConclusao.toFixed(1)}%</span>
              </p>
            </div>
          </div>

          {/* Card 2 - Status Overview */}
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-gray-400 text-sm mb-4">Status dos Agendamentos</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-yellow-500 text-xs">Pendente</p>
                    <p className="text-2xl font-bold text-yellow-500">{pendingAppointments}</p>
                    <p className="text-sm text-yellow-500">R$ {pendingRevenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-green-500 text-xs">Concluídos</p>
                    <p className="text-2xl font-bold text-green-500">{completedAppointments}</p>
                    <p className="text-sm text-green-500">R$ {completedRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="w-[120px] h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Aguardando', value: pendingAppointments, color: '#FFD700' },
                        { name: 'Concluídos', value: completedAppointments, color: '#4CAF50' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        { name: 'Aguardando', value: pendingAppointments, color: '#FFD700' },
                        { name: 'Concluídos', value: completedAppointments, color: '#4CAF50' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#252B3B',
                        border: '1px solid #F0B35B',
                        borderRadius: '4px',
                        color: '#fff'
                      }}
                      formatter={(value, name) => [
                        `${value} (${((Number(value) / totalAppointments) * 100).toFixed(1)}%)`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
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
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 5
                      }}
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
                          // Limitar o tamanho do texto da data
                          return date.length > 20 ? date.substring(0, 20) + '...' : date;
                        }}
                        wrapperStyle={{
                          zIndex: 1000,
                          maxWidth: '90vw'
                        }}
                      />
                      <Legend 
                        formatter={(value) => 
                          value === 'pending' ? 'Pendente' : 'Concluído'
                        }
                        wrapperStyle={{
                          paddingTop: '10px',
                          fontSize: '11px'
                        }}
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

        {/* Appointments Section */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs text-gray-400">Agendamentos</h2>
            <span className="text-xs text-gray-400">
              ({filteredAppointments.length} total)
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCompleted(!showCompleted)}
            className="bg-[#F0B35B] text-black px-4 py-2 rounded-md hover:bg-[#F0B35B]/80 transition-all duration-300"
          >
            {showCompleted ? 'Ocultar Finalizados' : 'Mostrar Finalizados'}
          </motion.button>
        </div>

        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {filteredAppointments.map((appointment) => (
              <AppointmentCardNew
                key={appointment.id}
                appointment={appointment}
                onDelete={() => handleAppointmentAction(appointment.id, 'delete')}
                onToggleStatus={() => handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardPage;