import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/ui/Navbar';
// Importação direta apenas dos componentes críticos para o carregamento inicial
import Home from './pages/Home';
import ProtectedRoute from './components/ui/ProtectedRoute';

// Componente de fallback para lazy loading
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0D121E]">
    <div className="animate-pulse flex flex-col items-center">
      <div className="w-32 h-32 bg-gradient-to-br from-[#F0B35B]/20 to-transparent rounded-full blur-xl"></div>
      <p className="text-white/70 mt-4">Carregando...</p>
    </div>
  </div>
);

// Lazy loading para componentes não críticos
const BookingModal = lazy(() => import('./components/feature/BookingModal'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ScheduleManagementPage = lazy(() => import('./pages/ScheduleManagementPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TrocaSenha = lazy(() => import('./pages/TrocaSenha'));
const CommentManagementPage = lazy(() => import('./pages/CommentManagementPage'));
const ServiceManagementPage = lazy(() => import('./pages/ServiceManagementPage'));


const AppContent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const pageTransition = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: "easeInOut" }
  };
  return (
    <div className="min-h-screen bg-[#0D121E] text-white">
      {/* Carrega a navbar imediatamente para melhorar a experiência do usuário */}
      {location.pathname !== '/login' && location.pathname !== '/register' && location.pathname !== '/trocar-senha' && location.pathname !== '/vendapage2' && (
        <Navbar 
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      )}
      
      {/* Modal de agendamento com lazy loading */}
      {isModalOpen && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="animate-pulse bg-[#1A1F2E] p-8 rounded-lg">
            <div className="w-24 h-6 bg-gray-700 rounded mb-4"></div>
            <div className="w-64 h-32 bg-gray-800 rounded"></div>
          </div>
        </div>}>
          <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </Suspense>
      )}
      
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          className="w-full"
          initial={pageTransition.initial}
          animate={pageTransition.animate}
          exit={pageTransition.exit}
          transition={pageTransition.transition}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Routes location={location}>
              {/* Rota principal carregada diretamente */}
              <Route path="/" element={<Home setIsModalOpen={setIsModalOpen} />} />
              
              {/* Rotas com lazy loading */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/contacts" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              {/* Rota do calendário removida - funcionalidade migrada para o Dashboard */}
              <Route
                path="/trocar-senha"
                element={
                  <ProtectedRoute>
                    <TrocaSenha />
                    </ProtectedRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <ProtectedRoute>
                    <RegisterPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/gerenciar-comentarios" element={
                <ProtectedRoute>
                  <CommentManagementPage />
                </ProtectedRoute>
              } />
              <Route path="/servicos" element={
                <ProtectedRoute>
                  <ServiceManagementPage />
                </ProtectedRoute>
              } />
              <Route path='/gerenciar-horarios' element={
                <ProtectedRoute>
                  <ScheduleManagementPage />
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;