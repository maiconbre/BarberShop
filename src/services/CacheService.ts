interface CacheData<T> {
  data: T;
  timestamp: number;
  size?: number;
}

class CacheService {
  private static CACHE_PREFIX = 'barbergr_';
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private static MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private static memoryCache = new Map<string, CacheData<any>>();
  private static lastCleanup = Date.now();
  private static CLEANUP_INTERVAL = 60 * 1000; // 1 minuto

  private static cleanupIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
      this.cleanup();
      this.lastCleanup = now;
    }
  }

  private static cleanup(): void {
    // Limpa cache expirado da memória
    for (const [key, value] of this.memoryCache.entries()) {
      if (this.isExpired(value.timestamp)) {
        this.memoryCache.delete(key);
      }
    }

    // Limpa localStorage se necessário
    try {
      let totalSize = 0;
      const entries: [string, number][] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.CACHE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            const size = value.length * 2; // Aproximação do tamanho em bytes
            totalSize += size;
            entries.push([key, size]);
          }
        }
      }

      if (totalSize > this.MAX_CACHE_SIZE) {
        entries.sort((a, b) => a[1] - b[1]);
        for (const [key] of entries) {
          if (totalSize <= this.MAX_CACHE_SIZE) break;
          const value = localStorage.getItem(key);
          if (value) {
            totalSize -= value.length * 2;
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Erro durante limpeza do cache:', error);
    }
  }

  static async setCache<T>(key: string, data: T): Promise<void> {
    this.cleanupIfNeeded();

    try {
      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now(),
        size: JSON.stringify(data).length * 2
      };

      // Salva na memória primeiro
      this.memoryCache.set(this.CACHE_PREFIX + key, cacheData);

      // Tenta salvar no localStorage
      try {
        localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(cacheData));
      } catch (storageError) {
        // Se falhar por falta de espaço, tenta limpar e salvar novamente
        this.cleanup();
        localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(cacheData));
      }
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
    }
  }

  static async getCacheTimestamp(key: string): Promise<number> {
    try {
      const cached = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!cached) return 0;

      const cacheData: CacheData<any> = JSON.parse(cached);
      return cacheData.timestamp;
    } catch (error) {
      console.error('Erro ao recuperar timestamp do cache:', error);
      return 0;
    }
  }

  static async getCache<T>(key: string): Promise<T | null> {
    this.cleanupIfNeeded();

    try {
      // Tenta recuperar da memória primeiro
      const memoryData = this.memoryCache.get(this.CACHE_PREFIX + key);
      if (memoryData && !this.isExpired(memoryData.timestamp)) {
        return memoryData.data;
      }

      // Se não estiver na memória ou estiver expirado, tenta localStorage
      const cached = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!cached) return null;

      const cacheData: CacheData<T> = JSON.parse(cached);
      
      if (this.isExpired(cacheData.timestamp)) {
        this.memoryCache.delete(this.CACHE_PREFIX + key);
        localStorage.removeItem(this.CACHE_PREFIX + key);
        return null;
      }

      // Atualiza o cache em memória
      this.memoryCache.set(this.CACHE_PREFIX + key, cacheData);
      return cacheData.data;
    } catch (error) {
      console.error('Erro ao recuperar do cache:', error);
      return null;
    }
  }

  static async fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    forceRefresh = false,
    customDuration?: number
  ): Promise<T> {
    if (!forceRefresh) {
      const cachedData = await this.getCache<T>(key);
      if (cachedData) return cachedData;
    }

    try {
      const data = await fetchFn();
      await this.setCache(key, data);
      return data;
    } catch (error) {
      // Em caso de erro, tenta usar cache expirado como fallback
      const cachedData = await this.getCache<T>(key);
      if (cachedData) {
        console.warn('Usando cache expirado como fallback devido a erro na requisição');
        return cachedData;
      }
      throw error;
    }
  }

  static getLastUpdateTime(key: string): number | null {
    try {
      const cached = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!cached) return null;
      
      const cacheData: CacheData<any> = JSON.parse(cached);
      return cacheData.timestamp;
    } catch {
      return null;
    }
  }

  static setLastUpdateTime(key: string, timestamp: number): void {
    const cacheKey = this.CACHE_PREFIX + key;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cacheData: CacheData<any> = JSON.parse(cached);
        cacheData.timestamp = timestamp;
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      }
    } catch (error) {
      console.error('Erro ao atualizar timestamp:', error);
    }
  }

  static clearCache(): void {
    try {
      // Limpa memória
      this.memoryCache.clear();

      // Limpa localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }

  static isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.CACHE_DURATION;
  }

  static async updateCache(key: string, updateFn: (prev: any) => any): Promise<void> {
    try {
      const currentData = await this.getCache(key);
      if (currentData) {
        const updatedData = updateFn(currentData);
        await this.setCache(key, updatedData);
      }
    } catch (error) {
      console.error('Erro ao atualizar cache:', error);
    }
  }
}

export default CacheService;
