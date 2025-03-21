import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Trash2, Edit, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import EditConfirmationModal from '../components/EditConfirmationModal';

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
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/auth/verify-admin`, {
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
  const [users, setUsers] = useState([]);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditConfirmModalOpen, setIsEditConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/barbers`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    }
  };

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

      // Criar novo barbeiro
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/barbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          username: formData.username.trim(),
          password: formData.password,
          whatsapp: cleanWhatsapp,
          pix: formData.pix.trim(),
          role: 'barber'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao criar conta');
      }

      // Mostrar mensagem de sucesso
      setSuccess('Barbeiro cadastrado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);

      // Limpar o formulário
      setFormData({
        name: '',
        username: '',
        password: '',
        whatsapp: '',
        pix: ''
      });
      // Atualizar a lista de usuários
      fetchUsers();
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

      // Atualizar barbeiro existente
      const updateData: any = {
        name: formData.name.trim(),
        whatsapp: cleanWhatsapp,
        pix: formData.pix.trim(),
        password: password // Usar a senha fornecida no modal
      };

      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/barbers/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao atualizar barbeiro');
      }

      setEditSuccess('Barbeiro atualizado com sucesso!');
      setTimeout(() => setEditSuccess(''), 3000);

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

      // Atualizar a lista de usuários
      await fetchUsers();

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

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/barbers/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      });

      if (response.ok) {
        setDeleteSuccess('Usuário e seus agendamentos foram excluídos com sucesso!');
        fetchUsers();
        setTimeout(() => setDeleteSuccess(''), 3000);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao excluir usuário');
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao excluir usuário');
      setTimeout(() => setDeleteError(''), 3000);
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    }
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
        onConfirm={confirmDelete}
        barberName={selectedUser?.name || ''}
      />

      <EditConfirmationModal
        isOpen={isEditConfirmModalOpen}
        onClose={() => setIsEditConfirmModalOpen(false)}
        onConfirm={() => prepareEditForm(selectedUser)}
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

              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="name" className="sr-only">Nome</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className={`appearance-none ${!isEditMode ? 'rounded-t-md' : 'rounded-t-md'} relative block w-full px-3 py-3 sm:py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 text-base sm:text-sm`}
                    placeholder="Nome"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                {!isEditMode && (
                  <>
                    <div>
                      <label htmlFor="username" className="sr-only">username</label>
                      <input
                        id="username"
                        name="username"
                        type="username"
                        required
                        className="appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
                        placeholder="Usuário"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="sr-only">Senha</label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
                        placeholder="Senha"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label htmlFor="whatsapp" className="sr-only">WhatsApp</label>
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
                    placeholder="WhatsApp (ex: 21999999999)"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="pix" className="sr-only">PIX</label>
                  <input
                    id="pix"
                    name="pix"
                    type="text"
                    required
                    className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
                    placeholder="Chave PIX"
                    value={formData.pix}
                    onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent text-base sm:text-sm font-medium rounded-md text-black bg-[#F0B35B] hover:bg-[#F0B35B]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F0B35B] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    isEditMode ? 'Atualizar barbeiro' : 'Criar conta'
                  )}
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#F0B35B] hover:text-black transition-colors duration-300 flex items-center justify-center gap-2 font-medium border border-[#F0B35B]/30 shadow-lg"
                  title="Voltar para o Dashboard"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Voltar</span>
                </motion.button>
              </div>
            </form>
          </div>
        </div>



        <div className="w-full md:flex-1 order-first">
          <div className="w-full space-y-6 bg-[#1A1F2E] p-6 sm:p-8 rounded-lg shadow-xl h-fit mx-auto">
            <h2 className="text-center text-xl sm:text-2xl font-bold text-white">Barbeiros Cadastrados</h2>

            {deleteSuccess && (
              <div className="bg-green-500/10 text-green-500 p-3 rounded-md text-sm">
                {deleteSuccess}
              </div>
            )}

            {deleteError && (
              <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm">
                {deleteError}
              </div>
            )}

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
                  {users.map((user: any) => (
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