import React, { useState, useMemo } from 'react';
import { Search, X, BarChart2, PieChart, LineChart, Calendar, Users, DollarSign, TrendingUp, LayoutGrid, Table, Repeat, Gift, Percent, Clock, MessageSquare, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart as RechartsPieChart, Cell, BarChart, Bar, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import AppointmentHistory from './AppointmentHistory';

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
    }

    const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#F0B35B'];

    const filteredAppointments = useMemo(() => {
        if (isAdmin) return appointments;
        return appointments.filter(app => app.barberId === currentUser?.id);
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
            const services = app.service.split(',').map(s => s.trim());
            services.forEach(service => {
                servicesCount[service] = (servicesCount[service] || 0) + 1;
            });
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
                    name: app.clientName,
                    whatsapp: clientWhatsapp,
                    visits: 0,
                    totalSpent: 0,
                    lastVisit: app.date,
                    services: {},
                    appointmentDates: []
                });
            }

            const clientData = clientMap.get(clientKey)!;
            clientData.visits += 1;
            clientData.totalSpent += app.price;
            clientData.appointmentDates.push(app.date);

            if (new Date(app.date) > new Date(clientData.lastVisit)) {
                clientData.lastVisit = app.date;
            }

            const services = app.service.split(',').map(s => s.trim());
            services.forEach(service => {
                clientData.services[service] = (clientData.services[service] || 0) + 1;
            });
        });

        return Array.from(clientMap.values());
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
        <div className="space-y-6">
            <div className="bg-[#1A1F2E] p-4 rounded-xl border border-white/5">
                <h3 className="text-lg font-medium text-white mb-4">Serviços por Barbeiro</h3>
                <div className="h-[300px]">
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

            <div className="bg-[#1A1F2E] p-4 rounded-xl border border-white/5">
                <h3 className="text-lg font-medium text-white mb-4">Satisfação por Serviço</h3>
                <div className="h-[300px]">
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
        <div className="space-y-4">
            <div className="bg-[#1A1F2E] p-2 sm:p-4 rounded-xl border border-white/5">
                <h3 className="text-lg font-medium text-white mb-3">Tendências das Últimas 12 Semanas</h3>
                <div className="h-[250px] sm:h-[300px]">
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

            <div className="bg-[#1A1F2E] p-2 sm:p-4 rounded-xl border border-white/5">
                <h3 className="text-lg font-medium text-white mb-3">Previsão de Receita (Próximas 12 Semanas)</h3>
                <div className="h-[250px] sm:h-[300px]">
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

            <div className="bg-[#1A1F2E] p-2 sm:p-4 rounded-xl border border-white/5">
                <h3 className="text-lg font-medium text-white mb-3">Ticket Médio por Período</h3>
                <div className="h-[250px] sm:h-[300px]">
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
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <motion.div
                    className="bg-[#1A1F2E] p-4 rounded-xl border border-white/5"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Receita Total</p>
                            <h3 className="text-2xl font-bold text-[#F0B35B]">R$ {metricsData.totalRevenue.toFixed(2)}</h3>
                        </div>
                        <div className="bg-[#F0B35B]/10 p-2 rounded-lg">
                            <DollarSign className="w-6 h-6 text-[#F0B35B]" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="bg-[#1A1F2E] p-4 rounded-xl border border-white/5"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total de Clientes</p>
                            <h3 className="text-2xl font-bold text-white">{metricsData.totalClients}</h3>
                        </div>
                        <div className="bg-blue-500/10 p-2 rounded-lg">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="bg-[#1A1F2E] p-4 rounded-xl border border-white/5"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Ticket Médio</p>
                            <h3 className="text-2xl font-bold text-green-400">R$ {metricsData.ticketMedio.toFixed(2)}</h3>
                        </div>
                        <div className="bg-green-500/10 p-2 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-500" />
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="bg-[#1A1F2E] p-6 rounded-xl border border-white/5">
                <h3 className="text-xl font-semibold text-white mb-4">Análise e Estratégias</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="text-lg font-medium text-[#F0B35B]">Análise de Desempenho</h4>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="bg-[#F0B35B]/10 p-2 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-[#F0B35B]" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Crescimento de Clientes</p>
                                    <p className="text-gray-400 text-sm">
                                        {metricsData.newClients} novos clientes nos últimos 30 dias
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-green-500/10 p-2 rounded-lg">
                                    <Repeat className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Taxa de Retorno</p>
                                    <p className="text-gray-400 text-sm">
                                        {metricsData.returnRate.toFixed(1)}% dos clientes retornam
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-lg font-medium text-[#F0B35B]">Estratégias Recomendadas</h4>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="bg-blue-500/10 p-2 rounded-lg">
                                    <Gift className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Programa de Fidelidade</p>
                                    <p className="text-gray-400 text-sm">
                                        Implementar um sistema de pontos para clientes frequentes
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-purple-500/10 p-2 rounded-lg">
                                    <Calendar className="w-5 h-5 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Horários de Pico</p>
                                    <p className="text-gray-400 text-sm">
                                        Oferecer descontos em horários com menor movimento
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-lg font-medium text-[#F0B35B]">Promoções Sugeridas</h4>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="bg-red-500/10 p-2 rounded-lg">
                                    <Percent className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Pacote Mensal</p>
                                    <p className="text-gray-400 text-sm">
                                        Oferecer desconto para clientes que agendam serviços mensais
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-yellow-500/10 p-2 rounded-lg">
                                    <Users className="w-5 h-5 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Indicação Premium</p>
                                    <p className="text-gray-400 text-sm">
                                        Bônus para clientes que indicarem novos clientes
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-lg font-medium text-[#F0B35B]">Melhorias de Negócio</h4>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="bg-green-500/10 p-2 rounded-lg">
                                    <Clock className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Gestão de Tempo</p>
                                    <p className="text-gray-400 text-sm">
                                        Otimizar agendamentos para reduzir tempos de espera
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-pink-500/10 p-2 rounded-lg">
                                    <MessageSquare className="w-5 h-5 text-pink-500" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Feedback Contínuo</p>
                                    <p className="text-gray-400 text-sm">
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

    const renderClientsTab = () => {
        const filteredClients = clientsData.filter(client =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.whatsapp && client.whatsapp.includes(searchTerm))
        );

        return (
            <div className="space-y-6">
                <div className={`flex flex-col sm:flex-row gap-4 ${isClientModalOpen ? 'hidden' : ''}`}>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-[#1A1F2E] rounded-lg border border-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F0B35B]/50"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
                            className="p-2 rounded-lg bg-[#1A1F2E] border border-white/5 text-white hover:bg-[#F0B35B]/10 transition-colors"
                        >
                            {viewMode === 'table' ? <LayoutGrid className="w-5 h-5" /> : <Table className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="bg-[#1A1F2E] rounded-xl border border-white/5 overflow-hidden">
                    {viewMode === 'table' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Cliente</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">WhatsApp</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Visitas</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Última Visita</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Total Gasto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClients.map((client) => (
                                        <tr
                                            key={client.id}
                                            onClick={() => { setSelectedClient(client); setIsClientModalOpen(true); }}
                                            className="cursor-pointer border-b border-white/5 hover:bg-white/10 transition-colors"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#F0B35B]/10 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-[#F0B35B]" />
                                                    </div>
                                                    <span className="text-white">{client.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400">{formatWhatsApp(client.whatsapp)}</td>
                                            <td className="py-3 px-4 text-gray-400">{client.visits}</td>
                                            <td className="py-3 px-4 text-gray-400">
                                                {new Date(client.lastVisit).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4 text-[#F0B35B]">
                                                R$ {client.totalSpent.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                            {filteredClients.map((client) => (
                                <motion.div
                                    key={client.id}
                                    onClick={() => { setSelectedClient(client); setIsClientModalOpen(true); }}
                                    className="bg-[#252B3B] p-4 rounded-xl border border-white/5 hover:shadow-lg cursor-pointer transition-shadow duration-200"
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-[#F0B35B]/10 flex items-center justify-center">
                                            <User className="w-5 h-5 text-[#F0B35B]" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium">{client.name}</h4>
                                            <p className="text-gray-400 text-sm">{formatWhatsApp(client.whatsapp)}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-gray-400 text-sm">Visitas</p>
                                            <p className="text-white font-medium">{client.visits}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Total Gasto</p>
                                            <p className="text-[#F0B35B] font-medium">R$ {client.totalSpent.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Última Visita</p>
                                            <p className="text-white font-medium">
                                                {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Ticket Médio</p>
                                            <p className="text-white font-medium">
                                                R$ {(client.totalSpent / client.visits).toFixed(2)}
                                            </p>
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
        <div className="w-full h-full flex flex-col p-4 sm:p-6 md:p-8 space-y-6">
            <AnimatePresence>
                {isClientModalOpen && selectedClient && (
                    <div className="fixed inset-0 z-60 flex items-start justify-center pt-20 px-2 sm:px-4 bg-black backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="bg-[#1A1F2E] rounded-xl p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[calc(100vh-5rem)] overflow-hidden space-y-1 sm:space-y-5"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold text-white">Detalhes de {selectedClient.name}</h3>
                                <button onClick={() => setIsClientModalOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 text-gray-400">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2  sm:gap-4">
                                <div className="space-y-1 sm:space-y-3">
                                    <p className="text-gray-400 text-sm">Contato</p>
                                    <p className="text-white font-medium">{formatWhatsApp(selectedClient.whatsapp)}</p>
                                    <p className="text-gray-400 text-sm">Visitas</p>
                                    <p className="text-white font-medium">{selectedClient.visits}</p>
                                    <p className="text-gray-400 text-sm">Total Gasto</p>
                                    <p className="text-green-400 font-medium">R$ {selectedClient.totalSpent.toFixed(2)}</p>
                                </div>
                                <div className="space-y-1 sm:space-y-3">
                                    <p className="text-gray-400 text-sm">Última Visita</p>
                                    <p className="text-white">{selectedClient.lastVisit ? new Date(selectedClient.lastVisit).toLocaleDateString('pt-BR') : '-'}</p>
                                    <p className="text-gray-400 text-sm">Serviços Preferidos</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(selectedClient.services || {}).sort(([, a], [, b]) => b - a).map(([s, c]) => (
                                            <span key={s} className="px-2 py-1 bg-[#F0B35B]/10 text-[#F0B35B] rounded-full text-xs">{s} ({c}x)</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-gray-400 text-sm mb-2">Histórico de Agendamentos</h4>
                                <AppointmentHistory appointments={selectedClientAppointments} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                <nav className="flex justify-center md:justify-start flex-wrap md:flex-col gap-2 bg-[#1A1F2E] p-3 rounded-xl md:w-1/4">
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
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${activeTab === tab.id
                                        ? 'bg-[#F0B35B] text-black font-medium'
                                        : 'text-white hover:bg-[#F0B35B]/20'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm">{tab.label}</span>
                            </motion.button>
                        );
                    })}
                </nav>
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
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
