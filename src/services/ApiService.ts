import CacheService from './CacheService';

class ApiService {
  private static instance: ApiService;
  private baseUrl: string;
  private retryAttempts: number = 5; // Aumentado para 5 tentativas
  private retryDelay: number = 1000;
  private isOnline: boolean = navigator.onLine;
  private connectionErrorTimestamp: number = 0;
  private connectionErrorCooldown: number = 30000; // 30 segundos de cooldown entre tentativas após falha

  private constructor() {
    // Obter a URL base da API do arquivo .env
    let apiUrl = (import.meta as any).env.VITE_API_URL || '';
    
    // Garantir que a URL não termina com barra
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
      // Verificar se houve erro recente de conexão e se estamos no período de cooldown
      const now = Date.now();
      if (this.connectionErrorTimestamp > 0 && now - this.connectionErrorTimestamp < this.connectionErrorCooldown) {
        console.log(`Aguardando cooldown após falha de conexão (${Math.round((now - this.connectionErrorTimestamp) / 1000)}s de ${Math.round(this.connectionErrorCooldown / 1000)}s)`);
        throw new Error('Servidor temporariamente indisponível. Tentando usar dados em cache.');
      }

      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      // Resetar timestamp de erro de conexão se a requisição for bem-sucedida
      this.connectionErrorTimestamp = 0;
      return response;
    } catch (error) {
      // Se for um erro de conexão (ERR_CONNECTION_REFUSED, etc)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        this.connectionErrorTimestamp = Date.now();
        console.error('Erro de conexão detectado, usando cooldown:', error);
      }
      
      if (attempt < this.retryAttempts) {
        // Implementar backoff exponencial
        const backoffTime = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`Tentativa ${attempt}/${this.retryAttempts} falhou. Tentando novamente em ${backoffTime}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  // Mapa para controlar o tempo entre requisições para cada endpoint
  private endpointCooldowns: Map<string, number> = new Map();
  private readonly MIN_REQUEST_INTERVAL = 2000; // 2 segundos entre requisições para o mesmo endpoint

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Verificar se é uma requisição GET
    const isGetRequest = options.method === undefined || options.method === 'GET';
    
    // Tentar obter dados do cache primeiro, mesmo online
    if (isGetRequest) {
      const cachedData = await CacheService.getCache<T>(endpoint);
      if (cachedData) {
        console.log(`Dados em cache encontrados para ${endpoint}`);
        
        // Se estiver offline, retornar imediatamente os dados em cache
        if (!this.isOnline) {
          console.log(`Dispositivo offline, usando dados em cache para ${endpoint}`);
          return cachedData;
        }
        
        // Verificar se já fizemos uma requisição recente para este endpoint
        const now = Date.now();
        const lastRequestTime = this.endpointCooldowns.get(endpoint) || 0;
        const timeSinceLastRequest = now - lastRequestTime;
        
        // Se a última requisição foi muito recente, use o cache sem atualizar em background
        if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
          console.log(`Requisição muito recente para ${endpoint} (${Math.round(timeSinceLastRequest/1000)}s < ${this.MIN_REQUEST_INTERVAL/1000}s), usando apenas cache`);
          return cachedData;
        }
        
        // Se estiver online e passou tempo suficiente, iniciar uma atualização em background
        if (this.connectionErrorTimestamp === 0) { // Só atualiza se não estiver em cooldown
          this.refreshCacheInBackground(endpoint, options);
        }
        return cachedData;
      } else if (!this.isOnline) {
        throw new Error('Você está offline e não há dados em cache disponíveis');
      }
    }

    try {
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
      
      // Cache successful GET requests
      if (isGetRequest) {
        await CacheService.setCache(endpoint, data);
      }

      return data;
    } catch (error) {
      console.error(`Erro na requisição para ${endpoint}:`, error);
      
      // Tentar recuperar do cache em caso de erro
      if (isGetRequest) {
        const cachedData = await CacheService.getCache<T>(endpoint);
        if (cachedData) {
          console.log(`Erro na requisição, usando dados em cache para ${endpoint}`);
          return cachedData;
        }
      }
      
      throw error;
    }
  }

  // Método para atualizar o cache em segundo plano sem bloquear a UI
  private async refreshCacheInBackground<T>(endpoint: string, options: RequestInit = {}): Promise<void> {
    try {
      // Registrar o timestamp desta requisição para controle de frequência
      const now = Date.now();
      this.endpointCooldowns.set(endpoint, now);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      };

      console.log(`Atualizando cache em segundo plano para ${endpoint}`);
      const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers, mode: 'cors' });
      
      if (!response.ok) {
        // Se receber erro 429, aumentar o intervalo mínimo entre requisições
        if (response.status === 429) {
          console.warn(`Erro 429 (Too Many Requests) para ${endpoint}, aumentando intervalo entre requisições`); }
        
        console.warn(`Falha ao atualizar cache em segundo plano para ${endpoint}: ${response.status}`);
        return;
      }

      const data = await response.json();
      await CacheService.setCache(endpoint, data);
      console.log(`Cache atualizado com sucesso para ${endpoint}`);
    } catch (error) {
      console.warn(`Erro ao atualizar cache em segundo plano para ${endpoint}:`, error);
      // Não propaga o erro, pois é uma atualização em segundo plano
    }
  }

  // Método para pré-carregar dados importantes
  async preloadCriticalData(): Promise<void> {
    try {
      console.log('Pré-carregando dados críticos...');
      // Pré-carregar em paralelo
      await Promise.allSettled([
        this.getBarbers(),
        this.getAppointments(),
        this.getApprovedComments()
      ]);
      console.log('Dados críticos pré-carregados com sucesso');
    } catch (error) {
      console.warn('Erro ao pré-carregar dados críticos:', error);
      // Não propaga o erro, pois é apenas pré-carregamento
    }
  }

  // Métodos utilitários para endpoints comuns
  async getApprovedComments() {
    return this.request('/api/comments?status=approved');
  }

  async getBarbers() {
    return this.request('/api/barbers');
  }

  async getAppointments() {
    return this.request('/api/appointments');
  }
}

export default ApiService.getInstance();
