import React, { useState, useEffect, useRef } from 'react';
import { BarbershopConfiguration, BarbershopUpdateData, COLOR_PRESETS } from '../../types/barbershop';
import { useBarbershopSettings } from '../../hooks/useBarbershopSettings';

interface BrandingSettingsProps {
  settings: BarbershopConfiguration | null;
  onSave: (data: BarbershopUpdateData) => Promise<void>;
  onChange: () => void;
  saving: boolean;
}

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({
  settings,
  onSave,
  onChange,
  saving
}) => {
  const { uploadLogo, uploading } = useBarbershopSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    logoUrl: ''
  });

  // Atualizar form quando settings mudarem
  useEffect(() => {
    if (settings?.settings?.branding) {
      const branding = settings.settings.branding;
      setFormData({
        primaryColor: branding.primaryColor || '#3B82F6',
        secondaryColor: branding.secondaryColor || '#1E40AF',
        logoUrl: branding.logoUrl || ''
      });
    }
  }, [settings]);

  /**
   * Atualizar campo do formulário
   */
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    onChange();
  };

  /**
   * Aplicar preset de cores
   */
  const applyColorPreset = (preset: typeof COLOR_PRESETS[number]) => {
    setFormData(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary
    }));
    onChange();
  };

  /**
   * Upload de logo
   */
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const logoUrl = await uploadLogo(file);
      setFormData(prev => ({
        ...prev,
        logoUrl
      }));
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
    }
  };

  /**
   * Remover logo
   */
  const handleRemoveLogo = () => {
    setFormData(prev => ({
      ...prev,
      logoUrl: ''
    }));
    onChange();
  };

  /**
   * Salvar configurações de branding
   */
  const handleSave = async () => {
    const updateData: BarbershopUpdateData = {
      settings: {
        branding: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          logoUrl: formData.logoUrl
        }
      }
    };

    await onSave(updateData);
  };

  /**
   * Verificar se há mudanças
   */
  const hasChanges = () => {
    if (!settings?.settings?.branding) return true;
    
    const branding = settings.settings.branding;
    return (
      formData.primaryColor !== (branding.primaryColor || '#3B82F6') ||
      formData.secondaryColor !== (branding.secondaryColor || '#1E40AF') ||
      formData.logoUrl !== (branding.logoUrl || '')
    );
  };

  if (!settings) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Identidade Visual
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Personalize as cores e logo da sua barbearia
        </p>
      </div>

      {/* Logo da Barbearia */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Logo da Barbearia</h4>
        
        <div className="flex items-start space-x-4">
          {/* Preview do Logo */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Logo da barbearia"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <span className="text-2xl text-gray-400">🏪</span>
                  <p className="text-xs text-gray-500 mt-1">Sem logo</p>
                </div>
              )}
            </div>
          </div>

          {/* Controles do Logo */}
          <div className="flex-1">
            <div className="space-y-3">
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {uploading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {uploading ? 'Enviando...' : 'Escolher Logo'}
                </button>
                
                {formData.logoUrl && (
                  <button
                    onClick={handleRemoveLogo}
                    className="ml-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                  >
                    Remover
                  </button>
                )}
              </div>
              
              <p className="text-xs text-gray-500">
                Formatos aceitos: JPEG, PNG, WebP. Tamanho máximo: 2MB.
                <br />
                Recomendado: 200x200px ou proporção quadrada.
              </p>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleLogoUpload}
          className="hidden"
        />
      </div>

      {/* Cores da Marca */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Cores da Marca</h4>
        
        {/* Presets de Cores */}
        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-2">Presets de cores:</p>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyColorPreset(preset)}
                className="flex items-center space-x-2 px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title={`Aplicar cores ${preset.name}`}
              >
                <div className="flex space-x-1">
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: preset.primary }}
                  ></div>
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: preset.secondary }}
                  ></div>
                </div>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Seletores de Cor */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Cor Primária
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="#3B82F6"
                pattern="^#[A-Fa-f0-9]{6}$"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Cor Secundária
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.secondaryColor}
                onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="#1E40AF"
                pattern="^#[A-Fa-f0-9]{6}$"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview das Cores */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Preview das Cores</h4>
        <div className="space-y-3">
          {/* Botão Primário */}
          <div className="flex items-center space-x-3">
            <button
              style={{ backgroundColor: formData.primaryColor }}
              className="px-4 py-2 text-white text-sm font-medium rounded-lg"
            >
              Botão Primário
            </button>
            <span className="text-xs text-gray-600">Cor primária em botões principais</span>
          </div>

          {/* Botão Secundário */}
          <div className="flex items-center space-x-3">
            <button
              style={{ 
                backgroundColor: formData.secondaryColor,
                borderColor: formData.secondaryColor 
              }}
              className="px-4 py-2 text-white text-sm font-medium rounded-lg border"
            >
              Botão Secundário
            </button>
            <span className="text-xs text-gray-600">Cor secundária em elementos de destaque</span>
          </div>

          {/* Link */}
          <div className="flex items-center space-x-3">
            <a
              href="#"
              style={{ color: formData.primaryColor }}
              className="text-sm font-medium underline"
              onClick={(e) => e.preventDefault()}
            >
              Link de exemplo
            </a>
            <span className="text-xs text-gray-600">Cor primária em links</span>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {hasChanges() ? 'Você tem alterações não salvas' : 'Todas as alterações foram salvas'}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => {
              if (settings?.settings?.branding) {
                const branding = settings.settings.branding;
                setFormData({
                  primaryColor: branding.primaryColor || '#3B82F6',
                  secondaryColor: branding.secondaryColor || '#1E40AF',
                  logoUrl: branding.logoUrl || ''
                });
              }
            }}
            disabled={!hasChanges() || saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges() || saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Salvar Visual
          </button>
        </div>
      </div>
    </div>
  );
};