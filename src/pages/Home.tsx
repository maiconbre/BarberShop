import React, { useState, useCallback } from 'react';
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
  const [preloadedAppointments, setPreloadedAppointments] = useState([]);
  
  // Função para pré-carregar os horários disponíveis
  const preloadAppointments = useCallback(async () => {
    try {
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/appointments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': localStorage.getItem('token') ? 'Bearer ' + localStorage.getItem('token') : ''
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();
      if (!jsonData.success) {
        throw new Error('Erro na resposta da API');
      }
      setPreloadedAppointments(jsonData.data);
    } catch (err) {
      console.error('Erro ao pré-carregar agendamentos:', err);
    }
  }, []);

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
        preloadedAppointments={preloadedAppointments}
      />
    </>
  );
};

export default Home;