import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBarbershopNavigation } from '../hooks/useBarbershopNavigation';
import toast from 'react-hot-toast';
import StandardLayout from '../components/layout/StandardLayout';

const TrocaSenha: React.FC = () => {
  const { getCurrentUser, updatePassword } = useAuth();
  const { goToDashboard } = useBarbershopNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validações
      if (!formData.senhaAtual || !formData.novaSenha || !formData.confirmarSenha) {
        toast.error('Por favor, preencha todos os campos', {
          duration: 4000,
          style: {
            background: '#1A1F2E',
            color: '#fff',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '12px',
            fontWeight: '500'
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#1A1F2E'
          }
        });
        return;
      }

      if (formData.novaSenha.length < 6) {
        toast.error('A nova senha deve ter pelo menos 6 caracteres', {
          duration: 4000,
          style: {
            background: '#1A1F2E',
            color: '#fff',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '12px',
            fontWeight: '500'
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#1A1F2E'
          }
        });
        return;
      }

      if (formData.novaSenha !== formData.confirmarSenha) {
        toast.error('As senhas não coincidem', {
          duration: 4000,
          style: {
            background: '#1A1F2E',
            color: '#fff',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '12px',
            fontWeight: '500'
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#1A1F2E'
          }
        });
        return;
      }

      const currentUser = getCurrentUser();
      if (!currentUser || typeof currentUser !== 'object' || !('id' in currentUser)) {
        throw new Error('Usuário não encontrado');
      }

      const result = await updatePassword(formData.novaSenha);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao alterar senha');
      }

      // Notificação visual elaborada para sucesso
      toast.success('Senha alterada com sucesso!', {
        duration: 4000,
        style: {
          background: '#1A1F2E',
          color: '#fff',
          border: '1px solid #F0B35B',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '12px',
          fontWeight: '500'
        },
        iconTheme: {
          primary: '#F0B35B',
          secondary: '#1A1F2E'
        }
      });
      
      // Limpar formulário
      setFormData({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
      });

      // Redirecionar para o dashboard após 2 segundos
      setTimeout(() => {
        goToDashboard();
      }, 2000);
    } catch (err: unknown) {
      console.error('Erro ao alterar senha:', err);
      
      // Notificação visual de erro
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar senha. Por favor, tente novamente.', {
        duration: 4000,
        style: {
          background: '#1A1F2E',
          color: '#fff',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '12px',
          fontWeight: '500'
        },
        iconTheme: {
          primary: '#ef4444',
          secondary: '#1A1F2E'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StandardLayout>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center mb-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-[#F0B35B] to-[#E6A555] rounded-full flex items-center justify-center shadow-lg">
              <Lock className="w-8 h-8 text-black" />
            </div>
          </motion.div>
        </div>

        <div className="bg-[#1A1F2E] p-8 shadow-xl">

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>

            <div className="space-y-4">
              <div className="flex flex-col">
                <label htmlFor="senhaAtual" className="text-sm font-medium text-gray-300 mb-1">Senha Atual</label>
                <input
                  id="senhaAtual"
                  name="senhaAtual"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-shadow transition-colors"
                  placeholder="Digite sua senha atual"
                  value={formData.senhaAtual}
                  onChange={(e) => setFormData({ ...formData, senhaAtual: e.target.value })}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="novaSenha" className="text-sm font-medium text-gray-300 mb-1">Nova Senha</label>
                <input
                  id="novaSenha"
                  name="novaSenha"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-shadow transition-colors"
                  placeholder="Digite a nova senha"
                  value={formData.novaSenha}
                  onChange={(e) => setFormData({ ...formData, novaSenha: e.target.value })}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="confirmarSenha" className="text-sm font-medium text-gray-300 mb-1">Confirmar Senha</label>
                <input
                  id="confirmarSenha"
                  name="confirmarSenha"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-shadow transition-colors"
                  placeholder="Confirme a nova senha"
                  value={formData.confirmarSenha}
                  onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-[#F0B35B] to-[#F0B35B]/80 text-black font-semibold rounded-lg shadow-md transform transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <CheckCircle className="animate-spin h-5 w-5 mr-2 text-white" />
                ) : (
                  'Alterar Senha'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </StandardLayout>
  );
};

export default TrocaSenha;