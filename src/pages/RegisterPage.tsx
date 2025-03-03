import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  barberName: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, barberName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1F2E] p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4">Confirmar Exclusão</h3>
        <p className="text-gray-300 mb-6">
          Você está prestes a excluir o barbeiro <span className="font-semibold text-white">{barberName}</span>.
          Esta ação também removerá todos os agendamentos associados a este barbeiro.
          Esta ação não pode ser desfeita.
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

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    whatsapp: '',
    pix: ''
  });
  const [users, setUsers] = useState([]);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('https://barber-backend-spm8.onrender.com/api/barbers');
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
    setIsLoading(true);
    setError('');

    try {
      // Validações
      // Verificar se as senhas coincidem
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem. Por favor, verifique.');
        return;
      }

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
      
      // Criar novo barbeiro
      const response = await fetch('https://barber-backend-spm8.onrender.com/api/barbers', {
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
      // Limpar o formulário
      setFormData({
        name: '',
        username: '',
        password: '',
        confirmPassword: '',
        whatsapp: '',
        pix: ''
      });
      // Atualizar a lista de usuários
      fetchUsers();
      // Limpar a mensagem após 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error during registration:', err);
      setError(err.message || 'Erro inesperado ao criar conta. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`https://barber-backend-spm8.onrender.com/api/barbers/${selectedUser.id}`, {
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
    <div className="min-h-screen bg-[#0D121E] py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        barberName={selectedUser?.name || ''}
      />
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#1A1F2E] p-6 sm:p-8 rounded-lg shadow-xl h-fit">
            <h2 className="text-center text-xl sm:text-2xl font-bold text-white mb-6">Usuários Cadastrados</h2>
            
            {deleteSuccess && (
              <div className="bg-green-500/10 text-green-500 p-3 rounded-md text-sm mb-4">
                {deleteSuccess}
              </div>
            )}
            
            {deleteError && (
              <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm mb-4">
                {deleteError}
              </div>
            )}
            
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-[#252B3B]">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-[#1A1F2E] divide-y divide-gray-700">
                  {users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-[#252B3B] transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-white">{user.name}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-white">{user.username}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-white">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="text-red-500 hover:text-red-600 transition-colors p-2 hover:bg-red-500/10 rounded-full"
                          title="Excluir usuário"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#1A1F2E] p-6 sm:p-8 rounded-lg shadow-xl h-fit">
            <div className="mb-8">
              <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white">
                Cadastro
              </h2>
              <p className="mt-2 text-center text-sm text-gray-400">
                Cadastre um novo Barbeiro
              </p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
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
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] sm:text-sm"
                    placeholder="Nome completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-1">Usuário</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] sm:text-sm"
                    placeholder="Nome de usuário"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] sm:text-sm"
                    placeholder="Senha segura"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-1">Confirmar Senha</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] sm:text-sm"
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-400 mb-1">WhatsApp</label>
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] sm:text-sm"
                    placeholder="DDD + número (ex: 21999999999)"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="pix" className="block text-sm font-medium text-gray-400 mb-1">PIX</label>
                  <input
                    id="pix"
                    name="pix"
                    type="text"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] sm:text-sm"
                    placeholder="Sua chave PIX"
                    value={formData.pix}
                    onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-black bg-[#F0B35B] hover:bg-[#F0B35B]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F0B35B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    'Criar conta'
                  )}
                </button>
              </div>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="text-[#F0B35B] hover:text-[#F0B35B]/80 text-sm transition-colors duration-200"
                >
                  Voltar para o Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;