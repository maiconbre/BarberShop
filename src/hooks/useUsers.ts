import { useState, useCallback, useMemo } from 'react';
import { useTenantUserRepository } from './useTenantRepositories';
import { useTenant } from '../contexts/TenantContext';
import type { User as UserType, PaginationOptions, PaginatedResult } from '@/types';

/**
 * Hook para gerenciamento de usuários seguindo SOLID principles
 * Automaticamente inclui contexto de tenant (barbershopId) em todas as operações
 */
export const useUsers = () => {
  const userRepository = useTenantUserRepository();
  const { isValidTenant } = useTenant();
  
  // State for users list
  const [users, setUsers] = useState<UserType[] | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<Error | null>(null);

  // State for paginated users
  const [paginatedUsers, setPaginatedUsers] = useState<PaginatedResult<UserType> | null>(null);
  const [loadingPaginated, setLoadingPaginated] = useState(false);
  const [paginatedError, setPaginatedError] = useState<Error | null>(null);

  // State for create operations
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<Error | null>(null);

  // State for update operations
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<Error | null>(null);

  // State for delete operations
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<Error | null>(null);

  /**
   * Ensure tenant is valid before operations
   */
  const ensureTenant = useCallback(() => {
    if (!isValidTenant || !userRepository) {
      throw new Error('Tenant context is required for user operations');
    }
  }, [isValidTenant, userRepository]);

  /**
   * Carrega todos os usuários
   */
  const loadUsers = useCallback(
    async (filters?: Record<string, unknown>) => {
      try {
        ensureTenant();
        setLoadingUsers(true);
        setUsersError(null);
        const result = await userRepository!.findAll(filters);
        setUsers(result);
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setUsersError(errorObj);
        throw errorObj;
      } finally {
        setLoadingUsers(false);
      }
    },
    [userRepository, ensureTenant]
  );

  /**
   * Carrega usuários com paginação
   */
  const loadPaginatedUsers = useCallback(
    async (options: PaginationOptions) => {
      try {
        ensureTenant();
        setLoadingPaginated(true);
        setPaginatedError(null);
        const result = await userRepository!.findPaginated(options);
        setPaginatedUsers(result);
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setPaginatedError(errorObj);
        throw errorObj;
      } finally {
        setLoadingPaginated(false);
      }
    },
    [userRepository, ensureTenant]
  );

  /**
   * Busca usuário por ID
   */
  const getUserById = useCallback(
    async (id: string) => {
      try {
        ensureTenant();
        return await userRepository!.findById(id);
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        throw errorObj;
      }
    },
    [userRepository, ensureTenant]
  );

  /**
   * Busca usuário por email
   */
  const getUserByEmail = useCallback(
    async (email: string) => {
      return userRepository.findByEmail(email);
    },
    [userRepository]
  );

  /**
   * Busca usuários por role
   */
  const getUsersByRole = useCallback(
    async (role: 'client' | 'barber' | 'admin') => {
      return userRepository.findByRole(role);
    },
    [userRepository]
  );

  /**
   * Cria um novo usuário
   */
  const createUser = useCallback(
    async (userData: Omit<UserType, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        ensureTenant();
        setCreating(true);
        setCreateError(null);
        const newUser = await userRepository!.create(userData);
        
        // Atualiza a lista local se existir
        if (users) {
          await loadUsers();
        }
        
        return newUser;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setCreateError(errorObj);
        throw errorObj;
      } finally {
        setCreating(false);
      }
    },
    [userRepository, users, loadUsers, ensureTenant]
  );

  /**
   * Atualiza um usuário existente
   */
  const updateUser = useCallback(
    async (id: string, updates: Partial<UserType>) => {
      try {
        ensureTenant();
        setUpdating(true);
        setUpdateError(null);
        const updatedUser = await userRepository!.update(id, updates);
        
        // Atualiza a lista local se existir
        if (users) {
          await loadUsers();
        }
        
        return updatedUser;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setUpdateError(errorObj);
        throw errorObj;
      } finally {
        setUpdating(false);
      }
    },
    [userRepository, users, loadUsers, ensureTenant]
  );

  /**
   * Remove um usuário
   */
  const deleteUser = useCallback(
    async (id: string) => {
      try {
        ensureTenant();
        setDeleting(true);
        setDeleteError(null);
        await userRepository!.delete(id);
        
        // Atualiza a lista local se existir
        if (users) {
          await loadUsers();
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setDeleteError(errorObj);
        throw errorObj;
      } finally {
        setDeleting(false);
      }
    },
    [userRepository, users, loadUsers, ensureTenant]
  );

  /**
   * Atualiza senha do usuário
   */
  const updatePassword = useCallback(
    async (id: string, currentPassword: string, newPassword: string) => {
      return userRepository.updatePassword(id, currentPassword, newPassword);
    },
    [userRepository]
  );

  /**
   * Ativa/desativa usuário
   */
  const toggleUserActive = useCallback(
    async (id: string, isActive: boolean) => {
      const updatedUser = await userRepository.toggleActive(id, isActive);
      
      // Atualiza a lista local se existir
      if (users) {
        await loadUsers();
      }
      
      return updatedUser;
    },
    [userRepository, users, loadUsers]
  );

  /**
   * Verifica se um usuário existe
   */
  const checkUserExists = useCallback(
    async (id: string) => {
      return userRepository.exists(id);
    },
    [userRepository]
  );

  return {
    // Data
    users,
    paginatedUsers,
    
    // Loading states
    loadingUsers,
    loadingPaginated,
    creating,
    updating,
    deleting,
    
    // Error states
    usersError,
    paginatedError,
    createError,
    updateError,
    deleteError,
    
    // Actions
    loadUsers,
    loadPaginatedUsers,
    getUserById,
    getUserByEmail,
    getUsersByRole,
    createUser,
    updateUser,
    deleteUser,
    updatePassword,
    toggleUserActive,
    checkUserExists,
  };
};

/**
 * Hook específico para barbeiros
 */
export const useBarbers = () => {
  const userRepository = useTenantUserRepository();
  const { isValidTenant } = useTenant();
  const { getUsersByRole, ...rest } = useUsers();
  
  const loadBarbers = useCallback(async () => {
    if (!isValidTenant || !userRepository) {
      throw new Error('Tenant context is required for barber operations');
    }
    return userRepository.findByRole('barber');
  }, [userRepository, isValidTenant]);

  return {
    ...rest,
    loadBarbers,
  };
};

/**
 * Hook específico para clientes
 */
export const useClients = () => {
  const userRepository = useTenantUserRepository();
  const { isValidTenant } = useTenant();
  const { getUsersByRole, ...rest } = useUsers();
  
  const loadClients = useCallback(async () => {
    if (!isValidTenant || !userRepository) {
      throw new Error('Tenant context is required for client operations');
    }
    return userRepository.findByRole('client');
  }, [userRepository, isValidTenant]);

  return {
    ...rest,
    loadClients,
  };
};