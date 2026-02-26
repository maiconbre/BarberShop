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
      const barbershopId = localStorage.getItem('barbershopId');
      const tenantId = localStorage.getItem('tenantId');
      const effectiveTenantId = tenantId || barbershopId;
      
      console.log('ServiceRepository.findById - Debug:', {
        id,
        barbershopId,
        tenantId,
        effectiveTenantId
      });
      
      if (!effectiveTenantId) {
        console.warn('ServiceRepository.findById - No tenant ID available');
        return null;
      }

      const { data, error } = await supabase
        .from('Services')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', effectiveTenantId) // Add tenant_id filter for multi-tenant isolation
        .single();
      
      if (error) {
        console.error('ServiceRepository.findById - Error:', error);
        return null;
      }
      
      console.log('ServiceRepository.findById - Success:', data);
      return this.adaptSupabaseServiceToFrontend(data);
    } catch (error) {
      console.error('ServiceRepository.findById - Exception:', error);
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
      
      // Use tenantId if available, otherwise use barbershopId as tenantId
      const effectiveTenantId = tenantId || barbershopId;
      console.log('ServiceRepository.findAll - Using tenant_id:', effectiveTenantId);
      query = query.eq('tenant_id', effectiveTenantId);
      
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
      
      // Fetch barber associations for all services
      const services = (data || []).map(this.adaptSupabaseServiceToFrontend);
      
      // Get barber counts for all services
      if (services.length > 0) {
        const serviceIds = services.map(s => s.id);
        const { data: associations } = await supabase
          .from('service_barbers')
          .select('service_id, barber_id')
          .in('service_id', serviceIds);
        
        // Add barber count to each service
        services.forEach(service => {
          const barberCount = (associations || []).filter(a => a.service_id === service.id).length;
          (service as any).barbers = Array(barberCount).fill(null); // Create array with correct length
        });
      }
      
      return services;
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

      // Use tenantId if available, otherwise use barbershopId as tenantId
      const effectiveTenantId = tenantId || barbershopId;

      let dbQuery = supabase
        .from('Services')
        .select('*')
        .eq('tenant_id', effectiveTenantId);
      
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
      
      console.log('ServiceRepository.create - IDs:', { barbershopId, tenantId });
      
      if (!barbershopId && !tenantId) {
        console.error('ServiceRepository.create - Missing IDs in localStorage:', {
          barbershopId,
          tenantId,
          allKeys: Object.keys(localStorage)
        });
        throw new Error('Barbershop ID required - please reload the page');
      }

      // Use tenantId if available, otherwise use barbershopId as tenantId
      const effectiveTenantId = tenantId || barbershopId;

      const dbData = {
        name: serviceData.name,
        price: serviceData.price,
        tenant_id: effectiveTenantId, // Use tenant_id column (not barbershop_id)
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
       
       // Get tenant_id for RLS
       const barbershopId = localStorage.getItem('barbershopId');
       const tenantId = localStorage.getItem('tenantId');
       const effectiveTenantId = tenantId || barbershopId;
       
       console.log('ServiceRepository.update - Debug:', {
         id,
         barbershopId,
         tenantId,
         effectiveTenantId,
         updates
       });
       
       if (!effectiveTenantId) {
         throw new Error('Tenant ID required for update');
       }
       
       const { data, error } = await supabase
         .from('Services')
         .update(dbUpdates)
         .eq('id', id)
         .eq('tenant_id', effectiveTenantId) // Add tenant_id for RLS
         .select()
         .single();
         
       if (error) {
         console.error('ServiceRepository.update - Error:', error);
         throw error;
       }
       
       console.log('ServiceRepository.update - Success:', data);
       
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
    // Get tenant_id for RLS
    const barbershopId = localStorage.getItem('barbershopId');
    const tenantId = localStorage.getItem('tenantId');
    const effectiveTenantId = tenantId || barbershopId;
    
    console.log('ServiceRepository.delete - Debug:', {
      id,
      barbershopId,
      tenantId,
      effectiveTenantId
    });
    
    if (!effectiveTenantId) {
      throw new Error('Tenant ID required for delete');
    }
    
    const { error } = await supabase
      .from('Services')
      .delete()
      .eq('id', id)
      .eq('tenant_id', effectiveTenantId); // Add tenant_id for RLS
      
    if (error) {
      console.error('ServiceRepository.delete - Error:', error);
      throw error;
    }
    
    console.log('ServiceRepository.delete - Success');
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

  /**
   * Associa barbeiros a um serviço
   */
  async associateBarbers(serviceId: string, barberIds: string[]): Promise<void> {
    try {
      let tenantId = localStorage.getItem('tenantId');
      const barbershopId = localStorage.getItem('barbershopId');
      
      // Use barbershopId as fallback if tenantId is not available
      if (!tenantId && barbershopId) {
        tenantId = barbershopId;
        console.log('⚠️ Using barbershopId as tenantId for association:', tenantId);
      }
      
      if (!tenantId) throw new Error('Tenant ID required');

      // Remove associações existentes
      await supabase
        .from('service_barbers')
        .delete()
        .eq('service_id', serviceId);

      // Adiciona novas associações
      if (barberIds.length > 0) {
        const associations = barberIds.map(barberId => ({
          service_id: serviceId,
          barber_id: barberId,
          tenant_id: null // Use null instead of invalid tenant_id
        }));

        const { error } = await supabase
          .from('service_barbers')
          .insert(associations);

        if (error) throw error;
        
        console.log('✅ Successfully associated', barberIds.length, 'barber(s) to service');
      }
    } catch (error) {
      console.error('Error associating barbers:', error);
      throw error;
    }
  }

  /**
   * Obtém barbeiros associados a um serviço
   */
  async getServiceBarbers(serviceId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('service_barbers')
        .select('barber_id')
        .eq('service_id', serviceId);

      if (error) throw error;

      return (data || []).map(row => row.barber_id);
    } catch (error) {
      console.error('Error getting service barbers:', error);
      return [];
    }
  }
}