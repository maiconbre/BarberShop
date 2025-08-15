import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Calendar, User, LogIn } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentBarbershop } from '../../services/BarbershopService';

interface BarbershopNavbarProps {
  onBookingClick?: () => void;
}

const BarbershopNavbar: React.FC<BarbershopNavbarProps> = ({ onBookingClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { barbershopData, slug } = useTenant();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Detectar scroll para mudar o estilo da navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginClick = () => {
    // Sempre redirecionar para login global quando não estiver logado
    navigate('/login');
  };

  const handleDashboardClick = async () => {
    if (isAuthenticated) {
      try {
        // Verificar se o usuário pertence a esta barbearia
        const currentUser = useAuth().getCurrentUser();
        if (currentUser && (currentUser as any).barbershopId) {
          // Obter dados da barbearia do usuário
          const barbershopData = await getCurrentBarbershop();
          if (barbershopData && barbershopData.slug) {
            // Verificar se o slug da barbearia do usuário corresponde ao slug atual
            if (barbershopData.slug === slug) {
              // Usuário pertence a esta barbearia, ir para dashboard
              navigate(`/app/${slug}/dashboard`);
            } else {
              // Usuário pertence a outra barbearia, redirecionar para sua própria
              navigate(`/app/${barbershopData.slug}/dashboard`);
            }
          } else {
             // Fallback: ir para login
             navigate('/login');
           }
        } else {
          // Usuário sem barbershopId, redirecionar para login
          navigate('/login');
        }
      } catch (error) {
        console.error('Erro ao verificar dados da barbearia:', error);
        // Em caso de erro, redirecionar para login
        navigate('/login');
      }
    } else {
      // Não deveria chegar aqui, mas por segurança
      navigate('/login');
    }
  };

  const navItems = [
    { name: 'Início', section: 'hero' },
    { name: 'Serviços', section: 'services' },
    { name: 'Sobre', section: 'about' },
    { name: 'Contato', section: 'contact' }
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#0D121E]/95 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Nome da Barbearia */}
          <Link to={`/${slug}`} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#F0B35B] to-[#E6A555] rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">
                {barbershopData?.name?.charAt(0) || 'B'}
              </span>
            </div>
            <span className="text-white font-bold text-xl">
              {barbershopData?.name || 'Barbearia'}
            </span>
          </Link>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.section)}
                className="text-gray-300 hover:text-[#F0B35B] transition-colors duration-200 font-medium"
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Botões de Ação Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {onBookingClick && (
              <button
                onClick={onBookingClick}
                className="bg-[#F0B35B] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#E6A555] transition-colors duration-200 flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Agendar</span>
              </button>
            )}
            
            {isAuthenticated ? (
              <button
                onClick={handleDashboardClick}
                className="text-gray-300 hover:text-[#F0B35B] transition-colors duration-200 flex items-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="text-gray-300 hover:text-[#F0B35B] transition-colors duration-200 flex items-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Entrar</span>
                </button>
                
                {/* Botão discreto para barbeiros */}
                <button
                  onClick={handleLoginClick}
                  className="text-xs text-gray-500 hover:text-gray-400 transition-colors duration-200 px-2 py-1 rounded border border-gray-600 hover:border-gray-500"
                  title="Acesso para barbeiros"
                >
                  Login Barbeiros
                </button>
              </>
            )}
          </div>

          {/* Botão Menu Mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0D121E]/95 backdrop-blur-md border-t border-gray-800"
          >
            <div className="px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.section)}
                  className="block w-full text-left text-gray-300 hover:text-[#F0B35B] transition-colors duration-200 font-medium py-2"
                >
                  {item.name}
                </button>
              ))}
              
              <div className="pt-4 border-t border-gray-800 space-y-3">
                {onBookingClick && (
                  <button
                    onClick={() => {
                      onBookingClick();
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-[#F0B35B] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#E6A555] transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Agendar</span>
                  </button>
                )}
                
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      handleDashboardClick();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-gray-300 hover:text-[#F0B35B] transition-colors duration-200 flex items-center justify-center space-x-2 py-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        handleLoginClick();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-gray-300 hover:text-[#F0B35B] transition-colors duration-200 flex items-center justify-center space-x-2 py-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Entrar</span>
                    </button>
                    
                    {/* Botão discreto para barbeiros - Mobile */}
                    <button
                      onClick={() => {
                        handleLoginClick();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-xs text-gray-500 hover:text-gray-400 transition-colors duration-200 py-2 rounded border border-gray-600 hover:border-gray-500"
                      title="Acesso para barbeiros"
                    >
                      Login Barbeiros
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default BarbershopNavbar;