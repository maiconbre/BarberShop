import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';


const TrocaSenha: React.FC = () => {
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validações
      if (!formData.senhaAtual || !formData.novaSenha || !formData.confirmarSenha) {
        setError('Por favor, preencha todos os campos');
        return;
      }

      if (formData.novaSenha.length < 6) {
        setError('A nova senha deve ter pelo menos 6 caracteres');
        return;
      }

      if (formData.novaSenha !== formData.confirmarSenha) {
        setError('As senhas não coincidem');
        return;
      }

      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('Usuário não encontrado');
      }

      const response = await fetch('https://barber-backend-spm8.onrender.com/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({
          userId: currentUser.id,
          currentPassword: formData.senhaAtual,
          newPassword: formData.novaSenha
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao alterar senha');
      }

      // Atualizar o token de autenticação
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Atualizar informações do usuário no storage
      const updatedUser = { ...currentUser };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      sessionStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccess('Senha alterada com sucesso!');
      
      // Limpar formulário
      setFormData({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
      });

      // Redirecionar para o dashboard após 2 segundos
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);
      setError(err.message || 'Erro ao alterar senha. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D121E] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#F0B35B]/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse-slow"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-pulse-slow delay-1000"></div>
      
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

      <div className="max-w-md w-full space-y-8 bg-[#1A1F2E] p-8 rounded-lg shadow-xl relative z-10">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Alterar Senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Preencha os campos abaixo para alterar sua senha
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

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="senhaAtual" className="sr-only">Senha Atual</label>
              <input
                id="senhaAtual"
                name="senhaAtual"
                type="password"
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
                placeholder="Senha Atual"
                value={formData.senhaAtual}
                onChange={(e) => setFormData({ ...formData, senhaAtual: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="novaSenha" className="sr-only">Nova Senha</label>
              <input
                id="novaSenha"
                name="novaSenha"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
                placeholder="Nova Senha"
                value={formData.novaSenha}
                onChange={(e) => setFormData({ ...formData, novaSenha: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="confirmarSenha" className="sr-only">Confirmar Nova Senha</label>
              <input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                required
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
                placeholder="Confirmar Nova Senha"
                value={formData.confirmarSenha}
                onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-[#F0B35B] hover:bg-[#F0B35B]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F0B35B] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                'Alterar Senha'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-[#F0B35B] hover:text-[#F0B35B]/80 text-sm"
            >
              Voltar para o Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrocaSenha;