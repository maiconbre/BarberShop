<<<<<<< Updated upstream
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
=======
import { logger } from '../utils/logger';
import { getAdaptiveConfig } from '../config/apiConfig';

/**
 * CacheService simplificado e otimizado
 * Combina cache em memória e localStorage de forma inteligente
 */
class SimplifiedCacheService {
  private readonly config = getAdaptiveConfig();
  private readonly prefix = 'barbergr_';
  
  // Cache em memória para acesso rápido
  private memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  // Controle de limpeza automática
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startAutoCleanup();
  }

  /**
   * Verifica se um item do cache é válido
   */
  private isValid(item: { timestamp: number; ttl: number }): boolean {
    return Date.now() - item.timestamp < item.ttl;
  }

  /**
   * Salva dados no cache (memória e localStorage)
   */
  async set(key: string, data: any, options: { ttl?: number } = {}): Promise<void> {
    const cacheKey = this.prefix + key;
    const ttl = options.ttl || this.config.CACHE_TTL;
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    // Salva em memória
    this.memoryCache.set(cacheKey, item);
    
    // Salva em localStorage
    try {
      localStorage.setItem(cacheKey, JSON.stringify(item));
    } catch (error) {
      logger.cacheWarn('Erro ao salvar no localStorage, mantendo apenas em memória:', error);
      // Se localStorage falhar, continua com cache em memória
    }
  }

  /**
   * Busca dados do cache (memória primeiro, depois localStorage)
   */
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.prefix + key;
    
    // 1. Verifica cache em memória primeiro
    const memoryItem = this.memoryCache.get(cacheKey);
    if (memoryItem && this.isValid(memoryItem)) {
      return memoryItem.data;
    }
    
    // 2. Se não encontrou em memória, verifica localStorage
    try {
      const stored = localStorage.getItem(cacheKey);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      if (this.isValid(parsed)) {
        // Atualiza cache em memória para próximas consultas
        this.memoryCache.set(cacheKey, parsed);
        return parsed.data;
      } else {
        // Remove item expirado
        localStorage.removeItem(cacheKey);
        return null;
      }
    } catch (error) {
      logger.cacheError('Erro ao ler cache:', error);
>>>>>>> Stashed changes
      return null;
    }
  }

<<<<<<< Updated upstream
  static async fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    forceRefresh = false,
    customDuration?: number
  ): Promise<T> {
    if (!forceRefresh) {
      const cachedData = await this.getCache<T>(key);
      if (cachedData) return cachedData;
=======
  /**
   * Verifica se existe no cache
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Remove item do cache
   */
  async delete(key: string): Promise<void> {
    const cacheKey = this.prefix + key;
    
    this.memoryCache.delete(cacheKey);
    
    try {
      localStorage.removeItem(cacheKey);
    } catch (error) {
      logger.cacheError('Erro ao remover do localStorage:', error);
    }
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    // Limpa memória
    this.memoryCache.clear();
    
    // Limpa localStorage
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
      keys.forEach(key => localStorage.removeItem(key));
      logger.cacheInfo('Cache limpo completamente');
    } catch (error) {
      logger.cacheError('Erro ao limpar localStorage:', error);
    }
  }

  /**
   * Obtém timestamp de um item do cache
   */
  async getTimestamp(key: string): Promise<number | null> {
    const cacheKey = this.prefix + key;
    
    // Verifica memória primeiro
    const memoryItem = this.memoryCache.get(cacheKey);
    if (memoryItem) {
      return memoryItem.timestamp;
    }
    
    // Verifica localStorage
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.timestamp;
      }
    } catch (error) {
      logger.cacheError('Erro ao obter timestamp:', error);
    }
    
    return null;
  }

  /**
   * Busca com fallback para cache
   */
  async fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: { ttl?: number; forceRefresh?: boolean } = {}
  ): Promise<T> {
    // Se não forçar refresh, tenta cache primeiro
    if (!options.forceRefresh) {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
>>>>>>> Stashed changes
    }
    
    // Busca dados frescos
    try {
      const data = await fetchFn();
      await this.setCache(key, data);
      return data;
    } catch (error) {
<<<<<<< Updated upstream
      // Em caso de erro, tenta usar cache expirado como fallback
      const cachedData = await this.getCache<T>(key);
      if (cachedData) {
        console.warn('Usando cache expirado como fallback devido a erro na requisição');
        return cachedData;
=======
      // Em caso de erro, tenta usar cache mesmo que expirado
      const cached = await this.get<T>(key);
      if (cached !== null) {
        logger.cacheWarn('Usando cache expirado devido a erro na requisição');
        return cached;
>>>>>>> Stashed changes
      }
      throw error;
    }
  }

<<<<<<< Updated upstream
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
=======
  /**
   * Inicia limpeza automática do cache
   */
  private startAutoCleanup(): void {
    // Limpa cache expirado a cada 30 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 30 * 60 * 1000);
  }

  /**
   * Remove itens expirados do cache
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Limpa memória
    for (const [key, item] of this.memoryCache.entries()) {
      if (!this.isValid(item)) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }
    
    // Limpa localStorage
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
      for (const key of keys) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (!this.isValid(parsed)) {
              localStorage.removeItem(key);
              cleanedCount++;
            }
          }
        } catch {
          // Remove itens corrompidos
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    } catch (error) {
      logger.cacheError('Erro na limpeza automática:', error);
    }
    
    if (cleanedCount > 0) {
      logger.cacheDebug(`Limpeza automática: ${cleanedCount} itens removidos`);
    }
  }

  /**
   * Para a limpeza automática
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats() {
    const memorySize = this.memoryCache.size;
    let localStorageSize = 0;
    
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
      localStorageSize = keys.length;
    } catch (error) {
      logger.cacheError('Erro ao obter estatísticas:', error);
    }
    
    return {
      memorySize,
      localStorageSize,
      totalSize: memorySize + localStorageSize
    };
  }
}

// Create and export singleton instance
const cacheService = new SimplifiedCacheService();

// Legacy static methods for backward compatibility
export const LegacyCacheService = {
  setCache: <T>(key: string, data: T) => cacheService.set(key, data),
  getCache: <T>(key: string) => cacheService.get<T>(key),
  getCacheTimestamp: (key: string) => cacheService.getTimestamp(key),
  clearCache: () => cacheService.clear(),
  fetchWithCache: <T>(
    key: string,
    fetchFn: () => Promise<T>,
    forceRefresh = false
  ) => cacheService.fetchWithCache(key, fetchFn, { forceRefresh }),
  getLastUpdateTime: (key: string) => cacheService.getTimestamp(key),
};

// Export both the class and singleton for flexibility
export { SimplifiedCacheService as CacheService, cacheService };
export default cacheService;
>>>>>>> Stashed changes
