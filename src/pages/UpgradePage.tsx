import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenant } from '../contexts/TenantContext';
import { usePlan } from '../hooks/usePlan';
import { PLAN_FEATURES, PLAN_PRICES } from '../types/plan';
import { formatCurrency } from '../services/PlanService';
import toast from 'react-hot-toast';
import { Crown, Check, ArrowRight, Star, Zap, Shield, Users, Calendar, BarChart3, Clock } from 'lucide-react';

const UpgradePage: React.FC = () => {
  const navigate = useNavigate();
  const { barbershopSlug } = useParams();
  const { barbershopData, loading: tenantLoading } = useTenant();
  const { planInfo, usage, upgradePlan, loading: planLoading } = usePlan();

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'processing' | 'success'>('selection');

  // Redirect if already on Pro plan
  useEffect(() => {
    if (planInfo && planInfo.planType === 'pro' && paymentStep !== 'success') {
      toast.success('Você já possui o Plano Pro!');
      navigate(`/app/${barbershopSlug}/dashboard`);
    }
  }, [planInfo, barbershopSlug, navigate, paymentStep]);

  const handleUpgrade = async () => {
    try {
      setIsProcessingPayment(true);
      setPaymentStep('processing');

      // Simulate payment processing delay for a premium feel
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Call the upgrade service
      await upgradePlan({ planType: 'pro' });

      setPaymentStep('success');

      toast.success('🎉 Upgrade realizado com sucesso!');

      // Redirect to dashboard after success
      setTimeout(() => {
        navigate(`/app/${barbershopSlug}/dashboard`);
      }, 3000);

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
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#F0B35B] animate-spin"></div>
            <Crown className="absolute inset-0 m-auto w-8 h-8 text-[#F0B35B]" />
          </div>
          <p className="text-gray-400 animate-pulse font-medium">Sincronizando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D121E] text-white selection:bg-[#F0B35B]/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#F0B35B]/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-[#1A1F2E]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#F0B35B] to-[#E6A555] rounded-xl flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform">
              <Crown className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase italic">Upgrade <span className="text-[#F0B35B]">Premium</span></h1>
              <p className="text-gray-400 text-xs sm:text-sm font-medium">Eleve o nível da sua barbearia para o topo</p>
            </div>
          </div>
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-all text-sm font-bold bg-white/5 px-4 py-2 rounded-full hover:bg-white/10 border border-white/10"
          >
            Sair e voltar
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {paymentStep === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Introduction */}
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-block px-4 py-1 bg-[#F0B35B]/20 text-[#F0B35B] rounded-full text-xs font-black uppercase tracking-widest border border-[#F0B35B]/30"
                >
                  Exclusividade & Poder
                </motion.span>
                <h2 className="text-3xl sm:text-5xl font-black leading-tight">Chegou a hora de dar o <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F0B35B] to-orange-500">próximo passo</span>.</h2>
                <p className="text-gray-400 text-lg">Gerencie sua equipe completa, atraia mais clientes e escale seu faturamento sem limites.</p>
              </div>

              {/* Comparison Section */}
              <div className="grid lg:grid-cols-5 gap-0 items-center justify-center bg-[#1A1F2E]/40 border border-white/5 rounded-[2.5rem] p-4 sm:p-8 backdrop-blur-sm shadow-2xl">

                {/* Free Plan Summary */}
                <div className="lg:col-span-2 p-8 space-y-8 bg-black/20 rounded-[2rem] border border-white/5">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-400 uppercase tracking-tighter italic">Essencial (Grátis)</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black tracking-tighter">R$ 0</span>
                      <span className="text-gray-500 text-xs font-bold uppercase">/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-5">
                    <li className="flex items-center gap-3 text-gray-400 text-sm">
                      <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-3 h-3 text-red-500/60" />
                      </div>
                      <span>Apenas 1 Barbeiro</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-400 text-sm">
                      <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-3 h-3 text-red-500/60" />
                      </div>
                      <span>Agendamentos Limitados</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-400 text-sm">
                      <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-3 h-3 text-red-500/60" />
                      </div>
                      <span>Funcionalidades Básicas</span>
                    </li>
                  </ul>

                  <div className="pt-4 opacity-50">
                    <div className="w-full py-4 text-center border-2 border-dashed border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest">
                      Plano Atual
                    </div>
                  </div>
                </div>

                {/* Transition Arrow */}
                <div className="hidden lg:flex justify-center flex-col items-center gap-4 text-[#F0B35B]/30 font-black italic">
                  <div className="w-[2px] h-20 bg-gradient-to-b from-transparent via-[#F0B35B]/30 to-transparent"></div>
                  <ArrowRight className="w-8 h-8 rotate-90 lg:rotate-0" />
                  <div className="w-[2px] h-20 bg-gradient-to-b from-transparent via-[#F0B35B]/30 to-transparent"></div>
                </div>

                {/* Pro Plan Card */}
                <div className="lg:col-span-2 relative group mt-8 lg:mt-0">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#F0B35B] to-orange-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative p-8 sm:p-10 bg-[#1A1F2E] border border-[#F0B35B]/40 rounded-[2.3rem] space-y-8 overflow-hidden shadow-2xl">

                    {/* Shine Effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#F0B35B]/10 blur-[50px] rounded-full -translate-y-16 translate-x-16"></div>

                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Premium <span className="text-[#F0B35B]">Pro</span></h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-black tracking-tighter text-[#F0B35B]">R$ 49,90</span>
                          <span className="text-gray-400 text-sm font-bold uppercase">/mês</span>
                        </div>
                      </div>
                      <div className="bg-[#F0B35B] text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#F0B35B]/20 animate-pulse">
                        Recomendado
                      </div>
                    </div>

                    <ul className="space-y-5">
                      <li className="flex items-center gap-4 text-white font-bold group/item">
                        <div className="w-6 h-6 rounded-full bg-[#F0B35B]/20 flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                          <Check className="w-4 h-4 text-[#F0B35B]" />
                        </div>
                        <span className="text-sm">Barbeiros <span className="text-[#F0B35B]">Ilimitados</span></span>
                      </li>
                      <li className="flex items-center gap-4 text-white font-bold group/item">
                        <div className="w-6 h-6 rounded-full bg-[#F0B35B]/20 flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                          <Check className="w-4 h-4 text-[#F0B35B]" />
                        </div>
                        <span className="text-sm">Agendamentos <span className="text-[#F0B35B]">Ilimitados</span></span>
                      </li>
                      <li className="flex items-center gap-4 text-white font-bold group/item">
                        <div className="w-6 h-6 rounded-full bg-[#F0B35B]/20 flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                          <Check className="w-4 h-4 text-[#F0B35B]" />
                        </div>
                        <span className="text-sm">Suporte <span className="text-[#F0B35B]">VIP 24/7</span></span>
                      </li>
                      <li className="flex items-center gap-4 text-white font-bold group/item">
                        <div className="w-6 h-6 rounded-full bg-[#F0B35B]/20 flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                          <Check className="w-4 h-4 text-[#F0B35B]" />
                        </div>
                        <span className="text-sm italic uppercase tracking-wider text-xs bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Multi-filiais (Em breve)</span>
                      </li>
                    </ul>

                    <button
                      onClick={handleUpgrade}
                      disabled={isProcessingPayment}
                      className="group/btn relative w-full h-16 bg-gradient-to-r from-[#F0B35B] to-orange-500 rounded-2xl font-black text-black text-lg uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_30px_rgba(240,179,91,0.4)] overflow-hidden scale-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {isProcessingPayment ? 'Validando...' : (
                          <>
                            Quero ser Pro
                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-white/20 translate-y-20 group-hover/btn:translate-y-0 transition-transform duration-500"></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 opacity-60">
                <div className="flex flex-col items-center gap-2 group cursor-default">
                  <Shield className="w-8 h-8 text-[#F0B35B] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-widest">Seguro</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-default">
                  <Zap className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-widest">Imediato</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-default">
                  <Star className="w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-widest">Premium</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-default">
                  <Users className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-widest">Ilimitado</span>
                </div>
              </div>
            </motion.div>
          )}

          {paymentStep === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center justify-center py-20 bg-[#1A1F2E]/60 backdrop-blur-xl rounded-[3rem] border border-white/5 border-[#F0B35B]/20 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F0B35B] to-transparent animate-shimmer"></div>

              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-white/5 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-t-4 border-[#F0B35B] animate-spin"></div>
                  <Crown className="w-10 h-10 text-[#F0B35B]" />
                </div>
              </div>

              <h3 className="text-3xl font-black italic uppercase tracking-tight text-white mb-2">Processando Upgrade</h3>
              <p className="text-gray-400 font-medium mb-8">Estamos configurando seu novo ambiente Premium...</p>

              <div className="flex flex-col gap-3 w-64">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                      className="w-1/2 h-full bg-[#F0B35B]"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {paymentStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-[#1A1F2E] to-black rounded-[3rem] border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.1)] relative overflow-hidden"
            >
              {/* Confetti effect placeholder or simple radial gradient */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,197,94,0.1)_0%,_transparent_70%)]"></div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
              >
                <Check className="w-12 h-12 text-black stroke-[4px]" />
              </motion.div>

              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-4 italic">Seja Bem-vindo ao <span className="text-[#F0B35B]">Elite!</span></h2>
              <p className="text-green-400 font-bold uppercase tracking-widest text-sm mb-12">Upgrade concluído com sucesso</p>

              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                  <Users className="w-5 h-5 text-[#F0B35B]" />
                  <span className="text-xs font-bold text-gray-400 uppercase">Equipe Ilimitada</span>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <span className="text-xs font-bold text-gray-400 uppercase">Agenda Livre</span>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <span className="text-xs font-bold text-gray-400 uppercase">Relatórios Pro</span>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <span className="text-xs font-bold text-gray-400 uppercase">Mais Velocidade</span>
                </div>
              </div>

              <p className="mt-12 text-gray-500 text-xs font-medium animate-pulse">Redirecionando você em instantes...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-gray-500 text-sm">Pagamento processado de forma segura via Mercado Pago. Cancele sua assinatura a qualquer momento painel de configurações.</p>
        <div className="flex items-center justify-center gap-8 opacity-30 grayscale hover:grayscale-0 transition-all">
          {/* Simple Card Logos Placeholder */}
          <div className="flex gap-2">
            <div className="w-8 h-5 bg-white rounded-sm"></div>
            <div className="w-8 h-5 bg-white rounded-sm"></div>
            <div className="w-8 h-5 bg-white rounded-sm"></div>
          </div>
          <div className="text-xs font-black italic">BARBER<span className="text-[#F0B35B]">SHOP</span> v1</div>
        </div>
      </footer>
    </div>
  );
};

export default UpgradePage;