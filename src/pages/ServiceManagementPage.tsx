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
      <div className="relative z-10">

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-green-900/20 border border-green-500/30 text-green-400 rounded-lg"
          >
            {success}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <motion.div 
            className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-4 sm:p-6 shadow-xl border border-[#F0B35B]/20 hover:border-[#F0B35B]/40 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-white flex items-center gap-3">
              <Scissors className="text-[#F0B35B] w-5 h-5" />
              <span>Adicionar Novo Serviço</span>
            </h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAddService}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2 text-sm font-medium">Nome do Serviço</label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                  className="w-full p-3 bg-[#0D121E] rounded-lg focus:ring-2 focus:ring-[#F0B35B] outline-none transition-all duration-300 border border-transparent hover:border-[#F0B35B]/30 text-white placeholder-gray-500"
                  placeholder="Ex: Corte Tradicional"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2 text-sm font-medium">Valor (R$)</label>
                <input
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService({...newService, price: Number(e.target.value)})}
                  className="w-full p-3 bg-[#0D121E] rounded-lg focus:ring-2 focus:ring-[#F0B35B] outline-none transition-all duration-300 border border-transparent hover:border-[#F0B35B]/30 text-white placeholder-gray-500"
                  placeholder="Ex: 45"
                  step="0.01"
                />
              </div>
              <motion.button 
                type="submit" 
                disabled={creating || !isValidTenant}
                className="relative overflow-hidden group md:col-span-2 w-full py-3 bg-[#F0B35B] text-black rounded-xl font-semibold hover:shadow-lg transition-all duration-300 border-2 border-[#F0B35B]/70 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {creating ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Adicionando...
                  </>
                ) : (
                  'Adicionar Serviço'
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/40 to-[#F0B35B]/0 -skew-x-45 animate-shine opacity-0 group-hover:opacity-100"></div>
              </motion.button>
            </form>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-4 sm:p-6 shadow-xl border border-[#F0B35B]/20 hover:border-[#F0B35B]/40 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white flex items-center gap-3">
                <Scissors className="text-[#F0B35B] w-5 h-5" />
                <span>Serviços Cadastrados</span>
              </h2>
              <div className="flex items-center gap-2">
                {loading && <RefreshCw className="animate-spin h-4 w-4 text-[#F0B35B]" />}
                <span className="bg-[#F0B35B] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  {services?.length || 0}
                </span>
              </div>
            </div>
            
            {!isValidTenant ? (
              <p className="text-center text-gray-400 py-10">Contexto de barbearia inválido. Verifique se você está logado corretamente.</p>
            ) : loading ? (
              <div className="text-center py-10">
                <RefreshCw className="animate-spin h-8 w-8 text-[#F0B35B] mx-auto mb-4" />
                <p className="text-gray-400">Carregando serviços...</p>
              </div>
            ) : !services || services.length === 0 ? (
              <p className="text-center text-gray-400 py-10">Nenhum serviço cadastrado ainda.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {services.map(service => (
                  <motion.div 
                    key={service.id} 
                    className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 shadow-xl border border-[#F0B35B]/20 hover:border-[#F0B35B]/40 transition-all duration-300"
                    whileHover={{ scale: 1.02, y: -2 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg sm:text-xl font-semibold text-white truncate">{service.name}</h3>
                      </div>
                      
                      <div className="mt-auto pt-2 flex justify-between items-center">
                        <span className="text-sm text-gray-300">Valor:</span>
                        <motion.div 
                          className="bg-[#F0B35B]/10 text-[#F0B35B] font-bold text-xl px-3 py-1 rounded"
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          R$ {safeFixed(service.price, 2)}
                        </motion.div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-[#F0B35B]/10 flex justify-end gap-2 flex-wrap">
                        <motion.button 
                          onClick={() => {
                            setServiceToAssociate(service);
                            setSelectedBarbers([]);
                            setIsAssociateModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-blue-400 hover:text-white hover:bg-blue-500 rounded-lg transition-all duration-300 border border-blue-500/30 text-sm font-medium flex items-center gap-1"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={!barbers || barbers.length === 0}
                        >
                          <Users size={14} />
                          <span>Barbeiros</span>
                        </motion.button>
                        <motion.button 
                          onClick={() => {
                            setServiceToEdit(service);
                            setIsEditModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-[#F0B35B] hover:text-black hover:bg-[#F0B35B] rounded-lg transition-all duration-300 border border-[#F0B35B]/30 text-sm font-medium flex items-center gap-1"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Edit size={14} />
                          <span>Editar</span>
                        </motion.button>
                        <motion.button 
                          onClick={() => {
                            setServiceToDelete(service);
                            setIsDeleteModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-300 border border-red-500/30 text-sm font-medium flex items-center gap-1"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trash2 size={14} />
                          <span>Excluir</span>
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