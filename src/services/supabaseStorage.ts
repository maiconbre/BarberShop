import { supabase } from '../config/supabaseConfig';
import type { FileObject } from '@supabase/storage-js';

export interface UploadOptions {
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
}

export interface UploadResult {
  success: boolean;
  data?: {
    path: string;
    fullPath: string;
    publicUrl?: string;
  };
  error?: string;
}

export interface StorageFile extends FileObject {
  publicUrl?: string;
}

/**
 * Multi-tenant storage service for Supabase
 */
export class SupabaseStorageService {
  private static instance: SupabaseStorageService;
  
  public static getInstance(): SupabaseStorageService {
    if (!SupabaseStorageService.instance) {
      SupabaseStorageService.instance = new SupabaseStorageService();
    }
    return SupabaseStorageService.instance;
  }

  /**
   * Get current tenant ID from user metadata
   */
  private async getCurrentTenantId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.current_tenant_id || null;
  }

  /**
   * Generate tenant-scoped file path
   */
  private getTenantPath(tenantId: string, fileType: string, filename: string): string {
    return `${tenantId}/${fileType}/${filename}`;
  }

  /**
   * Upload tenant avatar
   */
  async uploadTenantAvatar(
    file: File,
    tenantId?: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      const currentTenantId = tenantId || await this.getCurrentTenantId();
      if (!currentTenantId) {
        return { success: false, error: 'No tenant context available' };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = this.getTenantPath(currentTenantId, 'avatars', fileName);

      const { data, error } = await supabase.storage
        .from('tenant-avatars')
        .upload(filePath, file, {
          cacheControl: options?.cacheControl || '3600',
          upsert: options?.upsert ?? true,
          contentType: options?.contentType || file.type
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('tenant-avatars')
        .getPublicUrl(filePath);

      return {
        success: true,
        data: {
          path: data.path,
          fullPath: data.fullPath,
          publicUrl
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload user avatar
   */
  async uploadUserAvatar(
    file: File,
    userId?: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${targetUserId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, {
          cacheControl: options?.cacheControl || '3600',
          upsert: options?.upsert ?? true,
          contentType: options?.contentType || file.type
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      return {
        success: true,
        data: {
          path: data.path,
          fullPath: data.fullPath,
          publicUrl
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload barbershop image
   */
  async uploadBarbershopImage(
    file: File,
    barbershopId: string,
    tenantId?: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      const currentTenantId = tenantId || await this.getCurrentTenantId();
      if (!currentTenantId) {
        return { success: false, error: 'No tenant context available' };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${barbershopId}-${Date.now()}.${fileExt}`;
      const filePath = this.getTenantPath(currentTenantId, 'barbershops', fileName);

      const { data, error } = await supabase.storage
        .from('barbershop-images')
        .upload(filePath, file, {
          cacheControl: options?.cacheControl || '3600',
          upsert: options?.upsert ?? true,
          contentType: options?.contentType || file.type
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('barbershop-images')
        .getPublicUrl(filePath);

      return {
        success: true,
        data: {
          path: data.path,
          fullPath: data.fullPath,
          publicUrl
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload service image
   */
  async uploadServiceImage(
    file: File,
    serviceId: string,
    tenantId?: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      const currentTenantId = tenantId || await this.getCurrentTenantId();
      if (!currentTenantId) {
        return { success: false, error: 'No tenant context available' };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${serviceId}-${Date.now()}.${fileExt}`;
      const filePath = this.getTenantPath(currentTenantId, 'services', fileName);

      const { data, error } = await supabase.storage
        .from('service-images')
        .upload(filePath, file, {
          cacheControl: options?.cacheControl || '3600',
          upsert: options?.upsert ?? true,
          contentType: options?.contentType || file.type
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

      return {
        success: true,
        data: {
          path: data.path,
          fullPath: data.fullPath,
          publicUrl
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload QR code
   */
  async uploadQRCode(
    file: File,
    qrId: string,
    tenantId?: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      const currentTenantId = tenantId || await this.getCurrentTenantId();
      if (!currentTenantId) {
        return { success: false, error: 'No tenant context available' };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `qr-${qrId}-${Date.now()}.${fileExt}`;
      const filePath = this.getTenantPath(currentTenantId, 'qr-codes', fileName);

      const { data, error } = await supabase.storage
        .from('qr-codes')
        .upload(filePath, file, {
          cacheControl: options?.cacheControl || '3600',
          upsert: options?.upsert ?? true,
          contentType: options?.contentType || file.type
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('qr-codes')
        .getPublicUrl(filePath);

      return {
        success: true,
        data: {
          path: data.path,
          fullPath: data.fullPath,
          publicUrl
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload document (private)
   */
  async uploadDocument(
    file: File,
    documentType: string,
    tenantId?: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      const currentTenantId = tenantId || await this.getCurrentTenantId();
      if (!currentTenantId) {
        return { success: false, error: 'No tenant context available' };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}-${Date.now()}.${fileExt}`;
      const filePath = this.getTenantPath(currentTenantId, 'documents', fileName);

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: options?.cacheControl || '3600',
          upsert: options?.upsert ?? true,
          contentType: options?.contentType || file.type
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Documents are private, so we return the path for signed URL generation
      return {
        success: true,
        data: {
          path: data.path,
          fullPath: data.fullPath
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Get signed URL for private documents
   */
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, url: data.signedUrl };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate signed URL'
      };
    }
  }

  /**
   * List files in tenant folder
   */
  async listTenantFiles(
    bucket: string,
    fileType: string,
    tenantId?: string
  ): Promise<{ success: boolean; files?: StorageFile[]; error?: string }> {
    try {
      const currentTenantId = tenantId || await this.getCurrentTenantId();
      if (!currentTenantId) {
        return { success: false, error: 'No tenant context available' };
      }

      const folderPath = `${currentTenantId}/${fileType}`;
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folderPath);

      if (error) {
        return { success: false, error: error.message };
      }

      // Add public URLs for public buckets
      const publicBuckets = ['tenant-avatars', 'user-avatars', 'barbershop-images', 'service-images', 'qr-codes'];
      const files: StorageFile[] = data.map(file => {
        const fileWithUrl: StorageFile = { ...file };
        
        if (publicBuckets.includes(bucket)) {
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(`${folderPath}/${file.name}`);
          fileWithUrl.publicUrl = publicUrl;
        }
        
        return fileWithUrl;
      });

      return { success: true, files };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list files'
      };
    }
  }

  /**
   * Delete file
   */
  async deleteFile(
    bucket: string,
    path: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file'
      };
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(
    bucket: string,
    path: string
  ): Promise<{ success: boolean; file?: StorageFile; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'), {
          search: path.split('/').pop()
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const file = data[0];
      if (!file) {
        return { success: false, error: 'File not found' };
      }

      // Add public URL for public buckets
      const publicBuckets = ['tenant-avatars', 'user-avatars', 'barbershop-images', 'service-images', 'qr-codes'];
      const fileWithUrl: StorageFile = { ...file };
      
      if (publicBuckets.includes(bucket)) {
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(path);
        fileWithUrl.publicUrl = publicUrl;
      }

      return { success: true, file: fileWithUrl };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get file info'
      };
    }
  }
}

// Export singleton instance
export const storageService = SupabaseStorageService.getInstance();

// Export types
export type {
  UploadOptions,
  UploadResult,
  StorageFile
};