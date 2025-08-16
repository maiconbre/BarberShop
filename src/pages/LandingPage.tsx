import { useState, useEffect } from 'react';
import { 
  Scissors, 
  Calendar, 
  Users, 
  BarChart3, 
  CheckCircle, 
  Star,
  ArrowRight,
  Smartphone,
  Play,
  Shield,
  Zap,
  Trophy,
  ChevronDown,
  ChevronUp,
  Quote
} from 'lucide-react';

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Calendar className="w-10 h-10" />,
      title: 'Agendamentos 24/7',
      description: 'Seus clientes agendam online a qualquer hora, sem ligações ou WhatsApp. Sistema inteligente que evita conflitos.',
      benefit: '+300% mais agendamentos'
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: 'Gestão Completa',
      description: 'Organize barbeiros, horários e serviços em uma plataforma única. Controle total do seu time.',
      benefit: 'Economia de 5h/semana'
    },
    {
      icon: <BarChart3 className="w-10 h-10" />,
      title: 'Relatórios Inteligentes',
      description: 'Dados em tempo real sobre faturamento, agendamentos e performance. Tome decisões baseadas em dados.',
      benefit: 'Aumente receita em 40%'
    },
    {
      icon: <Smartphone className="w-10 h-10" />,
      title: 'Página Profissional',
      description: 'Sua barbearia online com URL personalizada. Design responsivo que impressiona clientes.',
      benefit: 'Presença digital profissional'
    }
  ];

  const plans = [
    {
      name: 'Gratuito',
      price: 'R$ 0',
      period: '/mês',
      description: 'Ideal para começar',
      originalPrice: null,
      savings: null,
      features: [
        '1 barbeiro incluído',
        '20 agendamentos/mês',
        'Página personalizada profissional',
        'Sistema completo de gestão',
        'Suporte via email',
        'URL própria (suabarbearia.com)',
        'Notificações por WhatsApp'
      ],
      cta: 'Começar Grátis',
      popular: false,
      highlight: '🎉 Sem cartão de crédito',
      highlightColor: 'green'
    },
    {
      name: 'Pro',
      price: 'R$ 39',
      period: '/mês',
      description: 'Para barbearias em crescimento',
      originalPrice: 'R$ 59',
      savings: 'Economize R$ 240/ano',
      features: [
        'Barbeiros ilimitados',
        'Agendamentos ilimitados',
        'Relatórios avançados e analytics',
        'Suporte prioritário via WhatsApp',
        'Integrações premium (PIX, cartão)',
        'Domínio personalizado gratuito',
        'Lembretes automáticos SMS',
        'Dashboard em tempo real',
        'Backup automático dos dados'
      ],
      cta: 'Testar 14 Dias Grátis',
      popular: true,
      highlight: '🚀 Teste grátis 14 dias',
      highlightColor: 'blue'
    }
  ];

  const testimonials = [
    {
      name: 'João Silva',
      business: 'Barbearia do João',
      location: 'São Paulo, SP',
      text: 'Em 2 meses triplicamos os agendamentos. O sistema é muito fácil e os clientes adoram a praticidade de agendar online.',
      rating: 5,
      image: '👨‍💼',
      metrics: '+300% agendamentos'
    },
    {
      name: 'Carlos Santos',
      business: 'Santos Barber Shop',
      location: 'Rio de Janeiro, RJ',
      text: 'Finalmente consigo ter controle total da agenda. Antes era uma bagunça, agora tudo organizado automaticamente.',
      rating: 5,
      image: '👨‍🦲',
      metrics: '5h/semana economizadas'
    },
    {
      name: 'Pedro Costa',
      business: 'Costa Premium Hair',
      location: 'Belo Horizonte, MG',
      text: 'Os relatórios me mostraram onde estava perdendo dinheiro. Hoje faturamos 40% mais com a mesma estrutura.',
      rating: 5,
      image: '👨‍🎨',
      metrics: '+40% faturamento'
    }
  ];

  const faqData = [
    {
      question: 'Como funciona o período gratuito?',
      answer: 'O plano gratuito inclui 1 barbeiro e 20 agendamentos por mês para sempre. Não é um teste - é realmente grátis! Se precisar de mais, pode fazer upgrade a qualquer momento.'
    },
    {
      question: 'Preciso de conhecimento técnico?',
      answer: 'Não! O sistema é super intuitivo. Em 2 minutos você já está recebendo agendamentos. Nosso suporte te ajuda com tudo que precisar.'
    },
    {
      question: 'Como os clientes vão agendar?',
      answer: 'Você ganha uma página personalizada (exemplo: suabarbearia.com) que pode compartilhar nas redes sociais, WhatsApp ou imprimir em cartões. Os clientes agendam direto lá.'
    },
    {
      question: 'E se eu não gostar do sistema?',
      answer: 'Sem problemas! O plano gratuito não tem compromisso e o Pro tem 14 dias de teste grátis. Você pode cancelar a qualquer momento com 1 clique.'
    },
    {
      question: 'O sistema funciona no celular?',
      answer: 'Sim! Funciona perfeitamente no celular, tablet e computador. Tanto para você gerenciar quanto para os clientes agendarem.'
    }
  ];

  const stats = [
    { number: '5.000+', label: 'Agendamentos/mês', icon: <Calendar className="w-6 h-6" /> },
    { number: '500+', label: 'Barbearias ativas', icon: <Scissors className="w-6 h-6" /> },
    { number: '98%', label: 'Satisfação', icon: <Star className="w-6 h-6" /> },
    { number: '2min', label: 'Setup médio', icon: <Zap className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D121E] via-[#1A1F2E] to-[#0D121E] text-white">
      {/* Floating CTA */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="bg-[#F0B35B] text-black px-6 py-3 rounded-full font-bold shadow-2xl hover:shadow-[#F0B35B]/30 hover:scale-105 transition-all duration-300 flex items-center gap-2 animate-pulse">
          <Scissors className="w-5 h-5" />
          Grátis Agora
        </button>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0D121E]/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="text-[#F0B35B] text-xl font-bold tracking-wider border-2 border-[#F0B35B] px-4 py-2 rounded-lg bg-gradient-to-r from-[#F0B35B]/10 to-transparent">
                BARBER<span className="text-white">SHOP</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-300 hover:text-[#F0B35B] transition-colors font-medium">
                Entrar
              </button>
              <button className="bg-gradient-to-r from-[#F0B35B] to-[#F0B35B]/80 text-black px-6 py-2.5 rounded-lg font-bold hover:shadow-lg hover:shadow-[#F0B35B]/30 transition-all duration-300 hover:scale-105">
                Começar Grátis
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        {/* Enhanced background decorations */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#F0B35B]/30 to-purple-500/20 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-gradient-to-tl from-blue-500/20 to-transparent rounded-full blur-3xl translate-x-1/3"></div>
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-2xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 px-4 py-2 rounded-full mb-6">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-semibold text-sm">
                ✓ Confiado por 500+ barbearias • Sistema 100% seguro
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="block text-white/95 mb-2">Transforme sua barbearia</span>
              <span className="bg-gradient-to-r from-[#F0B35B] via-yellow-400 to-[#F0B35B] bg-clip-text text-transparent font-black">
                em negócio digital
              </span>
            </h1>
            
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <div className="bg-gradient-to-r from-[#F0B35B]/20 to-yellow-500/20 border border-[#F0B35B]/30 px-4 py-2 rounded-full">
                <span className="text-[#F0B35B] font-bold">🚀 Sistema SaaS Completo</span>
              </div>
              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 px-4 py-2 rounded-full">
                <span className="text-purple-400 font-bold">⚡ Setup em 2 minutos</span>
              </div>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-4xl mx-auto leading-relaxed">
              Agendamentos online 24/7, página profissional personalizada e gestão completa.
            </p>
            <p className="text-lg text-[#F0B35B] font-semibold mb-8 max-w-3xl mx-auto">
              <strong>Comece 100% GRÁTIS</strong> e aumente seus agendamentos em até 300% no primeiro mês!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button className="group bg-gradient-to-r from-[#F0B35B] to-yellow-400 text-black px-8 py-4 rounded-xl text-lg font-black hover:shadow-2xl hover:shadow-[#F0B35B]/40 transition-all duration-300 hover:scale-105 flex items-center gap-3 min-w-[280px] justify-center">
                <Scissors className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                Criar Barbearia GRÁTIS
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button className="group border-2 border-[#F0B35B] text-[#F0B35B] px-8 py-4 rounded-xl text-lg font-bold hover:bg-[#F0B35B] hover:text-black transition-all duration-300 flex items-center gap-2">
                <Play className="w-5 h-5" />
                Ver Como Funciona
              </button>
            </div>

            {/* Social proof enhanced */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-[#F0B35B] mb-1">{stat.icon}</div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Sem compromisso</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Página personalizada</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Suporte incluído</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section Enhanced */}
      <section className="py-20 bg-gradient-to-b from-[#1A1F2E] to-[#0D121E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-[#F0B35B]/20 to-transparent border border-[#F0B35B]/30 px-4 py-2 rounded-full mb-4">
              <span className="text-[#F0B35B] font-bold">⚡ Recursos Profissionais</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Tudo que sua barbearia precisa
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Sistema completo que transforma qualquer barbearia em um negócio digital moderno
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group bg-gradient-to-br from-[#1A1F2E] to-[#0D121E] p-8 rounded-2xl border border-gray-700 hover:border-[#F0B35B]/50 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-[#F0B35B]/20 ${
                  index % 2 === 0 ? 'md:translate-y-4' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-[#F0B35B] group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                      <span className="bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-medium border border-green-500/30">
                        {feature.benefit}
                      </span>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works - Enhanced */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Como funciona?
            </h2>
            <p className="text-xl text-gray-300 mb-2">
              Em 3 passos simples, sua barbearia estará online
            </p>
            <p className="text-[#F0B35B] font-semibold">
              ⏱️ Processo completo em menos de 2 minutos
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Cadastre-se Grátis',
                description: 'Crie sua conta em 30 segundos. Só precisamos do seu email - sem cartão de crédito!',
                time: '30 segundos'
              },
              {
                step: '2', 
                title: 'Configuração Automática',
                description: 'Criamos automaticamente seus serviços básicos, horários e sua página profissional.',
                time: '1 minuto'
              },
              {
                step: '3',
                title: 'Receba Agendamentos',
                description: 'Compartilhe sua página personalizada e comece a receber agendamentos online!',
                time: 'Imediato'
              }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-br from-[#F0B35B] to-yellow-400 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-[#F0B35B]/30">
                  <span className="text-3xl font-black text-black">{item.step}</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-300 mb-3 leading-relaxed">{item.description}</p>
                <div className="inline-block bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
                  ⚡ {item.time}
                </div>
              </div>
            ))}
          </div>

          {/* Arrow indicators for larger screens */}
          <div className="hidden lg:flex justify-center items-center mt-8">
            <ArrowRight className="text-[#F0B35B] w-8 h-8 mx-8" />
            <ArrowRight className="text-[#F0B35B] w-8 h-8 mx-8" />
          </div>
        </div>
      </section>

      {/* Pricing Section - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-[#1A1F2E] via-[#0D121E] to-[#1A1F2E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 px-4 py-2 rounded-full mb-4">
              <span className="text-green-400 font-bold">💰 Preços Honestos</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Planos que cabem no seu bolso
            </h2>
            <p className="text-xl text-gray-300 mb-2">
              Comece <strong className="text-[#F0B35B]">100% grátis</strong> e cresça conforme sua necessidade
            </p>
            <p className="text-green-400 font-semibold">
              🎯 Mais de 80% escolhem começar no plano gratuito
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-gradient-to-br from-[#1A1F2E] to-[#0D121E] p-8 rounded-2xl border-2 transition-all duration-300 hover:transform hover:scale-105 ${
                  plan.popular 
                    ? 'border-[#F0B35B] shadow-2xl shadow-[#F0B35B]/30 ring-2 ring-[#F0B35B]/20' 
                    : 'border-gray-700 hover:border-[#F0B35B]/30'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-[#F0B35B] to-yellow-400 text-black px-6 py-2 rounded-full text-sm font-black flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      MAIS ESCOLHIDO
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-3">{plan.name}</h3>
                  <div className="mb-4">
                    <div className="flex items-center justify-center gap-2">
                      {plan.originalPrice && (
                        <span className="text-gray-400 line-through text-lg">{plan.originalPrice}</span>
                      )}
                      <span className="text-5xl font-black text-white">{plan.price}</span>
                      <span className="text-gray-400 text-lg">{plan.period}</span>
                    </div>
                    {plan.savings && (
                      <div className="text-green-400 font-semibold text-sm mt-1">
                        💰 {plan.savings}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-300 mb-3">{plan.description}</p>
                  <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold border ${
                    plan.highlightColor === 'green' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  }`}>
                    {plan.highlight}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#F0B35B] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-[#F0B35B] to-yellow-400 text-black hover:shadow-lg hover:shadow-[#F0B35B]/30 hover:scale-105'
                      : 'border-2 border-[#F0B35B] text-[#F0B35B] hover:bg-[#F0B35B] hover:text-black'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Money back guarantee */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-transparent border border-green-500/30 px-6 py-3 rounded-full">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">
                💯 Garantia: Cancele quando quiser, sem pegadinhas
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Enhanced */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 px-4 py-2 rounded-full mb-4">
              <span className="text-yellow-400 font-bold">⭐ Casos de Sucesso</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Barbearias que transformaram seus resultados
            </h2>
            <p className="text-xl text-gray-300">
              Veja como nossos clientes <strong className="text-[#F0B35B]">triplicaram seus agendamentos</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-[#1A1F2E] to-[#0D121E] p-8 rounded-2xl border border-gray-700 hover:border-[#F0B35B]/30 transition-all duration-300 hover:transform hover:scale-105 relative overflow-hidden"
              >
                {/* Quote decoration */}
                <div className="absolute top-4 right-4 opacity-20">
                  <Quote className="w-8 h-8 text-[#F0B35B]" />
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F0B35B] to-yellow-400 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.image}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{testimonial.name}</h4>
                    <p className="text-[#F0B35B] text-sm font-medium">{testimonial.business}</p>
                    <p className="text-gray-400 text-xs">{testimonial.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>

                <p className="text-gray-300 mb-4 italic leading-relaxed">"{testimonial.text}"</p>

                <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 px-4 py-2 rounded-full inline-block">
                  <span className="text-green-400 font-bold text-sm">{testimonial.metrics}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-b from-[#1A1F2E] to-[#0D121E]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 px-4 py-2 rounded-full mb-4">
              <span className="text-purple-400 font-bold">❓ Dúvidas Frequentes</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Tire suas dúvidas
            </h2>
            <p className="text-xl text-gray-300">
              Respostas para as perguntas mais comuns sobre nossa plataforma
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-[#1A1F2E] to-[#0D121E] border border-gray-700 rounded-xl overflow-hidden hover:border-[#F0B35B]/30 transition-all duration-300"
              >
                <button
                  className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-[#F0B35B]/5 transition-colors"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <span className="font-semibold text-white text-lg">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-[#F0B35B]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#F0B35B]" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/20 via-purple-500/10 to-blue-500/20"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#F0B35B]/30 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-500/30 to-transparent rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-[#1A1F2E]/80 to-[#0D121E]/80 backdrop-blur-xl p-12 rounded-3xl border border-[#F0B35B]/30 shadow-2xl">
            <div className="inline-block bg-gradient-to-r from-[#F0B35B]/20 to-yellow-500/20 border border-[#F0B35B]/30 px-4 py-2 rounded-full mb-6">
              <span className="text-[#F0B35B] font-bold">🚀 Última Chance</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pronto para <span className="text-[#F0B35B]">triplicar</span> seus agendamentos?
            </h2>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Junte-se a mais de <strong className="text-[#F0B35B]">500 barbearias</strong> que já transformaram seus negócios.
              <br />
              <span className="text-green-400 font-semibold">Comece 100% grátis agora mesmo!</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button className="group bg-gradient-to-r from-[#F0B35B] to-yellow-400 text-black px-10 py-5 rounded-xl text-xl font-black hover:shadow-2xl hover:shadow-[#F0B35B]/50 transition-all duration-300 hover:scale-105 flex items-center gap-3 min-w-[320px] justify-center">
                <Scissors className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                Começar Grátis Agora
                <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Setup em 2 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Suporte incluído</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Cancele quando quiser</span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl">
              <p className="text-green-400 font-semibold text-sm">
                ⚡ <strong>Oferta Limitada:</strong> Primeiros 100 cadastros ganham 30 dias do plano Pro grátis!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0D121E] border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="text-[#F0B35B] text-xl font-bold tracking-wider border-2 border-[#F0B35B] px-4 py-2 rounded-lg bg-gradient-to-r from-[#F0B35B]/10 to-transparent">
                  BARBER<span className="text-white">SHOP</span>
                </div>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                A plataforma completa para transformar sua barbearia em um negócio digital moderno e eficiente.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">100% Seguro</span>
                </div>
                <div className="flex items-center gap-2 text-blue-400">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">Setup Rápido</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-[#F0B35B] transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-[#F0B35B] transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-[#F0B35B] transition-colors">Casos de Sucesso</a></li>
                <li><a href="#" className="hover:text-[#F0B35B] transition-colors">Atualizações</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-[#F0B35B] transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-[#F0B35B] transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-[#F0B35B] transition-colors">WhatsApp</a></li>
                <li><a href="#" className="hover:text-[#F0B35B] transition-colors">Status do Sistema</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 BarberShop SaaS. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-[#F0B35B] transition-colors text-sm">
                Termos de Uso
              </a>
              <a href="#" className="text-gray-400 hover:text-[#F0B35B] transition-colors text-sm">
                Política de Privacidade
              </a>
              <a href="#" className="text-gray-400 hover:text-[#F0B35B] transition-colors text-sm">
                LGPD
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;