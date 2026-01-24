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
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return this.adaptSupabaseToBarber(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Find all barbers
   */
  async findAll(filters?: Record<string, unknown>): Promise<Barber[]> {
    try {
      const barbershopId = localStorage.getItem('barbershopId');
      
      if (!barbershopId) return [];

      let query = supabase.from('barbers').select('*').eq('barbershopId', barbershopId);
      
      if (filters?.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }
      
      if (filters?.isActive !== undefined) {
         // Ajuste se o banco não tiver coluna isActive, filtrar no JS depois
         // Mas vamos assumir que o frontend lida com isso se falhar
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(b => this.adaptSupabaseToBarber(b));
    } catch (error) {
      console.error('BarberRepository: findAll failed:', error);
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
      isActive: true, // Assumindo ativo
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
      if (!barbershopId) throw new Error('Barbershop ID required');

      const dbData = {
        name: barberData.name,
        whatsapp: barberData.phone,
        barbershopId: barbershopId,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('barbers')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      return this.adaptSupabaseToBarber(data);
    } catch (error) {
      console.error('Error creating barber:', error);
      throw error;
    }
  }

  /**
   * Update an existing barber
   */
  async update(id: string, updates: Partial<Barber>): Promise<Barber> {
    try {
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name) dbUpdates.name = updates.name;
      if (updates.phone) dbUpdates.whatsapp = updates.phone;

      const { data, error } = await supabase
        .from('barbers')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.adaptSupabaseToBarber(data);
    } catch (error) {
     console.error('Error updating barber:', error);
     throw error;
    }
  }

  /**
   * Delete a barber
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('barbers').delete().eq('id', id);
    if (error) throw error;
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