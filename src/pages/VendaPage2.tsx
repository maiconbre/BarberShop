import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Calendar, CheckCircle, ArrowRight, ArrowLeft,
  Users, BarChart, Smartphone, DollarSign, X,
  Rocket, Timer, Key, Settings, Share2, ChevronRight
} from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useCountdown } from '../hooks/useCountdown';

// Dados de prova social
const socialProof = {
  stats: {
    satisfaction: "100%",
    timesSaved: "3h/dia",
    noAccount: "0 cadastros",
    noApp: "0 apps"
  },
  partners: [
    { name: "BarberPro", logo: "./img/partners/barberpro.png" },
    { name: "TopCut", logo: "./img/partners/topcut.png" },
    // Adicione mais parceiros
  ]
};

// CTAs otimizados com variantes de teste A/B
const ctaVariants = {
  primary: {
    text: "Comece Agora com 50% OFF",
    subtext: "Oferta válida por tempo limitado",
    urgency: "Apenas 3 vagas restantes neste valor!"
  },
  secondary: {
    text: "Ver Demonstração",
    subtext: "Conheça todas as funcionalidades"
  }
};

// Configuração da promoção relâmpago
const PROMO_END_TIME = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
const SLOTS_LEFT = 3;

// Adicione os dados dos feature cards
const featureCards = [
  {
    icon: "⭐",
    title: "100% Satisfação",
    description: "Clientes satisfeitos em todo RJ",
    gradient: "from-yellow-500/20 to-orange-500/20",
    borderColor: "border-yellow-500/20",
    iconColor: "text-yellow-500"
  },
  {
    icon: "⚡",
    title: "+1000 Agendamentos",
    description: "Por segundo sem travamentos",
    gradient: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/20",
    iconColor: "text-blue-500"
  },
  {
    icon: "💎",
    title: "Sistema Premium",
    description: "Design exclusivo para sua marca",
    gradient: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/20",
    iconColor: "text-purple-500"
  },
  {
    icon: "🚀",
    title: "Otimização Total",
    description: "Economia de 3h por dia",
    gradient: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/20",
    iconColor: "text-green-500"
  }
];

