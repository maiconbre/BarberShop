import CacheService from './CacheService';

class ApiService {
  private static instance: ApiService;
  private baseUrl: string;
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

  private constructor() {
    let apiUrl = (import.meta as any).env.VITE_API_URL || '';
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }
    this.baseUrl = apiUrl;
    this.setupOnlineListener();
    console.log('ApiService inicializado com URL:', this.baseUrl);
  }

  static getInstance() {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private setupOnlineListener() {
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
  }

  private async executeRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
      }
      throw error;
    }
  }

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
    }
  }

  async getApprovedComments() {
    return this.request<any[]>('/api/comments?status=approved');
  }

  async getBarbers() {
    return this.request<any[]>('/api/barbers');
  }

  async getAppointments() {
    return this.request<any[]>('/api/appointments');
  }
}

export default ApiService.getInstance();
