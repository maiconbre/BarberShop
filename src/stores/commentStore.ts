/**
 * Comment store using Zustand with cache management
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicComment, ApiResponse } from '@/types';

interface CommentCache {
  [key: string]: {
    data: PublicComment[];
    timestamp: number;
    ttl: number;
  };
}

interface CommentState {
  // State
  comments: Record<string, PublicComment[]>; // Keyed by status
  isLoading: boolean;
  error: string | null;
  cache: CommentCache;
  lastFetch: Record<string, number>; // Timestamp of last fetch by status

  // Actions
  fetchComments: (status: 'pending' | 'approved' | 'rejected', forceRefresh?: boolean) => Promise<void>;
  updateCommentStatus: (commentId: string, newStatus: 'approved' | 'rejected') => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  invalidateCache: (status?: string) => void;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MIN_FETCH_INTERVAL = 30 * 1000; // 30 seconds minimum between fetches

/**
 * Comment management store with intelligent caching
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
      cache: {},
      lastFetch: {},

      // Actions
      fetchComments: async (status: 'pending' | 'approved' | 'rejected', forceRefresh = false) => {
        const state = get();
        const now = Date.now();
        const lastFetchTime = state.lastFetch[status] || 0;
        const cacheKey = `comments_${status}`;
        const cachedData = state.cache[cacheKey];

        // Check if we should skip the fetch due to rate limiting
        if (!forceRefresh && (now - lastFetchTime) < MIN_FETCH_INTERVAL) {
          console.log(`Skipping fetch for ${status} - too soon since last fetch`);
          return;
        }

        // Check cache validity
        if (!forceRefresh && cachedData && (now - cachedData.timestamp) < cachedData.ttl) {
          console.log(`Using cached data for ${status}`);
          set({
            comments: {
              ...state.comments,
              [status]: cachedData.data
            }
          });
          return;
        }

        set({ isLoading: true, error: null });
        
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          };
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const response = await fetch(
            `${(import.meta as any).env.VITE_API_URL}/api/comments?status=${status}`,
            {
              method: 'GET',
              headers,
              mode: 'cors'
            }
          );

          if (!response.ok) {
            if (response.status === 429) {
              throw new Error('Muitas requisições. Aguarde um momento antes de tentar novamente.');
            }
            throw new Error(`Erro ao buscar comentários: ${response.status}`);
          }

          const result: ApiResponse<PublicComment[]> = await response.json();
          
          if (result.success) {
            const commentsData = result.data || [];
            
            // Update cache
            const newCache = {
              ...state.cache,
              [cacheKey]: {
                data: commentsData,
                timestamp: now,
                ttl: CACHE_TTL
              }
            };

            set({
              comments: {
                ...state.comments,
                [status]: commentsData
              },
              cache: newCache,
              lastFetch: {
                ...state.lastFetch,
                [status]: now
              },
              isLoading: false,
              error: null
            });
          } else {
            throw new Error(result.message || 'Erro ao buscar comentários');
          }
        } catch (error) {
          console.error('Erro ao buscar comentários:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao buscar comentários'
          });
          throw error;
        }
      },

      updateCommentStatus: async (commentId: string, newStatus: 'approved' | 'rejected') => {
        const state = get();
        set({ isLoading: true, error: null });

        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          };
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(
            `${(import.meta as any).env.VITE_API_URL}/api/comments/${commentId}`,
            {
              method: 'PATCH',
              headers,
              mode: 'cors',
              body: JSON.stringify({ status: newStatus })
            }
          );

          if (!response.ok) {
            throw new Error(`Erro ao atualizar comentário: ${response.status}`);
          }

          // Update local state by removing comment from all status arrays
          // and adding to the new status array
          const updatedComments = { ...state.comments };
          let movedComment: PublicComment | null = null;

          // Find and remove comment from current status
          Object.keys(updatedComments).forEach(status => {
            const commentIndex = updatedComments[status].findIndex(c => c.id === commentId);
            if (commentIndex !== -1) {
              movedComment = { ...updatedComments[status][commentIndex], status: newStatus };
              updatedComments[status] = updatedComments[status].filter(c => c.id !== commentId);
            }
          });

          // Add to new status if comment was found
          if (movedComment) {
            updatedComments[newStatus] = [...updatedComments[newStatus], movedComment];
          }

          // Invalidate cache for affected statuses
          const newCache = { ...state.cache };
          Object.keys(newCache).forEach(key => {
            if (key.startsWith('comments_')) {
              delete newCache[key];
            }
          });

          set({
            comments: updatedComments,
            cache: newCache,
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

      deleteComment: async (commentId: string) => {
        const state = get();
        set({ isLoading: true, error: null });

        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          };
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(
            `${(import.meta as any).env.VITE_API_URL}/api/comments/${commentId}`,
            {
              method: 'DELETE',
              headers,
              mode: 'cors'
            }
          );

          if (!response.ok) {
            throw new Error(`Erro ao excluir comentário: ${response.status}`);
          }

          // Remove comment from local state
          const updatedComments = { ...state.comments };
          Object.keys(updatedComments).forEach(status => {
            updatedComments[status] = updatedComments[status].filter(c => c.id !== commentId);
          });

          // Invalidate cache
          const newCache = { ...state.cache };
          Object.keys(newCache).forEach(key => {
            if (key.startsWith('comments_')) {
              delete newCache[key];
            }
          });

          set({
            comments: updatedComments,
            cache: newCache,
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

      invalidateCache: (status?: string) => {
        const state = get();
        const newCache = { ...state.cache };
        
        if (status) {
          delete newCache[`comments_${status}`];
        } else {
          // Clear all comment cache
          Object.keys(newCache).forEach(key => {
            if (key.startsWith('comments_')) {
              delete newCache[key];
            }
          });
        }
        
        set({ cache: newCache });
      }
    }),
    {
      name: 'comment-store',
      partialize: (state) => ({
        cache: state.cache,
        lastFetch: state.lastFetch
      })
    }
  )
);

// Selectors for better performance with proper memoization
export const useComments = (status: 'pending' | 'approved' | 'rejected') => {
  return useCommentStore(state => state.comments[status] || []);
};

export const useCommentLoading = () => {
  return useCommentStore(state => state.isLoading);
};

export const useCommentError = () => {
  return useCommentStore(state => state.error);
};

// Export actions directly from store to prevent re-render issues
export const useCommentActions = () => {
  return {
    fetchComments: useCommentStore.getState().fetchComments,
    updateCommentStatus: useCommentStore.getState().updateCommentStatus,
    deleteComment: useCommentStore.getState().deleteComment,
    clearError: useCommentStore.getState().clearError,
    invalidateCache: useCommentStore.getState().invalidateCache
  };
};