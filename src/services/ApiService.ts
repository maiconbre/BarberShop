<<<<<<< Updated upstream
import CacheService from './CacheService';
=======
import { cacheService } from './CacheService';
import { logger } from '../utils/logger';
import { getAdaptiveConfig, DATA_TYPE_CONFIG } from '../config/apiConfig';
>>>>>>> Stashed changes

/**
 * ApiService otimizado com cache inteligente e redução de chamadas desnecessárias
 * Resolve problemas de CORS e implementa cache eficiente
 */
class ApiService {
  private static instance: ApiService;
  private readonly config = getAdaptiveConfig();
  private baseUrl: string;
<<<<<<< Updated upstream
  private retryAttempts: number = 5; // Aumentado para 5 tentativas
  private retryDelay: number = 1000;
  private isOnline: boolean = navigator.onLine;
  private connectionErrorTimestamp: number = 0;
  private connectionErrorCooldown: number = 30000; // 30 segundos de cooldown entre tentativas após falha
  private endpointCooldowns: Map<string, number> = new Map();
  private readonly MIN_REQUEST_INTERVAL = 2000; // 2 segundos entre requisições para o mesmo endpoint
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private batchRequests: Map<string, Promise<any>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos de TTL para cache
  private readonly BATCH_WAIT = 50; // 50ms de espera para agrupar requisições
=======
  private isOnline: boolean = navigator.onLine;
  
  // Cache inteligente em memória para evitar múltiplas chamadas
  private memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  // Controle de requisições em andamento para evitar duplicação
  private pendingRequests = new Map<string, Promise<any>>();
  
  // Métricas simplificadas
  private metrics = {
    totalRequests: 0,
    cacheHits: 0,
    networkRequests: 0
  };
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
  }

  private async fetchWithRetry(url: string, options: RequestInit, attempt: number = 1): Promise<Response> {
    try {
      const now = Date.now();
      if (this.connectionErrorTimestamp > 0 && now - this.connectionErrorTimestamp < this.connectionErrorCooldown) {
        console.log(`Aguardando cooldown após falha de conexão (${Math.round((now - this.connectionErrorTimestamp) / 1000)}s de ${Math.round(this.connectionErrorCooldown / 1000)}s)`);
        throw new Error('Servidor temporariamente indisponível. Tentando usar dados em cache.');
      }

      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      this.connectionErrorTimestamp = 0;
      return response;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        this.connectionErrorTimestamp = Date.now();
        console.error('Erro de conexão detectado, usando cooldown:', error);
      }
      
      if (attempt < this.retryAttempts) {
        const backoffTime = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`Tentativa ${attempt}/${this.retryAttempts} falhou. Tentando novamente em ${backoffTime}ms`);
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
    
    if (!this.batchRequests.has(key)) {
      const promise = new Promise<T>(async (resolve, reject) => {
        await new Promise(r => setTimeout(r, this.BATCH_WAIT));
        try {
          const result = await this.executeRequest<T>(endpoint, options);
          this.batchRequests.delete(key);
          resolve(result);
        } catch (error) {
          this.batchRequests.delete(key);
          reject(error);
        }
      });
      this.batchRequests.set(key, promise);
    }
    
    return this.batchRequests.get(key) as Promise<T>;
=======
    window.addEventListener('online', () => {
      this.isOnline = true;
      logger.apiInfo('Conexão restaurada');
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.apiWarn('Conexão perdida, usando cache');
    });
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
>>>>>>> Stashed changes
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
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Headers otimizados - removido x-request-id que causa CORS
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };

<<<<<<< Updated upstream
    const response = await this.fetchWithRetry(
      `${this.baseUrl}${endpoint}`,
      { ...options, headers, mode: 'cors' }
    );

    const data = await response.json();
    return data;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isGetRequest = !options.method || options.method === 'GET';
    
    if (isGetRequest) {
      const cachedData = await CacheService.getCache<T>(endpoint);
      const now = Date.now();
      const cacheTimestamp = await CacheService.getCacheTimestamp(endpoint);
      
      if (cachedData && (!this.isOnline || (now - cacheTimestamp) < this.CACHE_TTL)) {
        if (this.isOnline && (now - cacheTimestamp) > this.CACHE_TTL / 2) {
          this.debounce(endpoint, 
            () => this.batchRequest(endpoint, options), 
            this.MIN_REQUEST_INTERVAL
          ).catch(() => {});
        }
        return cachedData;
      }
      
      if (!this.isOnline) {
        throw new Error('Você está offline e não há dados em cache válidos disponíveis');
      }
    }

    try {
      const data = isGetRequest ? 
        await this.batchRequest<T>(endpoint, options) :
        await this.executeRequest<T>(endpoint, options);
      
      if (isGetRequest) {
        await CacheService.setCache(endpoint, data);
      }
      
      return data;
    } catch (error) {
      if (isGetRequest) {
        const cachedData = await CacheService.getCache<T>(endpoint);
        if (cachedData) return cachedData;
=======
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        mode: 'cors',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.metrics.networkRequests++;
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout: Requisição demorou muito para responder');
>>>>>>> Stashed changes
      }
      throw error;
    }
  }

<<<<<<< Updated upstream
  async preloadCriticalData(): Promise<void> {
    if (!this.isOnline) return;

    try {
      await Promise.allSettled([
        this.batchRequest('/api/barbers', { method: 'GET' }),
        this.batchRequest('/api/appointments', { method: 'GET' }),
        this.batchRequest('/api/comments?status=approved', { method: 'GET' })
      ]);
    } catch (error) {
      // Ignora erros no preload, dados serão carregados sob demanda
=======
  /**
   * Normaliza resposta da API para formato consistente
   */
  private normalizeResponse(data: any, dataType: string = 'dados'): any[] {
    // Se já é um array, retorna diretamente
    if (Array.isArray(data)) {
      return data;
>>>>>>> Stashed changes
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
        return false;
      });

    relatedKeys.forEach(key => {
      this.memoryCache.delete(key);
      logger.apiDebug(`Cache invalidado: ${key}`);
    });
  }

  // Métodos específicos otimizados
  async getApprovedComments() {
<<<<<<< Updated upstream
    return this.request<any[]>('/api/comments?status=approved');
  }

  async getBarbers() {
    return this.request<any[]>('/api/barbers');
  }

  async getAppointments() {
    return this.request<any[]>('/api/appointments');
=======
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
>>>>>>> Stashed changes
  }

  /**
   * Pré-carrega dados críticos de forma inteligente
   */
  async preloadCriticalData(): Promise<void> {
    if (!this.isOnline) return;

    const criticalEndpoints = [
      { endpoint: '/api/services', method: 'getServices' },
      { endpoint: '/api/barbers', method: 'getBarbers' },
      { endpoint: '/api/comments?status=approved', method: 'getApprovedComments' }
    ];

    logger.apiInfo('Pré-carregando dados críticos...');
    
    // Executa em paralelo mas não bloqueia se algum falhar
    const results = await Promise.allSettled(
      criticalEndpoints.map(({ method }) => 
        (this as any)[method]()
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    logger.apiInfo(`Pré-carregamento concluído: ${successful}/${criticalEndpoints.length} sucessos`);
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
