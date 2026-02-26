import React, { useEffect, useState } from 'react';
import { useBarbershopSettings } from '../../hooks/useBarbershopSettings';
import { BarbershopUpdateData } from '../../types/barbershop';
import { GeneralSettings } from './GeneralSettings';
import { WorkingHoursSettings } from './WorkingHoursSettings';
import { BrandingSettings } from './BrandingSettings';
import { ContactSettings } from './ContactSettings';
import { NotificationSettings } from './NotificationSettings';
import { logger } from '../../utils/logger';

interface BarbershopSettingsProps {
  className?: string;
}

type SettingsTab = 'general' | 'hours' | 'branding' | 'contact' | 'notifications';

export const BarbershopSettings: React.FC<BarbershopSettingsProps> = ({ className = '' }) => {
  const { 
    settings, 
    loading, 
    error, 
    loadSettings, 
    updateSettings, 
    clearError 
  } = useBarbershopSettings();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Limpar erro quando mudar de aba
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [activeTab, clearError, error]);

  /**
   * Salvar configurações
   */
  const handleSaveSettings = async (data: BarbershopUpdateData) => {
    try {
      setSaving(true);
      await updateSettings(data);
      setHasUnsavedChanges(false);
      
      // Mostrar feedback de sucesso
      logger.componentInfo('BarbershopSettings', 'Configurações salvas com sucesso');
      
    } catch (err) {
      logger.componentError('BarbershopSettings', 'Erro ao salvar configurações:', err);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Marcar como tendo mudanças não salvas
   */
  const handleSettingsChange = () => {
    setHasUnsavedChanges(true);
  };

  const tabs = [
    { id: 'general' as const, label: 'Geral', icon: '⚙️' },
    { id: 'hours' as const, label: 'Horários', icon: '🕒' },
    { id: 'branding' as const, label: 'Visual', icon: '🎨' },
    { id: 'contact' as const, label: 'Contato', icon: '📞' },
    { id: 'notifications' as const, label: 'Notificações', icon: '🔔' }
  ];

  if (loading && !settings) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Configurações da Barbearia
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Personalize sua barbearia e configure preferências
            </p>
          </div>
          
          {hasUnsavedChanges && (
            <div className="flex items-center text-amber-600 text-sm">
              <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
              Alterações não salvas
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={clearError}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 border-r border-gray-200">
          <nav className="p-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-3">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6">
          {activeTab === 'general' && (
            <GeneralSettings
              settings={settings}
              onSave={handleSaveSettings}
              onChange={handleSettingsChange}
              saving={saving}
            />
          )}
          
          {activeTab === 'hours' && (
            <WorkingHoursSettings
              settings={settings}
              onSave={handleSaveSettings}
              onChange={handleSettingsChange}
              saving={saving}
            />
          )}
          
          {activeTab === 'branding' && (
            <BrandingSettings
              settings={settings}
              onSave={handleSaveSettings}
              onChange={handleSettingsChange}
              saving={saving}
            />
          )}
          
          {activeTab === 'contact' && (
            <ContactSettings
              settings={settings}
              onSave={handleSaveSettings}
              onChange={handleSettingsChange}
              saving={saving}
            />
          )}
          
          {activeTab === 'notifications' && (
            <NotificationSettings
              settings={settings}
              onSave={handleSaveSettings}
              onChange={handleSettingsChange}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
};