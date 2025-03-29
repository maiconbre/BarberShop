import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Calendar, CheckCircle, ArrowRight,
  Users, BarChart, Smartphone, DollarSign, X,
} from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useCountdown } from '../hooks/useCountdown';



// Dados de prova social
const socialProof = {
  stats: {
    satisfaction: "99%",
    timesSaved: "3h/dia"
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
  
  // Estado para animações interativas
  const [isHovered, setIsHovered] = useState(false);

  // Animações
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };


  // Demonstração interativa do sistema
  const demoSteps = [
    {
      title: "Agenda Inteligente",
      description: "Visualize todos os agendamentos em um calendário intuitivo",
      icon: Calendar,
      features: ["Visão diária/semanal/mensal", "Filtros avançados", "Notificações automáticas"]
    },
    {
      title: "Gestão de Clientes",
      description: "Mantenha um histórico completo de cada cliente",
      icon: Users,
      features: ["Perfil detalhado", "Histórico de serviços", "Preferências salvas"]
    },
    {
      title: "Relatórios e Análises",
      description: "Acompanhe o desempenho do seu negócio com dados em tempo real",
      icon: BarChart,
      features: ["Faturamento diário/mensal", "Serviços mais populares", "Horários de pico"]
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
        <title>BarberShop - Sistema de Agendamento para Barbearias</title>
        <meta name="description" content="Sistema completo para gestão de barbearias. Aumente seu faturamento e organize seus agendamentos de forma inteligente." />
        <meta name="keywords" content="barbearia, agendamento, gestão de barbearia, sistema para barbearia, agenda online" />
        <meta property="og:title" content="BarberShop - Transforme sua Barbearia" />
        <meta property="og:description" content="Sistema completo para gestão de barbearias" />
      </Helmet>

      {/* Promoção Flutuante mais elegante e responsiva */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className={`fixed bottom-0 left-0 right-0 ${commonAnimations.headerGradient} backdrop-blur-md z-50 p-3 sm:p-4 border-t border-[#F0B35B]/10`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="text-[#F0B35B] animate-pulse">⚡</span>
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-white">Promoção:</span>
              <span className="text-[#F0B35B]"> {SLOTS_LEFT} vagas com desconto!</span>
            </div>
          </div>
          <div className="flex flex-col xs:flex-row items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
            <div className="flex items-center gap-1 sm:gap-2 text-white">
              <div className="bg-[#252B3B] px-2 sm:px-3 py-1 rounded-lg font-mono text-xs sm:text-sm">{hours.toString().padStart(2, '0')}</div>
              <span>:</span>
              <div className="bg-[#252B3B] px-2 sm:px-3 py-1 rounded-lg font-mono text-xs sm:text-sm">{minutes.toString().padStart(2, '0')}</div>
              <span>:</span>
              <div className="bg-[#252B3B] px-2 sm:px-3 py-1 rounded-lg font-mono text-xs sm:text-sm">{seconds.toString().padStart(2, '0')}</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="
                relative overflow-hidden
                px-4 py-2 bg-[#F0B35B] text-black rounded-lg
                font-bold text-xs sm:text-sm w-full xs:w-auto
                transition-all duration-500
                shadow-[0_0_15px_rgba(240,179,91,0.3)]
                border border-[#F0B35B]
                before:absolute before:inset-0
                before:bg-gradient-to-r before:from-[#F0B35B]/0 
                before:via-white/40 before:to-[#F0B35B]/0
                before:-skew-x-45 before:animate-shine
              "
            >
              <span className="relative z-10">Aproveitar</span>
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
                onClick={() => setShowDemo(true)}
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
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(240,179,91,0.15)" }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#F0B35B]/5 text-[#F0B35B] rounded-full mb-6 border border-[#F0B35B]/10 mx-auto lg:mx-0 cursor-pointer backdrop-blur-sm"
                >
                  <span className="animate-pulse text-lg">⭐</span>
                  <span>Software #1 do RJ para Barbearias</span>
                </motion.div>

                {/* Headline com animação de texto otimizado para mobile-first */}
                <motion.h1 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400"
                >
                  <span className="block mb-1 sm:mb-2">Leve sua Barbearia</span>
                  <span className="relative">
                    <span className={`relative inline-block bg-clip-text text-transparent ${commonAnimations.buttonGradient}`}>
                      para o Próximo Nível
                      <motion.span 
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                        className="absolute -bottom-1 sm:-bottom-2 left-0 h-[2px] sm:h-[3px] bg-gradient-to-r from-[#F0B35B]/0 via-[#F0B35B] to-[#F0B35B]/0"
                      />
                    </span>
                  </span>
                </motion.h1>

                {/* Subtítulo com fade-in */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="text-gray-300 text-lg mb-8 max-w-xl mx-auto lg:mx-0"
                >
                  Sistema completo para gestão da sua barbearia com agendamento online, controle financeiro e fidelização de clientes.
                </motion.p>

                {/* Social proof com contador animado */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  className="grid grid-cols-2 gap-6 mb-10"
                >
                  {Object.entries(socialProof.stats).map(([key, value], index) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1 + (index * 0.2) }}
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 0 25px rgba(240,179,91,0.2)",
                        y: -5
                      }}
                      className={`group text-center p-5 ${commonAnimations.cardGradient} rounded-xl border border-[#F0B35B]/10 transition-all duration-300 cursor-pointer relative overflow-hidden`}
                    >
                      {/* Efeito de brilho no hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      
                      <div className="text-[#F0B35B] text-3xl font-bold mb-1 relative z-10">{value}</div>
                      <div className="text-sm text-gray-300 font-medium relative z-10">
                        {key === 'satisfaction' && 'Satisfação dos Clientes'}
                        {key === 'timesSaved' && 'Tempo Economizado'}
                      </div>
                    </motion.div>
                  ))}
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
                    onClick={() => setShowDemo(true)}
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
              className="fixed inset-0 bg-black/90 z-50 p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                className="max-w-6xl mx-auto bg-[#1A1F2E] rounded-2xl overflow-hidden mt-20"
              >
                {/* Conteúdo do Modal Simplificado */}
                <div className="p-6">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-bold text-[#F0B35B]">Veja como é simples usar</h3>
                    <button
                      onClick={() => setShowDemo(false)}
                      className="p-2 hover:bg-[#252B3B] rounded-full transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-8">
                    {demoSteps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className="bg-[#252B3B] rounded-lg p-6 hover:shadow-lg hover:shadow-[#F0B35B]/10 transition-all duration-300 border border-[#F0B35B]/10 hover:border-[#F0B35B]/30"
                      >
                        <div className="mb-6 flex justify-center">
                          {React.createElement(step.icon, {
                            className: "w-16 h-16 text-[#F0B35B]"
                          })}
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-center">{step.title}</h3>
                        <p className="text-gray-400 mb-6 text-center text-sm">{step.description}</p>
                        <div className="bg-[#1A1F2E] p-4 rounded-lg">
                          <ul className="space-y-3">
                            {step.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center text-sm">
                                <CheckCircle className="w-4 h-4 text-[#F0B35B] mr-2 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-10 flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowDemo(false)}
                      className="px-8 py-3 bg-gradient-to-r from-[#F0B35B] to-[#D4943D] text-black rounded-lg font-bold"
                    >
                      Entendi, quero começar agora!
                    </motion.button>
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
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

                <motion.a
                  href="#"
                  className="text-[#F0B35B] underline-offset-4 hover:underline"
                >
                  Ver demonstração
                </motion.a>

              </motion.div>

              {/* Contador Regressivo */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-400 mb-2">Promoção termina em</p>
                <div className="flex justify-center gap-2 text-2xl font-mono">
                  <div className="bg-[#252B3B] px-4 py-2 rounded-lg">
                    <span className="text-[#F0B35B]">{hours.toString().padStart(2, '0')}</span>
                  </div>
                  <span className="text-[#F0B35B]">:</span>
                  <div className="bg-[#252B3B] px-4 py-2 rounded-lg">
                    <span className="text-[#F0B35B]">{minutes.toString().padStart(2, '0')}</span>
                  </div>
                  <span className="text-[#F0B35B]">:</span>
                  <div className="bg-[#252B3B] px-4 py-2 rounded-lg">
                    <span className="text-[#F0B35B]">{seconds.toString().padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer - Melhorado para mobile */}
        <footer className="bg-[#0D121E] py-10 pb-32 sm:pb-40 w-full relative">  {/* Ajustado padding para compensar o componente fixo */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              <div className="text-center sm:text-left">
                <h3 className="text-[#F0B35B] font-bold text-lg mb-3">BarberShop</h3>
                <p className="text-gray-400 text-sm">
                  Sistema completo para gestão de barbearias
                </p>
              </div>
              <div className="text-center sm:text-left">
                <h4 className="font-bold mb-3">Contato</h4>
                <div className="space-y-2 text-gray-400 text-sm">
                  <div className="flex items-center justify-center sm:justify-start">
                    <Smartphone className="w-4 h-4 mr-2" />
                    <span>WhatsApp</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start">
                    <span>(11) 9999-9999</span>
                  </div>
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h4 className="font-bold mb-3">Formas de Pagamento</h4>
                <div className="flex items-center justify-center sm:justify-start space-x-4">
                  <DollarSign className="w-6 h-6 text-[#F0B35B]" />
                  <div className="text-xs text-gray-400">Cartão de crédito, Pix, Boleto</div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
              © {new Date().getFullYear()} BarberShop. Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};



export default VendaPage2;
