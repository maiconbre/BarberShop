import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChartLine, FaChevronDown } from 'react-icons/fa';
import { TrendingUp, DollarSign, Award, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
  viewed?: boolean;
}

interface GraficoProps {
  appointments: Appointment[];
  isChartExpanded: boolean;
  setIsChartExpanded: (expanded: boolean) => void;
}

const Grafico: React.FC<GraficoProps> = ({ appointments, isChartExpanded, setIsChartExpanded }) => {
  // Dados para o gráfico de tendências ao longo do tempo
  const trendsData = useMemo(() => {
    const monthlyData: { [key: string]: { clients: number, revenue: number } } = {};
    const last6Months = [];
    
    // Gerar os últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = { clients: 0, revenue: 0 };
      last6Months.push(monthKey);
    }
    
    // Agrupar dados por mês
    appointments.forEach(app => {
      const date = new Date(app.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].revenue += app.price;
        monthlyData[monthKey].clients += 1;
      }
    });
    
    // Formatar para o gráfico
    return last6Months.map(month => {
      const [year, monthNum] = month.split('-');
      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('pt-BR', { month: 'short' });
      
      return {
        name: monthName,
        clientes: monthlyData[month].clients,
        receita: monthlyData[month].revenue
      };
    });
  }, [appointments]);

  // Calcular dados para os cards de métricas
  const metricsData = useMemo(() => {
    // Extrair nomes de clientes únicos para calcular total de clientes
    const uniqueClients = new Set<string>();
    appointments.forEach(app => uniqueClients.add(app.clientName.toLowerCase()));
    
    // Calcular ticket médio
    const totalRevenue = appointments.reduce((sum, app) => sum + app.price, 0);
    const ticketMedio = appointments.length > 0 ? totalRevenue / appointments.length : 0;
    
    // Calcular clientes que retornam (com mais de uma visita)
    const clientVisits: Record<string, number> = {};
    appointments.forEach(app => {
      const clientName = app.clientName.toLowerCase();
      clientVisits[clientName] = (clientVisits[clientName] || 0) + 1;
    });
    
    const returningClients = Object.values(clientVisits).filter(visits => visits > 1).length;
    const returnRate = uniqueClients.size > 0 ? (returningClients / uniqueClients.size) * 100 : 0;
    
    // Calcular clientes novos (com apenas uma visita)
    const newClients = Object.values(clientVisits).filter(visits => visits === 1).length;
    
    return {
      ticketMedio,
      returnRate,
      newClients
    };
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
          <FaChartLine className="text-[#F0B35B]" />
          Tendências e Análises
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
            className="p-2 sm:p-4 overflow-x-hidden"
          >
            {/* Gráfico principal de tendências */}
            <div className="bg-[#0D121E] p-3 sm:p-4 rounded-lg mb-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3 sm:mb-4 text-center">Tendências das Últimas 12 Semanas</h3>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendsData}
                    margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: window.innerWidth < 640 ? 7 : window.innerWidth < 768 ? 8 : 10, fill: '#fff' }}
                    />
                    <YAxis 
                      yAxisId="left" 
                      orientation="left" 
                      stroke="#F0B35B" 
                      tick={{ fontSize: window.innerWidth < 640 ? 7 : window.innerWidth < 768 ? 8 : 10, fill: '#fff' }}
                      width={30}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke="#00C49F" 
                      tick={{ fontSize: window.innerWidth < 640 ? 7 : window.innerWidth < 768 ? 8 : 10, fill: '#fff' }}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(26,31,46,0.95)',
                        border: '1px solid rgba(240,179,91,0.5)',
                        borderRadius: '8px',
                        padding: window.innerWidth < 640 ? '4px' : '8px',
                        fontSize: window.innerWidth < 640 ? '10px' : '12px',
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="clientes" 
                      name="Clientes" 
                      stroke="#F0B35B" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="receita" 
                      name="Receita (R$)" 
                      stroke="#00C49F" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Cards de métricas */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-[#0D121E] p-2 sm:p-4 rounded-lg">
                <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2 text-center">Ticket Médio</h3>
                <div className="flex flex-col items-center justify-center h-20 sm:h-24">
                  <DollarSign className="h-6 w-6 text-green-400 mb-1" />
                  <p className="text-lg sm:text-2xl font-bold text-white">
                    R$ {metricsData.ticketMedio.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="bg-[#0D121E] p-2 sm:p-4 rounded-lg">
                <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2 text-center">Taxa de Retorno</h3>
                <div className="flex flex-col items-center justify-center h-20 sm:h-24">
                  <Award className="h-6 w-6 text-[#F0B35B] mb-1" />
                  <p className="text-lg sm:text-2xl font-bold text-white">
                    {Math.round(metricsData.returnRate)}%
                  </p>
                </div>
              </div>
              
              <div className="bg-[#0D121E] p-2 sm:p-4 rounded-lg">
                <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2 text-center">Clientes Novos</h3>
                <div className="flex flex-col items-center justify-center h-20 sm:h-24">
                  <Users className="h-6 w-6 text-blue-400 mb-1" />
                  <p className="text-lg sm:text-2xl font-bold text-white">
                    {metricsData.newClients}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Grafico;