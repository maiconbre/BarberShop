import type { ISearchableRepository, SearchOptions } from '../interfaces/IRepository';
import type { Service as ServiceType } from '@/types';
import { supabase } from '../../config/supabaseConfig';

/**
 * Repositório para serviços usando Supabase direto (MVP)
 */
export class ServiceRepository implements ISearchableRepository<ServiceType> {
  // ApiService dependency removed
  constructor() {}

  /**
   * Busca serviço por ID
   */
  async findById(id: string): Promise<ServiceType | null> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) return null;
      return this.adaptSupabaseServiceToFrontend(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Busca todos os serviços (com filtro básico)
   */
  async findAll(filters?: Record<string, unknown>): Promise<ServiceType[]> {
    try {
      const barbershopId = localStorage.getItem('barbershopId');
      
      if (!barbershopId) return [];

      let query = supabase.from('services').select('*').eq('barbershopId', barbershopId);
      
      if (filters?.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('isActive', filters.isActive);
      }
      
      // Filtros de preço
      if (filters?.minPrice) query = query.gte('price', filters.minPrice);
      if (filters?.maxPrice) query = query.lte('price', filters.maxPrice);

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.adaptSupabaseServiceToFrontend);
    } catch (error) {
      console.error('ServiceRepository: findAll failed:', error);
      return [];
    }
  }

  /**
   * Adapta dados do banco para o frontend
   */
  private adaptSupabaseServiceToFrontend(data: any): ServiceType {
    if (!data) return {} as ServiceType;
    return {
      id: data.id,
      name: data.name,
      price: data.price,
      description: data.description || '', 
      duration: data.duration || 60, 
      isActive: data.isActive !== false,
      createdAt: new Date(data.created_at || Date.now()),
      updatedAt: new Date(data.updated_at || Date.now()),
    };
  }

  /**
   * Busca serviços ativos
   */
  async findActive(): Promise<ServiceType[]> {
    return this.findAll({ isActive: true });
  }

  /**
   * Implementação da interface ISearchableRepository
   */
  async search(query: string, _options?: SearchOptions): Promise<ServiceType[]> {
    try {
      const barbershopId = localStorage.getItem('barbershopId');
      if (!barbershopId) return [];

      // Busca simples por nome usando ilike
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('barbershopId', barbershopId)
        .ilike('name', `%${query}%`);

      if (error) throw error;

      return (data || []).map(this.adaptSupabaseServiceToFrontend);
    } catch (error) {
       console.error('Search failed:', error);
       return [];
    }
  }

  /**
   * Cria um novo serviço
   */
  async create(serviceData: Omit<ServiceType, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceType> {
    try {
      const barbershopId = localStorage.getItem('barbershopId');
      if (!barbershopId) throw new Error('Barbershop ID required');

      const dbData = {
        name: serviceData.name,
        price: serviceData.price,
        barbershopId: barbershopId,
        duration: serviceData.duration,
        description: serviceData.description,
        isActive: serviceData.isActive,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('services')
        .insert(dbData)
        .select()
        .single();
        
      if (error) throw error;
      
      return this.adaptSupabaseServiceToFrontend(data);
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  /**
   * Atualiza um serviço existente
   */
  async update(id: string, updates: Partial<ServiceType>): Promise<ServiceType> {
    try {
       const dbUpdates: any = {
         updated_at: new Date().toISOString()
       };

       if (updates.name !== undefined) dbUpdates.name = updates.name;
       if (updates.price !== undefined) dbUpdates.price = updates.price;
       if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
       if (updates.description !== undefined) dbUpdates.description = updates.description;
       if (updates.isActive !== undefined) dbUpdates.isActive = updates.isActive;
       
       const { data, error } = await supabase
         .from('services')
         .update(dbUpdates)
         .eq('id', id)
         .select()
         .single();
         
       if (error) throw error;
       
       return this.adaptSupabaseServiceToFrontend(data);
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  /**
   * Remove um serviço
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * Verifica se um serviço existe
   */
  async exists(id: string): Promise<boolean> {
    const { count } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('id', id);
    return (count || 0) > 0;
  }

  /**
   * Ativa/desativa serviço
   */
  async toggleActive(id: string, isActive: boolean): Promise<ServiceType> {
    return this.update(id, { isActive });
  }

  // --- Métodos Extras da Interface (Mockados ou Simplificados) ---

  async findByDuration(min: number, max?: number): Promise<ServiceType[]> {
    return this.findAll({ minDuration: min, maxDuration: max });
  }

  async findByPriceRange(min: number, max: number): Promise<ServiceType[]> {
    return this.findAll({ minPrice: min, maxPrice: max });
  }

  async findByName(name: string): Promise<ServiceType[]> {
    return this.findAll({ name });
  }

  // Estatísticas simplificadas (count)
  async getStatistics(): Promise<any> {
    const services = await this.findAll();
    return {
      total: services.length,
      active: services.filter(s => s.isActive).length,
      inactive: services.filter(s => !s.isActive).length,
      averagePrice: 0, 
      averageDuration: 0
    };
  }

  async getMostPopular(_limit: number): Promise<ServiceType[]> {
    // TODO: Implementar lógica de popularidade e limitar resultados
    return this.findAll();
  }

  async duplicate(id: string, newName: string): Promise<ServiceType> {
    const original = await this.findById(id);
    if (!original) throw new Error('Service not found');
    
    return this.create({
      ...original,
      name: newName,
      description: original.description + ' (Cópia)',
      isActive: false
    });
  }

  async getByCategory(_category: string): Promise<ServiceType[]> {
    return this.findAll();
  }

  async findByBarber(_barberId: string): Promise<ServiceType[]> {
    // MVP: Retorna todos (assumindo que barbeiros fazem tudo por enquanto)
    return this.findAll(); 
  }
}