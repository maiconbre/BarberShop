import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Scissors, Clock, MapPin } from 'lucide-react';
// @ts-ignore
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface HeroProps {
  setIsModalOpen: (isOpen: boolean) => void;
}

const Hero: React.FC<HeroProps> = ({ setIsModalOpen }) => {
  const [bgLoaded, setBgLoaded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [activeFeature, setActiveFeature] = useState(0);
  const [isFeatureChanging, setIsFeatureChanging] = useState(false);
  const [featureDirection, setFeatureDirection] = useState('right');
  const parallaxRef = useRef<HTMLDivElement>(null);

  // Features rotativas para destacar os diferenciais da barbearia
  const features = [
    { icon: <Scissors className="w-6 h-6" />, text: "Cortes exclusivos" },
    { icon: <Clock className="w-6 h-6" />, text: "Atendimento rápido" },
    { icon: <MapPin className="w-6 h-6" />, text: "Localização privilegiada" }
  ];

  // Efeito para carregar a animação inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setBgLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
  }, [features.length]);

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

  return (
    <section
      aria-label="Hero Section"
      className={`
        relative min-h-screen flex items-center justify-center 
        transition-all duration-1000 ease-out overflow-hidden
        ${bgLoaded ? 'filter blur-0 opacity-100 translate-x-0' : 'filter blur-3xl opacity-0 -translate-x-10'}
      `}
    >
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#F0B35B]/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse-slow"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-pulse-slow delay-1000"></div>

      {/* Imagem de fundo com efeito parallax */}
      <div ref={parallaxRef} className="absolute inset-0 w-full h-full overflow-hidden">
        <LazyLoadImage
          src="/img/fotohero.avif"
          alt="Barbearia GR - Ambiente profissional e moderno"
          effect="blur"
          afterLoad={handleImageLoad}
          className="w-full h-full object-cover scale-110"
          wrapperClassName="w-full h-full"
          style={{
            filter: 'brightness(0.25)'
          }}
        />
        {isImageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0D121E]">
            <Loader2 className="w-12 h-12 text-[#F0B35B] animate-spin" />
          </div>
        )}

        {/* Overlay com textura */}
        <div className="absolute inset-0 bg-[#0D121E]/30 backdrop-filter backdrop-blur-[2px] mix-blend-multiply"></div>

        {/* Padrão de linhas decorativas */}
        <div className="absolute inset-0 opacity-10">
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
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight"
          itemProp="headline"
        >
          <span className="sr-only">BarberShop - </span>
          <span className="block mb-2 text-white/80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">ESTILO É UM REFLEXO DA SUA</span>
          <span
            className="text-[#F0B35B] font-extrabold inline-block transition-transform hover:scale-105 drop-shadow-[0_1px_3px_rgba(240,179,91,0.3)] relative overflow-hidden group"
            itemProp="alternativeHeadline"
          >
            <span className="relative z-10">ATITUDE E PERSONALIDADE</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/10 to-[#F0B35B]/0 -skew-x-45 group-hover:animate-shine"></div>
          </span>
        </h1>

        <p
          className="text-lg md:text-xl lg:text-2xl mb-8 max-w-2xl mx-auto text-gray-300 leading-relaxed"
          itemProp="description"
        >
          Transforme seu visual com os melhores profissionais de Bangu
        </p>

        {/* Botão de agendamento */}
        <button
          onClick={handleBookingClick}
          className="
            relative overflow-hidden group
            mt-4 bg-[#F0B35B] text-black px-12 py-4 rounded-lg
            text-lg md:text-xl font-semibold
            transition-all duration-300 ease-out
            hover:bg-[#F0B35B] hover:scale-105 shadow-[0_0_25px_rgba(240,179,91,0.4)]
            hover:shadow-[0_0_30px_rgba(240,179,91,0.6)] active:scale-95 border-2 border-[#F0B35B]/70
          "
        >
          <span className="relative z-10 inline-flex items-center justify-center w-full gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-black group-hover:w-8 transition-all duration-300"></span>            Agende Agora
            <span className="w-1.5 h-1.5 rounded-full bg-black group-hover:w-8 transition-all duration-300"></span>          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/40 to-[#F0B35B]/0 -skew-x-45 animate-shine opacity-0 group-hover:opacity-100"></div>
        </button>
      </div>
      
      {/* Features rotativas - Fixo na parte inferior */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center pb-6">
        <div className="bg-[#1A1F2E]/70 backdrop-blur-md rounded-lg px-4 py-2 inline-flex items-center space-x-2 border border-[#F0B35B]/20 shadow-md hover:shadow-[#F0B35B]/20 overflow-hidden w-full max-w-xs sm:max-w-sm mx-4 transition-all duration-300">
          <div className="text-[#F0B35B] transition-all duration-500 flex-shrink-0">
            {features[activeFeature].icon}
          </div>
          <div className="h-6 w-px bg-[#F0B35B]/20 flex-shrink-0"></div>
          <div className="relative w-full min-w-[150px] sm:min-w-[120px] h-5 overflow-hidden flex items-center justify-center">
            <div
              className={`absolute text-white/70 text-sm font-medium text-center transition-all duration-300 ease-in-out w-full whitespace-nowrap
                ${isFeatureChanging
                  ? featureDirection === 'right'
                    ? 'opacity-0 -translate-x-full'
                    : 'opacity-100 translate-x-0'
                  : 'opacity-100 translate-x-0'}`}
            >
              {features[activeFeature].text}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