const VendaPage2: React.FC = () => {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);
  const { hours, minutes, seconds } = useCountdown(PROMO_END_TIME);
  // Referência para o vídeo em dispositivos móveis
  const videoRef = React.useRef<HTMLVideoElement>(null);
  // Referência para a seção hero
  const heroRef = React.useRef<HTMLDivElement>(null);
  
  // Efeito para garantir que a página sempre inicie no topo
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Foco na primeira seção
    if (heroRef.current) {
      heroRef.current.focus();
    }
  }, []);

  // Atualizar useEffect para garantir autoplay
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Autoplay foi prevenido:", error);
      });
    }
  }, []);
  
  // Efeito para resetar o passo quando o modal é fechado
  useEffect(() => {
    if (!showDemo) {
      // Quando o modal é fechado, resetamos o passo para garantir que na próxima abertura comece do início
      setCurrentStep(0);
    }
  }, [showDemo]);
  
  // Estado para animações interativas
  const [isHovered, setIsHovered] = useState(false);

  // Estado para controlar o card atual
  const [currentStep, setCurrentStep] = useState(0);
  
  // Função para abrir o modal de demonstração sempre no primeiro passo
  const openDemoModal = () => {
    setCurrentStep(0); // Garante que sempre inicie no primeiro passo
    setShowDemo(true);
  };

  // Funções para próximo/anterior
  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Gestos de touch para mobile com melhor sensibilidade
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragX, setDragX] = useState(0);
  const carouselRef = React.useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
    // Adicionar movimento em tempo real para feedback visual
    const diff = e.touches[0].clientX - touchStart;
    setDragX(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (touchStart - touchEnd > 50) {
      // Swipe esquerda - sensibilidade aumentada
      if (currentStep < demoSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
    if (touchStart - touchEnd < -50) {
      // Swipe direita - sensibilidade aumentada
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    }
    // Resetar o dragX após o swipe
    setDragX(0);
  };
  
  // Suporte para arrastar com mouse em desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragX(e.clientX - dragStartX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Determinar a direção do arrasto
    if (dragX > 100) {
      // Arrasto para direita
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    } else if (dragX < -100) {
      // Arrasto para esquerda
      if (currentStep < demoSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
    
    setDragX(0);
  };
  
  // Adicionar event listeners para mouse up global
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragX, currentStep]);
  
  // Estilo para esconder a barra de rolagem
  React.useEffect(() => {
    // Adicionar estilo para esconder a barra de rolagem
    const style = document.createElement('style');
    style.innerHTML = `
      .hide-scrollbar {
        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
      }
      .hide-scrollbar::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Animações
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  // Demonstração interativa do sistema
  const demoSteps = [
    {
      id: 1,
      title: "Implementação Rápida",
      description: "Sistema pronto e configurado em tempo recorde",
      icon: Rocket,
      details: "Nossa equipe inicia a implementação imediatamente após a confirmação",
      features: [
        "Setup completo em até 24h",
        "Normalmente pronto em 6h ou menos",
        "Acompanhamento em tempo real do progresso",
        "Suporte técnico durante todo processo"
      ],
      color: "from-blue-500/20 to-blue-600/20",
      animate: { y: [0, -5, 0], transition: { duration: 2, repeat: Infinity } }
    },
    {
      id: 2,
      title: "Receba Acesso Instantâneo",
      description: "Credenciais enviadas automaticamente",
      icon: Key,
      details: "Receba suas credenciais de acesso e link personalizado do seu sistema",
      features: [
        "Envio por email e WhatsApp",
        "Link exclusivo da sua barbearia",
        "Painel administrativo completo",
        "Acesso imediato ao sistema"
      ],
      color: "from-green-500/20 to-green-600/20",
      animate: { scale: [1, 1.02, 1], transition: { duration: 2, repeat: Infinity } }
    },
    {
      id: 3,
      title: "Configure Seu Sistema",
      description: "Personalize toda sua barbearia",
      icon: Settings,
      details: "Configure todos os aspectos do seu negócio em uma interface intuitiva",
      features: [
        "Cadastro de barbeiros e serviços",
        "Definição de horários de atendimento",
        "Criação de promoções especiais",
        "Personalização completa do sistema"
      ],
      color: "from-yellow-500/20 to-yellow-600/20",
      animate: { rotate: [-1, 1, -1], transition: { duration: 2, repeat: Infinity } }
    },
    {
      id: 4,
      title: "Comece a Usar",
      description: "Compartilhe e gerencie",
      icon: Share2,
      details: "Compartilhe seu link personalizado e comece a receber agendamentos",
      features: [
        "Link fácil de compartilhar",
        "Gestão de agendamentos em 1 clique",
        "Gerenciamento Fácil",
        "Dashboard em tempo real"
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
        <title>BarberShop - Agendamento Online para Barbearias | Sem Cadastro, Sem App</title>
        <meta name="description" content="Sistema de agendamento para barbearias. Sem necessidade de cadastro ou aplicativo. Agende em 30 segundos e aumente seu faturamento em até 70%. Sistema completo de gestão." />
        <meta name="keywords" content="agendamento barbearia, sistema barbearia, agenda online, sem cadastro, sem aplicativo, gestão barbearia" />
        <meta property="og:title" content="BarberShop - Agendamento Sem Complicação" />
        <meta property="og:description" content="Agende em 30 segundos, sem cadastro e sem baixar nada" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://barbershop.com.br" />
      </Helmet>

      {/* Promoção Flutuante mais elegante e responsiva */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className={`fixed bottom-0 left-0 right-0 ${commonAnimations.headerGradient} backdrop-blur-md z-50 p-2 sm:p-3 border-t border-[#F0B35B]/10`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[#F0B35B] animate-pulse">⚡</span>
            <div className="text-xs">
              <span className="text-[#F0B35B]">{SLOTS_LEFT} vagas restantes</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-400">Expira em:</div>
            <div className="flex items-center gap-1 text-white font-mono text-sm">
              <span>{hours.toString().padStart(2, '0')}</span>:
              <span>{minutes.toString().padStart(2, '0')}</span>:
              <span>{seconds.toString().padStart(2, '0')}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="
                px-4 py-1.5 bg-[#F0B35B] text-black rounded-lg
                text-sm font-bold
                shadow-[0_0_15px_rgba(240,179,91,0.3)]
              "
            >
              Aproveitar
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
          className="relative min-h-[90vh] flex items-center pt-16 overflow-hidden"
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
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  type: "spring",
                  stiffness: 50 
                }}
                className="max-w-2xl mx-auto text-center lg:text-left" // Centralizado em mobile
              >
                {/* Tag com animação melhorada */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-6">
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
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 sm:mb-8"
                >
                  <span className="block mb-1 sm:mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400">
                    Leve sua Barbearia para
                  </span>
                  <span className="relative">
                    <span className={`relative inline-block bg-clip-text text-transparent text-[1.2em] sm:text-[1em] ${commonAnimations.buttonGradient}`}>
                      O Próximo Nível
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
                  className="space-y-4 mb-4"
                >
                  <p className="text-gray-300 text-lg max-w-xl mx-auto lg:mx-0 mb-6">
                    Sistema completo para gerenciar sua barbearia:
                  </p>
                  
                  {/* Cards de benefícios */}
                  <div className="grid grid-cols-3 md:grid-cols-3 gap-3 sm:gap-4 max-w-xl mx-auto lg:mx-0">
                    {/* Card 1 */}
                    <motion.div
                      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(240,179,91,0.2)" }}
                      className={`${commonAnimations.cardGradient} rounded-xl p-3 sm:p-4 border border-[#F0B35B]/10 hover:border-[#F0B35B]/30 transition-all duration-300`}
                    >
                      <div className="text-center">
                        <span className="text-xl sm:text-2xl mb-1 sm:mb-2 block">⏱️</span>
                        <h3 className="text-white font-bold text-base sm:text-lg mb-0.5 sm:mb-1">Economize Tempo</h3>
                        <p className="text-gray-400 text-xs sm:text-sm">3h/dia na gestão</p>
                      </div>
                    </motion.div>
                    
                    {/* Card 2 */}
                    <motion.div
                      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(240,179,91,0.2)" }}
                      className={`${commonAnimations.cardGradient} rounded-xl p-3 sm:p-4 border border-[#F0B35B]/10 hover:border-[#F0B35B]/30 transition-all duration-300`}
                    >
                      <div className="text-center">
                        <span className="text-xl sm:text-2xl mb-1 sm:mb-2 block">⭐</span>
                        <h3 className="text-white font-bold text-base sm:text-lg mb-0.5 sm:mb-1">100% Satisfação</h3>
                        <p className="text-gray-400 text-xs sm:text-sm">Clientes satisfeitos</p>
                      </div>
                    </motion.div>
                    
                    {/* Card 3 */}
                    <motion.div
                      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(240,179,91,0.2)" }}
                      className={`${commonAnimations.cardGradient} rounded-xl p-3 sm:p-4 border border-[#F0B35B]/10 hover:border-[#F0B35B]/30 transition-all duration-300`}
                    >
                      <div className="text-center">
                        <span className="text-xl sm:text-2xl mb-1 sm:mb-2 block">📱</span>
                        <h3 className="text-white font-bold text-base sm:text-lg mb-0.5 sm:mb-1">Design Premium</h3>
                        <p className="text-gray-400 text-xs sm:text-sm">Adaptável a qualquer tela</p>
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
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
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
                        Garanta 50% OFF
                        <motion.span
                          animate={isHovered ? { rotate: [0, 15, -15, 0] } : {}}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
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
                  
                  {/* Imagem principal */}
                  <img
                    src="./img/demofoto.png"
                    alt="Preview do Sistema"
                    className="absolute inset-0 w-full h-full object-cover object-center z-10"
                  />
                  
                  {/* Overlay gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D121E] via-[#0D121E]/50 to-transparent opacity-70 z-20"></div>
                  
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

        {/* Removido a seção de vídeo demo para dispositivos móveis */}

        {/* Demonstração Interativa */}
        <AnimatePresence>
          {showDemo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 overflow-y-auto sm:overflow-hidden"
            >
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                className="min-h-screen flex items-center justify-center"
              >
                <div className="w-full sm:max-w-4xl bg-gradient-to-br from-[#1A1F2E] to-[#0D121E] sm:rounded-2xl overflow-hidden border-y sm:border border-[#F0B35B]/20">
                  <div className="p-4 sm:p-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6 sm:mb-8">
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#F0B35B] to-[#D4943D]">
                          Como Funciona
                        </h3>
                        <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">Siga o passo a passo</p>
                      </div>
                      <button
                        onClick={() => setShowDemo(false)}
                        className="p-2 hover:bg-[#252B3B] rounded-full transition-colors"
                      >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>

                    {/* Steps Indicator */}
                    <div className="flex justify-center mb-6">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {demoSteps.map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                              idx === currentStep 
                                ? 'w-6 sm:w-8 bg-[#F0B35B]' 
                                : idx < currentStep 
                                  ? 'w-1.5 sm:w-2 bg-[#F0B35B]/50'
                                  : 'w-1.5 sm:w-2 bg-[#F0B35B]/20'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Content - Carrossel Interativo */}
                    <div
                      ref={carouselRef}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={() => isDragging && handleMouseUp()}
                      className="relative px-0 sm:px-4 select-none"
                    >
                      {/* Indicador de arraste para mobile */}
                      <div className="flex justify-center mb-4">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <motion.div 
                            animate={{ x: [-5, 5, -5] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-[#F0B35B]"
                          >
                            ⟺
                          </motion.div>
                          <span className="sm:text-sm">Deslize para navegar</span>
                          <motion.div 
                            animate={{ x: [5, -5, 5] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-[#F0B35B]"
                          >
                            ⟺
                          </motion.div>
                        </div>
                      </div>

                      {/* Carrossel de Cards */}
                      <div className="overflow-hidden pb-4">
                        <div 
                          className="flex gap-4 sm:gap-6 transition-transform duration-300 touch-pan-x"
                          style={{ 
                            transform: `translateX(calc(-${currentStep * 100}% / ${demoSteps.length} ${isDragging ? `+ ${dragX}px` : ''}))`
                          }}
                        >
                          {demoSteps.map((step, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0.5, scale: 0.95 }}
                              animate={{ 
                                opacity: currentStep === idx ? 1 : 0.7,
                                scale: currentStep === idx ? 1 : 0.95,
                              }}
                              transition={{ duration: 0.3 }}
                              className={`flex-shrink-0 w-[85vw] sm:w-[450px] md:w-[500px] bg-[#252B3B] rounded-lg border ${currentStep === idx ? 'border-[#F0B35B]/30' : 'border-[#F0B35B]/10'} p-4 sm:p-6 transition-all duration-300 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${idx === currentStep ? 'shadow-[0_0_15px_rgba(240,179,91,0.15)]' : ''}`}
                            >
                              {/* Icon and Title */}
                              <div className="flex flex-col items-center text-center mb-4 sm:mb-6">
                                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mb-3 sm:mb-4`}>
                                  {React.createElement(step.icon, {
                                    className: "w-7 h-7 sm:w-8 sm:h-8 text-white"
                                  })}
                                </div>
                                <h4 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
                                  {step.title}
                                </h4>
                                <p className="text-gray-400 text-sm sm:text-base max-w-xl">
                                  {step.description}
                                </p>
                              </div>

                              {/* Features */}
                              <div className="bg-[#1A1F2E] rounded-lg p-3 sm:p-5">
                                <p className="text-gray-300 mb-3 sm:mb-4 text-center text-xs sm:text-sm">
                                  {step.details}
                                </p>
                                <div className="grid grid-cols-1 gap-2 sm:gap-3 max-w-md mx-auto">
                                  {step.features.map((feature, featureIdx) => (
                                    <motion.div
                                      key={featureIdx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: featureIdx * 0.1 }}
                                      className="flex items-center gap-2 sm:gap-3 bg-[#252B3B]/50 p-2 sm:p-3 rounded-lg"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F0B35B] flex-shrink-0" />
                                      <span className="text-gray-300 text-xs sm:text-sm">{feature}</span>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Barra de Progresso Interativa */}
                      <div className="mt-6 sm:mt-8 px-4">
                        <div className="relative h-2 bg-[#1A1F2E] rounded-full overflow-hidden">
                          {/* Barra de progresso */}
                          <motion.div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#F0B35B] to-[#D4943D] rounded-full"
                            style={{ width: `${(currentStep / (demoSteps.length - 1)) * 100}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentStep / (demoSteps.length - 1)) * 100}%` }}
                            transition={{ duration: 0.3 }}
                          />
                          
                          {/* Pontos clicáveis */}
                          <div className="absolute top-0 left-0 w-full h-full flex justify-between px-1">
                            {demoSteps.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCurrentStep(idx)}
                                className={`w-4 h-4 rounded-full -mt-1 transition-all ${idx <= currentStep ? 'bg-[#F0B35B]' : 'bg-[#1A1F2E] border border-[#F0B35B]/30'}`}
                                aria-label={`Ir para o passo ${idx + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Indicadores de texto */}
                        <div className="flex justify-between mt-2 px-1 text-xs text-gray-400">
                          <span>Início</span>
                          <span>Fim</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 sm:mt-8 text-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowDemo(false)}
                        className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#F0B35B] to-[#D4943D] text-black rounded-lg font-bold text-base sm:text-lg"
                      >
                        Começar Agora
                      </motion.button>
                      
                    </div>
                  </div>
                </div>
              </motion.div>
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
              {...fadeInUp} 
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
                <div className={`absolute -top-3 -right-3 ${commonAnimations.buttonGradient} text-black text-xs px-3 py-1 rounded-full`}>
                  {hours}h {minutes}m restantes
                </div>
                <div className="relative">
                  <h3 className="text-xl font-bold mb-2 text-white">Plano Mensal</h3>
                  <div className="text-4xl font-bold text-[#F0B35B] mb-1">R$ 43,90</div>
                  <div className="text-sm text-gray-400 mb-4">Cobrado mensalmente</div>
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
                <div className="text-4xl font-bold text-[#F0B35B] mb-1">R$ 239,40</div>
                <div className="text-lg text-[#F0B35B] mb-4 ">ou 6x de R$ 39,90</div>
                <div className="text-sm text-[#F0B35B] mb-6">Apenas R$ 39,90/mês<br/> (Economia de 12%)</div>
                <ul className="space-y-3 mb-6">
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

              {/* Card Plano Anual */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`relative ${commonAnimations.cardGradient} p-8 rounded-lg border border-[#F0B35B]/10 w-full sm:w-[calc(33%-1rem)] max-w-[350px] ${commonAnimations.glowEffect}`}
              >
                <div className={`absolute -top-3 -right-3 ${commonAnimations.buttonGradient} text-black text-xs px-3 py-1 rounded-full`}>
                  Melhor Valor
                </div>
                <div className="relative">
                  <h3 className="text-xl font-bold mb-2 text-white">Plano Anual</h3>
                  <div className="text-4xl font-bold text-[#F0B35B] mb-1">R$ 419,80</div>
                  <div className="text-lg text-[#F0B35B] mb-4">ou 12x de R$ 34,90</div>
                  <div className="text-sm text-[#F0B35B] mb-4">Apenas R$ 34,90/mês <br/>(economia de 25%)</div>
                  <ul className="space-y-3 mb-6">
                    {['Atualizações', 'Suporte 24/7', 'Backups diários', 'Sem limite de agendamentos', 'Relatórios avançados', 'Economia garantida', 'Acesso a novos recursos'].map((item, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-[#F0B35B] mr-2" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="
                    w-full py-3 bg-[#F0B35B]/10 text-[#F0B35B] rounded-lg
                    font-medium
                    transition-all duration-300
                    hover:bg-[#F0B35B]/20
                    border border-[#F0B35B]/30
                  ">
                    Escolher Plano
                  </button>
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
        {/* CTA Final Aprimorado */}
        <section className="relative py-24 bg-gradient-to-br from-[#1A1F2E] to-[#0D121E] overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[#F0B35B]/5 animate-pulse"></div>
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#F0B35B] to-[#D4943D]">
                Transforme sua Barbearia Hoje
              </h2>

              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Junte-se às barbearias que já estão crescendo com nosso sistema
              </p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
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
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="
                      relative overflow-hidden
                      px-8 py-4 bg-[#F0B35B] text-black rounded-xl
                      font-bold text-lg
                      transition-all duration-500
                      shadow-[0_0_25px_rgba(240,179,91,0.4)]
                      border-2 border-[#F0B35B]
                      before:absolute before:inset-0
                      before:bg-gradient-to-r before:from-[#F0B35B]/0 
                      before:via-white/40 before:to-[#F0B35B]/0
                      before:-skew-x-45 before:animate-shine
                    "
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Começar Agora
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.button>

                  {/* Contador movido para ao lado do botão */}
                  <div className="flex items-center gap-2 bg-[#252B3B] px-4 py-2 rounded-lg">
                    <span className="text-sm text-gray-400">Oferta expira em:</span>
                    <div className="font-mono text-[#F0B35B]">
                      {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Footer Aprimorado */}
        <footer className="bg-gradient-to-b from-[#0D121E] to-[#1A1F2E] pt-16 pb-24 sm:pb-16 w-full relative">
          {/* Decoração de fundo */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#F0B35B] to-transparent"></div>
            <div className="absolute -top-10 right-0 w-72 h-72 bg-[#F0B35B]/5 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F0B35B]/5 rounded-full filter blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 relative">
            {/* Grid Principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {/* Coluna 1 - Sobre */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#F0B35B] to-[#D4943D]">
                    BarberShop
                  </span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Sistema completo para gestão de barbearias. Transforme seu negócio com nossa solução all-in-one.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <motion.a 
                    href="#"
                    whileHover={{ scale: 1.1 }}
                    className="w-8 h-8 rounded-full bg-[#252B3B] flex items-center justify-center text-[#F0B35B] hover:bg-[#F0B35B] hover:text-black transition-all duration-300"
                  >
                    <span className="text-lg">🔥</span>
                  </motion.a>
                  <motion.a 
                    href="#"
                    whileHover={{ scale: 1.1 }}
                    className="w-8 h-8 rounded-full bg-[#252B3B] flex items-center justify-center text-[#F0B35B] hover:bg-[#F0B35B] hover:text-black transition-all duration-300"
                  >
                    <span className="text-lg">💈</span>
                  </motion.a>
                </div>
              </div>

              {/* Coluna 2 - Links Rápidos */}
              <div>
                <h4 className="text-white font-semibold mb-4">Links Rápidos</h4>
                <ul className="space-y-2">
                  {['Funcionalidades', 'Preços', 'Suporte', 'Blog'].map((item) => (
                    <li key={item}>
                      <motion.a
                        href="#"
                        className="text-gray-400 hover:text-[#F0B35B] transition-colors duration-300 text-sm flex items-center gap-2"
                        whileHover={{ x: 5 }}
                      >
                        <ArrowRight className="w-3 h-3" />
                        {item}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Coluna 3 - Contato */}
              <div>
                <h4 className="text-white font-semibold mb-4">Contato</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-400 text-sm">
                    <div className="w-8 h-8 rounded-full bg-[#252B3B] flex items-center justify-center text-[#F0B35B]">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <span>(11) 9999-9999</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-400 text-sm">
                    <div className="w-8 h-8 rounded-full bg-[#252B3B] flex items-center justify-center text-[#F0B35B]">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span>Formas de Pagamento</span>
                      <span className="text-xs text-[#F0B35B]">Cartão, PIX, Boleto</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Coluna 4 - Newsletter */}
              <div>
                <h4 className="text-white font-semibold mb-4">Fique por dentro</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Receba dicas e novidades para sua barbearia
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Seu melhor e-mail"
                    className="flex-1 px-3 py-2 rounded-lg bg-[#252B3B] border border-[#F0B35B]/20 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#F0B35B]"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-[#F0B35B] text-black rounded-lg text-sm font-medium hover:bg-[#D4943D] transition-colors duration-300"
                  >
                    Enviar
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Separador */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#F0B35B]/20 to-transparent mb-8"></div>

            {/* Bottom Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-gray-400 text-sm">
                © {new Date().getFullYear()} BarberShop. Todos os direitos reservados.
              </div>
              <div className="flex items-center gap-6">
                <motion.a
                  href="#"
                  className="text-gray-400 hover:text-[#F0B35B] text-sm transition-colors duration-300"
                  whileHover={{ y: -2 }}
                >
                  Termos de Uso
                </motion.a>
                <motion.a
                  href="#"
                  className="text-gray-400 hover:text-[#F0B35B] text-sm transition-colors duration-300"
                  whileHover={{ y: -2 }}
                >
                  Privacidade
                </motion.a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default VendaPage2;
