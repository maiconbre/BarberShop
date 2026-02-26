import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCog, Plus, Trash2, Edit, RefreshCw, Crown } from 'lucide-react';
import StandardLayout from '../components/layout/StandardLayout';
import { useBarbers } from '../hooks/useBarbers';
import { usePlanLimits } from '../hooks/usePlanLimits';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { useTenant } from '../contexts/TenantContext';

// Interface simplificada para criação de barbeiro localmente
interface NewBarberData {
    name: string;
    email: string;
    phone: string;
    pix: string;
    isActive: boolean;
}

const BarberManagementPage: React.FC = () => {
    const {
        barbers,
        loadBarbers,
        createBarber,
        updateBarber,
        deleteBarber,
        loading: barbersLoading,
        creating,
        updating,
        deleting
    } = useBarbers();

    const { isValidTenant } = useTenant();
    const { canAddBarber, getBarberLimitMessage, planType } = usePlanLimits();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [currentBarber, setCurrentBarber] = useState<any>(null); // Usando any por enquanto para simplificar
    const [formData, setFormData] = useState<NewBarberData>({
        name: '',
        email: '',
        phone: '',
        pix: '',
        isActive: true
    });

    useEffect(() => {
        if (isValidTenant) {
            loadBarbers();
        }
    }, [isValidTenant, loadBarbers]);

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            pix: '',
            isActive: true
        });
        setCurrentBarber(null);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canAddBarber) {
            toast.error(getBarberLimitMessage() || 'Limite atingido');
            return;
        }

        try {
            // Default working hours (9 to 18, Mon-Sat)
            const defaultWorkingHours = {
                monday: [{ start: '09:00', end: '18:00' }],
                tuesday: [{ start: '09:00', end: '18:00' }],
                wednesday: [{ start: '09:00', end: '18:00' }],
                thursday: [{ start: '09:00', end: '18:00' }],
                friday: [{ start: '09:00', end: '18:00' }],
                saturday: [{ start: '09:00', end: '14:00' }],
                sunday: []
            };

            await createBarber({
                ...formData,
                specialties: [], // MVP: Especialidades vazias por enquanto
                workingHours: defaultWorkingHours
            });
            toast.success('Barbeiro adicionado com sucesso!');
            setIsCreateModalOpen(false);
            resetForm();
        } catch (error) {
            toast.error('Erro ao criar barbeiro.');
            console.error(error);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentBarber) return;

        try {
            await updateBarber(currentBarber.id, {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                pix: formData.pix,
                isActive: formData.isActive
            });
            toast.success('Barbeiro atualizado com sucesso!');
            setIsEditModalOpen(false);
            resetForm();
        } catch (error) {
            toast.error('Erro ao atualizar barbeiro.');
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (!currentBarber) return;

        // Impedir exclusão se for o único barbeiro
        if (barbers && barbers.length <= 1) {
            toast.error('Não é possível remover o último profissional da barbearia.');
            return;
        }

        try {
            await deleteBarber(currentBarber.id);
            toast.success('Barbeiro removido com sucesso!');
            setIsDeleteModalOpen(false);
            setCurrentBarber(null);
        } catch (error) {
            toast.error('Erro ao remover barbeiro.');
            console.error(error);
        }
    };

    const openEditModal = (barber: any) => {
        setCurrentBarber(barber);
        setFormData({
            name: barber.name,
            email: barber.email || '',
            phone: barber.phone || barber.whatsapp || '',
            pix: barber.pix || '',
            isActive: barber.isActive
        });
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (barber: any) => {
        setCurrentBarber(barber);
        setIsDeleteModalOpen(true);
    };

    return (
        <StandardLayout
            title="Gerenciar Equipe"
            subtitle="Adicione e gerencie os profissionais da sua barbearia"
            icon={<UserCog className="w-5 h-5 text-[#F0B35B]" />}
        >
            <div className="space-y-6">

                {/* Banner de Limites */}
                {!canAddBarber && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/20 rounded-lg">
                                <Crown className="w-5 h-5 text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-medium">Limite de Equipe Atingido</h3>
                                <p className="text-sm text-gray-400">{getBarberLimitMessage()}</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors text-sm">
                            Fazer Upgrade
                        </button>
                    </motion.div>
                )}

                {/* Header e Ações */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <UserCog className="w-6 h-6 text-[#F0B35B]" />
                            Profissionais ({barbers?.length || 0})
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Plano atual: <span className="text-[#F0B35B] uppercase font-bold">{planType}</span>
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        disabled={!canAddBarber}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${canAddBarber
                            ? 'bg-[#F0B35B] text-black hover:bg-[#E6A555] hover:shadow-lg hover:shadow-[#F0B35B]/20 transform hover:-translate-y-0.5'
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'
                            }`}
                    >
                        <Plus className="w-5 h-5" />
                        Adicionar Barbeiro
                    </button>
                </div>

                {/* Lista de Barbeiros (Grid) */}
                {barbersLoading ? (
                    <div className="flex justify-center p-12">
                        <RefreshCw className="animate-spin w-8 h-8 text-[#F0B35B]" />
                    </div>
                ) : !barbers || barbers.length === 0 ? (
                    <div className="text-center py-16 bg-surface/30 rounded-2xl border border-white/5">
                        <UserCog className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white">Nenhum profissional encontrado</h3>
                        <p className="text-gray-500 mt-2">Adicione o primeiro barbeiro para começar.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {barbers.map((barber) => (
                            <motion.div
                                key={barber.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ y: -4 }}
                                className="bg-surface/50 backdrop-blur-sm border border-white/5 rounded-2xl p-5 hover:border-[#F0B35B]/30 transition-all duration-300 shadow-lg group relative overflow-hidden"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] border border-white/10 flex items-center justify-center">
                                            {barber.profileImage ? (
                                                <img src={barber.profileImage} alt={barber.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <span className="text-xl font-bold text-[#F0B35B]">{barber.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-lg leading-tight">{barber.name}</h3>
                                            <p className="text-gray-400 text-xs">{barber.email || 'Sem email'}</p>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${barber.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                        {barber.isActive ? 'Ativo' : 'Inativo'}
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Crown className="w-3 h-3 text-[#F0B35B]" />
                                        <span>Especialidades: {barber.specialties?.length || 0}</span>
                                    </div>
                                    {barber.pix && (
                                        <div className="flex items-center gap-2 text-xs text-green-400/80">
                                            <div className="w-3 h-3 rounded-full bg-green-400/20 flex items-center justify-center text-[8px] font-bold">$</div>
                                            <span>PIX Configurado</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => openEditModal(barber)}
                                        className="flex-1 py-2 bg-[#1A1F2E] hover:bg-[#252B3B] text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => openDeleteModal(barber)}
                                        disabled={barbers.length <= 1}
                                        className={`p-2 rounded-lg transition-colors ${barbers.length <= 1
                                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                                            }`}
                                        title={barbers.length <= 1 ? "Não é possível remover o último profissional" : "Remover"}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

            </div>

            {/* Modal - Criar */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1A1F2E] w-full max-w-md rounded-2xl border border-[#F0B35B]/20 shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Novo Profissional</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white"><div className="w-6 h-6">X</div></button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-[#0D121E] border border-white/10 rounded-lg p-3 text-white focus:border-[#F0B35B] outline-none transition-colors"
                                    placeholder="Ex: João Silva"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Email <span className="text-gray-600">(Opcional)</span></label>
                                <input
                                    type="email"
                                    className="w-full bg-[#0D121E] border border-white/10 rounded-lg p-3 text-white focus:border-[#F0B35B] outline-none transition-colors"
                                    placeholder="joao@exemplo.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Telefone <span className="text-gray-600">(Opcional)</span></label>
                                <input
                                    type="tel"
                                    className="w-full bg-[#0D121E] border border-white/10 rounded-lg p-3 text-white focus:border-[#F0B35B] outline-none transition-colors"
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Chave PIX <span className="text-gray-600">(Opcional)</span></label>
                                <input
                                    type="text"
                                    className="w-full bg-[#0D121E] border border-white/10 rounded-lg p-3 text-white focus:border-[#F0B35B] outline-none transition-colors"
                                    placeholder="CPF, Email ou Chave Aleatória"
                                    value={formData.pix}
                                    onChange={e => setFormData({ ...formData, pix: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-3 bg-[#F0B35B] hover:bg-[#E6A555] text-black rounded-xl font-bold transition-all flex justify-center items-center gap-2"
                                >
                                    {creating ? <RefreshCw className="animate-spin w-5 h-5" /> : 'Cadastrar'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Modal - Editar */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1A1F2E] w-full max-w-md rounded-2xl border border-[#F0B35B]/20 shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Editar Profissional</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white">X</button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-[#0D121E] border border-white/10 rounded-lg p-3 text-white focus:border-[#F0B35B] outline-none transition-colors"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full bg-[#0D121E] border border-white/10 rounded-lg p-3 text-white focus:border-[#F0B35B] outline-none transition-colors"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">WhatsApp</label>
                                <input
                                    type="tel"
                                    className="w-full bg-[#0D121E] border border-white/10 rounded-lg p-3 text-white focus:border-[#F0B35B] outline-none transition-colors"
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Chave PIX</label>
                                <input
                                    type="text"
                                    className="w-full bg-[#0D121E] border border-white/10 rounded-lg p-3 text-white focus:border-[#F0B35B] outline-none transition-colors"
                                    placeholder="CPF, Email, Celular ou Chave Aleatória"
                                    value={formData.pix}
                                    onChange={e => setFormData({ ...formData, pix: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-600 text-[#F0B35B] focus:ring-[#F0B35B]"
                                />
                                <label htmlFor="isActive" className="text-white select-none cursor-pointer">Profissional Ativo</label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="flex-1 py-3 bg-[#F0B35B] hover:bg-[#E6A555] text-black rounded-xl font-bold transition-all flex justify-center items-center gap-2"
                                >
                                    {updating ? <RefreshCw className="animate-spin w-5 h-5" /> : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Remover Profissional?"
                message={`Tem certeza que deseja remover ${currentBarber?.name}? Essa ação não pode ser desfeita e pode afetar agendamentos históricos.`}
                confirmButtonText="Sim, remover"
                cancelButtonText="Cancelar"
                isLoading={deleting}
            />

        </StandardLayout>
    );
};

export default BarberManagementPage;
