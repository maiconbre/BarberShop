import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Hero from '../components/Hero';
import Services from '../components/Services';
import About from '../components/About';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';

interface HomeProps {
  setIsModalOpen: (open: boolean) => void;
}

const Home: React.FC<HomeProps> = ({ setIsModalOpen }) => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const handleOpenBookingModal = (serviceName: string) => {
    setSelectedService(serviceName);
    setSelectedServices([serviceName]);
    setIsBookingModalOpen(true);
  };

  const handleOpenBookingModalMultiple = (serviceNames: string[]) => {
    setSelectedServices(serviceNames);
    setSelectedService('');
    setIsBookingModalOpen(true);
  };

  useEffect(() => {
    const createCustomObserver = (
      callback: IntersectionObserverCallback,
      options: IntersectionObserverInit = {}
    ): IntersectionObserver | null => {
      if (!window.IntersectionObserver) {
        console.warn('IntersectionObserver não suportado');
        return null;
      }

      return new IntersectionObserver(callback, {
        threshold: 0.2,
        rootMargin: '0px',
        ...options
      });
    };

    // Configurar variáveis CSS para controlar a velocidade das animações globalmente
    document.documentElement.style.setProperty('--animation-speed', '0.5'); // 50% da velocidade original
    
    // Aplicar estilos para acelerar todas as animações
    const style = document.createElement('style');
    style.innerHTML = `
      .transition-all, .duration-1000, .duration-700, .duration-500, .duration-300 {
        transition-duration: 300ms !important;
      }
      
      [class*="animate-"] {
        animation-duration: 0.5s !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // Limpar ao desmontar
      document.head.removeChild(style);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }} // Acelerando a animação inicial
      className="flex flex-col min-h-screen bg-[#0D121E]"
    >
      <Hero setIsModalOpen={setIsModalOpen} />

      {/* Garantindo que o Services seja renderizado com uma altura mínima */}
      <section className="min-h-screen w-full">
        <Services 
          onSchedule={handleOpenBookingModal}
          onScheduleMultiple={handleOpenBookingModalMultiple}
        />
      </section>

      <section id="about">
        <About />
      </section>

      <Footer />

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
        initialService={selectedService}
        initialServices={selectedServices}
      />
    </motion.div>
  );
};

export default Home;