import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, BarChart2, RefreshCw, Filter, Download, DollarSign, Award, Smartphone, Layers, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';

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
    createdAt?: string;
    updatedAt?: string;
    viewed?: boolean;
}

interface ClientAnalyticsProps {
    appointments: Appointment[];
}

interface ClientData {
    name: string;
    whatsapp?: string;
    visits: number;
    totalSpent: number;
    lastVisit: string;
    services: { [key: string]: number };
    appointmentDates: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#F0B35B'];

const ClientAnalytics: React.FC<ClientAnalyticsProps> = ({ appointments }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'clients' | 'services' | 'recurrence' | 'trends'>('clients');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState<'all' | 'month' | 'week' | 'quarter'>('month');
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<string>('all');
    const [spendingRange, setSpendingRange] = useState<'all' | 'low' | 'medium' | 'high'>('all');
    const [sortBy, setSortBy] = useState<'visits' | 'spent' | 'recent'>('visits');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [clientAppointments, setClientAppointments] = useState<Appointment[]>([]);
    const [showClientHistory, setShowClientHistory] = useState(false);
    const filterModalRef = useRef<HTMLDivElement>(null);

    // Efeito para fechar o modal de filtro ao clicar fora dele
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterModalRef.current && !filterModalRef.current.contains(event.target as Node)) {
                setFilterModalOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Efeito para detectar dispositivo móvel e ajustar o modo de visualização
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setViewMode('cards');
            } else {
                setViewMode('table');
            }
        };

        // Configuração inicial
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Função para calcular dados de clientes a partir dos agendamentos
    const clientsData = useMemo(() => {
        const clientMap = new Map<string, ClientData>();

        // Filtrar agendamentos por período de tempo
        const filteredAppointments = appointments.filter(app => {
            if (timeRange === 'all') return true;

            const appDate = new Date(app.date);
            const now = new Date();

            if (timeRange === 'month') {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(now.getDate() - 30);
                return appDate >= thirtyDaysAgo;
            }

            if (timeRange === 'week') {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(now.getDate() - 7);
                return appDate >= sevenDaysAgo;
            }

            return true;
        });

        // Processar agendamentos para construir dados de clientes
        filteredAppointments.forEach(app => {
            const clientName = app.clientName.toLowerCase();
            // Busca o WhatsApp do cliente no campo wppclient (campo usado no backend)
            const clientWhatsapp = app.wppclient || app.clientWhatsapp || '';

            if (!clientMap.has(clientName)) {
                clientMap.set(clientName, {
                    name: app.clientName,
                    whatsapp: clientWhatsapp,
                    visits: 0,
                    totalSpent: 0,
                    lastVisit: app.date,
                    services: {},
                    appointmentDates: []
                });
            }

            const clientData = clientMap.get(clientName)!;
            clientData.visits += 1;
            clientData.totalSpent += app.price;
            clientData.appointmentDates.push(app.date);

            // Atualizar última visita se esta for mais recente
            if (new Date(app.date) > new Date(clientData.lastVisit)) {
                clientData.lastVisit = app.date;
            }

            // Contar serviços utilizados
            const services = app.service.split(',').map(s => s.trim());
            services.forEach(service => {
                clientData.services[service] = (clientData.services[service] || 0) + 1;
            });
        });

        return Array.from(clientMap.values());
    }, [appointments, timeRange]);

    // Filtrar clientes com base no termo de busca e outros filtros
    const filteredClients = useMemo(() => {
        let filtered = clientsData;

        // Filtro por termo de busca
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(client =>
                client.name.toLowerCase().includes(term) ||
                (client.whatsapp && client.whatsapp.includes(term))
            );
        }

        // Filtro por serviço específico
        if (selectedService !== 'all') {
            filtered = filtered.filter(client =>
                Object.keys(client.services).some(service =>
                    service.toLowerCase() === selectedService.toLowerCase()
                )
            );
        }

        // Filtro por faixa de gastos
        if (spendingRange !== 'all') {
            filtered = filtered.filter(client => {
                if (spendingRange === 'low' && client.totalSpent <= 100) return true;
                if (spendingRange === 'medium' && client.totalSpent > 100 && client.totalSpent <= 300) return true;
                if (spendingRange === 'high' && client.totalSpent > 300) return true;
                return false;
            });
        }

        // Ordenação
        return filtered.sort((a, b) => {
            if (sortBy === 'visits') return b.visits - a.visits;
            if (sortBy === 'spent') return b.totalSpent - a.totalSpent;
            if (sortBy === 'recent') return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
            return 0;
        });
    }, [clientsData, searchTerm, selectedService, spendingRange, sortBy]);

    // Dados para o gráfico de serviços mais populares
    const popularServicesData = useMemo(() => {
        const servicesCount: { [key: string]: number } = {};

        clientsData.forEach(client => {
            Object.entries(client.services).forEach(([service, count]) => {
                servicesCount[service] = (servicesCount[service] || 0) + count;
            });
        });

        return Object.entries(servicesCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6); // Limitar aos 6 serviços mais populares
    }, [clientsData]);

    // Lista de todos os serviços para o filtro
    const allServices = useMemo(() => {
        const services = new Set<string>();
        clientsData.forEach(client => {
            Object.keys(client.services).forEach(service => {
                services.add(service);
            });
        });
        return Array.from(services).sort();
    }, [clientsData]);

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

    // Dados para o gráfico de recorrência
    const recurrenceData = useMemo(() => {
        const recurrenceMap: { [key: string]: number } = {
            '1 visita': 0,
            '2 visitas': 0,
            '3 visitas': 0,
            '4 visitas': 0,
            '5+ visitas': 0
        };

        clientsData.forEach(client => {
            if (client.visits === 1) recurrenceMap['1 visita']++;
            else if (client.visits === 2) recurrenceMap['2 visitas']++;
            else if (client.visits === 3) recurrenceMap['3 visitas']++;
            else if (client.visits === 4) recurrenceMap['4 visitas']++;
            else recurrenceMap['5+ visitas']++;
        });

        return Object.entries(recurrenceMap)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0);
    }, [clientsData]);

    // Dados para o gráfico de frequência por dia da semana
    const weekdayFrequencyData = useMemo(() => {
        const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const weekdayCounts = Array(7).fill(0);

        clientsData.forEach(client => {
            client.appointmentDates.forEach(dateStr => {
                const date = new Date(dateStr);
                const weekday = date.getDay();
                weekdayCounts[weekday]++;
            });
        });

        return weekdays.map((name, index) => ({
            name,
            value: weekdayCounts[index]
        }));
    }, [clientsData]);

    // Função para simular atualização de dados
    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };

    // Função para exportar dados dos clientes
    const handleExportData = () => {
        // Preparar dados para exportação
        const csvContent = [
            ['Nome', 'WhatsApp', 'Visitas', 'Total Gasto', 'Última Visita'].join(','),
            ...filteredClients.map(client => [
                client.name,
                client.whatsapp || '',
                client.visits,
                client.totalSpent.toFixed(2),
                new Date(client.lastVisit).toLocaleDateString('pt-BR')
            ].join(','))
        ].join('\n');

        // Criar blob e link para download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Função para alternar entre visualização de tabela e cards
    const toggleViewMode = () => {
        setViewMode(viewMode === 'table' ? 'cards' : 'table');
    };

    // Função para mostrar o histórico de agendamentos de um cliente
    const handleClientClick = (clientName: string) => {
        // Filtrar agendamentos do cliente selecionado
        const clientApps = appointments.filter(app =>
            app.clientName.toLowerCase() === clientName.toLowerCase()
        );

        // Ordenar por data (mais recente primeiro)
        clientApps.sort((a, b) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        setSelectedClient(clientName);
        setClientAppointments(clientApps);
        setShowClientHistory(true);
    };

    // Função para fechar o histórico de cliente
    const closeClientHistory = () => {
        setShowClientHistory(false);
        setSelectedClient(null);
    };

    return (
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg p-4 sm:p-6 mb-6 relative">
            {/* Modal de histórico detalhado do cliente */}
            {showClientHistory && selectedClient && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 mt-10 z-30 overflow-y-auto">
                    <div 
                        className="bg-[#1A1F2E] rounded-xl border border-[#F0B35B]/20 shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden my-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 flex justify-between items-center p-4 border-b border-gray-700/30 bg-[#1A1F2E] z-10">
                            <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                                <Users className="h-5 w-5 text-[#F0B35B]" />
                                Histórico de {selectedClient}
                            </h3>
                            <button
                                onClick={closeClientHistory}
                                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/30 rounded-lg"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                            {clientAppointments.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="bg-[#0D121E] p-3 rounded-lg">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                                            <div>
                                                <h4 className="text-sm sm:text-base font-medium text-white">Resumo</h4>
                                                <p className="text-xs text-gray-400">Histórico completo de visitas</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs bg-[#1A1F2E] px-3 py-1.5 rounded-full">
                                                <span className="text-gray-400">Total de visitas:</span>
                                                <span className="text-[#F0B35B] font-medium">{clientAppointments.length}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="bg-[#1A1F2E] p-3 rounded-lg">
                                                <p className="text-xs text-gray-400 mb-1">Total gasto</p>
                                                <p className="text-lg font-bold text-green-400">
                                                    R$ {clientAppointments.reduce((sum, app) => sum + app.price, 0).toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="bg-[#1A1F2E] p-3 rounded-lg">
                                                <p className="text-xs text-gray-400 mb-1">Primeira visita</p>
                                                <p className="text-sm font-medium text-white">
                                                    {new Date([...clientAppointments].sort((a, b) => 
                                                        new Date(a.date).getTime() - new Date(b.date).getTime())[0].date
                                                    ).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <div className="bg-[#1A1F2E] p-3 rounded-lg">
                                                <p className="text-xs text-gray-400 mb-1">Última visita</p>
                                                <p className="text-sm font-medium text-white">
                                                    {new Date(clientAppointments[0].date).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <h4 className="text-sm font-medium text-white mt-4 mb-2">Todas as visitas</h4>
                                    <div className="space-y-3">
                                        {clientAppointments.map((app, index) => (
                                            <div 
                                                key={app.id} 
                                                className={`bg-[#0D121E] p-3 rounded-lg border-l-2 ${app.status === 'completed' ? 'border-green-400' : app.status === 'confirmed' ? 'border-blue-400' : 'border-yellow-400'}`}
                                            >
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#1A1F2E]">
                                                            {new Date(app.date).toLocaleDateString('pt-BR')}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#1A1F2E]">
                                                            {app.time}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${app.status === 'completed' ? 'bg-green-400/20 text-green-400' : app.status === 'confirmed' ? 'bg-blue-400/20 text-blue-400' : 'bg-yellow-400/20 text-yellow-400'}`}>
                                                            {app.status === 'completed' ? 'Concluído' : app.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                                                        </span>
                                                        <span className="text-xs font-medium text-green-400">
                                                            R$ {app.price.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-2">
                                                    <p className="text-sm text-white">{app.service}</p>
                                                    <p className="text-xs text-gray-400 mt-1">Barbeiro: {app.barberName}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                    <Users className="h-12 w-12 mb-4 opacity-30" />
                                    <p>Nenhum histórico encontrado para este cliente</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
                <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-[#F0B35B]" />
                    Análise de Clientes
                </h2>
                
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64 min-w-[180px] mb-2 sm:mb-0">
                            <input
                                type="text"
                                placeholder="Nome ou WhatsApp"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-[#0D121E] rounded-lg focus:ring-1 focus:ring-[#F0B35B] outline-none transition-all text-xs sm:text-sm placeholder-gray-500"
                            />
                            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                        </div>

                        <div className="flex gap-1 sm:gap-2 flex-wrap justify-center sm:justify-start">
                            <button
                                onClick={() => setFilterModalOpen(!filterModalOpen)}
                                className="p-4 sm:p-2 rounded-lg bg-[#0D121E] text-gray-400 hover:text-[#F0B35B] transition-colors relative"
                                title="Filtros avançados"
                            >
                                <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                                {(selectedService !== 'all' || spendingRange !== 'all') && (
                                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#F0B35B] rounded-full"></span>
                                )}
                            </button>

                            <button
                                onClick={handleExportData}
                                className="p-4 sm:p-2 rounded-lg bg-[#0D121E] text-gray-400 hover:text-[#F0B35B] transition-colors"
                                title="Exportar dados"
                            >
                                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>

                            <button
                                onClick={toggleViewMode}
                                className="p-4 sm:p-2 rounded-lg bg-[#0D121E] text-gray-400 hover:text-[#F0B35B] transition-colors flex sm:flex"
                                title={viewMode === 'table' ? 'Visualizar como cards' : 'Visualizar como tabela'}
                            >
                                {viewMode === 'table' ? <Layers className="h-3 w-3 sm:h-4 sm:w-4" /> : <Smartphone className="h-3 w-3 sm:h-4 sm:w-4" />}
                            </button>

                            <button
                                onClick={handleRefresh}
                                className="p-4 sm:p-2 rounded-lg bg-[#0D121E] text-gray-400 hover:text-[#F0B35B] transition-colors"
                                disabled={isRefreshing}
                                title="Atualizar dados"
                            >
                                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin text-[#F0B35B]' : ''}`} />
                            </button>
                        </div>

                        {/* Modal de filtros avançados */}
                        {filterModalOpen && (
                            <div
                                ref={filterModalRef}
                                className="absolute right-2 sm:right-4 top-20 sm:top-20 z-10 bg-[#1A1F2E] rounded-lg shadow-xl border border-gray-700 p-3 sm:p-4 w-[250px] sm:w-[320px]"
                            >
                                <div className="flex justify-between items-center mb-2 sm:mb-3">
                                    <h3 className="text-xs sm:text-sm font-medium text-white">Filtros Avançados</h3>
                                    <button
                                        onClick={() => setFilterModalOpen(false)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                <div className="space-y-3 sm:space-y-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Serviço</label>
                                        <select
                                            value={selectedService}
                                            onChange={(e) => setSelectedService(e.target.value)}
                                            className="w-full bg-[#0D121E] text-white text-xs sm:text-sm rounded-md px-2 sm:px-3 py-1.5 sm:py-2 outline-none focus:ring-1 focus:ring-[#F0B35B]"
                                        >
                                            <option value="all">Todos os serviços</option>
                                            {allServices.map((service, index) => (
                                                <option key={index} value={service}>{service}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Faixa de Gastos</label>
                                        <select
                                            value={spendingRange}
                                            onChange={(e) => setSpendingRange(e.target.value as any)}
                                            className="w-full bg-[#0D121E] text-white text-xs sm:text-sm rounded-md px-2 sm:px-3 py-1.5 sm:py-2 outline-none focus:ring-1 focus:ring-[#F0B35B]"
                                        >
                                            <option value="all">Todos os valores</option>
                                            <option value="low">Até R$ 100</option>
                                            <option value="medium">R$ 101 - R$ 300</option>
                                            <option value="high">Acima de R$ 300</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Ordenar por</label>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                            className="w-full bg-[#0D121E] text-white text-xs sm:text-sm rounded-md px-2 sm:px-3 py-1.5 sm:py-2 outline-none focus:ring-1 focus:ring-[#F0B35B]"
                                        >
                                            <option value="visits">Número de visitas</option>
                                            <option value="spent">Total gasto</option>
                                            <option value="recent">Visita mais recente</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
            </div>

            {/* Filtros de período */}
            <div className="grid grid-cols-2 mb-6 gap-1 sm:gap-2 overflow-x-auto pb-2 hide-scrollbar scrollbar-none">
                <button
                    onClick={() => setTimeRange('week')}
                    className={`px-2 sm:px-3 py-2.5 text-xs rounded-md transition-all flex-shrink-0 ${timeRange === 'week' ? 'bg-[#F0B35B] text-black' : 'bg-[#0D121E] text-white hover:bg-[#F0B35B]/20'}`}
                >
                    Última Semana
                </button>
                <button
                    onClick={() => setTimeRange('month')}
                    className={`px-2 sm:px-3 py-2.5 text-xs rounded-md transition-all flex-shrink-0 ${timeRange === 'month' ? 'bg-[#F0B35B] text-black' : 'bg-[#0D121E] text-white hover:bg-[#F0B35B]/20'}`}
                >
                    Último Mês
                </button>
                <button
                    onClick={() => setTimeRange('quarter')}
                    className={`px-2 sm:px-3 py-2.5 text-xs rounded-md transition-all flex-shrink-0 ${timeRange === 'quarter' ? 'bg-[#F0B35B] text-black' : 'bg-[#0D121E] text-white hover:bg-[#F0B35B]/20'}`}
                >
                    Último Trimestre
                </button>
                <button
                    onClick={() => setTimeRange('all')}
                    className={`px-2 sm:px-3 py-2.5 text-xs rounded-md transition-all flex-shrink-0 ${timeRange === 'all' ? 'bg-[#F0B35B] text-black' : 'bg-[#0D121E] text-white hover:bg-[#F0B35B]/20'}`}
                >
                    Todo Período
                </button>
            </div>

            {/* Tabs de navegação */}
            <div className="flex border-b border-gray-700 mb-6 overflow-x-auto scrollbar-none">
                <button
                    onClick={() => setActiveTab('clients')}
                    className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'clients' ? 'text-[#F0B35B] border-b-2 border-[#F0B35B]' : 'text-gray-400 hover:text-white'}`}
                >
                    Clientes
                </button>
                <button
                    onClick={() => setActiveTab('services')}
                    className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'services' ? 'text-[#F0B35B] border-b-2 border-[#F0B35B]' : 'text-gray-400 hover:text-white'}`}
                >
                    Serviços
                </button>
                <button
                    onClick={() => setActiveTab('recurrence')}
                    className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'recurrence' ? 'text-[#F0B35B] border-b-2 border-[#F0B35B]' : 'text-gray-400 hover:text-white'}`}
                >
                    Recorrência
                </button>
                <button
                    onClick={() => setActiveTab('trends')}
                    className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'trends' ? 'text-[#F0B35B] border-b-2 border-[#F0B35B]' : 'text-gray-400 hover:text-white'}`}
                >
                    Tendências
                </button>
            </div>

            {/* Conteúdo da tab selecionada */}
            <div className="min-h-[300px]">
                {activeTab === 'clients' && (
                    <div>
                        {filteredClients.length > 0 ? (
                            <>
                                {/* Visualização em tabela (apenas desktop) */}
                                {viewMode === 'table' && (
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-300">
                                            <thead className="text-xs uppercase bg-[#0D121E] text-gray-400">
                                                <tr>
                                                    <th className="px-4 py-3 rounded-tl-lg">Cliente</th>
                                                    <th className="px-4 py-3">WhatsApp</th>
                                                    <th className="px-4 py-3">Visitas</th>
                                                    <th className="px-4 py-3">Total Gasto</th>
                                                    <th className="px-4 py-3 rounded-tr-lg">Última Visita</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredClients.map((client, index) => (
                                                    <tr
                                                        key={index}
                                                        className="border-b border-gray-700/30 hover:bg-[#0D121E]/50 cursor-pointer"
                                                        onClick={() => handleClientClick(client.name)}
                                                    >
                                                        <td className="px-4 py-3 font-medium">{client.name}</td>
                                                        <td className="px-4 py-3">{client.whatsapp || '-'}</td>
                                                        <td className="px-4 py-3">{client.visits}</td>
                                                        <td className="px-4 py-3 text-green-400">R$ {client.totalSpent.toFixed(2)}</td>
                                                        <td className="px-4 py-3">{new Date(client.lastVisit).toLocaleDateString('pt-BR')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Visualização em cards (mobile e opcional em desktop) */}
                                <div className={`${viewMode === 'cards' ? 'grid' : 'hidden sm:hidden'} grid-cols-1 gap-4`}>
                                    {filteredClients.map((client, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-[#0D121E] p-4 rounded-lg border-l-2 border-[#F0B35B] shadow-sm cursor-pointer hover:bg-[#0D121E]/70 transition-colors"
                                            onClick={() => handleClientClick(client.name)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-medium text-white">{client.name}</h4>
                                                <span className="text-xs bg-[#F0B35B]/20 text-[#F0B35B] px-2 py-1 rounded-full">
                                                    {client.visits} {client.visits === 1 ? 'visita' : 'visitas'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mt-2">
                                                <div>
                                                    <p className="mb-1">WhatsApp:</p>
                                                    <p className="text-white">{client.whatsapp || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="mb-1">Total Gasto:</p>
                                                    <p className="text-green-400">R$ {client.totalSpent.toFixed(2)}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="mb-1">Última Visita:</p>
                                                    <p className="text-white">{new Date(client.lastVisit).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                                <div className="col-span-2 mt-1">
                                                    <p className="mb-1">Serviços Frequentes:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {Object.entries(client.services)
                                                            .sort((a, b) => b[1] - a[1])
                                                            .slice(0, 2)
                                                            .map(([service, count], i) => (
                                                                <span key={i} className="bg-[#1A1F2E] px-2 py-1 rounded text-xs">
                                                                    {service} ({count}x)
                                                                </span>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <Users className="h-12 w-12 mb-4 opacity-30" />
                                <p>Nenhum cliente encontrado com o termo "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'services' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                        <div className="bg-[#0D121E] p-2 sm:p-3 md:p-4 rounded-lg">
                            <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-4 text-center">Serviços Mais Populares</h3>
                            <div className="h-56 sm:h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={popularServicesData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={window.innerWidth < 640 ? 60 : window.innerWidth < 768 ? 70 : 80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => {
                                                // Truncar nomes longos para melhor visualização
                                                const truncatedName = name.length > (window.innerWidth < 640 ? 6 : window.innerWidth < 768 ? 8 : 10) ?
                                                    name.substring(0, window.innerWidth < 640 ? 6 : window.innerWidth < 768 ? 8 : 10) + '...' : name;
                                                // Em dispositivos móveis, mostrar apenas a porcentagem
                                                // Em tablets, mostrar nome muito curto + porcentagem
                                                // Em desktop, mostrar nome truncado + porcentagem
                                                if (window.innerWidth < 640) {
                                                    return `${(percent * 100).toFixed(0)}%`;
                                                } else if (window.innerWidth < 768) {
                                                    return name.length > 8 ? `${(percent * 100).toFixed(0)}%` : `${truncatedName}: ${(percent * 100).toFixed(0)}%`;
                                                } else {
                                                    return `${truncatedName}: ${(percent * 100).toFixed(0)}%`;
                                                }
                                            }}
                                        >
                                            {popularServicesData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name, props) => [`${value} agendamentos`, props.payload.name]}
                                            contentStyle={{
                                                backgroundColor: 'rgba(26,31,46,0.95)',
                                                border: '1px solid rgba(240,179,91,0.5)',
                                                borderRadius: '8px',
                                                padding: window.innerWidth < 640 ? '3px' : window.innerWidth < 768 ? '4px' : '8px',
                                                fontSize: window.innerWidth < 640 ? '10px' : '12px'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-[#0D121E] p-2 sm:p-3 md:p-4 rounded-lg">
                            <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-4 text-center">Frequência por Dia da Semana</h3>
                            <div className="h-56 sm:h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={weekdayFrequencyData}
                                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: window.innerWidth < 640 ? 7 : window.innerWidth < 768 ? 8 : 10, fill: '#fff' }}
                                            tickFormatter={(value) => window.innerWidth < 640 ? value.substring(0, 3) : value}
                                        />
                                        <YAxis
                                            tick={{ fontSize: window.innerWidth < 640 ? 7 : window.innerWidth < 768 ? 8 : 10, fill: '#fff' }}
                                            width={window.innerWidth < 640 ? 25 : window.innerWidth < 768 ? 30 : 40}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(26,31,46,0.95)',
                                                border: '1px solid rgba(240,179,91,0.5)',
                                                borderRadius: '8px',
                                                padding: window.innerWidth < 640 ? '3px' : window.innerWidth < 768 ? '4px' : '8px',
                                                fontSize: window.innerWidth < 640 ? '10px' : '12px'
                                            }}
                                        />
                                        <Bar dataKey="value" fill="#F0B35B" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'recurrence' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                        <div className="bg-[#0D121E] p-2 sm:p-3 md:p-4 rounded-lg">
                            <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-4 text-center">Recorrência de Clientes</h3>
                            <div className="h-56 sm:h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={recurrenceData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={window.innerWidth < 640 ? 60 : window.innerWidth < 768 ? 70 : 80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => {
                                                // Formato mais compacto para evitar overflow
                                                const firstWord = name.split(' ')[0];
                                                // Em dispositivos móveis, mostrar apenas a porcentagem
                                                // Em tablets e desktop, mostrar primeira palavra + porcentagem
                                                if (window.innerWidth < 640) {
                                                    return `${(percent * 100).toFixed(0)}%`;
                                                } else if (window.innerWidth < 768) {
                                                    return `${firstWord}: ${(percent * 100).toFixed(0)}%`;
                                                } else {
                                                    return `${name}: ${(percent * 100).toFixed(0)}%`;
                                                }
                                            }}
                                        >
                                            {recurrenceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => [`${value} clientes`, '']}
                                            contentStyle={{
                                                backgroundColor: 'rgba(26,31,46,0.95)',
                                                border: '1px solid rgba(240,179,91,0.5)',
                                                borderRadius: '8px',
                                                padding: window.innerWidth < 640 ? '3px' : window.innerWidth < 768 ? '4px' : '8px',
                                                fontSize: window.innerWidth < 640 ? '10px' : '12px'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-[#0D121E] p-2 sm:p-3 md:p-4 rounded-lg">
                            <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-4 text-center">Sugestões para Promoções</h3>
                            <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm">
                                {filteredClients.length > 0 ? (
                                    <>
                                        <div className="p-2 sm:p-3 bg-[#1A1F2E] rounded-lg border-l-2 border-[#F0B35B]">
                                            <h4 className="font-medium text-white text-xs sm:text-sm">Clientes Fiéis</h4>
                                            <p className="text-gray-400 mt-1 text-xs sm:text-sm">
                                                {filteredClients.filter(c => c.visits >= 3).length} clientes visitaram 3+ vezes.
                                                Considere um programa de fidelidade com desconto progressivo.
                                            </p>
                                        </div>

                                        <div className="p-2 sm:p-3 bg-[#1A1F2E] rounded-lg border-l-2 border-green-400">
                                            <h4 className="font-medium text-white text-xs sm:text-sm">Dia Menos Movimentado</h4>
                                            <p className="text-gray-400 mt-1 text-xs sm:text-sm">
                                                {weekdayFrequencyData.sort((a, b) => a.value - b.value)[0]?.name} é o dia menos movimentado.
                                                Considere promoções especiais neste dia.
                                            </p>
                                        </div>

                                        <div className="p-2 sm:p-3 bg-[#1A1F2E] rounded-lg border-l-2 border-blue-400">
                                            <h4 className="font-medium text-white text-xs sm:text-sm">Serviço para Promover</h4>
                                            <p className="text-gray-400 mt-1 text-xs sm:text-sm">
                                                {popularServicesData.length > 0 &&
                                                    `"${popularServicesData[popularServicesData.length - 1]?.name}" é o menos popular. `}
                                                Considere um pacote promocional incluindo este serviço.
                                            </p>
                                        </div>

                                        <div className="p-2 sm:p-3 bg-[#1A1F2E] rounded-lg border-l-2 border-purple-400">
                                            <h4 className="font-medium text-white text-xs sm:text-sm">Recuperação de Clientes</h4>
                                            <p className="text-gray-400 mt-1 text-xs sm:text-sm">
                                                {filteredClients.filter(c => {
                                                    const lastVisit = new Date(c.lastVisit);
                                                    const threeMonthsAgo = new Date();
                                                    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                                                    return lastVisit < threeMonthsAgo;
                                                }).length} clientes não retornam há mais de 3 meses.
                                                Envie mensagens personalizadas com ofertas exclusivas.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                        <BarChart2 className="h-8 w-8 sm:h-10 sm:w-10 mb-2 sm:mb-3 opacity-30" />
                                        <p className="text-xs sm:text-sm">Sem dados suficientes para gerar sugestões</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Nova aba de tendências */}
                {activeTab === 'trends' && (
                    <div className="grid grid-cols-1 gap-3 sm:gap-6">
                        <div className="bg-[#0D121E] p-2 sm:p-3 md:p-4 rounded-lg">
                            <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-4 text-center">Tendências das Últimas 12 Semanas</h3>
                            <div className="h-56 sm:h-64 md:h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={trendsData}
                                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
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
                                            width={window.innerWidth < 640 ? 25 : window.innerWidth < 768 ? 30 : 40}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            stroke="#00C49F"
                                            tick={{ fontSize: window.innerWidth < 640 ? 7 : window.innerWidth < 768 ? 8 : 10, fill: '#fff' }}
                                            width={window.innerWidth < 640 ? 25 : window.innerWidth < 768 ? 30 : 40}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(26,31,46,0.95)',
                                                border: '1px solid rgba(240,179,91,0.5)',
                                                borderRadius: '8px',
                                                padding: window.innerWidth < 640 ? '3px' : window.innerWidth < 768 ? '4px' : '8px',
                                                fontSize: window.innerWidth < 640 ? '10px' : '12px'
                                            }}
                                        />
                                        <Legend
                                            wrapperStyle={{
                                                fontSize: window.innerWidth < 640 ? '10px' : '12px',
                                                paddingTop: window.innerWidth < 640 ? '5px' : '10px'
                                            }}
                                        />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="clientes"
                                            name="Clientes"
                                            stroke="#F0B35B"
                                            activeDot={{ r: window.innerWidth < 640 ? 4 : window.innerWidth < 768 ? 6 : 8 }}
                                            strokeWidth={window.innerWidth < 640 ? 1.5 : 2}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="receita"
                                            name="Receita (R$)"
                                            stroke="#00C49F"
                                            strokeWidth={window.innerWidth < 640 ? 1.5 : 2}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-4 mb-3 sm:mb-6">
                            <div className="bg-[#0D121E] p-2 sm:p-4 rounded-lg">
                                <h3 className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 mb-1 sm:mb-2 text-center">Ticket Médio</h3>
                                <div className="flex flex-col items-center justify-center h-16 sm:h-20 md:h-24">
                                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-400 mb-1" />
                                    <p className="text-base sm:text-lg md:text-2xl font-bold text-white">
                                        R$ {(clientsData.reduce((sum, client) => sum + client.totalSpent, 0) / clientsData.length || 0).toFixed(2)}
                                    </p>
                                    <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-400">por cliente</p>
                                </div>
                            </div>

                            <div className="bg-[#0D121E] p-2 sm:p-4 rounded-lg">
                                <h3 className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 mb-1 sm:mb-2 text-center">Clientes Recorrentes</h3>
                                <div className="flex flex-col items-center justify-center h-16 sm:h-20 md:h-24">
                                    <Award className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#F0B35B] mb-1" />
                                    <p className="text-base sm:text-lg md:text-2xl font-bold text-white">
                                        {clientsData.filter(client => client.visits > 1).length}
                                    </p>
                                    <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-400">retornaram</p>
                                </div>
                            </div>

                            <div className="bg-[#0D121E] p-2 sm:p-4 rounded-lg">
                                <h3 className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 mb-1 sm:mb-2 text-center">Serviços/Cliente</h3>
                                <div className="flex flex-col items-center justify-center h-16 sm:h-20 md:h-24">
                                    <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-400 mb-1" />
                                    <p className="text-base sm:text-lg md:text-2xl font-bold text-white">
                                        {(clientsData.reduce((sum, client) => sum + Object.keys(client.services).length, 0) / clientsData.length || 0).toFixed(1)}
                                    </p>
                                    <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-400">média</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientAnalytics;