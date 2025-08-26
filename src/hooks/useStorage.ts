import { useState, useCallback } from 'react';
import { storageService, type UploadResult, type StorageFile, type UploadOptions } from '../services/supabaseStorage';

export interface UseStorageReturn {
  // State
  uploading: boolean;
  loading: boolean;
  error: string | null;
  files: StorageFile[];
  
  // Upload functions
  uploadTenantAvatar: (file: File, tenantId?: string, options?: UploadOptions) => Promise<UploadResult>;
  uploadUserAvatar: (file: File, userId?: string, options?: UploadOptions) => Promise<UploadResult>;
  uploadBarbershopImage: (file: File, barbershopId: string, tenantId?: string, options?: UploadOptions) => Promise<UploadResult>;
  uploadServiceImage: (file: File, serviceId: string, tenantId?: string, options?: UploadOptions) => Promise<UploadResult>;
  uploadQRCode: (file: File, qrId: string, tenantId?: string, options?: UploadOptions) => Promise<UploadResult>;
  uploadDocument: (file: File, documentType: string, tenantId?: string, options?: UploadOptions) => Promise<UploadResult>;
  
  // File management
  listFiles: (bucket: string, fileType: string, tenantId?: string) => Promise<void>;
  deleteFile: (bucket: string, path: string) => Promise<boolean>;
  getSignedUrl: (bucket: string, path: string, expiresIn?: number) => Promise<string | null>;
  getFileInfo: (bucket: string, path: string) => Promise<StorageFile | null>;
  
  // Utilities
  clearError: () => void;
  refreshFiles: (bucket: string, fileType: string, tenantId?: string) => Promise<void>;
}

/**
 * Hook for multi-tenant storage operations
 */
export const useStorage = (): UseStorageReturn => {
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<StorageFile[]>([]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadTenantAvatar = useCallback(async (
    file: File,
    tenantId?: string,
    options?: UploadOptions
  ): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    
    try {
      const result = await storageService.uploadTenantAvatar(file, tenantId, options);
      
      if (!result.success) {
        setError(result.error || 'Upload failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadUserAvatar = useCallback(async (
    file: File,
    userId?: string,
    options?: UploadOptions
  ): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    
    try {
      const result = await storageService.uploadUserAvatar(file, userId, options);
      
      if (!result.success) {
        setError(result.error || 'Upload failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadBarbershopImage = useCallback(async (
    file: File,
    barbershopId: string,
    tenantId?: string,
    options?: UploadOptions
  ): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    
    try {
      const result = await storageService.uploadBarbershopImage(file, barbershopId, tenantId, options);
      
      if (!result.success) {
        setError(result.error || 'Upload failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadServiceImage = useCallback(async (
    file: File,
    serviceId: string,
    tenantId?: string,
    options?: UploadOptions
  ): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    
    try {
      const result = await storageService.uploadServiceImage(file, serviceId, tenantId, options);
      
      if (!result.success) {
        setError(result.error || 'Upload failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadQRCode = useCallback(async (
    file: File,
    qrId: string,
    tenantId?: string,
    options?: UploadOptions
  ): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    
    try {
      const result = await storageService.uploadQRCode(file, qrId, tenantId, options);
      
      if (!result.success) {
        setError(result.error || 'Upload failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (
    file: File,
    documentType: string,
    tenantId?: string,
    options?: UploadOptions
  ): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    
    try {
      const result = await storageService.uploadDocument(file, documentType, tenantId, options);
      
      if (!result.success) {
        setError(result.error || 'Upload failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  }, []);

  const listFiles = useCallback(async (
    bucket: string,
    fileType: string,
    tenantId?: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await storageService.listTenantFiles(bucket, fileType, tenantId);
      
      if (result.success && result.files) {
        setFiles(result.files);
      } else {
        setError(result.error || 'Failed to list files');
        setFiles([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to list files';
      setError(errorMessage);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFile = useCallback(async (
    bucket: string,
    path: string
  ): Promise<boolean> => {
    setError(null);
    
    try {
      const result = await storageService.deleteFile(bucket, path);
      
      if (!result.success) {
        setError(result.error || 'Failed to delete file');
      } else {
        // Remove file from local state
        setFiles(prevFiles => prevFiles.filter(file => 
          !path.endsWith(file.name)
        ));
      }
      
      return result.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
      return false;
    }
  }, []);

  const getSignedUrl = useCallback(async (
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string | null> => {
    setError(null);
    
    try {
      const result = await storageService.getSignedUrl(bucket, path, expiresIn);
      
      if (!result.success) {
        setError(result.error || 'Failed to generate signed URL');
        return null;
      }
      
      return result.url || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate signed URL';
      setError(errorMessage);
      return null;
    }
  }, []);

  const getFileInfo = useCallback(async (
    bucket: string,
    path: string
  ): Promise<StorageFile | null> => {
    setError(null);
    
    try {
      const result = await storageService.getFileInfo(bucket, path);
      
      if (!result.success) {
        setError(result.error || 'Failed to get file info');
        return null;
      }
      
      return result.file || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get file info';
      setError(errorMessage);
      return null;
    }
  }, []);

  const refreshFiles = useCallback(async (
    bucket: string,
    fileType: string,
    tenantId?: string
  ): Promise<void> => {
    await listFiles(bucket, fileType, tenantId);
  }, [listFiles]);

  return {
    // State
    uploading,
    loading,
    error,
    files,
    
    // Upload functions
    uploadTenantAvatar,
    uploadUserAvatar,
    uploadBarbershopImage,
    uploadServiceImage,
    uploadQRCode,
    uploadDocument,
    
    // File management
    listFiles,
    deleteFile,
    getSignedUrl,
    getFileInfo,
    
    // Utilities
    clearError,
    refreshFiles
  };
};

export default useStorage;