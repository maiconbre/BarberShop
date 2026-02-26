import { useState, useCallback } from 'react';
import { 
  getCurrentBarbershopSettings, 
  updateBarbershopSettings, 
  uploadBarbershopLogo,
  validateBarbershopSettings 
} from '../services/BarbershopSettingsService';
import { BarbershopConfiguration, BarbershopUpdateData } from '../types/barbershop';
import { useTenant } from '../contexts/TenantContext';
import { logger } from '../utils/logger';

interface UseBarbershopSettingsReturn {
  // State
  settings: BarbershopConfiguration | null;
  loading: boolean;
  error: string | null;
  uploading: boolean;
  
  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (data: BarbershopUpdateData) => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
  clearError: () => void;
  
  // Validation
  validateSettings: (data: BarbershopUpdateData) => { valid: boolean; errors: string[] };
}

export const useBarbershopSettings = (): UseBarbershopSettingsReturn => {
  const [settings, setSettings] = useState<BarbershopConfiguration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const { updateSettings: updateTenantSettings } = useTenant();

  /**
   * Carregar configurações da barbearia
   */
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      logger.componentInfo('useBarbershopSettings', 'Carregando configurações da barbearia');
      
      const data = await getCurrentBarbershopSettings();
      setSettings(data);
      
      // Atualizar contexto do tenant com as configurações carregadas
      if (data.settings) {
        updateTenantSettings(data.settings);
      }
      
      logger.componentInfo('useBarbershopSettings', 'Configurações carregadas com sucesso');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar configurações';
      setError(errorMessage);
      logger.componentError('useBarbershopSettings', 'Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  }, [updateTenantSettings]);

  /**
   * Atualizar configurações da barbearia
   */
  const updateSettings = useCallback(async (data: BarbershopUpdateData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validar dados antes de enviar
      const validation = validateBarbershopSettings(data);
      if (!validation.valid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }
      
      logger.componentInfo('useBarbershopSettings', 'Atualizando configurações da barbearia', data);
      
      const updatedSettings = await updateBarbershopSettings(data);
      setSettings(updatedSettings);
      
      // Atualizar contexto do tenant com as novas configurações
      if (updatedSettings.settings) {
        updateTenantSettings(updatedSettings.settings);
      }
      
      logger.componentInfo('useBarbershopSettings', 'Configurações atualizadas com sucesso');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar configurações';
      setError(errorMessage);
      logger.componentError('useBarbershopSettings', 'Erro ao atualizar configurações:', err);
      throw err; // Re-throw para permitir tratamento no componente
    } finally {
      setLoading(false);
    }
  }, [updateTenantSettings]);

  /**
   * Upload de logo da barbearia
   */
  const uploadLogo = useCallback(async (file: File): Promise<string> => {
    try {
      setUploading(true);
      setError(null);
      
      logger.componentInfo('useBarbershopSettings', 'Fazendo upload do logo', { fileName: file.name, size: file.size });
      
      const logoUrl = await uploadBarbershopLogo(file);
      
      // Atualizar configurações com o novo logo
      await updateSettings({
        settings: {
          branding: {
            ...settings?.settings?.branding,
            logoUrl
          }
        }
      });
      
      logger.componentInfo('useBarbershopSettings', 'Logo atualizado com sucesso', { logoUrl });
      
      return logoUrl;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload do logo';
      setError(errorMessage);
      logger.componentError('useBarbershopSettings', 'Erro ao fazer upload do logo:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [settings, updateSettings]);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Validar configurações
   */
  const validateSettings = useCallback((data: BarbershopUpdateData) => {
    return validateBarbershopSettings(data);
  }, []);

  return {
    // State
    settings,
    loading,
    error,
    uploading,
    
    // Actions
    loadSettings,
    updateSettings,
    uploadLogo,
    clearError,
    
    // Validation
    validateSettings
  };
};