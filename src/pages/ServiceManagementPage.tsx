import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Edit, Trash2, RefreshCw, Users, X, Plus, Package, DollarSign, Clock } from 'lucide-react';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { useServices } from '../hooks/useServices';
import { useBarbers } from '../hooks/useBarbers';
import { useTenant } from '../contexts/TenantContext';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';
import StandardLayout from '../components/layout/StandardLayout';
import { safeFixed } from '../utils/numberUtils';
import { TenantDebugger } from '../components/debug/TenantDebugger';

interface Service {
  id: string;
  name: string;
  price: number;
  description?: string;
  duration?: number;
  barbers?: string[];
  isActive?: boolean;
}

const ServiceManagementPage: React.FC = () => {
  const {
    services,
    loadServices,
    createService,
    updateService,
    deleteService,
    associateBarbers,
    loading,
    creating,
    updating,
    deleting,
    associating,
    error: servicesError,
    createError,
    updateError,
    deleteError,
    associateError,
    isValidTenant
  } = useServices();

  const {
    barbers,
    loadBarbers,
    loading: barbersLoading
  } = useBarbers();

  const { isFreePlan } = useTenant(); // Get plan type

  // Quick Add State
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddPrice, setQuickAddPrice] = useState('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    price: '' as unknown as number,
    description: '',
    duration: 60
  });
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [serviceToAssociate, setServiceToAssociate] = useState<Service | null>(null);
  const [selectedBarbers, setSelectedBarbers] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Load data
  useEffect(() => {
    if (isValidTenant) {
      Promise.all([
        loadServices().catch(err => {
          logger.componentError('Erro ao carregar serviços:', err);
          setError('Erro ao carregar serviços. Tente novamente.');
        }),
        loadBarbers().catch(err => {
          logger.componentError('Erro ao carregar barbeiros:', err);
        })
      ]);
    }
  }, [isValidTenant, loadServices, loadBarbers]);

  // Handle errors
  useEffect(() => {
    if (servicesError) setError(servicesError.message);
    else if (createError) setError(createError.message);
    else if (updateError) setError(updateError.message);
    else if (deleteError) setError(deleteError.message);
    else if (associateError) setError(associateError.message);
    else setError('');
  }, [servicesError, createError, updateError, deleteError, associateError]);

  // Quick Add Handler
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!isValidTenant) {
        toast.error('Contexto de barbearia inválido. Recarregue a página.', {
          duration: 5000,
          style: { background: '#1A1F2E', color: '#fff', border: '1px solid #EF4444', borderRadius: '12px' },
        });
        return;
      }
      if (!quickAddName.trim()) throw new Error('Informe o nome do serviço');
      if (!quickAddPrice || Number(quickAddPrice) <= 0) throw new Error('Informe um valor válido');

      await createService({
        name: quickAddName.trim(),
        price: Number(quickAddPrice),
        description: '',
        duration: 60,
        isActive: true
      });

      toast.success('Serviço adicionado!', {
        duration: 3000,
        style: {
          background: '#1A1F2E',
          color: '#fff',
          border: '1px solid #D4AF37',
          borderRadius: '12px',
          padding: '12px 16px',
        },
      });

      setQuickAddName('');
      setQuickAddPrice('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    }
  };

  // Full Add Handler
  const handleFullAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.name.trim()) throw new Error('Informe o nome do serviço');
      if (formData.price <= 0) throw new Error('Informe um valor válido');
      if (!isValidTenant) throw new Error('Contexto de barbearia inválido');

      await createService({
        name: formData.name.trim(),
        price: formData.price,
        description: formData.description || '',
        duration: formData.duration || 60,
        isActive: true
      });

      toast.success('Serviço cadastrado com sucesso!', {
        duration: 3000,
        style: { background: '#1A1F2E', color: '#fff', border: '1px solid #D4AF37', borderRadius: '12px' },
      });

      setFormData({ name: '', price: '' as unknown as number, description: '', duration: 60 });
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    }
  };

  // Edit Handler
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceToEdit) return;
    setError('');

    try {
      if (!isValidTenant) throw new Error('Contexto de barbearia inválido');

      await updateService(serviceToEdit.id, {
        name: serviceToEdit.name,
        price: serviceToEdit.price,
        description: serviceToEdit.description,
        duration: serviceToEdit.duration
      });

      toast.success('Serviço atualizado!', {
        duration: 3000,
        style: { background: '#1A1F2E', color: '#fff', border: '1px solid #D4AF37', borderRadius: '12px' },
      });

      setServiceToEdit(null);
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!serviceToDelete) return;
    setError('');

    try {
      if (!isValidTenant) throw new Error('Contexto de barbearia inválido');
      await deleteService(serviceToDelete.id);

      toast.success('Serviço removido!', {
        duration: 3000,
        style: { background: '#1A1F2E', color: '#fff', border: '1px solid #D4AF37', borderRadius: '12px' },
      });

      setServiceToDelete(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    }
  };

  // Associate Barbers Handler
  const handleAssociateBarbers = async () => {
    if (!serviceToAssociate || selectedBarbers.length === 0) return;
    setError('');

    try {
      if (!isValidTenant) throw new Error('Contexto de barbearia inválido');
      await associateBarbers(serviceToAssociate.id, selectedBarbers);

      toast.success(`Barbeiros associados!`, {
        duration: 3000,
        style: { background: '#1A1F2E', color: '#fff', border: '1px solid #D4AF37', borderRadius: '12px' },
      });

      setServiceToAssociate(null);
      setSelectedBarbers([]);
      setIsAssociateModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    }
  };

  return (
    <StandardLayout
      hideMobileHeader={true}
      title="Serviços"
      icon={<Package />}
      headerRight={
        <div className="flex items-center gap-3">
          {loading && <RefreshCw className="animate-spin h-5 w-5 text-[#D4AF37]" />}
          <span className="hidden sm:inline-block bg-[#1A1F2E] border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {services?.length || 0} Serviços
          </span>
        </div>
      }
    >
      <TenantDebugger />
      <div className="space-y-6 pb-20">
        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Add Bar - Desktop Only */}
        <motion.form
          onSubmit={handleQuickAdd}
          className="hidden md:flex items-center gap-3 bg-[#1A1F2E] p-4 rounded-2xl border border-white/5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex-1">
            <input
              type="text"
              value={quickAddName}
              onChange={(e) => setQuickAddName(e.target.value)}
              className="w-full p-3 bg-[#0D121E] rounded-xl focus:ring-1 focus:ring-[#D4AF37] outline-none border border-white/5 text-white placeholder-gray-500"
              placeholder="Nome do serviço (ex: Corte + Barba)"
            />
          </div>
          <div className="w-40">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="number"
                value={quickAddPrice}
                onChange={(e) => setQuickAddPrice(e.target.value)}
                className="w-full p-3 pl-9 bg-[#0D121E] rounded-xl focus:ring-1 focus:ring-[#D4AF37] outline-none border border-white/5 text-white placeholder-gray-500"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>
          <motion.button
            type="submit"
            disabled={creating || !isValidTenant}
            className="px-6 py-3 bg-[#D4AF37] text-black rounded-xl font-bold hover:bg-[#E6A555] transition-all flex items-center gap-2 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {creating ? <RefreshCw className="animate-spin h-4 w-4" /> : <Plus className="w-4 h-4" />}
            Adicionar
          </motion.button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-3 bg-[#0D121E] text-gray-300 rounded-xl font-medium hover:bg-[#1A1F2E] hover:text-white transition-all border border-white/5"
          >
            Completo
          </button>
        </motion.form>

        {/* Service Grid */}
        {!isValidTenant ? (
          <div className="flex flex-col items-center justify-center bg-[#1A1F2E] rounded-2xl border border-red-500/20 p-12 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Contexto de Barbearia Inválido</h3>
            <p className="text-gray-400 mb-4 max-w-md">
              Não foi possível carregar o contexto da barbearia. Verifique se você está acessando a URL correta.
            </p>
            <p className="text-xs text-gray-500 font-mono bg-black/30 px-3 py-2 rounded">
              Formato esperado: /app/[slug-da-barbearia]/servicos
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center bg-[#1A1F2E] rounded-2xl border border-white/5 p-12">
            <RefreshCw className="animate-spin h-10 w-10 text-[#D4AF37] mb-4" />
            <p className="text-gray-400">Carregando serviços...</p>
          </div>
        ) : !services || services.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-[#1A1F2E] rounded-2xl border border-white/5 p-16 text-center">
            <div className="w-20 h-20 bg-[#0D121E] rounded-full flex items-center justify-center mb-6">
              <Scissors className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhum serviço cadastrado</h3>
            <p className="text-gray-500 mb-6 max-w-md">
              Comece adicionando seus serviços usando o formulário rápido acima ou clique no botão abaixo.
            </p>
            <motion.button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 bg-[#D4AF37] text-black rounded-xl font-bold hover:bg-[#E6A555] transition-all flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
              Adicionar Primeiro Serviço
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                className="bg-[#1A1F2E] p-5 rounded-2xl border border-white/5 hover:border-[#D4AF37]/30 transition-all group relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#D4AF37]/10 transition-colors"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate group-hover:text-[#D4AF37] transition-colors mb-1">
                        {service.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        <span>{service.barbers?.length || 0} barbeiros</span>
                        {service.duration && (
                          <>
                            <span>•</span>
                            <Clock className="w-3 h-3" />
                            <span>{service.duration}min</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="bg-[#0D121E] px-3 py-2 rounded-lg border border-white/5 group-hover:border-[#D4AF37]/20 transition-colors">
                      <span className="text-[#D4AF37] font-bold text-sm">R$ {safeFixed(service.price, 2)}</span>
                    </div>
                  </div>

                  {service.description && (
                    <p className="text-xs text-gray-400 mb-4 line-clamp-2">{service.description}</p>
                  )}

                  <div className="flex gap-2">
                    {/* Equipe button - Only show for premium plans */}
                    {!isFreePlan && (
                      <motion.button
                        onClick={() => {
                          setServiceToAssociate(service);
                          setSelectedBarbers([]);
                          setIsAssociateModalOpen(true);
                        }}
                        className="flex-1 py-2 px-3 bg-[#0D121E] hover:bg-[#D4AF37]/10 text-gray-300 hover:text-[#D4AF37] rounded-lg transition-all border border-white/5 hover:border-[#D4AF37]/20 text-xs font-medium flex items-center justify-center gap-1.5"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={!barbers || barbers.length === 0}
                      >
                        <Users size={13} />
                        Equipe
                      </motion.button>
                    )}

                    <motion.button
                      onClick={() => {
                        setServiceToEdit(service);
                        setIsEditModalOpen(true);
                      }}
                      className="w-9 h-9 flex items-center justify-center bg-[#0D121E] hover:bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg transition-all border border-white/5 hover:border-[#D4AF37]/20"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit size={14} />
                    </motion.button>

                    <motion.button
                      onClick={() => {
                        setServiceToDelete(service);
                        setIsDeleteModalOpen(true);
                      }}
                      className="w-9 h-9 flex items-center justify-center bg-[#0D121E] hover:bg-red-500/10 text-red-400 hover:text-red-500 rounded-lg transition-all border border-white/5 hover:border-red-500/20"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Floating Add Button - Mobile Only */}
        <motion.button
          onClick={() => setIsAddModalOpen(true)}
          className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-[#D4AF37] text-black rounded-full shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center z-40"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAddModalOpen || isEditModalOpen) && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setServiceToEdit(null);
              }
            }}
          >
            <motion.div
              className="bg-[#1A1F2E] rounded-2xl p-6 w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Scissors className="text-[#D4AF37] w-5 h-5" />
                  {isEditModalOpen ? 'Editar Serviço' : 'Novo Serviço'}
                </h3>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setServiceToEdit(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={isEditModalOpen ? handleEdit : handleFullAdd} className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2 text-sm font-medium">Nome do Serviço</label>
                  <input
                    type="text"
                    value={isEditModalOpen ? serviceToEdit?.name || '' : formData.name}
                    onChange={(e) => {
                      if (isEditModalOpen && serviceToEdit) {
                        setServiceToEdit({ ...serviceToEdit, name: e.target.value });
                      } else {
                        setFormData({ ...formData, name: e.target.value });
                      }
                    }}
                    className="w-full p-3 bg-[#0D121E] rounded-xl focus:ring-1 focus:ring-[#D4AF37] outline-none border border-white/5 text-white placeholder-gray-500"
                    placeholder="Ex: Corte + Barba"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2 text-sm font-medium">Descrição (opcional)</label>
                  <textarea
                    value={isEditModalOpen ? serviceToEdit?.description || '' : formData.description}
                    onChange={(e) => {
                      if (isEditModalOpen && serviceToEdit) {
                        setServiceToEdit({ ...serviceToEdit, description: e.target.value });
                      } else {
                        setFormData({ ...formData, description: e.target.value });
                      }
                    }}
                    className="w-full p-3 bg-[#0D121E] rounded-xl focus:ring-1 focus:ring-[#D4AF37] outline-none border border-white/5 text-white placeholder-gray-500 resize-none"
                    placeholder="Descrição breve do serviço..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-2 text-sm font-medium">Valor (R$)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="number"
                        value={isEditModalOpen ? serviceToEdit?.price || '' : formData.price}
                        onChange={(e) => {
                          if (isEditModalOpen && serviceToEdit) {
                            setServiceToEdit({ ...serviceToEdit, price: Number(e.target.value) });
                          } else {
                            setFormData({ ...formData, price: Number(e.target.value) });
                          }
                        }}
                        className="w-full p-3 pl-9 bg-[#0D121E] rounded-xl focus:ring-1 focus:ring-[#D4AF37] outline-none border border-white/5 text-white placeholder-gray-500"
                        placeholder="0.00"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2 text-sm font-medium">Duração (min)</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="number"
                        value={isEditModalOpen ? serviceToEdit?.duration || 60 : formData.duration}
                        onChange={(e) => {
                          if (isEditModalOpen && serviceToEdit) {
                            setServiceToEdit({ ...serviceToEdit, duration: Number(e.target.value) });
                          } else {
                            setFormData({ ...formData, duration: Number(e.target.value) });
                          }
                        }}
                        className="w-full p-3 pl-9 bg-[#0D121E] rounded-xl focus:ring-1 focus:ring-[#D4AF37] outline-none border border-white/5 text-white placeholder-gray-500"
                        placeholder="60"
                        step="5"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                      setServiceToEdit(null);
                    }}
                    className="flex-1 px-4 py-3 text-gray-300 border border-white/10 rounded-xl hover:bg-white/5 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={(isEditModalOpen ? updating : creating) || !isValidTenant}
                    className="flex-1 px-4 py-3 bg-[#D4AF37] text-black rounded-xl hover:bg-[#E6A555] transition-colors disabled:opacity-50 font-bold flex items-center justify-center gap-2"
                  >
                    {(isEditModalOpen ? updating : creating) ? (
                      <>
                        <RefreshCw className="animate-spin h-4 w-4" />
                        {isEditModalOpen ? 'Atualizando...' : 'Cadastrando...'}
                      </>
                    ) : (
                      isEditModalOpen ? 'Atualizar' : 'Cadastrar'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          await handleDelete();
          setIsDeleteModalOpen(false);
        }}
        title="Confirmar Remoção"
        message={`Tem certeza que deseja remover o serviço "${serviceToDelete?.name}"?`}
        confirmButtonText="Remover"
        cancelButtonText="Cancelar"
        isLoading={deleting}
      />

      {/* Barber Association Modal */}
      <AnimatePresence>
        {isAssociateModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#1A1F2E] rounded-2xl p-6 w-full max-w-md border border-[#D4AF37]/20"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="text-[#D4AF37] w-5 h-5" />
                  Associar Barbeiros
                </h3>
                <button
                  onClick={() => {
                    setIsAssociateModalOpen(false);
                    setServiceToAssociate(null);
                    setSelectedBarbers([]);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {serviceToAssociate && (
                <div className="mb-4">
                  <p className="text-gray-300 text-sm mb-2">
                    Serviço: <span className="text-[#D4AF37] font-medium">{serviceToAssociate.name}</span>
                  </p>
                  <p className="text-gray-400 text-xs">
                    Selecione os barbeiros que podem realizar este serviço:
                  </p>
                </div>
              )}

              <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                {barbersLoading ? (
                  <div className="text-center py-4">
                    <RefreshCw className="animate-spin h-6 w-6 text-[#D4AF37] mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Carregando barbeiros...</p>
                  </div>
                ) : !barbers || barbers.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">
                    Nenhum barbeiro cadastrado.
                  </p>
                ) : (
                  barbers.map((barber) => (
                    <label
                      key={barber.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#0D121E] hover:bg-[#0D121E]/80 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBarbers.includes(barber.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBarbers(prev => [...prev, barber.id]);
                          } else {
                            setSelectedBarbers(prev => prev.filter(id => id !== barber.id));
                          }
                        }}
                        className="w-4 h-4 text-[#D4AF37] bg-transparent border-gray-600 rounded focus:ring-[#D4AF37] focus:ring-2"
                      />
                      <span className="text-white text-sm">{barber.name}</span>
                    </label>
                  ))
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsAssociateModalOpen(false);
                    setServiceToAssociate(null);
                    setSelectedBarbers([]);
                  }}
                  className="flex-1 px-4 py-3 text-gray-300 border border-white/10 rounded-xl hover:bg-white/5 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAssociateBarbers}
                  disabled={selectedBarbers.length === 0 || associating}
                  className="flex-1 px-4 py-3 bg-[#D4AF37] text-black rounded-xl hover:bg-[#E6A555] transition-colors disabled:opacity-50 font-bold flex items-center justify-center gap-2"
                >
                  {associating ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4" />
                      Associando...
                    </>
                  ) : (
                    'Associar'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </StandardLayout>
  );
};

export default ServiceManagementPage;