/**
 * Comment store using Zustand with multi-tenant support
 * @deprecated Use useComments hook from hooks/useComments.ts instead
 * This store is kept for backward compatibility but should not be used in new code
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicComment } from '@/types';
import { useCommentRepository } from '../services/ServiceFactory';
import { createTenantAwareRepository } from '../services/TenantAwareRepository';
import { createTenantAwareCache } from '../services/TenantAwareCache';

interface CommentState {
  // State
  comments: Record<string, PublicComment[]>; // Keyed by status
  isLoading: boolean;
  error: string | null;
  
  // Multi-tenant state
  barbershopId: string | null;
  tenantRepository: any | null;
  tenantCache: any | null;

  // Actions
  initializeTenant: (barbershopId: string) => void;
  fetchComments: (status: 'pending' | 'approved' | 'rejected', forceRefresh?: boolean) => Promise<void>;
  fetchAllCommentsForAdmin: () => Promise<void>;
  createComment: (commentData: Omit<PublicComment, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<PublicComment>;
  updateCommentStatus: (commentId: string, newStatus: 'approved' | 'rejected') => Promise<void>;
  approveComment: (commentId: string) => Promise<void>;
  rejectComment: (commentId: string) => Promise<void>;
  resetCommentToPending: (commentId: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  clearTenantCache: () => void;
}

/**
 * @deprecated Use useComments hook from hooks/useComments.ts instead
 * This store is kept for backward compatibility but should not be used in new code
 * 
 * Multi-tenant comment management store with repository pattern
 */
