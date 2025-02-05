import React, { useState } from 'react';
import { Calendar, Clock, Menu, X } from 'lucide-react';
import Navbar from './components/Navbar';
import BookingModal from './components/BookingModal';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Footer from './components/Footer';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0D121E] text-white">
      <Navbar 
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <Hero setIsModalOpen={setIsModalOpen} />
      <Services />
      <About />
      <Footer />
      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default App