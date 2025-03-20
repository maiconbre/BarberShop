import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Calendar, CheckCircle, ArrowRight,
  Users, BarChart, Smartphone, DollarSign, X,
} from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useCountdown } from '../hooks/useCountdown';

// Configuração do vídeo para mobile
const videoConfig = {
  src: './video/Demo oficial.mp4',
  poster: './img/demofoto.png'
};


// Dados de prova social
const socialProof = {
  stats: {
    clients: "10+",
    appointments: "1.000+",
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
  const { hours, minutes, seconds } = useCountdown(PROMO_END_TIME);
  // Referência para o vídeo em dispositivos móveis
  const videoRef = React.useRef<HTMLVideoElement>(null);
  

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
              className="px-4 py-2 bg-[#F0B35B] text-black rounded-lg font-bold text-xs sm:text-sm w-full xs:w-auto"
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
                onClick={handleDemoClick}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border-2 border-[#F0B35B] text-[#F0B35B] text-sm sm:text-base font-medium hover:bg-[#F0B35B]/10 transition-colors"
              >
                Ver Demo
              </button>
            </div>
          </div>
        </motion.header>

        {/* Hero Section Simplificada */}
        <section className="relative min-h-[90vh] flex items-center pt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
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
                  Leve sua Barbearia e seu Negócio para o <br/>
                  <span className={`bg-clip-text text-transparent ${commonAnimations.buttonGradient}`}> Próximo Nível </span>
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
                  "Garanta Seu Desconto Agora - 50% OFF!"
                  <span className="text-xs block mt-2">{ctaVariants.primary.urgency}</span>
                </motion.button>
              </motion.div>

              {/* Preview com efeito de glassmorphism - apenas desktop */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative hidden lg:block"
              >
                <div className="relative w-full aspect-video bg-[#1A1F2E] rounded-lg overflow-hidden border border-[#F0B35B]/20">
                  <img 
                    src="./img/demofoto.png" 
                    alt="Preview do Sistema"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D121E] via-transparent to-transparent opacity-90"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Vídeo Demo Section - Visível apenas em dispositivos móveis */}
        <section className="py-12 md:py-20 block md:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Veja o Sistema em Ação</h2>
              <p className="text-gray-400">Interface intuitiva e fácil de usar</p>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-xl">
                <div className="p-2">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <video
                      ref={videoRef}
                      src={videoConfig.src}
                      poster={videoConfig.poster}
                      className="w-full rounded-lg shadow-2xl border border-[#F0B35B]/20"
                      controls
                      playsInline
                      preload="metadata"
                    />
                  </motion.div>
                  <div className="mt-4 text-center text-sm text-gray-400">
                    <p>Toque para assistir a demonstração</p>
                  </div>
                </div>
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
                          className={`w-full text-left p-4 rounded-lg transition-all ${currentDemoStep === index
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

                    {/* Preview da Demo com ícones */}
                    <div className="bg-[#252B3B] rounded-lg p-6 flex items-center justify-center">
                      <motion.div
                        key={currentDemoStep}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center"
                      >
                        <div className="mb-6 flex justify-center">
                          {React.createElement(demoSteps[currentDemoStep].icon, { 
                            className: "w-24 h-24 text-[#F0B35B]" 
                          })}
                        </div>
                        <h3 className="text-xl font-bold mb-4">{demoSteps[currentDemoStep].title}</h3>
                        <p className="text-gray-400 mb-6">{demoSteps[currentDemoStep].description}</p>
                        <div className="bg-[#1A1F2E] p-4 rounded-lg">
                          <ul className="space-y-3">
                            {demoSteps[currentDemoStep].features.map((feature, idx) => (
                              <li key={idx} className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-[#F0B35B] mr-2" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
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
              <button className="px-8 py-4 bg-gradient-to-r from-[#F0B35B] to-[#D4943D] hover:from-[#D4943D] hover:to-[#F0B35B] text-black rounded-lg font-bold text-lg transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-[0_10px_20px_rgba(240,179,91,0.3)]">
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
                Junte-se às {socialProof.stats.clients} barbearias que já estão crescendo com nosso sistema
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
