import { format } from 'date-fns';
import { adjustToBrasilia } from '../utils/DateTimeUtils';
import { cacheService } from './CacheService';
import { logger } from '../utils/logger';
import ApiService from './ApiService';
import { LogConfig } from '../config/logConfig';

// Interfaces específicas para o AppointmentService
interface LogDetails {
  [key: string]: unknown;
}

interface AppointmentCacheItem {
  id: string;
  date: string;
  time: string;
  barberId: string;
  clientName?: string;
  serviceName?: string;
  barberName?: string;
  price?: number;
  isCancelled?: boolean;
  isRemoved?: boolean;
  wppclient?: string;
}

interface CreateAppointmentResponse {
  success: boolean;
  data: AppointmentCacheItem | null;
  id?: string;
  error?: string;
}

interface ApiError {
  message?: string;
  response?: {
    status?: number;
  };
  status?: number;
}

interface CurrentUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

// Sistema de logs para AppointmentService
class AppointmentLogger {
  static logOperation(operation: string, details: LogDetails) {
    if (!LogConfig.shouldLog()) return;
    
    const timestamp = new Date().toISOString();
    console.group(`📅 [APPOINTMENT SERVICE] ${operation}`);
    console.log('🕐 Timestamp:', timestamp);
    console.log('📋 Details:', details);
    console.groupEnd();
  }

  static logCacheOperation(operation: string, key: string, details?: LogDetails | string) {
    if (!LogConfig.shouldLog()) return;
    
    console.log(`💾 [APPOINTMENT CACHE] ${operation} - Key: ${key}`, details || '');
  }
}


// Constante com horários disponíveis
export const AVAILABLE_TIME_SLOTS = [
  '09:00', '10:00', '11:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00'
];


// Configurações de cache para agendamentos
const getAppointmentsCacheKey = (userId?: string) => {
  // Se temos um userId, usar cache específico do usuário
  if (userId) {
    return `/api/appointments_user_${userId}`;
  }
  // Fallback para cache global (compatibilidade)
  return '/api/appointments';
};
const APPOINTMENTS_CACHE_TTL = 10 * 60 * 1000; // 10 minutos (aumentado para reduzir requisições)

// Variável para controlar requisições em andamento
let appointmentsPromise: Promise<AppointmentCacheItem[]> | null = null;
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 30000; // 30 segundos entre requisições (aumentado para evitar erro 429)

// Controle de falhas para implementar exponential backoff
let consecutiveFailures = 0;
let backoffTimeout = 0;
const MAX_BACKOFF = 5 * 60 * 1000; // 5 minutos máximo de backoff

/**
 * Verifica se um horário está disponível para agendamento
 * Verifica tanto no cache local quanto no cache global
 */
export const isTimeSlotAvailable = async (date: string, time: string, barberId: string, appointments: AppointmentCacheItem[]): Promise<boolean> => {
  // Verificar no cache local primeiro (para feedback imediato)
  const isLocallyAvailable = checkLocalAvailability(date, time, barberId, appointments);
  
  // Se já está ocupado localmente, não precisamos verificar mais
  if (!isLocallyAvailable) return false;
  
  try {
    // Verificar no cache global específico do barbeiro
    const barberCacheKey = `schedule_appointments_${barberId}`;
    const barberCache = cacheService.get<AppointmentCacheItem[]>(barberCacheKey) || [];
    
    const isAvailableInBarberCache = checkLocalAvailability(date, time, barberId, barberCache);
    if (!isAvailableInBarberCache) return false;
    
    // Verificar no cache específico do usuário
    const currentUser: CurrentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = currentUser?.id;
    const userAppointmentsKey = getAppointmentsCacheKey(userId);
    const userAppointments = cacheService.get<AppointmentCacheItem[]>(userAppointmentsKey) || [];
    
    return checkLocalAvailability(date, time, barberId, userAppointments);
  } catch (error) {
    // Em caso de erro na verificação do cache global, confiar apenas no cache local
    logger.apiWarn('Erro ao verificar disponibilidade no cache global:', error);
    return isLocallyAvailable;
  }
};

