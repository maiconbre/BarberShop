import React from 'react';

interface HeroProps {
  setIsModalOpen: (isOpen: boolean) => void;
}

const Hero: React.FC<HeroProps> = ({ setIsModalOpen }) => {
  return (
    <div 
      className="relative min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: 'linear-gradient(rgba(13, 18, 30, 0.7), rgba(13, 18, 30, 0.7)), url("https://images.unsplash.com/photo-1517832606299-7ae9b720a186?q=80&w=1972&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
          ESTILO É UM REFLEXO DA SUA<br />
          <span className="text-[#F0B35B]">ATITUDE E PERSONALIDADE</span>
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          Transforme seu visual com os melhores profissionais de Bangu
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#F0B35B] text-black px-8 py-3 rounded-md text-lg font-semibold hover:bg-[#F0B35B]/80 transition-colors"
        >
          Agendar horário
        </button>
      </div>
    </div>
  );
};

export default Hero;