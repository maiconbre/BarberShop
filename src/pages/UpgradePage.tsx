import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenant } from '../contexts/TenantContext';
import { usePlan } from '../hooks/usePlan';
import toast from 'react-hot-toast';
import { Crown, Check, ArrowRight, Star, Zap, Shield, Users, Calendar, BarChart3, Copy, QrCode, CreditCard } from 'lucide-react';
import StandardLayout from '../components/layout/StandardLayout';

const UpgradePage: React.FC = () => {
  const navigate = useNavigate();
  const { slug: barbershopSlug } = useTenant();
  const {
    planInfo,
    loading: planLoading,
    upgradePlan
  } = usePlan();

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'pix' | 'processing' | 'success'>('selection');
  const [pixCode] = useState('00020101021226870014br.gov.bcb.pix0125barbershop.payments.pro0203PRO520400005303986540549.905802BR5915BARBERSHOP PREMIUM6009SAO PAULO62070503PRO6304ABCD');

  // Redirect if already on Pro plan
  useEffect(() => {
    if (planInfo && planInfo.planType === 'pro' && paymentStep === 'selection') {
      navigate(`/app/${barbershopSlug}/dashboard`);
    }
  }, [planInfo, barbershopSlug, navigate, paymentStep]);

  const handleUpgradeSelection = () => {
    setPaymentStep('pix');
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast.success('Código PIX copiado!');
  };

  const handleUpgrade = async () => {
    try {
      setIsProcessingPayment(true);
      setPaymentStep('processing');

      // Real upgrade call (will update Supabase)
      await upgradePlan({ planType: 'pro' });

      setPaymentStep('success');

      // Auto redirect after success
      setTimeout(() => {
        navigate(`/app/${barbershopSlug}/dashboard`);
        window.location.reload(); // Force refresh to update all banners
      }, 3000);

    } catch (error) {
      toast.error('Ocorreu um erro ao processar seu upgrade.');
      setPaymentStep('pix');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <StandardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {paymentStep === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F0B35B]/10 border border-[#F0B35B]/20 text-[#F0B35B] text-xs font-black uppercase tracking-widest mb-4"
                >
                  <Crown className="w-3.5 h-3.5" />
                  Upgrade de Assinatura
                </motion.div>
                <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">
                  ALCANCE O PRÓXIMO <span className="text-[#F0B35B]">NÍVEL!</span>
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base font-medium">
                  Desbloqueie todos os recursos e ofereça a melhor experiência para seus clientes.
                  Gestão completa, sem limites e com design exclusivo.
                </p>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Free Plan */}
                <div className="bg-[#1A1F2E]/40 rounded-[2.5rem] border border-white/5 p-8 flex flex-col items-center text-center opacity-60">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Plano Atual</span>
                  <h3 className="text-2xl font-black italic uppercase text-white mb-2">Gratuito</h3>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-black text-white">R$ 0</span>
                    <span className="text-gray-500 font-bold uppercase text-[10px]">/mês</span>
                  </div>
                  <ul className="space-y-4 w-full mb-8">
                    <li className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                      <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-gray-500" />
                      </div>
                      Apenas 1 Barbeiro
                    </li>
                    <li className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                      <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-gray-500" />
                      </div>
                      Agenda Limitada
                    </li>
                  </ul>
                  <div className="mt-auto w-full py-4 rounded-2xl border border-white/5 font-black text-gray-500 text-xs uppercase tracking-widest">
                    Plano Ativo
                  </div>
                </div>

                {/* Pro Plan */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#F0B35B] to-orange-600 rounded-[2.6rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative bg-[#1A1F2E] rounded-[2.5rem] border border-[#F0B35B]/30 p-8 flex flex-col items-center text-center shadow-2xl">
                    <div className="absolute top-0 right-10 -translate-y-1/2 bg-gradient-to-r from-[#F0B35B] to-orange-500 px-4 py-1.5 rounded-full text-black text-[10px] font-black uppercase tracking-widest shadow-lg">
                      MAIS POPULAR
                    </div>

                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F0B35B] mb-6">Acesso Total</span>
                    <h3 className="text-2xl font-black italic uppercase text-white mb-2 italic">Premium Pro</h3>
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-4xl font-black text-white italic">R$ 49,90</span>
                      <span className="text-gray-500 font-bold uppercase text-[10px]">/mês</span>
                    </div>

                    <ul className="space-y-4 w-full mb-10 text-left">
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-xl bg-[#F0B35B]/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-[#F0B35B]" />
                        </div>
                        <span className="text-sm italic uppercase tracking-wider text-xs bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic">Barbeiros Ilimitados</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-xl bg-[#F0B35B]/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-[#F0B35B]" />
                        </div>
                        <span className="text-sm italic uppercase tracking-wider text-xs bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic">Agenda Completa 2026</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-xl bg-[#F0B35B]/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-[#F0B35B]" />
                        </div>
                        <span className="text-sm italic uppercase tracking-wider text-xs bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic">Relatórios Avançados</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-xl bg-[#F0B35B]/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-[#F0B35B]" />
                        </div>
                        <span className="text-sm italic uppercase tracking-wider text-xs bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic">Multi-filiais (Em breve)</span>
                      </li>
                    </ul>

                    <button
                      onClick={handleUpgradeSelection}
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
                  <span className="text-xs font-bold uppercase tracking-widest text-white">Seguro</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-default">
                  <Zap className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white">Imediato</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-default">
                  <Star className="w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white">Premium</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-default">
                  <Users className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white">Ilimitado</span>
                </div>
              </div>
            </motion.div>
          )}

          {paymentStep === 'pix' && (
            <motion.div
              key="pix"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-md mx-auto bg-[#1A1F2E] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden"
            >
              <div className="bg-[#009EE3] p-6 flex flex-col items-center gap-2">
                <CreditCard className="w-8 h-8 text-white" />
                <h3 className="text-white font-black uppercase tracking-tighter text-xl text-center">Pagamento via PIX</h3>
                <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">Mercado Pago</p>
              </div>

              <div className="p-8 space-y-8 flex flex-col items-center">
                <div className="text-center space-y-1">
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Valor total</p>
                  <p className="text-3xl font-black text-white italic">R$ 49,90</p>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-4 bg-[#F0B35B]/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative w-48 h-48 bg-white p-4 rounded-3xl shadow-2xl flex items-center justify-center">
                    <QrCode className="w-full h-full text-black stroke-[1.5px]" />
                  </div>
                </div>

                <div className="w-full space-y-5">
                  <div className="text-center space-y-3">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Escaneie o código ou copie a chave:</p>
                    <div className="flex items-center gap-2 bg-black/40 p-3 rounded-2xl border border-white/5 group/pix">
                      <code className="text-[10px] text-gray-500 truncate font-mono flex-1">{pixCode}</code>
                      <button
                        onClick={copyPixCode}
                        className="p-2.5 bg-[#F0B35B] text-black rounded-xl hover:bg-orange-500 transition-all active:scale-90 shadow-lg shadow-[#F0B35B]/20"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {import.meta.env.DEV && (
                      <button
                        onClick={handleUpgrade}
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        ⚡ Simular Pagamento (Dev)
                      </button>
                    )}

                    <button
                      onClick={() => setPaymentStep('selection')}
                      className="w-full py-3 text-gray-500 font-black uppercase tracking-[0.2em] text-[9px] hover:text-white transition-colors"
                    >
                      Cancelar e voltar
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 w-full text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-[#F0B35B] rounded-full animate-pulse"></div>
                    <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Aguardando pagamento...</p>
                  </div>
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
              className="flex flex-col items-center justify-center py-20 bg-[#1A1F2E]/60 rounded-[3rem] border border-[#F0B35B]/20 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F0B35B] to-transparent animate-shimmer"></div>

              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-white/5 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-t-4 border-[#F0B35B] animate-spin"></div>
                  <Crown className="w-10 h-10 text-[#F0B35B]" />
                </div>
              </div>

              <h3 className="text-3xl font-black italic uppercase tracking-tight text-white mb-2 italic">Processando Upgrade</h3>
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
              className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-[#1A1F2E] to-black rounded-[3rem] border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.1)] relative overflow-hidden text-center"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,197,94,0.1)_0%,_transparent_70%)]"></div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
              >
                <Check className="w-12 h-12 text-black stroke-[4px]" />
              </motion.div>

              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-4 italic">Seja Bem-vindo ao <span className="text-[#F0B35B]">Premium!</span></h2>
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

        {/* Footer Info */}
        <footer className="mt-12 text-center border-t border-white/5 pt-8">
          <p className="text-gray-500 text-[10px] font-medium max-w-lg mx-auto leading-relaxed">
            PAGAMENTO PROCESSADO DE FORMA SEGURA VIA MERCADO PAGO. VOCÊ PODE GERENCIAR SUA ASSINATURA A QUALQUER MOMENTO NO PAINEL DE CONFIGURAÇÕES DA SUA BARBEARIA.
          </p>
        </footer>
      </div>
    </StandardLayout>
  );
};

export default UpgradePage;