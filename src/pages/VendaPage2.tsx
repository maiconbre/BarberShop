import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Calendar, CheckCircle, ArrowRight, ArrowLeft,
  Users, BarChart, Smartphone, DollarSign, X,
  Rocket, Key, Settings, Share2
} from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useCountdown } from '../hooks/useCountdown';

// Configuração da promoção relâmpago
const PROMO_END_TIME = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
const SLOTS_LEFT = 3;

// CTAs otimizados com variantes de teste A/B
const ctaVariants = {
  primary: {
    text: "Comece Agora com 50% OFF",
    subtext: "Oferta válida por tempo limitado",
    urgency: "Apenas 3 descontos restantes!"
  },
  secondary: {
    text: "Ver Demonstração",
    subtext: "Conheça todas as funcionalidades"
  }
};

const VendaPage2: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);
  const { hours, minutes, seconds } = useCountdown(PROMO_END_TIME);
  // Referência para a seção hero
  const heroRef = React.useRef<HTMLDivElement>(null);

  // Efeito para focar na primeira seção
  useEffect(() => {
    if (heroRef.current) {
      heroRef.current.focus();
    }
  }, []);

  // Efeito para resetar o passo quando o modal é fechado
  useEffect(() => {
    if (!showDemo) {
      // Quando o modal é fechado, resetamos o passo para garantir que na próxima abertura comece do início
      setCurrentStep(0);
    }
  }, [showDemo]);

  // Estado para controlar o card atual
  const [currentStep, setCurrentStep] = useState(0);

  // Função para abrir o modal de demonstração sempre no primeiro passo
  const openDemoModal = () => {
    setCurrentStep(0); // Garante que sempre inicie no primeiro passo
    setShowDemo(true);
  };


  // Demonstração simplificada em 3 passos
  const demoSteps = [
    {
      id: 1,
      title: "📝 Cadastro Simplificado",
      description: "Configure sua barbearia em minutos",
      icon: Rocket,
      details: [
        "• Preencha informações básicas da barbearia",
        "• Adicione seus barbeiros e serviços",
        "• Personalize horários de funcionamento",
        "• Configure métodos de pagamento"
      ],
      features: [
        { title: "Rápido", desc: "Leva apenas 5 minutos" },
        { title: "Intuitivo", desc: "Interface amigável" },
        { title: "Suporte", desc: "Ajuda em tempo real" }
      ],
      color: "from-blue-500/20 to-blue-600/20",
      animate: { y: [0, -5, 0], transition: { duration: 2, repeat: Infinity } }
    },
    {
      id: 2,
      title: "🔑 Painel de Controle",
      description: "Gerencie tudo em um só lugar",
      icon: Settings,
      details: [
        "• Dashboard com métricas importantes",
        "• Gestão completa de agendamentos",
        "• Controle financeiro detalhado",
        "• Histórico de clientes"
      ],
      features: [
        { title: "Completo", desc: "Todas as ferramentas" },
        { title: "Prático", desc: "Fácil de usar" },
        { title: "Relatórios", desc: "Dados em tempo real" }
      ],
      color: "from-green-500/20 to-green-600/20",
      animate: { scale: [1, 1.02, 1], transition: { duration: 2, repeat: Infinity } }
    },
    {
      id: 3,
      title: "📱 Link de Agendamento",
      description: "Seus clientes agendam sozinhos",
      icon: Share2,
      details: [
        "• Link personalizado para sua barbearia",
        "• Agendamento em 3 cliques",
        "• Confirmação automática por WhatsApp",
        "• Lembretes inteligentes"
      ],
      features: [
        { title: "Personalizado", desc: "Sua marca" },
        { title: "Automático", desc: "24h por dia" },
        { title: "Inteligente", desc: "Evita conflitos" }
      ],
      color: "from-purple-500/20 to-purple-600/20",
      animate: { x: [-2, 2, -2], transition: { duration: 2, repeat: Infinity } }
    }
  ];

  // Definição de animações comuns
  const commonAnimations = {
    headerGradient: "bg-gradient-to-br from-[#1A1F2E] to-[#0D121E]",
    cardGradient: "bg-gradient-to-br from-[#252B3B] to-[#1A1F2E]",
    glowEffect: "hover:shadow-[0_0_15px_rgba(240,179,91,0.3)]",
    buttonGradient: "bg-gradient-to-r from-[#F0B35B] to-[#D4943D]",
    buttonShine: "animate-shine relative overflow-hidden before:absolute before:inset-0 before:inset-0 before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
  };

  return (
    <>
      <Helmet>
        {/* SEO Meta Tags Básicas */}
        <title>BarberShop - Agendamento Online para Barbearias | Sem Cadastro, Sem App</title>
        <meta name="description" content="Sistema de agendamento para barbearias. Sem necessidade de cadastro ou aplicativo. Agende em 30 segundos e aumente seu faturamento em até 70%. Sistema completo de gestão." />
        <meta name="keywords" content="agendamento barbearia, sistema barbearia, agenda online, sem cadastro, sem aplicativo, gestão barbearia, software barbearia, agendamento online, barbeiro, barber shop" />
        <meta name="author" content="BarberShop" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="language" content="pt-BR" />
        <meta name="geo.region" content="BR-RJ" />
        <meta name="geo.placename" content="Rio de Janeiro" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://barber.targetweb.tech" />
        
        {/* Open Graph Tags para Facebook e outras redes sociais */}
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="BarberShop - Agendamento Sem Complicação" />
        <meta property="og:description" content="Agende em 30 segundos, sem cadastro e sem baixar nada. Aumente seu faturamento em até 70% com nosso sistema completo." />
        <meta property="og:url" content="https://barber.targetweb.tech" />
        <meta property="og:site_name" content="BarberShop" />
        <meta property="og:image" content="https://barber.targetweb.tech/img/fotohero-optimized.avif" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/avif" />
        <meta property="og:image:alt" content="Sistema de agendamento para barbearias" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BarberShop - Agendamento Online para Barbearias" />
        <meta name="twitter:description" content="Sistema completo para gerenciar sua barbearia. Aumente seu faturamento em até 70%." />
        <meta name="twitter:image" content="https://barber.targetweb.tech/img/fotohero-optimized.avif" />
        <meta name="twitter:image:alt" content="Sistema de agendamento para barbearias" />
        
        {/* Tags para Google Ads */}
        <meta name="google-site-verification" content="seu-código-de-verificação" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Tags para Facebook Ads */}
        <meta name="facebook-domain-verification" content="seu-código-de-verificação" />
        
        {/* Preconnect para recursos externos */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* JSON-LD para Rich Snippets */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "BarberShop",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "BRL"
            },
            "description": "Sistema de agendamento online para barbearias. Aumente seu faturamento em até 70%.",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "127"
            }
          }
        `}</script>
        
        {/* Tags para remarketing */}
        <meta name="google-adwords-id" content="seu-id-adwords" />
        <meta name="facebook-pixel-id" content="seu-pixel-id" />
      </Helmet>



      {/* Promoção Flutuante mais elegante e responsiva */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className={`fixed bottom-0 left-0 right-0 ${commonAnimations.headerGradient} backdrop-blur-lg z-50 py-3 sm:py-4 border-t border-[#F0B35B]/20 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2 bg-[#F0B35B]/10 px-4 py-1 rounded-full border border-[#F0B35B]/30"
            >
              <span className="text-[#F0B35B] text-lg">⚡</span>
              <span className="text-[#F0B35B] font-medium">{SLOTS_LEFT} Descontos Restantes</span>
            </motion.div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center sm:items-end">
              <div className="text-sm text-gray-400 mb-1">Oferta expira em:</div>
              <div className="flex items-center gap-2 text-white font-mono text-lg">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="bg-[#252B3B] px-3 py-1 rounded-md border border-[#F0B35B]/20"
                >
                  <span>{hours.toString().padStart(2, '0')}</span>
                </motion.div>
                <span className="text-[#F0B35B]">:</span>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="bg-[#252B3B] px-3 py-1 rounded-md border border-[#F0B35B]/20"
                >
                  <span>{minutes.toString().padStart(2, '0')}</span>
                </motion.div>
                <span className="text-[#F0B35B]">:</span>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="bg-[#252B3B] px-3 py-1 rounded-md border border-[#F0B35B]/20"
                >
                  <span>{seconds.toString().padStart(2, '0')}</span>
                </motion.div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(240,179,91,0.4)' }}
              whileTap={{ scale: 0.95 }}
              className="
                relative overflow-hidden
                px-6 py-1 bg-gradient-to-r from-[#F0B35B] to-[#D4943D] text-black rounded-lg
                text-base font-bold
                shadow-[0_0_15px_rgba(240,179,91,0.3)]
                border-2 border-[#F0B35B]
                group
              "
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
              <span className="relative z-10 flex items-center gap-2">
                Aproveitar Agora
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <ArrowRight size={18} />
                </motion.span>
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className={`min-h-screen ${commonAnimations.headerGradient} text-white overflow-x-hidden w-full relative`}>
        {/* Header mais limpo e responsivo */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 w-full bg-[#1A1F2E]/90 backdrop-blur-md z-50 border-b border-[#F0B35B]/10"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-[#F0B35B]">BarberShop</h1>
              <button
                onClick={openDemoModal}
                className="
                  relative overflow-hidden
                  px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg
                  border-2 border-[#F0B35B] text-[#F0B35B]
                  text-sm sm:text-base font-medium
                  transition-all duration-500
                  hover:bg-[#F0B35B]/10
                  before:absolute before:inset-0
                  before:bg-gradient-to-r before:from-[#F0B35B]/0 
                  before:via-white/20 before:to-[#F0B35B]/0
                  before:-skew-x-45 before:animate-shine
                "
              >
                <span className="relative z-10">Como funciona?</span>
              </button>
            </div>
          </div>
        </motion.header>

        {/* Hero Section Aprimorada */}
        <section
          ref={heroRef}
          className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden"
          tabIndex={-1}
        >
          {/* Elementos de fundo animados */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-20 left-10 w-64 h-64 bg-[#F0B35B]/5 rounded-full filter blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-72 h-72 bg-[#F0B35B]/10 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
            <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-[#F0B35B]/5 rounded-full filter blur-3xl animate-float"></div>

            {/* Linhas decorativas */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#F0B35B]/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#F0B35B]/20 to-transparent"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  type: "spring",
                  stiffness: 50
                }}
                className="max-w-2xl mx-auto text-center lg:text-left space-y-8" // Centralizado em mobile
              >
                {/* Tag com animação melhorada */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(240,179,91,0.15)" }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#F0B35B]/5 text-[#F0B35B] rounded-full border border-[#F0B35B]/10 backdrop-blur-sm"
                  >
                    <span className="animate-pulse text-lg">⭐</span>
                    <span>Software #1 do RJ para Barbearias</span>
                  </motion.div>

                </div>

                {/* Headline com animação de texto otimizado para mobile-first */}
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                >
                  <span className="block mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400">
                    Leve sua Barbearia para o 
                  </span>
                  <span className="relative">
                    <span className={`relative inline-block bg-clip-text text-transparent text-[1.2em] sm:text-[1em] ${commonAnimations.buttonGradient}`}>
                      Próximo Nível
                      <motion.span
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                        className="absolute -bottom-1 sm:-bottom-2 left-0 h-[2px] sm:h-[3px] bg-gradient-to-r from-[#F0B35B]/0 via-[#F0B35B] to-[#F0B35B]/0"
                      />
                    </span>
                  </span>
                </motion.h1>

                {/* Subtítulo atualizado com benefícios mais detalhados */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="space-y-8"
                >
                  <p className="text-gray-300 text-lg max-w-xl mx-auto lg:mx-0">
                    Sistema completo para gerenciar sua barbearia:
                  </p>

                  {/* Cards de benefícios */}
                  <div className="grid grid-cols-3 md:grid-cols-3 gap-2 sm:gap-3 max-w-lg mx-auto lg:mx-0">
                    {/* Card 1 */}
                    <motion.div
                      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(240,179,91,0.2)" }}
                      className={`${commonAnimations.cardGradient} rounded-lg p-2 sm:p-3 border border-[#F0B35B]/10 hover:border-[#F0B35B]/30 transition-all duration-300`}
                    >
                      <div className="text-center">
                        <span className="text-lg sm:text-xl mb-1 block">⏱️</span>
                        <h3 className="text-white font-bold text-sm sm:text-base mb-0.5">Economize Tempo</h3>
                        <p className="text-gray-400 text-xs">3h/dia na gestão</p>
                      </div>
                    </motion.div>

                    {/* Card 2 */}
                    <motion.div
                      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(240,179,91,0.2)" }}
                      className={`${commonAnimations.cardGradient} rounded-lg p-2 sm:p-3 border border-[#F0B35B]/10 hover:border-[#F0B35B]/30 transition-all duration-300`}
                    >
                      <div className="text-center">
                        <span className="text-lg sm:text-xl mb-1 block">⭐</span>
                        <h3 className="text-white font-bold text-sm sm:text-base mb-0.5">100% Satisfação</h3>
                        <p className="text-gray-400 text-xs">Clientes satisfeitos</p>
                      </div>
                    </motion.div>

                    {/* Card 3 */}
                    <motion.div
                      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(240,179,91,0.2)" }}
                      className={`${commonAnimations.cardGradient} rounded-lg p-2 sm:p-3 border border-[#F0B35B]/10 hover:border-[#F0B35B]/30 transition-all duration-300`}
                    >
                      <div className="text-center">
                        <span className="text-lg sm:text-xl mb-1 block">📱</span>
                        <h3 className="text-white font-bold text-sm sm:text-base mb-0.5">Design Premium</h3>
                        <p className="text-gray-400 text-xs">Adaptável a qualquer tela</p>
                      </div>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex flex-wrap justify-center lg:justify-start gap-3 mt-6"
                  >
                    {/* Feature badges com animações individuais */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-green-500/20 text-green-400 rounded-full border border-green-500/20 backdrop-blur-sm text-xs shadow-sm hover:shadow-green-500/20 transition-all duration-300"
                    >
                      <motion.span
                        animate={{ rotate: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      >🌱</motion.span>
                      <span>Sem Cadastro</span>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-blue-500/20 text-blue-400 rounded-full border border-blue-500/20 backdrop-blur-sm text-xs shadow-sm hover:shadow-blue-500/20 transition-all duration-300"
                    >
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                      >🔒</motion.span>
                      <span>Banco Exclusivo</span>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-purple-500/20 text-purple-400 rounded-full border border-purple-500/20 backdrop-blur-sm text-xs shadow-sm hover:shadow-purple-500/20 transition-all duration-300"
                    >
                      <motion.span
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2.5 }}
                      >🎯</motion.span>
                      <span>Suporte 24h</span>
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* CTA com animações avançadas */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3, duration: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                >
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="
                      relative overflow-hidden
                      px-8 py-4 bg-gradient-to-r from-[#F0B35B] to-[#D4943D] text-black rounded-lg
                      text-lg font-bold
                      transition-all duration-500
                      shadow-[0_0_25px_rgba(240,179,91,0.4)]
                      border-2 border-[#F0B35B]
                      before:absolute before:inset-0
                      before:bg-gradient-to-r before:from-[#F0B35B]/0 
                      before:via-white/40 before:to-[#F0B35B]/0
                      before:-skew-x-45 before:animate-shine
                    "
                  >
                    {/* Efeito de brilho animado */}
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>

                    <span className="relative z-10 inline-flex flex-col items-center justify-center w-full">
                      <span className="flex items-center gap-2">
                        Garanta 30% OFF
                        <motion.span
                          animate={{ rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 0.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 2 }}
                        >
                          🔥
                        </motion.span>
                      </span>
                      <span className="text-xs mt-1 text-black/80">{ctaVariants.primary.urgency}</span>
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03, backgroundColor: "rgba(240,179,91,0.15)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={openDemoModal}
                    className="
                      px-8 py-4 bg-transparent text-[#F0B35B] rounded-lg
                      text-lg font-medium
                      transition-all duration-300
                      border-2 border-[#F0B35B]/30 hover:border-[#F0B35B]/60
                      flex items-center justify-center gap-2
                    "
                  >
                    <span>Como funciona?</span>
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <ArrowRight size={18} />
                    </motion.span>
                  </motion.button>
                </motion.div>
              </motion.div>

              {/* Preview com efeitos 3D e interatividade */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="relative hidden lg:block"
              >
                <motion.div
                  whileHover={{ scale: 1.02, rotate: -1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative w-full aspect-video bg-[#1A1F2E] rounded-xl overflow-hidden border border-[#F0B35B]/20 shadow-2xl transform perspective-1000"
                >
                  {/* Efeito de brilho nas bordas */}
                  <div className="absolute inset-0 rounded-xl border border-[#F0B35B]/30 filter blur-[2px] z-0"></div>

                  {/* Overlay gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D121E] via-[#0D121E]/50 to-transparent opacity-70 z-20"></div>

                  {/* Substituir vídeo por imagem */}
                  <img
                    src="../img/demofoto.webp" // Substitua pelo caminho da sua imagem
                    alt="Descrição da imagem"
                    className="absolute inset-0 w-full h-full object-cover z-10"
                  />

                  {/* Elementos flutuantes */}
                  <div className="absolute inset-0 z-30 flex items-end p-6">
                    <div className="w-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#F0B35B] flex items-center justify-center text-black font-bold text-sm">BO</div>
                        <div>
                          <div className="text-white font-medium">Barber Online</div>
                          <div className="text-xs text-gray-300">Sistema de Gestão</div>
                        </div>
                      </div>

                      <div className="flex gap-2 mb-2">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 2, delay: 0 }}
                          className="px-3 py-1.5 bg-[#F0B35B]/20 rounded-md text-[#F0B35B] text-xs font-medium"
                        >
                          Agendamentos
                        </motion.div>
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                          className="px-3 py-1.5 bg-[#F0B35B]/10 rounded-md text-[#F0B35B] text-xs font-medium"
                        >
                          Relatórios
                        </motion.div>
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                          className="px-3 py-1.5 bg-[#F0B35B]/10 rounded-md text-[#F0B35B] text-xs font-medium"
                        >
                          Clientes
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Elementos decorativos */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#F0B35B]/10 rounded-full filter blur-xl"></div>
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#F0B35B]/5 rounded-full filter blur-xl"></div>
              </motion.div>
            </div>
          </div>

          {/* Indicador de scroll */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
          >

          </motion.div>

        </section>

        {/* Demonstração Interativa */}
        <AnimatePresence>
          {showDemo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 overflow-y-auto"
            >
              <div className="min-h-screen px-4 py-8">
                <div className="relative w-full max-w-4xl mx-auto">
                  <div className="bg-gradient-to-br from-[#1A1F2E] to-[#0D121E] rounded-2xl overflow-hidden border border-[#F0B35B]/20">
                    {/* Header */}
                    <div className="sticky top-0 z-20 bg-[#1A1F2E] border-b border-[#F0B35B]/10 px-4 py-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#F0B35B] to-[#D4943D]">
                            Como Funciona
                          </h3>
                          <p className="text-gray-400 text-xs">Passo {currentStep + 1} de {demoSteps.length}</p>
                        </div>
                        <button
                          onClick={() => setShowDemo(false)}
                          className="p-1.5 hover:bg-[#252B3B] rounded-full transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Conteúdo Principal */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Sidebar com Steps mais compacta */}
                        <div className="md:col-span-4">
                          <div className="bg-[#252B3B]/50 rounded-xl p-3 sticky top-24">
                            {demoSteps.map((step, idx) => (
                              <motion.button
                                key={idx}
                                onClick={() => setCurrentStep(idx)}
                                whileHover={{ x: 4 }}
                                className={`w-full text-left p-2.5 rounded-lg mb-2 transition-all ${
                                  currentStep === idx 
                                    ? 'bg-[#F0B35B]/20 border border-[#F0B35B]' 
                                    : 'hover:bg-[#F0B35B]/10'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-lg ${
                                    currentStep === idx ? 'bg-[#F0B35B] text-black' : 'bg-[#1A1F2E] text-[#F0B35B]'
                                  } flex items-center justify-center text-sm font-medium`}>
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{step.title}</div>
                                  </div>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* Área de Conteúdo */}
                        <div className="md:col-span-8">
                          <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-[#252B3B]/30 rounded-xl p-6"
                          >
                            <div className="flex items-start gap-4 mb-6">
                              <div className={`w-12 h-12 rounded-xl flex-shrink-0 bg-gradient-to-br ${demoSteps[currentStep].color} flex items-center justify-center`}>
                                {React.createElement(demoSteps[currentStep].icon, { className: "w-6 h-6" })}
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-white mb-1">{demoSteps[currentStep].title}</h4>
                                <p className="text-gray-400">{demoSteps[currentStep].description}</p>
                              </div>
                            </div>

                            <div className="space-y-6">
                              {/* Lista de Detalhes */}
                              <div className="space-y-3">
                                {demoSteps[currentStep].details.map((detail, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center gap-2 text-gray-300 bg-[#1A1F2E]/50 p-3 rounded-lg"
                                  >
                                    {detail}
                                  </motion.div>
                                ))}
                              </div>

                              {/* Features Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                                {demoSteps[currentStep].features.map((feature, idx) => (
                                  <motion.div
                                    key={idx}
                                    whileHover={{ y: -2 }}
                                    className="bg-[#1A1F2E] p-4 rounded-lg border border-[#F0B35B]/10"
                                  >
                                    <div className="font-medium text-[#F0B35B] mb-1">{feature.title}</div>
                                    <div className="text-sm text-gray-400">{feature.desc}</div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Footer com botões mais compactos */}
                    <div className="sticky bottom-0 bg-[#1A1F2E] border-t border-[#F0B35B]/10 p-4">
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => currentStep > 0 && setCurrentStep(current => current - 1)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
                            currentStep === 0 
                              ? 'text-gray-500 cursor-not-allowed' 
                              : 'text-[#F0B35B] hover:bg-[#F0B35B]/10'
                          }`}
                          disabled={currentStep === 0}
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span className="hidden sm:inline">Anterior</span>
                        </button>

                        {currentStep === demoSteps.length - 1 ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowDemo(false)}
                            className="px-4 py-1.5 bg-[#F0B35B] text-black rounded-lg text-sm font-medium"
                          >
                            Começar
                          </motion.button>
                        ) : (
                          <button
                            onClick={() => setCurrentStep(current => current + 1)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[#F0B35B] hover:bg-[#F0B35B]/10 rounded-lg text-sm"
                          >
                            <span className="hidden sm:inline">Próximo</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        <section className="py-16 md:py-20 bg-gradient-to-b from-[#1A1F2E] to-[#0D121E] relative overflow-hidden">
          {/* Elementos decorativos de fundo */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-20 right-10 w-64 h-64 bg-[#F0B35B]/5 rounded-full filter blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 left-10 w-72 h-72 bg-[#F0B35B]/10 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#F0B35B]/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#F0B35B]/20 to-transparent"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Título da seção com animação */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400">Recursos <span className="text-[#F0B35B]">Poderosos</span></h2>
              <p className="text-gray-300 max-w-2xl mx-auto">Tudo o que você precisa para transformar sua barbearia em um negócio de sucesso</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8"
            >
              {[
                { icon: Clock, title: 'Economia de Tempo', desc: 'Reduza em até 70% o tempo gasto com agendamentos', delay: 0 },
                { icon: Calendar, title: 'Agenda Inteligente', desc: 'Organize todos os agendamentos em um só lugar', delay: 0.1 },
                { icon: Users, title: 'Gestão de Clientes', desc: 'Histórico completo e perfil de cada cliente', delay: 0.2 },
                { icon: BarChart, title: 'Relatórios Detalhados', desc: 'Análise completa do seu negócio', delay: 0.3 }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: item.delay, duration: 0.5 }}
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 0 25px rgba(240,179,91,0.2)",
                    y: -5
                  }}
                  className="
                    group p-6 sm:p-8 
                    bg-gradient-to-br from-[#252B3B] to-[#1A1F2E] 
                    rounded-xl border border-[#F0B35B]/10 
                    transition-all duration-300 
                    hover:border-[#F0B35B]/30
                    relative overflow-hidden
                  "
                >
                  {/* Efeito de brilho no hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                  <div className="
                    w-16 h-16 rounded-full 
                    bg-gradient-to-br from-[#F0B35B]/20 to-[#F0B35B]/5 
                    flex items-center justify-center 
                    mb-6 relative z-10
                    group-hover:from-[#F0B35B]/30 group-hover:to-[#F0B35B]/10
                    transition-all duration-300
                  ">
                    <item.icon className="w-8 h-8 text-[#F0B35B] group-hover:scale-110 transition-transform duration-300" />
                  </div>

                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-[#F0B35B] transition-colors duration-300 relative z-10">{item.title}</h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300 relative z-10">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>


        <section className="py-20 bg-[#1A1F2E]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Escolha o Plano Ideal para Você
              </h2>
              <p className="text-gray-400">Aproveite nossa oferta especial por tempo limitado</p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
              {/* Card Plano Mensal */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`relative ${commonAnimations.cardGradient} p-8 rounded-lg border border-[#F0B35B]/10 w-full sm:w-[calc(33%-1rem)] max-w-[350px] ${commonAnimations.glowEffect}`}
              >
                <div className="relative">
                  <h3 className="text-xl font-bold mb-2 text-white">Plano Mensal </h3>
                  <div className="text-5xl font-bold text-[#F0B35B] mb-1">R$ 49,90</div>
                  <div className="text-sm text-gray-400 mb-4">Acesso total por 1 mês </div>
                  <ul className="space-y-3 mb-6">
                    {['Atualizações', 'Suporte 24/7', 'Backups diários', 'Sem limite de agendamentos'].map((item, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-[#F0B35B] mr-2" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full py-3 bg-[#252B3B] text-[#F0B35B] rounded-lg font-bold border border-[#F0B35B]/30 hover:bg-[#F0B35B]/10 transition-all duration-300"
                  >
                    Assinar Agora
                  </motion.button>
                </div>
              </motion.div>

              {/* Card Plano Semestral em Destaque */}
              <div className="relative bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-8 rounded-lg border-2 border-[#F0B35B] shadow-xl transform hover:scale-105 transition-all duration-300 w-full sm:w-[calc(33%-1rem)] max-w-[350px] z-10">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#F0B35B] text-black text-sm px-4 py-1 rounded-full font-bold">
                  Mais Popular
                </div>
                <h3 className="text-xl font-bold mb-2">Plano Semestral</h3>
                <div className="text-5xl font-bold text-[#F0B35B] mb-1">R$ 39,90<span className="text-xl">/mês</span></div>
                <div className="text-sm mt-2 text-gray-400 mb-4">de
                  <span className="text-[#F0B35B] text-sm "> <span className="text-gray-400 text-xs line-through mr-2">R$ 300,00</span>por R$ 239,90</span>
                  <span className="text-xs text-gray-400 ml-4 text-right">em 6 meses</span>
                </div>

                <ul className="space-y-3 my-4">
                  {['Atualizações', 'Suporte 24/7', 'Backups diários', 'Sem limite de agendamentos', 'Relatórios avançados', 'Acesso a recursos premium'].map((item, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-[#F0B35B] mr-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="
                    relative overflow-hidden w-full
                    py-3 bg-[#F0B35B] text-black rounded-lg
                    font-bold
                    transition-all duration-500
                    shadow-[0_0_15px_rgba(240,179,91,0.3)]
                    before:absolute before:inset-0
                    before:bg-gradient-to-r before:from-[#F0B35B]/0 
                    before:via-white/40 before:to-[#F0B35B]/0
                    before:-skew-x-45 before:animate-shine
                  "
                >
                  <span className="relative z-10">Assinar Agora</span>
                </motion.button>
              </div>

              {/* Card Plano Anual - Promoção Imperdível */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`relative ${commonAnimations.cardGradient} p-8 rounded-lg border-2 border-[#F0B35B]/30 w-full sm:w-[calc(33%-1rem)] max-w-[350px] ${commonAnimations.glowEffect}`}
              >
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                  ⚡ 30% OFF ⚡
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">Plano Anual</h3>
                  </div>

                  <div className="flex items-end">
                    <div className="text-5xl font-bold text-[#F0B35B]">R$ 34,90<span className="text-xl text-[#F0B35B]">/mês</span></div>

                  </div>
                  <div className="text-sm mt-2 text-gray-400 mb-4">de
                    <span className="text-[#F0B35B] text-sm "> <span className="text-gray-400 text-xs line-through mr-2">R$ 600,00</span>por R$ 419,90</span>
                    <span className="text-xs text-gray-400 ml-4 text-right">em 12 meses</span>
                  </div>
                  <div className="bg-[#F0B35B]/10 p-1 rounded-lg mb-2 border border-[#F0B35B]/20">
                    <div className="flex items-center text-[#F0B35B] mb-1">
                      <Rocket className="w-4 h-4 mr-2" />
                      <span className="text- xs">ECONOMIZE mais de R$ 180,00</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {['Atualizações', 'Suporte 24/7', 'Backups diários', 'Sem limite de agendamentos', 'Relatórios avançados', 'Economia garantida', 'Acesso a novos recursos'].map((item, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-[#F0B35B] mr-2" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="
                    w-full py-3 bg-gradient-to-r from-[#F0B35B] to-[#D4943D] text-black rounded-lg
                    font-bold
                    transition-all duration-300
                    shadow-md hover:shadow-lg hover:shadow-[#F0B35B]/30
                    border border-[#F0B35B]
                  ">
                    <div className="flex items-center justify-center">
                      <span>COMPRAR AGORA</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Informação adicional */}
            <div className="text-center mt-8 text-gray-400 text-sm">
              <p>Todos os planos incluem implementação gratuita e suporte técnico</p>
              <p className="mt-2">Garantia de 7 dias ou seu dinheiro de volta</p>
            </div>
          </div>
        </section>

        {/* Seção de Funcionalidades Exclusivas */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1F2E] via-[#0D121E] to-[#1A1F2E]">
            <div className="absolute inset-0 bg-[url('/img/pattern.svg')] opacity-5"></div>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#F0B35B]/5 rounded-full filter blur-[100px] animate-pulse-slow"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#F0B35B]/5 rounded-full filter blur-[100px] animate-pulse-slow animation-delay-1000"></div>
          </div>

          <div className="relative container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Funcionalidades Exclusivas
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Descubra como nosso sistema pode transformar a gestão da sua barbearia
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {demoSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  whileHover={{ y: -5 }}
                  className={`p-6 rounded-xl border border-[#F0B35B]/20 bg-gradient-to-br from-[#1A1F2E] to-[#0D121E] backdrop-blur-sm hover:border-[#F0B35B]/40 transition-all duration-300 shadow-lg hover:shadow-[#F0B35B]/20`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <step.icon className="w-8 h-8 text-[#F0B35B]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                      <p className="text-gray-400 mb-4">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="text-gray-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F0B35B]"></span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final Aprimorado */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1F2E] via-[#0D121E] to-[#1A1F2E]">
            <div className="absolute inset-0 bg-[url('/img/pattern.svg')] opacity-5"></div>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#F0B35B]/5 rounded-full filter blur-[100px] animate-pulse-slow"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#F0B35B]/5 rounded-full filter blur-[100px] animate-pulse-slow animation-delay-1000"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F0B35B]/5 text-[#F0B35B] rounded-full border border-[#F0B35B]/10 backdrop-blur-sm mb-6">
                <span className="animate-pulse text-lg">⚡</span>
                <span>Oferta Especial por Tempo Limitado</span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400 mb-2">
                  Eleve sua Barbearia ao
                </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#F0B35B] to-[#D4943D]">
                  Próximo Nível
                </span>
              </h2>

              <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Junte-se a centenas de barbearias que já estão revolucionando
                <br />sua gestão e aumentando seus lucros
              </p>

              <motion.div
                className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-3xl mx-auto"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.2
                    }
                  }
                }}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="w-full sm:w-auto"
                >
                  <button className="
                    relative overflow-hidden w-full sm:w-auto
                    px-8 py-4 bg-gradient-to-r from-[#F0B35B] to-[#D4943D] text-black rounded-xl
                    font-bold text-lg
                    transition-all duration-500
                    shadow-[0_0_25px_rgba(240,179,91,0.4)]
                    border-2 border-[#F0B35B]
                    hover:shadow-[0_0_35px_rgba(240,179,91,0.6)]
                    group
                  ">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/40 to-white/0 -skew-x-45 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      Começar Agora
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </motion.div>

                <div className="flex items-center gap-4 bg-[#252B3B]/80 backdrop-blur-sm px-6 py-3 rounded-xl border border-[#F0B35B]/10">
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-gray-400">Oferta expira em:</span>
                    <div className="font-mono text-[#F0B35B] text-lg font-bold tracking-wider">
                      {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div className="h-12 w-px bg-[#F0B35B]/10"></div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-gray-400">Vagas restantes:</span>
                    <div className="text-[#F0B35B] font-bold text-lg">{SLOTS_LEFT}</div>
                  </div>
                </div>
              </motion.div>

              <div className="pt-12 flex flex-wrap justify-center gap-8 text-center">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#252B3B] flex items-center justify-center text-[#F0B35B]">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="text-gray-400">7 dias de garantia</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#252B3B] flex items-center justify-center text-[#F0B35B]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-gray-400">Suporte 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#252B3B] flex items-center justify-center text-[#F0B35B]">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-gray-400">+1000 clientes ativos</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Seção de Formulário de Cadastro */}
        <section className="py-20 w-full relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#F0B35B]/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#F0B35B]/20 to-transparent"></div>
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-[#F0B35B]/5 rounded-full filter blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-[#F0B35B]/5 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F0B35B]/5 text-[#F0B35B] rounded-full border border-[#F0B35B]/10 backdrop-blur-sm mb-6">
                <span className="animate-pulse text-lg">🎁</span>
                <span>Oferta Exclusiva</span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400 mb-2">
                  Experimente Gratuitamente por
                </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#F0B35B] to-[#D4943D]">
                  7 Dias Completos
                </span>
              </h2>

              <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Preencha o formulário abaixo e receba acesso ao sistema completo
                <br />sem compromisso e sem necessidade de cartão de crédito
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className={`${commonAnimations.cardGradient} rounded-2xl p-6 sm:p-8 border border-[#F0B35B]/20 shadow-lg relative overflow-hidden`}
              >
                {/* Efeito de brilho no card */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-card-shine"></div>
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-white mb-6 text-center">Cadastre-se para Acesso Gratuito</h3>
                  
                  <form className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label htmlFor="barbershopName" className="block text-sm font-medium text-gray-300">Nome da Barbearia</label>
                        <input
                          type="text"
                          id="barbershopName"
                          placeholder="Ex: Barbearia Estilo"
                          className="w-full px-4 py-3 rounded-xl bg-[#252B3B] border border-[#F0B35B]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#F0B35B] transition-all duration-300"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="socialMedia" className="block text-sm font-medium text-gray-300">Instagram da Barbearia</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                          <input
                            type="text"
                            id="socialMedia"
                            placeholder="seu.instagram"
                            className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#252B3B] border border-[#F0B35B]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#F0B35B] transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="ownerName" className="block text-sm font-medium text-gray-300">Seu Nome</label>
                      <input
                        type="text"
                        id="ownerName"
                        placeholder="Nome completo"
                        className="w-full px-4 py-3 rounded-xl bg-[#252B3B] border border-[#F0B35B]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#F0B35B] transition-all duration-300"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Seu E-mail</label>
                        <input
                          type="email"
                          id="email"
                          placeholder="email@exemplo.com"
                          className="w-full px-4 py-3 rounded-xl bg-[#252B3B] border border-[#F0B35B]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#F0B35B] transition-all duration-300"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-300">WhatsApp</label>
                        <input
                          type="tel"
                          id="whatsapp"
                          placeholder="(00) 00000-0000"
                          className="w-full px-4 py-3 rounded-xl bg-[#252B3B] border border-[#F0B35B]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#F0B35B] transition-all duration-300"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(240,179,91,0.4)' }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="
                          w-full px-6 py-4 bg-gradient-to-r from-[#F0B35B] to-[#D4943D] text-black rounded-xl
                          text-lg font-bold
                          shadow-[0_0_15px_rgba(240,179,91,0.3)]
                          border-2 border-[#F0B35B]
                          transition-all duration-300
                          relative overflow-hidden
                          group
                        "
                      >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          Quero Testar Gratuitamente
                          <motion.span
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                          >
                            <ArrowRight size={20} />
                          </motion.span>
                        </span>
                      </motion.button>
                    </div>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm">
                      Após o envio, nossa equipe analisará seu cadastro e enviará suas credenciais de acesso
                      <br />e link personalizado em até <span className="text-[#F0B35B] font-medium">48 horas</span>.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-6 mt-8">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#252B3B] flex items-center justify-center text-[#F0B35B]">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <span className="text-gray-400 text-sm">Sem cartão de crédito</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#252B3B] flex items-center justify-center text-[#F0B35B]">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <span className="text-gray-400 text-sm">Acesso completo por 7 dias</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#252B3B] flex items-center justify-center text-[#F0B35B]">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <span className="text-gray-400 text-sm">Suporte personalizado</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer Aprimorado */}
        <footer className="bg-gradient-to-b from-[#0D121E] to-[#1A1F2E] pt-16 pb-8 w-full relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#F0B35B]/20 to-transparent"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#F0B35B]/5 rounded-full filter blur-[100px] animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#F0B35B]/5 rounded-full filter blur-[100px] animate-pulse-slow animation-delay-1000"></div>
            <div className="absolute inset-0 bg-[url('/img/pattern.svg')] opacity-[0.02]"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
              {/* Coluna 1 - Sobre */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#F0B35B] to-[#D4943D]">
                    BarberShop
                  </span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Sistema completo para gestão de barbearias. Transforme seu negócio com nossa solução all-in-one.
                </p>
                <div className="flex items-center gap-3">
                  {['instagram', 'facebook', 'youtube'].map((social) => (
                    <motion.a
                      key={social}
                      href={`#${social}`}
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="w-8 h-8 rounded-lg bg-[#252B3B] flex items-center justify-center text-[#F0B35B] hover:bg-[#F0B35B] hover:text-black transition-all duration-300"
                    >
                      <span className="text-base">{social === 'instagram' ? '📸' : social === 'facebook' ? '👥' : '🎥'}</span>
                    </motion.a>
                  ))}
                </div>
              </div>

              {/* Coluna 2 - Links Rápidos */}
              <div>
                <h4 className="text-white font-semibold mb-6">Links Rápidos</h4>
                <ul className="space-y-3">
                  {[
                    { text: 'Funcionalidades', icon: Settings },
                    { text: 'Preços', icon: DollarSign },
                    { text: 'Suporte', icon: Users },
                    { text: 'Blog', icon: BarChart }
                  ].map((item) => (
                    <li key={item.text}>
                      <motion.a
                        href="#"
                        className="text-gray-400 hover:text-[#F0B35B] transition-colors duration-300 text-sm flex items-center gap-3 group"
                        whileHover={{ x: 5 }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#252B3B] flex items-center justify-center text-[#F0B35B] group-hover:bg-[#F0B35B] group-hover:text-black transition-all duration-300">
                          <item.icon className="w-4 h-4" />
                        </div>
                        {item.text}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Coluna 3 - Contato */}
              <div>
                <h4 className="text-white font-semibold mb-6">Contato</h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#252B3B] flex items-center justify-center text-[#F0B35B] mt-1">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Atendimento</p>
                      <p className="text-white text-sm font-medium">(11) 9999-9999</p>
                      <p className="text-[#F0B35B] text-xs">Seg - Sex, 9h às 18h</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#252B3B] flex items-center justify-center text-[#F0B35B] mt-1">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Formas de Pagamento</p>
                      <p className="text-white text-sm font-medium">Cartão, PIX, Boleto</p>
                      <p className="text-[#F0B35B] text-xs">Parcele em até 12x</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Coluna 4 - Newsletter */}
              <div>
                <h4 className="text-white font-semibold mb-6">Fique por dentro</h4>
                <p className="text-gray-400 text-sm mb-6">
                  Receba dicas exclusivas e novidades para sua barbearia
                </p>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Seu melhor e-mail"
                      className="w-full px-4 py-3 rounded-xl bg-[#252B3B] border border-[#F0B35B]/20 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#F0B35B] transition-all duration-300"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#F0B35B] to-[#D4943D] text-black rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(240,179,91,0.3)]"
                  >
                    Inscrever-se
                  </motion.button>
                  <p className="text-gray-500 text-xs text-center">
                    Você pode cancelar a qualquer momento
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 py-6">
              <div className="text-gray-400 text-sm text-center sm:text-left">
                © {new Date().getFullYear()} BarberShop. Todos os direitos reservados.
              </div>
              <div className="flex items-center gap-8">
                {['Termos de Uso', 'Privacidade', 'FAQ'].map((item) => (
                  <motion.a
                    key={item}
                    href="#"
                    className="text-gray-400 hover:text-[#F0B35B] text-sm transition-colors duration-300"
                    whileHover={{ y: -2 }}
                  >
                    {item}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default VendaPage2;
