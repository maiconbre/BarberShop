import type { IRepository } from '../interfaces/IRepository';
import type { Barber } from '@/types';
import { supabase } from '../../config/supabaseConfig';

/**
 * Repository for barbers using Supabase directly (MVP)
 */
export class BarberRepository implements IRepository<Barber> {
  // ApiService dependency removed
  constructor() {}

  /**
   * Find barber by ID
   */
  async findById(id: string): Promise<Barber | null> {
    try {
      const barbershopId = localStorage.getItem('barbershopId');
      const tenantId = localStorage.getItem('tenantId');
      const effectiveTenantId = tenantId || barbershopId;
      
      console.log('BarberRepository.findById - Debug:', {
        id,
        barbershopId,
        tenantId,
        effectiveTenantId
      });
      
      if (!effectiveTenantId) {
        console.warn('BarberRepository.findById - No tenant ID available');
        return null;
      }

      const { data, error } = await supabase
        .from('Barbers')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', effectiveTenantId)
        .single();

      if (error) {
        console.error('BarberRepository.findById - Error:', error);
        return null;
      }
      
      console.log('BarberRepository.findById - Success:', data);
      return this.adaptSupabaseToBarber(data);
    } catch (error) {
      console.error('BarberRepository.findById - Exception:', error);
      return null;
    }
  }

  /**
   * Find all barbers
   */
  async findAll(filters?: Record<string, unknown>): Promise<Barber[]> {
    try {
      // Priorizar barbershopId dos filtros (vem do TenantAwareRepository)
      // Fallback para localStorage se não vier nos filtros
      const filterBarbershopId = filters?.barbershopId as string | undefined;
      const localBarbershopId = localStorage.getItem('barbershopId');
      const localTenantId = localStorage.getItem('tenantId');
      const effectiveTenantId = filterBarbershopId || localTenantId || localBarbershopId;
      
      console.log('BarberRepository.findAll - Debug:', {
        filterBarbershopId,
        localBarbershopId,
        localTenantId,
        effectiveTenantId,
        filters
      });
      
      if (!effectiveTenantId) {
        console.warn('BarberRepository.findAll - No tenant ID available');
        return [];
      }

      // CRITICAL FIX: Search by tenant_id OR barbershopId (legacy data has only barbershopId)
      let query = supabase
        .from('Barbers')
        .select('*')
        .or(`tenant_id.eq.${effectiveTenantId},barbershopId.eq.${effectiveTenantId}`);
      
      if (filters?.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }
      
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      const { data, error } = await query;

      if (error) {
        console.error('BarberRepository.findAll - Error:', error);
        throw error;
      }

      console.log(`BarberRepository.findAll - Found ${data?.length || 0} barbers`);
      return (data || []).map(b => this.adaptSupabaseToBarber(b));
    } catch (error) {
      console.error('BarberRepository.findAll - Exception:', error);
      return [];
    }
  }

  /**
   * Adapt Supabase barber to frontend Barber interface
   */
  private adaptSupabaseToBarber(data: any): Barber {
    return {
      id: data.id,
      name: data.name,
      email: '', // Campo de UI
      phone: data.whatsapp || '',
      specialties: [], 
      isActive: data.is_active !== undefined ? data.is_active : true,
      workingHours: {
        monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
      },
      createdAt: new Date(data.created_at || Date.now()),
      updatedAt: new Date(data.updated_at || Date.now()),
      photo: '', 
      rating: 5,
      totalAppointments: 0,
      experience: 'Profissional', 
      bio: '',
      profileImage: ''
    };
  }

  /**
   * Create a new barber
   */
  async create(barberData: Omit<Barber, 'id' | 'createdAt' | 'updatedAt'>): Promise<Barber> {
    try {
      const barbershopId = localStorage.getItem('barbershopId');
      const tenantId = localStorage.getItem('tenantId');
      const effectiveTenantId = tenantId || barbershopId;
      
      console.log('BarberRepository.create - Debug:', {
        barbershopId,
        tenantId,
        effectiveTenantId
      });
      
      if (!effectiveTenantId) {
        throw new Error('Tenant ID required - please reload the page');
      }

      const dbData = {
        name: barberData.name,
        whatsapp: barberData.phone,
        tenant_id: effectiveTenantId,
        is_active: barberData.isActive !== undefined ? barberData.isActive : true,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('Barbers')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        console.error('BarberRepository.create - Error:', error);
        throw error;
      }

      console.log('BarberRepository.create - Success:', data);
      return this.adaptSupabaseToBarber(data);
    } catch (error) {
      console.error('BarberRepository.create - Exception:', error);
      throw error;
    }
  }

  /**
   * Update an existing barber
   */
  async update(id: string, updates: Partial<Barber>): Promise<Barber> {
    try {
      const barbershopId = localStorage.getItem('barbershopId');
      const tenantId = localStorage.getItem('tenantId');
      const effectiveTenantId = tenantId || barbershopId;
      
      console.log('BarberRepository.update - Debug:', {
        id,
        barbershopId,
        tenantId,
        effectiveTenantId,
        updates
      });
      
      if (!effectiveTenantId) {
        throw new Error('Tenant ID required for update');
      }
      
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name) dbUpdates.name = updates.name;
      if (updates.phone) dbUpdates.whatsapp = updates.phone;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('Barbers')
        .update(dbUpdates)
        .eq('id', id)
        .eq('tenant_id', effectiveTenantId)
        .select()
        .single();

      if (error) {
        console.error('BarberRepository.update - Error:', error);
        throw error;
      }

      console.log('BarberRepository.update - Success:', data);
      return this.adaptSupabaseToBarber(data);
    } catch (error) {
      console.error('BarberRepository.update - Exception:', error);
      throw error;
    }
  }

  /**
   * Delete a barber
   */
  async delete(id: string): Promise<void> {
    const barbershopId = localStorage.getItem('barbershopId');
    const tenantId = localStorage.getItem('tenantId');
    const effectiveTenantId = tenantId || barbershopId;
    
    console.log('BarberRepository.delete - Debug:', {
      id,
      barbershopId,
      tenantId,
      effectiveTenantId
    });
    
    if (!effectiveTenantId) {
      throw new Error('Tenant ID required for delete');
    }
    
    const { error } = await supabase
      .from('Barbers')
      .delete()
      .eq('id', id)
      .eq('tenant_id', effectiveTenantId);
      
    if (error) {
      console.error('BarberRepository.delete - Error:', error);
      throw error;
    }
    
    console.log('BarberRepository.delete - Success');
  }

  /**
   * Check if barber exists
   */
  async exists(id: string): Promise<boolean> {
    const { count } = await supabase
        .from('barbers')
        .select('*', { count: 'exact', head: true })
        .eq('id', id);
    return (count || 0) > 0;
  }

  // --- Métodos Extras ---

  async findActive(): Promise<Barber[]> {
    return this.findAll();
  }

  async findByName(name: string): Promise<Barber[]> {
    return this.findAll({ name });
  }

  async findBySpecialty(_specialty: string): Promise<Barber[]> {
    return this.findAll();
  }
}