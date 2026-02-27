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
        effectiveTenantId
      });
      
      if (!effectiveTenantId) {
        return null;
      }

      const { data, error } = await supabase
        .from('Barbers')
        .select('*')
        .eq('id', id)
        .or(`tenant_id.eq.${effectiveTenantId},barbershopId.eq.${effectiveTenantId}`)
        .maybeSingle();

      if (error) {
        console.error('BarberRepository.findById - Error:', error);
        return null;
      }
      
      return data ? this.adaptSupabaseToBarber(data) : null;
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
      email: data.email || '',
      phone: data.whatsapp || data.phone || '',
      pix: data.pix || '',
      specialties: [], 
      isActive: data.is_active !== undefined ? data.is_active : true,
      workingHours: {
        monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
      },
      createdAt: new Date(data.created_at || Date.now()),
      updatedAt: new Date(data.updated_at || Date.now()),
      photo: data.avatar_url || '', 
      rating: 5,
      totalAppointments: 0,
      experience: 'Profissional', 
      bio: data.bio || '',
      profileImage: data.avatar_url || ''
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

      const dbData: any = {
        name: barberData.name,
        whatsapp: barberData.phone,
        pix: (barberData as any).pix || '',
        tenant_id: effectiveTenantId,
        barbershopId: barbershopId || effectiveTenantId,
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
      if ((updates as any).pix !== undefined) dbUpdates.pix = (updates as any).pix;

      const { data, error } = await supabase
        .from('Barbers')
        .update(dbUpdates)
        .eq('id', id)
        .or(`tenant_id.eq.${effectiveTenantId},barbershopId.eq.${effectiveTenantId}`)
        .select()
        .maybeSingle();

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
      .or(`tenant_id.eq.${effectiveTenantId},barbershopId.eq.${effectiveTenantId}`);
      
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
        .from('Barbers')
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