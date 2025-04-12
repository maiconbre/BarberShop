import React, { useState, useEffect } from 'react';
import { Menu, X, Scissors, User, Calendar, Home, Settings, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Notifications from './Notifications';

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
  const { logout, getCurrentUser } = useAuth();
  const [navLoaded, setNavLoaded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inactivityTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const currentUser = getCurrentUser();
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    const timer = setTimeout(() => {
      setNavLoaded(true);
    }, 100); // Delay para iniciar a animação
    return () => clearTimeout(timer);
  }, []);
  
  // Efeito para fechar o menu após período de inatividade
  useEffect(() => {
    if (isMobileMenuOpen) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        setIsMobileMenuOpen(false);
      }, 5000);
    }
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  // Efeito para fechar o menu ao rolar a página
  useEffect(() => {
    const handleScroll = () => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/', { replace: false });
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
          <div className="flex-shrink-0">
            <div className="transform hover:scale-[1.02] transition-transform duration-300" onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}>
              <div className="inline-block relative cursor-pointer">
                <div className="text-[#F0B35B] text-lg font-medium tracking-wider border border-[#F0B35B]/70 px-2 py-1 rounded">
                  BARBER<span className="text-white/80">SHOP</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-full h-full border border-white/10 rounded"></div>
              </div>
            </div>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex md:items-center">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Notifications />
                </div>
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-1.5 rounded-full bg-[#1A1F2E] hover:bg-[#252B3B] transition-colors duration-300 flex items-center justify-center"
                    aria-label="Configurações"
                  >
                    <Settings className="w-4 h-4 text-white" />
                  </button>

                  {isDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setIsDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#1A1F2E] shadow-lg ring-1 ring-[#F0B35B]/20 z-50 py-1">
                        <button 
                          onClick={() => {
                            navigate('/servicos');
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#252B3B] w-full text-left"
                        >
                          <Scissors className="w-4 h-4" />
                          Gerenciar Serviços
                        </button>
                        <button 
                          onClick={() => {
                            navigate('/gerenciar-horarios');
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#252B3B] w-full text-left"
                        >
                          <Calendar className="w-4 h-4" />
                          Gerenciar Horários
                        </button>
                        <button 
                          onClick={() => {
                            navigate('/register');
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#252B3B] w-full text-left"
                        >
                          <Users className="w-4 h-4" />
                          Gerenciar Barbeiros
                        </button>
                        <button 
                          onClick={() => {
                            logout();
                            setIsDropdownOpen(false);
                            navigate('/');
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 w-full text-left"
                        >
                          Sair
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
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
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/40 to-[#F0B35B]/0 -skew-x-45 opacity-0 group-hover:opacity-100 transition-opacity animate-shine"></div>
                </button>
              </div>
            )}
          </div>

          {/* Ícone para Mobile */}
          {!isAuthenticated && (
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:text-[#F0B35B] transition-colors transition-transform duration-300 hover:scale-110"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          )}

          {/* Menu Mobile para Usuário Logado */}
          {isAuthenticated && (
            <div className="md:hidden flex items-center gap-3">
              <div className="relative group">
                <Notifications />
              </div>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="p-1.5 rounded-full bg-[#1A1F2E] hover:bg-[#252B3B] transition-colors duration-300 flex items-center justify-center"
                  aria-label="Configurações"
                >
                  <Settings className="w-4 h-4 text-white" />
                </button>

                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#1A1F2E] shadow-lg ring-1 ring-[#F0B35B]/20 z-50 py-1">
                      <button 
                        onClick={() => {
                          navigate('/servicos');
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#252B3B] w-full text-left"
                      >
                        <Scissors className="w-4 h-4" />
                        Gerenciar Serviços
                      </button>
                      <button 
                        onClick={() => {
                          navigate('/gerenciar-horarios');
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#252B3B] w-full text-left"
                      >
                        <Calendar className="w-4 h-4" />
                        Gerenciar Horários
                      </button>
                      <button 
                        onClick={() => {
                          navigate('/register');
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#252B3B] w-full text-left"
                      >
                        <Users className="w-4 h-4" />
                        Gerenciar Barbeiros
                      </button>
                      <button 
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                          navigate('/');
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 w-full text-left"
                      >
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu Mobile para Usuário Não Logado */}
      {!isAuthenticated && (
        <AnimatePresence mode="wait">
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="md:hidden relative z-50"
              >
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#0D121E] border-b border-[#F0B35B]/10">
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-[#F0B35B]/10 transition-colors"
                  >
                    <motion.span
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-3 text-[#F0B35B] text-lg"
                    >
                      <Home className="flex-shrink-0" size={20} />
                      Home
                    </motion.span>
                  </button>
                  
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
            </>
          )}
        </AnimatePresence>
      )}
    </nav>
  );
};

export default Navbar;
