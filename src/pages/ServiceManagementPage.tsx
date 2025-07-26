import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Scissors, Edit, Trash2, RefreshCw } from 'lucide-react';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import EditServiceModal from '../components/ui/EditServiceModal';
import ApiService from '../services/ApiService';
import { logger } from '../utils/logger';
import { CURRENT_ENV } from '../config/environmentConfig';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  name: string;
  price: number;
  barbers: string[];
  selected?: boolean;
}

const ServiceManagementPage: React.FC = () => {
  const navigate = useNavigate();

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

  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState({ name: '', price: '' as unknown as number });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async (forceRefresh: boolean = false) => {
    try {
      logger.componentDebug('Carregando serviços no ServiceManagementPage');
      const result = forceRefresh 
        ? await ApiService.get('/api/services', { forceRefresh: true })
        : await ApiService.getServices();
      
      if (result && Array.isArray(result)) {
        setServices(result);
        logger.componentDebug(`Carregados ${result.length} serviços`);
      }
    } catch (err) {
      logger.componentError('Erro ao buscar serviços:', err);
    }
  };

  const handleRefreshServices = async () => {
    setIsRefreshing(true);
    setError('');
    
    try {
      // Força a atualização dos dados ignorando o cache
      await fetchServices(true);
      toast.success('Serviços atualizados com sucesso!', {
        duration: 3000,
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
    } catch (err) {
      logger.componentError('Erro ao atualizar serviços:', err);
      setError('Erro ao atualizar serviços. Tente novamente.');
    } finally {
      setIsRefreshing(false);
    }
  };



  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!newService.name.trim()) {
        throw new Error('Por favor, informe o nome do serviço');
      }

      if (newService.price <= 0) {
        throw new Error('Por favor, informe um valor válido');
      }

      const response = await fetch(`${CURRENT_ENV.apiUrl}/api/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(newService)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao adicionar serviço');
      }

      setSuccess('Serviço adicionado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      setNewService({ name: '', price: '' as unknown as number });
      fetchServices();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${CURRENT_ENV.apiUrl}/api/services/${serviceToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao remover serviço');
      }

      setSuccess('Serviço removido com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      setServiceToDelete(null);
      fetchServices();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateService = async (updatedService: Service) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${CURRENT_ENV.apiUrl}/api/services/${updatedService.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({
          name: updatedService.name,
          price: updatedService.price
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao atualizar serviço');
      }

      // Atualiza o estado local imediatamente com os novos dados
      setServices(prevServices => 
        prevServices.map(service => 
          service.id === updatedService.id 
            ? { ...service, name: updatedService.name, price: updatedService.price }
            : service
        )
      );

      // Toast de sucesso padronizado como no BookingModal
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
      
      // Invalida apenas o cache de serviços para próximas requisições
      try {
        // Remove especificamente o cache de serviços
        const cacheKeys = ['GET-/api/services', '/api/services'];
        cacheKeys.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
        
        // Força uma nova busca em background para sincronizar com o servidor
        setTimeout(() => {
          fetchServices(true).catch(err => 
            logger.componentError('Erro na sincronização em background:', err)
          );
        }, 1000);
      } catch (cacheError) {
        logger.componentWarn('Erro ao limpar cache:', cacheError);
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D121E] pt-20 pb-10">
      
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#F0B35B]/5 to-transparent rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(90deg, #F0B35B 1px, transparent 1px), linear-gradient(180deg, #F0B35B 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: 'center'
        }}></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between mb-6 border-b border-[#F0B35B]/20 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Gerenciamento de Serviços</h1>
          <motion.button 
            onClick={() => navigate('/dashboard')}
            className="relative overflow-hidden group flex items-center  px-4 py-2 bg-[#1A1F2E] rounded-lg hover:bg-[#252B3B] transition-all duration-300 text-white border border-[#F0B35B]/20 hover:border-[#F0B35B]/40"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft size={18} className="text-[#F0B35B]" />
            <span>Voltar</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/10 to-[#F0B35B]/0 opacity-0 group-hover:opacity-100 transition-opacity -skew-x-45 animate-shine" />
          </motion.button>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div 
            className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 rounded-xl shadow-xl border border-[#F0B35B]/20 hover:border-[#F0B35B]/40 transition-all duration-300"
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
                disabled={isLoading}
                className="relative overflow-hidden group md:col-span-2 w-full py-3 bg-[#F0B35B] text-black rounded-xl font-semibold hover:shadow-lg transition-all duration-300 border-2 border-[#F0B35B]/70 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLoading ? 'Adicionando...' : 'Adicionar Serviço'}
                <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/40 to-[#F0B35B]/0 -skew-x-45 animate-shine opacity-0 group-hover:opacity-100"></div>
              </motion.button>
            </form>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 rounded-xl shadow-xl border border-[#F0B35B]/20 hover:border-[#F0B35B]/40 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4 border-b border-[#F0B35B]/20 pb-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-semibold text-white flex items-center gap-3">
                  <Scissors className="text-[#F0B35B] w-5 h-5" />
                  <span>Serviços Cadastrados</span>
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="bg-[#F0B35B] text-black text-xs font-bold px-2 py-0.5 rounded-full">{services.length}</span>
                <motion.button
                  onClick={handleRefreshServices}
                  disabled={isRefreshing}
                  className="p-2 rounded-lg bg-[#F0B35B] text-black hover:bg-[#F0B35B]/90 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Atualizar lista de serviços"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'refresh-icon-spin' : ''}`} />
                </motion.button>
              </div>
            </div>
            
            {services.length === 0 ? (
              <p className="text-center text-gray-400 py-10">Nenhum serviço cadastrado ainda.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {services.map(service => (
                  <motion.div 
                    key={service.id} 
                    className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 rounded-xl shadow-xl border border-[#F0B35B]/20 hover:border-[#F0B35B]/40 transition-all duration-300"
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
                          R$ {service.price.toFixed(2)}
                        </motion.div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-[#F0B35B]/10 flex justify-end gap-2">
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
        isLoading={isLoading}
      />
      
      <EditServiceModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setServiceToEdit(null);
        }}
        onConfirm={handleUpdateService}
        service={serviceToEdit}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ServiceManagementPage;