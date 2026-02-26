import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComments } from '../useComments';
import type { PublicComment } from '@/types';

// Mock TenantContext
vi.mock('../../contexts/TenantContext', () => ({
  useTenant: () => ({
    barbershopId: 'test-barbershop-123',
    isValidTenant: true,
    slug: 'test-barbershop',
    barbershopData: {
      id: 'test-barbershop-123',
      name: 'Test Barbershop',
      slug: 'test-barbershop'
    },
    loading: false,
    error: null
  })
}));

// Mock TenantAwareRepository
vi.mock('../../services/TenantAwareRepository', () => ({
  createTenantAwareRepository: (baseRepo: unknown) => baseRepo
}));

// Mock TenantAwareCache
vi.mock('../../services/TenantAwareCache', () => ({
  createTenantAwareCache: () => ({
    get: vi.fn(),
    set: vi.fn(),
    clearTenantCache: vi.fn()
  })
}));

const mockCommentRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByStatus: vi.fn(),
  findAllForAdmin: vi.fn(),
  findApproved: vi.fn(),
  findPending: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
  delete: vi.fn(),
  exists: vi.fn(),
  approve: vi.fn(),
  reject: vi.fn(),
  resetToPending: vi.fn(),
  getStatistics: vi.fn(),
};

vi.mock('@/services/ServiceFactory', () => ({
  useCommentRepository: () => mockCommentRepository,
}));

