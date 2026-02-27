import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import BarberManagementPage from './pages/BarberManagementPage';
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
  const backgroundImage =
    "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245,166,35,0.08) 0%, transparent 60%), url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

  return (
    <div className="relative min-h-screen bg-[#0f0f0f] text-white">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ backgroundImage }} aria-hidden="true" />
      <div className="relative z-10">
        {isPublicRoute && !isBarbershopHomePage && !isAdminRoute && location.pathname !== '/' && <Navbar />}

        <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

        <RequestDebounceMonitor />

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/showcase" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contacts" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/register" element={<MagicLinkPage />} />
          <Route path="/register-barbershop" element={<BarbershopRegistrationPage />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedAdminRoute />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="barbershops" element={<AdminBarbershopList />} />
          </Route>

          <Route path="/:barbershopSlug" element={<BarbershopHomePage />} />

          <Route path="/app/:barbershopSlug" element={<ProtectedRoute><DashboardPageNew /></ProtectedRoute>} />
          <Route path="/app/:barbershopSlug/dashboard" element={<ProtectedRoute><DashboardPageNew /></ProtectedRoute>} />
          <Route path="/app/:barbershopSlug/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
          <Route path="/app/:barbershopSlug/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/app/:barbershopSlug/trocar-senha" element={<ProtectedRoute><TrocaSenha /></ProtectedRoute>} />
          <Route path="/app/:barbershopSlug/register" element={<ProtectedRoute><RegisterPage /></ProtectedRoute>} />
          <Route path="/app/:barbershopSlug/gerenciar-comentarios" element={<ProtectedRoute><CommentManagementPage /></ProtectedRoute>} />
          <Route path="/app/:barbershopSlug/servicos" element={<ProtectedRoute><ServiceManagementPage /></ProtectedRoute>} />
          <Route path="/app/:barbershopSlug/equipe" element={<ProtectedRoute><BarberManagementPage /></ProtectedRoute>} />
          <Route path="/app/:barbershopSlug/gerenciar-horarios" element={<ProtectedRoute><ScheduleManagementPage /></ProtectedRoute>} />
          <Route path="/app/:barbershopSlug/upgrade" element={<ProtectedRoute><UpgradePage /></ProtectedRoute>} />
        </Routes>
      </div>
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
