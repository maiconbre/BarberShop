//// filepath: /c:/Users/Maicon/Documents/GitHub/BarberGR/src/App.tsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import BookingModal from './components/BookingModal';
import Home from './pages/Home';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import TrocaSenha from './pages/TrocaSenha';
import ProtectedRoute from './components/ProtectedRoute';

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
      {location.pathname !== '/login' && location.pathname !== '/register' && location.pathname !== '/trocar-senha' && (
        <Navbar 
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      )}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          className="w-full"
          style={{ position: 'absolute', width: '100%' }}
          initial={pageTransition.initial}
          animate={pageTransition.animate}
          exit={pageTransition.exit}
          transition={pageTransition.transition}
        >
          <Routes location={location}>
            <Route path="/" element={<Home setIsModalOpen={setIsModalOpen} />} />
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
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
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
          </Routes>
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