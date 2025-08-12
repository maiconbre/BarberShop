import { useState, useCallback } from 'react';
import { useCommentRepository } from '@/services/ServiceFactory';
import type { PublicComment } from '@/types';

/**
 * Hook para gerenciamento de comentários baseado na estrutura real do backend
 * 
 * Estrutura real do backend:
 * - Campos: name, comment, status(enum: pending/approved/rejected)
 * - GET /api/comments?status=X (filtro por status)
 * - GET /api/comments/admin (todos os comentários, requer admin)
 * - POST /api/comments (criar comentário)
 * - PATCH /api/comments/:id (atualizar status, requer admin)
 * - DELETE /api/comments/:id (remover comentário, requer admin)
 */
export const useComments = () => {
  const commentRepository = useCommentRepository();
  
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
   * Carrega todos os comentários com filtros opcionais
   * GET /api/comments?status=X
   */
  const loadComments = useCallback(
    async (filters?: Record<string, unknown>) => {
      try {
        setLoading(true);
        setError(null);
        const result = await commentRepository.findAll(filters);
        setComments(result);
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [commentRepository]
  );

  /**
   * Busca comentário por ID
   */
  const getCommentById = useCallback(
    async (id: string) => {
      return commentRepository.findById(id);
    },
    [commentRepository]
  );

  /**
   * Busca comentários por status usando endpoint específico
   * GET /api/comments?status=X
   */
  const getCommentsByStatus = useCallback(
    async (status: 'pending' | 'approved' | 'rejected') => {
      return commentRepository.findByStatus(status);
    },
    [commentRepository]
  );

  /**
   * Busca comentários aprovados para exibição pública
   * GET /api/comments?status=approved
   */
  const getApprovedComments = useCallback(
    async () => {
      return commentRepository.findApproved();
    },
    [commentRepository]
  );

  /**
   * Busca comentários pendentes para revisão admin
   * GET /api/comments?status=pending
   */
  const getPendingComments = useCallback(
    async () => {
      return commentRepository.findPending();
    },
    [commentRepository]
  );

  /**
   * Busca todos os comentários para admin (requer autenticação admin)
   * GET /api/comments/admin
   */
  const getAllCommentsForAdmin = useCallback(
    async () => {
      return commentRepository.findAllForAdmin();
    },
    [commentRepository]
  );

  /**
   * Cria um novo comentário
   * POST /api/comments (status padrão: pending)
   */
  const createComment = useCallback(
    async (commentData: Omit<PublicComment, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
      try {
        setCreating(true);
        setCreateError(null);
        const newComment = await commentRepository.create(commentData);
        
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
    [commentRepository, comments, loadComments]
  );

  /**
   * Atualiza um comentário existente
   * PATCH /api/comments/:id (principalmente para mudanças de status, requer admin)
   */
  const updateComment = useCallback(
    async (id: string, updates: Partial<PublicComment>) => {
      try {
        setUpdating(true);
        setUpdateError(null);
        const updatedComment = await commentRepository.update(id, updates);
        
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
    [commentRepository, comments, loadComments]
  );

  /**
   * Atualiza status do comentário (operação admin)
   * PATCH /api/comments/:id
   */
  const updateCommentStatus = useCallback(
    async (id: string, status: 'pending' | 'approved' | 'rejected') => {
      try {
        setUpdating(true);
        setUpdateError(null);
        const updatedComment = await commentRepository.updateStatus(id, status);
        
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
    [commentRepository, comments, loadComments]
  );

  /**
   * Remove um comentário (operação admin)
   * DELETE /api/comments/:id
   */
  const deleteComment = useCallback(
    async (id: string) => {
      try {
        setDeleting(true);
        setDeleteError(null);
        await commentRepository.delete(id);
        
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
    [commentRepository, comments, loadComments]
  );

  /**
   * Verifica se um comentário existe
   */
  const checkCommentExists = useCallback(
    async (id: string) => {
      return commentRepository.exists(id);
    },
    [commentRepository]
  );

  /**
   * Aprova comentário (operação admin)
   */
  const approveComment = useCallback(
    async (id: string) => {
      try {
        setUpdating(true);
        setUpdateError(null);
        const approvedComment = await commentRepository.approve(id);
        
        // Atualiza a lista local se existir
        if (comments) {
          await loadComments();
        }
        
        return approvedComment;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setUpdateError(errorObj);
        throw errorObj;
      } finally {
        setUpdating(false);
      }
    },
    [commentRepository, comments, loadComments]
  );

  /**
   * Rejeita comentário (operação admin)
   */
  const rejectComment = useCallback(
    async (id: string) => {
      try {
        setUpdating(true);
        setUpdateError(null);
        const rejectedComment = await commentRepository.reject(id);
        
        // Atualiza a lista local se existir
        if (comments) {
          await loadComments();
        }
        
        return rejectedComment;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setUpdateError(errorObj);
        throw errorObj;
      } finally {
        setUpdating(false);
      }
    },
    [commentRepository, comments, loadComments]
  );

  /**
   * Reseta comentário para pendente (operação admin)
   */
  const resetCommentToPending = useCallback(
    async (id: string) => {
      try {
        setUpdating(true);
        setUpdateError(null);
        const pendingComment = await commentRepository.resetToPending(id);
        
        // Atualiza a lista local se existir
        if (comments) {
          await loadComments();
        }
        
        return pendingComment;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setUpdateError(errorObj);
        throw errorObj;
      } finally {
        setUpdating(false);
      }
    },
    [commentRepository, comments, loadComments]
  );

  /**
   * Obtém estatísticas dos comentários (operação admin)
   */
  const getStatistics = useCallback(
    async () => {
      return commentRepository.getStatistics();
    },
    [commentRepository]
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
    
    // Actions - Basic CRUD
    loadComments,
    getCommentById,
    createComment,
    updateComment,
    deleteComment,
    checkCommentExists,
    
    // Actions - Status filtering (using backend endpoints)
    getCommentsByStatus, // GET /api/comments?status=X
    getApprovedComments, // GET /api/comments?status=approved
    getPendingComments, // GET /api/comments?status=pending
    getAllCommentsForAdmin, // GET /api/comments/admin (requires admin)
    
    // Actions - Status management (admin operations)
    updateCommentStatus, // PATCH /api/comments/:id (requires admin)
    approveComment, // Admin operation
    rejectComment, // Admin operation
    resetCommentToPending, // Admin operation
    
    // Actions - Statistics
    getStatistics, // Admin operation
  };
};