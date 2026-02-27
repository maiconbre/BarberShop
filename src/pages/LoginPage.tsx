import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import { getCurrentBarbershop } from '../services/BarbershopService';
import { Loader2, User, Lock, ArrowRight } from 'lucide-react';
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
        <div onClick={() => navigate('/')} className="mx-auto mb-8 flex max-w-6xl justify-center cursor-pointer">
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
              ◈ Área do Cliente
            </div>
            <h2 className="text-3xl font-semibold text-white">Bem-vindo de volta</h2>
            <p className="mt-2 text-sm text-gray-400">Faça login para acessar o painel</p>

            {/* Mensagem exclusiva para barbeiros */}
            <div className="mt-4 p-3 bg-[#F0B35B]/10 border border-[#F0B35B]/20 rounded-lg text-xs text-[#F0B35B]">
              🔒 Acesso exclusivo para barbeiros
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl border border-red-700/40 bg-red-900/20 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Usuário ou Email</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="username"
                    required
                    className="block w-full rounded-lg border border-[#2a2a2a] bg-[#141414] pl-10 pr-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-[#F5A623] sm:text-sm"
                    placeholder="Seu usuário"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
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
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full rounded-lg border border-[#2a2a2a] bg-[#141414] pl-10 pr-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-[#F5A623] sm:text-sm"
                    placeholder="Sua senha"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-600 bg-[#141414] text-[#F5A623] focus:ring-[#F5A623] focus:ring-offset-[#141414]"
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3 text-sm font-semibold text-black hover:bg-[#d4891a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    Entrar <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2a2a2a]"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#141414] px-2 text-xs text-gray-500">OU</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/verify-email')}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2a2a2a] bg-transparent px-6 py-3 text-sm font-semibold text-gray-300 hover:border-[#3a3a3a] hover:text-white transition-colors"
              >
                Criar Nova Conta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;