import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Store, Users, Calendar, TrendingUp, DollarSign,
    Activity, Crown, BarChart3, PieChart,
    ArrowUpRight, ArrowDownRight, LogOut, Settings,
    Bell, Search, Menu, ChevronRight
} from 'lucide-react';
import { AdminService } from '../../services/AdminService';
import { supabase } from '../../config/supabaseConfig';

interface Metrics {
    totalBarbershops: number;
    activeBarbershops: number;
    trialBarbershops: number;
    freePlanCount: number;
    proPlanCount: number;
    enterprisePlanCount: number;
    totalAppointments: number;
    totalBarbers: number;
    revenue: number;
    mrr: number;
}

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            setLoading(true);
            const data = await AdminService.getGlobalMetrics();
            setMetrics(data);
        } catch (error) {
            console.error('Erro ao carregar métricas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin/login');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0a0e17]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#F0B35B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Carregando métricas...</p>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0a0e17]">
                <div className="text-red-400">Erro ao carregar métricas</div>
            </div>
        );
    }

    // Calcular taxa de conversão
    const conversionRate = metrics.totalBarbershops > 0
        ? ((metrics.proPlanCount + metrics.enterprisePlanCount) / metrics.totalBarbershops * 100).toFixed(1)
        : 0;

    // Calcular crescimento (simulado)
    const growthRate = 12.5;

    return (
        <div className="flex min-h-screen bg-[#0a0e17]">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#0f1419] border-r border-gray-800 transition-all duration-300 flex flex-col`}>
                {/* Logo */}
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#F0B35B] to-[#D4943D] rounded-xl flex items-center justify-center">
                            <Crown className="w-6 h-6 text-white" />
                        </div>
                        {sidebarOpen && (
                            <div>
                                <h1 className="text-white font-bold text-lg">BarberShop</h1>
                                <p className="text-gray-500 text-xs">Admin Central</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Menu */}
                <nav className="flex-1 p-4 space-y-2">
                    <NavItem icon={<BarChart3 />} label="Dashboard" active sidebarOpen={sidebarOpen} />
                    <NavItem icon={<Store />} label="Barbearias" onClick={() => navigate('/admin/barbershops')} sidebarOpen={sidebarOpen} />
                    <NavItem icon={<Users />} label="Usuários" sidebarOpen={sidebarOpen} />
                    <NavItem icon={<Calendar />} label="Agendamentos" sidebarOpen={sidebarOpen} />
                    <NavItem icon={<DollarSign />} label="Financeiro" sidebarOpen={sidebarOpen} />
                    <NavItem icon={<Settings />} label="Configurações" sidebarOpen={sidebarOpen} />
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full p-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        {sidebarOpen && <span>Sair</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Top Bar */}
                <header className="bg-[#0f1419]/80 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-10">
                    <div className="flex items-center justify-between px-8 py-4">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-white">Dashboard</h2>
                                <p className="text-gray-500 text-sm">Visão geral da plataforma</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="pl-10 pr-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-transparent w-64"
                                />
                            </div>

                            {/* Notifications */}
                            <button className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-[#F0B35B] rounded-full"></span>
                            </button>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
                                title="Sair do Sistema"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>

                            {/* Profile */}
                            <div className="flex items-center space-x-3 pl-4 border-l border-gray-700">
                                <div className="w-9 h-9 bg-gradient-to-br from-[#F0B35B] to-[#D4943D] rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">SA</span>
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-white text-sm font-medium">Super Admin</p>
                                    <p className="text-gray-500 text-xs">Administrador</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-8">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <KPICard
                            title="Total de Barbearias"
                            value={metrics.totalBarbershops}
                            change={`+${growthRate}%`}
                            changeUp={true}
                            icon={<Store className="w-6 h-6" />}
                            color="from-blue-500 to-blue-600"
                        />
                        <KPICard
                            title="Receita Mensal (MRR)"
                            value={`R$ ${metrics.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            change="+8.2%"
                            changeUp={true}
                            icon={<DollarSign className="w-6 h-6" />}
                            color="from-[#F0B35B] to-[#D4943D]"
                        />
                        <KPICard
                            title="Taxa de Conversão"
                            value={`${conversionRate}%`}
                            change="+2.1%"
                            changeUp={true}
                            icon={<TrendingUp className="w-6 h-6" />}
                            color="from-green-500 to-green-600"
                        />
                        <KPICard
                            title="Agendamentos/Mês"
                            value={metrics.totalAppointments.toLocaleString('pt-BR')}
                            change="+15.3%"
                            changeUp={true}
                            icon={<Calendar className="w-6 h-6" />}
                            color="from-purple-500 to-purple-600"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Revenue Chart */}
                        <div className="lg:col-span-2 bg-[#0f1419] rounded-2xl border border-gray-800 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-white text-lg font-semibold">Receita Mensal</h3>
                                    <p className="text-gray-500 text-sm">Últimos 6 meses</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="px-3 py-1 bg-[#F0B35B]/20 text-[#F0B35B] text-xs font-medium rounded-full">
                                        +18% vs anterior
                                    </span>
                                </div>
                            </div>
                            {/* Simulated Chart */}
                            <div className="h-64 flex items-end justify-around space-x-4">
                                {[40, 55, 45, 60, 75, 85].map((height, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center">
                                        <div
                                            className="w-full bg-gradient-to-t from-[#F0B35B] to-[#F0B35B]/50 rounded-t-lg transition-all duration-500 hover:from-[#F0B35B] hover:to-[#D4943D]"
                                            style={{ height: `${height}%` }}
                                        />
                                        <span className="text-gray-500 text-xs mt-2">
                                            {['Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev'][i]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Plan Distribution */}
                        <div className="bg-[#0f1419] rounded-2xl border border-gray-800 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-white text-lg font-semibold">Distribuição</h3>
                                    <p className="text-gray-500 text-sm">Por tipo de plano</p>
                                </div>
                                <PieChart className="w-5 h-5 text-gray-500" />
                            </div>

                            <div className="space-y-4">
                                <PlanBar
                                    label="Free"
                                    count={metrics.freePlanCount}
                                    total={metrics.totalBarbershops}
                                    color="bg-gray-500"
                                />
                                <PlanBar
                                    label="Pro"
                                    count={metrics.proPlanCount}
                                    total={metrics.totalBarbershops}
                                    color="bg-[#F0B35B]"
                                    icon={<Crown className="w-3 h-3" />}
                                />
                                <PlanBar
                                    label="Enterprise"
                                    count={metrics.enterprisePlanCount}
                                    total={metrics.totalBarbershops}
                                    color="bg-purple-500"
                                    icon={<Crown className="w-3 h-3" />}
                                />
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-800">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-white">{metrics.totalBarbers}</p>
                                        <p className="text-gray-500 text-xs">Barbeiros Ativos</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{metrics.trialBarbershops}</p>
                                        <p className="text-gray-500 text-xs">Em Trial</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Status */}
                        <div className="bg-[#0f1419] rounded-2xl border border-gray-800 p-6">
                            <h3 className="text-white text-lg font-semibold mb-4">Status do Sistema</h3>
                            <div className="space-y-3">
                                <StatusItem label="API" status="online" latency="32ms" />
                                <StatusItem label="Database" status="online" latency="12ms" />
                                <StatusItem label="Storage" status="online" latency="45ms" />
                                <StatusItem label="Auth Service" status="online" latency="28ms" />
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-[#0f1419] rounded-2xl border border-gray-800 p-6">
                            <h3 className="text-white text-lg font-semibold mb-4">Ações Rápidas</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <ActionButton
                                    label="Nova Barbearia"
                                    icon={<Store className="w-5 h-5" />}
                                    primary
                                />
                                <ActionButton
                                    label="Enviar Notificação"
                                    icon={<Bell className="w-5 h-5" />}
                                />
                                <ActionButton
                                    label="Ver Logs"
                                    icon={<Activity className="w-5 h-5" />}
                                />
                                <ActionButton
                                    label="Configurações"
                                    icon={<Settings className="w-5 h-5" />}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Sub-components

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
    sidebarOpen: boolean;
}> = ({ icon, label, active, onClick, sidebarOpen }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${active
            ? 'bg-[#F0B35B]/10 text-[#F0B35B]'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
    >
        {icon}
        {sidebarOpen && <span>{label}</span>}
        {sidebarOpen && active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
);

const KPICard: React.FC<{
    title: string;
    value: string | number;
    change: string;
    changeUp: boolean;
    icon: React.ReactNode;
    color: string;
}> = ({ title, value, change, changeUp, icon, color }) => (
    <div className="bg-[#0f1419] rounded-2xl border border-gray-800 p-6 hover:border-gray-700 transition-colors">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${color} text-white`}>
                {icon}
            </div>
            <div className={`flex items-center space-x-1 text-sm ${changeUp ? 'text-green-400' : 'text-red-400'}`}>
                {changeUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                <span>{change}</span>
            </div>
        </div>
        <p className="text-gray-500 text-sm mb-1">{title}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
    </div>
);

const PlanBar: React.FC<{
    label: string;
    count: number;
    total: number;
    color: string;
    icon?: React.ReactNode;
}> = ({ label, count, total, color, icon }) => {
    const percentage = total > 0 ? (count / total * 100) : 0;
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    {icon && <span className="text-gray-400">{icon}</span>}
                    <span className="text-gray-300 text-sm">{label}</span>
                </div>
                <span className="text-white font-semibold">{count}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                    className={`${color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

const StatusItem: React.FC<{
    label: string;
    status: 'online' | 'offline' | 'warning';
    latency: string;
}> = ({ label, status, latency }) => (
    <div className="flex items-center justify-between p-3 bg-[#1a1f2e] rounded-lg">
        <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-400' :
                status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                }`} />
            <span className="text-gray-300">{label}</span>
        </div>
        <span className="text-gray-500 text-sm">{latency}</span>
    </div>
);

const ActionButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    primary?: boolean;
}> = ({ label, icon, primary }) => (
    <button className={`flex items-center space-x-2 p-3 rounded-xl transition-colors ${primary
        ? 'bg-gradient-to-r from-[#F0B35B] to-[#D4943D] text-black font-semibold hover:opacity-90'
        : 'bg-[#1a1f2e] text-gray-300 hover:bg-[#252b3b]'
        }`}>
        {icon}
        <span className="text-sm">{label}</span>
    </button>
);

export default AdminDashboard;
