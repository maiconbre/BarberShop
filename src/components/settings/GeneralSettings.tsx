import React, { useState, useEffect } from 'react';
import { BarbershopConfiguration, BarbershopUpdateData, THEME_OPTIONS } from '../../types/barbershop';

interface GeneralSettingsProps {
  settings: BarbershopConfiguration | null;
  onSave: (data: BarbershopUpdateData) => Promise<void>;
  onChange: () => void;
  saving: boolean;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  settings,
  onSave,
  onChange,
  saving
}) => {
  const [formData, setFormData] = useState({
    name: '',
    theme: 'default'
  });

  // Atualizar form quando settings mudarem
  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || '',
        theme: settings.settings?.theme || 'default'
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
   * Salvar configurações gerais
   */
  const handleSave = async () => {
    const updateData: BarbershopUpdateData = {
      name: formData.name.trim(),
      settings: {
        theme: formData.theme
      }
    };

    await onSave(updateData);
  };

  /**
   * Verificar se há mudanças
   */
  const hasChanges = () => {
    if (!settings) return false;
    
    return (
      formData.name !== settings.name ||
      formData.theme !== (settings.settings?.theme || 'default')
    );
  };

  if (!settings) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Configurações Gerais
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure as informações básicas da sua barbearia
        </p>
      </div>

      <div className="space-y-6">
        {/* Nome da Barbearia */}
        <div>
          <label htmlFor="barbershop-name" className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Barbearia
          </label>
          <input
            id="barbershop-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Digite o nome da sua barbearia"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            Este nome aparecerá no topo da sua página e nos documentos
          </p>
        </div>

        {/* Slug (somente leitura) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL da Barbearia
          </label>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">
              {window.location.origin}/
            </span>
            <span className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-mono text-sm">
              {settings.slug}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            A URL da sua barbearia não pode ser alterada após o cadastro
          </p>
        </div>

        {/* Tema */}
        <div>
          <label htmlFor="theme-select" className="block text-sm font-medium text-gray-700 mb-2">
            Tema Visual
          </label>
          <select
            id="theme-select"
            value={formData.theme}
            onChange={(e) => handleInputChange('theme', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {THEME_OPTIONS.map((theme) => (
              <option key={theme.value} value={theme.value}>
                {theme.label} - {theme.description}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Escolha o tema visual que melhor representa sua barbearia
          </p>
        </div>

        {/* Informações do Plano */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Informações do Plano
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Plano Atual:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                settings.planType === 'pro' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {settings.planType === 'pro' ? 'Pro' : 'Gratuito'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Cadastrado em:</span>
              <span className="ml-2 text-gray-900">
                {new Date(settings.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
          
          {settings.planType === 'free' && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">
                Upgrade para o plano Pro e tenha acesso a recursos ilimitados
              </p>
              <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
                Fazer Upgrade
              </button>
            </div>
          )}
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
              if (settings) {
                setFormData({
                  name: settings.name || '',
                  theme: settings.settings?.theme || 'default'
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
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};