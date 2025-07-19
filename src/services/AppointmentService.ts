import { format } from 'date-fns';
import { adjustToBrasilia } from '../utils/DateTimeUtils';
import { cacheService } from './CacheService';
import { logger } from '../utils/logger';
import ApiService from './ApiService';

// Constante com horários disponíveis
export const AVAILABLE_TIME_SLOTS = [
  '09:00', '10:00', '11:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00'
];

// Configurações de cache para agendamentos
const APPOINTMENTS_CACHE_KEY = '/api/appointments';
const APPOINTMENTS_CACHE_TTL = 10 * 60 * 1000; // 10 minutos (aumentado para reduzir requisições)
const APPOINTMENTS_STALE_TTL = 60 * 60 * 1000; // 60 minutos (dados obsoletos - aumentado)

// Variável para controlar requisições em andamento
let appointmentsPromise: Promise<any[]> | null = null;
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 30000; // 30 segundos entre requisições (aumentado para evitar erro 429)

// Controle de falhas para implementar exponential backoff
let consecutiveFailures = 0;
let backoffTimeout = 0;
const MAX_BACKOFF = 5 * 60 * 1000; // 5 minutos máximo de backoff

/**
 * Verifica se um horário está disponível para agendamento
 */
export const isTimeSlotAvailable = (date: string, time: string, barberId: string, appointments: any[]): boolean => {
  if (!appointments || !Array.isArray(appointments)) return true;
  
  return !appointments.some(appointment => 
    appointment.date === date && 
    appointment.time === time && 
    appointment.barberId === barberId &&
    !appointment.isCancelled && 
    !appointment.isRemoved
  );
};

/**
 * Carrega os agendamentos da API com sistema de cache centralizado
 * - Usa cache em memória para requisições frequentes
 * - Implementa deduplicação de requisições
 * - Usa cache obsoleto em caso de falha
 * - Limita a frequência de requisições
 * - Implementa exponential backoff para evitar erro 429
 */
export const loadAppointments = async (): Promise<any[]> => {
  const now = Date.now();
  logger.apiDebug(`Solicitação para carregar agendamentos`);
  
  // 1. Verificar se estamos em período de backoff após falhas consecutivas
  if (backoffTimeout > 0 && now < backoffTimeout) {
    const waitTime = Math.ceil((backoffTimeout - now) / 1000);
    logger.apiWarn(`Em período de backoff após falhas consecutivas. Aguardando ${waitTime}s antes de tentar novamente.`);
    
    // Durante backoff, sempre usar cache (mesmo que obsoleto) se disponível
    const cachedData = await cacheService.get<any[]>(APPOINTMENTS_CACHE_KEY);
    if (cachedData) {
      logger.apiWarn(`Usando cache durante período de backoff`);
      return cachedData;
    }
    return [];
  }
  
  // 2. Verificar se já existe uma requisição em andamento
  if (appointmentsPromise) {
    logger.apiDebug(`Reutilizando requisição de agendamentos em andamento`);
    return appointmentsPromise;
  }
  
  // 3. Verificar se temos dados em cache válidos
  const cachedData = await cacheService.get<any[]>(APPOINTMENTS_CACHE_KEY);
  const cacheTimestamp = await cacheService.getTimestamp(APPOINTMENTS_CACHE_KEY);
  const cacheAge = cacheTimestamp ? now - cacheTimestamp : Infinity;
  
  // 4. Se temos cache válido e não passou muito tempo desde a última requisição, retornar cache
  if (cachedData) {
    // Cache válido e dentro do intervalo mínimo entre requisições
    if (cacheAge < APPOINTMENTS_CACHE_TTL && (now - lastFetchTime) < MIN_FETCH_INTERVAL) {
      logger.apiDebug(`Usando cache de agendamentos (${Math.round(cacheAge/1000)}s)`);
      return cachedData;
    }
    
    // Cache próximo de expirar mas ainda dentro do intervalo mínimo - atualizar em background
    if (cacheAge < APPOINTMENTS_CACHE_TTL && (now - lastFetchTime) >= MIN_FETCH_INTERVAL) {
      logger.apiDebug(`Usando cache e atualizando em background (${Math.round(cacheAge/1000)}s)`);
      // Atualizar em background sem aguardar
      setTimeout(() => {
        fetchAppointments()
          .then(() => {
            lastFetchTime = Date.now();
            consecutiveFailures = 0; // Resetar falhas em caso de sucesso
          })
          .catch(err => {
            logger.apiError('Erro na atualização em background:', err);
          });
      }, 0);
      return cachedData;
    }
  }
  
  // 5. Iniciar nova requisição (com deduplicação)
  try {
    appointmentsPromise = fetchAppointments();
    const appointments = await appointmentsPromise;
    lastFetchTime = now;
    consecutiveFailures = 0; // Resetar contador de falhas em caso de sucesso
    backoffTimeout = 0; // Limpar backoff
    return appointments;
  } catch (error) {
    logger.apiError(`Erro ao carregar agendamentos:`, error);
    
    // 6. Implementar exponential backoff em caso de falhas consecutivas
    consecutiveFailures++;
    if (consecutiveFailures > 1) {
      // Calcular tempo de backoff: 2^n segundos (com limite máximo)
      const backoffSeconds = Math.min(Math.pow(2, consecutiveFailures - 1), MAX_BACKOFF / 1000);
      backoffTimeout = now + (backoffSeconds * 1000);
      logger.apiWarn(`Ativando backoff por ${backoffSeconds}s após ${consecutiveFailures} falhas consecutivas`);
    }
    
    // 7. Em caso de erro, tentar usar cache mesmo que obsoleto
    if (cachedData) {
      logger.apiWarn(`Usando cache obsoleto após erro (${Math.round(cacheAge/1000)}s)`);
      return cachedData;
    }
    
    // 8. Se não tiver cache, retornar array vazio
    return [];
  } finally {
    // 9. Limpar a promessa para permitir novas requisições
    appointmentsPromise = null;
  }
};

