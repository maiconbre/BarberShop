class CacheService {
  setItem(arg0: string, data: any[]) {
    throw new Error('Method not implemented.');
  }
  private static instance: CacheService;
  private cache: Map<string, { data: any; timestamp: number }>;
  private pendingRequests: Map<string, Promise<any>>;
  private CACHE_DURATION = 60 * 60 * 1000; // 60 minutos (aumentado para reduzir requisições)
  private CACHE_DURATION_OFFLINE = 24 * 60 * 60 * 1000; // 24 horas quando offline
  private STORAGE_KEY_PREFIX = 'app_cache_';
  private retryDelays: Map<string, number>; // Controle de backoff exponencial por endpoint
  private requestTimestamps: Map<string, number>; // Controle de tempo entre requisições
  private REQUEST_COOLDOWN = 5000; // 5 segundos entre requisições para o mesmo endpoint

  private constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.retryDelays = new Map();
    this.requestTimestamps = new Map();
    this.loadCacheFromStorage();
  }

  static getInstance() {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }
  
  // Carrega todos os dados de cache do localStorage
  private loadCacheFromStorage(): void {
    try {
      // Encontrar todas as chaves no localStorage que começam com o prefixo de cache
      const cacheKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_KEY_PREFIX)) {
          cacheKeys.push(key);
        }
      }
      
      // Carregar cada item do cache
      for (const fullKey of cacheKeys) {
        try {
          const value = localStorage.getItem(fullKey);
          if (value) {
            const { data, timestamp } = JSON.parse(value);
            const key = fullKey.substring(this.STORAGE_KEY_PREFIX.length);
            this.cache.set(key, { data, timestamp });
          }
        } catch (err) {
          console.warn(`Erro ao carregar item de cache ${fullKey}:`, err);
          // Remove item inválido
          localStorage.removeItem(fullKey);
        }
      }
      
      console.log(`Cache carregado com ${this.cache.size} itens do armazenamento local`);
    } catch (error) {
      console.error('Erro ao carregar cache do armazenamento:', error);
    }
  }

  async fetchWithCache<T>(key: string, fetchFn: () => Promise<T>, forceRefresh: boolean = false): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();
    const isOffline = !navigator.onLine;
    const cacheDuration = isOffline ? this.CACHE_DURATION_OFFLINE : this.CACHE_DURATION;

    // Se já temos dados em cache válidos e não estamos forçando atualização, retorne-os imediatamente
    if (!forceRefresh && cached && now - cached.timestamp < cacheDuration) {
      console.log(`Usando cache para ${key}, idade: ${Math.round((now - cached.timestamp) / 1000)}s`);
      return cached.data;
    }

    // Verificar se já existe uma requisição pendente para esta chave
    if (this.pendingRequests.has(key)) {
      console.log(`Reutilizando requisição pendente para ${key}`);
      try {
        return await this.pendingRequests.get(key);
      } catch (error) {
        // Se a requisição pendente falhar e tivermos cache, use o cache
        if (cached) {
          console.log(`Requisição pendente falhou para ${key}, usando cache expirado`);
          return cached.data;
        }
        throw error;
      }
    }

    // Verificar se já fizemos uma requisição recente para este endpoint
    const lastRequestTime = this.requestTimestamps.get(key) || 0;
    const timeSinceLastRequest = now - lastRequestTime;
    
    // Se a última requisição foi muito recente e temos cache, use o cache para evitar 429
    if (timeSinceLastRequest < this.REQUEST_COOLDOWN && cached) {
      console.log(`Requisição muito recente para ${key} (${Math.round(timeSinceLastRequest/1000)}s < ${this.REQUEST_COOLDOWN/1000}s), usando cache`);
      
      // Agendar uma atualização em background após o período de cooldown
      if (timeSinceLastRequest < this.REQUEST_COOLDOWN && !this.pendingRequests.has(`${key}_delayed`)) {
        const delayTime = this.REQUEST_COOLDOWN - timeSinceLastRequest;
        console.log(`Agendando atualização em background para ${key} em ${Math.round(delayTime/1000)}s`);
        
        const delayedPromise = new Promise<T>((resolve) => {
          setTimeout(async () => {
            try {
              // Verificar novamente se já não existe uma requisição pendente
              if (!this.pendingRequests.has(key)) {
                const data = await fetchFn();
                this.cache.set(key, { data, timestamp: Date.now() });
                this.requestTimestamps.set(key, Date.now());
                resolve(data);
              }
            } catch (error) {
              console.warn(`Erro na atualização em background para ${key}:`, error);
            } finally {
              this.pendingRequests.delete(`${key}_delayed`);
            }
          }, delayTime);
        });
        
        this.pendingRequests.set(`${key}_delayed`, delayedPromise);
      }
      
      return cached.data;
    }

    // Implementar backoff exponencial para evitar muitas requisições em caso de falha
    const currentRetryDelay = this.retryDelays.get(key) || 1000;
    
    // Registrar o timestamp desta requisição
    this.requestTimestamps.set(key, now);
    
    // Criar e armazenar a promessa para esta requisição
    const fetchPromise = (async () => {
      try {
        const data = await fetchFn();
        this.cache.set(key, { data, timestamp: now });
        // Resetar o delay de retry quando a requisição for bem-sucedida
        this.retryDelays.delete(key);
        return data;
      } catch (error: any) {
        // Se o erro for 429 (Too Many Requests), aumentar o delay exponencialmente
        if (error.response?.status === 429 || (typeof error === 'object' && error.message?.includes('429'))) {
          const newDelay = Math.min(currentRetryDelay * 2, 60000); // Máximo de 1 minuto
          this.retryDelays.set(key, newDelay);
          console.warn(`Erro 429 para ${key}, próximo retry em ${newDelay/1000}s`);
          
          // Aumentar o cooldown para este endpoint
          this.REQUEST_COOLDOWN = Math.min(this.REQUEST_COOLDOWN * 1.5, 30000); // Máximo de 30 segundos
          console.log(`Aumentando cooldown global para ${this.REQUEST_COOLDOWN/1000}s`);
        }
        
        // Se temos dados em cache, mesmo expirados, use-os em caso de erro
        if (cached) {
          console.log(`Erro na requisição para ${key}, usando cache expirado`);
          return cached.data;
        }
        throw error;
      } finally {
        // Remover esta requisição da lista de pendentes quando concluída
        this.pendingRequests.delete(key);
      }
    })();

    // Armazenar a promessa para que outras chamadas possam reutilizá-la
    this.pendingRequests.set(key, fetchPromise);
    return fetchPromise;
  }

  static async getItem(key: string) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Erro ao recuperar dados do cache:', error);
      return null;
    }
  }

  static async setItem(key: string, data: any): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
    }
  }

  async getLastUpdateTime(key: string): Promise<string | null> {
    try {
      const lastUpdate = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}last_update_${key}`);
      return lastUpdate;
    } catch (error) {
      console.error('Erro ao obter último horário de atualização:', error);
      return null;
    }
  }

  async setLastUpdateTime(key: string, timestamp: string): Promise<void> {
    try {
      localStorage.setItem(`${this.STORAGE_KEY_PREFIX}last_update_${key}`, timestamp);
    } catch (error) {
      console.error('Erro ao definir horário de atualização:', error);
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    const now = Date.now();
    const isOffline = !navigator.onLine;
    const cacheDuration = isOffline ? this.CACHE_DURATION_OFFLINE : this.CACHE_DURATION;

    // Verificar cache em memória primeiro
    if (cached) {
      const age = now - cached.timestamp;
      if (age < cacheDuration) {
        return cached.data;
      } else {
        console.log(`Cache em memória expirado para ${key} (${Math.round(age / 1000)}s > ${Math.round(cacheDuration / 1000)}s)`);
      }
    }

    // Tentar recuperar do localStorage como fallback
    try {
      const localData = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}${key}`);
      if (localData) {
        const parsedData = JSON.parse(localData);
        const { data, timestamp } = parsedData;
        const age = now - timestamp;
        
        if (age < cacheDuration) {
          // Atualizar o cache em memória com os dados do localStorage
          this.cache.set(key, { data, timestamp });
          return data;
        } else {
          console.log(`Cache em localStorage expirado para ${key} (${Math.round(age / 1000)}s > ${Math.round(cacheDuration / 1000)}s)`);
          
          // Se estiver offline, usar dados expirados como último recurso
          if (isOffline) {
            console.log(`Dispositivo offline, usando dados expirados para ${key}`);
            this.cache.set(key, { data, timestamp: now }); // Atualiza timestamp para evitar mensagens repetidas
            return data;
          }
        }
      }
    } catch (error) {
      console.error(`Erro ao recuperar cache local para ${key}:`, error);
    }

    return null;
  }

  async setCache(key: string, data: any): Promise<void> {
    const timestamp = Date.now();
    this.cache.set(key, { data, timestamp });

    // Salvar também no localStorage como backup
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${key}`;
      const value = JSON.stringify({ data, timestamp });
      
      try {
        localStorage.setItem(storageKey, value);
      } catch (storageError) {
        // Se o localStorage estiver cheio, limpar itens antigos
        if (storageError instanceof DOMException && 
            (storageError.name === 'QuotaExceededError' || 
             storageError.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          
          console.warn('localStorage cheio, limpando itens antigos...');
          this.clearOldCacheItems();
          
          // Tentar novamente após limpar
          try {
            localStorage.setItem(storageKey, value);
          } catch (retryError) {
            console.error('Falha ao salvar no localStorage mesmo após limpeza:', retryError);
          }
        } else {
          throw storageError;
        }
      }
    } catch (error) {
      console.error(`Erro ao salvar cache local para ${key}:`, error);
    }
  }

  invalidateCache(key: string) {
    this.cache.delete(key);
    localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}${key}`);
  }
  
  // Limpa itens antigos do cache quando o localStorage está cheio
  private clearOldCacheItems(): void {
    try {
      // Encontrar todas as chaves de cache no localStorage
      const cacheItems: {key: string, timestamp: number}[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const fullKey = localStorage.key(i);
        if (fullKey && fullKey.startsWith(this.STORAGE_KEY_PREFIX)) {
          try {
            const value = localStorage.getItem(fullKey);
            if (value) {
              const { timestamp } = JSON.parse(value);
              cacheItems.push({ key: fullKey, timestamp });
            }
          } catch (err) {
            // Se não conseguir analisar, remover o item
            localStorage.removeItem(fullKey);
          }
        }
      }
      
      // Ordenar por timestamp (mais antigos primeiro)
      cacheItems.sort((a, b) => a.timestamp - b.timestamp);
      
      // Remover os 20% mais antigos
      const itemsToRemove = Math.max(1, Math.floor(cacheItems.length * 0.2));
      for (let i = 0; i < itemsToRemove; i++) {
        if (cacheItems[i]) {
          localStorage.removeItem(cacheItems[i].key);
          // Também remover da memória se estiver lá
          const memoryKey = cacheItems[i].key.substring(this.STORAGE_KEY_PREFIX.length);
          this.cache.delete(memoryKey);
        }
      }
      
      console.log(`Limpeza de cache: ${itemsToRemove} itens removidos`);
    } catch (error) {
      console.error('Erro ao limpar itens antigos do cache:', error);
    }
  }
}


export default CacheService.getInstance();
