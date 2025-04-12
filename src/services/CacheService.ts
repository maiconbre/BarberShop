interface CacheData<T> {
  data: T;
  timestamp: number;
}

class CacheService {
  private static CACHE_PREFIX = 'barbergr_';
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  static async setCache<T>(key: string, data: T): Promise<void> {
    try {
      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(cacheData));
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
    try {
      const cached = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!cached) return null;

      const cacheData: CacheData<T> = JSON.parse(cached);
      const now = Date.now();

      if (now - cacheData.timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(this.CACHE_PREFIX + key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Erro ao recuperar do cache:', error);
      return null;
    }
  }

  static async fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    forceRefresh = false
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
      const cachedData = await this.getCache<T>(key);
      if (cachedData) return cachedData;
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
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.CACHE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }

  static isExpired(timestamp: number): boolean {
    const now = Date.now();
    return now - timestamp > this.CACHE_DURATION;
  }

  static async updateCache(key: string, updateFn: (prev: any) => any): Promise<void> {
    try {
      const currentData = await this.getCache(key) || [];
      const updatedData = updateFn(currentData);
      await this.setCache(key, updatedData);
    } catch (error) {
      console.error('Erro ao atualizar cache:', error);
    }
  }
}

export default CacheService;
