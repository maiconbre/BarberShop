import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  setIsModalOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Estado para animar o navbar ao carregar
  const [navLoaded, setNavLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNavLoaded(true);
    }, 100); // Delay para iniciar a animação
    return () => clearTimeout(timer);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/', { replace: false });
      // Após mudar para a home, aguarde um pouco para então rolar o scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav
      className={`fixed w-full bg-[#0D121E]/80 backdrop-blur-sm z-50 transition-all duration-500 ease-out
        ${navLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo com efeito de hover aumentado */}
          <div className="flex-shrink-0">
            <a
              onClick={() => {
                navigate('/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-[#F0B35B] font-bold text-xl cursor-pointer transition-transform duration-300 hover:scale-110"
            >
            BarberShop
            </a>
          </div>
          {/* Menu Desktop */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <button
                onClick={() => scrollToSection('services')}
                className="text-white hover:text-[#F0B35B] transition-colors transition-transform duration-300 hover:scale-105"
              >
                Serviços
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-white hover:text-[#F0B35B] transition-colors transition-transform duration-300 hover:scale-105"
              >
                Sobre
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#F0B35B] text-black px-4 py-2 rounded-md hover:bg-[#F0B35B]/80 transition-colors transition-transform duration-300 hover:scale-105"
              >
                Agendar horário
              </button>
            </div>
          </div>
          {/* Ícone para Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-[#F0B35B] transition-colors transition-transform duration-300 hover:scale-105"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu com transição */}
      {isMobileMenuOpen && (
        <div className="md:hidden transition-all duration-500 ease-out">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#0D121E]/95 backdrop-blur-sm">
            <button
              onClick={() => {
                scrollToSection('about');
                setIsMobileMenuOpen(false);
              }}
              className="block text-white hover:text-[#F0B35B] py-2 px-3 transition-colors transition-transform duration-300 hover:scale-105"
            >
              Sobre
            </button>
            <button
              onClick={() => {
                scrollToSection('services');
                setIsMobileMenuOpen(false);
              }}
              className="block text-white hover:text-[#F0B35B] py-2 px-3 transition-colors transition-transform duration-300 hover:scale-105"
            >
              Serviços
            </button>
            <button
              onClick={() => {
                setIsModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left bg-[#F0B35B] text-black px-3 py-2 rounded-md hover:bg-[#F0B35B]/80 transition-colors transition-transform duration-300 hover:scale-105"
            >
              Agendar horário
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
