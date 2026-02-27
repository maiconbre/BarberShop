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

    } catch (err: unknown) {
      console.error('Erro no registro:', err);
      let msg = 'Erro ao criar conta.';
      if (err instanceof Error && err.message) {
        msg = err.message;
      }
      if (msg === 'Failed to fetch') msg = 'Erro de conexão com o servidor. Verifique se o Supabase está acessível.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0f0f0f] text-white">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245,166,35,0.08) 0%, transparent 60%), url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 px-6 py-12">
        <div onClick={() => navigate('/')} className="mx-auto mb-8 flex max-w-6xl justify-center">
          <button className="flex items-center gap-3 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5A623] text-lg">
              ✂️
            </span>
            <span className="text-sm font-semibold tracking-[0.25em] text-white">BARBERSHOP</span>
          </button>
        </div>

        <div className="mx-auto max-w-md rounded-2xl border border-[#2a2a2a] bg-[#141414] p-6 shadow-xl">
          <div className="text-center">
            <div className="mb-4 inline-flex rounded-full border border-[#a86f12] bg-[#3a2a0f] px-4 py-1 text-[11px] uppercase tracking-[0.25em] text-[#F5A623]">
              ◈ Comece Grátis
            </div>
            <h2 className="text-3xl font-semibold text-white">Criar Conta</h2>
            <p className="mt-2 text-sm text-gray-400">Passo 1 de 2: Seus dados de acesso</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl border border-red-700/40 bg-red-900/20 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Nome da Barbearia</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Store className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="barbershopName"
                    type="text"
                    required
                    className="block w-full rounded-lg border border-[#2a2a2a] bg-[#141414] pl-10 pr-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-[#F5A623] sm:text-sm"
                    placeholder="Ex: Barbearia do João"
                    value={formData.barbershopName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Seu Nome</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="ownerName"
                    type="text"
                    required
                    className="block w-full rounded-lg border border-[#2a2a2a] bg-[#141414] pl-10 pr-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-[#F5A623] sm:text-sm"
                    placeholder="Seu nome"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Usuário (Login)</label>
                  <input
                    name="username"
                    type="text"
                    required
                    className="block w-full rounded-lg border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-[#F5A623] sm:text-sm"
                    placeholder="usuario"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Email</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    className="block w-full rounded-lg border border-[#2a2a2a] bg-[#141414] pl-10 pr-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-[#F5A623] sm:text-sm"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Senha</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full rounded-lg border border-[#2a2a2a] bg-[#141414] pl-10 pr-10 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-[#F5A623] sm:text-sm"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <div
                    className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-xs text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-xl bg-[#F5A623] px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#d4891a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
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
                className="text-[#F5A623] transition-colors hover:text-[#d4891a] text-sm font-medium"
              >
                Já tem uma conta? Faça login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
