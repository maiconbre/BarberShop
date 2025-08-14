import { Scissors, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useServices } from '../../hooks/useServices';
import { useTenant } from '../../contexts/TenantContext';
import { logger } from '../../utils/logger';

// Dados estáticos para fallback
const staticServices = [
  {
    name: 'Corte Tradicional',
    price: 'R$ 45,00',
    image: 'https://images.unsplash.com/photo-1635273051839-003bf06a8751?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Corte completo com máquina e acabamento perfeito'
  },
  {
    name: 'Tesoura',
    price: 'R$ 60,00',
    image: 'https://img.freepik.com/fotos-premium/barbeiro-corte-cabelo-masculino-corte-de-cabelo-moderno-com-tesoura_118478-2296.jpg',
    description: 'Corte exclusivo feito com tesoura para um visual personalizado'
  },
  {
    name: 'Navalha',
    price: 'R$ 70,00',
    image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Acabamento preciso com navalha para um visual impecável'
  }
];

interface Service {
  id: string;
  name: string;
  price: number;
}

interface ServicesProps {
  onSchedule?: (serviceName: string) => void;
  onScheduleMultiple?: (serviceNames: string[]) => void;
  isShowcase?: boolean;
}

const Services: React.FC<ServicesProps> = ({ onSchedule, onScheduleMultiple, isShowcase = false }) => {
  // Multi-tenant hooks
  const { services: tenantServices, loadServices, loading: servicesLoading, error: servicesError } = useServices();
  const { isValidTenant } = useTenant();
  
  // Estados para visibilidade de cada seção
  const [headerVisible] = useState(true);
  const [services, setServices] = useState<typeof staticServices>(staticServices);
  const [cardsVisible, setCardsVisible] = useState<boolean[]>(staticServices.map(() => true));
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryDisabled, setRetryDisabled] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  
  // Referências para cada seção
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>(staticServices.map(() => null));
  
  // Função para formatar os serviços para o formato esperado pelo componente
  const formatServices = (services: Service[]) => {
    return services.map((service: Service) => ({
      name: service.name,
      price: `R$ ${service.price.toFixed(2).replace('.', ',')}`,
      image: staticServices.find(s => s.name === service.name)?.image || staticServices[0].image,
      description: staticServices.find(s => s.name === service.name)?.description || 'Serviço profissional'
    }));
  };

  // Carregar serviços usando hook multi-tenant
  useEffect(() => {
    logger.componentDebug(`useEffect iniciado, isShowcase: ${isShowcase}`);
    
    // Se for vitrine, usar apenas os serviços estáticos
    if (isShowcase) {
      logger.componentDebug(`Modo vitrine, usando serviços estáticos`);
      setServices(staticServices);
      setCardsVisible(staticServices.map(() => true));
      cardRefs.current = staticServices.map(() => null);
      return;
    }
    
    // Se não tiver tenant válido, não carregar
    if (!isValidTenant) {
      logger.componentWarn(`Tenant inválido, não carregando serviços`);
      return;
    }
    
    const loadServicesData = async () => {
      try {
        logger.componentDebug(`Carregando serviços usando hook multi-tenant`);
        setIsLoading(true);
        setError('');
        
        await loadServices();
        
      } catch (err: unknown) {
        logger.componentError(`Erro ao carregar serviços:`, err);
        setError('Erro ao carregar serviços. Usando dados estáticos como fallback.');
        // Em caso de erro, usar os serviços estáticos como fallback
        setServices(staticServices);
        setCardsVisible(staticServices.map(() => true));
        cardRefs.current = staticServices.map(() => null);
      } finally {
        if (isMounted) {
          logger.componentDebug(`Finalizando carregamento de serviços`);
          setIsLoading(false);
        }
      }
    };
    
    loadServices();
    
    // Variável para armazenar o intervalo de contagem regressiva
    let countdownInterval: NodeJS.Timeout | null = null;
    
    // Cleanup function para evitar memory leaks
    return () => {
      logger.componentDebug(`Componente desmontado, limpando recursos`);
      isMounted = false;
      
      // Limpar qualquer timeout pendente
      if (retryTimeout) {
        logger.componentDebug(`Limpando timeout de retry pendente`);
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
      
      // Limpar intervalo de contagem regressiva
      if (countdownInterval) {
        logger.componentDebug(`Limpando intervalo de contagem regressiva`);
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    };
  }, [isShowcase, isValidTenant, loadServices]);
  
  // Update services when tenant services change
  useEffect(() => {
    if (tenantServices && tenantServices.length > 0 && !isShowcase) {
      logger.componentDebug(`Atualizando serviços com dados do tenant: ${tenantServices.length} serviços`);
      const formattedServices = formatServices(tenantServices);
      setServices(formattedServices);
      setCardsVisible(formattedServices.map(() => true));
      cardRefs.current = formattedServices.map(() => null);
      setIsLoading(false);
    }
  }, [tenantServices, isShowcase]);
  
  // Handle loading and error states from hook
  useEffect(() => {
    if (!isShowcase) {
      setIsLoading(servicesLoading);
      if (servicesError) {
        setError(servicesError.message);
        // Use static services as fallback
        setServices(staticServices);
        setCardsVisible(staticServices.map(() => true));
        cardRefs.current = staticServices.map(() => null);
      }
    }
  }, [servicesLoading, servicesError, isShowcase]);
  
  // Função para lidar com o clique em um serviço (toggle seleção)
  const handleServiceClick = (serviceName: string) => {
    if (multiSelectMode) {
      setSelectedServices(prev => 
        prev.includes(serviceName) 
          ? prev.filter(name => name !== serviceName)
          : [...prev, serviceName]
      );
    }
  };
  
  // Função para lidar com o clique no botão de agendar
  const handleScheduleClick = (serviceName: string) => {
    if (onSchedule) {
      onSchedule(serviceName);
    }
  };
  
  // Função para verificar se está em dispositivo móvel
  const isMobile = () => window.innerWidth < 640; // sm breakpoint no Tailwind

  // Comentamos o efeito do IntersectionObserver para garantir que os cards sejam sempre visíveis
  // useEffect(() => {
  //   // Função para criar um observer para cada elemento
  //   const createObserver = (ref: React.RefObject<HTMLDivElement>, setVisible: React.Dispatch<React.SetStateAction<boolean>>) => {
  //     const observer = new IntersectionObserver(
  //       ([entry]) => {
  //         if (entry.isIntersecting) {
  //           setVisible(true);
  //           observer.disconnect();
  //         }
  //       },
  //       {
  //         threshold: 0.2, // Quando pelo menos 20% do componente estiver visível
  //         rootMargin: '0px 0px -10% 0px' // Aciona um pouco antes para melhorar a experiência
  //       }
  //     );

  //     if (ref.current) {
  //       observer.observe(ref.current);
  //     }

  //     return observer;
  //   };
    
  //   // Criar observer para o cabeçalho
  //   const headerObserver = createObserver(headerRef, setHeaderVisible);
    
  //   // Criar observers para cada card
  //   const cardObservers = cardRefs.current.map((ref, index) => {
  //     if (ref) {
  //       return createObserver(
  //         { current: ref },
  //         (value) => setCardsVisible(prev => {
  //           const newState = [...prev];
  //           newState[index] = typeof value === 'function' ? value(newState[index]) : value;
  //           return newState;
  //         })
  //       );
  //     }
  //     return null;
  //   });

  //   // Cleanup function
  //   return () => {
  //     headerObserver.disconnect();
  //     cardObservers.forEach(observer => observer?.disconnect());
  //   };
  // }, []);
  // Função para recarregar os serviços manualmente usando hook multi-tenant
  const handleReload = async () => {
    if (!retryDisabled && isValidTenant) {
      logger.componentDebug(`Recarregando serviços manualmente usando hook multi-tenant`);
      setError('');
      setIsLoading(true);
      
      try {
        await loadServices();
      } catch (err) {
        logger.componentError('Erro ao recarregar serviços:', err);
        setError('Erro ao recarregar serviços. Por favor, tente novamente mais tarde.');
        setIsLoading(false);
      }
    }
  };

  return (
    <section ref={sectionRef} className="py-12 px-4 sm:px-6 lg:px-8 bg-[#0D121E] min-h-screen relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#F0B35B]/5 to-transparent rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>

      {/* Padrão de linhas decorativas */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: 'linear-gradient(90deg, #F0B35B 1px, transparent 1px), linear-gradient(180deg, #F0B35B 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div ref={headerRef} className={`text-center sm:mb-16 transition-all duration-300 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#F0B35B] to-[#F0B35B]/80">
            Nossos Serviços
          </h2>
          <p className="text-gray-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto mb-10">
            Escolha entre nossa variedade de serviços profissionais para uma experiência única
          </p>
          
          {/* Mensagem de erro */}
          {error && (
            <div className="mt-4 text-center">
              <p className="text-sm text-red-400">{error}</p>
              {!isShowcase && (
                <button 
                  onClick={handleReload}
                  disabled={retryDisabled}
                  className="mt-2 px-4 py-2 text-sm font-medium rounded-md bg-[#1A1F2E] text-white border border-[#F0B35B]/30 hover:border-[#F0B35B] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {retryDisabled 
                    ? `Recarregar (${retryCountdown}s)` 
                    : 'Recarregar'}
                </button>
              )}
            </div>
          )}
          
          {/* Indicador de carregamento */}
          {isLoading && (
            <div className="mt-4 flex justify-center">
              <RefreshCw className="animate-spin h-5 w-5 text-[#F0B35B]" />
            </div>
          )}
        </div>

        {/* Botão para alternar modo de seleção múltipla - apenas visível quando não for vitrine */}
        {!isShowcase && (
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setMultiSelectMode(prev => !prev)}
              className="relative overflow-hidden group bg-[#1A1F2E] text-white px-6 py-2.5 rounded-lg transition-all duration-300 font-semibold text-sm sm:text-base border border-[#F0B35B]/30 hover:border-[#F0B35B] focus:outline-none focus:ring-2 focus:ring-[#F0B35B]/50 hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">{multiSelectMode ? 'Cancelar Seleção' : 'Selecionar Múltiplos'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-45 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700"></div>
            </button>
          </div>
        )}
        
        {/* Botão para agendar múltiplos serviços */}
        {multiSelectMode && selectedServices.length > 0 && (
          <div className="flex justify-center mb-8">
            <button
              onClick={() => {
                if (onScheduleMultiple) {
                  onScheduleMultiple(selectedServices);
                  setMultiSelectMode(false);
                  setSelectedServices([]);
                }
              }}
              className="relative overflow-hidden group bg-[#F0B35B] text-black px-6 py-2.5 rounded-lg transition-all duration-300 font-semibold text-sm sm:text-base hover:shadow-[0_0_20px_rgba(240,179,91,0.4)] focus:outline-none focus:ring-2 focus:ring-[#F0B35B]/50 hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">Agendar {selectedServices.length} {selectedServices.length === 1 ? 'Serviço' : 'Serviços'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -skew-x-45 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700"></div>
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-sm sm:max-w-none mx-auto">
          {services.map((service, index) => (
            <div
              key={service.name}
              ref={el => cardRefs.current[index] = el}
              className={`bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${selectedServices.includes(service.name) ? 'ring-2 ring-[#F0B35B]' : ''} ${cardsVisible[index] ? 'opacity-100 translate-y-0 sm:translate-x-0 sm:translate-y-0' : isMobile() ? 
                // Animações diferentes para cada card em mobile
                index % 3 === 0 ? 'opacity-0 -translate-x-20' : 
                index % 3 === 1 ? 'opacity-0 translate-y-20' : 
                'opacity-0 translate-x-20'
                : 'opacity-0 translate-y-20'}`}
              onClick={() => handleServiceClick(service.name)}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden group">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                    {service.name}
                  </h3>
                  <div className="transform transition-transform duration-300 hover:rotate-180">
                    <Scissors className="text-[#F0B35B] w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                </div>

                <p className="text-gray-300 text-sm sm:text-base mb-6">{service.description}</p>

                <div className="flex justify-between items-center">
                  <span className="text-[#F0B35B] font-bold text-xl sm:text-2xl">{service.price}</span>
                  {multiSelectMode ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceClick(service.name);
                      }}
                      className={`relative overflow-hidden group px-6 py-2.5 rounded-lg transition-all duration-300 font-semibold text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#F0B35B]/50 hover:scale-105 active:scale-95 ${selectedServices.includes(service.name) ? 'bg-[#F0B35B] text-black' : 'bg-[#1A1F2E] text-white border border-[#F0B35B]/30'}`}
                    >
                      <span className="relative z-10">{selectedServices.includes(service.name) ? 'Selecionado' : 'Selecionar'}</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -skew-x-45 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700"></div>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScheduleClick(service.name);
                      }}
                      className="relative overflow-hidden group bg-[#F0B35B] text-black px-6 py-2.5 rounded-lg transition-all duration-300 font-semibold text-sm sm:text-base hover:shadow-[0_0_20px_rgba(240,179,91,0.4)] focus:outline-none focus:ring-2 focus:ring-[#F0B35B]/50 hover:scale-105 active:scale-95"
                    >
                      <span className="relative z-10">Agendar</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -skew-x-45 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700"></div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;