import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChartLine, FaChevronDown } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartData {
  date: string;
  pending: number;
  completed: number;
  fullDate: string;
}

interface GraficoProps {
  weeklyData: ChartData[];
  isChartExpanded: boolean;
  setIsChartExpanded: (expanded: boolean) => void;
}

const Grafico: React.FC<GraficoProps> = ({ weeklyData, isChartExpanded, setIsChartExpanded }) => {
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
  );
};

export default Grafico;