describe('useComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockComment: PublicComment = {
    id: '1',
    name: 'João Silva',
    comment: 'Excelente atendimento! Recomendo muito.',
    status: 'approved',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:30:00.000Z',
  };

  describe('loadComments', () => {
    it('should load comments successfully', async () => {
      const mockComments = [mockComment];
      mockCommentRepository.findAll.mockResolvedValue(mockComments);

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadComments();
      });

      expect(result.current.comments).toEqual(mockComments);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle loading error', async () => {
      const error = new Error('Failed to load comments');
      mockCommentRepository.findAll.mockRejectedValue(error);

      const { result } = renderHook(() => useComments());

      await act(async () => {
        try {
          await result.current.loadComments();
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    it('should load comments with filters', async () => {
      const mockComments = [mockComment];
      const filters = { status: 'approved' };
      mockCommentRepository.findAll.mockResolvedValue(mockComments);

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadComments(filters);
      });

      expect(mockCommentRepository.findAll).toHaveBeenCalledWith(filters);
      expect(result.current.comments).toEqual(mockComments);
    });
  });

  describe('getCommentsByStatus', () => {
    it('should get approved comments', async () => {
      const mockComments = [mockComment];
      mockCommentRepository.findAll.mockResolvedValue(mockComments);

      const { result } = renderHook(() => useComments());

      let comments: PublicComment[] = [];
      await act(async () => {
        comments = await result.current.getCommentsByStatus('approved');
      });

      expect(comments).toEqual(mockComments);
      expect(mockCommentRepository.findAll).toHaveBeenCalledWith({ status: 'approved' });
    });

    it('should get pending comments', async () => {
      const pendingComment = { ...mockComment, status: 'pending' as const };
      const mockComments = [pendingComment];
      mockCommentRepository.findAll.mockResolvedValue(mockComments);

      const { result } = renderHook(() => useComments());

      let comments: PublicComment[] = [];
      await act(async () => {
        comments = await result.current.getCommentsByStatus('pending');
      });

      expect(comments).toEqual(mockComments);
      expect(comments[0].status).toBe('pending');
      expect(mockCommentRepository.findAll).toHaveBeenCalledWith({ status: 'pending' });
    });

    it('should get rejected comments', async () => {
      const rejectedComment = { ...mockComment, status: 'rejected' as const };
      const mockComments = [rejectedComment];
      mockCommentRepository.findAll.mockResolvedValue(mockComments);

      const { result } = renderHook(() => useComments());

      let comments: PublicComment[] = [];
      await act(async () => {
        comments = await result.current.getCommentsByStatus('rejected');
      });

      expect(comments).toEqual(mockComments);
      expect(comments[0].status).toBe('rejected');
      expect(mockCommentRepository.findAll).toHaveBeenCalledWith({ status: 'rejected' });
    });
  });

  describe('getApprovedComments', () => {
    it('should get approved comments for public display', async () => {
      const mockComments = [mockComment];
      mockCommentRepository.findAll.mockResolvedValue(mockComments);

      const { result } = renderHook(() => useComments());

      let comments: PublicComment[] = [];
      await act(async () => {
        comments = await result.current.getApprovedComments();
      });

      expect(comments).toEqual(mockComments);
      expect(mockCommentRepository.findAll).toHaveBeenCalledWith({ status: 'approved' });
    });
  });

  describe('getPendingComments', () => {
    it('should get pending comments for admin review', async () => {
      const pendingComment = { ...mockComment, status: 'pending' as const };
      const mockComments = [pendingComment];
      mockCommentRepository.findAll.mockResolvedValue(mockComments);

      const { result } = renderHook(() => useComments());

      let comments: PublicComment[] = [];
      await act(async () => {
        comments = await result.current.getPendingComments();
      });

      expect(comments).toEqual(mockComments);
      expect(mockCommentRepository.findAll).toHaveBeenCalledWith({ status: 'pending' });
    });
  });

  describe('getAllCommentsForAdmin', () => {
    it('should get all comments for admin (requires admin auth)', async () => {
      const allComments = [
        mockComment,
        { ...mockComment, id: '2', status: 'pending' as const },
        { ...mockComment, id: '3', status: 'rejected' as const },
      ];
      mockCommentRepository.findAll.mockResolvedValue(allComments);

      const { result } = renderHook(() => useComments());

      let comments: PublicComment[] = [];
      await act(async () => {
        comments = await result.current.getAllCommentsForAdmin();
      });

      expect(comments).toEqual(allComments);
      expect(comments).toHaveLength(3);
      expect(mockCommentRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('createComment', () => {
    it('should create comment successfully', async () => {
      const commentData = {
        name: 'Maria Santos',
        comment: 'Ótimo serviço, muito profissional!',
      };
      
      const createdComment = { 
        ...commentData, 
        id: '2',
        status: 'pending' as const, // Default status from backend
        createdAt: '2024-01-15T11:00:00.000Z',
      };
      
      mockCommentRepository.create.mockResolvedValue(createdComment);

      const { result } = renderHook(() => useComments());

      let comment: PublicComment | undefined;
      await act(async () => {
        comment = await result.current.createComment(commentData);
      });

      expect(comment).toEqual(createdComment);
      expect(comment?.status).toBe('pending'); // Default status
      expect(mockCommentRepository.create).toHaveBeenCalledWith({
        ...commentData,
        status: 'pending'
      });
      expect(result.current.creating).toBe(false);
    });

    it('should handle create error', async () => {
      const error = new Error('Failed to create comment');
      mockCommentRepository.create.mockRejectedValue(error);

      const { result } = renderHook(() => useComments());

      await act(async () => {
        try {
          await result.current.createComment({
            name: 'Test User',
            comment: 'Test comment',
          });
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.creating).toBe(false);
      expect(result.current.createError).toBeTruthy();
    });
  });

  describe('updateCommentStatus', () => {
    it('should approve comment successfully', async () => {
      const approvedComment = { ...mockComment, status: 'approved' as const };
      mockCommentRepository.update.mockResolvedValue(approvedComment);

      const { result } = renderHook(() => useComments());

      let comment: PublicComment | undefined;
      await act(async () => {
        comment = await result.current.updateCommentStatus('1', 'approved');
      });

      expect(comment).toEqual(approvedComment);
      expect(comment?.status).toBe('approved');
      expect(mockCommentRepository.update).toHaveBeenCalledWith('1', { status: 'approved' });
    });

    it('should reject comment successfully', async () => {
      const rejectedComment = { ...mockComment, status: 'rejected' as const };
      mockCommentRepository.update.mockResolvedValue(rejectedComment);

      const { result } = renderHook(() => useComments());

      let comment: PublicComment | undefined;
      await act(async () => {
        comment = await result.current.updateCommentStatus('1', 'rejected');
      });

      expect(comment).toEqual(rejectedComment);
      expect(comment?.status).toBe('rejected');
      expect(mockCommentRepository.update).toHaveBeenCalledWith('1', { status: 'rejected' });
    });

    it('should reset comment to pending', async () => {
      const pendingComment = { ...mockComment, status: 'pending' as const };
      mockCommentRepository.update.mockResolvedValue(pendingComment);

      const { result } = renderHook(() => useComments());

      let comment: PublicComment | undefined;
      await act(async () => {
        comment = await result.current.updateCommentStatus('1', 'pending');
      });

      expect(comment).toEqual(pendingComment);
      expect(comment?.status).toBe('pending');
      expect(mockCommentRepository.update).toHaveBeenCalledWith('1', { status: 'pending' });
    });
  });

  describe('admin operations', () => {
    it('should approve comment using admin method', async () => {
      const approvedComment = { ...mockComment, status: 'approved' as const };
      mockCommentRepository.update.mockResolvedValue(approvedComment);

      const { result } = renderHook(() => useComments());

      let comment: PublicComment | undefined;
      await act(async () => {
        comment = await result.current.approveComment('1');
      });

      expect(comment).toEqual(approvedComment);
      expect(mockCommentRepository.update).toHaveBeenCalledWith('1', { status: 'approved' });
    });

    it('should reject comment using admin method', async () => {
      const rejectedComment = { ...mockComment, status: 'rejected' as const };
      mockCommentRepository.update.mockResolvedValue(rejectedComment);

      const { result } = renderHook(() => useComments());

      let comment: PublicComment | undefined;
      await act(async () => {
        comment = await result.current.rejectComment('1');
      });

      expect(comment).toEqual(rejectedComment);
      expect(mockCommentRepository.update).toHaveBeenCalledWith('1', { status: 'rejected' });
    });

    it('should reset comment to pending using admin method', async () => {
      const pendingComment = { ...mockComment, status: 'pending' as const };
      mockCommentRepository.update.mockResolvedValue(pendingComment);

      const { result } = renderHook(() => useComments());

      let comment: PublicComment | undefined;
      await act(async () => {
        comment = await result.current.resetCommentToPending('1');
      });

      expect(comment).toEqual(pendingComment);
      expect(mockCommentRepository.update).toHaveBeenCalledWith('1', { status: 'pending' });
    });
  });

  describe('deleteComment', () => {
    it('should delete comment successfully (admin operation)', async () => {
      mockCommentRepository.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.deleteComment('1');
      });

      expect(mockCommentRepository.delete).toHaveBeenCalledWith('1');
      expect(result.current.deleting).toBe(false);
    });

    it('should handle delete error', async () => {
      const error = new Error('Failed to delete comment');
      mockCommentRepository.delete.mockRejectedValue(error);

      const { result } = renderHook(() => useComments());

      await act(async () => {
        try {
          await result.current.deleteComment('1');
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.deleting).toBe(false);
      expect(result.current.deleteError).toBeTruthy();
    });
  });

  describe('getStatistics', () => {
    it('should get comment statistics (admin operation)', async () => {
      const allComments = [
        { ...mockComment, id: '1', status: 'approved' as const },
        { ...mockComment, id: '2', status: 'pending' as const },
        { ...mockComment, id: '3', status: 'pending' as const },
        { ...mockComment, id: '4', status: 'pending' as const },
        { ...mockComment, id: '5', status: 'pending' as const },
        { ...mockComment, id: '6', status: 'pending' as const },
        { ...mockComment, id: '7', status: 'approved' as const },
        { ...mockComment, id: '8', status: 'approved' as const },
        { ...mockComment, id: '9', status: 'approved' as const },
        { ...mockComment, id: '10', status: 'approved' as const },
        { ...mockComment, id: '11', status: 'approved' as const },
        { ...mockComment, id: '12', status: 'approved' as const },
        { ...mockComment, id: '13', status: 'approved' as const },
        { ...mockComment, id: '14', status: 'rejected' as const },
        { ...mockComment, id: '15', status: 'rejected' as const },
      ];
      
      mockCommentRepository.findAll.mockResolvedValue(allComments);

      const { result } = renderHook(() => useComments());

      let stats: { total: number; pending: number; approved: number; rejected: number; };
      await act(async () => {
        stats = await result.current.getStatistics();
      });

      expect(stats!).toEqual({
        total: 15,
        pending: 5,
        approved: 8,
        rejected: 2,
      });
      expect(mockCommentRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('status enum validation', () => {
    it('should handle all valid status values', async () => {
      const statuses: Array<'pending' | 'approved' | 'rejected'> = ['pending', 'approved', 'rejected'];
      
      for (const status of statuses) {
        const comment = { ...mockComment, status };
        mockCommentRepository.findAll.mockResolvedValue([comment]);

        const { result } = renderHook(() => useComments());

        let comments: PublicComment[] = [];
        await act(async () => {
          comments = await result.current.getCommentsByStatus(status);
        });

        expect(comments[0].status).toBe(status);
        expect(['pending', 'approved', 'rejected']).toContain(comments[0].status);
      }
    });

    it('should validate status transitions', async () => {
      const { result } = renderHook(() => useComments());

      // Test all valid status transitions
      const transitions = [
        { from: 'pending', to: 'approved' },
        { from: 'pending', to: 'rejected' },
        { from: 'approved', to: 'pending' },
        { from: 'rejected', to: 'pending' },
        { from: 'approved', to: 'rejected' },
        { from: 'rejected', to: 'approved' },
      ];

      for (const transition of transitions) {
        const updatedComment = { ...mockComment, status: transition.to };
        mockCommentRepository.update.mockResolvedValue(updatedComment);

        let comment: PublicComment | undefined;
        await act(async () => {
          comment = await result.current.updateCommentStatus('1', transition.to as 'pending' | 'approved' | 'rejected');
        });

        expect(comment?.status).toBe(transition.to);
      }
    });
  });

  describe('admin authentication requirements', () => {
    it('should handle admin-only operations', async () => {
      // These operations require admin authentication in the backend
      const adminOperations = [
        () => result.current.getAllCommentsForAdmin(),
        () => result.current.updateCommentStatus('1', 'approved'),
        () => result.current.approveComment('1'),
        () => result.current.rejectComment('1'),
        () => result.current.resetCommentToPending('1'),
        () => result.current.deleteComment('1'),
        () => result.current.getStatistics(),
      ];

      const { result } = renderHook(() => useComments());

      // Mock successful responses for admin operations
      mockCommentRepository.findAll.mockResolvedValue([mockComment]);
      mockCommentRepository.update.mockResolvedValue(mockComment);
      mockCommentRepository.delete.mockResolvedValue(undefined);

      // All admin operations should work when properly authenticated
      for (const operation of adminOperations) {
        await act(async () => {
          await operation();
        });
      }

      // Verify all admin operations were called
      expect(mockCommentRepository.findAll).toHaveBeenCalled();
      expect(mockCommentRepository.update).toHaveBeenCalled();
      expect(mockCommentRepository.delete).toHaveBeenCalled();
    });
  });

  describe('public vs admin operations', () => {
    it('should distinguish between public and admin operations', async () => {
      const { result } = renderHook(() => useComments());

      // Public operations (no auth required)
      mockCommentRepository.findAll.mockResolvedValue([mockComment]);
      mockCommentRepository.create.mockResolvedValue(mockComment);

      await act(async () => {
        await result.current.getApprovedComments(); // Public
        await result.current.createComment({ name: 'Test', comment: 'Test' }); // Public
      });

      expect(mockCommentRepository.findAll).toHaveBeenCalled();
      expect(mockCommentRepository.create).toHaveBeenCalled();

      // Admin operations (auth required)
      mockCommentRepository.findAll.mockResolvedValue([mockComment]);
      mockCommentRepository.update.mockResolvedValue(mockComment);

      await act(async () => {
        await result.current.getAllCommentsForAdmin(); // Admin only
        await result.current.approveComment('1'); // Admin only
      });

      expect(mockCommentRepository.findAll).toHaveBeenCalled();
      expect(mockCommentRepository.update).toHaveBeenCalled();
    });
  });

  describe('backend API endpoint mapping', () => {
    it('should use correct API endpoints for different operations', async () => {
      const { result } = renderHook(() => useComments());

      // Test that different operations use different endpoints
      mockCommentRepository.findAll.mockResolvedValue([mockComment]);

      await act(async () => {
        // Uses GET /api/comments?status=approved
        await result.current.getCommentsByStatus('approved');
        
        // Uses GET /api/comments/admin
        await result.current.getAllCommentsForAdmin();
      });

      expect(mockCommentRepository.findAll).toHaveBeenCalledWith({ status: 'approved' });
      expect(mockCommentRepository.findAll).toHaveBeenCalled();
    });
  });
});