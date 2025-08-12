import { useState, useCallback } from 'react';
import { useBarberRepository } from '@/services/ServiceFactory';
import type { Barber } from '@/types';

/**
 * Hook para gerenciamento de barbeiros baseado na estrutura real do backend
 * 
 * Estrutura real do backend:
 * - Campos: id(string), name, whatsapp, pix + username do User relacionado
 * - IDs formatados ("01", "02", etc.)
 * - Operações CUD com User relacionado (coordenadas)
 * - GET /api/barbers (retorna barber + username)
 * - POST /api/barbers (cria User + Barber com ID sequencial)
 * - PATCH /api/barbers/:id (atualiza User + Barber)
 * - DELETE /api/barbers/:id (remove User + Barber + Appointments)
 */
export const useBarbers = () => {
  const barberRepository = useBarberRepository();
  
  // State for barbers list
  const [barbers, setBarbers] = useState<Barber[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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
   * Carrega todos os barbeiros com filtros opcionais
   * GET /api/barbers (retorna barber + username do User relacionado)
   */
  const loadBarbers = useCallback(
    async (filters?: Record<string, unknown>) => {
      try {
        setLoading(true);
        setError(null);
        const result = await barberRepository.findAll(filters);
        setBarbers(result);
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [barberRepository]
  );

  /**
   * Busca barbeiro por ID formatado ("01", "02", etc.)
   * GET /api/barbers/:id
   */
  const getBarberById = useCallback(
    async (id: string) => {
      return barberRepository.findById(id);
    },
    [barberRepository]
  );

  /**
   * Busca barbeiros ativos (filtro frontend)
   */
  const getActiveBarbers = useCallback(
    async () => {
      return barberRepository.findActive();
    },
    [barberRepository]
  );

  /**
   * Busca barbeiros por serviço (filtro frontend)
   */
  const getBarbersByService = useCallback(
    async (serviceId: string) => {
      return barberRepository.findByService(serviceId);
    },
    [barberRepository]
  );

  /**
   * Busca barbeiros por nome (filtro frontend)
   */
  const getBarbersByName = useCallback(
    async (name: string) => {
      return barberRepository.findByName(name);
    },
    [barberRepository]
  );

  /**
   * Busca barbeiros por especialidade (filtro frontend)
   */
  const getBarbersBySpecialty = useCallback(
    async (specialty: string) => {
      return barberRepository.findBySpecialty(specialty);
    },
    [barberRepository]
  );

  /**
   * Cria um novo barbeiro
   * POST /api/barbers (cria User + Barber com ID sequencial)
   * Requer autenticação
   */
  const createBarber = useCallback(
    async (barberData: Omit<Barber, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        setCreating(true);
        setCreateError(null);
        const newBarber = await barberRepository.create(barberData);
        
        // Atualiza a lista local se existir
        if (barbers) {
          await loadBarbers();
        }
        
        return newBarber;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setCreateError(errorObj);
        throw errorObj;
      } finally {
        setCreating(false);
      }
    },
    [barberRepository, barbers, loadBarbers]
  );

  /**
   * Atualiza um barbeiro existente
   * PATCH /api/barbers/:id (atualiza User + Barber)
   * Requer autenticação
   */
  const updateBarber = useCallback(
    async (id: string, updates: Partial<Barber>) => {
      try {
        setUpdating(true);
        setUpdateError(null);
        const updatedBarber = await barberRepository.update(id, updates);
        
        // Atualiza a lista local se existir
        if (barbers) {
          await loadBarbers();
        }
        
        return updatedBarber;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setUpdateError(errorObj);
        throw errorObj;
      } finally {
        setUpdating(false);
      }
    },
    [barberRepository, barbers, loadBarbers]
  );

  /**
   * Remove um barbeiro
   * DELETE /api/barbers/:id (remove User + Barber + Appointments)
   * Requer autenticação
   */
  const deleteBarber = useCallback(
    async (id: string) => {
      try {
        setDeleting(true);
        setDeleteError(null);
        await barberRepository.delete(id);
        
        // Atualiza a lista local se existir
        if (barbers) {
          await loadBarbers();
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setDeleteError(errorObj);
        throw errorObj;
      } finally {
        setDeleting(false);
      }
    },
    [barberRepository, barbers, loadBarbers]
  );

  /**
   * Verifica se um barbeiro existe
   */
  const checkBarberExists = useCallback(
    async (id: string) => {
      return barberRepository.exists(id);
    },
    [barberRepository]
  );

  /**
   * Atualiza informações de contato do barbeiro
   * Atualiza o campo whatsapp no backend
   */
  const updateContact = useCallback(
    async (id: string, whatsapp: string) => {
      try {
        setUpdating(true);
        setUpdateError(null);
        const updatedBarber = await barberRepository.updateContact(id, whatsapp);
        
        // Atualiza a lista local se existir
        if (barbers) {
          await loadBarbers();
        }
        
        return updatedBarber;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setUpdateError(errorObj);
        throw errorObj;
      } finally {
        setUpdating(false);
      }
    },
    [barberRepository, barbers, loadBarbers]
  );

  /**
   * Atualiza informações de pagamento do barbeiro
   * Atualiza o campo pix no backend
   */
  const updatePaymentInfo = useCallback(
    async (id: string, pix: string) => {
      try {
        setUpdating(true);
        setUpdateError(null);
        const updatedBarber = await barberRepository.updatePaymentInfo(id, pix);
        
        // Atualiza a lista local se existir
        if (barbers) {
          await loadBarbers();
        }
        
        return updatedBarber;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setUpdateError(errorObj);
        throw errorObj;
      } finally {
        setUpdating(false);
      }
    },
    [barberRepository, barbers, loadBarbers]
  );

  /**
   * Ativa/desativa barbeiro (operação frontend-only)
   * Backend não tem campo isActive, simulado no frontend
   */
  const toggleActive = useCallback(
    async (id: string, isActive: boolean) => {
      try {
        setUpdating(true);
        setUpdateError(null);
        const updatedBarber = await barberRepository.toggleActive(id, isActive);
        
        // Atualiza a lista local se existir
        if (barbers) {
          await loadBarbers();
        }
        
        return updatedBarber;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setUpdateError(errorObj);
        throw errorObj;
      } finally {
        setUpdating(false);
      }
    },
    [barberRepository, barbers, loadBarbers]
  );

  /**
   * Obtém estatísticas dos barbeiros
   */
  const getStatistics = useCallback(
    async () => {
      return barberRepository.getStatistics();
    },
    [barberRepository]
  );

  return {
    // Data
    barbers,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    
    // Error states
    error,
    createError,
    updateError,
    deleteError,
    
    // Actions - Basic CRUD
    loadBarbers,
    getBarberById,
    createBarber,
    updateBarber,
    deleteBarber,
    checkBarberExists,
    
    // Actions - Filtering (frontend filters)
    getActiveBarbers,
    getBarbersByService,
    getBarbersByName,
    getBarbersBySpecialty,
    
    // Actions - Backend-specific operations
    updateContact, // Updates whatsapp field
    updatePaymentInfo, // Updates pix field
    toggleActive, // Frontend-only operation
    
    // Actions - Statistics
    getStatistics,
  };
};