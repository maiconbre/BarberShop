import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Trash2, Edit, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import EditConfirmationModal from '../components/ui/EditConfirmationModal';
import { useBarbers, useBarberActions, useBarberError } from '../stores/barberStore';
import { CURRENT_ENV } from '../config/environmentConfig';
import toast from 'react-hot-toast';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  barberName: string;
}

interface PasswordConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, barberName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1F2E] p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4">Confirmar Exclusão</h3>
        <p className="text-gray-300 mb-6 leading-relaxed">
          Excluir o barbeiro <span className="font-semibold text-white">{barberName}</span>.
          <br /> Você removerá todos agendamentos deste barbeiro.
          <br /> Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
};

const PasswordConfirmationModal: React.FC<PasswordConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setModalError('Por favor, insira sua senha');
      return;
    }

    setIsLoading(true);
    try {
      // Verificar a senha do administrador
      const response = await fetch(`${CURRENT_ENV.apiUrl}/api/auth/verify-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        throw new Error('Senha incorreta');
      }

      onConfirm(password);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Senha incorreta');
      setIsLoading(false); // Importante: parar o loading em caso de erro
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1F2E] p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4">Confirmar Alterações</h3>
        <p className="text-gray-300 mb-6">
          Para confirmar as alterações, por favor insira sua senha de administrador.
        </p>

        <form onSubmit={handleSubmit}>
          {modalError && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm mb-4">
              {modalError}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="confirm-password" className="sr-only">Senha de Administrador</label>
            <input
              id="confirm-password"
              name="password"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
              placeholder="Senha de administrador"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setModalError('');
              }}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                setPassword('');
                setModalError('');
                setIsLoading(false);
                onClose();
              }}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-2 bg-[#F0B35B] text-black rounded hover:bg-[#F0B35B]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                'Confirmar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    whatsapp: '',
    pix: ''
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditConfirmModalOpen, setIsEditConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');
  
  // Usar o store de barbeiros
  const { barbers } = useBarbers();
  const { fetchBarbers, createBarber, updateBarber, deleteBarber, clearError } = useBarberActions();

  const barberError = useBarberError();

  useEffect(() => {
    // Verificar se o usuário tem permissão de admin
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    // Carregar barbeiros usando o store
    fetchBarbers();
  }, [currentUser, navigate, fetchBarbers]);
  
  // Limpar erros do store quando o componente for desmontado
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);
  
  // Mostrar erros do store como toast
  useEffect(() => {
    if (barberError) {
      toast.error(barberError, {
        style: {
          fontSize: '12px',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid #FECACA'
        }
      });
      clearError();
    }
  }, [barberError, clearError]);

  // Função removida - agora usa o store

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Se estiver em modo de edição, abrir modal de confirmação de senha do admin
    if (isEditMode && selectedUser) {
      setIsPasswordModalOpen(true);
      return;
    }

    // Caso contrário, continuar com o fluxo normal de criação
    setIsLoading(true);
    setError('');

    try {
      // Validações
      const whatsappRegex = /^\d{10,11}$/;
      let cleanWhatsapp = formData.whatsapp.replace(/\D/g, '');

      // Remove o prefixo 55 se já existir
      if (cleanWhatsapp.startsWith('55')) {
        cleanWhatsapp = cleanWhatsapp.substring(2);
      }

      if (!whatsappRegex.test(cleanWhatsapp)) {
        setError('O número do WhatsApp deve conter entre 10 e 11 dígitos (DDD + número)');
        setIsLoading(false);
        return;
      }

      // Adiciona o prefixo 55 ao WhatsApp
      cleanWhatsapp = '55' + cleanWhatsapp;

      if (formData.pix.trim().length < 3) {
        setError('Por favor, insira uma chave PIX válida');
        setIsLoading(false);
        return;
      }

      // Criar novo barbeiro usando o store
      const newBarber = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        password: formData.password,
        whatsapp: cleanWhatsapp,
        pix: formData.pix.trim(),
        role: 'barber'
      };
      await createBarber(newBarber);

      // Mostrar mensagem de sucesso
      toast.success('Barbeiro cadastrado com sucesso!', {
        style: {
          fontSize: '12px',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: '#F0FDF4',
          color: '#16A34A',
          border: '1px solid #BBF7D0'
        }
      });

      // Limpar o formulário
      setFormData({
        name: '',
        username: '',
        password: '',
        whatsapp: '',
        pix: ''
      });
    } catch (err: any) {
      console.error('Error during operation:', err);
      setError(err.message || 'Erro inesperado. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmUpdate = async (password: string) => {
    setIsLoading(true);

    try {
      // Validações
      const whatsappRegex = /^\d{10,11}$/;
      let cleanWhatsapp = formData.whatsapp.replace(/\D/g, '');

      // Remove o prefixo 55 se já existir
      if (cleanWhatsapp.startsWith('55')) {
        cleanWhatsapp = cleanWhatsapp.substring(2);
      }

      if (!whatsappRegex.test(cleanWhatsapp)) {
        setError('O número do WhatsApp deve conter entre 10 e 11 dígitos (DDD + número)');
        return;
      }

      // Adiciona o prefixo 55 ao WhatsApp
      cleanWhatsapp = '55' + cleanWhatsapp;

      if (formData.pix.trim().length < 3) {
        setError('Por favor, insira uma chave PIX válida');
        return;
      }

      // Atualizar barbeiro existente usando o store
      const updateData: any = {
        name: formData.name.trim(),
        whatsapp: cleanWhatsapp,
        pix: formData.pix.trim(),
        password: password // Usar a senha fornecida no modal
      };

      await updateBarber(selectedUser.id, updateData);

      toast.success('Barbeiro atualizado com sucesso!', {
        style: {
          fontSize: '12px',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: '#F0FDF4',
          color: '#16A34A',
          border: '1px solid #BBF7D0'
        }
      });

      // Reset todos os estados
      setIsEditMode(false);
      setIsPasswordModalOpen(false);
      setSelectedUser(null);
      setError('');
      setFormData({
        name: '',
        username: '',
        password: '',
        whatsapp: '',
        pix: ''
      });

      // A lista será atualizada automaticamente pelo store

    } catch (err: any) {
      console.error('Error during operation:', err);
      setError(err.message || 'Erro inesperado. Por favor, tente novamente.');
    } finally {
      setIsLoading(false); // Garantir que o loading seja desativado em qualquer cenário
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setIsDeleteModalOpen(true);
  };

  const handleEditUser = async (user: any) => {
    // Definir o usuário selecionado para uso no modal
    setSelectedUser(user);

    // Abrir o modal de confirmação primeiro
    setIsEditConfirmModalOpen(true);

    // Limpar mensagens anteriores
    setSuccess('');
    setError('');
    setEditSuccess('');
  };

  const prepareEditForm = (user: any) => {
    // Formatar o número de WhatsApp para exibição (remover o prefixo 55)
    let displayWhatsapp = user.whatsapp;
    if (displayWhatsapp.startsWith('55')) {
      displayWhatsapp = displayWhatsapp.substring(2);
    }

    // Preencher o formulário com os dados do usuário
    setFormData({
      name: user.name,
      username: user.username,
      password: '', // Não preencher a senha por segurança
      whatsapp: displayWhatsapp,
      pix: user.pix
    });

    // Definir o modo de edição
    setIsEditMode(true);

    // Fechar o modal de confirmação
    setIsEditConfirmModalOpen(false);
  };



  return (
    <div className="min-h-screen bg-[#0D121E] py-20 px-4 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#F0B35B]/5 to-transparent rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>

      {/* Padrão de linhas decorativas */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: 'linear-gradient(90deg, #F0B35B 1px, transparent 1px), linear-gradient(180deg, #F0B35B 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Logo clicável */}
      <div onClick={() => navigate('/dashboard')} className="absolute top-8 left-1/2 -translate-x-1/2 cursor-pointer z-20">
        <div className="transform hover:scale-110 transition-transform duration-300">
          <div className="inline-block relative">
            <div className="text-[#F0B35B] text-xl font-medium tracking-wider border border-[#F0B35B]/70 px-3 py-1.5 rounded">
              BARBER<span className="text-white/90">SHOP</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-full h-full border border-white/10 rounded"></div>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (!selectedUser?.id) return;
          
          try {
            await deleteBarber(selectedUser.id);
            toast.success('Barbeiro excluído com sucesso!', {
              style: {
                fontSize: '12px',
                fontWeight: '500',
                borderRadius: '12px',
                padding: '16px',
                backgroundColor: '#F0FDF4',
                color: '#16A34A',
                border: '1px solid #BBF7D0'
              }
            });
          } catch (error) {
            toast.error('Erro ao excluir barbeiro', {
              style: {
                fontSize: '12px',
                fontWeight: '500',
                borderRadius: '12px',
                padding: '16px',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FECACA'
              }
            });
          } finally {
            setSelectedUser(null);
            setIsDeleteModalOpen(false);
          }
        }}
        barberName={selectedUser?.name || ''}
      />

      <EditConfirmationModal
        isOpen={isEditConfirmModalOpen}
        onClose={() => setIsEditConfirmModalOpen(false)}
        onConfirm={() => {
          prepareEditForm(selectedUser);
          setIsEditConfirmModalOpen(false);
        }}
        barberName={selectedUser?.name || ''}
      />

      <PasswordConfirmationModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onConfirm={handleConfirmUpdate}
      />

      {/* Header com navegação */}
      <div className="flex justify-between items-center mb-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 mt-2 relative z-10">
        <h1 className="text-2xl font-semibold text-white">Cadastro de Barbeiros</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#F0B35B] hover:text-black transition-colors duration-300 flex items-center justify-center gap-1.5 text-sm font-medium border border-[#F0B35B]/30 shadow-lg"
          title="Voltar para o Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </motion.button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto relative z-10">
        <div className="w-full md:flex-1">
          <div className="w-full space-y-6 bg-[#1A1F2E] p-6 sm:p-8 rounded-lg shadow-xl h-fit mx-auto">
            <div>
              <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-white">
                {isEditMode ? 'Editar Barbeiro' : 'Cadastro'}
              </h2>
              <p className="mt-2 text-center text-sm text-gray-400">
                {isEditMode ? 'Edite os dados do barbeiro' : 'Cadastre um novo Barbeiro'}
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 text-green-500 p-3 rounded-md text-sm">
                  {success}
                </div>
              )}

              {editSuccess && (
                <div className="bg-green-500/10 text-green-500 p-3 rounded-md text-sm">
                  {editSuccess}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col">
                  <label htmlFor="name" className="text-sm font-medium text-gray-300 mb-1">Nome</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="block w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-shadow transition-colors text-base sm:text-sm"
                    placeholder="Digite o nome"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                {!isEditMode && (
                  <>
                    <div className="flex flex-col">
                      <label htmlFor="username" className="text-sm font-medium text-gray-300 mb-1">Usuário</label>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        className="block w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-shadow transition-colors sm:text-sm"
                        placeholder="Digite o usuário"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="password" className="text-sm font-medium text-gray-300 mb-1">Senha</label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="block w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-shadow transition-colors sm:text-sm"
                        placeholder="Digite a senha"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </>
                )}
                <div className="flex flex-col">
                  <label htmlFor="whatsapp" className="text-sm font-medium text-gray-300 mb-1">WhatsApp</label>
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    type="text"
                    required
                    className="block w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-shadow transition-colors sm:text-sm"
                    placeholder="Digite o WhatsApp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="pix" className="text-sm font-medium text-gray-300 mb-1">PIX</label>
                  <input
                    id="pix"
                    name="pix"
                    type="text"
                    required
                    className="block w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-shadow transition-colors sm:text-sm"
                    placeholder="Digite a chave PIX"
                    value={formData.pix}
                    onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-[#F0B35B] to-[#F0B35B]/80 text-black font-semibold rounded-lg shadow-md transform transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2 text-white" /> : isEditMode ? 'Atualizar Barbeiro' : 'Cadastrar Barbeiro'}
                </button>
              </div>

              <div className="text-center space-y-2">
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setSelectedUser(null);
                      setFormData({
                        name: '',
                        username: '',
                        password: '',
                        whatsapp: '',
                        pix: ''
                      });
                    }}
                    className="w-full text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        <div className="w-full md:flex-1 order-first">
          <div className="w-full space-y-6 bg-[#1A1F2E] p-6 sm:p-8 rounded-lg shadow-xl h-fit mx-auto">
            <h2 className="text-center text-xl sm:text-2xl font-bold text-white">Barbeiros Cadastrados</h2>



            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="hidden sm:table-header-group">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usuário</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {barbers.map((user: any) => (
                    <tr key={user.id} className="hover:bg-[#252B3B] transition-colors">
                      <td className="px-6 sm:px-6 py-4 whitespace-nowrap text-white">{user.name}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-white">{user.username}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-500 hover:text-blue-600 transition-colors"
                          >
                            <Edit size={22} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="text-red-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={22} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;