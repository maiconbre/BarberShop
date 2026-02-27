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
            hideMobileHeader={true}
            title="Equipe"
            subtitle="Gerencie os profissionais da sua barbearia"
            icon={<UserCog className="w-5 h-5 text-[#F0B35B]" />}
        >
            <div className="space-y-6">

                {/* Banner de Limites */}
                {!canAddBarber && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-[#F0B35B]/10 to-orange-500/10 border border-[#F0B35B]/20 rounded-[2rem] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-[#F0B35B] to-orange-500 rounded-2xl shadow-[0_0_15px_rgba(240,179,91,0.3)]">
                                <Crown className="w-6 h-6 text-black" />
                            </div>
                            <div>
                                <h3 className="text-white font-black italic tracking-tight uppercase text-sm">Limite de Equipe Atingido</h3>
                                <p className="text-xs text-gray-400 font-medium">{getBarberLimitMessage()}</p>
                            </div>
                        </div>
                        <button className="w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/10 text-[#F0B35B] font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#F0B35B] hover:text-black transition-all shadow-lg">
                            Fazer Upgrade
                        </button>
                    </motion.div>
                )}

                {/* Header e Ações */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#1A1F2E]/40 p-6 rounded-[2.3rem] border border-white/5 shadow-xl">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-white flex items-center gap-3 italic tracking-tight">
                            {barbers?.length || 0} Especialistas
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Plano:</span>
                            <span className="text-[10px] text-[#F0B35B] font-black uppercase tracking-widest bg-[#F0B35B]/10 px-2 py-0.5 rounded-full border border-[#F0B35B]/20">{planType}</span>
                        </div>
                    </div>

                    <motion.button
                        onClick={() => setIsCreateModalOpen(true)}
                        disabled={!canAddBarber}
                        whileHover={canAddBarber ? { scale: 1.02 } : {}}
                        whileTap={canAddBarber ? { scale: 0.98 } : {}}
                        className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${canAddBarber
                            ? 'bg-gradient-to-r from-[#F0B35B] to-orange-500 text-black shadow-[0_0_20px_rgba(240,179,91,0.2)]'
                            : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                            }`}
                    >
                        <Plus className="w-5 h-5 stroke-[3px]" />
                        Novo Pro
                    </motion.button>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {barbers.map((barber, index) => (
                            <motion.div
                                key={barber.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -8 }}
                                className="bg-[#1A1F2E]/40 border border-white/5 rounded-[2.5rem] p-6 hover:border-[#F0B35B]/30 transition-all duration-500 shadow-2xl group relative overflow-hidden flex flex-col items-center text-center"
                            >
                                {/* Removed shine effect */}

                                <div className="relative mb-6">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1A1F2E] to-black p-1 shadow-2xl relative">
                                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/5 flex items-center justify-center bg-black/40">
                                            {barber.profileImage ? (
                                                <img src={barber.profileImage} alt={barber.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-3xl font-black text-[#F0B35B] italic">{barber.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-[#121621] ${barber.isActive ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                                    </div>
                                </div>

                                <div className="space-y-1 mb-6">
                                    <h3 className="text-xl font-black text-white italic tracking-tighter group-hover:text-[#F0B35B] transition-colors line-clamp-1 uppercase">
                                        {barber.name}
                                    </h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest line-clamp-1 px-4">{barber.email || 'Sem email'}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 w-full mb-6">
                                    <div className="bg-black/20 p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                                        <Crown className="w-3 h-3 text-[#F0B35B] mb-1 opacity-60" />
                                        <span className="text-[8px] text-gray-500 font-black uppercase tracking-tighter">Specs</span>
                                        <span className="text-sm font-black text-white italic">{barber.specialties?.length || 0}</span>
                                    </div>
                                    <div className="bg-black/20 p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full mb-1 ${barber.pix ? 'bg-green-500/40 text-green-400' : 'bg-red-500/40 text-red-400'} flex items-center justify-center text-[8px] font-black`}>$</div>
                                        <span className="text-[8px] text-gray-500 font-black uppercase tracking-tighter">Finance</span>
                                        <span className={`text-[9px] font-black italic uppercase ${barber.pix ? 'text-green-400' : 'text-red-400'}`}>{barber.pix ? 'Ativo' : 'Pendente'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full mt-auto">
                                    <motion.button
                                        onClick={() => openEditModal(barber)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex-1 py-3 bg-white/5 hover:bg-[#F0B35B]/10 text-gray-400 hover:text-[#F0B35B] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/5 hover:border-[#F0B35B]/20"
                                    >
                                        <Edit className="w-3 h-3 stroke-[3px]" />
                                        Editar
                                    </motion.button>
                                    <motion.button
                                        onClick={() => openDeleteModal(barber)}
                                        disabled={barbers.length <= 1}
                                        whileHover={barbers.length > 1 ? { scale: 1.1, rotate: -5 } : {}}
                                        whileTap={barbers.length > 1 ? { scale: 0.9 } : {}}
                                        className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all border ${barbers.length <= 1
                                            ? 'bg-transparent border-white/5 text-gray-700 cursor-not-allowed'
                                            : 'bg-white/5 hover:bg-red-500/10 text-red-500/60 hover:text-red-500 border-white/5 hover:border-red-500/20 shadow-lg'
                                            }`}
                                    >
                                        <Trash2 className="w-4 h-4 stroke-[2.5px]" />
                                    </motion.button>
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