/**
 * Alias para isTimeSlotAvailable para manter compatibilidade com o código existente
 */
export const checkTimeSlotAvailability = isTimeSlotAvailable;

/**
 * Verifica disponibilidade apenas no cache local fornecido
 */
export const checkLocalAvailability = (date: string, time: string, barberId: string, appointments: AppointmentCacheItem[]): boolean => {
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
export const loadAppointments = async (): Promise<AppointmentCacheItem[]> => {
  const now = Date.now();
  const operationId = `load-${Date.now()}`;
  
  // Obter usuário atual para cache específico
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser?.id;
  const APPOINTMENTS_CACHE_KEY = getAppointmentsCacheKey(userId);
  
  AppointmentLogger.logOperation('LOAD_APPOINTMENTS_START', {
    operationId,
    timestamp: new Date().toISOString(),
    consecutiveFailures,
    backoffTimeout: backoffTimeout > 0 ? new Date(backoffTimeout).toISOString() : null,
    userId: userId || 'anonymous',
    cacheKey: APPOINTMENTS_CACHE_KEY
  });
  
  logger.apiDebug(`Solicitação para carregar agendamentos para usuário ${userId || 'anonymous'}`);
  
  // 1. Verificar se estamos em período de backoff após falhas consecutivas
  if (backoffTimeout > 0 && now < backoffTimeout) {
    const waitTime = Math.ceil((backoffTimeout - now) / 1000);
    logger.apiWarn(`Em período de backoff após falhas consecutivas. Aguardando ${waitTime}s antes de tentar novamente.`);
    
    AppointmentLogger.logOperation('BACKOFF_PERIOD', {
      operationId,
      waitTime: `${waitTime}s`,
      backoffUntil: new Date(backoffTimeout).toISOString()
    });
    
    // Durante backoff, sempre usar cache (mesmo que obsoleto) se disponível
    const cachedData = cacheService.get<AppointmentCacheItem[]>(APPOINTMENTS_CACHE_KEY);
    if (cachedData) {
      logger.apiWarn(`Usando cache durante período de backoff`);
      AppointmentLogger.logCacheOperation('BACKOFF_CACHE_HIT', APPOINTMENTS_CACHE_KEY, `${cachedData.length} appointments`);
      return cachedData;
    }
    AppointmentLogger.logCacheOperation('BACKOFF_CACHE_MISS', APPOINTMENTS_CACHE_KEY);
    return [];
  }
  
  // 2. Verificar se já existe uma requisição em andamento
  if (appointmentsPromise) {
    logger.apiDebug(`Reutilizando requisição de agendamentos em andamento`);
    AppointmentLogger.logOperation('REUSING_PENDING_REQUEST', { operationId });
    return appointmentsPromise;
  }
  
  // 3. Verificar se temos dados em cache válidos
  const cachedData = cacheService.get<AppointmentCacheItem[]>(APPOINTMENTS_CACHE_KEY);
  
  // 4. SEMPRE retornar cache se disponível para evitar "zeramento" dos dados
  // Só fazer nova requisição se não houver cache ou se for explicitamente solicitado
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    logger.apiDebug(`Usando cache de agendamentos (${cachedData.length} items)`);
    AppointmentLogger.logCacheOperation('CACHE_HIT', APPOINTMENTS_CACHE_KEY, `Count: ${cachedData.length}`);
    
    // Atualizar em background apenas se passou tempo suficiente
    if ((now - lastFetchTime) >= MIN_FETCH_INTERVAL) {
      logger.apiDebug(`Atualizando cache em background`);
      setTimeout(() => {
        fetchAppointments()
          .then((newData) => {
            if (newData && Array.isArray(newData) && newData.length > 0) {
              lastFetchTime = Date.now();
              consecutiveFailures = 0;
              // Atualizar cache com novos dados
              cacheService.set(APPOINTMENTS_CACHE_KEY, newData, { ttl: APPOINTMENTS_CACHE_TTL });
            }
          })
          .catch(err => {
            logger.apiError('Erro na atualização em background:', err);
          });
      }, 100); // Pequeno delay para não interferir com a resposta atual
    }
    
    return cachedData;
  }
  
  // 5. Se não há cache válido, fazer requisição
  try {
    appointmentsPromise = fetchAppointments();
    const appointments = await appointmentsPromise;
    
    // Verificar se os dados são válidos antes de retornar
    if (appointments && Array.isArray(appointments)) {
      lastFetchTime = now;
      consecutiveFailures = 0;
      backoffTimeout = 0;
      
      AppointmentLogger.logOperation('LOAD_APPOINTMENTS_SUCCESS', {
        operationId,
        count: appointments.length,
        duration: `${Date.now() - now}ms`,
        source: 'api'
      });
      
      return appointments;
    } else {
      // Se a API retornou dados inválidos, usar cache se disponível
      logger.apiWarn('API retornou dados inválidos, tentando usar cache');
      if (cachedData) {
        return cachedData;
      }
      return [];
    }
  } catch (error) {
    logger.apiError(`Erro ao carregar agendamentos:`, error);
    
    // 6. Implementar exponential backoff em caso de falhas consecutivas
    consecutiveFailures++;
    if (consecutiveFailures > 1) {
      const backoffSeconds = Math.min(Math.pow(2, consecutiveFailures - 1), MAX_BACKOFF / 1000);
      backoffTimeout = now + (backoffSeconds * 1000);
      logger.apiWarn(`Ativando backoff por ${backoffSeconds}s após ${consecutiveFailures} falhas consecutivas`);
    }
    
    AppointmentLogger.logOperation('LOAD_APPOINTMENTS_ERROR', {
      operationId,
      error: error instanceof Error ? error.message : String(error),
      consecutiveFailures,
      nextRetryIn: consecutiveFailures > 1 ? `${Math.min(Math.pow(2, consecutiveFailures - 1), MAX_BACKOFF / 1000)}s` : 'immediate',
      duration: `${Date.now() - now}ms`
    });
    
    // 7. Em caso de erro, SEMPRE usar cache se disponível
    if (cachedData && Array.isArray(cachedData)) {
      logger.apiWarn(`Usando cache após erro (${cachedData.length} items)`);
      AppointmentLogger.logCacheOperation('FALLBACK_CACHE_HIT', APPOINTMENTS_CACHE_KEY, `${cachedData.length} appointments (fallback)`);
      return cachedData;
    }
    
    AppointmentLogger.logCacheOperation('FALLBACK_CACHE_MISS', APPOINTMENTS_CACHE_KEY);
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
async function fetchAppointments(): Promise<AppointmentCacheItem[]> {
  const maxRetries = 3;
  let retryCount = 0;
  let lastError: ApiError | null = null;
  
  // Obter usuário atual para cache específico
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser?.id;
  const APPOINTMENTS_CACHE_KEY = getAppointmentsCacheKey(userId);

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
      const validAppointments = (appointments as AppointmentCacheItem[]).filter((apt) =>
        apt && apt.date && apt.time && !apt.isCancelled
      );
      
      // Armazenar no cache específico do usuário
      cacheService.set(APPOINTMENTS_CACHE_KEY, validAppointments);
      
      // Também manter o cache local para compatibilidade
      localStorage.setItem('appointments', JSON.stringify(validAppointments));
      
      AppointmentLogger.logCacheOperation('CACHE_SET', APPOINTMENTS_CACHE_KEY, { 
        count: validAppointments.length, 
        userId 
      });
      
      // Resetar contadores de falha em caso de sucesso
      if (retryCount > 0) {
        logger.apiInfo(`Recuperado com sucesso após ${retryCount} tentativas`);
      }
      
      return validAppointments as AppointmentCacheItem[];
    } catch (error: unknown) {
      const apiError = error as ApiError;
      lastError = apiError;
      
      // Verificar se é um erro 429 (Too Many Requests)
      const is429Error = apiError?.message?.includes('429') || 
                        apiError?.response?.status === 429 ||
                        apiError?.status === 429;
      
      // Para erro 429, sempre tentar novamente com backoff
      if (is429Error && retryCount < maxRetries) {
        logger.apiWarn(`Erro 429 (Rate Limit) detectado. Tentativa ${retryCount + 1}/${maxRetries}`);
        retryCount++;
        continue;
      }
      
      // Para outros erros, verificar se vale a pena tentar novamente
      const isNetworkError = apiError?.message?.includes('network') || 
                            apiError?.message?.includes('connection') ||
                            apiError?.message?.includes('timeout');
      
      if (isNetworkError && retryCount < maxRetries) {
        logger.apiWarn(`Erro de rede detectado. Tentativa ${retryCount + 1}/${maxRetries}`);
        retryCount++;
        continue;
      }
      
      // Se chegou aqui, não vamos mais tentar
      logger.apiError(`Erro na requisição de agendamentos após ${retryCount} tentativas:`, apiError);
      throw apiError;
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
}): Promise<CreateAppointmentResponse> => {
  try {
    logger.apiInfo('Criando novo agendamento', appointmentData);
    
    // Usar o ApiService otimizado para POST
    const response = await ApiService.post<AppointmentCacheItem>(
      '/api/appointments',
      appointmentData
    );
    
    logger.apiInfo('Resposta da API:', response);
    
    // Normalizar a resposta para garantir formato consistente
    const normalizedResponse = {
      success: true,
      data: response || { id: `temp-${Date.now()}` },
      id: response?.id || `temp-${Date.now()}`
    };
    
    logger.apiInfo('Agendamento criado com sucesso:', normalizedResponse);
    
    // Invalidar caches específicos após criar um novo agendamento
    setTimeout(async () => {
      try {
        // Obter usuário atual para limpar cache específico
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = currentUser?.id;
        
        // Limpar cache específico do usuário
        if (userId) {
          const userCacheKey = getAppointmentsCacheKey(userId);
          cacheService.remove(userCacheKey);
          cacheService.remove(`schedule_appointments_${userId}`);
        }
        
        // Limpar cache global
        cacheService.remove('/api/appointments');
        cacheService.remove('appointments');
        
        // Limpar cache específico do barbeiro
        if (appointmentData.barberId) {
          cacheService.remove(`schedule_appointments_${appointmentData.barberId}`);
        }
        
        // Forçar atualização dos dados
        await fetchAppointments();
        
        // Disparar evento para notificar outros componentes
        window.dispatchEvent(new CustomEvent('cacheUpdated', {
          detail: {
            keys: [
              userId ? getAppointmentsCacheKey(userId) : '/api/appointments',
              `schedule_appointments_${appointmentData.barberId}`,
              '/api/appointments'
            ],
            timestamp: Date.now()
          }
        }));
        
        logger.apiInfo('Cache invalidado após criar agendamento');
      } catch (err) {
        logger.apiError('Erro ao invalidar cache após criar agendamento:', err);
      }
    }, 500);
    
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
}): string => {
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
export const formatDisplayDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'Data não informada';
  
  try {
    // Se já é uma string no formato brasileiro, retornar como está
    if (typeof dateString === 'string' && dateString.includes('/')) {
      return dateString;
    }
    
    // Converter para Date e formatar
    const date = new Date(dateString);
    return adjustToBrasilia(date).toLocaleDateString('pt-BR');
  } catch (error) {
    logger.apiWarn('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};