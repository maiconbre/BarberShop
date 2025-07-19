import React, { useState, useEffect, useCallback } from 'react';
import ApiService from '../../services/ApiService';
import { logger } from '../../utils/logger';
import { X, MessageCircle, ArrowRight, CheckCircle } from 'lucide-react';
import Calendar from './Calendar';
import { format } from 'date-fns';
import { adjustToBrasilia } from '../../utils/DateTimeUtils';
import { cacheService } from '../../services/CacheService';

// Importando constantes e funções do serviço de agendamentos
import { 
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
  const [cachedAppointments, setCachedAppointments] = useState<any[]>(Array.isArray(preloadedAppointments) ? preloadedAppointments : []);

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

  // Função utilitária para consolidar serviços iniciais
  const consolidateInitialServices = useCallback((apiServices: string[] = []): string[] => {
    const consolidatedServices = [...apiServices];
    
    // Adicionar serviços iniciais se não estiverem na lista da API
    if (initialService && !consolidatedServices.includes(initialService)) {
      consolidatedServices.push(initialService);
    }
    if (initialServices && initialServices.length > 0) {
      initialServices.forEach(service => {
        if (!consolidatedServices.includes(service)) {
          consolidatedServices.push(service);
        }
      });
    }
    
    return consolidatedServices;
  }, [initialService, initialServices]);

  // Buscar serviços da API ao carregar o componente
  React.useEffect(() => {
    const fetchServices = async () => {
      try {
        logger.componentDebug('Carregando serviços no BookingModal');
        const result = await ApiService.getServices();
        
        if (result && Array.isArray(result)) {
          // Armazenar os nomes dos serviços
          const serviceNames = result.map((service: any) => service.name);
          
          // Consolidar serviços usando função utilitária
          const finalServices = consolidateInitialServices(serviceNames);
          setServices(finalServices);

          // Armazenar os preços dos serviços em um objeto para fácil acesso
          const priceMap: { [key: string]: number } = {};
          result.forEach((service: any) => {
            priceMap[service.name] = service.price;
          });
          setServiceData(priceMap);
          logger.componentDebug(`Carregados ${result.length} serviços no BookingModal`);
        }
      } catch (error) {
        logger.componentError('Erro ao buscar serviços:', error);
        // Se a API falhar, usar apenas os serviços iniciais como fallback
        const fallbackServices = consolidateInitialServices();
        if (fallbackServices.length > 0) {
          setServices(fallbackServices);
        }
      }
    };

    fetchServices();
  }, [initialService, initialServices, consolidateInitialServices]);
  // Buscar barbeiros da API ao carregar o componente
  React.useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const result = await ApiService.getBarbers();
        // O método getBarbers já retorna o array de barbeiros diretamente
        setBarbers(result);
      } catch (error) {
        logger.componentError('Erro ao buscar barbeiros:', error);
      }
    };

    fetchBarbers();
  }, []); // Executa apenas uma vez ao montar o componente

  // Efeito para atualizar os horários pré-carregados quando as props mudarem
  useEffect(() => {
    if (preloadedAppointments && Array.isArray(preloadedAppointments) && preloadedAppointments.length > 0) {
      setCachedAppointments(preloadedAppointments);
    }
  }, [preloadedAppointments]);

  // A função isTimeSlotAvailable foi movida para AppointmentService.ts e agora é importada

  // Função para carregar os horários disponíveis usando o serviço importado
  const fetchAppointmentsData = useCallback(async () => {
    // Não recarregar se já temos dados em cache, a menos que seja forçado
    if (cachedAppointments.length > 0) {
      logger.componentDebug('BookingModal: Usando cache local de agendamentos');
      return;
    }

    logger.componentDebug('BookingModal: Buscando agendamentos via AppointmentService');
    try {
      // Usar a função importada do AppointmentService que agora usa cache centralizado
      const validAppointments = await loadAppointments();
      
      logger.componentDebug(`BookingModal: ${validAppointments.length} agendamentos carregados`);
      setCachedAppointments(Array.isArray(validAppointments) ? validAppointments : []);
      
    } catch (err) {
      logger.componentError('BookingModal: Erro ao carregar agendamentos:', err);
      
      // Tentar recuperar do cache local em caso de falha
      const localCache = localStorage.getItem('appointments');
      if (localCache) {
        try {
          const parsedCache = JSON.parse(localCache);
          logger.componentWarn('BookingModal: Usando cache local após falha na API');
          setCachedAppointments(Array.isArray(parsedCache) ? parsedCache : []);
        } catch (parseError) {
          logger.componentError('BookingModal: Erro ao parsear cache local:', parseError);
        }
      }
    }
  }, [cachedAppointments.length]);

  // Função utilitária para filtrar agendamentos por data, hora e barbeiro
  const filterAppointmentsBySlot = useCallback((appointments: any[], targetAppointment: any) => {
    return appointments.filter(app => 
      !(app.date === targetAppointment.date && 
        app.time === targetAppointment.time && 
        app.barberId === targetAppointment.barberId)
    );
  }, []);

  // Efeito consolidado para sincronizar mudanças nos agendamentos e eventos em tempo real
  useEffect(() => {
    if (!isOpen) return;

    // Carregar dados iniciais
    fetchAppointmentsData();
    
    // Listener para atualização via localStorage
    const handleStorageChange = () => {
      const localCache = localStorage.getItem('appointments');
      if (localCache) {
        const parsedCache = JSON.parse(localCache);
        setCachedAppointments(Array.isArray(parsedCache) ? parsedCache : []);
      }
    };

    // Listener para bloqueio de horário
    const handleTimeSlotBlocked = (event: CustomEvent) => {
      const blockedSlot = event.detail;
      setCachedAppointments(prev => Array.isArray(prev) ? [...prev, blockedSlot] : [blockedSlot]);
    };

    // Listener para desbloqueio de horário
    const handleTimeSlotUnblocked = (event: CustomEvent) => {
      const unblocked = event.detail;
      setCachedAppointments(prev => Array.isArray(prev) ? filterAppointmentsBySlot(prev, unblocked) : []);
    };

    // Listener para atualização de agendamento
    const handleAppointmentUpdate = (event: CustomEvent) => {
      const updatedAppointment = event.detail;
      
      setCachedAppointments(prev => {
        if (!Array.isArray(prev)) return [];
        const filtered = filterAppointmentsBySlot(prev, updatedAppointment);
        return updatedAppointment.isRemoved ? filtered : [...filtered, updatedAppointment];
      });
    };

    // Registrar todos os listeners
    const eventListeners = [
      { event: 'storage', handler: handleStorageChange },
      { event: 'timeSlotBlocked', handler: handleTimeSlotBlocked as EventListener },
      { event: 'timeSlotUnblocked', handler: handleTimeSlotUnblocked as EventListener },
      { event: 'appointmentUpdate', handler: handleAppointmentUpdate as EventListener }
    ];

    eventListeners.forEach(({ event, handler }) => {
      window.addEventListener(event, handler);
    });

    // Cleanup: remover todos os listeners
    return () => {
      eventListeners.forEach(({ event, handler }) => {
        window.removeEventListener(event, handler);
      });
    };
  }, [isOpen, fetchAppointmentsData, filterAppointmentsBySlot]);

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
  }, [isOpen]); // Removida dependência cachedAppointments.length para evitar loops

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
      const validations = [
        { field: 'name', value: formData.name, message: 'Por favor, informe seu nome' },
        { field: 'whatsapp', value: formData.whatsapp, message: 'Por favor, informe seu WhatsApp' },
        { field: 'services', value: formData.services, message: 'Por favor, selecione pelo menos um serviço' }
      ];

      for (const validation of validations) {
        if (!validateField(validation.field, validation.value, validation.message)) {
          return;
        }
      }
      
      setError('');
      setStep(2);
      return;
    }

    // Validação para a etapa 2 (barbeiro e data/hora)
    if (step === 2) {
      const validations = [
        { field: 'barber', value: formData.barber, message: 'Por favor, selecione um barbeiro' },
        { field: 'datetime', value: formData.time && formData.date, message: 'Por favor, selecione uma data e horário' }
      ];

      for (const validation of validations) {
        if (!validateField(validation.field, validation.value, validation.message)) {
          return;
        }
      }
      
      setError('');
      setStep(3); // Ir para step 3 (prévia/confirmação)
      return;
    }

    // Validação para a etapa 3 (confirmação final)
    if (step === 3) {
      handleSubmit(e);
    }
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Primeiro, tentar obter os dados mais recentes do cache global
      const cacheKey = `schedule_appointments_${formData.barberId}`;
      
      // Verificar disponibilidade usando dados do cache global e local de forma assíncrona
      const { isTimeSlotAvailable, checkLocalAvailability } = await import('../../services/AppointmentService');
      
      // Verificar disponibilidade no cache local para feedback imediato
      const isStillAvailableInLocalCache = checkLocalAvailability(formData.date, formData.time, formData.barberId, cachedAppointments);
      
      if (!isStillAvailableInLocalCache) {
        throw new Error('Este horário não está mais disponível. Por favor, escolha outro horário.');
      }
      
      // Verificar disponibilidade em todos os caches de forma assíncrona
      const isStillAvailableInAllCaches = await isTimeSlotAvailable(formData.date, formData.time, formData.barberId, cachedAppointments);
      
      // Se o horário não estiver disponível em qualquer um dos caches, impedir o agendamento
      if (!isStillAvailableInAllCaches) {
        throw new Error('Este horário não está mais disponível. Por favor, escolha outro horário.');
      }
      
      // Tentar buscar dados mais recentes da API para garantir disponibilidade
      try {
        const freshAppointments = await loadAppointments();
        const { isTimeSlotAvailable } = await import('../../services/AppointmentService');
        const isStillAvailableInAPI = await isTimeSlotAvailable(formData.date, formData.time, formData.barberId, freshAppointments);
        
        if (!isStillAvailableInAPI) {
          // Atualizar caches com os dados mais recentes
          setCachedAppointments(freshAppointments);
          await cacheService.set(cacheKey, freshAppointments);
          throw new Error('Este horário acabou de ser reservado por outro cliente. Por favor, escolha outro horário.');
        }
      } catch (apiError) {
        // Se não conseguir verificar na API, continuar com os dados do cache
        logger.componentWarn('Não foi possível verificar disponibilidade na API, usando dados em cache:', apiError);
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
        price: calculateTotalPrice()
      };

      // Atualização otimista do cache local
      setCachedAppointments(prev => Array.isArray(prev) ? [...prev, tempAppointment] : [tempAppointment]);
      
      // Atualizar o cache global para garantir que outros componentes vejam a mudança
      // Reutilizando as variáveis já declaradas acima
      const cachedData = await cacheService.get(cacheKey) || [];
      
      // Verificar novamente se o horário já não foi ocupado por outro cliente
      const isStillAvailable = !Array.isArray(cachedData) ? true : !cachedData.some((app: any) =>
        app.date === formData.date && 
        app.time === formData.time && 
        app.barberId === formData.barberId && 
        app.id !== tempAppointment.id && // Ignorar o appointment temporário que acabamos de criar
        !app.isCancelled && 
        !app.isRemoved
      );
      
      if (!isStillAvailable) {
        throw new Error('Este horário acabou de ser reservado por outro cliente. Por favor, escolha outro horário.');
      }
      
