import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  LayoutDashboard,
  Scissors,
  UserCog,
  Lock,
  MessageSquare,
  Clock,
  X,
  LogOut,
  Home,
  ArrowLeft,
  ArrowRight,
  User,
  Crown
} from 'lucide-react';
import Notifications from '../ui/Notifications';
import { usePageConfig } from '../../hooks/usePageConfig';
import { useBarbershopNavigation } from '../../hooks/useBarbershopNavigation';
import { usePlan } from '../../hooks/usePlan';

interface StandardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

const StandardLayout: React.FC<StandardLayoutProps> = ({ children, title, subtitle, icon }) => {
  const { user, logout: authLogout } = useAuth();
  const currentUser = user;
  const navigate = useNavigate();

  // Wrapper for logout to match previous interface
  const logout = async () => {
    await authLogout();
    navigate('/login');
  };
  const pageConfig = usePageConfig();
  const { goToPage, currentSlug } = useBarbershopNavigation();
  const { planInfo, usage } = usePlan();

  // Use props if provided, otherwise use dynamic page config
  const pageTitle = title || pageConfig.title;
  const pageSubtitle = subtitle || pageConfig.subtitle;
  const pageIcon = icon || pageConfig.icon;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Detectar mudanças no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;

      setIsMobile(mobile);

      if (mobile) {
        setIsSidebarOpen(false);
        setIsSidebarCollapsed(false);
      } else {
        setIsSidebarOpen(true);
        setIsSidebarCollapsed(tablet);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    // Navigation is already handled in the logout wrapper
  };

  const navigateToPage = (path: string) => {
    if (currentSlug) {
      goToPage(path);
    } else {
      navigate(path);
    }
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const navigateToSite = () => {
    if (currentSlug) {
      // Navegar para a área pública da barbearia
      navigate(`/${currentSlug}`);
    } else {
      navigate('/');
    }
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#0D121E] relative overflow-hidden">
      <style>{`
        .glass-effect {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(240, 179, 91, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(240, 179, 91, 0.7);
        }
      `}</style>

      {/* Background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#F0B35B]/8 to-transparent rounded-full blur-xl translate-x-1/2 -translate-y-1/2 hidden md:block"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#F0B35B]/5 to-transparent rounded-full blur-lg -translate-x-1/3 translate-y-1/3 md:w-96 md:h-96 md:blur-xl"></div>

      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: 'linear-gradient(90deg, #F0B35B 1px, transparent 1px), linear-gradient(180deg, #F0B35B 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0D121E]/95 glass-effect border-b border-[#F0B35B]/20">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              {pageIcon && (
                <div className="w-6 h-6 bg-[#F0B35B] rounded-md flex items-center justify-center text-black">
                  {React.cloneElement(pageIcon as React.ReactElement, { className: "w-3 h-3" })}
                </div>
              )}
              <h1 className="text-lg font-semibold text-white">Olá, {(currentUser as { name?: string })?.name || 'Usuário'}!</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-[#1A1F2E] text-white hover:bg-[#252B3B] transition-colors duration-200 flex-shrink-0 border border-[#F0B35B]/30">
                <Notifications />
              </div>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-full bg-[#1A1F2E] text-white hover:bg-[#252B3B] transition-colors duration-200 flex-shrink-0 border border-[#F0B35B]/30"
              >
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || !isMobile) && (
          <>
            {/* Mobile Overlay */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <motion.div
              initial={{
                opacity: 0,
                x: isMobile ? 288 : 0
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              exit={{
                opacity: 0,
                x: isMobile ? 288 : 0
              }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className={`fixed top-0 h-screen max-h-screen z-50 glass-effect flex flex-col ${isMobile
                ? 'right-0 w-72 bg-[#0A0E16]/95 border-l border-[#F0B35B]/15 rounded-l-2xl shadow-2xl backdrop-blur-md'
                : isSidebarCollapsed
                  ? 'left-0 w-16 bg-gradient-to-b from-[#1A1F2E] to-[#252B3B] border-r border-[#F0B35B]/20'
                  : 'left-0 w-64 bg-gradient-to-b from-[#1A1F2E] to-[#252B3B] border-r border-[#F0B35B]/20'
                } transition-all duration-150`}
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-[#F0B35B]/20">
                {isMobile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#F0B35B] to-[#E6A555] rounded-full flex items-center justify-center shadow-lg">
                        <User className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <h2 className="text-white font-semibold text-base">Perfil</h2>
                        <p className="text-gray-300 text-sm">{(currentUser as { name?: string })?.name || 'Usuário'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-2 rounded-full bg-[#252B3B] text-gray-400 hover:text-white hover:bg-[#2E354A] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    {!isSidebarCollapsed && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#F0B35B] rounded-lg flex items-center justify-center shadow-lg">
                          <Scissors className="w-4 h-4 text-black" />
                        </div>
                        <div>
                          <h2 className="text-white font-semibold text-sm">BarberShop</h2>
                          <p className="text-gray-400 text-xs">{(currentUser as { name?: string })?.name || 'Usuário'}</p>
                        </div>
                      </div>
                    )}
                    {isSidebarCollapsed && (
                      <div className="w-8 h-8 bg-[#F0B35B] rounded-lg flex items-center justify-center shadow-lg mx-auto">
                        <Scissors className="w-4 h-4 text-black" />
                      </div>
                    )}
                    <button
                      onClick={toggleSidebar}
                      className="p-2 rounded-lg bg-[#252B3B] text-white hover:bg-[#2E354A] transition-colors duration-200 shadow-sm flex-shrink-0"
                    >
                      {isSidebarCollapsed ? (
                        <ArrowRight className="w-4 h-4" />
                      ) : (
                        <ArrowLeft className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Menu */}
              <div className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar min-h-0">
                {/* Dashboard Views */}
                <div className="space-y-1">
                  {!isSidebarCollapsed && (
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Dashboard</p>
                  )}

                  <button
                    onClick={() => navigateToPage('dashboard')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-100 text-white hover:bg-[#252B3B] hover:shadow-md`}
                    title={isSidebarCollapsed ? 'Dashboard' : ''}
                  >
                    <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm font-medium">Dashboard</span>}
                  </button>

                  <button
                    onClick={() => navigateToPage('agenda')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-100 text-white hover:bg-[#252B3B] hover:shadow-md`}
                    title={isSidebarCollapsed ? 'Agenda' : ''}
                  >
                    <Calendar className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm font-medium">Agenda</span>}
                  </button>
                </div>

                {/* Management Section */}
                <div className="space-y-1 pt-4">
                  {!isSidebarCollapsed && (
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Gerenciamento</p>
                  )}

                  <button
                    onClick={() => navigateToPage('servicos')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-white hover:bg-[#252B3B] hover:shadow-md transition-all duration-100`}
                    title={isSidebarCollapsed ? 'Serviços' : ''}
                  >
                    <Scissors className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm">Serviços</span>}
                  </button>

                  <button
                    onClick={() => navigateToPage('equipe')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-white hover:bg-[#252B3B] hover:shadow-md transition-all duration-100`}
                    title={isSidebarCollapsed ? 'Equipe' : ''}
                  >
                    <UserCog className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm">Equipe (Barbeiros)</span>}
                  </button>

                  <button
                    onClick={() => navigateToPage('gerenciar-horarios')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-white hover:bg-[#252B3B] hover:shadow-md transition-all duration-100`}
                    title={isSidebarCollapsed ? 'Horários' : ''}
                  >
                    <Clock className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm">Horários</span>}
                  </button>

                  <button
                    onClick={() => navigateToPage('gerenciar-comentarios')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-white hover:bg-[#252B3B] hover:shadow-md transition-all duration-100`}
                    title={isSidebarCollapsed ? 'Comentários' : ''}
                  >
                    <MessageSquare className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm">Comentários</span>}
                  </button>
                </div>

                {/* Settings Section */}
                <div className="space-y-1 pt-4">
                  {!isSidebarCollapsed && (
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Configurações</p>
                  )}

                  {/* Upgrade Button - Show only for free plan */}
                  {planInfo?.planType === 'free' && (usage?.upgradeRecommended || usage?.upgradeRequired) && (
                    <button
                      onClick={() => navigateToPage('upgrade')}
                      className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-200 transform hover:scale-105 ${usage?.upgradeRequired
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg'
                        : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg'
                        }`}
                      title={isSidebarCollapsed ? (usage?.upgradeRequired ? 'Upgrade Necessário' : 'Upgrade para Pro') : ''}
                    >
                      <Crown className="w-5 h-5 flex-shrink-0" />
                      {!isSidebarCollapsed && (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm font-medium">
                            {usage?.upgradeRequired ? 'Upgrade Necessário' : 'Upgrade para Pro'}
                          </span>
                          {usage?.upgradeRequired && (
                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                              !
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => navigateToPage('trocar-senha')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-white hover:bg-[#252B3B] hover:shadow-md transition-all duration-100`}
                    title={isSidebarCollapsed ? 'Alterar Senha' : ''}
                  >
                    <Lock className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm">Alterar Senha</span>}
                  </button>

                  <button
                    onClick={navigateToSite}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-white hover:bg-[#252B3B] hover:shadow-md transition-all duration-100`}
                    title={isSidebarCollapsed ? 'Ir para Site' : ''}
                  >
                    <Home className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm">Ir para Site</span>}
                  </button>

                  <button
                    // Removido: onClick={() => setIsFeedbackOpen(true)}
                    onClick={() => {/* TODO: Implementar feedback com Supabase */ }}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-white hover:bg-[#252B3B] hover:shadow-md transition-all duration-100`}
                    title={isSidebarCollapsed ? 'Enviar Feedback' : ''}
                  >
                    <MessageSquare className="w-5 h-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm">Enviar Feedback</span>}
                  </button>
                </div>
              </div>

              {/* User Profile Section */}
              {!isSidebarCollapsed && (
                <div className="p-4 border-t border-[#F0B35B]/20 flex-shrink-0">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#252B3B]/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#F0B35B] to-[#E6A555] rounded-full flex items-center justify-center shadow-lg">
                      <UserCog className="w-4 h-4 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {(currentUser as { name?: string })?.name || 'Usuário'}
                      </p>
                      <p className="text-xs text-gray-400">Barbeiro</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Logout Button */}
              <div className="p-4 border-t border-[#F0B35B]/20 flex-shrink-0">
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-200 shadow-sm`}
                  title={isSidebarCollapsed ? 'Sair' : ''}
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  {!isSidebarCollapsed && <span className="text-sm font-medium">Sair</span>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`relative z-10 transition-all duration-300 ${isMobile
        ? 'pt-16'
        : isSidebarCollapsed
          ? 'ml-16'
          : 'ml-64'
        }`}>
        <div className="w-full">
          {/* Page Header */}
          {(pageTitle || pageSubtitle) && (
            <div className={`mb-8 ${isMobile ? 'mt-4' : 'mt-6'}`}>
              <div className="flex items-center gap-3 bg-[#1A1F2E] p-4 border border-[#F0B35B]/20">
                {pageIcon && (
                  <div className="bg-[#F0B35B]/20 p-2 rounded-full flex-shrink-0">
                    {React.cloneElement(pageIcon as React.ReactElement, { className: "w-5 h-5 text-[#F0B35B]" })}
                  </div>
                )}
                <div>
                  {pageSubtitle && (
                    <p className="text-sm text-gray-400">{pageSubtitle}</p>
                  )}
                  <p className="text-white font-medium text-lg">{pageTitle}</p>
                </div>
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className="relative">
            {children}
          </div>
        </div>
      </main>

      {/* User Feedback Modal */}
      {/* Removido: UserFeedback component */}
    </div>
  );
};

export default StandardLayout;