import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scissors, Edit, Trash2, RefreshCw, Users, X } from 'lucide-react';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import EditServiceModal from '../components/ui/EditServiceModal';
import { useServices } from '../hooks/useServices';
import { useBarbers } from '../hooks/useBarbers';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';
import StandardLayout from '../components/layout/StandardLayout';
import { safeFixed } from '../utils/numberUtils';

interface Service {
  id: string;
  name: string;
  price: number;
  barbers?: string[];
  selected?: boolean;
}

const ServiceManagementPage: React.FC = () => {
  // Multi-tenant hooks
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

  // Adicionar estilos CSS para animação do ícone de refresh
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .refresh-icon-spin {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [newService, setNewService] = useState({ name: '', price: '' as unknown as number });
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);
  const [serviceToAssociate, setServiceToAssociate] = useState<Service | null>(null);
  const [selectedBarbers, setSelectedBarbers] = useState<string[]>([]);

  // Load services and barbers on component mount and when tenant changes
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
  }, [isValidTenant, loadServices, loadBarbers, setError]);

  // Handle errors from hooks
  useEffect(() => {
    if (servicesError) {
      setError(servicesError.message);
    } else if (createError) {
      setError(createError.message);
    } else if (updateError) {
      setError(updateError.message);
    } else if (deleteError) {
      setError(deleteError.message);
    } else if (associateError) {
      setError(associateError.message);
    } else {
      setError('');
    }
  }, [servicesError, createError, updateError, deleteError, associateError]);


  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!newService.name.trim()) {
        throw new Error('Por favor, informe o nome do serviço');
      }

      if (newService.price <= 0) {
        throw new Error('Por favor, informe um valor válido');
      }

      if (!isValidTenant) {
        throw new Error('Contexto de barbearia inválido');
      }

      // Use the multi-tenant hook to create service
      await createService({
        name: newService.name.trim(),
        price: newService.price,
        description: '', // Default empty description
        duration: 60, // Default 60 minutes
        isActive: true // Default active
      });

      // Toast de sucesso padronizado
      toast.success('Serviço adicionado com sucesso!', {
        duration: 4000,
        style: {
          background: '#1A1F2E',
          color: '#fff',
          border: '1px solid #F0B35B',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '12px',
          fontWeight: '500'
        },
        iconTheme: {
          primary: '#F0B35B',
          secondary: '#1A1F2E'
        }
      });

      setNewService({ name: '', price: '' as unknown as number });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Por favor, tente novamente.');
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    setError('');

    try {
      if (!isValidTenant) {
        throw new Error('Contexto de barbearia inválido');
      }

      // Use the multi-tenant hook to delete service
      await deleteService(serviceToDelete.id);

      // Toast de sucesso padronizado
      toast.success('Serviço removido com sucesso!', {
        duration: 4000,
        style: {
          background: '#1A1F2E',
          color: '#fff',
          border: '1px solid #F0B35B',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '12px',
          fontWeight: '500'
        },
        iconTheme: {
          primary: '#F0B35B',
          secondary: '#1A1F2E'
        }
      });

      setServiceToDelete(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Por favor, tente novamente.');
    }
  };

  const handleUpdateService = async (updatedService: Service) => {
    setError('');

    try {
      if (!isValidTenant) {
        throw new Error('Contexto de barbearia inválido');
      }

      // Use the multi-tenant hook to update service
      await updateService(updatedService.id, {
        name: updatedService.name,
        price: updatedService.price
      });

      // Toast de sucesso padronizado
      toast.success('Serviço atualizado com sucesso!', {
        duration: 4000,
        style: {
          background: '#1A1F2E',
          color: '#fff',
          border: '1px solid #F0B35B',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '12px',
          fontWeight: '500'
        },
        iconTheme: {
          primary: '#F0B35B',
          secondary: '#1A1F2E'
        }
      });

      setServiceToEdit(null);
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Por favor, tente novamente.');
    }
  };

  const handleAssociateBarbers = async () => {
    if (!serviceToAssociate || selectedBarbers.length === 0) return;

    setError('');

    try {
      if (!isValidTenant) {
        throw new Error('Contexto de barbearia inválido');
      }

      // Use the multi-tenant hook to associate barbers
      await associateBarbers(serviceToAssociate.id, selectedBarbers);

      // Toast de sucesso padronizado
      toast.success(`Barbeiros associados ao serviço "${serviceToAssociate.name}" com sucesso!`, {
        duration: 4000,
        style: {
          background: '#1A1F2E',
          color: '#fff',
          border: '1px solid #F0B35B',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '12px',
          fontWeight: '500'
        },
        iconTheme: {
          primary: '#F0B35B',
          secondary: '#1A1F2E'
        }
      });

      setServiceToAssociate(null);
      setSelectedBarbers([]);
      setIsAssociateModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Por favor, tente novamente.');
    }
  };

  return (
    <StandardLayout>
      <div className="relative z-10 space-y-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <motion.div
            className="bg-surface/50 backdrop-blur-md p-6 lg:p-8 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-500"></div>

            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-white flex items-center gap-3 relative z-10">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Scissors className="text-primary w-6 h-6" />
              </div>
              <span>Adicionar Serviço</span>
            </h2>

            <form className="space-y-5 relative z-10" onSubmit={handleAddService}>
              <div>
                <label className="block text-gray-400 mb-2 text-sm font-medium ml-1">Nome do Serviço</label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full p-3.5 bg-background-paper rounded-xl focus:ring-1 focus:ring-primary outline-none transition-all duration-300 border border-white/5 hover:border-primary/30 text-white placeholder-gray-500"
                  placeholder="Ex: Corte Tradicional"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2 text-sm font-medium ml-1">Valor (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
                    className="w-full p-3.5 pl-10 bg-background-paper rounded-xl focus:ring-1 focus:ring-primary outline-none transition-all duration-300 border border-white/5 hover:border-primary/30 text-white placeholder-gray-500"
                    placeholder="0,00"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="pt-2">
                <motion.button
                  type="submit"
                  disabled={creating || !isValidTenant}
                  className="w-full py-4 bg-primary text-black rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {creating ? (
                    <>
                      <RefreshCw className="animate-spin h-5 w-5" />
                      Adicionando...
                    </>
                  ) : (
                    'Cadastrar Serviço'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>

          <motion.div
            className="flex flex-col h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                <span>Serviços Cadastrados</span>
              </h2>
              <div className="flex items-center gap-3">
                {loading && <RefreshCw className="animate-spin h-5 w-5 text-primary" />}
                <span className="bg-surface border border-white/10 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  {services?.length || 0} Serviços
                </span>
              </div>
            </div>

            {!isValidTenant ? (
              <div className="flex-1 flex items-center justify-center bg-surface/30 rounded-2xl border border-white/5 p-8">
                <p className="text-gray-400">Contexto de barbearia inválido. Verifique se você está logado corretamente.</p>
              </div>
            ) : loading ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-surface/30 rounded-2xl border border-white/5 p-8">
                <RefreshCw className="animate-spin h-8 w-8 text-primary mb-4" />
                <p className="text-gray-400">Carregando serviços...</p>
              </div>
            ) : !services || services.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-surface/30 rounded-2xl border border-white/5 p-12 text-center">
                <div className="w-16 h-16 bg-background-paper rounded-full flex items-center justify-center mb-4 text-gray-600">
                  <Scissors className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Nenhum serviço encontrado</h3>
                <p className="text-gray-500 max-w-xs mx-auto">Comece adicionando novos serviços através do formulário ao lado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6 h-[calc(100vh-320px)] overflow-y-auto pr-2 custom-scrollbar content-start">
                {services.map(service => (
                  <motion.div
                    key={service.id}
                    className="bg-surface/50 p-5 rounded-xl border border-white/5 hover:border-primary/30 transition-all duration-300 group"
                    whileHover={{ y: -2, backgroundColor: 'rgba(30,35,50,0.8)' }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0 pr-3">
                          <h3 className="text-lg font-bold text-white truncate group-hover:text-primary transition-colors">{service.name}</h3>
                          <p className="text-gray-500 text-xs mt-1 truncate">{service.barbers?.length || 0} barbeiros associados</p>
                        </div>
                        <div className="bg-background-paper px-3 py-1.5 rounded-lg border border-white/5 group-hover:border-primary/20 transition-colors">
                          <span className="text-primary font-bold">R$ {safeFixed(service.price, 2)}</span>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 flex gap-2">
                        <motion.button
                          onClick={() => {
                            setServiceToAssociate(service);
                            setSelectedBarbers([]);
                            setIsAssociateModalOpen(true);
                          }}
                          className="flex-1 py-2 bg-background-paper hover:bg-surface text-gray-300 hover:text-white rounded-lg transition-colors border border-white/5 hover:border-white/10 text-xs font-medium flex items-center justify-center gap-1.5"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={!barbers || barbers.length === 0}
                          title="Associar Barbeiros"
                        >
                          <Users size={14} />
                          <span>Equipe</span>
                        </motion.button>

                        <motion.button
                          onClick={() => {
                            setServiceToEdit(service);
                            setIsEditModalOpen(true);
                          }}
                          className="w-9 h-9 flex items-center justify-center bg-background-paper hover:bg-primary/10 text-primary rounded-lg transition-colors border border-white/5 hover:border-primary/20"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Editar"
                        >
                          <Edit size={14} />
                        </motion.button>

                        <motion.button
                          onClick={() => {
                            setServiceToDelete(service);
                            setIsDeleteModalOpen(true);
                          }}
                          className="w-9 h-9 flex items-center justify-center bg-background-paper hover:bg-red-500/10 text-red-400 hover:text-red-500 rounded-lg transition-colors border border-white/5 hover:border-red-500/20"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          await handleDeleteService();
          setIsDeleteModalOpen(false);
        }}
        title="Confirmar Remoção"
        message={`Tem certeza que deseja remover o serviço "${serviceToDelete?.name}"?`}
        confirmButtonText="Remover"
        cancelButtonText="Cancelar"
        isLoading={deleting}
      />

      <EditServiceModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setServiceToEdit(null);
        }}
        onConfirm={handleUpdateService}
        service={serviceToEdit}
        isLoading={updating}
      />

      {/* Barber Association Modal */}
      {isAssociateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl p-6 w-full max-w-md border border-[#F0B35B]/20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="text-[#F0B35B] w-5 h-5" />
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
                  Serviço: <span className="text-[#F0B35B] font-medium">{serviceToAssociate.name}</span>
                </p>
                <p className="text-gray-300 text-sm">
                  Selecione os barbeiros que podem realizar este serviço:
                </p>
              </div>
            )}

            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {barbersLoading ? (
                <div className="text-center py-4">
                  <RefreshCw className="animate-spin h-6 w-6 text-[#F0B35B] mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Carregando barbeiros...</p>
                </div>
              ) : !barbers || barbers.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  Nenhum barbeiro cadastrado ainda.
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
                      className="w-4 h-4 text-[#F0B35B] bg-transparent border-gray-600 rounded focus:ring-[#F0B35B] focus:ring-2"
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
                className="flex-1 px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssociateBarbers}
                disabled={selectedBarbers.length === 0 || associating}
                className="flex-1 px-4 py-2 bg-[#F0B35B] text-black rounded-lg hover:bg-[#F0B35B]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>
      )}
    </StandardLayout>
  );
};

export default ServiceManagementPage;