import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import { getCurrentBarbershop } from '../services/BarbershopService';
import { Loader2 } from 'lucide-react';
import { logger } from '../utils/logger';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { loadTenant } = useTenant();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });

  // Redirecionar se o usuário já estiver autenticado
  useAuthRedirect();

  // Remover a lógica de salvar username - agora o checkbox controla persistência de login

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!formData.username || !formData.password) {
        setError('Por favor, preencha todos os campos');
        return;
      }

      const result = await login({ email: formData.username, password: formData.password });

      if (result.success) {
        try {
          // After successful login, load tenant context and redirect to tenant dashboard
          logger.componentInfo('LoginPage', 'Login successful, loading tenant context');

          const barbershopData = await getCurrentBarbershop();

          if (barbershopData && barbershopData.slug) {
            // Load tenant context
            await loadTenant(barbershopData.slug);

            // Redirect to tenant-aware dashboard
            logger.componentInfo('LoginPage', `Redirecting to tenant dashboard: /app/${barbershopData.slug}/dashboard`);
            navigate(`/app/${barbershopData.slug}/dashboard`, { replace: true });
          } else {
            // No barbershop found, redirect to registration
            logger.componentWarn('LoginPage', 'No barbershop found for user, redirecting to registration');
            navigate('/register-barbershop', { replace: true });
          }
        } catch (tenantError) {
          logger.componentError('LoginPage', 'Failed to load tenant context after login:', tenantError);

          // Se o erro for que o usuário não tem barbearia, redirecionar para registro
          if (tenantError instanceof Error && tenantError.message.includes('não possui barbearia')) {
            logger.componentInfo('LoginPage', 'User has no barbershop, redirecting to registration');
            navigate('/register-barbershop', { replace: true });
          } else {
            // Para outros erros, também redirecionar para registro como fallback
            logger.componentWarn('LoginPage', 'Error loading tenant, redirecting to registration as fallback');
            navigate('/register-barbershop', { replace: true });
          }
        }
      } else {
        setError(result.error || 'Email ou senha incorretos');
      }
    } catch (err: unknown) {
      console.error('Erro durante o login:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.'
      );
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
      <div onClick={() => navigate('/')} className="absolute top-8 left-1/2 -translate-x-1/2 cursor-pointer z-20">
        <div className="transform hover:scale-110 transition-transform duration-300">
          <div className="inline-block relative">
            <div className="text-[#F0B35B] text-xl font-medium tracking-wider border border-[#F0B35B]/70 px-3 py-1.5 rounded">
              BARBER<span className="text-white/90">SHOP</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-full h-full border border-white/10 rounded"></div>
          </div>
        </div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-[#1A1F2E] p-8 shadow-xl relative z-10">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            BarberShop
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Faça login para acessar o painel
          </p>

          {/* Mensagem exclusiva para barbeiros */}
          <div className="mt-4 p-3 bg-[#F0B35B]/10 border border-[#F0B35B]/30 rounded-lg">
            <p className="text-center text-sm text-[#F0B35B] font-medium">
              🔒 Acesso exclusivo para barbeiros
            </p>
            <p className="text-center text-xs text-gray-400 mt-1">
              Esta área é restrita aos profissionais cadastrados
            </p>
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                username
              </label>
              <input
                id="username"
                name="username"
                type="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] rounded-t-md focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
                placeholder="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] rounded-b-md focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#F0B35B] focus:ring-[#F0B35B] border-gray-700 rounded bg-[#0D121E]"
                checked={formData.rememberMe}
                onChange={(e) =>
                  setFormData({ ...formData, rememberMe: e.target.checked })
                }
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                Manter conectado
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-[#F0B35B] hover:bg-[#F0B35B]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F0B35B] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                'Entrar'
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/verify-email')}
              className="group relative w-full flex justify-center py-2 px-4 border border-[#F0B35B] text-sm font-medium rounded-md text-[#F0B35B] bg-transparent hover:bg-[#F0B35B]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F0B35B] transition-all duration-200"
            >
              Começar Grátis
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/verify-email')}
                className="text-[#F0B35B] hover:text-[#F0B35B]/80 text-sm font-medium transition-colors"
              >
                Não tem uma barbearia? Crie sua conta
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;