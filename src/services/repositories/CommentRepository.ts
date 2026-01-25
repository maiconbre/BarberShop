import type { IRepository } from '../interfaces/IRepository';
import type { PublicComment } from '@/types';
import { supabase } from '../../config/supabaseConfig';

/**
 * Repository for comments following Repository Pattern
 * Based on the Supabase 'comments' table structure
 */
export class CommentRepository implements IRepository<PublicComment> {
  constructor() {}

  /**
   * Find comment by ID
   */
  async findById(id: string): Promise<PublicComment | null> {
    try {
      const { data, error } = await supabase
        .from('Comments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return this.adaptFromBackend(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Find all comments with optional filters
   */
  async findAll(filters?: Record<string, unknown>): Promise<PublicComment[]> {
    try {
      let query = supabase.from('Comments').select('*');
      
      const barbershopId = localStorage.getItem('barbershopId');
      if (barbershopId) {
        query = query.eq('barbershopId', barbershopId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(c => this.adaptFromBackend(c));
    } catch (error) {
      console.error('CommentRepository: findAll failed:', error);
      return [];
    }
  }

  /**
   * Find comments by status
   */
  async findByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<PublicComment[]> {
    return this.findAll({ status });
  }

  /**
   * Find all comments for admin (same as findAll but could check roles broadly)
   */
  async findAllForAdmin(): Promise<PublicComment[]> {
    return this.findAll();
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
   */
  async create(commentData: Omit<PublicComment, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<PublicComment> {
    try {
      const barbershopId = localStorage.getItem('barbershopId');
      const dbData = {
        name: commentData.name,
        comment: commentData.comment,
        status: 'pending',
        barbershopId: barbershopId
      };

      const { data, error } = await supabase
        .from('Comments')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;
      return this.adaptFromBackend(data);
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Update comment
   */
  async update(id: string, updates: Partial<PublicComment>): Promise<PublicComment> {
    try {
      const dbUpdates: any = {};
      
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.comment) dbUpdates.comment = updates.comment;
      if (updates.status) dbUpdates.status = updates.status;
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('Comments')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.adaptFromBackend(data);
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Update comment status
   */
  async updateStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<PublicComment> {
    return this.update(id, { status });
  }

  /**
   * Delete comment
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('Comments').delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * Check if comment exists
   */
  async exists(id: string): Promise<boolean> {
    const { count } = await supabase
      .from('Comments')
      .select('*', { count: 'exact', head: true })
      .eq('id', id);
    return (count || 0) > 0;
  }

  /**
   * Approve comment
   */
  async approve(id: string): Promise<PublicComment> {
    return this.updateStatus(id, 'approved');
  }

  /**
   * Reject comment
   */
  async reject(id: string): Promise<PublicComment> {
    return this.updateStatus(id, 'rejected');
  }

  /**
   * Reset comment to pending
   */
  async resetToPending(id: string): Promise<PublicComment> {
    return this.updateStatus(id, 'pending');
  }

  /**
   * Get comment statistics
   */
  async getStatistics(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const allComments = await this.findAll();
    
    return {
      total: allComments.length,
      pending: allComments.filter(c => c.status === 'pending').length,
      approved: allComments.filter(c => c.status === 'approved').length,
      rejected: allComments.filter(c => c.status === 'rejected').length,
    };
  }

  /**
   * Adapt backend comment to frontend PublicComment interface
   */
  private adaptFromBackend(backendComment: any): PublicComment {
    if (!backendComment) return {} as PublicComment;
    return {
      id: backendComment.id,
      name: backendComment.name,
      comment: backendComment.comment,
      status: backendComment.status || 'pending',
      createdAt: backendComment.created_at || new Date().toISOString(),
      updatedAt: backendComment.updated_at,
    };
  }
}