import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Scissors, 
  Calendar, 
  Users, 
  BarChart3, 
  CheckCircle, 
  Star,
  ArrowRight,
  Smartphone,
  Clock,
  CreditCard
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Calendar className="w-8 h-8" />,
      title: 'Agendamentos Online',
      description: 'Seus clientes agendam 24/7 pela internet. Sem mais ligações ou WhatsApp!'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Gestão de Barbeiros',
      description: 'Organize sua equipe, horários e serviços de cada profissional.'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Relatórios Completos',
      description: 'Acompanhe faturamento, agendamentos e performance da barbearia.'
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: 'Página Personalizada',
      description: 'Sua barbearia online com URL própria para compartilhar com clientes.'
    }
  ];

  const plans: Array<{
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    cta: string;
    popular: boolean;
    highlight?: string;
  }> = [
    {
      name: 'Gratuito',
      price: 'R$ 0',
      period: '/mês',
      description: 'Perfeito para começar',
      features: [
        '1 barbeiro',
        '20 agendamentos/mês',
        'Página personalizada',
        'Sistema completo',
        'Suporte por email',
        'URL própria (suabarbearia.com)'
      ],
      cta: 'Começar Grátis',
      popular: false,
      highlight: 'Sem cartão de crédito'
    },
    {
      name: 'Pro',
      price: 'R$ 39',
      period: '/mês',
      description: 'Para barbearias em crescimento',
      features: [
        'Barbeiros ilimitados',
        'Agendamentos ilimitados',
        'Relatórios avançados',
        'Suporte prioritário',
        'Integrações premium',
        'Domínio personalizado'
      ],
      cta: 'Começar Teste Grátis',
      popular: true,
      highlight: '7 dias grátis'
    }
  ];

  const testimonials = [
    {
      name: 'João Silva',
      business: 'Barbearia do João',
      text: 'Triplicou meus agendamentos em 2 meses. Os clientes adoram agendar online!',
      rating: 5
    },
    {
      name: 'Carlos Santos',
      business: 'Santos Barber',
      text: 'Finalmente consigo organizar minha agenda. O sistema é muito fácil de usar.',
      rating: 5
    },
    {
      name: 'Pedro Costa',
      business: 'Costa Hair',
      text: 'Os relatórios me ajudaram a entender melhor meu negócio. Recomendo!',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-[#0D121E] text-white">
      {/* Header */}
      <header className="relative z-50 bg-[#0D121E]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="text-[#F0B35B] text-xl font-bold tracking-wider border border-[#F0B35B]/70 px-3 py-1.5 rounded">
                BARBER<span className="text-white/90">SHOP</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-300 hover:text-white transition-colors font-medium"
              >
                Entrar
              </button>
              <button
                onClick={() => navigate('/verify-email')}
                className="bg-[#F0B35B] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#F0B35B]/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[#F0B35B]/30"
              >
                Começar Grátis
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#F0B35B]/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="block text-white/90">Transforme sua</span>
              <span className="text-[#F0B35B] font-extrabold">Barbearia Digital</span>
            </h1>
            
            <div className="inline-block bg-gradient-to-r from-[#F0B35B]/20 to-purple-500/20 px-4 py-2 rounded-full mb-6">
              <span className="text-[#F0B35B] font-semibold text-lg">
                🚀 Plataforma SaaS • Sua URL personalizada
              </span>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Sistema completo de agendamentos online para barbearias modernas. 
              <strong className="text-white"> Comece grátis</strong> e transforme sua barbearia em um negócio digital!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={() => navigate('/verify-email')}
                className="bg-[#F0B35B] text-black px-8 py-4 rounded-lg text-lg font-bold hover:bg-[#F0B35B]/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[#F0B35B]/30 flex items-center gap-2"
              >
                <Scissors className="w-5 h-5" />
                Começar Grátis Agora
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-[#F0B35B] text-[#F0B35B] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#F0B35B] hover:text-black transition-all duration-300"
              >
                Ver Demonstração
              </button>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Sem compromisso</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Setup em 2 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Suporte incluído</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Página personalizada</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#1A1F2E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que sua barbearia precisa
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Sistema completo para modernizar sua barbearia e aumentar seus agendamentos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-[#0D121E] p-6 rounded-lg border border-gray-700 hover:border-[#F0B35B]/50 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="text-[#F0B35B] mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Veja como funciona
            </h2>
            <p className="text-xl text-gray-300">
              Em poucos cliques, sua barbearia estará online
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-[#F0B35B]/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#F0B35B]">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Cadastre-se Grátis</h3>
              <p className="text-gray-300">
                Crie sua conta em 2 minutos. Verificamos seu email e pronto!
              </p>
            </div>

            <div className="text-center">
              <div className="bg-[#F0B35B]/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#F0B35B]">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Configure Automaticamente</h3>
              <p className="text-gray-300">
                Criamos seus serviços básicos e página personalizada automaticamente.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-[#F0B35B]/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#F0B35B]">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Receba Agendamentos</h3>
              <p className="text-gray-300">
                Compartilhe sua página e comece a receber agendamentos online!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-[#1A1F2E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planos que cabem no seu bolso
            </h2>
            <p className="text-xl text-gray-300">
              Comece grátis e cresça conforme sua necessidade
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative bg-[#0D121E] p-8 rounded-lg border-2 ${
                  plan.popular 
                    ? 'border-[#F0B35B] shadow-lg shadow-[#F0B35B]/20' 
                    : 'border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#F0B35B] text-black px-4 py-1 rounded-full text-sm font-bold">
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                  <p className="text-gray-300 mb-2">{plan.description}</p>
                  {plan.highlight && (
                    <div className="inline-block bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                      {plan.highlight}
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/verify-email')}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-[#F0B35B] text-black hover:bg-[#F0B35B]/90'
                      : 'border-2 border-[#F0B35B] text-[#F0B35B] hover:bg-[#F0B35B] hover:text-black'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-xl text-gray-300">
              Barbearias que já transformaram seus negócios
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-[#1A1F2E] p-6 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-[#F0B35B] fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-gray-400">{testimonial.business}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#F0B35B]/20 to-purple-500/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para modernizar sua barbearia?
          </h2>
          <p className="text-xl text-gray-300 mb-2">
            Junte-se a centenas de barbearias que já aumentaram seus agendamentos
          </p>
          <p className="text-lg text-[#F0B35B] mb-8 font-semibold">
            ✨ Sua página personalizada em 2 minutos • Sem compromisso
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate('/verify-email')}
              className="bg-[#F0B35B] text-black px-8 py-4 rounded-lg text-lg font-bold hover:bg-[#F0B35B]/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[#F0B35B]/30 flex items-center gap-2"
            >
              <Scissors className="w-5 h-5" />
              Começar Grátis Agora
            </button>
            
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Setup em 2 min</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="w-4 h-4" />
                <span>Sem cartão</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Grátis para sempre</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0D121E] border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-[#F0B35B] text-2xl font-bold tracking-wider border border-[#F0B35B]/70 px-4 py-2 rounded inline-block mb-4">
              BARBER<span className="text-white/90">SHOP</span>
            </div>
            <p className="text-gray-400 mb-6">
              Plataforma SaaS completa para barbearias modernas
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-400 mb-6">
              <button onClick={() => navigate('/login')} className="hover:text-[#F0B35B] transition-colors font-medium">
                Já tem uma conta? Entrar
              </button>
              <button onClick={() => navigate('/verify-email')} className="hover:text-[#F0B35B] transition-colors font-medium">
                Criar Barbearia Grátis
              </button>
            </div>
            <div className="text-xs text-gray-500">
              <p>© 2024 BarberShop SaaS. Transformando barbearias em negócios digitais.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;