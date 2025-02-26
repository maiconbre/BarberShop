import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
// @ts-ignore
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
          className="text-lg md:text-xl lg:text-2xl mb-12 max-w-2xl mx-auto text-gray-200 leading-relaxed"
          itemProp="description"
        >
          Transforme seu visual com os melhores profissionais de Bangu
        </p>

        <button
          onClick={handleBookingClick}
          className="
            relative overflow-hidden group
            mt-8 bg-[#F0B35B] text-black px-12 py-4 rounded-lg
            text-lg md:text-xl font-semibold
            transition-all duration-300 ease-out
            hover:bg-[#F0B35B]/90 hover:shadow-[0_0_20px_rgba(240,179,91,0.3)]
            active:scale-95
          "
        >
          <span className="relative z-10 inline-flex items-center justify-center w-full gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-black group-hover:w-6 transition-all duration-300"></span>
            Agende Agora
            <span className="w-1.5 h-1.5 rounded-full bg-black group-hover:w-6 transition-all duration-300"></span>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/10 to-[#F0B35B]/0 -skew-x-45 group-hover:animate-shine"></div>
        </button>
      </div>
    </section>
  );
};

export default Hero;
