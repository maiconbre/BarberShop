import { Scissors } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const services = [
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

interface ServicesProps {
  onSchedule?: (serviceName: string) => void;
  onScheduleMultiple?: (serviceNames: string[]) => void;
}

const Services: React.FC<ServicesProps> = ({ onSchedule, onScheduleMultiple }) => {
  // Estados para visibilidade de cada seção
  const [headerVisible, setHeaderVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState<boolean[]>(services.map(() => false));
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  
  // Referências para cada seção
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>(services.map(() => null));
  
  // Função para verificar se está em dispositivo móvel
  const isMobile = () => window.innerWidth < 640; // sm breakpoint no Tailwind

  // Efeito para detectar quando cada seção entra na viewport
  useEffect(() => {
    // Função para criar um observer para cada elemento
    const createObserver = (ref: React.RefObject<HTMLDivElement>, setVisible: React.Dispatch<React.SetStateAction<boolean>>) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        },
        {
          threshold: 0.1, // Quando pelo menos 10% do componente estiver visível
          rootMargin: '0px'
        }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return observer;
    };
    
    // Criar observer para o cabeçalho
    const headerObserver = createObserver(headerRef, setHeaderVisible);
    
    // Criar observers para cada card
    const cardObservers = cardRefs.current.map((ref, index) => {
      if (ref) {
        return createObserver(
          { current: ref },
          (value) => setCardsVisible(prev => {
            const newState = [...prev];
            newState[index] = typeof value === 'function' ? value(newState[index]) : value;
            return newState;
          })
        );
      }
      return null;
    });

    // Cleanup function
    return () => {
      headerObserver.disconnect();
      cardObservers.forEach(observer => observer?.disconnect());
    };
  }, []);
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
        <div ref={headerRef} className={`text-center mb-12 sm:mb-16 transition-all duration-1000 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#F0B35B] to-[#F0B35B]/80">
            Nossos Serviços
          </h2>
          <p className="text-gray-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto mb-4">
            Escolha entre nossa variedade de serviços profissionais para uma experiência única
          </p>
          
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-sm sm:max-w-none mx-auto">
          {services.map((service, index) => (
            <div
              key={service.name}
              ref={el => cardRefs.current[index] = el}
              className={`bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-1000 hover:-translate-y-2 ${selectedServices.includes(service.name) ? 'ring-2 ring-[#F0B35B]' : ''} ${cardsVisible[index] ? 'opacity-100 translate-y-0 sm:translate-x-0 sm:translate-y-0' : isMobile() ? 
                // Animações diferentes para cada card em mobile
                index % 3 === 0 ? 'opacity-0 -translate-x-20' : 
                index % 3 === 1 ? 'opacity-0 translate-y-20' : 
                'opacity-0 translate-x-20'
                : 'opacity-0 translate-y-20'}`}
              onClick={() => {
                if (multiSelectMode) {
                  setSelectedServices(prev => 
                    prev.includes(service.name) 
                      ? prev.filter(name => name !== service.name)
                      : [...prev, service.name]
                  );
                }
              }}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden group">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
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
                        setSelectedServices(prev => 
                          prev.includes(service.name) 
                            ? prev.filter(name => name !== service.name)
                            : [...prev, service.name]
                        );
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
                        if (onSchedule) {
                          // Passa o nome do serviço diretamente para o BookingModal
                          onSchedule(service.name);
                        }
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