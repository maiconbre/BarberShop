import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail, Lock, User, Store, ArrowRight } from 'lucide-react';
import { registerUser } from '../services/BarbershopService';

const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    barbershopName: '',
    ownerName: '',
    username: '',
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Criar Usuário
      const response = await registerUser({
        ownerName: formData.ownerName,
        ownerUsername: formData.username,
        ownerEmail: formData.email,
        ownerPassword: formData.password
      });

      // 2. Se sucesso, ir para passo 2 (Barbershop Setup) com user logado
      if (response.user) {
        navigate('/register-barbershop', {
          state: {
            barbershopName: formData.barbershopName, // Passar nome para pré-preencher
            step: 2 // Flag para indicar que é o passo 2
          }
        });
      }

    } catch (err: any) {
      console.error('Erro no registro:', err);
      let msg = err.message || 'Erro ao criar conta.';
      if (msg === 'Failed to fetch') msg = 'Erro de conexão com o servidor. Verifique se o Supabase está acessível.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D121E] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Elementos decorativos (Mantidos) */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#F0B35B]/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse-slow"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-pulse-slow delay-1000"></div>

      {/* Logo clicável */}
      <div onClick={() => navigate('/')} className="absolute top-8 left-1/2 -translate-x-1/2 cursor-pointer z-20">
        <div className="transform hover:scale-110 transition-transform duration-300">
          <div className="inline-block relative">
            <div className="text-[#F0B35B] text-xl font-medium tracking-wider border border-[#F0B35B]/70 px-3 py-1.5 rounded">
              BARBER<span className="text-white/90">SHOP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-[#1A1F2E] p-8 shadow-xl relative z-10 rounded-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white">Criar Conta</h2>
          <p className="mt-2 text-sm text-gray-400">Passo 1 de 2: Seus dados de acesso</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nome da Barbearia</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Store className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="barbershopName"
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] sm:text-sm"
                  placeholder="Ex: Barbearia do João"
                  value={formData.barbershopName}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Seu Nome</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="ownerName"
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] sm:text-sm"
                  placeholder="Seu nome"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Usuário (Login)</label>
                <input
                  name="username"
                  type="text"
                  required
                  className="block w-full px-3 py-2 border border-gray-600 rounded-md leading-5 bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] sm:text-sm"
                  placeholder="usuario"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] sm:text-sm"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-10 py-2 border border-gray-600 rounded-md leading-5 bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] sm:text-sm"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <span className="text-xs text-gray-400">Ocultar</span> : <span className="text-xs text-gray-400">Ver</span>}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-[#F0B35B] hover:bg-[#F0B35B]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F0B35B] disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <span className="flex items-center">
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[#F0B35B] hover:text-[#F0B35B]/80 text-sm font-medium transition-colors"
            >
              Já tem uma conta? Faça login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailVerificationPage;