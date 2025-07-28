import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/ui/Navbar';
import Home from './pages/Home';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';
import ScheduleManagementPage from './pages/ScheduleManagementPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
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
    transition: { duration: 0.3, ease: "easeInOut" }
  };
  return (
    <div className="min-h-screen bg-[#0D121E] text-white">
      {/* Carrega a navbar imediatamente para melhorar a experiência do usuário */}
      {location.pathname !== '/login' && location.pathname !== '/register' && location.pathname !== '/trocar-senha' && location.pathname !== '/vendapage2' && location.pathname !== '/dashboard' && (
        <Navbar />
      )}
      
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
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/contacts" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
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
          </motion.div>
        </AnimatePresence>
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