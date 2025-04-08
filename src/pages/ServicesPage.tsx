import { motion } from 'framer-motion';
import Services from '../components/Services';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import BookingModal from '../components/BookingModal';
import { useState } from 'react';

const ServicesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  const handleOpenModal = (serviceName: string) => {
    setSelectedService(serviceName);
    setSelectedServices([serviceName]);
    setIsModalOpen(true);
  };

  const handleOpenModalMultiple = (serviceNames: string[]) => {
    setSelectedServices(serviceNames);
    setSelectedService('');
    setIsModalOpen(true);
  };

  return (
    <>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-[#0D121E] flex flex-col"
      >
        <Navbar 
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          isMobileMenuOpen={false}
          setIsMobileMenuOpen={() => {}}
        />
        <main className="flex-grow">
          <Services onSchedule={handleOpenModal} onScheduleMultiple={handleOpenModalMultiple} />
        </main>
        <Footer />
        <BookingModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          initialService={selectedService}
          initialServices={selectedServices}
        />
      </motion.div>
    </>
  );
};

export default ServicesPage;