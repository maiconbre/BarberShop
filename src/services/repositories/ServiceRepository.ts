import type { ISearchableRepository, SearchOptions } from '../interfaces/IRepository';
import type { IApiService } from '../interfaces/IApiService';
import type { Service as ServiceType, ServiceFormData } from '@/types';
import type { BackendService } from '@/types/backend';
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
      const backendService = await this.apiService.get<BackendService>(`/api/services/${id}`);
      return backendService ? this.adaptBackendServiceToFrontend(backendService) : null;
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
    const backendServices = await this.apiService.get<BackendService[]>(`/api/services${queryParams}`);
    const services = Array.isArray(backendServices) ? backendServices : [];
    
    // Convert backend services to frontend format
    return services.map(this.adaptBackendServiceToFrontend);
  }

  /**
   * Busca serviços ativos
   */
  async findActive(): Promise<ServiceType[]> {
    return this.findAll({ isActive: true });
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
    
    // Adapta para formato do backend (apenas name e price são suportados)
    const backendData = {
      name: validatedData.name,
      price: validatedData.price,
    };
    
    const backendService = await this.apiService.post<BackendService>('/api/services', backendData);
    return this.adaptBackendServiceToFrontend(backendService);
  }

  /**
   * Atualiza um serviço existente
   */
  async update(id: string, updates: Partial<ServiceType>): Promise<ServiceType> {
    // Adapta updates para formato do backend (apenas name e price são suportados)
    const backendUpdates: Partial<BackendService> = {};
    
    if (updates.name !== undefined) {
      backendUpdates.name = updates.name;
    }
    if (updates.price !== undefined) {
      backendUpdates.price = updates.price;
    }
    
    const backendService = await this.apiService.patch<BackendService>(`/api/services/${id}`, backendUpdates);
    return this.adaptBackendServiceToFrontend(backendService);
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
   * Busca serviços por barbeiro usando endpoint específico
   * GET /api/services/barber/:barberId
   */
  async findByBarber(barberId: string): Promise<ServiceType[]> {
    try {
      const backendServices = await this.apiService.get<BackendService[]>(`/api/services/barber/${barberId}`);
      const services = Array.isArray(backendServices) ? backendServices : [];
      
      // Convert backend services to frontend format
      return services.map(this.adaptBackendServiceToFrontend);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Associa barbeiros a um serviço usando endpoint específico
   * POST /api/services/:id/barbers (requer autenticação)
   */
  async associateBarbers(serviceId: string, barberIds: string[]): Promise<void> {
    try {
      await this.apiService.post(`/api/services/${serviceId}/barbers`, {
        barberIds: barberIds
      });
    } catch (error) {
      throw new Error(`Erro ao associar barbeiros ao serviço: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Busca serviços por nome (filtro frontend)
   */
  async findByName(name: string): Promise<ServiceType[]> {
    const allServices = await this.findAll();
    return allServices.filter(service => 
      service.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  /**
   * Busca serviços por faixa de preço (filtro frontend otimizado)
   */
  async findByPriceRange(minPrice: number, maxPrice: number): Promise<ServiceType[]> {
    const allServices = await this.findAll();
    return allServices.filter(service => 
      service.price >= minPrice && service.price <= maxPrice
    );
  }

  /**
   * Busca serviços associados a um barbeiro específico (filtro frontend)
   * Nota: Este método requer que o backend retorne informações de associação
   * ou pode ser implementado fazendo uma chamada para findByBarber
   */
  async findByAssociatedBarber(barberId: string): Promise<ServiceType[]> {
    return this.findByBarber(barberId);
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

  /**
   * Adapta serviço do backend para formato do frontend
   */
  private adaptBackendServiceToFrontend(backendService: BackendService): ServiceType {
    return {
      id: backendService.id,
      name: backendService.name,
      price: backendService.price,
      // Campos não disponíveis no backend - usar valores padrão
      description: '', // Backend não tem description
      duration: 60, // Backend não tem duration - assumir 60 minutos
      isActive: true, // Backend não tem isActive - assumir ativo
      createdAt: new Date(), // Backend não retorna timestamps
      updatedAt: new Date(), // Backend não retorna timestamps
    };
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