import type { IRepository } from '../interfaces/IRepository';
import type { IApiService } from '../interfaces/IApiService';
import type { PublicComment } from '@/types';
import type { BackendComment } from '@/types/backend';

// Interface for API errors with status
interface ApiError extends Error {
  status?: number;
}

/**
 * Repository for comments following Repository Pattern
 * Based on the real backend Comment model structure
 */
export class CommentRepository implements IRepository<PublicComment> {
  constructor(private apiService: IApiService) {}

  /**
   * Helper to construct tenant-aware URLs
   */
  private getTenantAwareUrl(endpoint: string): string {
    const barbershopSlug = localStorage.getItem('barbershopSlug');
    
    if (barbershopSlug) {
      // Use tenant-aware endpoint
      return endpoint.replace('/api/', `/api/app/${barbershopSlug}/`);
    }
    
    // Fallback to standard endpoint
    return endpoint;
  }

  /**
   * Find comment by ID
   */
  async findById(id: string): Promise<PublicComment | null> {
    try {
      const comment = await this.apiService.get<BackendComment>(this.getTenantAwareUrl(`/api/comments/${id}`));
      return this.adaptFromBackend(comment);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Find all comments with optional filters
   * Uses GET /api/comments?status=X for filtering
   */
  async findAll(filters?: Record<string, unknown>): Promise<PublicComment[]> {
    const queryParams = this.buildQueryParams(filters);
    const baseUrl = this.getTenantAwareUrl('/api/comments');
    const fullUrl = queryParams ? `${baseUrl}${queryParams}` : baseUrl;
    const comments = await this.apiService.get<BackendComment[]>(fullUrl);
    return Array.isArray(comments) ? comments.map(c => this.adaptFromBackend(c)) : [];
  }

  /**
   * Find comments by status
   * Uses GET /api/comments?status=X endpoint
   */
  async findByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<PublicComment[]> {
    const comments = await this.apiService.get<BackendComment[]>(this.getTenantAwareUrl(`/api/comments?status=${status}`));
    return Array.isArray(comments) ? comments.map(c => this.adaptFromBackend(c)) : [];
  }

  /**
   * Find all comments for admin (requires admin authentication)
   * Uses GET /api/comments/admin endpoint
   */
  async findAllForAdmin(): Promise<PublicComment[]> {
    const comments = await this.apiService.get<BackendComment[]>(this.getTenantAwareUrl('/api/comments/admin'));
    return Array.isArray(comments) ? comments.map(c => this.adaptFromBackend(c)) : [];
  }

  /**
   * Find approved comments only (public endpoint)
   */
  async findApproved(): Promise<PublicComment[]> {
    return this.findByStatus('approved');
  }

  /**
   * Find pending comments (requires admin)
   */
  async findPending(): Promise<PublicComment[]> {
    return this.findByStatus('pending');
  }

  /**
   * Create a new comment
   * Uses POST /api/comments
   */
  async create(commentData: Omit<PublicComment, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<PublicComment> {
    const backendData = {
      name: commentData.name,
      comment: commentData.comment,
      // Status defaults to 'pending' on backend
    };

    const newComment = await this.apiService.post<BackendComment>(this.getTenantAwareUrl('/api/comments'), backendData);
    return this.adaptFromBackend(newComment);
  }

  /**
   * Update comment (mainly for status updates, requires admin)
   * Uses PATCH /api/comments/:id
   */
  async update(id: string, updates: Partial<PublicComment>): Promise<PublicComment> {
    const backendUpdates: Partial<BackendComment> = {};
    
    if (updates.name) backendUpdates.name = updates.name;
    if (updates.comment) backendUpdates.comment = updates.comment;
    if (updates.status) backendUpdates.status = updates.status;

    const updatedComment = await this.apiService.patch<BackendComment>(this.getTenantAwareUrl(`/api/comments/${id}`), backendUpdates);
    return this.adaptFromBackend(updatedComment);
  }

  /**
   * Update comment status (requires admin authentication)
   * Uses PATCH /api/comments/:id
   */
  async updateStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<PublicComment> {
    const updatedComment = await this.apiService.patch<BackendComment>(this.getTenantAwareUrl(`/api/comments/${id}`), { status });
    return this.adaptFromBackend(updatedComment);
  }

  /**
   * Delete comment (requires admin authentication)
   * Uses DELETE /api/comments/:id
   */
  async delete(id: string): Promise<void> {
    await this.apiService.delete(this.getTenantAwareUrl(`/api/comments/${id}`));
  }

  /**
   * Check if comment exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const comment = await this.findById(id);
      return comment !== null;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Approve comment (admin operation)
   */
  async approve(id: string): Promise<PublicComment> {
    return this.updateStatus(id, 'approved');
  }

  /**
   * Reject comment (admin operation)
   */
  async reject(id: string): Promise<PublicComment> {
    return this.updateStatus(id, 'rejected');
  }

  /**
   * Reset comment to pending (admin operation)
   */
  async resetToPending(id: string): Promise<PublicComment> {
    return this.updateStatus(id, 'pending');
  }

  /**
   * Get comment statistics (admin operation)
   */
  async getStatistics(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const allComments = await this.findAllForAdmin();
    
    return {
      total: allComments.length,
      pending: allComments.filter(c => c.status === 'pending').length,
      approved: allComments.filter(c => c.status === 'approved').length,
      rejected: allComments.filter(c => c.status === 'rejected').length,
    };
  }

  /**
   * Build query parameters for API requests
   */
  private buildQueryParams(filters?: Record<string, unknown>): string {
    if (!filters) return '';
    
    const params = new URLSearchParams();
    const barbershopSlug = localStorage.getItem('barbershopSlug');
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Skip barbershopId if we're using slug-based URLs
        if (key === 'barbershopId' && barbershopSlug) {
          return;
        }
        params.append(key, String(value));
      }
    });
    
    return params.toString() ? `?${params.toString()}` : '';
  }

  /**
   * Adapt backend comment to frontend PublicComment interface
   */
  private adaptFromBackend(backendComment: BackendComment): PublicComment {
    return {
      id: backendComment.id,
      name: backendComment.name,
      comment: backendComment.comment,
      status: backendComment.status,
      createdAt: backendComment.createdAt.toISOString(),
      updatedAt: backendComment.updatedAt?.toISOString(),
    };
  }

  /**
   * Check if error is a "not found" error
   */
  private isNotFoundError(error: unknown): boolean {
    return (
      error instanceof Error &&
      'status' in error &&
      (error as ApiError).status === 404
    );
  }
}