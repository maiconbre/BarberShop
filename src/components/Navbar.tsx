import React, { useState, useEffect } from 'react';
import { Menu, X, Scissors, User, Calendar } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

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
          {/* Logo com efeito de hover sutil */}
          <div className="flex-shrink-0">
            <div className="transform hover:scale-[1.02] transition-transform duration-300">
              <div className="inline-block relative">
                <div className="text-[#F0B35B] text-lg font-medium tracking-wider border border-[#F0B35B]/70 px-2 py-1 rounded">
                  BARBER<span className="text-white/80">SHOP</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-full h-full border border-white/10 rounded"></div>
              </div>
            </div>
          </div>
          {/* Menu Desktop */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <button
                onClick={() => scrollToSection('services')}
                className="text-white/90 hover:text-[#F0B35B] transition-colors transition-transform duration-300 hover:scale-105"
              >
                Serviços
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-white/90 hover:text-[#F0B35B] transition-colors transition-transform duration-300 hover:scale-105"
              >
                Sobre
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="relative overflow-hidden group bg-[#F0B35B] text-black px-4 py-2 rounded-md transition-all duration-300 hover:scale-110 border-2 border-[#F0B35B]/70 hover:shadow-[0_0_15px_rgba(240,179,91,0.4)]"
              >
                <span className="relative z-10">Agendar horário</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 
                via-white/40 to-[#F0B35B]/0 -skew-x-45 opacity-100 
                animate-shine"></div>
              </button>
            </div>
          </div>
          {/* Ícone para Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-[#F0B35B] transition-colors transition-transform duration-300 hover:scale-110"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {/* Backdrop animado com blur - separado do menu para não afetar a interatividade */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={(e) => {
              e.stopPropagation();
              setIsMobileMenuOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Conteúdo do menu mobile - com z-index maior que o backdrop para garantir que seja clicável */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="md:hidden transition-all duration-500 ease-out relative z-50"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#0D121E]/95 backdrop-blur-lg border-b border-[#F0B35B]/10">
              <button
                onClick={() => {
                  scrollToSection('about');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-[#F0B35B]/10 transition-colors"
              >
                <motion.span
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 text-[#F0B35B] text-lg"
                >
                  <User className="flex-shrink-0" size={20} />
                  Sobre
                </motion.span>
              </button>

              <button
                onClick={() => {
                  scrollToSection('services');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-[#F0B35B]/10 transition-colors"
              >
                <motion.span
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 text-[#F0B35B] text-lg"
                >
                  <Scissors size={20} className="flex-shrink-0" />
                  Serviços
                </motion.span>
              </button>

              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="relative overflow-hidden group w-full text-left px-4 py-3 rounded-lg bg-[#F0B35B]/20 border border-[#F0B35B]/30 hover:border-[#F0B35B]/50 transition-all"
              >
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 text-[#F0B35B] text-lg font-semibold"
                >
                  <Calendar size={20} className="flex-shrink-0" />
                  Agendar Horário
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/10 to-[#F0B35B]/0 opacity-0 group-hover:opacity-100 transition-opacity -skew-x-45 animate-shine" />
                </motion.span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
