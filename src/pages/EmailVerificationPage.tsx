import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Mail, CheckCircle, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { initiateEmailVerification } from '../services/BarbershopService';

interface LocationState {
  email?: string;
  barbershopName?: string;
}

const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [linkSent, setLinkSent] = useState(false);

  // Email step state
  const [email, setEmail] = useState(state?.email || '');
  const [barbershopName, setBarbershopName] = useState(state?.barbershopName || '');

  // Redirect if already verified
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
      const email = urlParams.get('email');
      const barbershop = urlParams.get('barbershop');
      if (email && barbershop) {
        navigate('/register-barbershop', {
          state: {
            email: email,
            barbershopName: barbershop,
            emailVerified: true
          }
        });
      }
    }
  }, [navigate]);



  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !barbershopName.trim()) {
      setError('Email e nome da barbearia são obrigatórios');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Formato de email inválido');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await initiateEmailVerification({
        email: email.trim().toLowerCase(),
        barbershopName: barbershopName.trim()
      });

      setSuccess('Link de verificação enviado para seu email! Verifique sua caixa de entrada e clique no link para continuar.');
      setLinkSent(true);

    } catch (err: unknown) {
      console.error('Erro ao enviar código:', err);
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };



  const handleResendLink = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await initiateEmailVerification({
        email: email.toLowerCase(),
        barbershopName
      });

      setSuccess('Novo link enviado para seu email!');

    } catch (err: unknown) {
      console.error('Erro ao reenviar link:', err);
      setError(err instanceof Error ? err.message : 'Erro ao reenviar link.');
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

      <div className="max-w-md w-full space-y-8 bg-[#1A1F2E] p-8 shadow-xl relative z-10 rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-[#F0B35B]/20 rounded-full">
              <Mail className="w-8 h-8 text-[#F0B35B]" />
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              {linkSent ? 'Link Enviado!' : 'Verificar Email'}
            </h2>
          </div>
          <p className="text-gray-400">
            {linkSent
              ? `Enviamos um link de verificação para ${email}. Clique no link para continuar o cadastro.`
              : 'Vamos verificar seu email antes de criar sua barbearia. É rápido e gratuito!'
            }
          </p>

          {!linkSent && (
            <div className="mt-6 p-4 bg-[#F0B35B]/10 border border-[#F0B35B]/20 rounded-lg">
              <h3 className="text-[#F0B35B] font-semibold mb-2">🎉 Comece grátis hoje mesmo!</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>✓ Plano gratuito: 1 barbeiro, 20 agendamentos/mês</li>
                <li>✓ Sistema completo de agendamentos</li>
                <li>✓ Página personalizada para sua barbearia</li>
                <li>✓ Sem compromisso, cancele quando quiser</li>
              </ul>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {!linkSent ? (
          <form className="space-y-6" onSubmit={handleSendCode}>
            <div>
              <label htmlFor="barbershopName" className="block text-sm font-medium text-gray-300 mb-2">
                Nome da Barbearia *
              </label>
              <input
                id="barbershopName"
                name="barbershopName"
                type="text"
                required
                className="block w-full px-4 py-3 border border-gray-600 rounded-lg bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-all duration-200"
                placeholder="Ex: Barbearia do João"
                value={barbershopName}
                onChange={(e) => setBarbershopName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-all duration-200"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-black bg-[#F0B35B] hover:bg-[#F0B35B]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F0B35B] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5 mr-2" />
                    Enviar Link de Verificação
                  </>
                )}
              </button>

              <div className="text-center">
                {/* DEV BYPASS BUTTON */}
                {import.meta.env.DEV && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/register-barbershop', {
                        state: {
                          email: email,
                          barbershopName: barbershopName,
                          emailVerified: true
                        }
                      });
                    }}
                    className="mb-4 text-xs bg-purple-900/50 text-purple-300 px-3 py-1 rounded border border-purple-500/30 hover:bg-purple-900/80 transition-colors"
                  >
                    [DEV] Bypass Verificação
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-[#F0B35B] hover:text-[#F0B35B]/80 text-sm font-medium transition-colors"
                >
                  Já tem uma conta? Faça login
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-400 font-medium">Link enviado com sucesso!</p>
                <p className="text-sm text-gray-400 mt-2">
                  Verifique sua caixa de entrada e pasta de spam.
                </p>
              </div>

              <div className="bg-[#F0B35B]/10 border border-[#F0B35B]/20 rounded-lg p-4 mb-4">
                <h4 className="text-[#F0B35B] font-semibold mb-2">📧 Próximos passos:</h4>
                <ol className="text-sm text-gray-300 space-y-1 text-left">
                  <li>1. Abra seu email ({email})</li>
                  <li>2. Clique no link de verificação</li>
                  <li>3. Complete o cadastro da sua barbearia</li>
                </ol>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleResendLink}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-3 border border-[#F0B35B] text-sm font-medium rounded-lg text-[#F0B35B] hover:bg-[#F0B35B] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F0B35B] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Reenviar Link
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLinkSent(false);
                  setError('');
                  setSuccess('');
                }}
                className="inline-flex items-center justify-center text-sm text-gray-400 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Alterar dados
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;