import type { IRepository, IPaginatedRepository, PaginationOptions, PaginatedResult } from '../interfaces/IRepository';
import type { IApiService } from '../interfaces/IApiService';
import type { User as UserType } from '@/types';
import { User } from '@/models/User';

/**
 * Repositório para usuários seguindo Repository Pattern
 */
export class UserRepository implements IPaginatedRepository<UserType> {
  constructor(private apiService: IApiService) {}

  /**
   * Busca usuário por ID
   */
  async findById(id: string): Promise<UserType | null> {
    try {
      const userData = await this.apiService.get<UserType>(`/api/users/${id}`);
      return userData;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Busca todos os usuários com filtros opcionais
   */
  async findAll(filters?: Record<string, unknown>): Promise<UserType[]> {
    const queryParams = filters ? this.buildQueryParams(filters) : '';
    const users = await this.apiService.get<UserType[]>(`/api/users${queryParams}`);
    return Array.isArray(users) ? users : [];
  }

  /**
   * Busca usuários com paginação
   */
  async findPaginated(options: PaginationOptions): Promise<PaginatedResult<UserType>> {
    const queryParams = this.buildPaginationParams(options);
    const result = await this.apiService.get<PaginatedResult<UserType>>(`/api/users${queryParams}`);
    return result;
  }

  /**
   * Cria um novo usuário
   */
  async create(userData: Omit<UserType, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserType> {
    // Valida os dados antes de enviar
    const validatedData = User.validateRegisterData(userData);
    const newUser = await this.apiService.post<UserType>('/api/users', validatedData);
    return newUser;
  }

  /**
   * Atualiza um usuário existente
   */
  async update(id: string, updates: Partial<UserType>): Promise<UserType> {
    const updatedUser = await this.apiService.patch<UserType>(`/api/users/${id}`, updates);
    return updatedUser;
  }

  /**
   * Remove um usuário
   */
  async delete(id: string): Promise<void> {
    await this.apiService.delete(`/api/users/${id}`);
  }

  /**
   * Verifica se um usuário existe
   */
  async exists(id: string): Promise<boolean> {
    try {
      await this.apiService.get(`/api/users/${id}/exists`);
      return true;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Busca usuário por email
   */
  async findByEmail(email: string): Promise<UserType | null> {
    try {
      const user = await this.apiService.get<UserType>(`/api/users/email/${encodeURIComponent(email)}`);
      return user;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Busca usuários por role
   */
  async findByRole(role: 'client' | 'barber' | 'admin'): Promise<UserType[]> {
    const users = await this.apiService.get<UserType[]>(`/api/users?role=${role}`);
    return Array.isArray(users) ? users : [];
  }

  /**
   * Atualiza senha do usuário
   */
  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    await this.apiService.patch(`/api/users/${id}/password`, {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Ativa/desativa usuário
   */
  async toggleActive(id: string, isActive: boolean): Promise<UserType> {
    const updatedUser = await this.apiService.patch<UserType>(`/api/users/${id}`, { isActive });
    return updatedUser;
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
   * Constrói parâmetros de paginação
   */
  private buildPaginationParams(options: PaginationOptions): string {
    const params = new URLSearchParams();
    
    params.append('page', String(options.page));
    params.append('limit', String(options.limit));
    
    if (options.sortBy) {
      params.append('sortBy', options.sortBy);
    }
    
    if (options.sortOrder) {
      params.append('sortOrder', options.sortOrder);
    }
    
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    return `?${params.toString()}`;
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
}