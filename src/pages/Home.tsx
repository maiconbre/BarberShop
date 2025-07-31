import React, { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import Hero from '../components/feature/Hero';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Componentes com lazy loading
const Services = lazy(() => import('../components/feature/Services'));
const About = lazy(() => import('../components/feature/About'));
const Footer = lazy(() => import('../components/ui/Footer'));
const BookingModal = lazy(() => import('../components/feature/BookingModal'));

// Componente de fallback para seções em carregamento com delay mínimo
const SectionLoadingFallback = () => {
  const [showSpinner, setShowSpinner] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSpinner(true);
    }, 100); // Pequeno delay para evitar flash
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!showSpinner) {
    return (
      <div className="w-full py-16 flex items-center justify-center">
        <div className="w-8 h-8"></div> {/* Placeholder invisível */}
      </div>
    );
  }
  
  return (
    <div className="w-full py-16 flex items-center justify-center">
      <LoadingSpinner size="md" text="Carregando seção..." />
    </div>
  );
};

const Home: React.FC = () => {
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

  const handleHeroBookingClick = () => {
    setSelectedService('');
    setSelectedServices([]);
    setIsBookingModalOpen(true);
  };

  

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }} // Acelerando a animação inicial
      className="flex flex-col min-h-screen bg-[#0D121E]"
    >
      {/* Hero é carregado imediatamente para melhorar a experiência inicial */}
      <Hero setIsModalOpen={handleHeroBookingClick} />

      {/* Componentes não críticos com lazy loading */}
      <Suspense fallback={<SectionLoadingFallback />}>
        <section className="min-h-screen w-full">
          <Services 
            onSchedule={handleOpenBookingModal}
            onScheduleMultiple={handleOpenBookingModalMultiple}
            isShowcase={true}
          />
        </section>

        <section id="about">
          <About />
        </section>
        
        <Footer />
      </Suspense>

      {/* Modal de agendamento com lazy loading */}
      {isBookingModalOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-pulse bg-[#1A1F2E] p-8">
              <div className="w-24 h-6 bg-gray-700 rounded mb-4"></div>
              <div className="w-64 h-32 bg-gray-800 rounded"></div>
            </div>
          </div>
        }>
          <BookingModal 
            isOpen={isBookingModalOpen} 
            onClose={() => setIsBookingModalOpen(false)} 
            initialService={selectedService}
            initialServices={selectedServices}
          />
        </Suspense>
      )}
    </motion.div>
  );
};

export default Home;