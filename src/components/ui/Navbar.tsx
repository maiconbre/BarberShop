import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [navLoaded, setNavLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNavLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <nav
      className={`fixed w-full bg-[#0D121E]/80 backdrop-blur-sm z-50 transition-all duration-500 ease-out
        ${navLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div
              className="transform hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="inline-block relative">
                <div className="text-[#F0B35B] text-lg font-medium tracking-wider border border-[#F0B35B]/70 px-2 py-1 rounded">
                  BARBER<span className="text-white/80">SHOP</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-full h-full border border-white/10 rounded"></div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              <button onClick={() => navigate('/')} className="text-gray-300 hover:text-[#F0B35B] transition-colors text-sm font-medium">Início</button>
              <button onClick={() => navigate('/about')} className="text-gray-300 hover:text-[#F0B35B] transition-colors text-sm font-medium">Sobre</button>
              <button onClick={() => navigate('/services')} className="text-gray-300 hover:text-[#F0B35B] transition-colors text-sm font-medium">Serviços</button>
              <button onClick={() => navigate('/contact')} className="text-gray-300 hover:text-[#F0B35B] transition-colors text-sm font-medium">Contato</button>
            </div>
          </div>

          {/* Login/Register Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="text-white text-sm font-medium hover:text-[#F0B35B] transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-[#F0B35B] text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#D4943D] transition-all transform hover:scale-105"
            >
              Cadastrar
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
