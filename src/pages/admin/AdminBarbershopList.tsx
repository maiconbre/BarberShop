import React, { useEffect, useState } from 'react';
import { Search, Filter, Crown, AlertCircle, CheckCircle, Eye, Edit } from 'lucide-react';
import { AdminService } from '../../services/AdminService';
import { PlanType, PLAN_CONFIGS } from '../../config/plans';

interface Barbershop {
    id: string;
    name: string;
    slug: string;
    ownerEmail: string;
    planType: string;
    planStatus: string;
    createdAt: string;
    updatedAt: string;
}

const AdminBarbershopList: React.FC = () => {
    const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPlan, setFilterPlan] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    useEffect(() => {
        loadBarbershops();
    }, [filterPlan, filterStatus]);

    const loadBarbershops = async () => {
        try {
            setLoading(true);
            const data = await AdminService.listAllBarbershops({
                planType: filterPlan || undefined,
                planStatus: filterStatus || undefined,
                search: searchTerm || undefined
            });
            setBarbershops(data);
        } catch (error) {
            console.error('Erro ao carregar barbearias:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        loadBarbershops();
    };

    const getPlanBadge = (planType: string) => {
        const colors = {
            free: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
            pro: 'bg-[#F0B35B]/20 text-[#F0B35B] border-[#F0B35B]/30',
            enterprise: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        };

        const labels = {
            free: 'Gratuito',
            pro: 'Pro',
            enterprise: 'Enterprise'
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[planType as keyof typeof colors]}`}>
                {planType === 'pro' || planType === 'enterprise' ? <Crown className="w-3 h-3 inline mr-1" /> : null}
                {labels[planType as keyof typeof labels]}
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            active: 'bg-green-500/20 text-green-300 border-green-500/30',
            trial: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
            suspended: 'bg-red-500/20 text-red-300 border-red-500/30',
            cancelled: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
        };

        const labels = {
            active: 'Ativo',
            trial: 'Trial',
            suspended: 'Suspenso',
            cancelled: 'Cancelado'
        };

        const icons = {
            active: <CheckCircle className="w-3 h-3 inline mr-1" />,
            trial: <AlertCircle className="w-3 h-3 inline mr-1" />,
            suspended: <AlertCircle className="w-3 h-3 inline mr-1" />,
            cancelled: <AlertCircle className="w-3 h-3 inline mr-1" />
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[status as keyof typeof colors]}`}>
                {icons[status as keyof typeof icons]}
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-[#0D121E] p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Gerenciar Barbearias
                </h1>
                <p className="text-gray-400">
                    {barbershops.length} barbearias cadastradas
                </p>
            </div>

            {/* Filtros */}
            <div className="bg-[#1A1F2E] rounded-lg p-6 border border-gray-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Busca */}
                    <div className="md:col-span-2">
                        <label className="block text-gray-400 text-sm mb-2">Buscar</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Nome, slug ou email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-10 pr-4 py-2 bg-[#0D121E] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B]"
                            />
                        </div>
                    </div>

                    {/* Filtro de Plano */}
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Plano</label>
                        <select
                            value={filterPlan}
                            onChange={(e) => setFilterPlan(e.target.value)}
                            className="w-full px-4 py-2 bg-[#0D121E] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B]"
                        >
                            <option value="">Todos</option>
                            <option value="free">Gratuito</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>

                    {/* Filtro de Status */}
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-2 bg-[#0D121E] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B]"
                        >
                            <option value="">Todos</option>
                            <option value="active">Ativo</option>
                            <option value="trial">Trial</option>
                            <option value="suspended">Suspenso</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-[#1A1F2E] rounded-lg border border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">
                        Carregando barbearias...
                    </div>
                ) : barbershops.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        Nenhuma barbearia encontrada
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#0D121E] border-b border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Barbearia
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Owner
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Plano
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Criado em
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {barbershops.map((shop) => (
                                    <tr key={shop.id} className="hover:bg-[#0D121E] transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-white font-semibold">{shop.name}</div>
                                                <div className="text-gray-400 text-sm">/{shop.slug}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-300 text-sm">{shop.ownerEmail}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getPlanBadge(shop.planType)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(shop.planStatus)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-300 text-sm">{formatDate(shop.createdAt)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button className="p-2 text-gray-400 hover:text-[#F0B35B] transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-[#F0B35B] transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBarbershopList;
