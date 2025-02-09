import React, { useState, useEffect } from 'react';
import { Scissors, User } from 'lucide-react';
import FotoHero from '/img/fotohero.avif';

interface HeroProps {
  setIsModalOpen: (isOpen: boolean) => void;
}

const Hero: React.FC<HeroProps> = ({ setIsModalOpen }) => {
  // Estado para controlar a animação de carregamento do background
  const [bgLoaded, setBgLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBgLoaded(true);
    }, 100); // pequeno delay para iniciar a animação
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`
        relative min-h-screen flex items-center justify-center 
        transition-all duration-1000 ease-out
        ${bgLoaded ? 'filter blur-0 opacity-100 translate-x-0' : 'filter blur-3xl opacity-0 -translate-x-10'}
      `}
      style={{
        backgroundImage: `linear-gradient(rgba(13, 18, 30, 0.7), rgba(13, 18, 30, 0.7)), url(${FotoHero})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="text-center px-4 transition-all duration-1000 ease-out">
        <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
          ESTILO É UM REFLEXO DA SUA<br />
          <span className="text-[#F0B35B] font-extrabold inline-block animate-pulse transition-transform hover:scale-110">
            ATITUDE E PERSONALIDADE
          </span>
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          Transforme seu visual com os melhores profissionais de Bangu
        </p>
        {/* Ícones do nicho de barbeiro com animações */}
        <div className="flex justify-center space-x-2 mt-6">
          <Scissors className="text-[#F0B35B] animate-bounce" size={32} />
          <User className="text-[#F0B35B] animate-pulse" size={32} />
          {/* Adicione outros ícones se desejar */}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-8 bg-[#F0B35B] text-black px-8 py-3 rounded-md text-lg font-semibold hover:bg-[#F0B35B]/80 transition-colors transform hover:scale-110"
        >
          Agendar horário
        </button>
      </div>
    </div>
  );
};

export default Hero;
