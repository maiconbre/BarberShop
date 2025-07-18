import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChartLine, FaChevronDown } from 'react-icons/fa';
import { DollarSign, Award, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';

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

// Cores para os gráficos de pizza e barras
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#F0B35B'];

const Grafico: React.FC<GraficoProps> = ({ appointments, isChartExpanded, setIsChartExpanded }) => {
  // Dados para o gráfico de tendências ao longo do tempo
  const trendsData = useMemo(() => {
    const weeklyData: { [key: string]: { clients: number, revenue: number } } = {};
    const last12Weeks: Array<{ key: string; startDate: Date; endDate: Date }> = [];

    // Gerar as últimas 12 semanas
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7)); // Voltar i semanas
      
      // Obter o início da semana (domingo)
      const dayOfWeek = date.getDay();
      const startOfWeek = new Date(date);
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
      
      // Formatar como YYYY-WW (ano-semana)
      const weekYear = startOfWeek.getFullYear();
      // Calcular o número da semana
      const onejan = new Date(weekYear, 0, 1);
      const weekNum = Math.ceil(((startOfWeek.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
      
      const weekKey = `${weekYear}-${String(weekNum).padStart(2, '0')}`;
      weeklyData[weekKey] = { clients: 0, revenue: 0 };
      last12Weeks.push({
        key: weekKey,
        startDate: new Date(startOfWeek),
        endDate: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000) // Adicionar 6 dias
      });
    }

    // Agrupar dados por semana
    appointments.forEach(app => {
      const appDate = new Date(app.date);
      
      // Encontrar a semana correspondente
      const matchingWeek = last12Weeks.find(week => 
        appDate >= week.startDate && appDate <= week.endDate
      );

      if (matchingWeek && weeklyData[matchingWeek.key]) {
        weeklyData[matchingWeek.key].revenue += app.price;
        weeklyData[matchingWeek.key].clients += 1;
      }
    });

    // Formatar para o gráfico
    return last12Weeks.map(week => {
      // Formatar como "DD/MM - DD/MM" (início - fim da semana)
      const startDay = week.startDate.getDate();
      const startMonth = week.startDate.getMonth() + 1;
      const endDay = week.endDate.getDate();
      const endMonth = week.endDate.getMonth() + 1;
      
      const weekLabel = `${String(startDay).padStart(2, '0')}/${String(startMonth).padStart(2, '0')} - ${String(endDay).padStart(2, '0')}/${String(endMonth).padStart(2, '0')}`;

      return {
        name: weekLabel,
        clientes: weeklyData[week.key].clients,
        receita: weeklyData[week.key].revenue
      };
    });
  }, [appointments]);

  // Dados para o gráfico de serviços mais populares
  const popularServicesData = useMemo(() => {
    const servicesCount: { [key: string]: number } = {};
    
    // Contar ocorrências de cada serviço
    appointments.forEach(app => {
      const services = app.service.split(',').map(s => s.trim());
      services.forEach(service => {
        servicesCount[service] = (servicesCount[service] || 0) + 1;
      });
    });

    return Object.entries(servicesCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Limitar aos 6 serviços mais populares
  }, [appointments]);

  // Dados para o gráfico de frequência por dia da semana
  const weekdayFrequencyData = useMemo(() => {
    const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const weekdayCounts = Array(7).fill(0);

    appointments.forEach(app => {
      const date = new Date(app.date);
      const weekday = date.getDay();
      weekdayCounts[weekday]++;
    });

    return weekdays.map((name, index) => ({
      name,
      value: weekdayCounts[index]
    }));
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
              <div style={{ width: '100%', height: '400px', minWidth: '300px', minHeight: '400px' }}>
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
            
            {/* Gráficos adicionais - Serviços e Dias da Semana */}
            <div className="flex flex-col gap-3 sm:gap-6 mb-4">
              {/* Gráfico de barras verticais - Serviços mais populares */}
              <div className="bg-[#0D121E] p-2 sm:p-3 md:p-4 rounded-lg w-full">
                <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-4 text-center">Serviços Mais Populares</h3>
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={popularServicesData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="name"
                        tick={(props) => {
                          const { x, y, payload } = props;
                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text
                                x={0}
                                y={0}
                                dy={16}
                                fontSize={window.innerWidth < 640 ? 8 : 10}
                                fill="#fff"
                                textAnchor="end"
                                transform="rotate(-45)"
                              >
                                {payload.value}
                              </text>
                            </g>
                          );
                        }}
                        height={50}
                      />
                      <YAxis
                        tick={{ 
                          fontSize: window.innerWidth < 640 ? 10 : 12,
                          fill: '#fff'
                        }}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(26,31,46,0.95)',
                          border: '1px solid rgba(240,179,91,0.5)',
                          borderRadius: '8px',
                          padding: '8px',
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        name="Quantidade"
                        background={{ fill: 'rgba(255,255,255,0.05)' }}
                        radius={[4, 4, 0, 0]}
                        label={{
                          position: 'top',
                          fill: '#fff',
                          fontSize: window.innerWidth < 640 ? 10 : 12,
                        }}
                      >
                        {popularServicesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de área - Frequência por dia da semana */}
              <div className="bg-[#0D121E] p-2 sm:p-3 md:p-4 rounded-lg">
                <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-4 text-center">Frequência Semanal</h3>
                <div className="h-32 sm:h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={weekdayFrequencyData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F0B35B" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#F0B35B" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: window.innerWidth < 640 ? 10 : 12, fill: '#fff' }}
                        tickFormatter={(value) => value.substring(0, 3)}
                      />
                      <YAxis 
                        tick={{ fontSize: window.innerWidth < 640 ? 10 : 12, fill: '#fff' }}
                        width={25}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(26,31,46,0.95)',
                          border: '1px solid rgba(240,179,91,0.5)',
                          borderRadius: '8px',
                          padding: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#F0B35B"
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
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