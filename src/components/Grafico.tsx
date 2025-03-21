import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChartLine, FaChevronDown } from 'react-icons/fa';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';



interface GraficoProps {
  appointments: any[];
  isChartExpanded: boolean;
  setIsChartExpanded: (expanded: boolean) => void;
}

const Grafico: React.FC<GraficoProps> = ({ appointments, isChartExpanded, setIsChartExpanded }) => {
  // Calcular os dados do gráfico a partir dos appointments
  const weeklyData = React.useMemo(() => {
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
    return sortedDates.map(date => {
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
  }, [appointments]);
  return (
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
          <FaChartLine className="text-white bg" />
          Analise dos agendamentos
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
                <AreaChart
                  data={weeklyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FFD700" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="fullDate"
                    stroke="#fff"
                    tick={{ fontSize: 10, fill: '#fff' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    height={60}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#fff"
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#fff' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(26,31,46,0.95)',
                      border: '1px solid rgba(240,179,91,0.5)',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      color: '#fff'
                    }}
                    formatter={(value: any, name: string) => [
                      value,
                      name === 'pending' ? 'Pendente' : 'Concluído'
                    ]}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Legend
                    formatter={(value) => value === 'pending' ? 'Pendente' : 'Concluído'}
                    wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    name="pending"
                    stroke="#FFD700"
                    fillOpacity={1}
                    fill="url(#colorPending)"
                    strokeWidth={2}
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="completed"
                    stroke="#4CAF50"
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                    strokeWidth={2}
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Grafico;