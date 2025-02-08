import React from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import About from '../components/About';
import Footer from '../components/Footer';

interface HomeProps {
  setIsModalOpen: (open: boolean) => void;
}

const Home: React.FC<HomeProps> = ({ setIsModalOpen }) => {
  return (
    <>
      <Hero setIsModalOpen={setIsModalOpen} />

      <div id="services">
        <Services />
      </div>

      <div id="about">
        <About />
      </div>

      <div id="contacts" className="pt-20">
        <Footer />
      </div>
    </>
  );
};

export default Home;