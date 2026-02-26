import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTenant } from '../contexts/TenantContext';
import { usePlan } from '../hooks/usePlan';
import { PLAN_FEATURES, PLAN_PRICES } from '../types/plan';
import { formatCurrency } from '../services/PlanService';
import toast from 'react-hot-toast';

const UpgradePage: React.FC = () => {
  const navigate = useNavigate();
  const { barbershopSlug } = useParams();
  const { barbershopData, loading: tenantLoading } = useTenant();
  const { planInfo, usage, upgradePlan, loading: planLoading } = usePlan();
  
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'processing' | 'success'>('selection');

  // Redirect if already on Pro plan
  useEffect(() => {
    if (planInfo && planInfo.planType === 'pro') {
      toast.success('Você já possui o Plano Pro!');
      navigate(`/app/${barbershopSlug}/dashboard`);
    }
  }, [planInfo, barbershopSlug, navigate]);

  const handleUpgrade = async () => {
    try {
      setIsProcessingPayment(true);
      setPaymentStep('processing');

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Call the upgrade service
      await upgradePlan({ planType: 'pro' });

      setPaymentStep('success');
      
      toast.success('🎉 Upgrade realizado com sucesso!');
      
      // Redirect to dashboard after success
      setTimeout(() => {
        navigate(`/app/${barbershopSlug}/dashboard`);
      }, 2000);

    } catch (error) {
      console.error('Erro no upgrade:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
      setPaymentStep('selection');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate(`/app/${barbershopSlug}/dashboard`);
  };

  if (tenantLoading || planLoading) {
    return (
      <div className="min-h-screen bg-[#0D121E] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F0B35B] mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando informações do plano...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D121E] text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Upgrade para Pro</h1>
              <p className="text-gray-400 mt-1">
                {barbershopData?.name} - Desbloqueie todo o potencial da sua barbearia
              </p>
            </div>
            <button
              onClick={handleBackToDashboard}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {paymentStep === 'selection' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Current Usage Alert */}
            {usage && (usage.upgradeRecommended || usage.upgradeRequired) && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="text-yellow-400 text-2xl">⚠️</div>
                  <div>
                    <h3 className="text-yellow-400 font-semibold text-lg mb-2">
                      {usage.upgradeRequired ? 'Upgrade Necessário' : 'Upgrade Recomendado'}
                    </h3>
                    <p className="text-yellow-300 mb-4">
                      {usage.upgradeRequired 
                        ? 'Você atingiu os limites do plano gratuito e precisa fazer upgrade para continuar.'
                        : 'Você está próximo dos limites do plano gratuito. Considere fazer upgrade para evitar interrupções.'
                      }
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-yellow-500/5 rounded-lg p-3">
                        <div className="text-yellow-300 font-medium">Barbeiros</div>
                        <div className="text-yellow-200">
                          {usage.usage?.barbers?.current || 0}/{usage.usage?.barbers?.limit || 0}
                        </div>
                      </div>
                      <div className="bg-yellow-500/5 rounded-lg p-3">
                        <div className="text-yellow-300 font-medium">Agendamentos/mês</div>
                        <div className="text-yellow-200">
                          {usage.usage?.appointments?.current || 0}/{usage.usage?.appointments?.limit || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Plan Comparison */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Free Plan */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">Plano Gratuito</h3>
                  <div className="text-3xl font-bold text-gray-400">
                    {formatCurrency(PLAN_PRICES.free)}
                  </div>
                  <p className="text-gray-500 text-sm">Atual</p>
                </div>
                
                <ul className="space-y-3">
                  {PLAN_FEATURES.map((feature, index) => (
                    <li key={index} className="flex items-center justify-between">
                      <span className="text-gray-300">{feature.name}</span>
                      <span className="text-gray-400 font-medium">
                        {typeof feature.free === 'boolean' 
                          ? (feature.free ? '✓' : '✗')
                          : feature.free
                        }
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro Plan */}
              <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-lg p-6 border border-purple-500/30 relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    ⭐ Recomendado
                  </span>
                </div>
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Plano Pro</h3>
                  <div className="text-3xl font-bold text-white">
                    {formatCurrency(PLAN_PRICES.pro)}
                  </div>
                  <p className="text-purple-300 text-sm">por mês</p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {PLAN_FEATURES.map((feature, index) => (
                    <li key={index} className="flex items-center justify-between">
                      <span className="text-white">{feature.name}</span>
                      <span className={`font-medium ${feature.highlight ? 'text-purple-300' : 'text-gray-300'}`}>
                        {typeof feature.pro === 'boolean' 
                          ? (feature.pro ? '✓' : '✗')
                          : feature.pro
                        }
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleUpgrade}
                  disabled={isProcessingPayment}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                >
                  {isProcessingPayment ? 'Processando...' : 'Fazer Upgrade Agora'}
                </button>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">
                🚀 Por que fazer upgrade?
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">👨‍💼</div>
                  <h4 className="font-semibold text-white mb-2">Barbeiros Ilimitados</h4>
                  <p className="text-gray-400 text-sm">
                    Adicione quantos barbeiros precisar para sua equipe
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">📅</div>
                  <h4 className="font-semibold text-white mb-2">Agendamentos Ilimitados</h4>
                  <p className="text-gray-400 text-sm">
                    Sem limites mensais para seus agendamentos
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">🎯</div>
                  <h4 className="font-semibold text-white mb-2">Suporte Prioritário</h4>
                  <p className="text-gray-400 text-sm">
                    Atendimento rápido e personalizado
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-blue-400 text-2xl">💳</div>
                <div>
                  <h4 className="text-blue-400 font-semibold mb-2">Pagamento Seguro</h4>
                  <p className="text-blue-300 text-sm mb-3">
                    Processamento seguro via Mercado Pago. Você pode cancelar a qualquer momento.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-blue-300">
                    <span>🔒 SSL Seguro</span>
                    <span>💳 Cartão ou PIX</span>
                    <span>🔄 Cancele quando quiser</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {paymentStep === 'processing' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Processando Pagamento...
              </h3>
              <p className="text-gray-400 mb-6">
                Aguarde enquanto processamos seu pagamento via Mercado Pago
              </p>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <p className="text-purple-300 text-sm">
                  🔒 Transação segura em andamento
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {paymentStep === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-8 max-w-md mx-auto">
              <div className="text-6xl mb-6">🎉</div>
              <h3 className="text-2xl font-bold text-green-400 mb-4">
                Upgrade Realizado!
              </h3>
              <p className="text-green-300 mb-6">
                Parabéns! Sua barbearia agora possui o Plano Pro com todos os recursos liberados.
              </p>
              <div className="bg-green-500/10 rounded-lg p-4 mb-6">
                <h4 className="text-green-400 font-semibold mb-2">Recursos Liberados:</h4>
                <ul className="text-green-300 text-sm space-y-1">
                  <li>✓ Barbeiros ilimitados</li>
                  <li>✓ Agendamentos ilimitados</li>
                  <li>✓ Suporte prioritário</li>
                  <li>✓ Relatórios avançados</li>
                </ul>
              </div>
              <p className="text-gray-400 text-sm">
                Redirecionando para o dashboard...
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UpgradePage;