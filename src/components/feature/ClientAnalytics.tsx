import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, BarChart2, Users, DollarSign, TrendingUp, Calendar, User, Ghost } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useBarbers } from '../../hooks/useBarbers';
import { useTenant } from '../../contexts/TenantContext';
import { formatPhoneNumber } from '../../utils/formatters';
import { logger } from '../../utils/logger';
import { safeNumber, safeFixed } from '../../utils/numberUtils';

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
    simpleMode?: boolean;
}

interface ClientData {
    id: string;
    name: string;
    whatsapp?: string;
    visits: number;
    totalSpent: number;
    lastVisit: string;
    services: Record<string, number>;
    appointmentDates: string[];
    barberName?: string;
    barberId?: string;
}

interface User {
    id: string;
    role?: string;
    userRole?: string;
    type?: string | number;
    userId?: string;
    uid?: string;
}

interface BarberStats {
    id: string;
    name: string;
    appointments: number;
    revenue: number;
    clients: Set<string>;
}

// Função auxiliar para determinar se é admin de forma segura
const checkIsAdmin = (user: unknown): boolean => {
    // Verificar se temos um usuário válido
    if (user && typeof user === 'object' && 'id' in user && user.id !== 'fallback-user') {
        const userObj = user as User;
        const role = userObj.role || userObj.userRole || userObj.type || '';
        return role.toString().toLowerCase() === 'admin' || role.toString().toLowerCase() === 'administrator' || role === 1 || role === 'ADMIN';
    }

    // Verificar se temos uma flag de debug no localStorage apenas para desenvolvimento
    const debugModeActive = localStorage.getItem('debug_admin_mode') === 'true';
    const env = import.meta.env.VITE_ENVIRONMENT;
    if (debugModeActive && (env === 'development' || env === 'local')) {
        console.warn('ClientAnalytics - Debug mode ativado em desenvolvimento, tratando como admin');
        return true;
    }

    return false;
};

// Função auxiliar para obter ID do usuário de forma segura
const getUserId = (user: unknown): string | null => {
    if (!user || (typeof user === 'object' && 'id' in user && user.id === 'fallback-user')) return null;
    const userObj = user as User;
    return userObj.id || userObj.userId || userObj.uid || null;
};

