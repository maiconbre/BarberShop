import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TenantProvider } from './contexts/TenantContext';
import Navbar from './components/ui/Navbar';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import BarbershopHomePage from './pages/BarbershopHomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';
import ScheduleManagementPage from './pages/ScheduleManagementPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BarbershopRegistrationPage from './pages/BarbershopRegistrationPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import MagicLinkPage from './pages/MagicLinkPage';
import DashboardPageNew from './pages/DashboardPageNew';
import AgendaPage from './pages/AgendaPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TrocaSenha from './pages/TrocaSenha';
import CommentManagementPage from './pages/CommentManagementPage';
import ServiceManagementPage from './pages/ServiceManagementPage';
import UpgradePage from './pages/UpgradePage';
import BookingModal from './components/feature/BookingModal';
import ProtectedRoute from './components/ui/ProtectedRoute';
import RequestDebounceMonitor from './components/ui/RequestDebounceMonitor';

// Admin imports
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBarbershopList from './pages/admin/AdminBarbershopList';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';


const AppContent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  const pageTransition = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15, ease: "easeInOut" }
  };
  const isPublicRoute = location.pathname === '/' ||
    location.pathname === '/showcase' ||
    location.pathname === '/about' ||
    location.pathname === '/services' ||
    location.pathname === '/contacts' ||
    location.pathname === '/login' ||
    location.pathname === '/register-barbershop' ||
    location.pathname === '/verify-email' ||
    location.pathname.startsWith('/admin');

  const isBarbershopHomePage = location.pathname.match(/^\/[a-zA-Z0-9-]+$/) && location.pathname !== '/';

  // Verificar se é rota admin (nunca mostrar navbar)
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#0D121E] text-white">
      {/* Carrega a navbar apenas para rotas públicas (não para landing page, admin, nem páginas isoladas das barbearias) */}
      {isPublicRoute && !isBarbershopHomePage && !isAdminRoute && location.pathname !== '/' && <Navbar />}

      {/* Modal de agendamento */}
      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Monitor de debounce para desenvolvimento */}
      <RequestDebounceMonitor />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          className="w-full"
          initial={pageTransition.initial}
          animate={pageTransition.animate}
          exit={pageTransition.exit}
          transition={pageTransition.transition}
        >
          <Routes location={location}>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/showcase" element={<Home />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contacts" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-email" element={<EmailVerificationPage />} />
            <Route path="/register" element={<MagicLinkPage />} />
            <Route path="/register-barbershop" element={<BarbershopRegistrationPage />} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedAdminRoute />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="barbershops" element={<AdminBarbershopList />} />
            </Route>

            {/* Barbershop isolated home pages - deve vir antes das rotas multi-tenant */}
            <Route path="/:barbershopSlug" element={<BarbershopHomePage />} />

            {/* Multi-tenant routes */}
            <Route path="/app/:barbershopSlug" element={<ProtectedRoute><DashboardPageNew /></ProtectedRoute>} />
            <Route path="/app/:barbershopSlug/dashboard" element={<ProtectedRoute><DashboardPageNew /></ProtectedRoute>} />
            <Route path="/app/:barbershopSlug/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
            <Route path="/app/:barbershopSlug/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/app/:barbershopSlug/trocar-senha" element={<ProtectedRoute><TrocaSenha /></ProtectedRoute>} />
            <Route path="/app/:barbershopSlug/register" element={<ProtectedRoute><RegisterPage /></ProtectedRoute>} />
            <Route path="/app/:barbershopSlug/gerenciar-comentarios" element={<ProtectedRoute><CommentManagementPage /></ProtectedRoute>} />
            <Route path="/app/:barbershopSlug/servicos" element={<ProtectedRoute><ServiceManagementPage /></ProtectedRoute>} />
            <Route path="/app/:barbershopSlug/gerenciar-horarios" element={<ProtectedRoute><ScheduleManagementPage /></ProtectedRoute>} />
            <Route path="/app/:barbershopSlug/upgrade" element={<ProtectedRoute><UpgradePage /></ProtectedRoute>} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Importar configuração de cache
import { CACHE_CONFIG } from './config/cacheConfig';

function App() {
  useEffect(() => {
    // Log de inicialização (apenas em desenvolvimento)
    if (import.meta.env.DEV) {
      console.log('🚀 BarberShop SaaS initialized');
      console.log('Environment:', import.meta.env.MODE);
    }

    // Lógica de limpeza de cache baseada em versão
    const currentVersion = localStorage.getItem('app_cache_version');
    if (currentVersion !== CACHE_CONFIG.VERSION) {
      console.log(`Cache version mismatch (${currentVersion} vs ${CACHE_CONFIG.VERSION}), clearing critical cache...`);

      // Limpar chaves específicas
      CACHE_CONFIG.KEYS_TO_CLEAR.forEach(key => localStorage.removeItem(key));

      // Limpar chaves por prefixo
      Object.keys(localStorage).forEach(key => {
        if (CACHE_CONFIG.PREFIXES_TO_CLEAR.some(prefix => key.startsWith(prefix))) {
          localStorage.removeItem(key);
        }
      });

      // Atualizar versão
      localStorage.setItem('app_cache_version', CACHE_CONFIG.VERSION);

      // Forçar recarregamento apenas se havia uma versão anterior (evita loop infinito na primeira visita)
      if (currentVersion) {
        console.log('Reloading to apply cache changes...');
        window.location.reload();
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <TenantProvider>
        <AppContent />
      </TenantProvider>
    </BrowserRouter>
  );
}

export default App;