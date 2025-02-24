import React, { useState, useEffect, useCallback } from 'react';
import { Scissors, User, Loader2 } from 'lucide-react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface HeroProps {
  setIsModalOpen: (isOpen: boolean) => void;
}

const Hero: React.FC<HeroProps> = ({ setIsModalOpen }) => {
  const [bgLoaded, setBgLoaded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBgLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
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
        transition-all duration-1000 ease-out
        ${bgLoaded ? 'filter blur-0 opacity-100 translate-x-0' : 'filter blur-3xl opacity-0 -translate-x-10'}
      `}
    >
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <LazyLoadImage
          src="/img/fotohero.avif"
          alt="Barbearia GR - Ambiente profissional e moderno"
          effect="blur"
          afterLoad={handleImageLoad}
          className="w-full h-full object-cover"
          wrapperClassName="w-full h-full"
          style={{
            filter: 'brightness(0.3)'
          }}
        />
        {isImageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0D121E]">
            <Loader2 className="w-12 h-12 text-[#F0B35B] animate-spin" />
          </div>
        )}
      </div>

      <div 
        className="relative z-10 text-center px-4 transition-all duration-1000 ease-out"
        role="banner"
      >
        <h1 
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight"
          itemProp="headline"
        >
          <span className="sr-only">GR Barber - </span>
          ESTILO É UM REFLEXO DA SUA<br />
          <span 
            className="text-[#F0B35B] font-extrabold inline-block animate-pulse transition-transform hover:scale-110"
            itemProp="alternativeHeadline"
          >
            ATITUDE E PERSONALIDADE
          </span>
        </h1>

        <p 
          className="text-lg md:text-xl lg:text-2xl mb-8 max-w-2xl mx-auto text-gray-200"
          itemProp="description"
        >
          Transforme seu visual com os melhores profissionais de Bangu
        </p>

        <div className="flex justify-center space-x-4 mt-6 mb-8">
          <Scissors 
            className="text-[#F0B35B] animate-bounce hover:scale-110 transition-transform cursor-pointer" 
            size={40} 
            aria-label="Tesoura de barbeiro"
          />
          <User 
            className="text-[#F0B35B] animate-pulse hover:scale-110 transition-transform cursor-pointer" 
            size={40} 
            aria-label="Ícone de cliente"
          />
        </div>

        <button
          onClick={handleBookingClick}
          className="
            mt-8 bg-[#F0B35B] text-black px-8 py-4 rounded-lg
            text-lg md:text-xl font-semibold shadow-lg
            hover:bg-[#F0B35B]/90 hover:scale-105
            focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:ring-offset-2 focus:ring-offset-[#0D121E]
            transform transition-all duration-300 ease-out
            active:scale-95
          "
          aria-label="Agendar horário na barbearia"
        >
          Agendar horário
        </button>
      </div>
    </section>
  );
};

export default Hero;
