import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scissors,
  Calendar,
  Users,
  BarChart3,
  Smartphone,
  Shield,
  Zap,
  Star,
  ArrowRight,
  Check,
  Menu,
  X
} from 'lucide-react';

const LandingPage = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
  const navigate = useNavigate();

  const handleCreateBarbershop = () => {
    navigate('/verify-email');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const backgroundImage =
    "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245,166,35,0.08) 0%, transparent 60%), url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

  const stats = [
    { value: '8.000+', label: 'Barbearias', icon: <Scissors className="h-5 w-5" /> },
    { value: '500k+', label: 'Agendamentos', icon: <Calendar className="h-5 w-5" /> },
    { value: '98%', label: 'Satisfação', icon: <Star className="h-5 w-5" /> },
    { value: '2min', label: 'Setup médio', icon: <Zap className="h-5 w-5" /> }
  ];

  const features = [
    {
      title: 'Agendamentos 24/7',
      description: 'Seus clientes agendam a qualquer hora, sem ligações. Sistema inteligente que evita conflitos.',
      tag: '↑ 300% mais agendamentos',
      icon: <Calendar className="h-5 w-5" />,
      accent: 'bg-blue-900 text-blue-200 border-blue-700'
    },
    {
      title: 'Gestão Completa',
      description: 'Organize barbearia, horários e serviços em uma plataforma unificada.',
      tag: 'Controle em tempo real',
      icon: <Users className="h-5 w-5" />,
      accent: 'bg-amber-900 text-amber-200 border-amber-700'
    },
    {
      title: 'Relatórios Inteligentes',
      description: 'Dados em tempo real sobre faturamento e performance para decisões rápidas.',
      tag: 'Analytics avançado',
      icon: <BarChart3 className="h-5 w-5" />,
      accent: 'bg-emerald-900 text-emerald-200 border-emerald-700'
    },
    {
      title: 'Página Profissional',
      description: 'Sua barbearia online com URL própria. Design responsivo que converte clientes.',
      tag: 'Página própria grátis',
      icon: <Smartphone className="h-5 w-5" />,
      accent: 'bg-violet-900 text-violet-200 border-violet-700'
    }
  ];

  const steps = [
    {
      step: '01',
      title: 'Cadastre-se Grátis',
      description: 'Crie sua conta em segundos. Sem cartão de crédito.',
      time: '30 segundos'
    },
    {
      step: '02',
      title: 'Configuração Automática',
      description: 'Serviços, horários e página prontos automaticamente.',
      time: '1 minuto'
    },
    {
      step: '03',
      title: 'Receba Agendamentos',
      description: 'Compartilhe sua página e receba agendamentos no WhatsApp.',
      time: 'Imediato'
    }
  ];

  const pricing = [
    {
      id: 'free',
      name: 'Gratuito',
      priceMonthly: '0',
      priceAnnual: '0',
      originalAnnual: null,
      tagline: 'Ideal para começar — sem cartão de crédito.',
      limitLabel: 'Agendamentos',
      limitValue: '45 / mês',
      limitFill: 20,
      featured: false,
      cta: 'Começar Grátis',
      features: [
        { label: '1 barbeiro incluído', included: true },
        { label: '45 agendamentos/mês', included: true },
        { label: 'Dashboard básico', included: true },
        { label: 'Página personalizável', included: false },
        { label: 'Analytics e relatórios', included: false },
        { label: 'Lembretes WhatsApp', included: false },
        { label: 'Múltiplos barbeiros', included: false }
      ]
    },
    {
      id: 'starter',
      name: 'Starter',
      priceMonthly: '29',
      priceAnnual: '24',
      originalAnnual: '29',
      tagline: 'Para o barbeiro autônomo que quer profissionalizar.',
      limitLabel: 'Agendamentos',
      limitValue: 'Ilimitados',
      limitFill: 50,
      featured: false,
      cta: 'Assinar Starter',
      features: [
        { label: '1 barbeiro', included: true },
        { label: 'Agendamentos ilimitados', included: true },
        { label: 'Dashboard completo', included: true },
        { label: 'Analytics básico', included: true },
        { label: 'Página personalizável', included: true },
        { label: 'Lembretes WhatsApp', included: false },
        { label: 'Múltiplos barbeiros', included: false }
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      priceMonthly: '69',
      priceAnnual: '55',
      originalAnnual: '69',
      tagline: 'Para barbearias com equipe. Tudo que você precisa crescer.',
      limitLabel: 'Barbeiros',
      limitValue: 'até 3',
      limitFill: 75,
      featured: true,
      cta: 'Testar 14 Dias Grátis →',
      features: [
        { label: 'Até 3 barbeiros', included: true },
        { label: 'Agendamentos ilimitados', included: true },
        { label: 'Analytics avançado', included: true },
        { label: 'Lembretes WhatsApp', included: true },
        { label: 'Multiplos barbeiros', included: true },
        { label: 'Relatórios de faturamento', included: true },
        { label: 'Suporte prioritário', included: true }
      ]
    },
    {
      id: 'business',
      name: 'Business',
      priceMonthly: '149',
      priceAnnual: '119',
      originalAnnual: '149',
      tagline: 'Para redes e barbearias de alto volume. Suporte dedicado.',
      limitLabel: 'Barbeiros',
      limitValue: 'até 10',
      limitFill: 100,
      featured: false,
      cta: 'Assinar Business',
      features: [
        { label: 'Até 10 barbeiros', included: true },
        { label: 'Tudo do plano Pro', included: true },
        { label: 'Multi-unidades', included: true },
        { label: 'API e integrações', included: true },
        { label: 'Backup diário', included: true },
        { label: 'Gerente de conta dedicado', included: true },
        { label: 'Suporte 24h via WhatsApp', included: true }
      ]
    }
  ];

  const visiblePlans = pricing.slice(currentPlanIndex, currentPlanIndex + 3);
  const hasMoreRight = currentPlanIndex + 3 < pricing.length;
  const hasMoreLeft = currentPlanIndex > 0;

  const nextPlan = () => {
    if (hasMoreRight) setCurrentPlanIndex(prev => prev + 1);
  };

  const prevPlan = () => {
    if (hasMoreLeft) setCurrentPlanIndex(prev => prev - 1);
  };

  const testimonials = [
    {
      name: 'João Silva',
      role: 'Barbearia do João · Rio',
      text: 'Em 2 meses atingi 30 agendamentos/dia. Os clientes adoram a facilidade de agendar pelo celular.',
      metric: '↑ 300% agendamentos',
      badge: 'bg-amber-500 text-black'
    },
    {
      name: 'Carlos Nunes',
      role: 'Carlos Barber · SP',
      text: 'Mudou como eu gerencio tudo. Cada cliente sabe exatamente seu horário e tenho controle total.',
      metric: '↑ 5x clientes recorrentes',
      badge: 'bg-blue-500 text-black'
    },
    {
      name: 'Pedro Costa',
      role: 'CutStyle · BH',
      text: 'Os relatórios mostraram onde eu perdia dinheiro. Aumentei o faturamento 40% em 3 meses.',
      metric: '↑ 40% faturamento',
      badge: 'bg-emerald-500 text-black'
    }
  ];

  const faqData = [
    {
      question: 'Como funciona o período gratuito?',
      answer: 'O plano gratuito é permanente. Você tem acesso às funcionalidades essenciais sem limite de tempo.'
    },
    {
      question: 'Preciso de conhecimento técnico?',
      answer: 'Não. A configuração é automática e intuitiva. Em menos de 3 minutos sua barbearia está online.'
    },
    {
      question: 'Como os clientes vão agendar?',
      answer: 'Você recebe uma URL personalizada para compartilhar no WhatsApp, Instagram ou onde quiser.'
    },
    {
      question: 'E se eu não gostar do sistema?',
      answer: 'No plano Pro você pode cancelar a qualquer momento sem taxas. Garantia total nos primeiros 14 dias.'
    },
    {
      question: 'O sistema funciona no celular?',
      answer: 'Sim, totalmente responsivo. Painel de gestão e página dos clientes funcionam em qualquer dispositivo.'
    }
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0f0f0f] text-white">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ backgroundImage }}
        aria-hidden="true"
      />
      <div className="relative z-10">
        <header className="sticky top-0 z-50 border-b border-[#2a2a2a] bg-[#0f0f0f] backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <button
              onClick={() => scrollToId('top')}
              className="flex items-center gap-3 text-left"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5A623] text-lg">
                ✂️
              </span>
              <span className="text-sm font-semibold tracking-[0.25em] text-white">NA RÉGUA</span>
            </button>
            <nav className="hidden items-center gap-6 text-sm text-gray-300 md:flex">
              <button onClick={() => scrollToId('features')} className="hover:text-white transition-colors">
                Recursos
              </button>
              <button onClick={() => scrollToId('how')} className="hover:text-white transition-colors">
                Como funciona
              </button>
              <button onClick={() => scrollToId('pricing')} className="hover:text-white transition-colors">
                Preços
              </button>
              <button onClick={() => scrollToId('faq')} className="hover:text-white transition-colors">
                FAQ
              </button>
            </nav>
            <div className="hidden items-center gap-3 md:flex">
              <button
                onClick={handleLogin}
                className="rounded-full border border-[#2a2a2a] px-4 py-2 text-sm text-gray-300 hover:border-[#3a3a3a] hover:text-white transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={handleCreateBarbershop}
                className="rounded-full bg-[#F5A623] px-5 py-2 text-sm font-semibold text-black hover:bg-[#d4891a] transition-colors"
              >
                Começar Grátis →
              </button>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="rounded-lg border border-[#2a2a2a] p-2 text-gray-300 md:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          {isMobileMenuOpen && (
            <div className="border-t border-[#2a2a2a] bg-[#0f0f0f] px-6 py-4 md:hidden">
              <div className="flex flex-col gap-3 text-sm text-gray-300">
                <button onClick={() => scrollToId('features')} className="text-left hover:text-white">
                  Recursos
                </button>
                <button onClick={() => scrollToId('how')} className="text-left hover:text-white">
                  Como funciona
                </button>
                <button onClick={() => scrollToId('pricing')} className="text-left hover:text-white">
                  Preços
                </button>
                <button onClick={() => scrollToId('faq')} className="text-left hover:text-white">
                  FAQ
                </button>
                <button
                  onClick={handleLogin}
                  className="rounded-full border border-[#2a2a2a] px-4 py-2 text-left text-gray-300 hover:border-[#3a3a3a] hover:text-white"
                >
                  Entrar
                </button>
                <button
                  onClick={handleCreateBarbershop}
                  className="rounded-full bg-[#F5A623] px-4 py-2 text-left text-sm font-semibold text-black"
                >
                  Começar Grátis →
                </button>
              </div>
            </div>
          )}
        </header>

        <section id="top" className="relative overflow-hidden px-6 pb-16 pt-20">
          <div className="mx-auto max-w-6xl text-center">
            <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-emerald-700 bg-emerald-900 px-4 py-2 text-xs text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistema ativo · Mais de 8.000 barbearias online
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Transforme sua barbearia em
              <span className="block text-[#F5A623]">negócio digital</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-300 md:text-lg">
              Agendamentos online 24/7, página profissional personalizada e gestão completa — tudo em um só lugar.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={handleCreateBarbershop}
                className="flex items-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3 text-sm font-semibold text-black hover:bg-[#d4891a]"
              >
                <Scissors className="h-4 w-4" />
                Criar Barbearia GRÁTIS
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollToId('how')}
                className="rounded-xl border border-[#2a2a2a] px-6 py-3 text-sm text-gray-200 hover:border-[#3a3a3a]"
              >
                Ver Como Funciona
              </button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              {stats.map(stat => (
                <div key={stat.label} className="rounded-2xl border border-[#2a2a2a] bg-[#141414] px-4 py-5">
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#3a2a0f] text-[#F5A623]">
                    {stat.icon}
                  </div>
                  <div className="text-lg font-semibold text-white">{stat.value}</div>
                  <div className="text-xs uppercase tracking-wide text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-3xl border border-[#2a2a2a] bg-[#141414]">
            <div className="flex items-center gap-2 border-b border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-xs text-gray-400">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="ml-4 font-mono text-[10px]">barber.com/app/pedrobarbershop/dashboard</span>
            </div>
            <div className="grid gap-6 p-6 md:grid-cols-[180px_1fr]">
              <div className="hidden rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 text-xs text-gray-400 md:block">
                <div className="mb-4 flex items-center gap-2 text-sm text-white">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5A623] text-black">✂️</span>
                  Pedro
                </div>
                <div className="mb-2 uppercase tracking-[0.2em] text-[10px]">Dashboard</div>
                <div className="rounded-lg bg-[#3a2a0f] px-3 py-2 text-[#F5A623]">📊 Dashboard</div>
                <div className="mt-2 px-3 py-2">📅 Agenda</div>
                <div className="mt-4 uppercase tracking-[0.2em] text-[10px]">Gerenciamento</div>
                <div className="mt-2 px-3 py-2">⚙️ Serviços</div>
                <div className="mt-2 px-3 py-2">👥 Equipe</div>
              </div>
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-white">Dashboard</h3>
                  <p className="text-xs text-gray-400">Welcome back, Pedro</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'TOTAL', value: '24', color: 'bg-blue-900 text-blue-200' },
                    { label: 'RECEITA', value: 'R$ 1.2k', color: 'bg-amber-900 text-amber-200' },
                    { label: 'CONCLUÍDOS', value: '18', color: 'bg-emerald-900 text-emerald-200' },
                    { label: 'PENDENTES', value: '6', color: 'bg-orange-900 text-orange-200' }
                  ].map(item => (
                    <div key={item.label} className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-4">
                      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${item.color}`}>
                        {item.label.slice(0, 1)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-gray-400">{item.label}</div>
                      <div className="text-lg font-semibold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="flex h-24 items-end gap-2 rounded-2xl border border-[#2a2a2a] bg-[#141414] p-4">
                  {[28, 48, 42, 78, 58, 88, 72].map((height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-md bg-[#F5A623]"
                      style={{ height: `${height}%`, opacity: 1 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12">
              <div className="mb-4 inline-flex rounded-full border border-[#a86f12] bg-[#3a2a0f] px-4 py-1 text-xs uppercase tracking-[0.25em] text-[#F5A623]">
                ✦ Recursos Profissionais
              </div>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">Tudo que sua barbearia precisa</h2>
              <p className="mt-3 max-w-2xl text-sm text-gray-300">
                Sistema completo que transforma qualquer barbearia em um negócio digital moderno.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {features.map(feature => (
                <div key={feature.title} className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-6 transition hover:-translate-y-1 hover:border-[#a86f12]">
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${feature.accent}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm text-gray-300">{feature.description}</p>
                  <div className="mt-4 inline-flex rounded-full border border-emerald-700 bg-emerald-900 px-3 py-1 text-xs text-emerald-200">
                    {feature.tag}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="px-6 py-20">
          <div className="mx-auto max-w-6xl text-center">
            <div className="mb-12">
              <div className="mb-4 inline-flex rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-1 text-xs uppercase tracking-[0.25em] text-[#F5A623]">
                ○ Como funciona?
              </div>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">3 passos simples, sua barbearia online</h2>
              <p className="mt-3 text-sm text-gray-300">
                Processo completo em menos de 3 minutos — sem cartão de crédito.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map(step => (
                <div key={step.step} className="relative rounded-2xl border border-[#2a2a2a] bg-[#141414] p-6 text-left">
                  <span className="absolute right-6 top-4 text-4xl font-semibold text-[#262626]">{step.step}</span>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5A623] text-sm font-semibold text-black">
                    {step.step[1]}
                  </div>
                  <h3 className="text-base font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-gray-300">{step.description}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-xs text-[#F5A623]">
                    <span>⏱</span>
                    {step.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <div className="mb-4 inline-flex rounded-full border border-[#a86f12] bg-[#3a2a0f] px-4 py-1 text-xs uppercase tracking-[0.25em] text-[#F5A623]">
                ◈ Planos Acessíveis
              </div>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">Planos que cabem no seu bolso</h2>
              <p className="mt-3 text-sm text-gray-300">
                Comece 100% grátis e cresça conforme sua necessidade. Mais de 80% iniciam no gratuito.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3 text-xs text-gray-400">
                <span>Mensal</span>
                <button
                  onClick={() => setIsAnnual(prev => !prev)}
                  className={`relative h-7 w-12 rounded-full border border-[#2a2a2a] transition-colors ${
                    isAnnual ? 'bg-[#F5A623]' : 'bg-[#1a1a1a]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      isAnnual ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span>Anual</span>
                <span className="rounded-full bg-[#3a2a0f] px-2 py-1 text-[10px] text-[#F5A623]">
                  2 meses grátis
                </span>
              </div>
            </div>

            <div className="relative mt-10">
              <div className="grid gap-4 lg:grid-cols-3">
                {visiblePlans.map(plan => {
                  const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
                  const suffix = plan.id === 'free' ? '/ mês' : isAnnual ? ',90 / mês*' : ',90 / mês';
                  const original = plan.id === 'free' ? null : isAnnual ? plan.originalAnnual : null;

                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-3xl border p-6 ${
                        plan.featured
                          ? 'border-[#F5A623] bg-gradient-to-b from-[#1f1a0e] to-[#141414] shadow-[0_0_40px_rgba(245,166,35,0.15)]'
                          : 'border-[#2a2a2a] bg-[#141414]'
                      }`}
                    >
                      {plan.featured && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#F5A623] px-4 py-1 text-[10px] font-semibold text-black">
                          ★ MAIS ESCOLHIDO
                        </span>
                      )}
                      <div className="text-xs uppercase tracking-[0.2em] text-gray-400">{plan.name}</div>
                      <div className="mt-3 text-[11px] text-gray-500">{original ? `R$${original},90/mês no mensal` : ''}</div>
                      <div className="mt-1 flex items-end gap-1">
                        <span className="text-sm text-gray-400">R$</span>
                        <span className="text-4xl font-semibold text-white">{price}</span>
                        <span className="pb-1 text-xs text-gray-400">{suffix}</span>
                      </div>
                      <p className="mt-3 text-xs text-gray-400">{plan.tagline}</p>
                      <div className="mt-5">
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <span>{plan.limitLabel}</span>
                          <span>{plan.limitValue}</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-[#2a2a2a]">
                          <div
                            className="h-1.5 rounded-full bg-[#F5A623]"
                            style={{ width: `${plan.limitFill}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-5 space-y-2 text-xs text-gray-300">
                        {plan.features.map(feature => (
                          <div
                            key={feature.label}
                            className={`flex items-start gap-2 ${feature.included ? '' : 'text-gray-500 line-through'}`}
                          >
                            <span className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full ${feature.included ? 'bg-emerald-900 text-emerald-200' : 'bg-gray-700 text-gray-400'}`}>
                          {feature.included ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        </span>
                            {feature.label}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleCreateBarbershop}
                        className={`mt-6 w-full rounded-xl px-4 py-2 text-xs font-semibold ${
                          plan.featured
                            ? 'bg-[#F5A623] text-black hover:bg-[#d4891a]'
                            : 'border border-[#2a2a2a] text-gray-200 hover:border-[#3a3a3a]'
                        }`}
                      >
                        {plan.cta}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Arrows */}
              {hasMoreLeft && (
                <button
                  onClick={prevPlan}
                  className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-[#2a2a2a] bg-[#141414] p-2 text-white hover:border-[#F5A623] hover:text-[#F5A623] md:-left-12"
                >
                  <ArrowRight className="h-5 w-5 rotate-180" />
                </button>
              )}
              {hasMoreRight && (
                <button
                  onClick={nextPlan}
                  className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-[#2a2a2a] bg-[#141414] p-2 text-white hover:border-[#F5A623] hover:text-[#F5A623] md:-right-12"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
            </div>
            <p className="mt-6 text-center text-xs text-gray-500">✓ Garantia · Cancele quando quiser, sem perguntas</p>
          </div>
        </section>

        <section id="testimonials" className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12">
              <div className="mb-4 inline-flex rounded-full border border-[#a86f12] bg-[#3a2a0f] px-4 py-1 text-xs uppercase tracking-[0.25em] text-[#F5A623]">
                ★ Cases de Sucesso
              </div>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">
                Barbearias que transformaram seus resultados
              </h2>
              <p className="mt-3 text-sm text-gray-300">Veja como nossos clientes triplicaram seus agendamentos.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {testimonials.map(testimonial => (
                <div key={testimonial.name} className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${testimonial.badge}`}>
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{testimonial.name}</div>
                      <div className="text-xs text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300">"{testimonial.text}"</p>
                  <div className="mt-4 inline-flex rounded-full border border-emerald-700 bg-emerald-900 px-3 py-1 text-[11px] text-emerald-200">
                    {testimonial.metric}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <div className="mb-4 inline-flex rounded-full border border-[#a86f12] bg-[#3a2a0f] px-4 py-1 text-xs uppercase tracking-[0.25em] text-[#F5A623]">
                ? Dúvidas Frequentes
              </div>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">Tire suas dúvidas</h2>
              <p className="mt-3 text-sm text-gray-300">Respostas para as perguntas mais comuns sobre nossa plataforma.</p>
            </div>
            <div className="mt-8 space-y-3">
              {faqData.map((faq, index) => {
                const isOpen = expandedFaq === index;
                return (
                  <div key={faq.question} className="overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#141414]">
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-white"
                    >
                      {faq.question}
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1a1a1a] text-[#F5A623]">
                        {isOpen ? '-' : '+'}
                      </span>
                    </button>
                    {isOpen && <div className="px-5 pb-4 text-sm text-gray-300">{faq.answer}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl rounded-3xl border border-[#2a2a2a] bg-[#141414] px-6 py-12 text-center">
            <div className="mb-4 inline-flex rounded-full border border-[#a86f12] bg-[#3a2a0f] px-4 py-1 text-xs uppercase tracking-[0.25em] text-[#F5A623]">
              ◈ Último Chamado
            </div>
            <h2 className="text-3xl font-semibold text-white md:text-4xl">
              Pronto para <span className="text-[#F5A623]">triplicar</span> seus agendamentos?
            </h2>
            <p className="mt-3 text-sm text-gray-300">
              Junte-se a mais de 8.000 barbearias que transformam seus negócios. Comece 100% grátis agora mesmo!
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={handleCreateBarbershop}
                className="flex items-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3 text-sm font-semibold text-black hover:bg-[#d4891a]"
              >
                <Scissors className="h-4 w-4" />
                Começar Grátis Agora →
              </button>
              <button
                onClick={() => scrollToId('features')}
                className="rounded-xl border border-[#2a2a2a] px-6 py-3 text-sm text-gray-200 hover:border-[#3a3a3a]"
              >
                Ver Demo
              </button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Segurança garantida
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Sem cartão de crédito
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Cancele quando quiser
              </span>
            </div>
          </div>
        </section>

        <footer className="border-t border-[#2a2a2a] bg-[#141414] px-6 py-12">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5A623] text-lg">
                  ✂️
                </span>
                BARBERSHOP
              </div>
              <p className="mt-4 max-w-xs text-xs text-white">
                Transformando barbearias em negócios digitais modernos desde 2022.
              </p>
            </div>
            <div className="text-xs text-white">
              <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-white">Produto</div>
              <button onClick={() => scrollToId('features')} className="block py-1 hover:text-[#F5A623]">
                Recursos
              </button>
              <button onClick={() => scrollToId('pricing')} className="block py-1 hover:text-[#F5A623]">
                Preços
              </button>
              <button onClick={() => scrollToId('testimonials')} className="block py-1 hover:text-[#F5A623]">
                Cases
              </button>
              <button onClick={() => scrollToId('faq')} className="block py-1 hover:text-[#F5A623]">
                FAQ
              </button>
            </div>
            <div className="text-xs text-white">
              <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-white">Suporte</div>
              <a href="mailto:suporte@barbershop.com" className="block py-1 hover:text-[#F5A623]">
                Central de Ajuda
              </a>
              <a href="mailto:suporte@barbershop.com" className="block py-1 hover:text-[#F5A623]">
                Contato
              </a>
              <a href="https://wa.me/5511999999999" className="block py-1 hover:text-[#F5A623]">
                WhatsApp
              </a>
              <a href="#" className="block py-1 hover:text-[#F5A623]">
                Status
              </a>
            </div>
            <div className="text-xs text-white">
              <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-white">Legal</div>
              <a href="#" className="block py-1 hover:text-[#F5A623]">
                Termos de Uso
              </a>
              <a href="#" className="block py-1 hover:text-[#F5A623]">
                Privacidade
              </a>
              <a href="#" className="block py-1 hover:text-[#F5A623]">
                Cookies
              </a>
            </div>
          </div>
          <div className="mx-auto mt-10 flex max-w-6xl flex-wrap items-center justify-between gap-3 text-xs text-white">
            <span>© 2025 BarberShop · Todos os direitos reservados</span>
            <button
              onClick={handleCreateBarbershop}
              className="rounded-full bg-[#F5A623] px-4 py-2 text-xs font-semibold text-black"
            >
              Grátis Agora
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