/**
 * Função interna para buscar agendamentos da API
 * Implementa retry com backoff para lidar com erros 429
 */
async function fetchAppointments(): Promise<any[]> {
  const maxRetries = 3;
  let retryCount = 0;
  let lastError: any = null;

  while (retryCount <= maxRetries) {
    try {
      // Se não é a primeira tentativa, aguardar com backoff exponencial
      if (retryCount > 0) {
        const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
        logger.apiWarn(`Tentativa ${retryCount}/${maxRetries} após ${backoffMs}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }

      // Usar o ApiService para aproveitar seu sistema de cache e retry
      const appointments = await ApiService.getAppointments();
      
      // Filtrar apenas agendamentos válidos e não cancelados
      const validAppointments = appointments.filter((apt: any) => 
        apt && apt.date && apt.time && !apt.isCancelled
      );
      
      
      // Também manter o cache local para compatibilidade
      localStorage.setItem('appointments', JSON.stringify(validAppointments));
      
      // Resetar contadores de falha em caso de sucesso
      if (retryCount > 0) {
        logger.apiInfo(`Recuperado com sucesso após ${retryCount} tentativas`);
      }
      
      return validAppointments;
    } catch (error: any) {
      lastError = error;
      
      // Verificar se é um erro 429 (Too Many Requests)
      const is429Error = error?.message?.includes('429') || 
                        error?.response?.status === 429 ||
                        error?.status === 429;
      
      // Para erro 429, sempre tentar novamente com backoff
      if (is429Error && retryCount < maxRetries) {
        logger.apiWarn(`Erro 429 (Rate Limit) detectado. Tentativa ${retryCount + 1}/${maxRetries}`);
        retryCount++;
        continue;
      }
      
      // Para outros erros, verificar se vale a pena tentar novamente
      const isNetworkError = error?.message?.includes('network') || 
                            error?.message?.includes('connection') ||
                            error?.message?.includes('timeout');
      
      if (isNetworkError && retryCount < maxRetries) {
        logger.apiWarn(`Erro de rede detectado. Tentativa ${retryCount + 1}/${maxRetries}`);
        retryCount++;
        continue;
      }
      
      // Se chegou aqui, não vamos mais tentar
      logger.apiError(`Erro na requisição de agendamentos após ${retryCount} tentativas:`, error);
      throw error;
    }
  }
  
  // Se todas as tentativas falharam
  throw lastError;
}

/**
 * Cria um novo agendamento
 * Usa o ApiService otimizado para resolver problemas de CORS
 */
export const createAppointment = async (appointmentData: {
  clientName: string;
  wppclient: string;
  serviceName: string;
  date: string;
  time: string;
  barberId: string;
  barberName: string;
  price: number;
}) => {
  try {
    logger.apiInfo('Criando novo agendamento', appointmentData);
    
    // Usar o ApiService otimizado para POST
    const response = await ApiService.post<any>(
      '/api/appointments',
      appointmentData
    );
    
    logger.apiInfo('Resposta da API:', response);
    
    // Normalizar a resposta para garantir formato consistente
    const normalizedResponse = {
      success: true,
      data: response?.data || response || { id: `temp-${Date.now()}` },
      id: response?.id || response?.data?.id || `temp-${Date.now()}`
    };
    
    logger.apiInfo('Agendamento criado com sucesso:', normalizedResponse);
    
    // Atualizar o cache de agendamentos após criar um novo
    setTimeout(() => {
      fetchAppointments().catch(err => {
        logger.apiError('Erro ao atualizar cache após criar agendamento:', err);
      });
    }, 1000);
    
    return normalizedResponse;
  } catch (error) {
    logger.apiError('Erro ao criar agendamento:', error);
    
    // Retornar erro estruturado
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: null
    };
  }
};

/**
 * Formata a mensagem para o WhatsApp
 */
export const formatWhatsappMessage = (data: {
  name: string;
  whatsapp: string;
  barber: string;
  services: string[];
  date: string;
  time: string;
  totalPrice: number;
}) => {
  const formattedDate = data.date
    ? format(new Date(data.date), 'dd/MM/yyyy')
    : format(new Date(), 'dd/MM/yyyy');

  const message = `Olá, segue meu agendamento:
Nome: ${data.name}
WhatsApp: ${data.whatsapp}
Barbeiro: ${data.barber}
Serviços: ${data.services.join(', ')}
Valor: R$ ${data.totalPrice.toFixed(2)}
Data: ${formattedDate}
Horário: ${data.time}
  
Aguardo a confirmação.`;
  
  return encodeURIComponent(message);
};

/**
 * Formata a data para exibição
 */
export const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return '';
  return format(adjustToBrasilia(new Date(new Date(dateString).setDate(new Date(dateString).getDate() + 1))), 'dd/MM/yyyy');
};