import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Scissors, User, Calendar, Home, Settings, Users, LogOut, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Notifications from './Notifications';
import { useCache } from '../../hooks/useCache';

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
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  
  // Usando o hook useCache para armazenar o usuário atual
  const { data: currentUser, updateCache } = useCache<any>(
    'currentUser',
    async () => getCurrentUser(),
    { ttl: 5 * 60 * 1000 } // 5 minutos de TTL
  );
  
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    const timer = setTimeout(() => {
      setNavLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    // Invalidar o cache do usuário ao fazer logout
    updateCache(() => null);
    navigate('/');
  };

  const handleChangePassword = () => {
    navigate('/trocar-senha');
    setIsProfileDropdownOpen(false);
  };

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
          {/* Logo */}
          <div className="flex-shrink-0">
            <div 
              className="transform hover:scale-[1.02] transition-transform duration-300 cursor-pointer" 
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
            >
              <div className="inline-block relative">
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
              <div className="flex items-center gap-4">
                {/* Notificações */}
                <div className="relative group">
                  <Notifications />
                </div>

                {/* Perfil Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1A1F2E] hover:bg-[#252B3B] transition-all duration-300 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#F0B35B]/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-[#F0B35B]" />
                    </div>
                    <span className="text-white text-sm font-medium">
                      {currentUser?.name || 'Usuário'}
                    </span>
                    {isProfileDropdownOpen ? (
                      <ChevronUp className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isProfileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 rounded-xl bg-[#1A1F2E] shadow-lg ring-1 ring-[#F0B35B]/20 z-50 overflow-hidden"
                      >
                        <div className="py-1">
                          <button
                            onClick={handleChangePassword}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#252B3B] w-full text-left transition-colors"
                          >
                            <Key className="w-4 h-4 text-[#F0B35B]" />
                            Trocar Senha
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 w-full text-left transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sair
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Configurações Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-2 rounded-lg bg-[#1A1F2E] hover:bg-[#252B3B] transition-all duration-300 group"
                    aria-label="Configurações"
                  >
                    <Settings className="w-5 h-5 text-white group-hover:text-[#F0B35B] transition-colors" />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 rounded-xl bg-[#1A1F2E] shadow-lg ring-1 ring-[#F0B35B]/20 z-50 overflow-hidden"
                      >
                        <div className="py-1">
                          <button
                            onClick={() => {
                              navigate('/servicos');
                              setIsDropdownOpen(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#252B3B] w-full text-left transition-colors"
                          >
                            <Scissors className="w-4 h-4 text-[#F0B35B]" />
                            Gerenciar Serviços
                          </button>
                          <button
                            onClick={() => {
                              navigate('/gerenciar-horarios');
                              setIsDropdownOpen(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#252B3B] w-full text-left transition-colors"
                          >
                            <Calendar className="w-4 h-4 text-[#F0B35B]" />
                            Gerenciar Horários
                          </button>
                          {currentUser?.role === 'admin' && (
                            <button
                              onClick={() => {
                                navigate('/register');
                                setIsDropdownOpen(false);
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#252B3B] w-full text-left transition-colors"
                            >
                              <Users className="w-4 h-4 text-[#F0B35B]" />
                              Gerenciar Barbeiros
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="ml-10 flex items-baseline space-x-6">
                <button
                  onClick={() => scrollToSection('services')}
                  className="text-white/90 hover:text-[#F0B35B] transition-all duration-300 hover:scale-105"
                >
                  Serviços
                </button>
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-white/90 hover:text-[#F0B35B] transition-all duration-300 hover:scale-105"
                >
                  Sobre
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="relative overflow-hidden group bg-[#F0B35B] text-black px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 border-2 border-[#F0B35B]/70 hover:shadow-[0_0_15px_rgba(240,179,91,0.4)]"
                >
                  <span className="relative z-10">Agendar horário</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/40 to-[#F0B35B]/0 -skew-x-45 opacity-0 group-hover:opacity-100 transition-opacity animate-shine"></div>
                </button>
              </div>
            )}
          </div>

          {/* Menu Mobile */}
          <div className="md:hidden flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="relative group">
                  <Notifications />
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-lg bg-[#1A1F2E] hover:bg-[#252B3B] transition-all duration-300"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5 text-white" />
                  ) : (
                    <Menu className="w-5 h-5 text-white" />
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg bg-[#1A1F2E] hover:bg-[#252B3B] transition-all duration-300"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menu Mobile Content */}
      <AnimatePresence>
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
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => {
                        navigate('/dashboard');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-[#F0B35B]/10 transition-colors"
                    >
                      <motion.span
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-3 text-[#F0B35B] text-lg"
                      >
                        <Home className="flex-shrink-0" size={20} />
                        Dashboard
                      </motion.span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/servicos');
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
                        navigate('/gerenciar-horarios');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-[#F0B35B]/10 transition-colors"
                    >
                      <motion.span
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-3 text-[#F0B35B] text-lg"
                      >
                        <Calendar size={20} className="flex-shrink-0" />
                        Horários
                      </motion.span>
                    </button>
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => {
                          navigate('/register');
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-[#F0B35B]/10 transition-colors"
                      >
                        <motion.span
                          whileHover={{ x: 5 }}
                          className="flex items-center gap-3 text-[#F0B35B] text-lg"
                        >
                          <Users size={20} className="flex-shrink-0" />
                          Barbeiros
                        </motion.span>
                      </button>
                    )}
                    <button
                      onClick={handleChangePassword}
                      className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-[#F0B35B]/10 transition-colors"
                    >
                      <motion.span
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-3 text-[#F0B35B] text-lg"
                      >
                        <Key size={20} className="flex-shrink-0" />
                        Trocar Senha
                      </motion.span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <motion.span
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-3 text-red-400 text-lg"
                      >
                        <LogOut size={20} className="flex-shrink-0" />
                        Sair
                      </motion.span>
                    </button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
