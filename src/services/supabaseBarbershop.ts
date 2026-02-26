// Serviço para operações de barbearias usando Supabase
import { supabase, rpc } from '../config/supabaseConfig';
import type { Barbershop, Barber, Service, Appointment, Comment } from '../config/supabaseConfig';

export interface CreateBarbershopData {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  openingHours?: Record<string, any>;
}

export interface CreateBarberData {
  name: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  imageUrl?: string;
  isActive?: boolean;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  duration: number;
  price: number;
  isActive?: boolean;
}

export interface CreateAppointmentData {
  barberId: string;
  serviceId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  scheduledFor: string;
  notes?: string;
}

export interface CreateCommentData {
  appointmentId: string;
  rating: number;
  comment?: string;
}

class SupabaseBarbershopService {
  // Operações de Barbearia
  async createBarbershop(data: CreateBarbershopData): Promise<{ barbershop: Barbershop | null; error: string | null }> {
    try {
      const { data: barbershop, error } = await supabase
        .from('Barbershops')
        .insert({
          name: data.name,
          description: data.description,
          address: data.address,
          phone: data.phone,
          email: data.email,
          image_url: data.imageUrl,
          opening_hours: data.openingHours
        })
        .select()
        .single();

      if (error) {
        return { barbershop: null, error: error.message };
      }

      return { barbershop, error: null };
    } catch (error) {
      return { barbershop: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getBarbershops(): Promise<{ barbershops: Barbershop[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('Barbershops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { barbershops: [], error: error.message };
      }

      return { barbershops: data || [], error: null };
    } catch (error) {
      return { barbershops: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getBarbershopById(id: string): Promise<{ barbershop: Barbershop | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('Barbershops')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { barbershop: null, error: error.message };
      }

      return { barbershop: data, error: null };
    } catch (error) {
      return { barbershop: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateBarbershop(id: string, data: Partial<CreateBarbershopData>): Promise<{ barbershop: Barbershop | null; error: string | null }> {
    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
      if (data.openingHours !== undefined) updateData.opening_hours = data.openingHours;

      const { data: barbershop, error } = await supabase
        .from('Barbershops')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { barbershop: null, error: error.message };
      }

      return { barbershop, error: null };
    } catch (error) {
      return { barbershop: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Operações de Barbeiros
  async createBarber(barbershopId: string, data: CreateBarberData): Promise<{ barber: Barber | null; error: string | null }> {
    try {
      const { data: barber, error } = await rpc.createBarber({
        p_barbershop_id: barbershopId,
        p_name: data.name,
        p_email: data.email,
        p_phone: data.phone,
        p_specialties: data.specialties,
        p_image_url: data.imageUrl,
        p_is_active: data.isActive ?? true
      });

      if (error) {
        return { barber: null, error: error.message };
      }

      return { barber: barber as Barber, error: null };
    } catch (error) {
      return { barber: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getTenantBarbers(): Promise<{ barbers: Barber[]; error: string | null }> {
    try {
      const { data, error } = await rpc.getTenantBarbers();

      if (error) {
        return { barbers: [], error: error.message };
      }

      return { barbers: data as Barber[] || [], error: null };
    } catch (error) {
      return { barbers: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getBarbersByBarbershop(barbershopId: string): Promise<{ barbers: Barber[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('Barbers')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        return { barbers: [], error: error.message };
      }

      return { barbers: data || [], error: null };
    } catch (error) {
      return { barbers: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateBarber(id: string, data: Partial<CreateBarberData>): Promise<{ barber: Barber | null; error: string | null }> {
    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.specialties !== undefined) updateData.specialties = data.specialties;
      if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      const { data: barber, error } = await supabase
        .from('Barbers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { barber: null, error: error.message };
      }

      return { barber, error: null };
    } catch (error) {
      return { barber: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Operações de Serviços
  async createService(data: CreateServiceData): Promise<{ service: Service | null; error: string | null }> {
    try {
      const { data: service, error } = await rpc.createService({
        p_name: data.name,
        p_description: data.description,
        p_duration: data.duration,
        p_price: data.price,
        p_is_active: data.isActive ?? true
      });

      if (error) {
        return { service: null, error: error.message };
      }

      return { service: service as Service, error: null };
    } catch (error) {
      return { service: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getTenantServices(): Promise<{ services: Service[]; error: string | null }> {
    try {
      const { data, error } = await rpc.getTenantServices();

      if (error) {
        return { services: [], error: error.message };
      }

      return { services: data as Service[] || [], error: null };
    } catch (error) {
      return { services: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateService(id: string, data: Partial<CreateServiceData>): Promise<{ service: Service | null; error: string | null }> {
    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      const { data: service, error } = await supabase
        .from('Services')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { service: null, error: error.message };
      }

      return { service, error: null };
    } catch (error) {
      return { service: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Operações de Agendamentos
  async createAppointment(data: CreateAppointmentData): Promise<{ appointment: Appointment | null; error: string | null }> {
    try {
      const { data: appointment, error } = await rpc.createAppointment({
        p_barber_id: data.barberId,
        p_service_id: data.serviceId,
        p_client_name: data.clientName,
        p_client_email: data.clientEmail,
        p_client_phone: data.clientPhone,
        p_scheduled_for: data.scheduledFor,
        p_notes: data.notes
      });

      if (error) {
        return { appointment: null, error: error.message };
      }

      return { appointment: appointment as Appointment, error: null };
    } catch (error) {
      return { appointment: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getTenantAppointments(startDate?: string, endDate?: string): Promise<{ appointments: Appointment[]; error: string | null }> {
    try {
      const { data, error } = await rpc.getTenantAppointments({
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) {
        return { appointments: [], error: error.message };
      }

      return { appointments: data as Appointment[] || [], error: null };
    } catch (error) {
      return { appointments: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAppointmentsByBarber(barberId: string, startDate?: string, endDate?: string): Promise<{ appointments: Appointment[]; error: string | null }> {
    try {
      let query = supabase
        .from('Appointments')
        .select(`
          *,
          Barbers(name, image_url),
          Services(name, duration, price)
        `)
        .eq('barber_id', barberId)
        .order('scheduled_for');

      if (startDate) {
        query = query.gte('scheduled_for', startDate);
      }
      if (endDate) {
        query = query.lte('scheduled_for', endDate);
      }

      const { data, error } = await query;

      if (error) {
        return { appointments: [], error: error.message };
      }

      return { appointments: data || [], error: null };
    } catch (error) {
      return { appointments: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateAppointmentStatus(id: string, status: string): Promise<{ appointment: Appointment | null; error: string | null }> {
    try {
      const { data: appointment, error } = await supabase
        .from('Appointments')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { appointment: null, error: error.message };
      }

      return { appointment, error: null };
    } catch (error) {
      return { appointment: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Operações de Comentários
  async createComment(data: CreateCommentData): Promise<{ comment: Comment | null; error: string | null }> {
    try {
      const { data: comment, error } = await rpc.createComment({
        p_appointment_id: data.appointmentId,
        p_rating: data.rating,
        p_comment: data.comment
      });

      if (error) {
        return { comment: null, error: error.message };
      }

      return { comment: comment as Comment, error: null };
    } catch (error) {
      return { comment: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getTenantComments(): Promise<{ comments: Comment[]; error: string | null }> {
    try {
      const { data, error } = await rpc.getTenantComments();

      if (error) {
        return { comments: [], error: error.message };
      }

      return { comments: data as Comment[] || [], error: null };
    } catch (error) {
      return { comments: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getCommentsByBarbershop(barbershopId: string): Promise<{ comments: Comment[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('Comments')
        .select(`
          *,
          Appointments(
            client_name,
            Barbers(name),
            Services(name)
          )
        `)
        .eq('Appointments.Barbers.barbershop_id', barbershopId)
        .order('created_at', { ascending: false });

      if (error) {
        return { comments: [], error: error.message };
      }

      return { comments: data || [], error: null };
    } catch (error) {
      return { comments: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Instância singleton do serviço de barbearia
export const barbershopService = new SupabaseBarbershopService();
export default barbershopService;