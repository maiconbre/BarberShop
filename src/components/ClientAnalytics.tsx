import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Users, RefreshCw, Filter, Layers, Smartphone, X } from 'lucide-react';

// Função para formatar número de WhatsApp no padrão (xx)xxxxx-xxxx
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
    createdAt?: string;
    updatedAt?: string;
    viewed?: boolean;
    isBlocked?: boolean;
}

interface ClientAnalyticsProps {
    appointments: Appointment[];
}

const ClientAnalytics: React.FC<ClientAnalyticsProps> = ({ appointments }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState<'all' | 'month' | 'week'>('month');
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [spendingRange, setSpendingRange] = useState<'all' | 'low' | 'medium' | 'high'>('all');
    const [sortBy, setSortBy] = useState<'visits' | 'spent' | 'recent'>('visits');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [clientAppointments, setClientAppointments] = useState<Appointment[]>([]);
    const [showClientHistory, setShowClientHistory] = useState(false);
    const [frequencyFilter, setFrequencyFilter] = useState<'all' | 'regular' | 'occasional' | 'new'>('all');
    const [serviceFilter, setServiceFilter] = useState<string>('all');
    const [dateSort, setDateSort] = useState<'asc' | 'desc'>('desc');
    const filterModalRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setViewMode('cards');
            } else {
                setViewMode('table');
            }
        };

        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const clientsData = useMemo(() => {
        const clientMap = new Map<string, any>();

        // Filtrar agendamentos bloqueados antes de processar
        const nonBlockedAppointments = appointments.filter(app => !app.isBlocked);

        const filteredAppointments = nonBlockedAppointments.filter(app => {
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
    }, [appointments, timeRange]);

    const uniqueServices = useMemo(() => {
        const services = new Set<string>();
        appointments.forEach(app => {
            app.service.split(',').forEach(s => services.add(s.trim()));
        });
        return Array.from(services);
    }, [appointments]);

    const getClientFrequency = (visits: number, firstVisitDate: string): 'regular' | 'occasional' | 'new' => {
        const daysSinceFirst = Math.floor((Date.now() - new Date(firstVisitDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceFirst <= 30) return 'new';
        const visitsPerMonth = (visits / daysSinceFirst) * 30;
        return visitsPerMonth >= 1 ? 'regular' : 'occasional';
    };

    const filteredClients = useMemo(() => {
        let filtered = clientsData;

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(client =>
                client.name.toLowerCase().includes(term) ||
                (client.whatsapp && client.whatsapp.includes(term))
            );
        }

        if (spendingRange !== 'all') {
            filtered = filtered.filter(client => {
                if (spendingRange === 'low' && client.totalSpent <= 100) return true;
                if (spendingRange === 'medium' && client.totalSpent > 100 && client.totalSpent <= 300) return true;
                if (spendingRange === 'high' && client.totalSpent > 300) return true;
                return false;
            });
        }

        if (frequencyFilter !== 'all') {
            filtered = filtered.filter(client => {
                const frequency = getClientFrequency(client.visits, client.appointmentDates[0]);
                return frequency === frequencyFilter;
            });
        }

        if (serviceFilter !== 'all') {
            filtered = filtered.filter(client =>
                client.services[serviceFilter] && client.services[serviceFilter] > 0
            );
        }

        if (dateSort === 'asc') {
            filtered.sort((a, b) => new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime());
        }

        return filtered.sort((a, b) => {
            if (sortBy === 'visits') return b.visits - a.visits;
            if (sortBy === 'spent') return b.totalSpent - a.totalSpent;
            if (sortBy === 'recent') return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
            return 0;
        });
    }, [clientsData, searchTerm, spendingRange, sortBy, frequencyFilter, serviceFilter, dateSort]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const toggleViewMode = () => {
        setViewMode(viewMode === 'table' ? 'cards' : 'table');
    };

    const handleClientClick = (clientName: string, clientWhatsapp?: string) => {
        const clientApps = clientWhatsapp
            ? appointments.filter(app => (app.wppclient || app.clientWhatsapp) === clientWhatsapp)
            : appointments.filter(app => app.clientName.toLowerCase() === clientName.toLowerCase());

        clientApps.sort((a, b) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        setSelectedClient(clientName);
        setClientAppointments(clientApps);
        setShowClientHistory(true);
    };

    const closeClientHistory = () => {
        setShowClientHistory(false);
        setSelectedClient(null);
    };

    const renderMetrics = (client: any) => {
        const visitFrequency = getClientFrequency(client.visits, client.appointmentDates[0]);
        const avgSpentPerVisit = client.totalSpent / client.visits;

        return (
            <div className="grid grid-cols-2 gap-2 mt-3 bg-[#0D121E]/50 p-2 rounded-lg">
                <div className="text-xs">
                    <span className="text-gray-400">Frequência: </span>
                    <span className={`
                        ${visitFrequency === 'regular' ? 'text-green-400' : ''}
                        ${visitFrequency === 'occasional' ? 'text-yellow-400' : ''}
                        ${visitFrequency === 'new' ? 'text-blue-400' : ''}
                    `}>
                        {visitFrequency === 'regular' ? 'Regular' :
                            visitFrequency === 'occasional' ? 'Ocasional' : 'Novo'}
                    </span>
                </div>
                <div className="text-xs">
                    <span className="text-gray-400">Média/Visita: </span>
                    <span className="text-green-400">R$ {avgSpentPerVisit.toFixed(2)}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg p-4 sm:p-6 mb-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
                <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-[#F0B35B]" />
                    Histórico de Clientes
                </h2>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64 min-w-[180px]">
                        <input
                            type="text"
                            placeholder="Nome ou WhatsApp"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 sm:pl-10 pr-3 py-2 bg-[#0D121E] rounded-lg focus:ring-1 focus:ring-[#F0B35B] outline-none transition-all"
                        />
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterModalOpen(!filterModalOpen)}
                            className="p-2 rounded-lg bg-[#0D121E] text-gray-400 hover:text-[#F0B35B] transition-colors"
                        >
                            <Filter className="h-4 w-4" />
                        </button>

                        <button
                            onClick={toggleViewMode}
                            className="p-2 rounded-lg bg-[#0D121E] text-gray-400 hover:text-[#F0B35B] transition-colors"
                        >
                            {viewMode === 'table' ? <Layers className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                        </button>

                        <button
                            onClick={handleRefresh}
                            className="p-2 rounded-lg bg-[#0D121E] text-gray-400 hover:text-[#F0B35B] transition-colors"
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#F0B35B]' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                <select
                    value={frequencyFilter}
                    onChange={(e) => setFrequencyFilter(e.target.value as any)}
                    className="bg-[#0D121E] text-white text-xs rounded-full px-3 py-1.5"
                >
                    <option value="all">Todas frequências</option>
                    <option value="regular">Clientes regulares</option>
                    <option value="occasional">Clientes ocasionais</option>
                    <option value="new">Novos clientes</option>
                </select>

                <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="bg-[#0D121E] text-white text-xs rounded-full px-3 py-1.5"
                >
                    <option value="all">Todos serviços</option>
                    {uniqueServices.map(service => (
                        <option key={service} value={service}>{service}</option>
                    ))}
                </select>
            </div>

            <div className="flex mb-6 gap-2">
                <button
                    onClick={() => setTimeRange('week')}
                    className={`px-3 py-1.5 text-xs rounded-full transition-all ${timeRange === 'week' ? 'bg-[#F0B35B] text-black' : 'bg-[#0D121E] text-white hover:bg-[#F0B35B]/20'}`}
                >
                    Última Semana
                </button>
                <button
                    onClick={() => setTimeRange('month')}
                    className={`px-3 py-1.5 text-xs rounded-full transition-all ${timeRange === 'month' ? 'bg-[#F0B35B] text-black' : 'bg-[#0D121E] text-white hover:bg-[#F0B35B]/20'}`}
                >
                    Último Mês
                </button>
                <button
                    onClick={() => setTimeRange('all')}
                    className={`px-3 py-1.5 text-xs rounded-full transition-all ${timeRange === 'all' ? 'bg-[#F0B35B] text-black' : 'bg-[#0D121E] text-white hover:bg-[#F0B35B]/20'}`}
                >
                    Todo Período
                </button>
            </div>

            <div className="min-h-[300px]">
                {filteredClients.length > 0 ? (
                    <>
                        {viewMode === 'table' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-300">
                                    <thead className="text-xs uppercase bg-[#0D121E] text-gray-400">
                                        <tr>
                                            <th className="px-2 sm:px-4 py-2 sm:py-3 rounded-tl-lg">Cliente</th>
                                            <th className="hidden sm:table-cell px-4 py-3">WhatsApp</th>
                                            <th className="px-2 sm:px-4 py-2 sm:py-3">Visitas</th>
                                            <th className="px-2 sm:px-4 py-2 sm:py-3">Total</th>
                                            <th className="hidden sm:table-cell px-4 py-3 rounded-tr-lg">Última Visita</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredClients.map((client, index) => (
                                            <tr
                                                key={index}
                                                className="border-b border-gray-700/30 hover:bg-[#0D121E]/50 cursor-pointer"
                                                onClick={() => handleClientClick(client.name, client.whatsapp)}
                                            >
                                                <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium">
                                                    <div>
                                                        {client.name}
                                                        <div className="sm:hidden text-xs text-gray-400">
                                                            {formatWhatsApp(client.whatsapp)}
                                                        </div>
                                                        <div className="sm:hidden text-xs text-gray-400">
                                                            {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell px-4 py-3">{formatWhatsApp(client.whatsapp)}</td>
                                                <td className="px-2 sm:px-4 py-2 sm:py-3">{client.visits}</td>
                                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-green-400">R$ {client.totalSpent.toFixed(2)}</td>
                                                <td className="hidden sm:table-cell px-4 py-3">{new Date(client.lastVisit).toLocaleDateString('pt-BR')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className={`${viewMode === 'cards' ? 'grid' : 'hidden sm:hidden'} grid-cols-1 gap-4`}>
                            {filteredClients.map((client, index) => (
                                <div
                                    key={index}
                                    className="bg-[#0D121E] p-4 rounded-lg border-l-2 border-[#F0B35B] shadow-sm cursor-pointer hover:bg-[#0D121E]/70 transition-colors"
                                    onClick={() => handleClientClick(client.name, client.whatsapp)}
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
                                            <p className="text-white">{formatWhatsApp(client.whatsapp)}</p>
                                        </div>
                                        <div>
                                            <p className="mb-1">Total Gasto:</p>
                                            <p className="text-green-400">R$ {client.totalSpent.toFixed(2)}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="mb-1">Última Visita:</p>
                                            <p className="text-white">{new Date(client.lastVisit).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>

                                    {renderMetrics(client)}
                                </div>
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
                                        {clientAppointments.map((app) => (
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
    );
};

export default ClientAnalytics;