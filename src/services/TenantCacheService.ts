import { BarbershopData } from './BarbershopService';

/**
 * Interface para dados do cache de tenant
 */
interface TenantCacheData {
  barbershopData: BarbershopData;
  timestamp: number;
  expiresAt: number;
}

/**
 * Serviço de cache para dados de tenant (barbearias)
 * Usa localStorage para persistir entre reloads
 * Implementa TTL (Time To Live) configurável
 */
export class TenantCacheService {
  private static readonly CACHE_PREFIX = 'tenant_cache_';
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos em ms
  private static readonly BARBERSHOP_ID_KEY = 'current_barbershop_id';
  private static readonly BARBERSHOP_SLUG_KEY = 'current_barbershop_slug';

  /**
   * Salvar dados de barbearia no cache
   */
  static set(slug: string, data: BarbershopData, ttl: number = this.DEFAULT_TTL): void {
    try {
      const cacheData: TenantCacheData = {
        barbershopData: data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl
      };

      const key = this.CACHE_PREFIX + slug;
      localStorage.setItem(key, JSON.stringify(cacheData));
      
      // Também salvar referências rápidas
      localStorage.setItem(this.BARBERSHOP_ID_KEY, data.id);
      localStorage.setItem(this.BARBERSHOP_SLUG_KEY, slug);

      console.log(`[TenantCache] Cached data for slug: ${slug}, expires in ${ttl}ms`);
    } catch (error) {
      console.error('[TenantCache] Error saving to cache:', error);
    }
  }

  /**
   * Obter dados de barbearia do cache
   * Retorna null se não existir ou estiver expirado
   */
  static get(slug: string): BarbershopData | null {
    try {
      const key = this.CACHE_PREFIX + slug;
      const cachedString = localStorage.getItem(key);

      if (!cachedString) {
        console.log(`[TenantCache] No cache found for slug: ${slug}`);
        return null;
      }

      const cached: TenantCacheData = JSON.parse(cachedString);

      // Verificar se expirou
      if (Date.now() > cached.expiresAt) {
        console.log(`[TenantCache] Cache expired for slug: ${slug}`);
        this.remove(slug);
        return null;
      }

      console.log(`[TenantCache] Cache hit for slug: ${slug}`);
      return cached.barbershopData;
    } catch (error) {
      console.error('[TenantCache] Error reading from cache:', error);
      return null;
    }
  }

  /**
   * Remover dados de barbearia do cache
   */
  static remove(slug: string): void {
    try {
      const key = this.CACHE_PREFIX + slug;
      localStorage.removeItem(key);
      console.log(`[TenantCache] Removed cache for slug: ${slug}`);
    } catch (error) {
      console.error('[TenantCache] Error removing from cache:', error);
    }
  }

  /**
   * Limpar todo o cache de tenants
   */
  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      const tenantKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

      tenantKeys.forEach(key => localStorage.removeItem(key));
      
      localStorage.removeItem(this.BARBERSHOP_ID_KEY);
      localStorage.removeItem(this.BARBERSHOP_SLUG_KEY);

      console.log(`[TenantCache] Cleared ${tenantKeys.length} cached tenants`);
    } catch (error) {
      console.error('[TenantCache] Error clearing cache:', error);
    }
  }

  /**
   * Obter ID da barbearia atual do cache rápido
   */
  static getCurrentBarbershopId(): string | null {
    return localStorage.getItem(this.BARBERSHOP_ID_KEY);
  }

  /**
   * Obter slug da barbearia atual do cache rápido
   */
  static getCurrentBarbershopSlug(): string | null {
    return localStorage.getItem(this.BARBERSHOP_SLUG_KEY);
  }

  /**
   * Invalidar cache de um tenant específico (útil após updates)
   */
  static invalidate(slug: string): void {
    this.remove(slug);
    console.log(`[TenantCache] Invalidated cache for slug: ${slug}`);
  }

  /**
   * Verificar se existe cache válido para um slug
   */
  static has(slug: string): boolean {
    return this.get(slug) !== null;
  }

  /**
   * Atualizar parcialmente dados do cache (merge)
   */
  static update(slug: string, partialData: Partial<BarbershopData>): void {
    const existing = this.get(slug);
    if (existing) {
      const updated = { ...existing, ...partialData };
      this.set(slug, updated);
      console.log(`[TenantCache] Updated cache for slug: ${slug}`);
    }
  }

  /**
   * Limpar caches expirados (pode ser chamado periodicamente)
   */
  static cleanExpired(): void {
    try {
      const keys = Object.keys(localStorage);
      const tenantKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      let cleaned = 0;
      tenantKeys.forEach(key => {
        try {
          const cachedString = localStorage.getItem(key);
          if (cachedString) {
            const cached: TenantCacheData = JSON.parse(cachedString);
            if (Date.now() > cached.expiresAt) {
              localStorage.removeItem(key);
              cleaned++;
            }
          }
        } catch {
          // Se houver erro ao parsear, remover o item
          localStorage.removeItem(key);
          cleaned++;
        }
      });

      if (cleaned > 0) {
        console.log(`[TenantCache] Cleaned ${cleaned} expired cache entries`);
      }
    } catch (error) {
      console.error('[TenantCache] Error cleaning expired caches:', error);
    }
  }
}

// Limpar caches expirados quando o serviço é importado
TenantCacheService.cleanExpired();
