import { useState, useCallback, useMemo } from 'react';
import { useCommentRepository } from '../services/ServiceFactory';
import { useTenant } from '../contexts/TenantContext';
import { createTenantAwareRepository } from '../services/TenantAwareRepository';
import { createTenantAwareCache } from '../services/TenantAwareCache';
import type { PublicComment } from '../types';

/**
 * Hook para gerenciamento de comentários baseado na estrutura real do backend
 * Automaticamente inclui contexto de tenant (barbershopId) em todas as operações
 * 
 * Estrutura real do backend:
 * - Campos: name, comment, status(enum: pending/approved/rejected)
 * - GET /api/comments?status=X (filtro por status)
 * - GET /api/comments/admin (todos os comentários, requer admin)
 * - POST /api/comments (criar comentário)
 * - PATCH /api/comments/:id (atualizar status, requer admin)
 * - DELETE /api/comments/:id (remover comentário, requer admin)
 * - Multi-tenant: todas as operações incluem barbershopId automaticamente
 */
export const useComments = () => {
  const baseRepository = useCommentRepository();
  const { barbershopId, isValidTenant } = useTenant();
  
  // Create tenant-aware repository and cache
  const tenantRepository = useMemo(() => {
    return createTenantAwareRepository(baseRepository, () => barbershopId);
  }, [baseRepository, barbershopId]);

  const tenantCache = useMemo(() => {
    return createTenantAwareCache(() => barbershopId);
  }, [barbershopId]);
  
  // State for comments list
  const [comments, setComments] = useState<PublicComment[] | null>(null);
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
   * Ensure tenant is valid before operations
   */
  const ensureTenant = useCallback(() => {
    if (!isValidTenant) {
      throw new Error('Valid tenant context is required for this operation');
    }
  }, [isValidTenant]);

  /**
   * Carrega todos os comentários com filtros opcionais (com contexto de tenant)
   * GET /api/comments?status=X
   * Automaticamente inclui barbershopId
   */
  const loadComments = useCallback(
    async (filters?: Record<string, unknown>) => {
      try {
        ensureTenant();
        setLoading(true);
        setError(null);
        
        const cacheKey = `comments:${JSON.stringify(filters || {})}`;
        
        // Try cache first
        const cached = tenantCache.get<PublicComment[]>(cacheKey);
        if (cached) {
          setComments(cached);
          return cached;
        }
        
        const result = await tenantRepository.findAll(filters);
        setComments(result);
        
        // Cache the result
        tenantCache.set(cacheKey, result, { ttl: 2 * 60 * 1000 }); // 2 minutes
        
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [tenantRepository, tenantCache, ensureTenant]
  );

  /**
   * Busca comentário por ID (com contexto de tenant)
   */
  const getCommentById = useCallback(
    async (id: string) => {
      ensureTenant();
      return tenantRepository.findById(id);
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Busca comentários por status (com contexto de tenant)
   * GET /api/comments?status=X
   */
  const getCommentsByStatus = useCallback(
    async (status: 'pending' | 'approved' | 'rejected') => {
      ensureTenant();
      
      const cacheKey = `comments:status:${status}`;
      const cached = tenantCache.get<PublicComment[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const result = await tenantRepository.findAll({ status });
      tenantCache.set(cacheKey, result, { ttl: 2 * 60 * 1000 });
      
      return result;
    },
    [tenantRepository, tenantCache, ensureTenant]
  );

  /**
   * Busca comentários aprovados para exibição pública (com contexto de tenant)
   * GET /api/comments?status=approved
   */
  const getApprovedComments = useCallback(
    async () => {
      return getCommentsByStatus('approved');
    },
    [getCommentsByStatus]
  );

  /**
   * Busca comentários pendentes para revisão admin (com contexto de tenant)
   * GET /api/comments?status=pending
   */
  const getPendingComments = useCallback(
    async () => {
      return getCommentsByStatus('pending');
    },
    [getCommentsByStatus]
  );

  /**
   * Busca todos os comentários para admin (com contexto de tenant)
   * GET /api/comments/admin
   */
  const getAllCommentsForAdmin = useCallback(
    async () => {
      ensureTenant();
      return tenantRepository.findAll();
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Cria um novo comentário (com contexto de tenant)
   * POST /api/comments (status padrão: pending)
   * Automaticamente inclui barbershopId
   */
  const createComment = useCallback(
    async (commentData: Omit<PublicComment, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
      try {
        ensureTenant();
        setCreating(true);
        setCreateError(null);
        
        const newComment = await tenantRepository.create({
          ...commentData,
          status: 'pending'
        } as Omit<PublicComment, 'id' | 'createdAt' | 'updatedAt'>);
        
        // Clear cache to force refresh
        tenantCache.clearTenantCache();
        
        // Atualiza a lista local se existir
        if (comments) {
          await loadComments();
        }
        
        return newComment;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setCreateError(errorObj);
        throw errorObj;
      } finally {
        setCreating(false);
      }
    },
    [tenantRepository, tenantCache, comments, loadComments, ensureTenant]
  );

  /**
   * Atualiza um comentário existente (com contexto de tenant)
   * PATCH /api/comments/:id (principalmente para mudanças de status, requer admin)
   * Verifica se pertence ao tenant atual
   */
  const updateComment = useCallback(
    async (id: string, updates: Partial<PublicComment>) => {
      try {
        ensureTenant();
        setUpdating(true);
        setUpdateError(null);
        
        const updatedComment = await tenantRepository.update(id, updates);
        
        // Clear cache to force refresh
        tenantCache.clearTenantCache();
        
        // Atualiza a lista local se existir
        if (comments) {
          await loadComments();
        }
        
        return updatedComment;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setUpdateError(errorObj);
        throw errorObj;
      } finally {
        setUpdating(false);
      }
    },
    [tenantRepository, tenantCache, comments, loadComments, ensureTenant]
  );

  /**
   * Atualiza status do comentário (com contexto de tenant)
   * PATCH /api/comments/:id
   */
  const updateCommentStatus = useCallback(
    async (id: string, status: 'pending' | 'approved' | 'rejected') => {
      return updateComment(id, { status });
    },
    [updateComment]
  );

  /**
   * Remove um comentário (com contexto de tenant)
   * DELETE /api/comments/:id
   * Verifica se pertence ao tenant atual
   */
  const deleteComment = useCallback(
    async (id: string) => {
      try {
        ensureTenant();
        setDeleting(true);
        setDeleteError(null);
        
        await tenantRepository.delete(id);
        
        // Clear cache to force refresh
        tenantCache.clearTenantCache();
        
        // Atualiza a lista local se existir
        if (comments) {
          await loadComments();
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setDeleteError(errorObj);
        throw errorObj;
      } finally {
        setDeleting(false);
      }
    },
    [tenantRepository, tenantCache, comments, loadComments, ensureTenant]
  );

  /**
   * Verifica se um comentário existe (com contexto de tenant)
   */
  const checkCommentExists = useCallback(
    async (id: string) => {
      ensureTenant();
      return tenantRepository.exists(id);
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Aprova comentário (com contexto de tenant)
   */
  const approveComment = useCallback(
    async (id: string) => {
      return updateCommentStatus(id, 'approved');
    },
    [updateCommentStatus]
  );

  /**
   * Rejeita comentário (com contexto de tenant)
   */
  const rejectComment = useCallback(
    async (id: string) => {
      return updateCommentStatus(id, 'rejected');
    },
    [updateCommentStatus]
  );

  /**
   * Reseta comentário para pendente (com contexto de tenant)
   */
  const resetCommentToPending = useCallback(
    async (id: string) => {
      return updateCommentStatus(id, 'pending');
    },
    [updateCommentStatus]
  );

  /**
   * Obtém estatísticas dos comentários (com contexto de tenant)
   */
  const getStatistics = useCallback(
    async () => {
      ensureTenant();
      
      const cacheKey = 'comments:statistics';
      const cached = tenantCache.get<{ total: number; pending: number; approved: number; rejected: number }>(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Calculate stats from all comments
      const allComments = await tenantRepository.findAll();
      
      const stats = {
        total: allComments.length,
        pending: allComments.filter(c => c.status === 'pending').length,
        approved: allComments.filter(c => c.status === 'approved').length,
        rejected: allComments.filter(c => c.status === 'rejected').length,
      };
      
      tenantCache.set(cacheKey, stats, { ttl: 5 * 60 * 1000 }); // 5 minutes
      
      return stats;
    },
    [tenantRepository, tenantCache, ensureTenant]
  );

  return {
    // Data
    comments,
    
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
    
    // Tenant context
    isValidTenant,
    barbershopId,
    
    // Actions - Basic CRUD (tenant-aware)
    loadComments,
    getCommentById,
    createComment,
    updateComment,
    deleteComment,
    checkCommentExists,
    
    // Actions - Status filtering (tenant-aware, using backend endpoints)
    getCommentsByStatus, // GET /api/comments?status=X + tenant context
    getApprovedComments, // GET /api/comments?status=approved + tenant context
    getPendingComments, // GET /api/comments?status=pending + tenant context
    getAllCommentsForAdmin, // GET /api/comments/admin (requires admin) + tenant context
    
    // Actions - Status management (tenant-aware, admin operations)
    updateCommentStatus, // PATCH /api/comments/:id (requires admin) + tenant context
    approveComment, // Admin operation + tenant context
    rejectComment, // Admin operation + tenant context
    resetCommentToPending, // Admin operation + tenant context
    
    // Actions - Statistics (tenant-aware)
    getStatistics, // Admin operation + tenant context
  };
};