export const useCommentStore = create<CommentState>()(
  persist(
    (set, get) => ({
      // Initial state
      comments: {
        pending: [],
        approved: [],
        rejected: []
      },
      isLoading: false,
      error: null,
      
      // Multi-tenant state
      barbershopId: null,
      tenantRepository: null,
      tenantCache: null,

      // Actions
      initializeTenant: (barbershopId: string) => {
        const baseRepository = useCommentRepository();
        const tenantRepository = createTenantAwareRepository(baseRepository, () => barbershopId);
        const tenantCache = createTenantAwareCache(() => barbershopId);
        
        set({
          barbershopId,
          tenantRepository,
          tenantCache,
        });
      },

      fetchComments: async (status: 'pending' | 'approved' | 'rejected', forceRefresh = false) => {
        const { tenantRepository, tenantCache, barbershopId } = get();
        
        if (!barbershopId || !tenantRepository) {
          set({ error: 'Tenant not initialized. Call initializeTenant first.' });
          return;
        }

        set({ isLoading: true, error: null });
        
        try {
          const cacheKey = `comments:status:${status}`;
          
          // Check cache first (unless forced)
          if (!forceRefresh) {
            const cached = tenantCache?.get(cacheKey);
            if (cached) {
              set(state => ({
                comments: {
                  ...state.comments,
                  [status]: cached
                },
                isLoading: false
              }));
              return;
            }
          }
          
          const commentsData = await tenantRepository.findByStatus(status);
          
          // Cache the result
          tenantCache?.set(cacheKey, commentsData, { ttl: 2 * 60 * 1000 }); // 2 minutes

          set(state => ({
            comments: {
              ...state.comments,
              [status]: commentsData
            },
            isLoading: false,
            error: null
          }));
        } catch (error) {
          console.error('Erro ao buscar comentários:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao buscar comentários'
          });
          throw error;
        }
      },

      fetchAllCommentsForAdmin: async () => {
        const { tenantRepository, tenantCache, barbershopId } = get();
        
        if (!barbershopId || !tenantRepository) {
          set({ error: 'Tenant not initialized. Call initializeTenant first.' });
          return;
        }

        set({ isLoading: true, error: null });
        
        try {
          const cacheKey = 'comments:admin:all';
          
          // Try cache first
          const cached = tenantCache?.get(cacheKey);
          if (cached) {
            // Organize by status
            const organized = {
              pending: cached.filter((c: PublicComment) => c.status === 'pending'),
              approved: cached.filter((c: PublicComment) => c.status === 'approved'),
              rejected: cached.filter((c: PublicComment) => c.status === 'rejected'),
            };
            
            set({
              comments: organized,
              isLoading: false
            });
            return;
          }
          
          const allComments = await tenantRepository.findAllForAdmin();
          
          // Organize by status
          const organized = {
            pending: allComments.filter(c => c.status === 'pending'),
            approved: allComments.filter(c => c.status === 'approved'),
            rejected: allComments.filter(c => c.status === 'rejected'),
          };
          
          // Cache the result
          tenantCache?.set(cacheKey, allComments, { ttl: 2 * 60 * 1000 });

          set({
            comments: organized,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Erro ao buscar todos os comentários:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao buscar comentários'
          });
          throw error;
        }
      },

      createComment: async (commentData: Omit<PublicComment, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
        const { tenantRepository, tenantCache, barbershopId } = get();
        
        if (!barbershopId || !tenantRepository) {
          set({ error: 'Tenant not initialized. Call initializeTenant first.' });
          throw new Error('Tenant not initialized');
        }

        set({ isLoading: true, error: null });
        
        try {
          const newComment = await tenantRepository.create(commentData);
          
          // Clear cache to force refresh
          tenantCache?.clearTenantCache();
          
          // Add to pending comments
          set(state => ({
            comments: {
              ...state.comments,
              pending: [...state.comments.pending, newComment]
            },
            isLoading: false,
            error: null
          }));
          
          return newComment;
        } catch (error) {
          console.error('Erro ao criar comentário:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao criar comentário'
          });
          throw error;
        }
      },

      updateCommentStatus: async (commentId: string, newStatus: 'approved' | 'rejected') => {
        const { tenantRepository, tenantCache, barbershopId } = get();
        
        if (!barbershopId || !tenantRepository) {
          set({ error: 'Tenant not initialized. Call initializeTenant first.' });
          return;
        }

        const state = get();
        set({ isLoading: true, error: null });

        try {
          const updatedComment = await tenantRepository.updateStatus(commentId, newStatus);
          
          // Clear cache to force refresh
          tenantCache?.clearTenantCache();

          // Update local state by removing comment from all status arrays
          // and adding to the new status array
          const updatedComments = { ...state.comments };
          let movedComment: PublicComment | null = null;

          // Find and remove comment from current status
          Object.keys(updatedComments).forEach(status => {
            const commentIndex = updatedComments[status].findIndex(c => c.id === commentId);
            if (commentIndex !== -1) {
              movedComment = updatedComment;
              updatedComments[status] = updatedComments[status].filter(c => c.id !== commentId);
            }
          });

          // Add to new status if comment was found
          if (movedComment) {
            updatedComments[newStatus] = [...updatedComments[newStatus], movedComment];
          }

          set({
            comments: updatedComments,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Erro ao atualizar comentário:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao atualizar comentário'
          });
          throw error;
        }
      },

      approveComment: async (commentId: string) => {
        await get().updateCommentStatus(commentId, 'approved');
      },

      rejectComment: async (commentId: string) => {
        await get().updateCommentStatus(commentId, 'rejected');
      },

      resetCommentToPending: async (commentId: string) => {
        const { tenantRepository, tenantCache, barbershopId } = get();
        
        if (!barbershopId || !tenantRepository) {
          set({ error: 'Tenant not initialized. Call initializeTenant first.' });
          return;
        }

        const state = get();
        set({ isLoading: true, error: null });

        try {
          const updatedComment = await tenantRepository.updateStatus(commentId, 'pending');
          
          // Clear cache to force refresh
          tenantCache?.clearTenantCache();

          // Update local state by removing comment from all status arrays
          // and adding to pending
          const updatedComments = { ...state.comments };
          let movedComment: PublicComment | null = null;

          // Find and remove comment from current status
          Object.keys(updatedComments).forEach(status => {
            const commentIndex = updatedComments[status].findIndex(c => c.id === commentId);
            if (commentIndex !== -1) {
              movedComment = updatedComment;
              updatedComments[status] = updatedComments[status].filter(c => c.id !== commentId);
            }
          });

          // Add to pending if comment was found
          if (movedComment) {
            updatedComments.pending = [...updatedComments.pending, movedComment];
          }

          set({
            comments: updatedComments,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Erro ao resetar comentário:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao resetar comentário'
          });
          throw error;
        }
      },

      deleteComment: async (commentId: string) => {
        const { tenantRepository, tenantCache, barbershopId } = get();
        
        if (!barbershopId || !tenantRepository) {
          set({ error: 'Tenant not initialized. Call initializeTenant first.' });
          return;
        }

        const state = get();
        set({ isLoading: true, error: null });

        try {
          await tenantRepository.delete(commentId);
          
          // Clear cache to force refresh
          tenantCache?.clearTenantCache();

          // Remove comment from local state
          const updatedComments = { ...state.comments };
          Object.keys(updatedComments).forEach(status => {
            updatedComments[status] = updatedComments[status].filter(c => c.id !== commentId);
          });

          set({
            comments: updatedComments,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Erro ao excluir comentário:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao excluir comentário'
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      clearTenantCache: () => {
        const { tenantCache } = get();
        tenantCache?.clearTenantCache();
      }
    }),
    {
      name: 'comment-store',
      partialize: (state) => ({
        // Only persist non-tenant specific data
        comments: state.comments
      })
    }
  )
);

// Selectors for backward compatibility
export const useComments = (status: 'pending' | 'approved' | 'rejected') => {
  return useCommentStore(state => state.comments[status] || []);
};

export const useCommentLoading = () => {
  return useCommentStore(state => state.isLoading);
};

export const useCommentError = () => {
  return useCommentStore(state => state.error);
};

// Multi-tenant selectors
export const useCommentTenant = () => useCommentStore((state) => ({
  barbershopId: state.barbershopId,
  isInitialized: Boolean(state.barbershopId && state.tenantRepository)
}));

// Actions for backward compatibility
export const useCommentActions = () => {
  return {
    initializeTenant: useCommentStore.getState().initializeTenant,
    fetchComments: useCommentStore.getState().fetchComments,
    fetchAllCommentsForAdmin: useCommentStore.getState().fetchAllCommentsForAdmin,
    createComment: useCommentStore.getState().createComment,
    updateCommentStatus: useCommentStore.getState().updateCommentStatus,
    approveComment: useCommentStore.getState().approveComment,
    rejectComment: useCommentStore.getState().rejectComment,
    resetCommentToPending: useCommentStore.getState().resetCommentToPending,
    deleteComment: useCommentStore.getState().deleteComment,
    clearError: useCommentStore.getState().clearError,
    clearTenantCache: useCommentStore.getState().clearTenantCache
  };
};