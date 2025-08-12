import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommentRepository } from '@/services/repositories/CommentRepository';
import type { IApiService } from '@/services/interfaces/IApiService';
import type { BackendComment } from '@/types/backend';
import type { PublicComment } from '@/types';

// Mock API Service
const mockApiService: IApiService = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

describe('CommentRepository', () => {
  let commentRepository: CommentRepository;
  let mockBackendComment: BackendComment;
  let mockPublicComment: PublicComment;

  beforeEach(() => {
    vi.clearAllMocks();
    commentRepository = new CommentRepository(mockApiService);
    
    mockBackendComment = {
      id: '1',
      name: 'João Silva',
      comment: 'Excelente atendimento!',
      status: 'approved',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
    };

    mockPublicComment = {
      id: '1',
      name: 'João Silva',
      comment: 'Excelente atendimento!',
      status: 'approved',
      createdAt: '2024-01-01T10:00:00.000Z',
      updatedAt: '2024-01-01T10:00:00.000Z',
    };
  });

  describe('findById', () => {
    it('should find comment by id successfully', async () => {
      vi.mocked(mockApiService.get).mockResolvedValue(mockBackendComment);

      const result = await commentRepository.findById('1');

      expect(mockApiService.get).toHaveBeenCalledWith('/api/comments/1');
      expect(result).toEqual(mockPublicComment);
    });

    it('should return null when comment not found', async () => {
      const notFoundError = new Error('Not found') as any;
      notFoundError.status = 404;
      vi.mocked(mockApiService.get).mockRejectedValue(notFoundError);

      const result = await commentRepository.findById('999');

      expect(result).toBeNull();
    });

    it('should throw error for other API errors', async () => {
      const apiError = new Error('Server error');
      vi.mocked(mockApiService.get).mockRejectedValue(apiError);

      await expect(commentRepository.findById('1')).rejects.toThrow('Server error');
    });
  });

  describe('findAll', () => {
    it('should find all comments successfully', async () => {
      vi.mocked(mockApiService.get).mockResolvedValue([mockBackendComment]);

      const result = await commentRepository.findAll();

      expect(mockApiService.get).toHaveBeenCalledWith('/api/comments');
      expect(result).toEqual([mockPublicComment]);
    });

    it('should find comments with filters', async () => {
      vi.mocked(mockApiService.get).mockResolvedValue([mockBackendComment]);

      const result = await commentRepository.findAll({ status: 'approved' });

      expect(mockApiService.get).toHaveBeenCalledWith('/api/comments?status=approved');
      expect(result).toEqual([mockPublicComment]);
    });

    it('should return empty array when no comments found', async () => {
      vi.mocked(mockApiService.get).mockResolvedValue([]);

      const result = await commentRepository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('should find comments by status', async () => {
      vi.mocked(mockApiService.get).mockResolvedValue([mockBackendComment]);

      const result = await commentRepository.findByStatus('approved');

      expect(mockApiService.get).toHaveBeenCalledWith('/api/comments?status=approved');
      expect(result).toEqual([mockPublicComment]);
    });

    it('should find pending comments', async () => {
      const pendingComment = { ...mockBackendComment, status: 'pending' as const };
      vi.mocked(mockApiService.get).mockResolvedValue([pendingComment]);

      const result = await commentRepository.findByStatus('pending');

      expect(mockApiService.get).toHaveBeenCalledWith('/api/comments?status=pending');
      expect(result[0].status).toBe('pending');
    });
  });

  describe('findAllForAdmin', () => {
    it('should find all comments for admin', async () => {
      vi.mocked(mockApiService.get).mockResolvedValue([mockBackendComment]);

      const result = await commentRepository.findAllForAdmin();

      expect(mockApiService.get).toHaveBeenCalledWith('/api/comments/admin');
      expect(result).toEqual([mockPublicComment]);
    });
  });

  describe('create', () => {
    it('should create comment successfully', async () => {
      const newCommentData = {
        name: 'Maria Santos',
        comment: 'Ótimo serviço!',
      };

      vi.mocked(mockApiService.post).mockResolvedValue({
        ...mockBackendComment,
        ...newCommentData,
        status: 'pending',
      });

      const result = await commentRepository.create(newCommentData);

      expect(mockApiService.post).toHaveBeenCalledWith('/api/comments', {
        name: 'Maria Santos',
        comment: 'Ótimo serviço!',
      });
      expect(result.name).toBe('Maria Santos');
      expect(result.comment).toBe('Ótimo serviço!');
    });
  });

  describe('update', () => {
    it('should update comment successfully', async () => {
      const updates = { comment: 'Comentário atualizado' };
      const updatedBackendComment = { ...mockBackendComment, ...updates };
      
      vi.mocked(mockApiService.patch).mockResolvedValue(updatedBackendComment);

      const result = await commentRepository.update('1', updates);

      expect(mockApiService.patch).toHaveBeenCalledWith('/api/comments/1', updates);
      expect(result.comment).toBe('Comentário atualizado');
    });
  });

  describe('updateStatus', () => {
    it('should update comment status to approved', async () => {
      const updatedComment = { ...mockBackendComment, status: 'approved' as const };
      vi.mocked(mockApiService.patch).mockResolvedValue(updatedComment);

      const result = await commentRepository.updateStatus('1', 'approved');

      expect(mockApiService.patch).toHaveBeenCalledWith('/api/comments/1', { status: 'approved' });
      expect(result.status).toBe('approved');
    });

    it('should update comment status to rejected', async () => {
      const updatedComment = { ...mockBackendComment, status: 'rejected' as const };
      vi.mocked(mockApiService.patch).mockResolvedValue(updatedComment);

      const result = await commentRepository.updateStatus('1', 'rejected');

      expect(mockApiService.patch).toHaveBeenCalledWith('/api/comments/1', { status: 'rejected' });
      expect(result.status).toBe('rejected');
    });
  });

  describe('delete', () => {
    it('should delete comment successfully', async () => {
      vi.mocked(mockApiService.delete).mockResolvedValue(undefined);

      await commentRepository.delete('1');

      expect(mockApiService.delete).toHaveBeenCalledWith('/api/comments/1');
    });
  });

  describe('exists', () => {
    it('should return true when comment exists', async () => {
      vi.mocked(mockApiService.get).mockResolvedValue(mockBackendComment);

      const result = await commentRepository.exists('1');

      expect(result).toBe(true);
    });

    it('should return false when comment does not exist', async () => {
      const notFoundError = new Error('Not found') as any;
      notFoundError.status = 404;
      vi.mocked(mockApiService.get).mockRejectedValue(notFoundError);

      const result = await commentRepository.exists('999');

      expect(result).toBe(false);
    });
  });

  describe('admin operations', () => {
    it('should approve comment', async () => {
      const approvedComment = { ...mockBackendComment, status: 'approved' as const };
      vi.mocked(mockApiService.patch).mockResolvedValue(approvedComment);

      const result = await commentRepository.approve('1');

      expect(mockApiService.patch).toHaveBeenCalledWith('/api/comments/1', { status: 'approved' });
      expect(result.status).toBe('approved');
    });

    it('should reject comment', async () => {
      const rejectedComment = { ...mockBackendComment, status: 'rejected' as const };
      vi.mocked(mockApiService.patch).mockResolvedValue(rejectedComment);

      const result = await commentRepository.reject('1');

      expect(mockApiService.patch).toHaveBeenCalledWith('/api/comments/1', { status: 'rejected' });
      expect(result.status).toBe('rejected');
    });

    it('should reset comment to pending', async () => {
      const pendingComment = { ...mockBackendComment, status: 'pending' as const };
      vi.mocked(mockApiService.patch).mockResolvedValue(pendingComment);

      const result = await commentRepository.resetToPending('1');

      expect(mockApiService.patch).toHaveBeenCalledWith('/api/comments/1', { status: 'pending' });
      expect(result.status).toBe('pending');
    });
  });

  describe('getStatistics', () => {
    it('should return comment statistics', async () => {
      const comments = [
        { ...mockBackendComment, id: '1', status: 'approved' as const },
        { ...mockBackendComment, id: '2', status: 'pending' as const },
        { ...mockBackendComment, id: '3', status: 'rejected' as const },
        { ...mockBackendComment, id: '4', status: 'approved' as const },
      ];
      
      vi.mocked(mockApiService.get).mockResolvedValue(comments);

      const result = await commentRepository.getStatistics();

      expect(mockApiService.get).toHaveBeenCalledWith('/api/comments/admin');
      expect(result).toEqual({
        total: 4,
        pending: 1,
        approved: 2,
        rejected: 1,
      });
    });
  });
});