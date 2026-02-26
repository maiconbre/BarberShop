// Configuração do cliente Supabase
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'barbershop-app'
    }
  }
});

// Tipos para as tabelas do banco
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

export interface Barbershop {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  plan_type: 'free' | 'pro';
  settings: Record<string, any>;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: string;
  name: string;
  barbershopId: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Barber {
  id: string;
  name: string;
  whatsapp: string;
  pix: string;
  userId?: string;
  barbershopId: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  barbershopId: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
  barberId: string;
  barberName: string;
  price: number;
  wppclient: string;
  barbershopId: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  name: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  barbershopId: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

// Funções auxiliares para autenticação
export const auth = {
  // Login com email e senha
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  // Registro com email e senha
  signUp: async (email: string, password: string, metadata?: Record<string, any>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    return { data, error };
  },

  // Logout
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Obter usuário atual
  getCurrentUser: () => {
    return supabase.auth.getUser();
  },

  // Obter sessão atual
  getCurrentSession: () => {
    return supabase.auth.getSession();
  },

  // Escutar mudanças de autenticação
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Funções auxiliares para RPC
export const rpc = {
  // Criar tenant
  createTenant: async (name: string, slug: string) => {
    const { data, error } = await supabase.rpc('create_tenant', {
      tenant_name: name,
      tenant_slug: slug
    });
    return { data, error };
  },

  // Obter tenant por slug
  getTenantBySlug: async (slug: string) => {
    const { data, error } = await supabase.rpc('get_tenant_by_slug', {
      tenant_slug: slug
    });
    return { data, error };
  },

  // Criar barbeiro
  createBarber: async (name: string, whatsapp: string, pix: string, userId?: string) => {
    const { data, error } = await supabase.rpc('create_barber', {
      p_name: name,
      p_whatsapp: whatsapp,
      p_pix: pix,
      p_user_id: userId
    });
    return { data, error };
  },

  // Obter barbeiros do tenant
  getTenantBarbers: async () => {
    const { data, error } = await supabase.rpc('get_tenant_barbers');
    return { data, error };
  },

  // Criar serviço
  createService: async (name: string, price: number) => {
    const { data, error } = await supabase.rpc('create_service', {
      p_name: name,
      p_price: price
    });
    return { data, error };
  },

  // Obter serviços do tenant
  getTenantServices: async () => {
    const { data, error } = await supabase.rpc('get_tenant_services');
    return { data, error };
  },

  // Criar agendamento
  createAppointment: async (appointment: {
    clientName: string;
    serviceName: string;
    date: string;
    time: string;
    barberId: string;
    barberName: string;
    price: number;
    wppclient: string;
  }) => {
    const { data, error } = await supabase.rpc('create_appointment', {
      p_client_name: appointment.clientName,
      p_service_name: appointment.serviceName,
      p_date: appointment.date,
      p_time: appointment.time,
      p_barber_id: appointment.barberId,
      p_barber_name: appointment.barberName,
      p_price: appointment.price,
      p_wppclient: appointment.wppclient
    });
    return { data, error };
  },

  // Obter agendamentos do tenant
  getTenantAppointments: async (limit = 50, offset = 0) => {
    const { data, error } = await supabase.rpc('get_tenant_appointments', {
      p_limit: limit,
      p_offset: offset
    });
    return { data, error };
  },

  // Criar comentário
  createComment: async (name: string, comment: string, tenantId: string) => {
    const { data, error } = await supabase.rpc('create_comment', {
      p_name: name,
      p_comment: comment,
      p_tenant_id: tenantId
    });
    return { data, error };
  },

  // Obter comentários do tenant
  getTenantComments: async (tenantId: string, status = 'approved') => {
    const { data, error } = await supabase.rpc('get_tenant_comments', {
      p_tenant_id: tenantId,
      p_status: status
    });
    return { data, error };
  }
};

// Funções auxiliares para queries diretas
export const db = {
  // Obter dados de uma tabela com filtros
  from: (table: string) => supabase.from(table),

  // Storage para uploads
  storage: supabase.storage
};

export default supabase;