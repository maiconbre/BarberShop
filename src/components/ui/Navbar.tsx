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
        <div className="flex items-center justify-center md:justify-start h-16">
          {/* Logo Centralizado */}
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