await cacheService.set(cacheKey, Array.isArray(cachedData) ? [...cachedData, tempAppointment] : [tempAppointment]);
      
      // Atualizar também o cache global geral de agendamentos
      try {
        const allAppointmentsKey = '/api/appointments';
        const allAppointments = await cacheService.get(allAppointmentsKey) || [];
await cacheService.set(allAppointmentsKey, Array.isArray(allAppointments) ? [...allAppointments, tempAppointment] : [tempAppointment]);
      } catch (cacheErr) {
        logger.componentWarn('Erro ao atualizar cache global de agendamentos:', cacheErr);
      }

      // Disparar evento de bloqueio temporário
      window.dispatchEvent(new CustomEvent('timeSlotBlocked', {
        detail: tempAppointment
      }));
      
      // Atualizar o localStorage para compatibilidade com componentes que usam esse método
      try {
        const localStorageData = localStorage.getItem('appointments');
        const parsedData = localStorageData ? JSON.parse(localStorageData) : [];
        localStorage.setItem('appointments', JSON.stringify([...parsedData, tempAppointment]));
      } catch (err) {
        logger.componentError('Erro ao atualizar localStorage:', err);
      }

      // Usar a função createAppointment importada do AppointmentService
      const appointmentData = {
        clientName: formData.name,
        wppclient: formData.whatsapp,
        serviceName: formData.services.join(', '),
        date: formData.date,
        time: formData.time,
        barberId: formData.barberId,
        barberName: formData.barber,
        price: calculateTotalPrice()
      };
      
      const result = await createAppointment(appointmentData);

      // Verificar se a resposta é válida
      if (!result || (result.success === false)) {
        // Reverter atualização otimista em caso de erro
        setCachedAppointments(prev => Array.isArray(prev) ? prev.filter(app => app.id !== tempAppointment.id) : []);
        
        // Reverter o cache global
        try {
          // Reutilizando o cacheService já importado acima
          
          // Reverter o cache específico do barbeiro
          const barberCacheKey = `schedule_appointments_${formData.barberId}`;
          const barberCachedData = await cacheService.get(barberCacheKey) || [];
await cacheService.set(barberCacheKey, Array.isArray(barberCachedData) ? barberCachedData.filter((app: any) => app.id !== tempAppointment.id) : []);
          
          // Reverter também o cache global geral de agendamentos
          const allAppointmentsKey = '/api/appointments';
          const allAppointments = await cacheService.get(allAppointmentsKey) || [];
          await cacheService.set(allAppointmentsKey, Array.isArray(allAppointments) ? allAppointments.filter((app: any) => app.id !== tempAppointment.id) : []);
          
          // Reverter o localStorage
          const localStorageData = localStorage.getItem('appointments');
          if (localStorageData) {
            const parsedData = JSON.parse(localStorageData);
            localStorage.setItem('appointments', JSON.stringify(parsedData.filter((app: any) => app.id !== tempAppointment.id)));
          }
          
          // Forçar limpeza do cache para garantir que todos os componentes vejam a mudança
          await cacheService.forceCleanup();
        } catch (err) {
          logger.componentError('Erro ao reverter cache:', err);
        }
        
        window.dispatchEvent(new CustomEvent('timeSlotUnblocked', {
          detail: tempAppointment
        }));
        
        throw new Error((result as { error?: string }).error || 'Erro ao criar agendamento');
      }

      // Atualizar o appointment com o ID real
      const confirmedAppointment = {
        ...tempAppointment,
        id: result.data?.id || (result as any).id || tempAppointment.id
      };

      // Atualizar o cache global com o ID real
      try {
        // Reutilizando o cacheService já importado acima
        
        // Atualizar o cache específico do barbeiro
        const barberCacheKey = `schedule_appointments_${formData.barberId}`;
        const barberCachedData = await cacheService.get(barberCacheKey) || [];
        
        // Remover o appointment temporário e adicionar o confirmado
        const updatedBarberCache = (Array.isArray(barberCachedData) ? barberCachedData : [])
          .filter((app: any) => app.id !== tempAppointment.id)
          .concat(confirmedAppointment);
          
        await cacheService.set(barberCacheKey, updatedBarberCache);
        
        // Atualizar também o cache global geral de agendamentos
        const allAppointmentsKey = '/api/appointments';
        const allAppointments = await cacheService.get(allAppointmentsKey) || [];
        const updatedAllAppointments = (Array.isArray(allAppointments) ? allAppointments : [])
          .filter((app: any) => app.id !== tempAppointment.id)
          .concat(confirmedAppointment);
        await cacheService.set(allAppointmentsKey, updatedAllAppointments);
        
        // Atualizar o localStorage
        const localStorageData = localStorage.getItem('appointments');
        if (localStorageData) {
          const parsedData = JSON.parse(localStorageData);
          const updatedLocalStorage = parsedData
            .filter((app: any) => app.id !== tempAppointment.id)
            .concat(confirmedAppointment);
          localStorage.setItem('appointments', JSON.stringify(updatedLocalStorage));
        }
        
        // Forçar limpeza do cache para garantir que todos os componentes vejam a mudança
        await cacheService.forceCleanup();
        
        // Forçar uma atualização dos dados de agendamentos para todos os componentes
        setTimeout(async () => {
          try {
            // Recarregar agendamentos da API para atualizar o cache global
            const { loadAppointments } = await import('../../services/AppointmentService');
            await loadAppointments();
            
            // Disparar evento personalizado para notificar outros componentes sobre a atualização do cache
            window.dispatchEvent(new CustomEvent('cacheUpdated', {
              detail: {
                keys: [barberCacheKey, allAppointmentsKey],
                timestamp: Date.now()
              }
            }));
          } catch (refreshErr) {
            logger.componentWarn('Erro ao recarregar agendamentos após confirmação:', refreshErr);
          }
        }, 500);
      } catch (err) {
        logger.componentError('Erro ao atualizar cache com ID real:', err);
      }

      // Disparar evento de atualização com o ID real
      window.dispatchEvent(new CustomEvent('appointmentUpdate', {
        detail: confirmedAppointment
      }));

      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose();
      }, 2000);

    } catch (err) {
      // Reverter atualização otimista em caso de erro
      // Remove the temporary appointment from cached appointments
      setCachedAppointments(prev => Array.isArray(prev) ? prev.filter(app => !app.id.startsWith('temp-')) : []);
      
      // Reverter o cache global
      try {
        // Reutilizando o cacheService já importado acima
        
        // Reverter o cache específico do barbeiro
        const barberCacheKey = `schedule_appointments_${formData.barberId}`;
        const barberCachedData = await cacheService.get(barberCacheKey) || [];
        await cacheService.set(barberCacheKey, (Array.isArray(barberCachedData) ? barberCachedData : []).filter((app: any) => !app.id.startsWith('temp-')));
        
        // Reverter também o cache global geral de agendamentos
        const allAppointmentsKey = '/api/appointments';
        const allAppointments = await cacheService.get(allAppointmentsKey) || [];
        await cacheService.set(allAppointmentsKey, (Array.isArray(allAppointments) ? allAppointments : []).filter((app: any) => !app.id.startsWith('temp-')));
        
        // Reverter o localStorage
        const localStorageData = localStorage.getItem('appointments');
        if (localStorageData) {
          const parsedData = JSON.parse(localStorageData);
          localStorage.setItem('appointments', JSON.stringify(parsedData.filter((app: any) => !app.id.startsWith('temp-'))));
        }
        
        // Forçar limpeza do cache para garantir que todos os componentes vejam a mudança
        await cacheService.forceCleanup();
      } catch (cacheErr) {
        logger.componentError('Erro ao reverter cache:', cacheErr);
      }
      
      // Disparar evento para desbloquear o horário
      window.dispatchEvent(new CustomEvent('timeSlotUnblocked', {
        detail: {
          date: formData.date,
          time: formData.time,
          barberId: formData.barberId
        }
      }));
      
      // Tratamento mais específico de erros
      logger.componentError('Error saving appointment:', err);
      
      // Tratamento mais específico de erros
      let errorMessage = 'Erro ao salvar agendamento. Por favor, tente novamente.';
      if (err instanceof Error) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Tempo limite excedido. Tente novamente.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Função utilitária para validação de campos obrigatórios
  const validateField = useCallback((_fieldName: string, value: any, errorMessage: string): boolean => {
    if (!value || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && value.length === 0)) {
      setError(errorMessage);
      return false;
    }
    return true;
  }, []);

  // Função utilitária para estilos de botões principais
  const getPrimaryButtonClasses = useCallback(() => {
    return `relative overflow-hidden group w-full bg-[#F0B35B] text-black py-3 rounded-lg 
            font-semibold transition-all duration-300 transform hover:scale-105 
            hover:shadow-[0_0_25px_rgba(240,179,91,0.5)] active:scale-95 
            disabled:opacity-75 disabled:cursor-not-allowed border-2 border-[#F0B35B]/70`;
  }, []);

  // Função utilitária para calcular preço total dos serviços
  const calculateTotalPrice = useCallback(() => {
    return formData.services.reduce((total, service) => total + getServicePrice(service), 0);
  }, [formData.services]);

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
    // Usa a função formatWhatsappMessage importada do AppointmentService
    return formatWhatsappMessage({
      name: formData.name,
      whatsapp: formData.whatsapp,
      barber: formData.barber,
      services: formData.services,
      date: formData.date,
      time: formData.time,
      totalPrice: calculateTotalPrice()
    });
  };

  // Função para copiar o PIX para a área de transferência
  const handleCopyPix = () => {
    const { pix } = getSelectedBarberInfo();
    navigator.clipboard.writeText(pix).then(() => {
      alert("PIX copiado!");
    }).catch(err => {
      logger.componentError("Erro ao copiar PIX:", err);
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
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 transition-all duration-500 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <div className="relative bg-[#1A1F2E] rounded-lg w-[98%] sm:w-[90%] sm:max-w-md max-h-[98vh] sm:max-h-[90vh] overflow-auto shadow-2xl transform transition-all duration-500 ease-out hover:shadow-[#F0B35B]/10">
        <button
          onClick={handleClose} // Usar handleClose ao invés de onClose
          className="absolute top-1 right-1 sm:top-2 sm:right-2 text-gray-400 hover:text-gray-200 transition-colors p-1.5 hover:bg-white/10 rounded-full z-10"
        >
          <X size={16} className="transform hover:rotate-90 transition-transform duration-300" />
        </button>
        <div className="p-3 sm:p-4">
          <div className="text-center mb-3">
            <div className="inline-block">
              <div className="flex items-center justify-center space-x-2 text-[#F0B35B]">
                <div className="h-px w-4 bg-[#F0B35B]"></div>
                <span className="uppercase text-xs font-semibold tracking-wider">
                  {step === 1 ? 'Escolha seu serviço' : step === 2 ? 'Escolha seu barbeiro' : 'Confirme os dados'}
                </span>
                <div className="h-px w-4 bg-[#F0B35B]"></div>
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white text-center mt-2">
              {step === 1 ? 'Transforme seu ' : step === 2 ? 'Agende seu ' : 'Revise seu '}<span className="text-[#F0B35B] relative overflow-hidden"><span className="relative z-10">{step === 1 ? 'Visual' : step === 2 ? 'Horário' : 'Agendamento'}</span></span>
            </h2>
          </div>

          {showSuccessMessage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 rounded-lg">
              <div className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold animate-bounce">
                Agendamento realizado com sucesso!
              </div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-3 relative">
              <div className="group relative">
                <label className="block text-sm font-medium mb-1 text-gray-300 group-hover:text-[#F0B35B] transition-colors">Nome</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-[#0D121E] rounded-lg focus:ring-2 focus:ring-[#F0B35B] outline-none transition-all duration-300 border border-transparent hover:border-[#F0B35B]/30 text-sm placeholder-gray-500"
                    value={formData.name}
                    placeholder="Digite seu nome"
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    onFocus={handleInputFocus}
                  />
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#F0B35B]/70">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
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
                <label className="block text-sm font-medium mb-1 text-gray-300 group-hover:text-[#F0B35B] transition-colors">WhatsApp</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-[#0D121E] rounded-lg focus:ring-2 focus:ring-[#F0B35B] outline-none transition-all duration-300 border border-transparent hover:border-[#F0B35B]/30 text-sm placeholder-gray-500"
                    value={formData.whatsapp}
                    placeholder="(00) 00000-0000"
                    onChange={(e) =>
                      setFormData({ ...formData, whatsapp: e.target.value })
                    }
                    onFocus={handleInputFocus}
                  />
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#F0B35B]/70">
                    <MessageCircle size={18} />
                  </div>
                  <div className="absolute inset-0 rounded-lg pointer-events-none border border-[#F0B35B]/0 group-hover:border-[#F0B35B]/20 transition-colors duration-300"></div>
                </div>
              </div>

              <div className="group relative">
                <label className="block text-sm font-medium mb-1 text-gray-300 group-hover:text-[#F0B35B] transition-colors">Serviços</label>
                <div className="bg-[#0D121E] rounded-lg p-2.5 border border-transparent hover:border-[#F0B35B]/30 transition-all duration-300">
                  <p className="text-xs text-gray-400 mb-1.5">Selecione um ou mais serviços:</p>
                  <div className="max-h-32 overflow-y-auto grid grid-cols-2 gap-2 py-1">
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
                        className={`flex flex-col items-center justify-center p-2 rounded-md cursor-pointer transition-all duration-200 min-h-[60px]
                          ${formData.services.includes(service)
                            ? 'bg-[#F0B35B]/20 border border-[#F0B35B] shadow-sm shadow-[#F0B35B]/20 transform scale-[1.02]'
                            : 'bg-[#1A1F2E] border border-transparent hover:border-[#F0B35B]/30'}`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mb-1 transition-all duration-200 
                          ${formData.services.includes(service) ? 'bg-[#F0B35B]' : 'border-2 border-[#F0B35B]/30'}`}>
                          {formData.services.includes(service) && (
                            <CheckCircle size={12} className="text-black" />
                          )}
                        </div>
                        <span className={`text-xs transition-colors duration-200 text-center leading-tight ${formData.services.includes(service) ? 'text-white font-medium' : 'text-gray-300'}`}>
                          {service}
                        </span>
                        <span className="text-xs font-medium text-[#F0B35B] mt-0.5">
                          R$ {getServicePrice(service).toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                  {formData.services.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-[#F0B35B]/10">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-[#F0B35B] font-medium">Serviços: {formData.services.length}</p>
                        <p className="text-xs text-white font-medium">Total: R$ {calculateTotalPrice().toFixed(2)}</p>
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
                className="relative overflow-hidden group w-full bg-[#F0B35B] text-black py-2.5 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_25px_rgba(240,179,91,0.5)] active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed border-2 border-[#F0B35B]/70"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Próximo Passo <ArrowRight className="ml-2 h-4 w-4" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/40 to-[#F0B35B]/0 -skew-x-45 animate-shine"></div>
              </button>
            </form>
          ) : step === 2 ? (
            <form onSubmit={handleNextStep} className="space-y-3 relative flex flex-col h-full">
              <div className="group relative">
                <label className="block text-sm font-medium mb-1 text-gray-300 group-hover:text-[#F0B35B] transition-colors">Escolha seu barbeiro</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {barbers.length > 0 ? (
                    barbers.map((barber) => (
                      <button
                        key={barber.id}
                        type="button"
                        className={`p-1.5 rounded-lg flex items-center transition-all duration-300 ${formData.barberId === barber.id
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
                        <div className="w-7 h-7 rounded-full bg-[#1A1F2E] flex items-center justify-center mr-2 border-2 border-[#F0B35B]/30">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-[#F0B35B]" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                        </div>
                        <span className="font-medium text-xs">{barber.name}</span>
                        {formData.barberId === barber.id && (
                          <CheckCircle size={12} className="ml-auto text-black" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-2 text-center p-3 bg-[#0D121E] rounded-lg text-gray-400">
                      <p className="text-sm">Nenhum barbeiro disponível para este serviço.</p>
                      <p className="text-xs mt-1">Por favor, escolha outro serviço.</p>
                    </div>
                  )}
                </div>
                {formData.barberId && (
                  <div className="mt-1 text-center">
                    <span className="text-xs text-green-400">Barbeiro selecionado: {formData.barber}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto" style={{maxHeight: "calc(100% - 120px)"}}>
                <Calendar
                  selectedBarber={formData.barber}
                  onTimeSelect={handleTimeSelect}
                  preloadedAppointments={cachedAppointments}
                />
              </div>

              <div className="mt-auto pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative overflow-hidden group w-full bg-[#F0B35B] text-black py-2 rounded-lg 
                          font-semibold transition-all duration-300 transform hover:scale-105 
                          hover:shadow-[0_0_25px_rgba(240,179,91,0.5)] active:scale-95 
                          disabled:opacity-75 disabled:cursor-not-allowed border-2 border-[#F0B35B]/70"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processando...
                      </span>
                    ) : 'Confirmar Agendamento'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/40 to-[#F0B35B]/0 -skew-x-45 animate-shine"></div>
                </button>
              </div>
            </form>
          ) : step === 3 ? (
            <div className="space-y-4">
              <div className="bg-[#0D121E] p-4 rounded-lg border border-[#F0B35B]/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <CheckCircle size={18} className="text-[#F0B35B] mr-2" />
                  Confirme seus dados
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400">Nome:</span>
                    <span className="text-white font-medium">{formData.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400">WhatsApp:</span>
                    <span className="text-white font-medium">{formData.whatsapp}</span>
                  </div>
                  
                  <div className="flex justify-between items-start py-2 border-b border-white/10">
                    <span className="text-gray-400">Serviços:</span>
                    <div className="text-right">
                      <div className="text-white font-medium">{formData.services.join(", ")}</div>
                      <div className="text-[#F0B35B] text-xs mt-1">R$ {calculateTotalPrice().toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400">Barbeiro:</span>
                    <span className="text-white font-medium">{formData.barber}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400">Data:</span>
                    <span className="text-white font-medium">{formData.date ? formatDisplayDate(formData.date) : ''}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400">Horário:</span>
                    <span className="text-white font-medium">{formData.time}</span>
                  </div>
                </div>

                {/* QR Code PIX */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-32 bg-white p-2 rounded-lg flex flex-col items-center justify-center shadow-md">
                      {formData.barber ? (
                        <>
                          <div className="text-xs text-gray-500 mb-1 font-medium">PIX para pagamento</div>
                          <img
                            src={`/qr-codes/${formData.barber.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}.svg`}
                            alt={`QR Code de ${formData.barber}`}
                            className="w-24 h-24 object-contain hover:scale-105 transition-transform duration-200"
                          />
                          <div className="mt-2 flex items-center text-xs">
                            <span className="text-gray-700 font-bold text-xs truncate max-w-[70px]">
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
                    
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-sm text-gray-300 mb-2">Escaneie o QR Code ou use a chave PIX para pagamento</p>
                      <p className="text-lg font-bold text-green-400">Total: R$ {calculateTotalPrice().toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-gray-500"
                  >
                    Voltar
                  </button>
                  
                  <button
                    onClick={handleNextStep}
                    disabled={isLoading}
                    className={`flex-1 ${getPrimaryButtonClasses()}`}
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
                </div>
                
                <a
                   href={`https://wa.me/${getSelectedBarberInfo().whatsapp}?text=${getWhatsappMessage()}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="relative overflow-hidden group w-full flex items-center justify-center gap-2 bg-green-500/20 text-green-400 py-3 px-4 rounded-lg font-medium transition-all duration-300 hover:bg-green-500/30 hover:shadow-lg text-sm border border-green-500/20 hover:border-green-500/40"
                 >
                   <MessageCircle size={16} />
                   <span>Confirmar via WhatsApp</span>
                   <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-white/10 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity -skew-x-45 animate-shine"></div>
                 </a>
              </div>
            </div>

          ) : null}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
