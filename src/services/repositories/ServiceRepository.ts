import type { IRepository, ISearchableRepository, SearchOptions } from '../interfaces/IRepository';
import type { IApiService } from '../interfaces/IApiService';
import type { Service as ServiceType, ServiceFormData } from '@/types';
import { Service } from '@/models/Service';

/**
 * Repositório para serviços seguindo Repository Pattern
 */
export class ServiceRepository implements ISearchableRepository<ServiceType> {
  constructor(private apiService: IApiService) {}

  /**
   * Busca serviço por ID
   */
  async findById(id: string): Promise<ServiceType | null> {
    try {
      const service = await this.apiService.get<ServiceType>(`/api/services/${id}`);
      return service;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Busca todos os serviços com filtros opcionais
   */
  async findAll(filters?: Record<string, unknown>): Promise<ServiceType[]> {
    const queryParams = filters ? this.buildQueryParams(filters) : '';
    const services = await this.apiService.get<ServiceType[]>(`/api/services${queryParams}`);
    return Array.isArray(services) ? services : [];
  }

  /**
   * Busca serviços ativos
   */
  async findActive(): Promise<ServiceType[]> {
    return this.findAll({ isActive: true });
  }

  /**
   * Busca serviços por faixa de preço
   */
  async findByPriceRange(minPrice: number, maxPrice: number): Promise<ServiceType[]> {
    return this.findAll({ 
      minPrice: minPrice,
      maxPrice: maxPrice 
    });
  }

  /**
   * Busca serviços por duração
   */
  async findByDuration(minDuration: number, maxDuration?: number): Promise<ServiceType[]> {
    const filters: Record<string, unknown> = { minDuration };
    if (maxDuration) {
      filters.maxDuration = maxDuration;
    }
    return this.findAll(filters);
  }

  /**
   * Busca serviços com texto
   */
  async search(query: string, options?: SearchOptions): Promise<ServiceType[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (options?.fields) {
      params.append('fields', options.fields.join(','));
    }
    
    if (options?.limit) {
      params.append('limit', String(options.limit));
    }
    
    if (options?.fuzzy) {
      params.append('fuzzy', String(options.fuzzy));
    }
    
    const services = await this.apiService.get<ServiceType[]>(`/api/services/search?${params.toString()}`);
    return Array.isArray(services) ? services : [];
  }

  /**
   * Cria um novo serviço
   */
  async create(serviceData: Omit<ServiceType, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceType> {
    // Valida os dados antes de enviar
    const validatedData = Service.validateFormData(serviceData as ServiceFormData);
    const newService = await this.apiService.post<ServiceType>('/api/services', validatedData);
    return newService;
  }

  /**
   * Atualiza um serviço existente
   */
  async update(id: string, updates: Partial<ServiceType>): Promise<ServiceType> {
    const updatedService = await this.apiService.patch<ServiceType>(`/api/services/${id}`, updates);
    return updatedService;
  }

  /**
   * Remove um serviço
   */
  async delete(id: string): Promise<void> {
    await this.apiService.delete(`/api/services/${id}`);
  }

  /**
   * Verifica se um serviço existe
   */
  async exists(id: string): Promise<boolean> {
    try {
      await this.apiService.get(`/api/services/${id}/exists`);
      return true;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Ativa/desativa serviço
   */
  async toggleActive(id: string, isActive: boolean): Promise<ServiceType> {
    const updatedService = await this.apiService.patch<ServiceType>(`/api/services/${id}`, { isActive });
    return updatedService;
  }

  /**
   * Obtém estatísticas dos serviços
   */
  async getStatistics(): Promise<ServiceStatistics> {
    const stats = await this.apiService.get<ServiceStatistics>('/api/services/statistics');
    return stats;
  }

  /**
   * Obtém serviços mais populares
   */
  async getMostPopular(limit: number = 10): Promise<ServiceType[]> {
    const services = await this.apiService.get<ServiceType[]>(`/api/services/popular?limit=${limit}`);
    return Array.isArray(services) ? services : [];
  }

  /**
   * Obtém serviços por categoria de duração
   */
  async getByCategory(category: 'quick' | 'standard' | 'long'): Promise<ServiceType[]> {
    const durationRanges = {
      quick: { max: 30 },
      standard: { min: 30, max: 120 },
      long: { min: 120 }
    };
    
    const range = durationRanges[category];
    return this.findByDuration(range.min || 0, range.max);
  }

  /**
   * Duplica um serviço existente
   */
  async duplicate(id: string, newName: string): Promise<ServiceType> {
    const originalService = await this.findById(id);
    if (!originalService) {
      throw new Error(`Serviço com ID ${id} não encontrado`);
    }

    const duplicatedData: Omit<ServiceType, 'id' | 'createdAt' | 'updatedAt'> = {
      name: newName,
      description: `${originalService.description} (Cópia)`,
      duration: originalService.duration,
      price: originalService.price,
      isActive: false, // Inicia como inativo por segurança
    };

    return this.create(duplicatedData);
  }

  /**
   * Constrói parâmetros de query para filtros
   */
  private buildQueryParams(filters: Record<string, unknown>): string {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    return params.toString() ? `?${params.toString()}` : '';
  }

  /**
   * Verifica se o erro é de "não encontrado"
   */
  private isNotFoundError(error: unknown): boolean {
    return (
      error instanceof Error &&
      'status' in error &&
      error.status === 404
    );
  }
}

export interface ServiceStatistics {
  total: number;
  active: number;
  inactive: number;
  averagePrice: number;
  averageDuration: number;
  priceRange: {
    min: number;
    max: number;
  };
  durationRange: {
    min: number;
    max: number;
  };
  categoryDistribution: {
    quick: number;
    standard: number;
    long: number;
  };
}