import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TenantProvider } from './contexts/TenantContext';
import Navbar from './components/ui/Navbar';
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
import DashboardPageNew from './pages/DashboardPageNew';
import AgendaPage from './pages/AgendaPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TrocaSenha from './pages/TrocaSenha';
import CommentManagementPage from './pages/CommentManagementPage';
import ServiceManagementPage from './pages/ServiceManagementPage';
import BookingModal from './components/feature/BookingModal';
import ProtectedRoute from './components/ui/ProtectedRoute';
import RequestDebounceMonitor from './components/debug/RequestDebounceMonitor';


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
                       location.pathname === '/about' || 
                       location.pathname === '/services' || 
                       location.pathname === '/contacts' || 
                       location.pathname === '/login' || 
                       location.pathname === '/register-barbershop' ||
                       location.pathname === '/verify-email';

  const isBarbershopHomePage = location.pathname.match(/^\/[a-zA-Z0-9-]+$/) && location.pathname !== '/';

  return (
    <div className="min-h-screen bg-[#0D121E] text-white">
      {/* Carrega a navbar apenas para rotas públicas (não para páginas isoladas das barbearias) */}
      {isPublicRoute && !isBarbershopHomePage && <Navbar />}
      
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
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/contacts" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              <Route path="/register-barbershop" element={<BarbershopRegistrationPage />} />
              
              {/* Barbershop isolated home pages - deve vir antes das rotas multi-tenant */}
              <Route path="/:barbershopSlug" element={<BarbershopHomePage />} />
              
              {/* Legacy routes - redirect to tenant-aware routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPageNew /></ProtectedRoute>} />
              <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
              <Route path="/trocar-senha" element={<ProtectedRoute><TrocaSenha /></ProtectedRoute>} />
              <Route path="/register" element={<ProtectedRoute><RegisterPage /></ProtectedRoute>} />
              <Route path="/gerenciar-comentarios" element={<ProtectedRoute><CommentManagementPage /></ProtectedRoute>} />
              <Route path="/servicos" element={<ProtectedRoute><ServiceManagementPage /></ProtectedRoute>} />
              <Route path="/gerenciar-horarios" element={<ProtectedRoute><ScheduleManagementPage /></ProtectedRoute>} />
              
              {/* Multi-tenant routes */}
              <Route path="/app/:barbershopSlug/dashboard" element={<ProtectedRoute><DashboardPageNew /></ProtectedRoute>} />
              <Route path="/app/:barbershopSlug/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
              <Route path="/app/:barbershopSlug/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
              <Route path="/app/:barbershopSlug/trocar-senha" element={<ProtectedRoute><TrocaSenha /></ProtectedRoute>} />
              <Route path="/app/:barbershopSlug/register" element={<ProtectedRoute><RegisterPage /></ProtectedRoute>} />
              <Route path="/app/:barbershopSlug/gerenciar-comentarios" element={<ProtectedRoute><CommentManagementPage /></ProtectedRoute>} />
              <Route path="/app/:barbershopSlug/servicos" element={<ProtectedRoute><ServiceManagementPage /></ProtectedRoute>} />
              <Route path="/app/:barbershopSlug/gerenciar-horarios" element={<ProtectedRoute><ScheduleManagementPage /></ProtectedRoute>} />
            </Routes>
          </motion.div>
        </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <TenantProvider>
        <AppContent />
      </TenantProvider>
    </BrowserRouter>
  );
}

export default App;