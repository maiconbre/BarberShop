import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import AppointmentCard from '../components/AppointmentCard';
import { FaChartLine, FaMoneyBillWave, FaClock, FaCheckCircle, FaChevronDown } from 'react-icons/fa';
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
  const [completingAppointments, setCompletingAppointments] = useState<{[key: number]: boolean}>({});
  const { logout } = useAuth();
  const navigate = useNavigate();
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
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      
      return {
        date: String(dayDate.getDate()), // Mantém apenas o dia para exibição
        fullDate, // Data completa para o tooltip
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
      const response = await fetch('http://localhost:3000/api/appointments');
      const result = await response.json();
      
      if (result.success) {
        const formattedAppointments = result.data
          .map((app: any) => ({
            ...app,
            service: app.serviceName // Ajuste para corresponder ao backend
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
    if (!appointmentId) return; // Evitar chamadas com ID nulo

    try {
      if (action === 'delete') {
        const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setAppointments(prev => prev.filter(app => app.id !== appointmentId));
        }
      } else {
        // Unificar ações de status (complete e toggle)
        const newStatus = action === 'complete' ? 'completed' : 
          (currentStatus === 'completed' ? 'pending' : 'completed');

        const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-white">Painel de Controle</h1>
          <button
            onClick={logout}
            className="bg-[#F0B35B] text-black px-4 py-2 rounded-md hover:bg-[#F0B35B]/80 transition-all duration-300 transform hover:scale-105"
          >
            Sair
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            </div>
          </div>

          {/* Card 2 - Agendamentos Totais */}
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Agendamentos</p>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {totalAppointments}
                </h3>
                <p className="text-xs text-blue-400">
                  Taxa de Conclusão: {taxaConclusao.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <FaChartLine className="text-blue-500 text-xl" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Meta Mensal:</span>
                <span className="text-white">{totalAppointments}/100</span>
              </div>
            </div>
          </div>

          {/* Card 3 - Aguardando */}
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm mb-1">Aguardando</p>
                <h3 className="text-2xl font-bold text-yellow-500 mb-2">
                  {pendingAppointments}
                </h3>
                <p className="text-sm text-yellow-500">
                  R$ {pendingRevenue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <FaClock className="text-yellow-500 text-xl" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Próximo:</span>
                <span className="text-white">Em 2h</span>
              </div>
            </div>
          </div>

          {/* Card 4 - Concluídos */}
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm mb-1">Concluídos</p>
                <h3 className="text-2xl font-bold text-green-500 mb-2">
                  {completedAppointments}
                </h3>
                <p className="text-sm text-green-500">
                  R$ {completedRevenue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <FaCheckCircle className="text-green-500 text-xl" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Conversão:</span>
                <span className="text-white">{((completedAppointments/totalAppointments)*100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

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
                className="p-4"
              >
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weeklyData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="#333" 
                        vertical={false}
                      />
                      <XAxis 
                        dataKey="date" 
                        stroke="#fff"
                        tick={{ fontSize: 12, fill: '#fff' }}
                        axisLine={{ stroke: '#333' }}
                        tickLine={{ stroke: '#333' }}
                      />
                      <YAxis 
                        stroke="#fff"
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#fff' }}
                        axisLine={{ stroke: '#333' }}
                        tickLine={{ stroke: '#333' }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        contentStyle={{ 
                          backgroundColor: '#252B3B',
                          border: '1px solid #F0B35B',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          color: '#fff'
                        }}
                        labelStyle={{ color: '#F0B35B', fontWeight: 'bold' }}
                        formatter={(value: any, name: string) => [
                          `${value} agendamento(s)`,
                          name === 'pending' ? 'Pendente' : 'Concluído'
                        ]}
                        labelFormatter={(label: string, payload: any[]) => 
                          payload?.[0]?.payload?.fullDate || label
                        }
                      />
                      <Legend 
                        formatter={(value) => 
                          value === 'pending' ? 'Pendente' : 'Concluído'
                        }
                        wrapperStyle={{
                          paddingTop: '20px'
                        }}
                      />
                      <Bar 
                        dataKey="pending" 
                        fill="#FFD700"
                        name="pending"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      >
                        <motion.animate 
                          attributeName="height"
                          from="0"
                          to="100%"
                          dur="1s"
                        />
                      </Bar>
                      <Bar 
                        dataKey="completed" 
                        fill="#4CAF50"
                        name="completed"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      >
                        <motion.animate 
                          attributeName="height"
                          from="0"
                          to="100%"
                          dur="1s"
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold text-white">Seus Agendamentos</h2>
            <span className="text-sm text-gray-400">
              ({filteredAppointments.length} total)
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCompleted(!showCompleted)}
            className="bg-[#F0B35B] text-black px-4 py-2 rounded-md hover:bg-[#F0B35B]/80 transition-all duration-300"
          ></motion.button>
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