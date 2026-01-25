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
        .from('Services')
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
      const tenantId = localStorage.getItem('tenantId');
      
      console.log('ServiceRepository.findAll - IDs:', { barbershopId, tenantId });

      if (!barbershopId && !tenantId) {
        console.warn('ServiceRepository.findAll - Nenhum ID encontrado');
        return [];
      }

      let query = supabase.from('Services').select('*');
      
      // Priorizar filtro por tenant_id se disponível (padrão novo)
      if (tenantId) {
        console.log('ServiceRepository.findAll - Usando filtro tenant_id:', tenantId);
        query = query.eq('tenant_id', tenantId);
      } else if (barbershopId) {
        console.log('ServiceRepository.findAll - Usando filtro barbershopId:', barbershopId);
        // Fallback para filtro por barbershopId (padrão legado)
        query = query.eq('barbershop_id', barbershopId);
      }
      
      if (filters?.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      
      // Filtros de preço
      if (filters?.minPrice) query = query.gte('price', filters.minPrice);
      if (filters?.maxPrice) query = query.lte('price', filters.maxPrice);

      const { data, error } = await query;

      if (error) {
        console.error('ServiceRepository.findAll - Erro Supabase:', error);
        throw error;
      }

      console.log(`ServiceRepository.findAll - Encontrados ${data?.length || 0} serviços`);
      
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
      isActive: data.is_active !== undefined ? data.is_active : (data.isActive !== false),
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
      const tenantId = localStorage.getItem('tenantId');
      
      if (!barbershopId && !tenantId) return [];

      let dbQuery = supabase.from('Services').select('*');
      
      if (tenantId) {
        dbQuery = dbQuery.eq('tenant_id', tenantId);
      } else if (barbershopId) {
        dbQuery = dbQuery.eq('barbershop_id', barbershopId);
      }
      
      const { data, error } = await dbQuery.ilike('name', `%${query}%`);

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
      const tenantId = localStorage.getItem('tenantId');
      
      if (!barbershopId && !tenantId) throw new Error('Barbershop ID required');

      const dbData = {
        name: serviceData.name,
        price: serviceData.price,
        barbershop_id: barbershopId || undefined, 
        tenant_id: tenantId, // Incluir tenant_id se disponível
        duration: serviceData.duration,
        description: serviceData.description,
        is_active: serviceData.isActive,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('Services')
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
       if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
       
       const { data, error } = await supabase
         .from('Services')
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
    const { error } = await supabase.from('Services').delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * Verifica se um serviço existe
   */
  async exists(id: string): Promise<boolean> {
    const { count } = await supabase
      .from('Services')
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