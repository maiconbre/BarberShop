import { cacheService } from './CacheService';

class ApiService {
  private static instance: ApiService;
  private baseUrl: string;
  private readonly RETRY_ATTEMPTS: number = 3; // Aumentado para 3 tentativas
  private readonly RETRY_DELAY: number = 300; // 0,3 segundo entre tentativas
  private isOnline: boolean = navigator.onLine;
  private connectionErrorTimestamp: number = 0;
  private readonly CONNECTION_ERROR_COOLDOWN: number = 30000; // 30 segundos de cooldown entre tentativas após falha
  private readonly MIN_REQUEST_INTERVAL: number = 2000; // 2 segundos entre requisições para o mesmo endpoint
  private readonly CACHE_TTL: number = 10 * 60 * 1000; // 10 minutos de TTL para cache
  private readonly COMMENTS_CACHE_TTL: number = 30 * 60 * 1000; // 30 minutos de TTL para cache de comentários
  private readonly BATCH_WAIT: number = 50; // 50ms de espera para agrupar requisições
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private batchRequests: Map<string, Promise<any>> = new Map();

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
      if (this.connectionErrorTimestamp > 0 && now - this.connectionErrorTimestamp < this.CONNECTION_ERROR_COOLDOWN) {
        console.log(`Aguardando cooldown após falha de conexão (${Math.round((now - this.connectionErrorTimestamp) / 1000)}s de ${Math.round(this.CONNECTION_ERROR_COOLDOWN / 1000)}s)`);
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
      
      if (attempt < this.RETRY_ATTEMPTS) {
        const backoffTime = this.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`Tentativa ${attempt}/${this.RETRY_ATTEMPTS} falhou. Tentando novamente em ${backoffTime}ms`);
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
    
    // Cria uma nova Promise para a requisição em lote
    const promise = new Promise<T>(async (resolve, reject) => {
      try {
        // Aguarda um pequeno intervalo para permitir o agrupamento de requisições similares
        await new Promise(r => setTimeout(r, this.BATCH_WAIT));
        
        // Verifica se o cache já foi atualizado por outra requisição durante o intervalo de espera
        const cachedData = await cacheService.get<T>(endpoint);
        const cacheTimestamp = await cacheService.getTimestamp(endpoint);
        const now = Date.now();
        
        // Se o cache foi atualizado recentemente (nos últimos 5 segundos), usa o cache
        if (cachedData && cacheTimestamp && (now - cacheTimestamp) < 5000) {
          resolve(cachedData);
          return;
        }
        
        // Executa a requisição
        const result = await this.executeRequest<T>(endpoint, options);
        
        // Atualiza o cache
        await cacheService.set(endpoint, result);
        
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        // Remove a requisição do mapa de requisições em lote
        this.batchRequests.delete(key);
      }
    });
    
    // Armazena a Promise no mapa de requisições em lote
    this.batchRequests.set(key, promise);
    
    return promise;
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

  // Mapa para rastrear requisições em andamento para evitar duplicação
  private pendingRequests: Map<string, Promise<any>> = new Map();

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
        console.log(`[ApiService] Removendo ${requestKey} do mapa de requisições pendentes após erro`);
        this.pendingRequests.delete(requestKey);
        
        // Tenta usar o cache como fallback
        console.log(`[ApiService] Tentando usar cache como fallback para ${requestKey}`);
        const cachedData = await cacheService.get<T>(endpoint);
        if (cachedData) {
          console.log(`[ApiService] Cache encontrado como fallback para ${requestKey}`);
          return cachedData;
        }
        console.log(`[ApiService] Nenhum cache disponível como fallback para ${requestKey}`);
      }
      throw error;
    }
  }

  // Flag para controlar se o preloadCriticalData já foi executado
  private preloadInProgress: boolean = false;
  private preloadCompleted: boolean = false;
  
  async preloadCriticalData(): Promise<void> {
    // Se estiver offline ou se o preload já estiver em andamento ou concluído, não executa novamente
    if (!this.isOnline || this.preloadInProgress || this.preloadCompleted) return;

    try {
      // Marca que o preload está em andamento
      this.preloadInProgress = true;
      
      console.log('Pré-carregando dados críticos...');
      
      // Verifica se os dados já estão em cache antes de fazer as requisições
      const endpoints = [
        '/api/barbers',
        '/api/appointments',
        '/api/comments?status=approved',
        '/api/services'
      ];
      
      // Filtra apenas os endpoints que não estão em cache
      const endpointsToLoad = [];
      for (const endpoint of endpoints) {
        const cachedData = await cacheService.get(endpoint);
        if (!cachedData) {
          endpointsToLoad.push(endpoint);
        }
      }
      
      // Se houver endpoints para carregar, faz as requisições
      if (endpointsToLoad.length > 0) {
        await Promise.allSettled(
          endpointsToLoad.map(endpoint => 
            this.request(endpoint, { method: 'GET' })
          )
        );
      }
      
      console.log('Dados críticos pré-carregados com sucesso');
      
      // Marca que o preload foi concluído
      this.preloadCompleted = true;
    } catch (error) {
      console.warn('Erro ao pré-carregar dados críticos:', error);
      // Ignora erros no preload, dados serão carregados sob demanda
    } finally {
      // Marca que o preload não está mais em andamento
      this.preloadInProgress = false;
    }
  }

  async getApprovedComments() {
    const endpoint = '/api/comments?status=approved';
    
    try {
      // Verifica se há dados em cache válidos com TTL específico para comentários
      const cachedData = await cacheService.get<any[]>(endpoint);
      const cacheTimestamp = await cacheService.getTimestamp(endpoint);
      const now = Date.now();
      
      // Verifica se o cache é válido usando o TTL específico para comentários
      if (cachedData && cacheTimestamp && (now - cacheTimestamp) < this.COMMENTS_CACHE_TTL) {
        console.log('Usando dados em cache para comentários');
        
        // Se o cache estiver próximo de expirar, atualiza em segundo plano
        if ((now - cacheTimestamp) > this.COMMENTS_CACHE_TTL / 2) {
          this.debounce(endpoint, 
            () => this.fetchComments(endpoint), 
            this.MIN_REQUEST_INTERVAL * 2 // Intervalo maior para reduzir carga no servidor
          ).catch(() => {});
        }
        
        return cachedData;
      }
      
      // Se não houver cache válido, busca novos dados
      return await this.fetchComments(endpoint);
    } catch (error) {
      console.error('Erro ao buscar comentários aprovados:', error);
      
      // Tenta recuperar do cache mesmo que esteja expirado
      const cachedData = await cacheService.get<any[]>(endpoint);
      if (cachedData) {
        console.log('Usando dados em cache expirado para comentários');
        return cachedData;
      }
      
      throw error;
    }
  }
  
  private async fetchComments(endpoint: string): Promise<any[]> {
    try {
      const response = await this.request<{success: boolean, data: any[]}>(endpoint);
      
      // Verifica se a resposta tem o formato esperado e retorna apenas o array de dados
      if (response && response.success && Array.isArray(response.data)) {
        // Armazena no cache com TTL específico para comentários
        await cacheService.set(endpoint, response.data, { ttl: this.COMMENTS_CACHE_TTL });
        return response.data;
      }
      
      // Se a resposta já for um array, retorna diretamente
      if (Array.isArray(response)) {
        // Armazena no cache com TTL específico para comentários
        await cacheService.set(endpoint, response, { ttl: this.COMMENTS_CACHE_TTL });
        return response;
      }
      
      // Caso contrário, lança um erro
      throw new Error('Formato de resposta inválido');
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      throw error;
    }
  }

  async getBarbers() {
    try {
      const response = await this.request<{success: boolean, data: any[]}>('/api/barbers');
      
      // Verifica se a resposta tem o formato esperado e retorna apenas o array de dados
      if (response && response.success && Array.isArray(response.data)) {
        return response.data;
      }
      
      // Se a resposta já for um array, retorna diretamente
      if (Array.isArray(response)) {
        return response;
      }
      
      // Caso contrário, lança um erro
      throw new Error('Formato de resposta inválido para barbeiros');
    } catch (error) {
      console.error('Erro ao buscar barbeiros:', error);
      throw error;
    }
  }

  async getAppointments() {
    try {
      const response = await this.request<{success: boolean, data: any[]}>('/api/appointments');
      
      // Verifica se a resposta tem o formato esperado e retorna apenas o array de dados
      if (response && response.success && Array.isArray(response.data)) {
        return response.data;
      }
      
      // Se a resposta já for um array, retorna diretamente
      if (Array.isArray(response)) {
        return response;
      }
      
      // Caso contrário, lança um erro
      throw new Error('Formato de resposta inválido para agendamentos');
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      throw error;
    }
  }
  
  // Flag para controlar se já existe uma requisição em andamento para serviços
  private servicesRequestInProgress: Promise<any> | null = null;
  private cachedServices: any[] | null = null;
  private lastServicesRequestTime: number = 0;
  private readonly SERVICES_CACHE_DURATION: number = 5 * 60 * 1000; // 5 minutos
  
  // Contador para limitar chamadas repetidas idênticas
  private requestCounters: Map<string, {count: number, timestamp: number}> = new Map();
  private readonly MAX_IDENTICAL_REQUESTS: number = 3; // Máximo de 3 chamadas idênticas repetidas
  private readonly REQUEST_COUNTER_RESET_TIME: number = 60 * 1000; // Reset do contador após 1 minuto

  async getServices() {
    try {
      const now = Date.now();
      const requestId = `services-${now}`;
      const requestKey = 'GET-/api/services';
      console.warn(`[ApiService][${requestId}] getServices() chamado`);
      
      // Verificar se excedeu o limite de chamadas repetidas
      if (this.checkRepeatedRequests('/api/services', 'GET')) {
        // Se excedeu o limite e temos cache, retorna o cache mesmo que expirado
        if (this.cachedServices) {
          const cacheAge = Math.round((now - this.lastServicesRequestTime) / 1000);
          
          // Calcular tempo restante para reset do contador
          const counterInfo = this.requestCounters.get(requestKey);
          const timeRemaining = counterInfo ? 
            Math.max(0, this.REQUEST_COUNTER_RESET_TIME - (now - counterInfo.timestamp)) : 
            this.REQUEST_COUNTER_RESET_TIME;
          const resetInSeconds = Math.ceil(timeRemaining / 1000);
          
          console.warn(`[ApiService][${requestId}] Limite de chamadas repetidas excedido. Usando cache forçado (idade: ${cacheAge}s). Reset em ${resetInSeconds}s`);
          return this.cachedServices;
        }
        
        // Se não temos cache, lançar erro específico
        const errorMessage = `Limite de ${this.MAX_IDENTICAL_REQUESTS} chamadas repetidas excedido para serviços em ${this.REQUEST_COUNTER_RESET_TIME/1000}s. Por favor, aguarde antes de tentar novamente.`;
        console.error(`[ApiService][${requestId}] ${errorMessage}`);
        
        // Criar um objeto de erro com informações adicionais
        const error = new Error(errorMessage);
        (error as any).isRateLimitError = true;
        (error as any).retryAfter = this.REQUEST_COUNTER_RESET_TIME / 1000;
        (error as any).endpoint = '/api/services';
        (error as any).requestKey = requestKey;
        (error as any).requestId = requestId;
        throw error;
      }
      
      // Se temos dados em cache e eles ainda são válidos, retorna o cache
      if (this.cachedServices && (now - this.lastServicesRequestTime) < this.SERVICES_CACHE_DURATION) {
        const cacheAge = Math.round((now - this.lastServicesRequestTime) / 1000);
        console.warn(`[ApiService][${requestId}] Retornando serviços do cache em memória (idade: ${cacheAge}s)`);
        return this.cachedServices;
      }
      
      // Se já existe uma requisição em andamento, aguarda e retorna o resultado
      if (this.servicesRequestInProgress) {
        console.warn(`[ApiService][${requestId}] Aguardando requisição de serviços em andamento`);
        return this.servicesRequestInProgress;
      }
      
      console.warn(`[ApiService][${requestId}] Iniciando nova requisição de serviços`);
      // Iniciar nova requisição
      this.servicesRequestInProgress = this.request<{success: boolean, data: any[]}>('/api/services', {
        method: 'GET',
        // Adicionar um parâmetro de cache-busting para evitar cache do navegador
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
        .then(response => {
          // Verifica se a resposta tem o formato esperado e atualiza o cache
          if (response && response.success && Array.isArray(response.data)) {
            console.warn(`[ApiService][${requestId}] Requisição de serviços concluída com sucesso`);
            this.cachedServices = response.data;
            this.lastServicesRequestTime = now;
            return response.data;
          }
          
          // Se a resposta já for um array, atualiza o cache e retorna diretamente
          if (Array.isArray(response)) {
            console.warn(`[ApiService][${requestId}] Requisição de serviços concluída com sucesso`);
            this.cachedServices = response;
            this.lastServicesRequestTime = now;
            return response;
          }
          
          // Caso contrário, lança um erro
          throw new Error('Formato de resposta inválido para serviços');
        })
        .catch(error => {
          console.error(`[ApiService][${requestId}] Erro ao obter serviços:`, error);
          // Em caso de erro, retorna o cache se disponível
          if (this.cachedServices) {
            console.warn(`[ApiService][${requestId}] Retornando serviços do cache após erro`);
            return this.cachedServices;
          }
          throw error;
        })
        .finally(() => {
          // Limpar a promessa de requisição em andamento
          console.warn(`[ApiService][${requestId}] Finalizando requisição de serviços`);
          this.servicesRequestInProgress = null;
        });
      
      return this.servicesRequestInProgress;
    } catch (error) {
      console.error('[ApiService] Erro ao processar requisição de serviços:', error);
      
      // Em caso de erro, retorna o cache se disponível
      if (this.cachedServices) {
        return this.cachedServices;
      }
      
      throw error;
    }
  }
}

export default ApiService.getInstance();
