import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import Services from '../components/Services';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

const ServicesPage = () => {
  return (
    <>
      <Helmet>
        <title>Nossos Serviços | BarberShop - Barbearia de Excelência</title>
        <meta name="description" content="Conheça nossa variedade de serviços profissionais de barbearia. Cortes modernos, barba e tratamentos capilares com os melhores profissionais." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-[#0D121E] flex flex-col"
      >
        <Navbar 
          isModalOpen={false}
          setIsModalOpen={() => {}}
          isMobileMenuOpen={false}
          setIsMobileMenuOpen={() => {}}
        />
        <main className="flex-grow">
          <Services />
        </main>
        <Footer />
      </motion.div>
    </>
  );
};

export default ServicesPage;