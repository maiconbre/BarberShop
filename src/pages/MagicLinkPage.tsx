import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { supabase } from '../config/supabaseConfig';

const MagicLinkPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleMagicLink = async () => {
      try {
        // Verificar se há parâmetros de autenticação na URL
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        
        if (type === 'signup' && accessToken && refreshToken) {
          // Definir a sessão do usuário
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Erro ao definir sessão:', error);
            setStatus('error');
            setMessage('Erro ao processar link de verificação. Tente novamente.');
            return;
          }

          if (data.user) {
            // Obter dados do usuário dos metadados
            const barbershopName = data.user.user_metadata?.barbershop_name;
            const email = data.user.email;

            setStatus('success');
            setMessage('Email verificado com sucesso! Redirecionando para completar o cadastro...');

            // Redirecionar para a página de registro com os dados
            setTimeout(() => {
              navigate('/register-barbershop', {
                state: {
                  email: email,
                  barbershopName: barbershopName,
                  emailVerified: true
                }
              });
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Não foi possível verificar o usuário. Tente novamente.');
          }
        } else {
          // Verificar se há dados na URL para fallback
          const email = searchParams.get('email');
          const barbershop = searchParams.get('barbershop');
          const verified = searchParams.get('verified');

          if (email && barbershop && verified === 'true') {
            setStatus('success');
            setMessage('Email verificado! Redirecionando para completar o cadastro...');

            setTimeout(() => {
              navigate('/register-barbershop', {
                state: {
                  email: email,
                  barbershopName: barbershop,
                  emailVerified: true
                }
              });
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Link de verificação inválido ou expirado. Tente solicitar um novo link.');
          }
        }
      } catch (error) {
        console.error('Erro ao processar magic link:', error);
        setStatus('error');
        setMessage('Erro inesperado. Tente novamente.');
      }
    };

    handleMagicLink();
  }, [searchParams, navigate]);

  const handleBackToVerification = () => {
    navigate('/verify-email');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D121E] via-[#1A1F2E] to-[#0D121E] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#F0B35B]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#F0B35B]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-[#F0B35B]/10 rounded-full">
          <div className="absolute inset-4 border border-[#F0B35B]/5 rounded-full">
            <div className="absolute -bottom-0.5 -right-0.5 w-full h-full border border-white/10 rounded"></div>
          </div>
        </div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-[#1A1F2E] p-8 shadow-xl relative z-10 rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-[#F0B35B]/20 rounded-full">
              {status === 'loading' && <Loader2 className="w-8 h-8 text-[#F0B35B] animate-spin" />}
              {status === 'success' && <CheckCircle className="w-8 h-8 text-green-400" />}
              {status === 'error' && <AlertCircle className="w-8 h-8 text-red-400" />}
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              {status === 'loading' && 'Verificando Email'}
              {status === 'success' && 'Email Verificado!'}
              {status === 'error' && 'Erro na Verificação'}
            </h2>
          </div>
          
          <p className="text-gray-400 mb-6">
            {message}
          </p>

          {status === 'loading' && (
            <div className="flex items-center justify-center space-x-2 text-[#F0B35B]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processando link de verificação...</span>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg">
              <CheckCircle className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm">Você será redirecionado automaticamente em alguns segundos.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
                <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm">Verifique se o link está correto ou solicite um novo.</p>
              </div>
              
              <button
                onClick={handleBackToVerification}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-[#F0B35B] hover:bg-[#E6A252] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F0B35B] transition-all duration-200"
              >
                <Mail className="w-5 h-5 mr-2" />
                Solicitar Novo Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MagicLinkPage;