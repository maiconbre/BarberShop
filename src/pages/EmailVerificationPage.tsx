import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Mail, CheckCircle, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { initiateEmailVerification, verifyEmailCode } from '../services/BarbershopService';

interface LocationState {
  email?: string;
  barbershopName?: string;
}

const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Email step state
  const [email, setEmail] = useState(state?.email || '');
  const [barbershopName, setBarbershopName] = useState(state?.barbershopName || '');
  
  // Code step state
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Timer for code expiration
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 'code' && timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, step]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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
      const response = await initiateEmailVerification({
        email: email.trim().toLowerCase(),
        barbershopName: barbershopName.trim()
      });

      setSuccess('Código enviado para seu email!');
      setTimeLeft(response.data.expiresIn);
      setCanResend(false);
      setStep('code');

    } catch (err: unknown) {
      console.error('Erro ao enviar código:', err);
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Código é obrigatório');
      return;
    }

    if (code.length !== 6) {
      setError('Código deve ter 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await verifyEmailCode({
        email: email.toLowerCase(),
        code: code.trim()
      });

      setSuccess('🎉 Email verificado com sucesso! Redirecionando para completar seu cadastro...');
      
      // Redirect to registration page with verified email
      setTimeout(() => {
        navigate('/register-barbershop', {
          state: {
            email: email.toLowerCase(),
            barbershopName,
            emailVerified: true
          }
        });
      }, 2000);

    } catch (err: unknown) {
      console.error('Erro ao verificar código:', err);
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setCanResend(false);
    setError('');
    setSuccess('');

    try {
      const response = await initiateEmailVerification({
        email: email.toLowerCase(),
        barbershopName
      });

      setSuccess('Novo código enviado!');
      setTimeLeft(response.data.expiresIn);
      setCode('');

    } catch (err: unknown) {
      console.error('Erro ao reenviar código:', err);
      setError(err instanceof Error ? err.message : 'Erro ao reenviar código.');
      setCanResend(true);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCode('');
    setTimeLeft(0);
    setCanResend(false);
    setError('');
    setSuccess('');
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
              {step === 'email' ? 'Verificar Email' : 'Confirmar Código'}
            </h2>
          </div>
          <p className="text-gray-400">
            {step === 'email' 
              ? 'Vamos verificar seu email antes de criar sua barbearia. É rápido e gratuito!'
              : `Enviamos um código de 6 dígitos para ${email}. Verifique sua caixa de entrada e spam.`
            }
          </p>
          
          {step === 'email' && (
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

        {step === 'email' ? (
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
                    Enviando código...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5 mr-2" />
                    Enviar Código
                  </>
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
            </div>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleVerifyCode}>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
                Código de Verificação *
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                maxLength={6}
                className="block w-full px-4 py-3 border border-gray-600 rounded-lg bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-all duration-200 text-center text-2xl tracking-widest"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              {timeLeft > 0 && (
                <p className="mt-2 text-sm text-gray-400 text-center">
                  Código expira em: <span className="text-[#F0B35B] font-mono">{formatTime(timeLeft)}</span>
                </p>
              )}
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-black bg-[#F0B35B] hover:bg-[#F0B35B]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F0B35B] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Verificar Código
                  </>
                )}
              </button>

              <div className="flex justify-between items-center text-sm">
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={!canResend}
                  className="text-[#F0B35B] hover:text-[#F0B35B]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reenviar código</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;