import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Scissors, Clock, MapPin } from 'lucide-react';
// @ts-expect-error - LazyLoadImage types may not be available
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { useTenant } from '../../contexts/TenantContext';

interface BarbershopHeroProps {
  setIsModalOpen: (isOpen: boolean) => void;
  preloadAppointments?: () => Promise<void>;
}

const BarbershopHero: React.FC<BarbershopHeroProps> = ({ setIsModalOpen, preloadAppointments }) => {
  const [bgLoaded, setBgLoaded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [activeFeature, setActiveFeature] = useState(0);
  const [isFeatureChanging, setIsFeatureChanging] = useState(false);
  const [featureDirection, setFeatureDirection] = useState('right');
  const parallaxRef = useRef<HTMLDivElement>(null);
  
  const { barbershopData } = useTenant();

  // Features rotativas personalizadas para a barbearia
  const features = [
    { icon: <Scissors className="w-6 h-6" />, text: "Cortes exclusivos" },
    { icon: <Clock className="w-6 h-6" />, text: "Atendimento rápido" },
    { icon: <MapPin className="w-6 h-6" />, text: "Localização privilegiada" }
  ];

  // Efeito para carregar a animação inicial e pré-carregar os horários
  useEffect(() => {
    const timer = setTimeout(() => {
      setBgLoaded(true);
    }, 100);
    
    // Pré-carregar os horários dos barbeiros quando o Hero for renderizado
    if (preloadAppointments) {
      preloadAppointments();
    }
    
    return () => clearTimeout(timer);
  }, [preloadAppointments, setBgLoaded]);

  // Efeito para rotacionar os features automaticamente com animação lateral
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFeatureChanging(true);
      setFeatureDirection('right');

      // Aguarda a animação de saída terminar antes de mudar o conteúdo
      setTimeout(() => {
        setActiveFeature(prev => (prev + 1) % features.length);
        setFeatureDirection('left');

        // Aguarda um pequeno tempo antes de iniciar a animação de entrada
        setTimeout(() => {
          setIsFeatureChanging(false);
        }, 50);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length, setActiveFeature, setIsFeatureChanging, setFeatureDirection]);

  // Efeito de parallax no scroll
  useEffect(() => {
    const handleScroll = () => {
      if (parallaxRef.current) {
        const scrollValue = window.scrollY;
        parallaxRef.current.style.transform = `translateY(${scrollValue * 0.4}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false);
  }, []);

  const handleBookingClick = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  // Valores personalizados para a barbearia
  const heroTitle = barbershopData?.name 
    ? `BEM-VINDO À ${barbershopData.name.toUpperCase()}`
    : 'ESTILO É UM REFLEXO DA SUA ATITUDE E PERSONALIDADE';
  
  const heroSubtitle = barbershopData?.description 
    ? barbershopData.description
    : `Transforme seu visual com os melhores profissionais da ${barbershopData?.name || 'nossa barbearia'}`;
  
  const heroCta = 'Agendar Agora';
  
  return (
    <section
      aria-label="Hero Section"
      className={`
        relative min-h-screen flex items-center justify-center 
        transition-all duration-500 ease-out overflow-hidden
        ${bgLoaded ? 'filter blur-0 opacity-100 translate-x-0' : 'filter blur-3xl opacity-0 -translate-x-10'}
      `}
    >
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#F0B35B]/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3 delay-1000"></div>

      {/* Imagem de fundo com efeito parallax e carregamento otimizado */}
      <div ref={parallaxRef} className="absolute inset-0 w-full h-full overflow-hidden">
        {/* Fundo temporário enquanto a imagem carrega */}
        <div className="absolute inset-0 bg-[#0D121E] transition-opacity duration-500 ease-in-out"
             style={{ opacity: isImageLoading ? 1 : 0 }}>
          {/* Gradiente decorativo para melhorar a experiência inicial */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#F0B35B]/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
          
          {/* Indicador de carregamento */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-[#F0B35B] animate-spin" />
          </div>
        </div>
        
        <picture>
          {/* Formato AVIF para navegadores que suportam */}
          <source srcSet="/img/fotohero-optimized.avif" type="image/avif" />
          {/* Formato WebP para navegadores que suportam */}
          <source srcSet="/img/fotohero.webp" type="image/webp" />
          {/* Fallback para o formato original */}
          <LazyLoadImage
            src="/img/fotohero.avif"
            alt={`${barbershopData?.name || 'Barbearia'} - Ambiente profissional e moderno`}
            effect="blur"
            afterLoad={handleImageLoad}
            className="w-full h-full object-cover scale-110 transition-opacity duration-500"
            wrapperClassName="w-full h-full"
            style={{
              filter: 'brightness(0.25)',
              opacity: isImageLoading ? 0 : 1
            }}
            loading="eager"
            placeholderSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
          />
        </picture>

        {/* Padrão de linhas decorativas */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: 'linear-gradient(90deg, #F0B35B 1px, transparent 1px), linear-gradient(180deg, #F0B35B 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
      </div>

      <div
        className="relative z-10 text-center px-4 py-12 transition-all duration-1000 ease-out max-w-5xl mx-auto"
        role="banner"
      >
        {/* Título principal personalizado */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          <span className="block text-2xl md:text-3xl lg:text-4xl font-normal text-[#F0B35B] mb-2">
            {barbershopData?.name && 'Bem-vindo à'}
          </span>
          {heroTitle}
        </h1>

        {/* Subtítulo personalizado */}
        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          {heroSubtitle}
        </p>

        {/* Feature rotativa */}
        <div className="mb-8 h-8 flex items-center justify-center">
          <div 
            className={`
              flex items-center space-x-2 text-[#F0B35B] font-medium
              transition-all duration-300 ease-in-out
              ${isFeatureChanging 
                ? `opacity-0 ${featureDirection === 'right' ? 'translate-x-4' : '-translate-x-4'}` 
                : 'opacity-100 translate-x-0'
              }
            `}
          >
            {features[activeFeature].icon}
            <span>{features[activeFeature].text}</span>
          </div>
        </div>

        {/* Botão de agendamento */}
        <button
          onClick={handleBookingClick}
          className="
            bg-[#F0B35B] text-black px-8 py-4 rounded-lg font-bold text-lg
            hover:bg-[#E6A555] hover:scale-105 
            transition-all duration-300 ease-out
            shadow-lg hover:shadow-xl
            focus:outline-none focus:ring-4 focus:ring-[#F0B35B]/50
            active:scale-95
          "
          aria-label={`Agendar serviço na ${barbershopData?.name || 'barbearia'}`}
        >
          {heroCta}
        </button>

        {/* Informações adicionais da barbearia */}
        {barbershopData && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#F0B35B]">+500</div>
              <div className="text-gray-400">Clientes satisfeitos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#F0B35B]">5★</div>
              <div className="text-gray-400">Avaliação média</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#F0B35B]">2+</div>
              <div className="text-gray-400">Anos de experiência</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BarbershopHero;