import React, { useState, useEffect, useCallback } from 'react';
import ApiService from '../../services/ApiService';
import { X, MessageCircle, ArrowRight, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import Calendar from './Calendar';
import { format } from 'date-fns';
import { adjustToBrasilia } from '../../utils/DateTimeUtils';

// Importando constantes e funções do serviço de agendamentos
import { 
  isTimeSlotAvailable,
  loadAppointments,
  createAppointment,
  formatWhatsappMessage,
  formatDisplayDate
} from '../../services/AppointmentService';

// Interface para as props do componente
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: string;
  initialServices?: string[];
  preloadedAppointments?: any[];
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, initialService = '', initialServices = [], preloadedAppointments = [] }) => {
  // Estado para controlar as etapas do agendamento (1: nome e serviço, 2: barbeiro e data, 3: confirmação)
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [error, setError] = useState('');

  // Estado para armazenar os dados do formulário (agora com suporte a múltiplos serviços)
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    barber: '',
    barberId: '',
    date: '',
    time: '',
    services: initialService ? [initialService] : [],
  });

  // Estado para armazenar os horários pré-carregados
  const [cachedAppointments, setCachedAppointments] = useState(preloadedAppointments || []);

  // Atualiza os serviços quando o initialService ou initialServices mudar
  useEffect(() => {
    if (initialService) {
      setFormData(prev => ({
        ...prev,
        services: [initialService]
      }));
    } else if (initialServices && initialServices.length > 0) {
      setFormData(prev => ({
        ...prev,
        services: initialServices
      }));
    }
  }, [initialService, initialServices]);

  // Efeito para prevenir zoom em dispositivos móveis quando o teclado é aberto
  useEffect(() => {
    if (isOpen) {
      // Adiciona listeners para eventos de foco em inputs e selects
      document.addEventListener('focus', handleInputFocus, true);

      // Cleanup function
      return () => {
        document.removeEventListener('focus', handleInputFocus, true);
        document.documentElement.style.fontSize = '';
        document.body.style.height = '';
      };
    }
  }, [isOpen]);

  // Estado para armazenar os dados completos dos serviços (incluindo preços)
  const [serviceData, setServiceData] = useState<{ [key: string]: number }>({});

  // Função para obter o preço de um serviço pelo nome
  const getServicePrice = (serviceName: string): number => {
    return serviceData[serviceName] || 0;
  };
  // Estado para armazenar os barbeiros (carregados dinamicamente da API)
  const [barbers, setBarbers] = useState<Array<{ id: string, name: string, whatsapp?: string, pix?: string }>>([]);
  const [services, setServices] = useState<string[]>([]);

  // Buscar serviços da API ao carregar o componente
  React.useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/services`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Armazenar os nomes dos serviços
            const serviceNames = result.data.map((service: any) => service.name);
            setServices(serviceNames);

            // Se houver serviços iniciais, verificar se estão na lista da API
            if (initialService && !serviceNames.includes(initialService)) {
              setServices(prev => [...prev, initialService]);
            }
            if (initialServices && initialServices.length > 0) {
              initialServices.forEach(service => {
                if (!serviceNames.includes(service)) {
                  setServices(prev => [...prev, service]);
                }
              });
            }

            // Armazenar os preços dos serviços em um objeto para fácil acesso
            const priceMap: { [key: string]: number } = {};
            result.data.forEach((service: any) => {
              priceMap[service.name] = service.price;
            });
            setServiceData(priceMap);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar serviços:', error);
        // Se a API falhar, usar os serviços iniciais como fallback
        if (initialService) {
          setServices(prev => [...prev, initialService]);
        }
        if (initialServices && initialServices.length > 0) {
          setServices(prev => [...prev, ...initialServices]);
        }
      }
    };

    fetchServices();
  }, [initialService, initialServices]);
  // Buscar barbeiros da API ao carregar o componente
  React.useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const result = await ApiService.getBarbers();
        // O método getBarbers já retorna o array de barbeiros diretamente
        setBarbers(result);
      } catch (error) {
        console.error('Erro ao buscar barbeiros:', error);
      }
    };

    fetchBarbers();
  }, []); // Executa apenas uma vez ao montar o componente

  // Efeito para atualizar os horários pré-carregados quando as props mudarem
  useEffect(() => {
    if (preloadedAppointments && preloadedAppointments.length > 0) {
      setCachedAppointments(preloadedAppointments);
    }
  }, [preloadedAppointments]);

  // A função isTimeSlotAvailable foi movida para AppointmentService.ts e agora é importada

  // Função para carregar os horários disponíveis usando o serviço importado
  const fetchAppointmentsData = async () => {
    if (cachedAppointments.length > 0) return;

    try {
      // Usar a função importada do AppointmentService
      const validAppointments = await loadAppointments();
      
      setCachedAppointments(validAppointments);
      
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
      
      // Tentar recuperar do cache local em caso de falha
      const localCache = localStorage.getItem('appointments');
      if (localCache) {
        setCachedAppointments(JSON.parse(localCache));
      }
    }
  };

  // Efeito para sincronizar mudanças nos agendamentos
  useEffect(() => {
    if (isOpen) {
      fetchAppointmentsData();
      
      // Listener para atualização em tempo real
      const handleStorageChange = () => {
        const localCache = localStorage.getItem('appointments');
        if (localCache) {
          setCachedAppointments(JSON.parse(localCache));
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Listener para atualizações em tempo real
      const handleTimeSlotBlocked = (event: CustomEvent) => {
        const blockedSlot = event.detail;
        setCachedAppointments(prev => [...prev, blockedSlot]);
      };

      const handleTimeSlotUnblocked = (event: CustomEvent) => {
        const unblocked = event.detail;
        setCachedAppointments(prev => 
          prev.filter(app => 
            !(app.date === unblocked.date && 
              app.time === unblocked.time && 
              app.barberId === unblocked.barberId)
          )
        );
      };

      const handleAppointmentUpdate = (event: CustomEvent) => {
        const updatedAppointment = event.detail;
        
        if (updatedAppointment.isRemoved) {
          setCachedAppointments(prev => 
            prev.filter(app => 
              !(app.date === updatedAppointment.date && 
                app.time === updatedAppointment.time && 
                app.barberId === updatedAppointment.barberId)
            )
          );
        } else {
          setCachedAppointments(prev => {
            const filtered = prev.filter(app => 
              !(app.date === updatedAppointment.date && 
                app.time === updatedAppointment.time && 
                app.barberId === updatedAppointment.barberId)
            );
            return [...filtered, updatedAppointment];
          });
        }
      };

      // Registrar todos os listeners
      window.addEventListener('timeSlotBlocked', handleTimeSlotBlocked as EventListener);
      window.addEventListener('timeSlotUnblocked', handleTimeSlotUnblocked as EventListener);
      window.addEventListener('appointmentUpdate', handleAppointmentUpdate as EventListener);

      // Limpar listeners ao fechar
      return () => {
        window.removeEventListener('timeSlotBlocked', handleTimeSlotBlocked as EventListener);
        window.removeEventListener('timeSlotUnblocked', handleTimeSlotUnblocked as EventListener);
        window.removeEventListener('appointmentUpdate', handleAppointmentUpdate as EventListener);
      };
    }
  }, [isOpen]);

  // Atualizar função handleTimeSelect do Calendar
  const handleTimeSelect = useCallback((date: Date, time: string) => {
    // Formatar a data usando o formato yyyy-MM-dd para armazenamento
    const formattedDate = format(adjustToBrasilia(date), 'yyyy-MM-dd');
    
    if (!formData.barberId) {
      setError('Por favor, selecione um barbeiro primeiro');
      return;
    }

    // Apenas atualiza o estado do formulário, sem fazer nenhuma reserva ainda
    setFormData(prev => ({
      ...prev,
      date: formattedDate,
      time: time
    }));
    setError('');
  }, [formData.barberId]);

  // Efeito para carregar os horários quando o modal for aberto e não houver pré-carregados
  useEffect(() => {
    if (isOpen && cachedAppointments.length === 0) {
      fetchAppointmentsData();
    }
  }, [isOpen, cachedAppointments.length]);

  // Adicionar useEffect para controlar o scroll
  useEffect(() => {
    if (isOpen) {
      // Bloqueia o scroll do body quando o modal abre
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px'; // Compensa a barra de scroll
    } else {
      // Restaura o scroll quando o modal fecha
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }

    // Cleanup quando o componente é desmontado
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [isOpen]);

  // Função para avançar para a próxima etapa
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação para a etapa 1 (nome, whatsapp e serviços)
    if (step === 1) {
      if (!formData.name.trim()) {
        setError('Por favor, informe seu nome');
        return;
      }
      if (!formData.whatsapp.trim()) {
        setError('Por favor, informe seu WhatsApp');
        return;
      }
      if (formData.services.length === 0) {
        setError('Por favor, selecione pelo menos um serviço');
        return;
      }
      setError('');
      setStep(2);
      return;
    }

    // Validação para a etapa 2 (barbeiro e data/hora)
    if (step === 2) {
      if (!formData.barber) {
        setError('Por favor, selecione um barbeiro');
        return;
      }
      if (!formData.time || !formData.date) {
        setError('Por favor, selecione uma data e horário');
        return;
      }
      setError('');
      handleSubmit(e);
    }
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Verificar novamente a disponibilidade antes de confirmar
      const isStillAvailable = isTimeSlotAvailable(formData.date, formData.time, formData.barberId, cachedAppointments);
      if (!isStillAvailable) {
        throw new Error('Este horário não está mais disponível. Por favor, escolha outro horário.');
      }

      // Criar o appointment temporário para atualização otimista
      const tempAppointment = {
        id: `temp-${Date.now()}`,
        clientName: formData.name,
        serviceName: formData.services.join(', '),
        date: formData.date,
        time: formData.time,
        barberId: formData.barberId,
        barberName: formData.barber,
        price: formData.services.reduce((total, service) => total + getServicePrice(service), 0)
      };

      // Atualização otimista do cache
      setCachedAppointments(prev => [...prev, tempAppointment]);

      // Disparar evento de bloqueio temporário
      window.dispatchEvent(new CustomEvent('timeSlotBlocked', {
        detail: tempAppointment
      }));

      // Usar a função createAppointment importada do AppointmentService
      const appointmentData = {
        clientName: formData.name,
        wppclient: formData.whatsapp,
        serviceName: formData.services.join(', '),
        date: formData.date,
        time: formData.time,
        barberId: formData.barberId,
        barberName: formData.barber,
        price: formData.services.reduce((total, service) => total + getServicePrice(service), 0)
      };
      
      const result = await createAppointment(appointmentData);

      if (!result.success) {
        // Reverter atualização otimista em caso de erro
        setCachedAppointments(prev => prev.filter(app => app.id !== tempAppointment.id));
        window.dispatchEvent(new CustomEvent('timeSlotUnblocked', {
          detail: tempAppointment
        }));
        
        throw new Error(result.message || 'Erro ao criar agendamento');
      }

      // Atualizar o appointment com o ID real
      const confirmedAppointment = {
        ...tempAppointment,
        id: result.data.id
      };

      // Disparar evento de atualização com o ID real
      window.dispatchEvent(new CustomEvent('appointmentUpdate', {
        detail: confirmedAppointment
      }));

      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setStep(3);
      }, 1500);

    } catch (err) {
      console.error('Error saving appointment:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar agendamento. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para obter informações do barbeiro selecionado
  const getSelectedBarberInfo = () => {
    const barber = barbers.find(b => b.name === formData.barber);
    return {
      whatsapp: barber?.whatsapp || '',
      pix: barber?.pix || ''
    };
  };

  // Função que monta a mensagem com os dados do agendamento para o WhatsApp usando o serviço importado
  const getWhatsappMessage = () => {
    // Calcula o preço total dos serviços selecionados
    const totalPrice = formData.services.reduce((total, service) => {
      return total + getServicePrice(service);
    }, 0);

    // Usa a função formatWhatsappMessage importada do AppointmentService
    return formatWhatsappMessage({
      name: formData.name,
      whatsapp: formData.whatsapp,
      barber: formData.barber,
      services: formData.services,
      date: formData.date,
      time: formData.time,
      totalPrice: totalPrice
    });
  };

  // Função para copiar o PIX para a área de transferência
  const handleCopyPix = () => {
    const { pix } = getSelectedBarberInfo();
    navigator.clipboard.writeText(pix).then(() => {
      alert("PIX copiado!");
    }).catch(err => {
      console.error("Erro ao copiar PIX:", err);
    });
  };

  // Função para prevenir zoom ao clicar em inputs
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement> | Event) => {
    // Previne o comportamento padrão que pode causar zoom
    e.preventDefault();
    // Ajusta o tamanho da fonte para evitar que o navegador faça zoom
    document.documentElement.style.fontSize = '16px';
    // Ajusta a altura do body para prevenir zoom em dispositivos móveis
    document.body.style.height = window.innerHeight + 'px';
  };

  // Função modificada para fechar o modal
  const handleClose = () => {
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = '0px';
    onClose();
  };

  // Não renderiza nada se o modal estiver fechado
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 md:p-8 transition-all duration-500 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <div className="relative bg-[#1A1F2E] rounded-lg w-[95%] sm:w-[90%] sm:max-w-md max-h-[95vh] sm:max-h-[85vh] overflow-auto shadow-2xl transform transition-all duration-500 ease-out hover:shadow-[#F0B35B]/10">
        <button
          onClick={handleClose} // Usar handleClose ao invés de onClose
          className="absolute top-1 right-1 sm:top-2 sm:right-2 text-gray-400 hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-full"
        >
          <X size={18} className="transform hover:rotate-90 transition-transform duration-300" />
        </button>
        <div className="p-4 ">
          <div className="text-center mb-4">{step !== 3 && (
            <div className="inline-block ">
              <div className="flex items-center justify-center space-x-2 text-[#F0B35B]">
                <div className="h-px w-5 bg-[#F0B35B]"></div>

                <span className="uppercase text-xs font-semibold tracking-wider">{step === 1 ? 'Escolha seu serviço' : 'Escolha seu barbeiro'}</span>
                <div className="h-px w-5 bg-[#F0B35B]"></div>
              </div>
            </div>)}
            {step !== 3 && (
              <h2 className="text-xl sm:text-2xl font-bold text-white text-center">
                {step === 1 ? 'Transforme seu ' : 'Agende seu '}<span className="text-[#F0B35B] relative overflow-hidden "><span className="relative z-10">{step === 1 ? 'Visual' : 'Horário'}</span></span>
              </h2>
            )}
          </div>

          {showSuccessMessage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 rounded-lg">
              <div className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold animate-bounce">
                Agendamento realizado com sucesso!
              </div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4 relative">
              <div className="group relative">
                <label className="block text-sm font-medium mb-1.5 text-gray-300 group-hover:text-[#F0B35B] transition-colors">Nome</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#0D121E] rounded-lg focus:ring-2 focus:ring-[#F0B35B] outline-none transition-all duration-300 border border-transparent hover:border-[#F0B35B]/30 text-sm placeholder-gray-500"
                    value={formData.name}
                    placeholder="Digite seu nome"
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    onFocus={handleInputFocus}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F0B35B]/70">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-lg pointer-events-none border border-[#F0B35B]/0 group-hover:border-[#F0B35B]/20 transition-colors duration-300"></div>
                </div>
              </div>
              
              <div className="group relative">
                <label className="block text-sm font-medium mb-1.5 text-gray-300 group-hover:text-[#F0B35B] transition-colors">WhatsApp</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#0D121E] rounded-lg focus:ring-2 focus:ring-[#F0B35B] outline-none transition-all duration-300 border border-transparent hover:border-[#F0B35B]/30 text-sm placeholder-gray-500"
                    value={formData.whatsapp}
                    placeholder="(00) 00000-0000"
                    onChange={(e) =>
                      setFormData({ ...formData, whatsapp: e.target.value })
                    }
                    onFocus={handleInputFocus}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F0B35B]/70">
                    <MessageCircle size={20} />
                  </div>
                  <div className="absolute inset-0 rounded-lg pointer-events-none border border-[#F0B35B]/0 group-hover:border-[#F0B35B]/20 transition-colors duration-300"></div>
                </div>
              </div>

              <div className="group relative">
                <label className="block text-sm font-medium mb-1.5 text-gray-300 group-hover:text-[#F0B35B] transition-colors">Serviços</label>
                <div className="bg-[#0D121E] rounded-lg p-3 border border-transparent hover:border-[#F0B35B]/30 transition-all duration-300">
                  <p className="text-sm text-gray-400 mb-2">Selecione um ou mais serviços:</p>
                  <div className="max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 py-2 px-2">
                    {services.map((service) => (
                      <button
                        type="button"
                        key={service}
                        onClick={() => {
                          if (formData.services.includes(service)) {
                            setFormData({ ...formData, services: formData.services.filter(s => s !== service) });
                          } else {
                            setFormData({ ...formData, services: [...formData.services, service] });
                          }
                        }}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-md cursor-pointer transition-all duration-200 h-full
                          ${formData.services.includes(service)
                            ? 'bg-[#F0B35B]/20 border border-[#F0B35B] shadow-sm shadow-[#F0B35B]/20 transform scale-[1.02]'
                            : 'bg-[#1A1F2E] border border-transparent hover:border-[#F0B35B]/30'}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 transition-all duration-200 
                          ${formData.services.includes(service) ? 'bg-[#F0B35B]' : 'border-2 border-[#F0B35B]/30'}`}>
                          {formData.services.includes(service) && (
                            <CheckCircle size={14} className="text-black" />
                          )}
                        </div>
                        <span className={`text-sm transition-colors duration-200 text-center ${formData.services.includes(service) ? 'text-white font-medium' : 'text-gray-300'}`}>
                          {service}
                        </span>
                        <span className="text-xs font-medium text-[#F0B35B] mt-1">
                          R$ {getServicePrice(service).toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                  {formData.services.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-[#F0B35B]/10">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-[#F0B35B] font-medium">Serviços: {formData.services.length}</p>
                        <p className="text-sm text-white font-medium">Total: R$ {formData.services.reduce((total, service) => {
                          return total + getServicePrice(service);
                        }, 0).toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                  {formData.services.length === 0 && (
                    <p className="text-xs text-red-400 mt-1">Por favor, selecione pelo menos um serviço</p>
                  )}
                </div>
              </div>





              <button
                type="submit"
                disabled={isLoading}
                className="relative overflow-hidden group
                 w-full bg-[#F0B35B] text-black py-3 rounded-lg
                  font-semibold transition-all duration-300 
                  transform hover:scale-105 
                  hover:shadow-[0_0_25px_rgba(240,179,91,0.5)] 
                  active:scale-95 disabled:opacity-75 
                  disabled:cursor-not-allowed border-2 border-[#F0B35B]/70"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Próximo Passo <ArrowRight className="ml-2 h-4 w-4" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/40 to-[#F0B35B]/0 -skew-x-45 animate-shine"></div>
              </button>
            </form>
          ) : step === 2 ? (
            <form onSubmit={handleNextStep} className="space-y-4 relative">
              <div className="group relative">
                <label className="block text-sm font-medium mb-1.5 text-gray-300 group-hover:text-[#F0B35B] transition-colors">Escolha seu barbeiro</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {barbers.length > 0 ? (
                    barbers.map((barber) => (
                      <button
                        key={barber.id}
                        type="button"
                        className={`p-2 rounded-lg flex items-center transition-all duration-300 ${formData.barberId === barber.id
                          ? 'bg-[#F0B35B] text-black shadow-md scale-[1.02]'
                          : 'bg-[#0D121E] text-white hover:bg-[#0D121E]/80 hover:border-[#F0B35B]/30 border border-transparent hover:border-[#F0B35B]/20'}`}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            barberId: barber.id,
                            barber: barber.name
                          });
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-[#1A1F2E] flex items-center justify-center mr-2 border-2 border-[#F0B35B]/30">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F0B35B]" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                        </div>
                        <span className="font-medium text-sm">{barber.name}</span>
                        {formData.barberId === barber.id && (
                          <CheckCircle size={14} className="ml-auto text-black" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-2 text-center p-4 bg-[#0D121E] rounded-lg text-gray-400">
                      <p>Nenhum barbeiro disponível para este serviço.</p>
                      <p className="text-xs mt-1">Por favor, escolha outro serviço.</p>
                    </div>
                  )}
                </div>
                {formData.barberId && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-green-400">Barbeiro selecionado: {formData.barber}</span>
                  </div>
                )}
              </div>

              <Calendar
                selectedBarber={formData.barber}
                onTimeSelect={handleTimeSelect}
                preloadedAppointments={cachedAppointments}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="relative overflow-hidden group
                 w-full bg-[#F0B35B] text-black py-3 rounded-lg
                  font-semibold transition-all duration-300 
                  transform hover:scale-105 
                  hover:shadow-[0_0_25px_rgba(240,179,91,0.5)] 
                  active:scale-95 disabled:opacity-75 
                  disabled:cursor-not-allowed border-2 border-[#F0B35B]/70"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando...
                    </span>
                  ) : 'Confirmar Agendamento'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/40 to-[#F0B35B]/0 -skew-x-45 animate-shine"></div>
              </button>
            </form>
          ) : step === 3 ? (
            <div className="text-center transform transition-all duration-500 animate-fadeIn pt-0 mt-0 scale-[0.98] sm:scale-100">
              <div className="text-center mb-2 sm:mb-6">
                <div className="inline-block mb-1 sm:mb-2">
                  <div className="flex items-center justify-center space-x-2 text-[#F0B35B]">
                    <div className="h-px w-4 bg-[#F0B35B]"></div>
                    <span className="uppercase text-xs font-semibold tracking-wider">Resumo</span>
                    <div className="h-px w-4 bg-[#F0B35B]"></div>
                  </div>
                </div>
                <h2 className="text-base sm:text-xl font-bold text-white text-center flex items-center justify-center gap-2">
                  <CheckCircle size={18} className="text-green-400" />
                  Agendamento <span className="text-[#F0B35B] relative overflow-hidden"><span className="relative z-10">Confirmado</span></span>
                </h2>
              </div>

              <div className="bg-[#0D121E] p-2 sm:p-5 rounded-lg mb-3 sm:mb-4 shadow-lg border border-[#F0B35B]/10">
                {/* Seção do QR Code e Detalhes */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-6 mb-3 sm:mb-4">
                  {/* QR Code */}
                  <div className="w-32 sm:w-40 bg-white p-2 rounded-lg flex flex-col items-center justify-center shadow-md">
                    {formData.barber ? (
                      <>
                        <div className="text-xs text-gray-500 mb-1 font-medium">PIX para pagamento</div>
                        <img
                          src={`/qr-codes/${formData.barber.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}.svg`}
                          alt={`QR Code de ${formData.barber}`}
                          className="w-24 h-24 sm:w-32 sm:h-32 object-contain hover:scale-105 transition-transform duration-200"
                        />
                        <div className="mt-1 sm:mt-2 flex items-center text-xs">
                          <span className="text-gray-700 font-bold text-xs truncate max-w-[70px] sm:max-w-full">
                            {getSelectedBarberInfo().pix}
                          </span>
                          <button
                            onClick={handleCopyPix}
                            className="ml-1 text-xs bg-green-400 text-black px-2 py-0.5 rounded hover:shadow-md hover:scale-105 transition-all duration-200 font-medium"
                          >
                            Copiar
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-700 text-xs">QR Code não disponível</div>
                    )}
                  </div>

                  {/* Detalhes do Agendamento */}
                  <div className="flex-1 text-left bg-[#1A1F2E] p-2 sm:p-4 rounded-lg border border-[#F0B35B]/5 shadow-inner">
                    <h3 className="text-sm sm:text-lg font-semibold text-white mx-4 sm:mx-6 mb-2 sm:mb-3 flex items-center">
                      Detalhes do Agendamento
                    </h3>
                    <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                      <li className="flex items-center">
                        <span className="text-gray-400 w-16 sm:w-20 flex-shrink-0">Cliente:</span>
                        <span className="ml-1 text-white font-medium">{formData.name}</span>
                      </li>
                      <li className="flex items-center">
                        <span className="text-gray-400 w-16 sm:w-20 flex-shrink-0">Barbeiro:</span>
                        <span className="ml-1 text-white font-medium">{formData.barber}</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-gray-400 w-16 sm:w-20 flex-shrink-0">Serviços:</span>
                        <span className="ml-1 text-white font-medium">
                          {formData.services.join(", ")}
                        </span>
                      </li>
                      <li className="flex items-center">
                        <CalendarIcon size={14} className="text-[#F0B35B] mr-2 flex-shrink-0" />
                        <span className="text-gray-400 w-16 sm:w-20 flex-shrink-0">Data:</span>
                        <span className="ml-1 text-white font-medium bg-[#F0B35B]/10 px-2 py-0.5 rounded">
                          {formData.date ? formatDisplayDate(formData.date) : ''}
                        </span>
                      </li>
                      <li className="flex items-center">
                        <Clock size={14} className="text-[#F0B35B] mr-2 flex-shrink-0" />
                        <span className="text-gray-400 w-16 sm:w-20 flex-shrink-0">Horário:</span>
                        <span className="ml-1 text-white font-medium bg-[#F0B35B]/10 px-2 py-0.5 rounded">{formData.time}</span>
                      </li>
                      <li className="flex items-center mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/10">
                        <span className="text-gray-400 w-16 sm:w-20 flex-shrink-0">Valor Total:</span>
                        <span className="ml-1 text-green-400 font-bold text-base sm:text-lg">
                          R$ {formData.services.reduce((total, service) => {
                            return total + getServicePrice(service);
                          }, 0).toFixed(2)}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-white/10">
                  <a
                    href={`https://wa.me/${getSelectedBarberInfo().whatsapp}?text=${getWhatsappMessage()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative overflow-hidden group flex-1 flex items-center justify-center gap-2 bg-green-500/20 text-green-400 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all duration-300 hover:bg-green-500/30 hover:shadow-lg text-xs sm:text-sm border border-green-500/20 hover:border-green-500/40"
                  >
                    <MessageCircle size={16} />
                    <span>Confirmar via WhatsApp</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-white/10 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity -skew-x-45 animate-shine"></div>
                  </a>

                </div>
              </div>

              <button
                onClick={handleClose}
                className="relative overflow-hidden group w-full bg-[#F0B35B] text-black py-3 rounded-lg font-semibold hover:scale-105 hover:shadow-[0_0_20px_rgba(240,179,91,0.5)] transition-all duration-300 text-sm border-2 border-[#F0B35B]/70 flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                <span className="relative z-10">Concluir</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/40 to-[#F0B35B]/0 -skew-x-45 animate-shine"></div>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
