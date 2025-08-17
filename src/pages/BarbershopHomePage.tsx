import React, { useState, lazy, Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTenant } from '../contexts/TenantContext';
import { useParams } from 'react-router-dom';
import BarbershopHero from '../components/feature/BarbershopHero';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import BarbershopNavbar from '../components/ui/BarbershopNavbar';
import ServicesDebug from '../components/debug/ServicesDebug';
import ApiTest from '../components/debug/ApiTest';


// Componentes com lazy loading
const Services = lazy(() => import('../components/feature/Services'));
const Barbers = lazy(() => import('../components/feature/Barbers'));
const About = lazy(() => import('../components/feature/About'));
const BarbershopFooter = lazy(() => import('../components/ui/BarbershopFooter'));
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

const BarbershopHomePage: React.FC = () => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  const { barbershopSlug } = useParams<{ barbershopSlug: string }>();
  const tenantContext = useTenant();
  const { loading, error, barbershopData } = tenantContext;

  // Debug: Verificar se o contexto está sendo carregado corretamente
  console.log('BarbershopHomePage - Contexto completo:', tenantContext);

  // Debug: Log do estado do tenant
  useEffect(() => {
    console.log('BarbershopHomePage - Debug:', {
      barbershopSlug,
      loading,
      error: error?.message,
      barbershopData: barbershopData ? {
        id: barbershopData.id,
        name: barbershopData.name,
        slug: barbershopData.slug
      } : null
    });
  }, [barbershopSlug, loading, error, barbershopData]);

  // Verificação adicional para garantir que barbershopData existe antes de usar
  useEffect(() => {
    if (barbershopData) {
      console.log('BarbershopHomePage - barbershopData carregado:', barbershopData.name);
    }
  }, [barbershopData]);

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

  // Mostrar loading enquanto carrega os dados do tenant
  if (loading || !barbershopData) {
    return (
      <div className="min-h-screen bg-[#0D121E] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando barbearia..." />
      </div>
    );
  }

  // Mostrar erro se não conseguir carregar o tenant
  if (error) {
    console.error('BarbershopHomePage - Erro ao carregar tenant:', error);
    return (
      <div className="min-h-screen bg-[#0D121E] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Barbearia não encontrada</h1>
          <p className="text-gray-400 mb-6">
            A barbearia "{barbershopSlug}" não foi encontrada ou não está disponível.
          </p>
          {error.message && (
            <p className="text-red-400 text-sm mb-4">
              Erro: {error.message}
            </p>
          )}
          <a 
            href="/" 
            className="inline-block bg-[#F0B35B] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#E6A555] transition-colors"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  // Removido redirecionamento automático para permitir acesso direto

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col min-h-screen bg-[#0D121E]"
    >
      {/* Debug components - temporary */}
      <ServicesDebug />
      <ApiTest />
      
      {/* Navbar específica da barbearia */}
      <BarbershopNavbar onBookingClick={handleHeroBookingClick} />
      
      {/* Hero personalizado para a barbearia */}
      <section id="hero">
        <BarbershopHero setIsModalOpen={handleHeroBookingClick} />
      </section>

      {/* Componentes não críticos com lazy loading */}
      <Suspense fallback={<SectionLoadingFallback />}>
        <section id="services" className="min-h-screen w-full">
          <Services 
            onSchedule={handleOpenBookingModal}
            onScheduleMultiple={handleOpenBookingModalMultiple}
            isShowcase={true}
          />
        </section>

        <section id="barbers">
          <Barbers isShowcase={true} />
        </section>

        <section id="about">
          <About />
        </section>
        
        <BarbershopFooter />
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

      {/* Informações da barbearia no título da página */}
      {barbershopData && barbershopData.name && (
        <React.Fragment>
          {/* Atualizar o título da página dinamicamente */}
          {typeof document !== 'undefined' && (
            <React.Fragment>
              {(() => {
                try {
                  document.title = `${barbershopData.name} - Barbearia`;
                  console.log('Título da página atualizado para:', document.title);
                } catch (err) {
                  console.error('Erro ao atualizar título da página:', err);
                }
                return null;
              })()}
            </React.Fragment>
          )}
        </React.Fragment>
      )}
    </motion.div>
  );
};

export default BarbershopHomePage;