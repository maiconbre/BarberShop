import React, { useState } from 'react';
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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