import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Calendar, PhoneCall, CheckCircle, ArrowRight,
  Users, BarChart, Smartphone, DollarSign, X, 
} from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useCountdown } from '../hooks/useCountdown';

// Screenshots do sistema
const systemScreenshots = {
  dashboard: './img/print1.png',
  calendar: './img/print2.png',
};

const testimonials = [
  {
    id: 1,
    name: "João Silva",
    role: "Proprietário - Barbearia Vintage",
    image: "./img/testimonial1.jpg",
    text: "Após implementar o BarberShop, aumentei meu faturamento em 40%. A organização que o sistema trouxe é impressionante!",
    rating: 5
  },
  {
    id: 2,
    name: "Pedro Santos",
    role: "Barbeiro Master - BarberKing",
    image: "./img/testimonial2.jpg",
    text: "Economizo 2 horas por dia desde que abandonei a agenda de papel. Os clientes adoram a facilidade de agendamento.",
    rating: 5
  },
  {
    id: 3,
    name: "Carlos Oliveira",
    role: "CEO - Barbearia Premium",
    image: "./img/testimonial3.jpg",
    text: "O melhor investimento que fiz para minha barbearia. O suporte é excelente e o sistema é muito intuitivo.",
    rating: 5
  }
];

// Dados de prova social
const socialProof = {
  stats: {
    clients: "50+",
    appointments: "5.000+",
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
const SLOTS_LEFT = 6;

const VendaPage2: React.FC = () => {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);
  const [currentDemoStep, setCurrentDemoStep] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const { hours, minutes, seconds } = useCountdown(PROMO_END_TIME);
  const [currentPrint, setCurrentPrint] = useState(0);
  const prints = ['print1.png', 'print2.png', 'print3.png'];

  // Animações
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  // Mock de demonstração do sistema
  const systemScreens = [
    {
      title: "Agenda Inteligente",
      image: "./img/print2.png", // Adicionar screenshots reais do sistema
      description: "Visualize e gerencie todos os agendamentos em uma interface intuitiva"
    },
    // ... adicionar mais telas
  ];

  // Simulação de Social Proof
  const testimonials = [
    {
      name: "Carlos Silva",
      role: "Proprietário - Barbearia Vintage",
      image: "/testimonials/carlos.jpg",
      text: "Aumentei em 40% meus agendamentos após começar a usar o sistema."
    },
    {
      name: "Rafael Santos",
      role: "Barbeiro - BarberKing",
      image: "/testimonials/rafael.jpg",
      text: "Economizo 2 horas por dia desde que abandonei a agenda de papel."
    },
    // Adicione mais depoimentos
  ];

  // Demonstração interativa do sistema
  const demoSteps = [
    {
      title: "Agenda Inteligente",
      description: "Visualize todos os agendamentos em um calendário intuitivo",
      image: "./img/print1.png",
      features: ["Visão diária/semanal/mensal", "Filtros avançados", "Notificações automáticas"]
    },
    {
      title: "Gestão de Clientes",
      description: "Mantenha um histórico completo de cada cliente",
      image: "./img/print2.png",
      features: ["Perfil detalhado", "Histórico de serviços", "Preferências salvas"]
    }
  ];

  // Atualiza testimonial automaticamente
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Timer para criar urgência
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Função para redirecionar ao login
  const handleDemoClick = () => {
    navigate('/login');
  };

  // Definição de animações comuns
  const commonAnimations = {
    headerGradient: "bg-gradient-to-br from-[#1A1F2E] to-[#0D121E]",
    cardGradient: "bg-gradient-to-br from-[#252B3B] to-[#1A1F2E]",
    glowEffect: "hover:shadow-[0_0_15px_rgba(240,179,91,0.3)]",
    buttonGradient: "bg-gradient-to-r from-[#F0B35B] to-[#D4943D]",
  };

  return (
    <>
      <Helmet>
        <title>BarberShop - Sistema de Agendamento para Barbearias</title>
        <meta name="description" content="Sistema completo para gestão de barbearias. Aumente seu faturamento e organize seus agendamentos de forma inteligente." />
        <meta name="keywords" content="barbearia, agendamento, gestão de barbearia, sistema para barbearia, agenda online" />
        <meta property="og:title" content="BarberShop - Transforme sua Barbearia" />
        <meta property="og:description" content="Sistema completo para gestão de barbearias" />
        <meta property="og:image" content={systemScreenshots.dashboard} />
        <link rel="preload" as="image" href={systemScreenshots.dashboard} />
      </Helmet>

      {/* Promoção Flutuante mais elegante */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className={`fixed bottom-0 left-0 right-0 ${commonAnimations.headerGradient} backdrop-blur-md z-50 p-4 border-t border-[#F0B35B]/10`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#F0B35B] animate-pulse">⚡</span>
            <div className="text-sm">
              <span className="font-bold text-white">Promoção Relâmpago:</span>
              <span className="text-[#F0B35B]"> Próximos {SLOTS_LEFT} clientes não pagam implementação!</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <div className="bg-[#252B3B] px-3 py-1 rounded-lg font-mono">{hours.toString().padStart(2, '0')}</div>
              <span>:</span>
              <div className="bg-[#252B3B] px-3 py-1 rounded-lg font-mono">{minutes.toString().padStart(2, '0')}</div>
              <span>:</span>
              <div className="bg-[#252B3B] px-3 py-1 rounded-lg font-mono">{seconds.toString().padStart(2, '0')}</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-[#F0B35B] text-black rounded-lg font-bold text-sm"
            >
              Aproveitar Agora
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className={`min-h-screen ${commonAnimations.headerGradient} text-white overflow-x-hidden`}>
        {/* Header mais limpo */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 w-full bg-[#1A1F2E]/80 backdrop-blur-md z-50 border-b border-[#F0B35B]/10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-[#F0B35B]">BarberShop</h1>
              <button
                onClick={handleDemoClick}
                className="px-4 py-2 rounded-lg border-2 border-[#F0B35B] text-[#F0B35B] font-medium hover:bg-[#F0B35B]/10 transition-colors"
              >
                Ver Demo
              </button>
            </div>
          </div>
        </motion.header>

        {/* Hero Section Simplificada */}
        <section className="relative min-h-[90vh] flex items-center pt-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl"
              >
                {/* Tag mais sutil */}
                <motion.div 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#F0B35B]/5 text-[#F0B35B] rounded-full mb-6 border border-[#F0B35B]/10"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  Software #1 do RJ para Barbearias
                </motion.div>

                {/* Headline mais limpa */}
                <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  Aumente seu faturamento em até 
                  <span className={`bg-clip-text text-transparent ${commonAnimations.buttonGradient}`}> 40% </span>
                </h1>

                {/* Social proof mais elegante */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {Object.entries(socialProof.stats).map(([key, value]) => (
                    <motion.div
                      key={key}
                      whileHover={{ scale: 1.05 }}
                      className={`text-center p-3 ${commonAnimations.cardGradient} rounded-lg border border-[#F0B35B]/5 ${commonAnimations.glowEffect}`}
                    >
                      <div className="text-[#F0B35B] text-2xl font-bold">{value}</div>
                      <div className="text-sm text-gray-400">
                        {key === 'clients' && 'Barbearias'}
                        {key === 'appointments' && 'Agendamentos'}
                        {key === 'satisfaction' && 'Satisfação'}
                        {key === 'timesSaved' && 'Tempo Economizado'}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* CTA mais chamativo */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`${commonAnimations.buttonGradient} px-8 py-4 rounded-lg font-bold text-black shadow-lg ${commonAnimations.glowEffect} transition-all duration-300`}
                >
                  {ctaVariants.primary.text}
                </motion.button>
              </motion.div>

              {/* Preview com efeito de glassmorphism */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative hidden lg:block"
              >
                <div className="relative w-full aspect-video bg-[#1A1F2E] rounded-lg overflow-hidden border border-[#F0B35B]/20">
                  {/* Adicionar preview do sistema aqui */}
                  <img src="/screenshots/preview.png" alt="Sistema Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D121E] to-transparent"></div>
                </div>
                
                {/* Indicadores de Funcionalidades */}
                <div className="absolute inset-0">
                  {[
                    { top: "20%", left: "10%", text: "Agenda Visual" },
                    { top: "40%", right: "10%", text: "Relatórios" },
                    { bottom: "20%", left: "20%", text: "Cliente VIP" }
                  ].map((indicator, i) => (
                    <div
                      key={i}
                      className="absolute"
                      style={{ top: indicator.top, left: indicator.left, right: indicator.right }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-3 h-3 bg-[#F0B35B] rounded-full"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Screenshots Carousel Section */}
        <section className="py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Veja o Sistema em Ação</h2>
              <p className="text-gray-400">Interface intuitiva e fácil de usar</p>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-xl">
                <motion.div
                  className="flex transition-transform duration-500"
                  style={{ transform: `translateX(-${currentPrint * 100}%)` }}
                >
                  {prints.map((print, index) => (
                    <div key={index} className="min-w-full p-2">
                      <img
                        src={`./img/${print}`}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full rounded-lg shadow-2xl border border-[#F0B35B]/20"
                      />
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Controles do Carrossel */}
              <div className="flex justify-center gap-2 mt-4">
                {prints.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPrint(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentPrint === index ? 'w-4 bg-[#F0B35B]' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

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
                {/* Conteúdo da Demo */}
                <div className="p-6">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-bold">Veja como é simples usar</h3>
                    <button
                      onClick={() => setShowDemo(false)}
                      className="p-2 hover:bg-[#252B3B] rounded-full transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Navegação da Demo */}
                    <div className="space-y-6">
                      {demoSteps.map((step, index) => (
                        <motion.button
                          key={index}
                          onClick={() => setCurrentDemoStep(index)}
                          className={`w-full text-left p-4 rounded-lg transition-all ${
                            currentDemoStep === index
                              ? 'bg-[#F0B35B] text-black'
                              : 'bg-[#252B3B] text-white hover:bg-[#2A3040]'
                          }`}
                        >
                          <h4 className="font-bold mb-2">{step.title}</h4>
                          <p className="text-sm opacity-80">{step.description}</p>
                          <div className="mt-2 space-y-1">
                            {step.features.map((feature, i) => (
                              <div key={i} className="flex items-center text-xs">
                                <span className="mr-2">•</span>
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Preview da Demo */}
                    <div className="bg-[#252B3B] rounded-lg p-4">
                      <motion.img
                        key={currentDemoStep}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        src={demoSteps[currentDemoStep].image}
                        alt={demoSteps[currentDemoStep].title}
                        className="w-full rounded-lg shadow-lg"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Como Funciona Section Aprimorada */}
        <section className="py-20 bg-[#1A1F2E]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Como Funciona</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Um sistema completo pensado para facilitar sua gestão em apenas 3 passos simples
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Linha conectora em desktop */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#F0B35B]/0 via-[#F0B35B]/20 to-[#F0B35B]/0 transform -translate-y-1/2" />

              {[
                {
                  step: "1",
                  title: "Cadastre sua Barbearia",
                  description: "Configure seus serviços, horários e profissionais em poucos minutos",
                  icon: "✂️"
                },
                {
                  step: "2",
                  title: "Compartilhe seu Link",
                  description: "Seus clientes poderão agendar 24h por dia através do link exclusivo",
                  icon: "🔗"
                },
                {
                  step: "3",
                  title: "Gerencie tudo em um lugar",
                  description: "Acompanhe agendamentos, relatórios e faturamento em tempo real",
                  icon: "📱"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="relative p-8 bg-[#252B3B] rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Número do passo com efeito de gradiente */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-[#F0B35B] to-[#D4943D] rounded-full flex items-center justify-center text-black font-bold text-lg shadow-lg">
                    {item.step}
                  </div>

                  {/* Ícone */}
                  <div className="text-4xl mb-4 mt-4">{item.icon}</div>

                  {/* Conteúdo */}
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {item.description}
                  </p>

                  {/* Indicador de próximo passo em mobile */}
                  {index < 2 && (
                    <div className="md:hidden w-px h-8 bg-gradient-to-b from-[#F0B35B]/20 to-transparent mx-auto mt-4" />
                  )}
                </motion.div>
              ))}
            </div>

            {/* CTA abaixo dos passos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-16"
            >
              <button className="px-8 py-4 bg-[#F0B35B] text-black rounded-lg font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                Começar Agora Mesmo
              </button>
            </motion.div>
          </div>
        </section>

        {/* Modal de Demonstração */}
        <AnimatePresence>
          {showDemo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-[#1A1F2E] p-6 rounded-lg w-full max-w-4xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold">Demonstração do Sistema</h3>
                  <button
                    onClick={() => setShowDemo(false)}
                    className="p-2 hover:bg-[#252B3B] rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                {/* Adicionar conteúdo da demo aqui */}
                <div className="aspect-video bg-[#252B3B] rounded-lg mb-6">
                  {/* Adicionar vídeo ou screenshots interativos */}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Benefícios */}
        <section className="py-20 bg-[#1A1F2E]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Clock, title: 'Economia de Tempo', desc: 'Reduza em até 70% o tempo gasto com agendamentos' },
                { icon: Calendar, title: 'Agenda Inteligente', desc: 'Organize todos os agendamentos em um só lugar' },
                { icon: Users, title: 'Gestão de Clientes', desc: 'Histórico completo e perfil de cada cliente' },
                { icon: BarChart, title: 'Relatórios Detalhados', desc: 'Análise completa do seu negócio' }
              ].map((item, index) => (
                <div key={index} className="p-6 bg-[#252B3B] rounded-lg">
                  <item.icon className="w-12 h-12 text-[#F0B35B] mb-4" />
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Seção de preços atualizada */}
        <section className="py-20" id="pricing">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Promoção Exclusiva
              </h2>
              <p className="text-gray-400">Aproveite nossa oferta especial por tempo limitado</p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
              {/* Card de Implementação */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`relative ${commonAnimations.cardGradient} p-8 rounded-lg border border-[#F0B35B]/10 w-full sm:w-[calc(50%-1rem)] max-w-[400px] ${commonAnimations.glowEffect}`}
              >
                <div className={`absolute -top-3 -right-3 ${commonAnimations.buttonGradient} text-black text-xs px-3 py-1 rounded-full`}>
                  {hours}h {minutes}m restantes
                </div>
                <div className="relative">
                  <h3 className="text-lg font-bold mb-2 text-gray-400">Implementação</h3>
                  <div className="text-gray-500 line-through text-sm mb-1">R$ 499,00</div>
                  <div className="text-2xl font-bold text-red-500 line-through mb-4">GRÁTIS</div>
                  <div className="absolute top-0 right-0 rotate-12 text-red-500 border-2 border-red-500 px-2 py-1 text-sm font-bold rounded">
                    Promoção
                  </div>
                </div>
              </motion.div>

              {/* Card de Mensalidade em Destaque */}
              <div className="relative bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-8 rounded-lg border-2 border-[#F0B35B] shadow-xl transform hover:scale-105 transition-all duration-300 w-full sm:w-[calc(50%-1rem)] max-w-[400px]">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#F0B35B] text-black text-sm px-4 py-1 rounded-full font-bold">
                  Somente Hoje
                </div>
                <h3 className="text-xl font-bold mb-2">Mensalidade</h3>
                <div className="text-gray-400 line-through mb-1">R$ 59,99</div>
                <div className="text-4xl font-bold text-[#F0B35B] mb-6">R$ 34,90</div>
                <ul className="space-y-4">
                  {['Atualizações', 'Suporte 24/7', 'Backups diários', 'Sem limite de agendamentos'].map((item, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-[#F0B35B] mr-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
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
                Transforme Sua Barbearia Hoje
              </h2>
              
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Junte-se às +{socialProof.stats.clients} barbearias que já estão crescendo com nosso sistema
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
                  className="group relative px-8 py-4 bg-[#F0B35B] text-black rounded-xl font-bold text-lg shadow-2xl hover:shadow-[#F0B35B]/20 transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Começar Agora
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B] to-[#D4943D] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
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

        {/* Footer */}
        <footer className="bg-[#0D121E] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-[#F0B35B] font-bold text-lg mb-4">BarberShop</h3>
                <p className="text-gray-400">
                  Sistema completo para gestão de barbearias
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-4">Contato</h4>
                <div className="space-y-2 text-gray-400">
                  <div className="flex items-center">
                    <PhoneCall className="w-5 h-5 mr-2" />
                    <span>(11) 9999-9999</span>
                  </div>
                  <div className="flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" />
                    <span>WhatsApp</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-4">Formas de Pagamento</h4>
                <div className="flex items-center space-x-4">
                  <DollarSign className="w-8 h-8 text-[#F0B35B]" />
                  {/* Adicionar mais ícones de pagamento conforme necessário */}
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

// Função auxiliar para calcular tempo restante
const calculateTimeLeft = () => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(23, 59, 59);
  const diff = midnight.getTime() - now.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

export default VendaPage2;
