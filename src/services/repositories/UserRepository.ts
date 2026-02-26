import type { IPaginatedRepository, PaginationOptions, PaginatedResult } from '../interfaces/IRepository';
import type { User as UserType } from '@/types';
import { supabase } from '../../config/supabaseConfig';

/**
 * Repositório para usuários usando Supabase diretamente
 * Simplificado para trabalhar apenas com a tabela 'profiles' e 'auth'
 */
export class UserRepository implements IPaginatedRepository<UserType> {
  // ApiService dependency removed
  constructor() {}

  /**
   * Busca usuário por ID (consulta tabela profiles)
   */
  async findById(id: string): Promise<UserType | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) return null;
      
      return this.mapProfileToUser(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Busca todos os usuários com filtros
   */
  async findAll(filters?: Record<string, unknown>): Promise<UserType[]> {
    try {
      let query = supabase.from('profiles').select('*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && key !== 'barbershopId') {
             query = query.eq(key, value);
          }
          // Filtro por barbearia
          if (key === 'barbershopId') {
            query = query.eq('barbershop_id', value);
          }
        });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(this.mapProfileToUser);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  }

  /**
   * Busca usuários com paginação
   */
  async findPaginated(options: PaginationOptions): Promise<PaginatedResult<UserType>> {
    try {
      let query = supabase.from('profiles').select('*', { count: 'exact' });
      
      // Aplicar filtros
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'barbershopId') {
              query = query.eq('barbershop_id', value);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      // Aplicar ordenação
      if (options.sortBy) {
        query = query.order(options.sortBy, { ascending: options.sortOrder === 'asc' });
      }

      // Aplicar paginação
      const page = options.page || 1;
      const limit = options.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, count, error } = await query.range(from, to);

      if (error) throw error;

      return {
        data: (data || []).map(this.mapProfileToUser),
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Erro na paginação de usuários:', error);
      return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    }
  }

  /**
   * Cria um novo usuário (Geralmente criado via Auth, aqui cria perfil)
   */
  async create(_userData: Partial<UserType>): Promise<UserType> {
    // Nota: Em Supabase, a criação de usuário é feita via Auth.SignUp
    // Este método pode ser usado para criar o perfil se ele não existir
    throw new Error('Use auth triggers ou registerBarbershop para criar usuários');
  }

  /**
   * Atualiza um usuário existente
   */
  async update(id: string, updates: Partial<UserType>): Promise<UserType> {
    try {
      // Mapear campos do frontend para o banco
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.role) dbUpdates.role = updates.role;
      // Adicione outros campos conforme necessário

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      return this.mapProfileToUser(data);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  /**
   * Remove um usuário
   */
  async delete(id: string): Promise<void> {
    // Remover perfil (Auth user deve ser removido via Admin API, não acessível aqui)
    await supabase.from('profiles').delete().eq('id', id);
  }

  /**
   * Verifica se um usuário existe
   */
  async exists(id: string): Promise<boolean> {
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('id', id);
    return (count || 0) > 0;
  }

  /**
   * Busca usuário por email
   */
  async findByEmail(email: string): Promise<UserType | null> {
    const { data } = await supabase.from('profiles').select('*').eq('email', email).single();
    return data ? this.mapProfileToUser(data) : null;
  }

  /**
   * Helper para mapear perfil do banco para tipo User
   */
  private mapProfileToUser(profile: any): UserType {
    if (!profile) return {} as UserType;
    
    return {
      id: profile.id,
      name: profile.name || '',
      email: profile.email || '',
      role: profile.role || 'client',
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at || profile.created_at),
      // Campos extras
      isActive: true, // Assumindo ativo se tem perfil
    } as unknown as UserType;
  }

  // Métodos interfaceados não utilizados
  async findByRole(role: string): Promise<UserType[]> {
    return this.findAll({ role });
  }
  
  async updatePassword(): Promise<void> {
    throw new Error('Use supabase.auth.updateUser para mudar senhas');
  }
  
  async toggleActive(): Promise<UserType> {
    throw new Error('Not implemented');
  }
}