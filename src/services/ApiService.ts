import { cacheService } from './CacheService';
import { logger } from '../utils/logger';
import { getAdaptiveConfig, DATA_TYPE_CONFIG } from '../config/apiConfig';

/**
 * ApiService otimizado com cache inteligente e redução de chamadas desnecessárias
 * Resolve problemas de CORS e implementa cache eficiente
 */
class ApiService {
  private static instance: ApiService;
  private readonly config = getAdaptiveConfig();
  private baseUrl: string;
  private isOnline: boolean = navigator.onLine;
  
  // Cache inteligente em memória para evitar múltiplas chamadas
  private memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  // Controle de requisições em andamento para evitar duplicação
  private pendingRequests = new Map<string, Promise<any>>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private batchRequests = new Map<string, Promise<any>>();
  private requestCounters = new Map<string, { count: number; timestamp: number }>();
  private connectionErrorTimestamp: number = 0;
  
  // Constantes de configuração
  private readonly CACHE_TTL: number = this.config.CACHE_TTL || 300000; // 5 minutos
  private readonly MIN_REQUEST_INTERVAL: number = this.config.MIN_REQUEST_INTERVAL || 2000; // 2 segundos
  private readonly REQUEST_COUNTER_RESET_TIME: number = 60000; // 1 minuto
  private readonly MAX_IDENTICAL_REQUESTS: number = 5; // Máximo de requisições idênticas em 1 minuto
  
  // Métricas simplificadas
  private metrics = {
    totalRequests: 0,
    cacheHits: 0,
    networkRequests: 0
  };

