import React, { useState, useMemo } from 'react';
import { Search, X, BarChart2, PieChart, LineChart, Calendar, Users, DollarSign, TrendingUp, LayoutGrid, Table, Repeat, Gift, Percent, Clock, MessageSquare, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, BarChart, Bar, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import AppointmentHistory from './AppointmentHistory';

// Estilos CSS para scrollbar personalizada
const scrollbarStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// Adicionar estilos ao head se não existirem
if (typeof document !== 'undefined' && !document.getElementById('scrollbar-styles')) {
  const style = document.createElement('style');
  style.id = 'scrollbar-styles';
  style.textContent = scrollbarStyles;
  document.head.appendChild(style);
}

const formatWhatsApp = (whatsapp: string | undefined): string => {
    if (!whatsapp) return '-';

    let formatted = whatsapp.replace(/^55/, '');
    formatted = formatted.replace(/\D/g, '');

    if (formatted.length >= 10) {
        const ddd = formatted.substring(0, 2);
        const parte1 = formatted.length === 10 ?
            formatted.substring(2, 6) :
            formatted.substring(2, 7);
        const parte2 = formatted.length === 10 ?
            formatted.substring(6) :
            formatted.substring(7);

        return `(${ddd})${parte1}-${parte2}`;
    }

    return formatted;
};

interface Appointment {
    id: string;
    clientName: string;
    clientWhatsapp?: string;
    wppclient?: string;
    service: string;
    date: string;
    time: string;
    status: 'pending' | 'confirmed' | 'completed';
    barberId: string;
    barberName: string;
    price: number;
    isBlocked?: boolean;
}

interface ClientAnalyticsProps {
    appointments: Appointment[];
    onRefreshData?: () => Promise<void>;
}

const ClientAnalytics: React.FC<ClientAnalyticsProps> = ({ appointments }) => {
    const { getCurrentUser } = useAuth();
    const currentUser = getCurrentUser();
    const isAdmin = currentUser?.role === 'admin';

    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'services' | 'trends'>('overview');
    interface ClientData {
        id: string;
        name: string;
        whatsapp?: string;
        visits: number;
        totalSpent: number;
        lastVisit: string;
        services: Record<string, number>;
        barberName?: string;
    }

    const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#F0B35B'];

    const filteredAppointments = useMemo(() => {
        if (isAdmin) return appointments; // Admin vê todos os agendamentos de todos os barbeiros
        return appointments.filter(app => app.barberId === currentUser?.id); // Barbeiro vê apenas seus agendamentos
    }, [appointments, isAdmin, currentUser?.id]);

    const weeklyData = useMemo(() => {
        const weeks = Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (i * 7));
            const startOfWeek = new Date(date);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);

            const weekAppointments = filteredAppointments.filter(app => {
                const appDate = new Date(app.date);
                return appDate >= startOfWeek && appDate <= endOfWeek;
            });

            const uniqueClients = new Set(weekAppointments.map(app => app.clientName));
            const totalRevenue = weekAppointments.reduce((sum, app) => sum + app.price, 0);
            const ticketMedio = weekAppointments.length > 0 ? totalRevenue / weekAppointments.length : 0;

            return {
                name: `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1}`,
                clientes: uniqueClients.size,
                receita: totalRevenue,
                ticketMedio: ticketMedio
            };
        }).reverse();

        return weeks;
    }, [filteredAppointments]);

    const servicesData = useMemo(() => {
        const servicesCount: { [key: string]: number } = {};

        filteredAppointments.forEach(app => {
            if (app.service) {
                const services = app.service.split(',').map(s => s.trim());
                services.forEach(service => {
                    servicesCount[service] = (servicesCount[service] || 0) + 1;
                });
            }
        });

        return Object.entries(servicesCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [filteredAppointments]);

    const metricsData = useMemo(() => {
        const uniqueClients = new Set<string>();
        filteredAppointments.forEach(app => uniqueClients.add(app.clientName.toLowerCase()));

        const totalRevenue = filteredAppointments.reduce((sum, app) => sum + app.price, 0);
        const ticketMedio = filteredAppointments.length > 0 ? totalRevenue / filteredAppointments.length : 0;

        const clientVisits: Record<string, number> = {};
        filteredAppointments.forEach(app => {
            const clientName = app.clientName.toLowerCase();
            clientVisits[clientName] = (clientVisits[clientName] || 0) + 1;
        });

        const returningClients = Object.values(clientVisits).filter(visits => visits > 1).length;
        const returnRate = uniqueClients.size > 0 ? (returningClients / uniqueClients.size) * 100 : 0;

        const newClients = Object.values(clientVisits).filter(visits => visits === 1).length;

        return {
            ticketMedio,
            returnRate,
            newClients,
            totalClients: uniqueClients.size,
            totalRevenue,
            averageVisits: filteredAppointments.length / uniqueClients.size
        };
    }, [filteredAppointments]);

    const clientsData = useMemo(() => {
        const clientMap = new Map<string, any>();

        filteredAppointments.forEach(app => {
            const clientWhatsapp = app.wppclient || app.clientWhatsapp || '';
            const clientKey = clientWhatsapp || app.clientName.toLowerCase();

            if (!clientMap.has(clientKey)) {
                clientMap.set(clientKey, {
                    id: clientKey,
                    name: app.clientName,
                    whatsapp: clientWhatsapp,
                    visits: 0,
                    totalSpent: 0,
                    lastVisit: app.date,
                    services: {},
                    appointmentDates: [],
                    barberName: app.barberName, // Adiciona nome do barbeiro para admins
                    barberId: app.barberId
                });
            }

            const clientData = clientMap.get(clientKey)!;
            clientData.visits += 1;
            clientData.totalSpent += app.price;
            clientData.appointmentDates.push(app.date);

            if (new Date(app.date) > new Date(clientData.lastVisit)) {
                clientData.lastVisit = app.date;
            }

            if (app.service) {
                const services = app.service.split(',').map(s => s.trim());
                services.forEach(service => {
                    clientData.services[service] = (clientData.services[service] || 0) + 1;
                });
            }
        });

        return Array.from(clientMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
    }, [filteredAppointments]);

    const forecastData = useMemo(() => {
        const lastWeek = weeklyData[weeklyData.length - 1];
        const secondLastWeek = weeklyData[weeklyData.length - 2];

        const growthRate = secondLastWeek.receita > 0
            ? (lastWeek.receita - secondLastWeek.receita) / secondLastWeek.receita
            : 0.02;

        return Array.from({ length: 12 }, (_, i) => {
            const weekNumber = i + 1;
            const projectedRevenue = lastWeek.receita * Math.pow(1 + growthRate, weekNumber);
            const goal = lastWeek.receita * (1 + (0.1 * weekNumber));

            return {
                name: `Semana ${weekNumber}`,
                valor: projectedRevenue,
                meta: goal,
                tendencia: growthRate > 0 ? 'alta' : 'baixa'
            };
        });
    }, [weeklyData]);

    const seasonalityData = useMemo(() => {
        const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
        return weekdays.map((day, index) => {
            const dayAppointments = filteredAppointments.filter(app => {
                const appDate = new Date(app.date);
                return appDate.getDay() === index;
            });

            const uniqueClients = new Set(dayAppointments.map(app => app.clientName));
            const totalRevenue = dayAppointments.reduce((sum, app) => sum + app.price, 0);

            return {
                name: day,
                clientes: uniqueClients.size,
                receita: totalRevenue
            };
        });
    }, [filteredAppointments]);

    const ticketData = useMemo(() => {
        const periods = [
            { name: 'Manhã', start: 8, end: 12 },
            { name: 'Tarde', start: 12, end: 18 },
            { name: 'Noite', start: 18, end: 22 }
        ];

        return periods.map(period => {
            const periodAppointments = filteredAppointments.filter(app => {
                const hour = parseInt(app.time.split(':')[0]);
                return hour >= period.start && hour < period.end;
            });

            const totalRevenue = periodAppointments.reduce((sum, app) => sum + app.price, 0);
            const ticketMedio = periodAppointments.length > 0 ? totalRevenue / periodAppointments.length : 0;

            return {
                name: period.name,
                ticket: ticketMedio,
                servicos: periodAppointments.length
            };
        });
    }, [filteredAppointments]);

    const renderServicesTab = () => (
        <div className="space-y-3 sm:space-y-4 h-full overflow-y-auto">
            <div className="bg-[#1A1F2E] p-3 sm:p-4 rounded-xl border border-white/5">
                <h3 className="text-base sm:text-lg font-medium text-white mb-2 sm:mb-3">Serviços por Barbeiro</h3>
                <div className="h-[200px] sm:h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={servicesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#fff', fontSize: window.innerWidth <= 320 ? 10 : 12 }}
                                interval={window.innerWidth <= 320 ? 1 : 0}
                            />
                            <YAxis
                                tick={{ fill: '#fff', fontSize: window.innerWidth <= 320 ? 10 : 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(26,31,46,0.95)',
                                    border: '1px solid rgba(240,179,91,0.5)',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    fontSize: window.innerWidth <= 320 ? 10 : 12
                                }}
                            />
                            <Bar dataKey="value" name="Quantidade">
                                {servicesData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-[#1A1F2E] p-3 sm:p-4 rounded-xl border border-white/5">
                <h3 className="text-base sm:text-lg font-medium text-white mb-2 sm:mb-3">Satisfação por Serviço</h3>
                <div className="h-[200px] sm:h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={servicesData}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis
                                dataKey="name"
                                tick={{ fill: '#fff', fontSize: window.innerWidth <= 320 ? 10 : 12 }}
                            />
                            <PolarRadiusAxis
                                tick={{ fill: '#fff', fontSize: window.innerWidth <= 320 ? 10 : 12 }}
                            />
                            <Radar
                                name="Satisfação"
                                dataKey="value"
                                stroke="#F0B35B"
                                fill="#F0B35B"
                                fillOpacity={0.6}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    const renderTrendsTab = () => (
        <div className="space-y-3 h-full overflow-y-auto">
            <div className="bg-[#1A1F2E] p-2 sm:p-3 rounded-xl border border-white/5">
                <h3 className="text-base sm:text-lg font-medium text-white mb-2">Tendências das Últimas 12 Semanas</h3>
                <div className="h-[180px] sm:h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart
                            data={weeklyData}
                            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#fff', fontSize: window.innerWidth <= 320 ? 10 : 12 }}
                                interval={window.innerWidth <= 320 ? 1 : 0}
                                padding={{ left: 0, right: 0 }}
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{ fill: '#fff', fontSize: window.innerWidth <= 320 ? 10 : 12 }}
                                width={window.innerWidth <= 320 ? 30 : 40}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fill: '#fff', fontSize: window.innerWidth <= 320 ? 10 : 12 }}
                                width={window.innerWidth <= 320 ? 30 : 40}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(26,31,46,0.95)',
                                    border: '1px solid rgba(240,179,91,0.5)',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    fontSize: window.innerWidth <= 320 ? 10 : 12
                                }}
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="clientes"
                                name="Clientes"
                                stroke="#F0B35B"
                                strokeWidth={2}
                                dot={{ fill: '#F0B35B', r: window.innerWidth <= 320 ? 2 : 4 }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="receita"
                                name="Receita (R$)"
                                stroke="#00C49F"
                                strokeWidth={2}
                                dot={{ fill: '#00C49F', r: window.innerWidth <= 320 ? 2 : 4 }}
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                wrapperStyle={{
                                    paddingTop: '10px',
                                    fontSize: window.innerWidth <= 320 ? '10px' : '12px'
                                }}
                            />
                        </RechartsLineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-[#1A1F2E] p-2 sm:p-3 rounded-xl border border-white/5">
                <h3 className="text-base sm:text-lg font-medium text-white mb-2">Previsão de Receita (Próximas 12 Semanas)</h3>
                <div className="h-[180px] sm:h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={forecastData}
                            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#fff', fontSize: window.innerWidth <= 320 ? 10 : 12 }}
                                interval={window.innerWidth <= 320 ? 1 : 0}
                                padding={{ left: 0, right: 0 }}
                            />
                            <YAxis
                                tick={{ fill: '#fff', fontSize: window.innerWidth <= 320 ? 10 : 12 }}
                                width={window.innerWidth <= 320 ? 30 : 40}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(26,31,46,0.95)',
                                    border: '1px solid rgba(240,179,91,0.5)',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    fontSize: window.innerWidth <= 320 ? 10 : 12
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="valor"
                                name="Receita Prevista"
                                fill="#F0B35B"
                                stroke="#F0B35B"
                                fillOpacity={0.3}
                            />
                            <Line
                                type="monotone"
                                dataKey="meta"
                                name="Meta"
                                stroke="#00C49F"
                                strokeWidth={2}
                                dot={false}
                                strokeDasharray="5 5"
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                wrapperStyle={{
                                    paddingTop: '10px',
                                    fontSize: window.innerWidth <= 320 ? '10px' : '12px'
                                }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-[#1A1F2E] p-2 sm:p-4 rounded-xl border border-white/5">
                <h3 className="text-lg font-medium text-white mb-3">Sazonalidade Semanal</h3>
                <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={seasonalityData}
                            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#fff', fontSize: window.innerWidth <= 320 ? 10 : 12 }}
                                interval={0}
                                padding={{ left: 0, right: 0 }}
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{ fill: '#fff', fontSize: window.innerWidth <= 320 ? 10 : 12 }}
                                width={window.innerWidth <= 320 ? 30 : 40}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fill: '#fff', fontSize: window.innerWidth <= 320 ? 10 : 12 }}
                                width={window.innerWidth <= 320 ? 30 : 40}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(26,31,46,0.95)',
                                    border: '1px solid rgba(240,179,91,0.5)',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    fontSize: window.innerWidth <= 320 ? 10 : 12
                                }}
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="clientes"
                                name="Clientes"
                                fill="#F0B35B"
                                fillOpacity={0.8}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="receita"
                                name="Receita (R$)"
                                stroke="#00C49F"
                                strokeWidth={2}
                                dot={{ fill: '#00C49F', r: window.innerWidth <= 320 ? 2 : 4 }}
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                wrapperStyle={{
                                    paddingTop: '10px',
                                    fontSize: window.innerWidth <= 320 ? '10px' : '12px'
                                }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-[#1A1F2E] p-2 sm:p-3 rounded-xl border border-white/5">
                <h3 className="text-base sm:text-lg font-medium text-white mb-2">Ticket Médio por Período</h3>
                <div className="h-[180px] sm:h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={ticketData}
                            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#fff', fontSize: window.innerWidth <= 320 ? 10 : 12 }}
                                interval={0}
                                padding={{ left: 0, right: 0 }}
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{ fill: '#fff', fontSize: window.innerWidth <= 320 ? 10 : 12 }}
                                width={window.innerWidth <= 320 ? 30 : 40}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fill: '#fff', fontSize: window.innerWidth <= 320 ? 10 : 12 }}
                                width={window.innerWidth <= 320 ? 30 : 40}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(26,31,46,0.95)',
                                    border: '1px solid rgba(240,179,91,0.5)',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    fontSize: window.innerWidth <= 320 ? 10 : 12
                                }}
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="servicos"
                                name="Serviços"
                                fill="#F0B35B"
                                fillOpacity={0.8}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="ticket"
                                name="Ticket Médio (R$)"
                                stroke="#00C49F"
                                strokeWidth={2}
                                dot={{ fill: '#00C49F', r: window.innerWidth <= 320 ? 2 : 4 }}
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                wrapperStyle={{
                                    paddingTop: '10px',
                                    fontSize: window.innerWidth <= 320 ? '10px' : '12px'
                                }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    const renderOverviewTab = () => (
        <div className="space-y-3 sm:space-y-4 h-full overflow-y-auto w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 w-full">
                <motion.div
                    className="bg-[#1A1F2E] p-3 rounded-xl border border-white/5"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-xs sm:text-sm">Receita Total</p>
                            <h3 className="text-lg sm:text-xl font-bold text-[#F0B35B]">R$ {metricsData.totalRevenue.toFixed(2)}</h3>
                        </div>
                        <div className="bg-[#F0B35B]/10 p-1.5 rounded-lg">
                            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-[#F0B35B]" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="bg-[#1A1F2E] p-3 rounded-xl border border-white/5"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-xs sm:text-sm">Total de Clientes</p>
                            <h3 className="text-lg sm:text-xl font-bold text-white">{metricsData.totalClients}</h3>
                        </div>
                        <div className="bg-blue-500/10 p-1.5 rounded-lg">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="bg-[#1A1F2E] p-3 rounded-xl border border-white/5"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-xs sm:text-sm">Ticket Médio</p>
                            <h3 className="text-lg sm:text-xl font-bold text-green-400">R$ {metricsData.ticketMedio.toFixed(2)}</h3>
                        </div>
                        <div className="bg-green-500/10 p-1.5 rounded-lg">
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="bg-[#1A1F2E] p-3 sm:p-4 rounded-xl border border-white/5 w-full">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Análise e Estratégias</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 w-full">
                    <div className="space-y-2 sm:space-y-3">
                        <h4 className="text-sm sm:text-base font-medium text-[#F0B35B]">Análise de Desempenho</h4>
                        <div className="space-y-2">
                            <div className="flex items-start gap-2">
                                <div className="bg-[#F0B35B]/10 p-1.5 rounded-lg">
                                    <TrendingUp className="w-4 h-4 text-[#F0B35B]" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">Crescimento de Clientes</p>
                                    <p className="text-gray-400 text-xs">
                                        {metricsData.newClients} novos clientes nos últimos 30 dias
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="bg-green-500/10 p-1.5 rounded-lg">
                                    <Repeat className="w-4 h-4 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">Taxa de Retorno</p>
                                    <p className="text-gray-400 text-xs">
                                        {metricsData.returnRate.toFixed(1)}% dos clientes retornam
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                        <h4 className="text-sm sm:text-base font-medium text-[#F0B35B]">Estratégias Recomendadas</h4>
                        <div className="space-y-2">
                            <div className="flex items-start gap-2">
                                <div className="bg-blue-500/10 p-1.5 rounded-lg">
                                    <Gift className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">Programa de Fidelidade</p>
                                    <p className="text-gray-400 text-xs">
                                        Implementar um sistema de pontos para clientes frequentes
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="bg-purple-500/10 p-1.5 rounded-lg">
                                    <Calendar className="w-4 h-4 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">Horários de Pico</p>
                                    <p className="text-gray-400 text-xs">
                                        Oferecer descontos em horários com menor movimento
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                        <h4 className="text-sm sm:text-base font-medium text-[#F0B35B]">Promoções Sugeridas</h4>
                        <div className="space-y-2">
                            <div className="flex items-start gap-2">
                                <div className="bg-red-500/10 p-1.5 rounded-lg">
                                    <Percent className="w-4 h-4 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">Pacote Mensal</p>
                                    <p className="text-gray-400 text-xs">
                                        Oferecer desconto para clientes que agendam serviços mensais
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="bg-yellow-500/10 p-1.5 rounded-lg">
                                    <Users className="w-4 h-4 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">Indicação Premium</p>
                                    <p className="text-gray-400 text-xs">
                                        Bônus para clientes que indicarem novos clientes
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                        <h4 className="text-sm sm:text-base font-medium text-[#F0B35B]">Melhorias de Negócio</h4>
                        <div className="space-y-2">
                            <div className="flex items-start gap-2">
                                <div className="bg-green-500/10 p-1.5 rounded-lg">
                                    <Clock className="w-4 h-4 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">Gestão de Tempo</p>
                                    <p className="text-gray-400 text-xs">
                                        Otimizar agendamentos para reduzir tempos de espera
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="bg-pink-500/10 p-1.5 rounded-lg">
                                    <MessageSquare className="w-4 h-4 text-pink-500" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">Feedback Contínuo</p>
                                    <p className="text-gray-400 text-xs">
                                        Implementar sistema de avaliação pós-serviço
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const [selectedBarber, setSelectedBarber] = useState<string>('all');

    const renderClientsTab = () => {
        const filteredClients = clientsData.filter(client => {
            const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (client.whatsapp && client.whatsapp.includes(searchTerm));
            const matchesBarber = selectedBarber === 'all' || client.barberId === selectedBarber;
            return matchesSearch && matchesBarber;
        });

        // Lista de barbeiros únicos para o filtro (apenas para admins)
        const uniqueBarbers = isAdmin ? 
            Array.from(new Map(clientsData.map(client => [client.barberId, { id: client.barberId, name: client.barberName }])).values())
                .filter(barber => barber.id && barber.name) : [];

        return (
            <div className="space-y-4 sm:space-y-6">
                <div className={`space-y-3 sm:space-y-4 ${isClientModalOpen ? 'hidden' : ''}`}>
                    {/* Barra de busca */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar cliente por nome ou WhatsApp..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 sm:py-3 bg-[#1A1F2E] rounded-lg border border-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F0B35B]/50 text-sm sm:text-base"
                        />
                    </div>
                    
                    {/* Filtros e controles */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {/* Filtro por barbeiro (apenas para admins) */}
                        {isAdmin && uniqueBarbers.length > 0 && (
                            <div className="flex-1 sm:max-w-xs">
                                <select
                                    value={selectedBarber}
                                    onChange={(e) => setSelectedBarber(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-[#1A1F2E] rounded-lg border border-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#F0B35B]/50 text-sm"
                                >
                                    <option value="all">Todos os Barbeiros</option>
                                    {uniqueBarbers.map((barber) => (
                                        <option key={barber.id} value={barber.id}>
                                            {barber.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        {/* Controles de visualização */}
                        <div className="flex gap-2 sm:gap-3">
                            <button
                                onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#1A1F2E] border border-white/5 text-white hover:bg-[#F0B35B]/10 transition-colors text-sm"
                            >
                                {viewMode === 'table' ? (
                                    <>
                                        <LayoutGrid className="w-4 h-4" />
                                        <span className="hidden sm:inline">Cards</span>
                                    </>
                                ) : (
                                    <>
                                        <Table className="w-4 h-4" />
                                        <span className="hidden sm:inline">Tabela</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {/* Estatísticas dos resultados filtrados */}
                    <div className="bg-[#1A1F2E] p-3 rounded-lg border border-white/5">
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="text-gray-400">
                                <span className="text-white font-medium">{filteredClients.length}</span> cliente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
                            </span>
                            {filteredClients.length > 0 && (
                                <>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-400">
                                        Total gasto: <span className="text-[#F0B35B] font-medium">
                                            R$ {filteredClients.reduce((sum, client) => sum + client.totalSpent, 0).toFixed(2)}
                                        </span>
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-400">
                                        Visitas: <span className="text-blue-400 font-medium">
                                            {filteredClients.reduce((sum, client) => sum + client.visits, 0)}
                                        </span>
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-[#1A1F2E] rounded-xl border border-white/5 overflow-hidden">
                    {viewMode === 'table' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-medium text-gray-400">Cliente</th>
                                        <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-medium text-gray-400 hidden sm:table-cell">WhatsApp</th>
                                        {isAdmin && (
                                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-medium text-gray-400 hidden md:table-cell">Barbeiro</th>
                                        )}
                                        <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-medium text-gray-400">Visitas</th>
                                        <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-medium text-gray-400 hidden lg:table-cell">Última Visita</th>
                                        <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-medium text-gray-400">Total Gasto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClients.map((client) => (
                                        <tr
                                            key={client.id}
                                            onClick={() => { setSelectedClient(client); setIsClientModalOpen(true); }}
                                            className="cursor-pointer border-b border-white/5 hover:bg-white/10 transition-colors"
                                        >
                                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#F0B35B]/10 flex items-center justify-center">
                                                        <User className="w-3 h-3 sm:w-4 sm:h-4 text-[#F0B35B]" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-white text-sm sm:text-base font-medium block truncate">{client.name}</span>
                                                        <span className="text-gray-400 text-xs sm:hidden block">{formatWhatsApp(client.whatsapp)}</span>
                                                        {isAdmin && (
                                                            <span className="text-[#F0B35B] text-xs md:hidden block">{client.barberName}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-400 text-sm hidden sm:table-cell">{formatWhatsApp(client.whatsapp)}</td>
                                            {isAdmin && (
                                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-[#F0B35B] text-sm hidden md:table-cell">{client.barberName}</td>
                                            )}
                                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-400 text-sm">
                                                <div className="text-center">
                                                    <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
                                                        {client.visits}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-400 text-sm hidden lg:table-cell">
                                                {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-[#F0B35B] text-sm font-medium">
                                                R$ {client.totalSpent.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4">
                            {filteredClients.map((client) => (
                                <motion.div
                                    key={client.id}
                                    onClick={() => { setSelectedClient(client); setIsClientModalOpen(true); }}
                                    className="bg-[#252B3B] p-3 sm:p-4 rounded-xl border border-white/5 hover:shadow-lg cursor-pointer transition-all duration-200 hover:border-[#F0B35B]/30"
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="flex items-center gap-3 mb-3 sm:mb-4">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#F0B35B]/10 flex items-center justify-center">
                                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#F0B35B]" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-white font-medium text-sm sm:text-base truncate">{client.name}</h4>
                                            <p className="text-gray-400 text-xs sm:text-sm truncate">{formatWhatsApp(client.whatsapp)}</p>
                                            {isAdmin && (
                                                <p className="text-[#F0B35B] text-xs font-medium truncate">{client.barberName}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <p className="text-gray-400 text-xs sm:text-sm">Visitas</p>
                                            <div className="flex items-center gap-1">
                                                <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
                                                    {client.visits}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs sm:text-sm">Total Gasto</p>
                                            <p className="text-[#F0B35B] font-medium text-sm sm:text-base">R$ {client.totalSpent.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs sm:text-sm">Última Visita</p>
                                            <p className="text-white font-medium text-xs sm:text-sm">
                                                {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs sm:text-sm">Ticket Médio</p>
                                            <p className="text-green-400 font-medium text-xs sm:text-sm">
                                                R$ {(client.totalSpent / client.visits).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Indicador de performance do cliente */}
                                    <div className="mt-3 pt-3 border-t border-white/5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-400">Performance</span>
                                            <div className="flex items-center gap-1">
                                                {client.visits >= 5 ? (
                                                    <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded-full text-xs font-medium">VIP</span>
                                                ) : client.visits >= 3 ? (
                                                    <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">Frequente</span>
                                                ) : (
                                                    <span className="bg-gray-500/10 text-gray-400 px-2 py-1 rounded-full text-xs font-medium">Novo</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const selectedClientAppointments = useMemo(() => {
        if (!selectedClient) return [];
        return filteredAppointments.filter(app => app.clientName === selectedClient.name);
    }, [filteredAppointments, selectedClient]);

    return (
        <div className="w-full h-full flex flex-col p-2 sm:p-3 space-y-3 sm:space-y-4 overflow-hidden">
            <AnimatePresence>
                {isClientModalOpen && selectedClient && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="bg-[#1A1F2E] rounded-xl p-3 sm:p-4 w-full max-w-[95vw] sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto space-y-3 sm:space-y-4"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-white">{selectedClient.name}</h3>
                                    {isAdmin && (
                                        <p className="text-[#F0B35B] text-sm font-medium">Barbeiro: {selectedClient.barberName}</p>
                                    )}
                                </div>
                                <button onClick={() => setIsClientModalOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 text-gray-400">
                                    <X size={18} />
                                </button>
                            </div>
                            
                            {/* Métricas principais */}
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                <div className="bg-[#252B3B] p-2 sm:p-3 rounded-lg border border-white/5">
                                    <p className="text-gray-400 text-xs">Visitas</p>
                                    <p className="text-blue-400 font-medium text-sm mt-0.5">{selectedClient.visits}</p>
                                </div>
                                <div className="bg-[#252B3B] p-2 sm:p-3 rounded-lg border border-white/5">
                                    <p className="text-gray-400 text-xs">Total Gasto</p>
                                    <p className="text-[#F0B35B] font-medium text-sm mt-0.5">R$ {selectedClient.totalSpent.toFixed(2)}</p>
                                </div>
                                <div className="bg-[#252B3B] p-2 sm:p-3 rounded-lg border border-white/5">
                                    <p className="text-gray-400 text-xs">Ticket Médio</p>
                                    <p className="text-green-400 font-medium text-sm mt-0.5">R$ {(selectedClient.totalSpent / selectedClient.visits).toFixed(2)}</p>
                                </div>
                                <div className="bg-[#252B3B] p-2 sm:p-3 rounded-lg border border-white/5">
                                    <p className="text-gray-400 text-xs">Status</p>
                                    <div className="mt-0.5">
                                        {selectedClient.visits >= 5 ? (
                                            <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full text-xs font-medium">VIP</span>
                                        ) : selectedClient.visits >= 3 ? (
                                            <span className="bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full text-xs font-medium">Frequente</span>
                                        ) : (
                                            <span className="bg-gray-500/10 text-gray-400 px-2 py-0.5 rounded-full text-xs font-medium">Novo</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Informações compactas */}
                            <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="bg-[#252B3B] p-2 rounded-lg border border-white/5">
                                        <p className="text-gray-400 text-xs mb-1">WhatsApp</p>
                                        <p className="text-white text-sm">{formatWhatsApp(selectedClient.whatsapp)}</p>
                                    </div>
                                    <div className="bg-[#252B3B] p-2 rounded-lg border border-white/5">
                                        <p className="text-gray-400 text-xs mb-1">Última Visita</p>
                                        <p className="text-white text-sm">{selectedClient.lastVisit ? new Date(selectedClient.lastVisit).toLocaleDateString('pt-BR') : '-'}</p>
                                    </div>
                                </div>
                                
                                {/* Serviços Preferidos */}
                                <div className="bg-[#252B3B] p-2 rounded-lg border border-white/5">
                                    <p className="text-gray-400 text-xs mb-2">Serviços Preferidos</p>
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(selectedClient.services || {}).sort(([, a], [, b]) => b - a).slice(0, 4).map(([s, c]) => (
                                            <span key={s} className="px-2 py-0.5 bg-[#F0B35B]/10 text-[#F0B35B] rounded-full text-xs font-medium">
                                                {s} ({c}x)
                                            </span>
                                        ))}
                                        {Object.keys(selectedClient.services || {}).length > 4 && (
                                            <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 rounded-full text-xs">
                                                +{Object.keys(selectedClient.services || {}).length - 4} mais
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Histórico compacto */}
                            <div>
                                <h4 className="text-gray-400 text-xs font-medium mb-2">Histórico Recente</h4>
                                <div className="bg-[#252B3B] rounded-lg border border-white/5 h-32 sm:h-40 overflow-hidden">
                                    <AppointmentHistory appointments={selectedClientAppointments} />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 flex-1 overflow-hidden">
                <nav className="bg-[#1A1F2E] p-2 sm:p-3 rounded-xl md:w-1/4 md:min-w-[200px]">
                    {/* Mobile: Grid horizontal com scroll */}
                    <div className="flex md:hidden overflow-x-auto gap-2 pb-1 scrollbar-hide">
                        {[
                            { id: 'overview', label: 'Visão Geral', icon: BarChart2 },
                            { id: 'clients', label: 'Clientes', icon: Users },
                            { id: 'services', label: 'Serviços', icon: PieChart },
                            { id: 'trends', label: 'Tendências', icon: LineChart }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[70px] ${activeTab === tab.id
                                            ? 'bg-[#F0B35B] text-black font-medium'
                                            : 'text-white hover:bg-[#F0B35B]/20'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-xs leading-tight text-center whitespace-nowrap">{tab.label}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                    
                    {/* Desktop: Layout vertical */}
                    <div className="hidden md:flex md:flex-col gap-2">
                        {[
                            { id: 'overview', label: 'Visão Geral', icon: BarChart2 },
                            { id: 'clients', label: 'Clientes', icon: Users },
                            { id: 'services', label: 'Serviços', icon: PieChart },
                            { id: 'trends', label: 'Tendências', icon: LineChart }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === tab.id
                                            ? 'bg-[#F0B35B] text-black font-medium'
                                            : 'text-white hover:bg-[#F0B35B]/20'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-sm font-medium">{tab.label}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </nav>
                <div className="flex-1 overflow-hidden w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="w-full h-full"
                        >
                            {activeTab === 'overview' && renderOverviewTab()}
                            {activeTab === 'clients' && renderClientsTab()}
                            {activeTab === 'services' && renderServicesTab()}
                            {activeTab === 'trends' && renderTrendsTab()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ClientAnalytics);
