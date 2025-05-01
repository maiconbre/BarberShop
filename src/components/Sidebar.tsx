import React, { useState, useEffect } from 'react';
import { Scissors, User, Calendar, Home, Users, LogOut, Key, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, LayoutDashboard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Notifications from './Notifications';

type DashboardView = 'painel' | 'agenda' | 'analytics';
type ReportView = 'overview' | 'clients' | 'services' | 'trends';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, getCurrentUser } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true'
  });
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);
  const [isReportsExpanded, setIsReportsExpanded] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportView>('overview');

  // Persistir estado do collapse
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);
  const [activeView, setActiveView] = useState<DashboardView>(() => {
    if (location.pathname === '/dashboard') {
      const searchParams = new URLSearchParams(location.search);
      return (searchParams.get('view') as DashboardView) || 'painel';
    }
    return 'painel';
  });
  const currentUser = getCurrentUser();
  const isAuthenticated = !!currentUser;

  // Sincronizar com URL e histórico
  useEffect(() => {
    const handlePopState = () => {
      if (location.pathname === '/dashboard') {
        const searchParams = new URLSearchParams(location.search);
        const view = searchParams.get('view') as DashboardView;
        if (view && ['painel', 'agenda', 'analytics'].includes(view)) {
          setActiveView(view);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Expandir dashboard se estiver na página correspondente
    if (location.pathname === '/dashboard') {
      setIsDashboardExpanded(true);
      const searchParams = new URLSearchParams(location.search);
      const view = searchParams.get('view') as DashboardView;
      if (view && ['painel', 'agenda', 'analytics'].includes(view)) {
        setActiveView(view);
      } else {
        // Se não houver view na URL, usar painel como padrão
        setActiveView('painel');
        const newUrl = `${location.pathname}?view=painel`;
        window.history.replaceState({}, '', newUrl);
      }
    } else {
      // Colapsar menu quando sair do dashboard
      setIsDashboardExpanded(false);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleChangePassword = () => {
    navigate('/trocar-senha');
  };

  const handleDashboardViewChange = (view: DashboardView) => {
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
      // Aguarda a navegação completar antes de disparar o evento
      setTimeout(() => {
        const event = new CustomEvent('dashboardViewChange', { detail: { view } });
        window.dispatchEvent(event);
      }, 100);
    } else {
      const event = new CustomEvent('dashboardViewChange', { detail: { view } });
      window.dispatchEvent(event);
    }
    
    setActiveView(view);
    // Não colapsa o menu ao trocar de view no dashboard
    if (location.pathname !== '/dashboard') {
      setIsDashboardExpanded(false);
    }

    // Atualiza a URL com o parâmetro de visualização
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('view', view);
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleReportViewChange = (view: ReportView) => {
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
      // Aguarda a navegação completar antes de disparar o evento
      setTimeout(() => {
        const event = new CustomEvent('reportViewChange', { detail: { view } });
        window.dispatchEvent(event);
      }, 100);
    } else {
      const event = new CustomEvent('reportViewChange', { detail: { view } });
      window.dispatchEvent(event);
    }
    
    setActiveReport(view);
    handleDashboardViewChange('analytics');
    
    // Atualiza a URL com o parâmetro de visualização
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('view', 'analytics');
    searchParams.set('report', view);
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, '', newUrl);
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
    <aside 
      className={`hidden md:flex fixed left-0 top-0 h-screen bg-[#2A303C] shadow-lg transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      <div className="flex flex-col w-full h-full">
        {/* Cabeçalho com Logo e Notificações */}
        <div className="p-4 border-b border-white/10 bg-[#222831] flex items-center justify-between gap-2">
          <div 
            className="transform hover:scale-[1.02] transition-transform duration-300 cursor-pointer flex items-center gap-3" 
          >
            <div
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
              className="flex-shrink-0"
            >
              {isCollapsed ? (
                <div className="w-8 h-8 rounded-lg bg-[#F0B35B]/10 flex items-center justify-center">
                  <span className="text-[#F0B35B] text-xl font-bold">B</span>
                </div>
              ) : (
                <div className="text-[#F0B35B] text-lg font-medium tracking-wider px-2 py-1 rounded-lg bg-[#F0B35B]/10">
                  BARBER<span className="text-white/80">SHOP</span>
                </div>
              )}
            </div>
            {!isCollapsed && isAuthenticated && <Notifications />}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label={isCollapsed ? "Expandir menu" : "Minimizar menu"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-white/60" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-white/60" />
            )}
          </button>
        </div>

        {/* Menu Principal */}
        <div className="flex-1 p-4 space-y-6">
          {isAuthenticated ? (
            <div>
              {!isCollapsed && (
                <h3 className="px-4 mb-2 text-sm font-medium text-white/40 uppercase tracking-wider">
                  Principal
                </h3>
              )}
              <div className="space-y-1">
                <div>
                  <button
                    onClick={() => !isCollapsed && setIsDashboardExpanded(!isDashboardExpanded)}
                    className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <LayoutDashboard className="w-5 h-5 text-white/60 group-hover:text-[#F0B35B] transition-colors duration-300" />
                    {!isCollapsed && (
                      <>
                        <span className="ml-3 text-white/80 group-hover:text-white transition-colors duration-300">
                          Dashboard
                        </span>
                        <ChevronDown className={`ml-auto w-4 h-4 text-white/40 transition-transform duration-300 ${isDashboardExpanded ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>
                  {!isCollapsed && isDashboardExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="pl-11 space-y-1 mt-1"
                    >
                      <button
                        onClick={() => handleDashboardViewChange('painel')}
                        className={`w-full text-left py-2 px-4 rounded-lg transition-colors ${
                          activeView === 'painel'
                            ? 'text-[#F0B35B] bg-[#F0B35B]/5'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Painel
                      </button>
                      <button
                        onClick={() => handleDashboardViewChange('agenda')}
                        className={`w-full text-left py-2 px-4 rounded-lg transition-colors ${
                          activeView === 'agenda'
                            ? 'text-[#F0B35B] bg-[#F0B35B]/5'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Agenda
                      </button>
                    </motion.div>
                  )}
                </div>
                {/* Reports Menu */}
                <div>
                  <button
                    onClick={() => !isCollapsed && setIsReportsExpanded(!isReportsExpanded)}
                    className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <LayoutDashboard className="w-5 h-5 text-white/60 group-hover:text-[#F0B35B] transition-colors duration-300" />
                    {!isCollapsed && (
                      <>
                        <span className="ml-3 text-white/80 group-hover:text-white transition-colors duration-300">
                          Relatórios
                        </span>
                        <ChevronDown className={`ml-auto w-4 h-4 text-white/40 transition-transform duration-300 ${isReportsExpanded ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>
                  {!isCollapsed && isReportsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="pl-11 space-y-1 mt-1"
                    >
                      <button
                        onClick={() => handleReportViewChange('overview')}
                        className={`w-full text-left py-2 px-4 rounded-lg transition-colors ${
                          activeReport === 'overview'
                            ? 'text-[#F0B35B] bg-[#F0B35B]/5'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Visão Geral
                      </button>
                      <button
                        onClick={() => handleReportViewChange('clients')}
                        className={`w-full text-left py-2 px-4 rounded-lg transition-colors ${
                          activeReport === 'clients'
                            ? 'text-[#F0B35B] bg-[#F0B35B]/5'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Clientes
                      </button>
                      <button
                        onClick={() => handleReportViewChange('services')}
                        className={`w-full text-left py-2 px-4 rounded-lg transition-colors ${
                          activeReport === 'services'
                            ? 'text-[#F0B35B] bg-[#F0B35B]/5'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Serviços
                      </button>
                      <button
                        onClick={() => handleReportViewChange('trends')}
                        className={`w-full text-left py-2 px-4 rounded-lg transition-colors ${
                          activeReport === 'trends'
                            ? 'text-[#F0B35B] bg-[#F0B35B]/5'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Tendências
                      </button>
                    </motion.div>
                  )}
                </div>
                <button
                  onClick={() => navigate('/servicos')}
                  className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <Scissors className="w-5 h-5 text-white/60 group-hover:text-[#F0B35B] transition-colors duration-300" />
                  {!isCollapsed && (
                    <span className="ml-3 text-white/80 group-hover:text-white transition-colors duration-300">
                      Gerenciar Serviços
                    </span>
                  )}
                </button>
                <button
                  onClick={() => navigate('/gerenciar-horarios')}
                  className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <Calendar className="w-5 h-5 text-white/60 group-hover:text-[#F0B35B] transition-colors duration-300" />
                  {!isCollapsed && (
                    <span className="ml-3 text-white/80 group-hover:text-white transition-colors duration-300">
                      Gerenciar Horários
                    </span>
                  )}
                </button>
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => navigate('/register')}
                    className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <Users className="w-5 h-5 text-white/60 group-hover:text-[#F0B35B] transition-colors duration-300" />
                    {!isCollapsed && (
                      <span className="ml-3 text-white/80 group-hover:text-white transition-colors duration-300">
                        Gerenciar Barbeiros
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <button
                onClick={() => navigate('/')}
                className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <Home className="w-5 h-5 text-white/60 group-hover:text-[#F0B35B] transition-colors duration-300" />
                {!isCollapsed && (
                  <span className="ml-3 text-white/80 group-hover:text-white transition-colors duration-300">
                    Home
                  </span>
                )}
              </button>
              <button
                onClick={() => scrollToSection('services')}
                className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <Scissors className="w-5 h-5 text-white/60 group-hover:text-[#F0B35B] transition-colors duration-300" />
                {!isCollapsed && (
                  <span className="ml-3 text-white/80 group-hover:text-white transition-colors duration-300">
                    Serviços
                  </span>
                )}
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <User className="w-5 h-5 text-white/60 group-hover:text-[#F0B35B] transition-colors duration-300" />
                {!isCollapsed && (
                  <span className="ml-3 text-white/80 group-hover:text-white transition-colors duration-300">
                    Sobre
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Área do Usuário */}
        {isAuthenticated && (
          <div className="p-4 border-t border-white/10 bg-[#222831]">
            <div className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-4 mb-2 text-sm font-medium text-white/40 uppercase tracking-wider">
                  Conta
                </h3>
              )}
              <button
                onClick={handleChangePassword}
                className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <Key className="w-5 h-5 text-white/60 group-hover:text-[#F0B35B] transition-colors duration-300" />
                {!isCollapsed && (
                  <span className="ml-3 text-white/80 group-hover:text-white transition-colors duration-300">
                    Trocar Senha
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-4 py-3 rounded-lg hover:bg-red-500/10 transition-colors group"
              >
                <LogOut className="w-5 h-5 text-red-400/80 group-hover:text-red-400 transition-colors duration-300" />
                {!isCollapsed && (
                  <span className="ml-3 text-red-400/80 group-hover:text-red-400 transition-colors duration-300">
                    Sair
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
