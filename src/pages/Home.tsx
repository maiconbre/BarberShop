import React, { useState } from 'react';
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

  const handleOpenBookingModal = (serviceName: string) => {
    setSelectedService(serviceName);
    setIsBookingModalOpen(true);
  };

  return (
    <>
      <Hero setIsModalOpen={setIsModalOpen} />

      <div id="services">
        <Services onSchedule={handleOpenBookingModal} />
      </div>

      <div id="about">
        <About />
      </div>

      <div id="contacts" >
        <Footer />
      </div>

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
        initialService={selectedService}
      />
    </>
  );
};

export default Home;