  private constructor() {
    let apiUrl = (import.meta as any).env.VITE_API_URL || '';
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }
    this.baseUrl = apiUrl;
    this.setupOnlineListener();
    logger.apiInfo(`ApiService otimizado inicializado com URL: ${this.baseUrl}`);
  }

  static getInstance() {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      logger.apiInfo('Conexão online detectada');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.apiWarn('Conexão offline detectada');
    });
  }

  private async fetchWithRetry(url: string, options: RequestInit = {}, attempt: number = 1): Promise<Response> {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      this.connectionErrorTimestamp = 0;
      return response;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        this.connectionErrorTimestamp = Date.now();
        console.error('Erro de conexão detectado, usando cooldown:', error);
      }
      
      if (attempt < this.config.MAX_RETRIES) {
        const backoffTime = this.config.INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`Tentativa ${attempt}/${this.config.MAX_RETRIES} falhou. Tentando novamente em ${backoffTime}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  private debounce<T>(key: string, fn: () => Promise<T>, delay: number): Promise<T> {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(key);
        try {
          resolve(await fn());
        } catch (error) {
          reject(error);
        }
      }, delay);
      this.debounceTimers.set(key, timer);
    });
  }

  private async batchRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const key = `${endpoint}-${JSON.stringify(options)}`;
    
    // Se já existe uma requisição em lote para este endpoint, retorna a mesma Promise
    if (this.batchRequests.has(key)) {
      return this.batchRequests.get(key) as Promise<T>;
    }
    
    try {
      // Cria uma nova Promise para a requisição em lote
      const requestPromise = this.executeRequest<T>(endpoint, options);
      
      // Armazena a Promise no mapa de requisições em lote
      this.batchRequests.set(key, requestPromise);
      
      // Aguarda a conclusão da requisição
      const data = await requestPromise;
      
      // Remove a requisição do mapa após um pequeno delay para permitir que outras requisições a reutilizem
      setTimeout(() => {
        this.batchRequests.delete(key);
      }, 100);
      
      return data;
    } catch (error) {
      // Remove a requisição do mapa em caso de erro
      this.batchRequests.delete(key);
      throw error;
    }
  }
  
  /**
   * Executa uma requisição HTTP
   */
  private async executeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    this.metrics.networkRequests++;
    return this.makeRequest<T>(endpoint, options);
  }

  /**
   * Cache inteligente em memória - mais rápido que localStorage
   */
  private setMemoryCache(key: string, data: any, ttl: number = this.config.CACHE_TTL): void {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getMemoryCache(key: string): any | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Requisição otimizada com headers corretos para evitar CORS
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Priorizar localStorage para persistência de 6 horas
    // Usar 'authToken' como chave principal para consistência
    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
    
    // Headers otimizados - removido x-request-id que causa CORS
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };

    const response = await this.fetchWithRetry(
      `${this.baseUrl}${endpoint}`,
      { ...options, headers, mode: 'cors' }
    );

    const data = await response.json();
    return data;
  }

  // Comentário removido pois a propriedade já foi declarada anteriormente

  // Método para verificar e controlar chamadas repetidas
  private checkRepeatedRequests(endpoint: string, method: string = 'GET'): boolean {
    const now = Date.now();
    const requestKey = `${method}-${endpoint}`;
    const requestId = `req-${now}`;
    
    // Verificar contador de chamadas repetidas
    const counterInfo = this.requestCounters.get(requestKey);
    if (counterInfo) {
      // Calcular tempo restante para reset
      const timeElapsed = now - counterInfo.timestamp;
      const timeRemaining = Math.max(0, this.REQUEST_COUNTER_RESET_TIME - timeElapsed);
      const resetInSeconds = Math.ceil(timeRemaining / 1000);
      
      // Resetar contador se passou o tempo de reset
      if (timeElapsed > this.REQUEST_COUNTER_RESET_TIME) {
        this.requestCounters.set(requestKey, { count: 1, timestamp: now });
        console.warn(`[ApiService][${requestId}] Contador de requisições para ${requestKey} resetado após ${this.REQUEST_COUNTER_RESET_TIME/1000}s`);
        return false; // Não excedeu o limite
      } else {
        // Incrementar contador
        counterInfo.count++;
        this.requestCounters.set(requestKey, counterInfo);
        
        // Verificar se excedeu o limite de chamadas repetidas
        if (counterInfo.count > this.MAX_IDENTICAL_REQUESTS) {
          console.error(`[ApiService][${requestId}] BLOQUEADO: Limite de ${this.MAX_IDENTICAL_REQUESTS} chamadas repetidas excedido para ${requestKey} em ${this.REQUEST_COUNTER_RESET_TIME/1000}s. Contador: ${counterInfo.count}, Reset em ${resetInSeconds}s`);
          return true; // Excedeu o limite
        }
        
        console.warn(`[ApiService][${requestId}] Chamada repetida #${counterInfo.count}/${this.MAX_IDENTICAL_REQUESTS} para ${requestKey} (tempo restante para reset: ${resetInSeconds}s)`);
        return false; // Não excedeu o limite
      }
    } else {
      // Inicializar contador
      this.requestCounters.set(requestKey, { count: 1, timestamp: now });
      console.warn(`[ApiService][${requestId}] Primeira chamada para ${requestKey} neste período de ${this.REQUEST_COUNTER_RESET_TIME/1000}s`);
      return false; // Não excedeu o limite
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isGetRequest = !options.method || options.method === 'GET';
    const requestKey = `${options.method || 'GET'}-${endpoint}`;
    const requestId = `req-${Date.now()}`;
    
    console.warn(`[ApiService][${requestId}] Requisição ${requestKey} iniciada`);
    
    // Verificar se excedeu o limite de chamadas repetidas para requisições GET
    if (isGetRequest && this.checkRepeatedRequests(endpoint, options.method || 'GET')) {
      // Se excedeu o limite, tenta usar o cache
      const cachedData = await cacheService.get<T>(endpoint);
      const cacheTimestamp = await cacheService.getTimestamp(endpoint);
      const now = Date.now();
      const cacheAge = cacheTimestamp ? now - cacheTimestamp : Infinity;
      
      if (cachedData) {
        // Calcular tempo restante para reset do contador
        const counterInfo = this.requestCounters.get(requestKey);
        const timeRemaining = counterInfo ? 
          Math.max(0, this.REQUEST_COUNTER_RESET_TIME - (now - counterInfo.timestamp)) : 
          this.REQUEST_COUNTER_RESET_TIME;
        const resetInSeconds = Math.ceil(timeRemaining / 1000);
        
        console.warn(`[ApiService][${requestId}] Usando cache forçado para ${requestKey} devido ao limite de chamadas repetidas. Cache tem ${Math.round(cacheAge/1000)}s, reset em ${resetInSeconds}s`);
        return cachedData;
      }
      
      // Se não tem cache, lança um erro com detalhes
      const errorMessage = `Limite de ${this.MAX_IDENTICAL_REQUESTS} chamadas repetidas excedido para ${requestKey} em ${this.REQUEST_COUNTER_RESET_TIME/1000}s. Por favor, aguarde antes de tentar novamente.`;
      console.error(`[ApiService][${requestId}] ${errorMessage}`);
      
      // Criar um objeto de erro com informações adicionais
      const error = new Error(errorMessage);
      (error as any).isRateLimitError = true;
      (error as any).retryAfter = this.REQUEST_COUNTER_RESET_TIME / 1000;
      (error as any).endpoint = endpoint;
      (error as any).requestKey = requestKey;
      (error as any).requestId = requestId;
      throw error;
    }
    
    // Se já existe uma requisição em andamento para este endpoint, retorna a mesma Promise
    if (isGetRequest && this.pendingRequests.has(requestKey)) {
      console.log(`[ApiService] Requisição ${requestKey} já em andamento, reutilizando Promise`);
      return this.pendingRequests.get(requestKey) as Promise<T>;
    }
    
    if (isGetRequest) {
      const cachedData = await cacheService.get<T>(endpoint);
      const now = Date.now();
      const cacheTimestamp = await cacheService.getTimestamp(endpoint);
      
      // Verifica se o cache é válido
      const isCacheValid = cachedData && cacheTimestamp && (now - cacheTimestamp) < this.CACHE_TTL;
      
      if (isCacheValid) {
        console.log(`[ApiService] Cache válido para ${requestKey}, idade: ${Math.round((now - (cacheTimestamp || 0)) / 1000)}s`);
      } else {
        console.log(`[ApiService] Cache inválido ou inexistente para ${requestKey}`);
      }
      
      // Se estiver offline e tiver cache válido, retorna o cache
      if (!this.isOnline && isCacheValid) {
        console.log(`[ApiService] Offline, usando cache para ${requestKey}`);
        return cachedData;
      }
      
      // Se estiver online e tiver cache válido, retorna o cache e atualiza em segundo plano se necessário
      if (this.isOnline && isCacheValid) {
        // Se o cache estiver próximo de expirar, atualiza em segundo plano
        if ((now - cacheTimestamp) > this.CACHE_TTL / 2) {
          console.log(`[ApiService] Cache próximo de expirar para ${requestKey}, atualizando em segundo plano`);
          this.debounce(endpoint, 
            () => this.batchRequest(endpoint, options), 
            this.MIN_REQUEST_INTERVAL
          ).catch((err) => {
            console.error(`[ApiService] Erro na atualização em segundo plano para ${requestKey}:`, err);
          });
        }
        return cachedData;
      }
      
      // Se estiver offline e não tiver cache válido, lança erro
      if (!this.isOnline) {
        console.error(`[ApiService] Offline e sem cache válido para ${requestKey}`);
        throw new Error('Você está offline e não há dados em cache válidos disponíveis');
      }
    }

    try {
      console.log(`[ApiService] Criando Promise para requisição ${requestKey}`);
      // Cria uma Promise para a requisição e a armazena no mapa de requisições pendentes
      const requestPromise = isGetRequest ? 
        this.batchRequest<T>(endpoint, options) :
        this.executeRequest<T>(endpoint, options);
      
      // Armazena a Promise no mapa de requisições pendentes para evitar duplicação
      if (isGetRequest) {
        console.log(`[ApiService] Armazenando Promise para ${requestKey} no mapa de requisições pendentes`);
        this.pendingRequests.set(requestKey, requestPromise);
      }
      
      // Aguarda a conclusão da requisição
      console.log(`[ApiService] Aguardando conclusão da requisição ${requestKey}`);
      const data = await requestPromise;
      console.log(`[ApiService] Requisição ${requestKey} concluída com sucesso`);
      
      // Atualiza o cache se for uma requisição GET
      if (isGetRequest) {
        console.log(`[ApiService] Atualizando cache para ${requestKey}`);
        await cacheService.set(endpoint, data);
        // Remove a requisição do mapa de requisições pendentes
        console.log(`[ApiService] Removendo ${requestKey} do mapa de requisições pendentes`);
        this.pendingRequests.delete(requestKey);
      }
      
      return data;
    } catch (error) {
      console.error(`[ApiService] Erro na requisição ${requestKey}:`, error);
      // Em caso de erro, remove a requisição do mapa de requisições pendentes
      if (isGetRequest) {
        const cachedData = await cacheService.get<T>(endpoint);
        if (cachedData) return cachedData;
      }
      throw error;
    }
  }

  /**
   * Normaliza resposta da API para formato consistente
   */
  private normalizeResponse(data: any, dataType: string = 'dados'): any[] {
    // Se já é um array, retorna diretamente
    if (Array.isArray(data)) {
      return data;
    }

    // Se é null/undefined, retorna array vazio
    if (data === null || data === undefined) {
      return [];
    }

    // Se tem formato {success: boolean, data: array}
    if (data && typeof data === 'object' && 'data' in data) {
      if (Array.isArray(data.data)) {
        return data.data;
      }
    }

    // Se é um objeto único, transforma em array
    if (data && typeof data === 'object') {
      return [data];
    }

    logger.apiWarn(`Formato inesperado para ${dataType}:`, data);
    return [];
  }

  /**
   * Método principal otimizado para requisições GET com cache inteligente
   */
  async get<T>(endpoint: string, options: { ttl?: number; forceRefresh?: boolean } = {}): Promise<T> {
    const cacheKey = `GET-${endpoint}`;
    this.metrics.totalRequests++;

    // Se forceRefresh não está ativo, verifica cache
    if (!options.forceRefresh) {
      // 1. Verifica cache em memória primeiro (mais rápido)
      const memoryData = this.getMemoryCache(cacheKey);
      if (memoryData) {
        this.metrics.cacheHits++;
        logger.apiDebug(`Cache hit (memória): ${endpoint}`);
        return memoryData;
      }

      // 2. Verifica cache persistente
      const persistentData = await cacheService.get<T>(endpoint);
      if (persistentData) {
        this.metrics.cacheHits++;
        // Atualiza cache em memória para próximas consultas
        this.setMemoryCache(cacheKey, persistentData, options.ttl);
        logger.apiDebug(`Cache hit (persistente): ${endpoint}`);
        return persistentData;
      }
    }

    // 3. Verifica se já existe requisição em andamento
    if (this.pendingRequests.has(cacheKey)) {
      logger.apiDebug(`Reutilizando requisição em andamento: ${endpoint}`);
      return this.pendingRequests.get(cacheKey) as Promise<T>;
    }

    // 4. Se offline e não tem cache, lança erro
    if (!this.isOnline) {
      throw new Error('Offline e sem dados em cache disponíveis');
    }

    // 5. Faz nova requisição
    const requestPromise = this.makeRequest<T>(endpoint)
      .then(async (data) => {
        // Salva nos dois caches
        this.setMemoryCache(cacheKey, data, options.ttl);
        await cacheService.set(endpoint, data, { ttl: options.ttl });
        
        logger.apiDebug(`Dados atualizados: ${endpoint}`);
        return data;
      })
      .finally(() => {
        // Remove da lista de requisições pendentes
        this.pendingRequests.delete(cacheKey);
      });

    // Armazena a Promise para evitar requisições duplicadas
    this.pendingRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
  }

  /**
   * Método para requisições POST otimizado
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    if (!this.isOnline) {
      throw new Error('Não é possível enviar dados offline');
    }

    const result = await this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });

    // Invalida caches relacionados após POST
    this.invalidateRelatedCaches(endpoint);
    
    return result;
  }

  /**
   * Invalida caches relacionados após operações de escrita
   */
  private invalidateRelatedCaches(endpoint: string): void {
    const relatedKeys = Array.from(this.memoryCache.keys())
      .filter(key => {
        // Remove cache de endpoints relacionados
        if (endpoint.includes('appointments')) {
          return key.includes('appointments') || key.includes('barbers');
        }
        if (endpoint.includes('services')) {
          return key.includes('services');
        }
        if (endpoint.includes('comments')) {
          return key.includes('comments');
        }
        return false;
      });

    relatedKeys.forEach(key => {
      this.memoryCache.delete(key);
      logger.apiDebug(`Cache invalidado: ${key}`);
    });
  }

  // Métodos específicos otimizados
  async getApprovedComments() {
    const endpoint = '/api/comments?status=approved';
    try {
      const response = await this.get<any>(endpoint, { 
        ttl: this.config.COMMENTS_CACHE_TTL 
      });
      return this.normalizeResponse(response, 'comentários');
    } catch (error) {
      logger.apiError('Erro ao buscar comentários:', error);
      return [];
    }
  }

  async getBarbers() {
    const endpoint = '/api/barbers';
    try {
      const response = await this.get<any>(endpoint);
      return this.normalizeResponse(response, 'barbeiros');
    } catch (error) {
      logger.apiError('Erro ao buscar barbeiros:', error);
      throw error;
    }
  }

  async getAppointments() {
    const endpoint = '/api/appointments';
    try {
      const response = await this.get<any>(endpoint, {
        ttl: DATA_TYPE_CONFIG.appointments.cacheTTL
      });
      return this.normalizeResponse(response, 'agendamentos');
    } catch (error) {
      logger.apiError('Erro ao buscar agendamentos:', error);
      throw error;
    }
  }

  async getServices() {
    const endpoint = '/api/services';
    try {
      const response = await this.get<any>(endpoint, {
        ttl: this.config.SERVICES_CACHE_DURATION
      });
      return this.normalizeResponse(response, 'serviços');
    } catch (error) {
      logger.apiError('Erro ao buscar serviços:', error);
      throw error;
    }
  }

  /**
   * Submete um novo comentário para aprovação
   */
  async submitComment(commentData: { name: string; comment: string }) {
    const endpoint = '/api/comments';
    try {
      const response = await this.post<any>(endpoint, commentData);
      logger.apiInfo('Comentário enviado com sucesso');
      
      // Invalida cache de comentários para forçar atualização
      this.invalidateRelatedCaches('/api/comments');
      
      return response;
    } catch (error) {
      logger.apiError('Erro ao enviar comentário:', error);
      throw error;
    }
  }

  /**
   * Pré-carrega dados críticos de forma inteligente com suporte a lazy loading
   */
  async preloadCriticalData(): Promise<void> {
    // Mesmo offline, tentamos carregar do cache
    const criticalEndpoints = [
      { endpoint: '/api/services', method: 'getServices', priority: 'high' },
      { endpoint: '/api/barbers', method: 'getBarbers', priority: 'high' },
      { endpoint: '/api/comments?status=approved', method: 'getApprovedComments', priority: 'low' }
    ];

    logger.apiInfo('Pré-carregando dados críticos com lazy loading...');
    
    // Primeiro carrega dados de alta prioridade
    const highPriorityEndpoints = criticalEndpoints.filter(ep => ep.priority === 'high');
    
    // Executa em paralelo mas não bloqueia se algum falhar
    const highPriorityResults = await Promise.allSettled(
      highPriorityEndpoints.map(({ method }) => 
        (this as any)[method]()
      )
    );

    const highPrioritySuccessful = highPriorityResults.filter(r => r.status === 'fulfilled').length;
    logger.apiInfo(`Pré-carregamento de alta prioridade: ${highPrioritySuccessful}/${highPriorityEndpoints.length} sucessos`);
    
    // Depois carrega dados de baixa prioridade em segundo plano
    setTimeout(() => {
      const lowPriorityEndpoints = criticalEndpoints.filter(ep => ep.priority === 'low');
      
      Promise.allSettled(
        lowPriorityEndpoints.map(({ method }) => 
          (this as any)[method]()
        )
      ).then(results => {
        const lowPrioritySuccessful = results.filter(r => r.status === 'fulfilled').length;
        logger.apiInfo(`Pré-carregamento de baixa prioridade: ${lowPrioritySuccessful}/${lowPriorityEndpoints.length} sucessos`);
      });
    }, 2000); // Atrasa o carregamento de baixa prioridade
  }

  /**
   * Limpa todos os caches
   */
  async clearAllCaches(): Promise<void> {
    this.memoryCache.clear();
    await cacheService.clear();
    logger.apiInfo('Todos os caches foram limpos');
  }

  /**
   * Retorna métricas de uso
   */
  getMetrics() {
    const cacheHitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.cacheHits / this.metrics.totalRequests * 100).toFixed(1)
      : '0';
    
    return {
      ...this.metrics,
      cacheHitRate: `${cacheHitRate}%`,
      memoryCacheSize: this.memoryCache.size
    };
  }
}

export default ApiService.getInstance();

// Exporta métricas para debug
export const getApiMetrics = () => {
  const instance = ApiService.getInstance();
  return instance.getMetrics();
};