const ClientAnalytics: React.FC<ClientAnalyticsProps> = ({ appointments, simpleMode }) => {
    const { user } = useAuth();
    // const currentUser = user; // Simplification if needed, or just use user directly

    // NOTE: If the code uses currentUser variable later, we define it:
    const currentUser = user;
    const { barbers, loadBarbers } = useBarbers();
    const { isValidTenant } = useTenant();

    // Estados
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'barbers'>('overview');
    const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [clientViewMode, setClientViewMode] = useState<'grid' | 'list'>('grid');
    const [showAllAppointments, setShowAllAppointments] = useState(false);

    // Get admin status and user ID using helper functions
    const isAdmin = useMemo(() => checkIsAdmin(currentUser), [currentUser]);
    const userId = useMemo(() => getUserId(currentUser), [currentUser]);

    const COLORS = ['#F0B35B', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];



    // Debug: Log dos dados recebidos
    useEffect(() => {
        console.log('ClientAnalytics - Appointments recebidos:', appointments?.length || 0);
        console.log('ClientAnalytics - Usuário atual:', currentUser);
        console.log('ClientAnalytics - É admin (calculado):', isAdmin);
        console.log('ClientAnalytics - User ID:', userId);
        console.log('ClientAnalytics - Agendamentos filtrados:', filteredAppointments?.length || 0);

        // Alerta se não houver usuário logado
        if (!currentUser) {
            console.warn('ClientAnalytics - ATENÇÃO: currentUser está null! Usuário não autenticado.');
        }
    }, [appointments, currentUser, isAdmin, userId]);

    // Carregar barbeiros ao montar o componente
    useEffect(() => {
        if (isAdmin && isValidTenant && (!barbers || barbers.length === 0)) {
            loadBarbers().catch(err => {
                logger.componentError('Erro ao carregar barbeiros:', err);
            });
        }
    }, [isAdmin, isValidTenant, barbers, loadBarbers]);

    // Filtrar agendamentos baseado no usuário
    const filteredAppointments = useMemo(() => {
        // Se não há usuário logado, não mostrar agendamentos
        if (!currentUser) {
            console.warn('ClientAnalytics - Usuário não autenticado, não mostrando agendamentos');
            return [];
        }

        // Admin vê TODOS os agendamentos sem filtros
        if (isAdmin) {
            return appointments;
        }

        // Se não conseguimos identificar o userId, não mostrar agendamentos
        if (!userId) {
            console.warn('ClientAnalytics - Usuário sem ID válido, não mostrando agendamentos');
            return [];
        }

        // Barbeiro vê apenas os seus agendamentos
        return appointments.filter(app => app.barberId === userId);
    }, [appointments, currentUser, isAdmin, userId]);

    // Dados dos clientes agrupados
    const clientsData = useMemo(() => {
        const clientMap = new Map<string, ClientData>();

        filteredAppointments.forEach(app => {
            const whatsapp = app.wppclient || app.clientWhatsapp || '';
            const normalizedWhatsapp = whatsapp.replace(/\D/g, '');
            const clientKey = normalizedWhatsapp || app.clientName.toLowerCase().trim();

            if (!clientMap.has(clientKey)) {
                clientMap.set(clientKey, {
                    id: clientKey,
                    name: app.clientName,
                    whatsapp: whatsapp,
                    visits: 0,
                    totalSpent: 0,
                    lastVisit: app.date,
                    services: {},
                    appointmentDates: [],
                    barberName: app.barberName,
                    barberId: app.barberId
                });
            }

            const clientData = clientMap.get(clientKey)!;
            clientData.visits += 1;
            clientData.totalSpent += app.price;
            clientData.appointmentDates.push(app.date);

            if (new Date(app.date) > new Date(clientData.lastVisit)) {
                clientData.lastVisit = app.date;
                clientData.name = app.clientName;
                clientData.barberName = app.barberName;
            }

            if (app.service) {
                const services = app.service.split(',').map(s => s.trim());
                services.forEach(service => {
                    clientData.services[service] = (clientData.services[service] || 0) + 1;
                });
            }
        });

        return Array.from(clientMap.values())
            .filter(client =>
                client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (client.whatsapp && client.whatsapp.includes(searchTerm))
            )
            .sort((a, b) => b.totalSpent - a.totalSpent);
    }, [filteredAppointments, searchTerm]);

    // Métricas gerais
    const metrics = useMemo(() => {
        const totalRevenue = filteredAppointments.reduce((sum, app) => sum + app.price, 0);
        const uniqueClients = new Set(filteredAppointments.map(app => app.clientName.toLowerCase())).size;
        const avgTicket = filteredAppointments.length > 0 ? totalRevenue / filteredAppointments.length : 0;

        const clientVisits: Record<string, number> = {};
        filteredAppointments.forEach(app => {
            const clientName = app.clientName.toLowerCase();
            clientVisits[clientName] = (clientVisits[clientName] || 0) + 1;
        });

        const returningClients = Object.values(clientVisits).filter(visits => visits > 1).length;
        const returnRate = uniqueClients > 0 ? (returningClients / uniqueClients) * 100 : 0;

        return {
            totalRevenue,
            uniqueClients,
            avgTicket,
            totalAppointments: filteredAppointments.length,
            returnRate
        };
    }, [filteredAppointments]);

    // Dados para gráficos
    const chartData = useMemo(() => {
        // Receita por mês (últimos 6 meses)
        const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            const monthAppointments = filteredAppointments.filter(app => {
                const appDate = new Date(app.date);
                const appMonthKey = `${appDate.getFullYear()}-${String(appDate.getMonth() + 1).padStart(2, '0')}`;
                return appMonthKey === monthKey;
            });

            return {
                month: date.toLocaleDateString('pt-BR', { month: 'short' }),
                receita: monthAppointments.reduce((sum, app) => sum + app.price, 0),
                agendamentos: monthAppointments.length
            };
        }).reverse();

        // Serviços mais populares
        const servicesCount: Record<string, number> = {};
        filteredAppointments.forEach(app => {
            if (app.service) {
                const services = app.service.split(',').map(s => s.trim());
                services.forEach(service => {
                    servicesCount[service] = (servicesCount[service] || 0) + 1;
                });
            }
        });

        const topServices = Object.entries(servicesCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return { monthlyRevenue, topServices };
    }, [filteredAppointments]);

    // Dados por barbeiro (apenas para admin)
    const barberStats = useMemo(() => {
        if (!isAdmin) return [];

        const barberMap = new Map<string, BarberStats>();

        filteredAppointments.forEach(app => {
            if (!barberMap.has(app.barberId)) {
                barberMap.set(app.barberId, {
                    id: app.barberId,
                    name: app.barberName,
                    appointments: 0,
                    revenue: 0,
                    clients: new Set()
                });
            }

            const barberData = barberMap.get(app.barberId)!;
            barberData.appointments += 1;
            barberData.revenue += app.price;
            barberData.clients.add(app.clientName.toLowerCase());
        });

        return Array.from(barberMap.values())
            .map(barber => ({
                ...barber,
                clients: barber.clients.size,
                avgTicket: barber.appointments > 0 ? barber.revenue / barber.appointments : 0
            }))
            .sort((a, b) => b.revenue - a.revenue);
    }, [filteredAppointments, isAdmin]);

    const selectedClientAppointments = useMemo(() => {
        if (!selectedClient) return [];

        return filteredAppointments.filter(app => {
            // Usar WhatsApp normalizado como critério principal
            if (selectedClient.whatsapp && app.wppclient) {
                const clientWhatsapp = selectedClient.whatsapp.replace(/\D/g, '');
                const appWhatsapp = (app.wppclient || '').replace(/\D/g, '');
                return appWhatsapp === clientWhatsapp;
            }

            // Fallback para nome do cliente
            return app.clientName.toLowerCase().trim() === selectedClient.name.toLowerCase().trim();
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedClient, filteredAppointments]);

    const renderOverviewTab = () => (
        <div className="space-y-6">
            {/* Header "Análise de Desempenho" is handled by parent or here? The parent DashboardPageNew puts "Análise de Desempenho" before calling this component.
                But wait, ClientAnalytics renders the cards.
                The design shows:
                Análise de Desempenho
                [Receita] [Ticket]
                [Clientes] [Retorno]
            */}

            {!simpleMode && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-[#1A1F2E] p-4 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
                        <p className="text-gray-400 text-xs mb-1">Receita</p>
                        <p className="text-white text-xl font-bold group-hover:text-[#D4AF37] transition-colors">R$ {safeFixed(metrics.totalRevenue, 2)}</p>
                    </div>

                    <div className="bg-[#1A1F2E] p-4 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
                        <p className="text-gray-400 text-xs mb-1">Ticket Médio</p>
                        <p className="text-white text-xl font-bold group-hover:text-[#D4AF37] transition-colors">R$ {safeFixed(metrics.avgTicket, 2)}</p>
                    </div>

                    <div className="bg-[#1A1F2E] p-4 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
                        <p className="text-gray-400 text-xs mb-1">Clientes</p>
                        <p className="text-white text-xl font-bold group-hover:text-[#D4AF37] transition-colors">{metrics.uniqueClients}</p>
                    </div>

                    <div className="bg-[#1A1F2E] p-4 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
                        <p className="text-gray-400 text-xs mb-1">Retorno</p>
                        <p className="text-white text-xl font-bold group-hover:text-[#D4AF37] transition-colors">{safeFixed(metrics.returnRate, 0)}%</p>
                    </div>
                </div>
            )}



            {/* Gráficos */}
            <div className="grid grid-cols-1 gap-6">
                {/* Receita Mensal */}
                <div className="bg-[#1A1F2E] p-4 sm:p-5 rounded-2xl border border-white/5">
                    <h3 className="text-white text-sm font-bold mb-4 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-[#E6A555]" />
                        Receita Mensal
                    </h3>
                    <div style={{ width: '100%', minHeight: '180px' }} className="h-[180px] sm:h-[220px]">
                        {chartData.monthlyRevenue.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData.monthlyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                        interval="preserveStartEnd"
                                        dy={10}
                                    />
                                    <YAxis
                                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => `R$${value}`}
                                        width={40}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0D121E',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '12px'
                                        }}
                                        itemStyle={{ color: '#E6A555' }}
                                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="receita"
                                        stroke="#E6A555"
                                        strokeWidth={2}
                                        dot={{ fill: '#1A1F2E', stroke: '#E6A555', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, fill: '#E6A555' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 opacity-50">
                                <BarChart2 className="w-8 h-8" />
                                <p className="text-xs">Sem dados suficientes</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Serviços Populares */}
                <div className="bg-[#1A1F2E] p-4 sm:p-5 rounded-2xl border border-white/5">
                    <h3 className="text-white text-sm font-bold mb-4 flex items-center gap-2">
                        <User className="w-4 h-4 text-[#E6A555]" />
                        Serviços Populares
                    </h3>
                    <div style={{ minHeight: '180px' }}>
                        {/* Empty State with Ghost */}
                        {chartData.topServices.length === 0 && (
                            <div className="flex flex-col items-start justify-center h-[180px] w-full relative overflow-hidden bg-gradient-to-br from-[#1A1F2E] to-[#151926] rounded-xl p-4">
                                <div className="z-10">
                                    <h4 className="text-white font-semibold text-sm mb-1">Ainda sem dados</h4>
                                    <p className="text-gray-400 text-xs mb-4 max-w-[200px]">Cadastre serviços para acompanhar o desempenho.</p>
                                    <button className="flex items-center gap-2 bg-[#252B3B] hover:bg-[#2E354A] text-[#E6A555] px-4 py-2 rounded-lg text-xs font-medium transition-colors border border-white/5">
                                        <span className="text-lg leading-none">+</span>
                                        Cadastrar serviço
                                    </button>
                                </div>
                                {/* Ghost Illustration Placeholder using pure CSS/SVG if possible or simplistic shapes */}
                                <div className="absolute right-[-10px] bottom-[-20px] opacity-80 pointer-events-none">
                                    <Ghost className="w-24 h-24 text-gray-700/30 rotate-12" />
                                </div>
                            </div>
                        )}

                        {chartData.topServices.length > 0 && (
                            /* Gráfico de barras horizontal para mobile */
                            <div className="space-y-3">
                                {chartData.topServices.slice(0, 5).map((service, index) => {
                                    const percentage = (service.value / chartData.topServices.reduce((sum, s) => sum + s.value, 0)) * 100;
                                    return (
                                        <div key={service.name}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-gray-300 text-xs font-medium truncate">{service.name}</span>
                                                <span className="text-white text-xs font-bold">{service.value}</span>
                                            </div>
                                            <div className="w-full bg-white/5 rounded-full h-1.5">
                                                <div
                                                    className="h-1.5 rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        backgroundColor: COLORS[index % COLORS.length]
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Detalhes do Cliente */}
            <AnimatePresence>
                {isClientModalOpen && selectedClient && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                        onClick={() => {
                            setIsClientModalOpen(false);
                            setShowAllAppointments(false);
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1A1F2E] rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden"
                        >
                            {/* Header do Modal */}
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-[#F0B35B] rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-black" />
                                    </div>
                                    <div>
                                        <h2 className="text-white text-lg font-bold">{selectedClient.name}</h2>
                                        <p className="text-gray-400 text-sm">{formatPhoneNumber(selectedClient.whatsapp || '')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsClientModalOpen(false);
                                        setShowAllAppointments(false);
                                    }}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Conteúdo do Modal */}
                            <div className="p-4">
                                {/* Resumo do Cliente */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                    <div className="bg-[#0F1419] p-3 rounded-lg text-center">
                                        <p className="text-gray-400 text-xs">Total de Visitas</p>
                                        <p className="text-white text-xl font-bold">{selectedClient.visits}</p>
                                    </div>
                                    <div className="bg-[#0F1419] p-3 rounded-lg text-center">
                                        <p className="text-gray-400 text-xs">Total Gasto</p>
                                        <p className="text-[#F0B35B] text-xl font-bold">R$ {safeFixed(selectedClient.totalSpent, 2)}</p>
                                    </div>
                                    <div className="bg-[#0F1419] p-3 rounded-lg text-center">
                                        <p className="text-gray-400 text-xs">Ticket Médio</p>
                                        <p className="text-white text-xl font-bold">R$ {safeFixed(safeNumber(selectedClient.totalSpent) / safeNumber(selectedClient.visits, 1), 2)}</p>
                                    </div>
                                    <div className="bg-[#0F1419] p-3 rounded-lg text-center">
                                        <p className="text-gray-400 text-xs">Última Visita</p>
                                        <p className="text-white text-sm font-bold">{new Date(selectedClient.lastVisit).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>

                                {/* Serviços Favoritos */}
                                <div className="mb-4">
                                    <h3 className="text-white text-sm font-semibold mb-2">Serviços Favoritos</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(selectedClient.services)
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0, 3)
                                            .map(([service, count]) => (
                                                <div key={service} className="bg-[#F0B35B]/20 text-[#F0B35B] px-3 py-1 rounded-full text-xs font-medium">
                                                    {service} ({count}x)
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>

                                {isAdmin && selectedClient.barberName && (
                                    <div className="mb-4">
                                        <p className="text-gray-400 text-sm">Barbeiro Principal: <span className="text-white font-medium">{selectedClient.barberName}</span></p>
                                    </div>
                                )}

                                {/* Botão para Ver Todos os Agendamentos */}
                                <div className="flex justify-center mb-4">
                                    <button
                                        onClick={() => setShowAllAppointments(!showAllAppointments)}
                                        className="bg-[#F0B35B] text-black px-6 py-2 rounded-lg font-medium hover:bg-[#F0B35B]/90 transition-colors"
                                    >
                                        {showAllAppointments ? 'Ocultar Agendamentos' : 'Ver Todos os Agendamentos'}
                                    </button>
                                </div>
                            </div>

                            {/* Lista de Agendamentos (Expansível) */}
                            <AnimatePresence>
                                {showAllAppointments && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-white/10 overflow-hidden"
                                    >
                                        <div className="p-4 max-h-96 overflow-y-auto">
                                            <h3 className="text-white text-sm font-semibold mb-3">Histórico de Agendamentos</h3>
                                            <div className="space-y-2">
                                                {selectedClientAppointments.map((appointment, index) => (
                                                    <div key={`${appointment.id}-${index}`} className="bg-[#0F1419] p-3 rounded-lg">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <p className="text-white font-medium text-sm">{appointment.service}</p>
                                                                <p className="text-gray-400 text-xs">
                                                                    {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[#F0B35B] font-bold text-sm">R$ {safeFixed(appointment.price, 2)}</p>
                                                                <span className={`text-xs px-2 py-1 rounded-full ${appointment.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                                    appointment.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                                                                        'bg-yellow-500/20 text-yellow-400'
                                                                    }`}>
                                                                    {appointment.status === 'completed' ? 'Concluído' :
                                                                        appointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isAdmin && (
                                                            <p className="text-gray-400 text-xs">Barbeiro: {appointment.barberName}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const renderClientsTab = () => (
        <div className="space-y-6">
            {/* Busca e Controles */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 bg-[#1A1F2E] border border-white/10 rounded-xl text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-[#F0B35B]"
                    />
                </div>

                {/* Botão de visualização apenas no mobile */}
                <div className="sm:hidden">
                    <button
                        onClick={() => setClientViewMode(clientViewMode === 'grid' ? 'list' : 'grid')}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#1A1F2E] border border-white/10 rounded-xl text-white hover:border-[#F0B35B] transition-colors"
                    >
                        <BarChart2 className="w-4 h-4" />
                        <span className="text-sm">{clientViewMode === 'grid' ? 'Lista' : 'Cards'}</span>
                    </button>
                </div>
            </div>

            {/* Lista de Clientes */}
            {clientViewMode === 'grid' ? (
                /* Visualização em Cards (Mobile) */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {clientsData.map((client) => (
                        <motion.div
                            key={client.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setSelectedClient(client);
                                setIsClientModalOpen(true);
                                setShowAllAppointments(false);
                            }}
                            className="bg-[#1A1F2E] p-3 sm:p-4 rounded-xl border border-white/5 hover:border-[#F0B35B]/30 cursor-pointer transition-all"
                        >
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="w-10 h-10 bg-[#F0B35B] rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-black" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-medium text-sm truncate">{client.name}</h3>
                                    <p className="text-gray-400 text-xs">{formatPhoneNumber(client.whatsapp || '')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-[#0F1419] p-2 rounded-lg">
                                    <p className="text-gray-400">Visitas</p>
                                    <p className="text-white font-bold">{client.visits}</p>
                                </div>
                                <div className="bg-[#0F1419] p-2 rounded-lg">
                                    <p className="text-gray-400">Total</p>
                                    <p className="text-[#F0B35B] font-bold">R$ {safeFixed(client.totalSpent, 2)}</p>
                                </div>
                            </div>

                            {isAdmin && client.barberName && (
                                <div className="mt-2 text-xs text-gray-400">
                                    Barbeiro: {client.barberName}
                                </div>
                            )}

                            <div className="mt-2 text-xs text-gray-400">
                                Última visita: {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                /* Visualização em Lista (Desktop) */
                <div className="bg-[#1A1F2E] rounded-xl border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#0F1419] border-b border-white/5">
                                <tr>
                                    <th className="text-left p-2 sm:p-4 text-gray-300 font-medium text-xs sm:text-sm">Cliente</th>
                                    <th className="text-left p-2 sm:p-4 text-gray-300 font-medium text-xs sm:text-sm">WhatsApp</th>
                                    {isAdmin && <th className="text-left p-2 sm:p-4 text-gray-300 font-medium text-xs sm:text-sm">Barbeiro</th>}
                                    <th className="text-left p-2 sm:p-4 text-gray-300 font-medium text-xs sm:text-sm">Visitas</th>
                                    <th className="text-left p-2 sm:p-4 text-gray-300 font-medium text-xs sm:text-sm">Total Gasto</th>
                                    <th className="text-left p-2 sm:p-4 text-gray-300 font-medium text-xs sm:text-sm">Última Visita</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientsData.map((client) => (
                                    <tr
                                        key={client.id}
                                        onClick={() => {
                                            setSelectedClient(client);
                                            setIsClientModalOpen(true);
                                            setShowAllAppointments(false);
                                        }}
                                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                                    >
                                        <td className="p-2 sm:p-4">
                                            <div className="flex items-center space-x-2 sm:space-x-3">
                                                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-[#F0B35B] rounded-full flex items-center justify-center">
                                                    <User className="w-3 h-3 sm:w-5 sm:h-5 text-black" />
                                                </div>
                                                <span className="text-white font-medium text-xs sm:text-base">{client.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 sm:p-4 text-gray-300 text-xs sm:text-base">
                                            {formatPhoneNumber(client.whatsapp || '')}
                                        </td>
                                        {isAdmin && (
                                            <td className="p-2 sm:p-4 text-gray-300 text-xs sm:text-base">{client.barberName || '-'}</td>
                                        )}
                                        <td className="p-2 sm:p-4 text-white font-medium text-xs sm:text-base">{client.visits}</td>
                                        <td className="p-2 sm:p-4 text-[#F0B35B] font-medium text-xs sm:text-base">R$ {safeFixed(client.totalSpent, 2)}</td>
                                        <td className="p-2 sm:p-4 text-gray-300 text-xs sm:text-base">
                                            {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    // Simplified render for embedded mode
    if (simpleMode) {
        return renderOverviewTab();
    }

    const renderBarbersTab = () => {
        if (!isAdmin) return null;

        return (
            <div className="space-y-6">
                <div className="bg-[#1A1F2E] rounded-xl border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#0F1419] border-b border-white/5">
                                <tr>
                                    <th className="text-left p-2 sm:p-4 text-gray-300 font-medium text-xs sm:text-sm">Barbeiro</th>
                                    <th className="text-left p-2 sm:p-4 text-gray-300 font-medium text-xs sm:text-sm">Agendamentos</th>
                                    <th className="text-left p-2 sm:p-4 text-gray-300 font-medium text-xs sm:text-sm">Clientes</th>
                                    <th className="text-left p-2 sm:p-4 text-gray-300 font-medium text-xs sm:text-sm">Receita</th>
                                    <th className="text-left p-2 sm:p-4 text-gray-300 font-medium text-xs sm:text-sm">Ticket Médio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {barberStats.map((barber) => (
                                    <tr key={barber.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-2 sm:p-4">
                                            <div className="flex items-center space-x-2 sm:space-x-3">
                                                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-[#F0B35B] rounded-full flex items-center justify-center">
                                                    <User className="w-3 h-3 sm:w-5 sm:h-5 text-black" />
                                                </div>
                                                <span className="text-white font-medium text-xs sm:text-base">{barber.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 sm:p-4 text-white font-medium text-xs sm:text-base">{barber.appointments}</td>
                                        <td className="p-2 sm:p-4 text-white font-medium text-xs sm:text-base">{barber.clients}</td>
                                        <td className="p-2 sm:p-4 text-[#F0B35B] font-medium text-xs sm:text-base">R$ {safeFixed(barber.revenue, 2)}</td>
                                        <td className="p-2 sm:p-4 text-gray-300 text-xs sm:text-base">R$ {safeFixed(barber.avgTicket, 2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#0F1419] p-2 sm:p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex items-center space-x-3">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">Relatórios</h1>
                        {isAdmin && (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                ADMIN
                            </span>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400">Analytics do negócio</p>
                </div>



                {/* Tabs */}
                <div className="mb-3 sm:mb-4">
                    <div className="flex space-x-1 bg-[#1A1F2E] p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 py-2 px-2 sm:py-3 sm:px-4 rounded-lg font-medium transition-colors text-xs sm:text-sm ${activeTab === 'overview'
                                ? 'bg-[#F0B35B] text-black'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Visão Geral</span>
                            <span className="sm:hidden">Geral</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('clients')}
                            className={`flex-1 py-2 px-2 sm:py-3 sm:px-4 rounded-lg font-medium transition-colors text-xs sm:text-sm ${activeTab === 'clients'
                                ? 'bg-[#F0B35B] text-black'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
                            Clientes
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('barbers')}
                                className={`flex-1 py-2 px-2 sm:py-3 sm:px-4 rounded-lg font-medium transition-colors text-xs sm:text-sm ${activeTab === 'barbers'
                                    ? 'bg-[#F0B35B] text-black'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <User className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
                                Barbeiros
                            </button>
                        )}
                    </div>
                </div>

                {/* Conteúdo das Tabs */}
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
                        {activeTab === 'barbers' && renderBarbersTab()}
                    </motion.div>
                </AnimatePresence>

                {/* Modal de Detalhes do Cliente */}
                <AnimatePresence>
                    {isClientModalOpen && selectedClient && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                            onClick={() => setIsClientModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-[#1A1F2E] rounded-xl border border-white/10 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-white">Detalhes do Cliente</h2>
                                    <button
                                        onClick={() => setIsClientModalOpen(false)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Informações do Cliente */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-[#0F1419] p-4 rounded-lg">
                                        <h3 className="text-gray-400 text-sm mb-1">Nome</h3>
                                        <p className="text-white font-medium">{selectedClient.name}</p>
                                    </div>
                                    <div className="bg-[#0F1419] p-4 rounded-lg">
                                        <h3 className="text-gray-400 text-sm mb-1">WhatsApp</h3>
                                        <p className="text-white font-medium">{formatPhoneNumber(selectedClient.whatsapp || '')}</p>
                                    </div>
                                    <div className="bg-[#0F1419] p-4 rounded-lg">
                                        <h3 className="text-gray-400 text-sm mb-1">Total de Visitas</h3>
                                        <p className="text-white font-medium">{selectedClient.visits}</p>
                                    </div>
                                    <div className="bg-[#0F1419] p-4 rounded-lg">
                                        <h3 className="text-gray-400 text-sm mb-1">Total Gasto</h3>
                                        <p className="text-[#F0B35B] font-medium">R$ {safeFixed(selectedClient.totalSpent, 2)}</p>
                                    </div>
                                </div>

                                {/* Histórico de Agendamentos */}
                                <div>
                                    <h3 className="text-white font-semibold mb-4">Histórico de Agendamentos</h3>
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {selectedClientAppointments.map((appointment) => (
                                            <div key={appointment.id} className="bg-[#0F1419] p-4 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-white font-medium">{appointment.service}</p>
                                                        <p className="text-gray-400 text-sm">
                                                            {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}
                                                        </p>
                                                        {isAdmin && appointment.barberName && (
                                                            <p className="text-gray-400 text-sm">Barbeiro: {appointment.barberName}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[#F0B35B] font-medium">R$ {safeFixed(appointment.price, 2)}</p>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${appointment.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                            appointment.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                                                                'bg-yellow-500/20 text-yellow-400'
                                                            }`}>
                                                            {appointment.status === 'completed' ? 'Concluído' :
                                                                appointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default React.memo(ClientAnalytics);
