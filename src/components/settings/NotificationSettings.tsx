import React, { useState, useEffect } from 'react';
import { BarbershopConfiguration, BarbershopUpdateData } from '../../types/barbershop';

interface NotificationSettingsProps {
  settings: BarbershopConfiguration | null;
  onSave: (data: BarbershopUpdateData) => Promise<void>;
  onChange: () => void;
  saving: boolean;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onSave,
  onChange,
  saving
}) => {
  const [formData, setFormData] = useState({
    email: true,
    whatsapp: false
  });

  // Atualizar form quando settings mudarem
  useEffect(() => {
    if (settings?.settings?.notifications) {
      const notifications = settings.settings.notifications;
      setFormData({
        email: notifications.email ?? true,
        whatsapp: notifications.whatsapp ?? false
      });
    }
  }, [settings]);

  /**
   * Atualizar configuração de notificação
   */
  const handleToggleChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    onChange();
  };

  /**
   * Salvar configurações de notificação
   */
  const handleSave = async () => {
    const updateData: BarbershopUpdateData = {
      settings: {
        notifications: {
          email: formData.email,
          whatsapp: formData.whatsapp
        }
      }
    };

    await onSave(updateData);
  };

  /**
   * Verificar se há mudanças
   */
  const hasChanges = () => {
    if (!settings?.settings?.notifications) return true;
    
    const notifications = settings.settings.notifications;
    return (
      formData.email !== (notifications.email ?? true) ||
      formData.whatsapp !== (notifications.whatsapp ?? false)
    );
  };

  if (!settings) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-4">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Configurações de Notificação
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure como você deseja receber notificações sobre agendamentos e atividades
        </p>
      </div>

      <div className="space-y-6">
        {/* Notificações por Email */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">📧</span>
                <h4 className="text-sm font-medium text-gray-900">
                  Notificações por Email
                </h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Receba emails sobre novos agendamentos, cancelamentos e lembretes
              </p>
              <div className="text-xs text-gray-500">
                <p>• Novos agendamentos</p>
                <p>• Cancelamentos de clientes</p>
                <p>• Lembretes de agendamentos</p>
                <p>• Relatórios semanais</p>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.email}
                  onChange={(e) => handleToggleChange('email', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          {formData.email && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-green-600 flex items-center">
                <span className="mr-1">✓</span>
                Emails serão enviados para: {settings.ownerEmail}
              </p>
            </div>
          )}
        </div>

        {/* Notificações por WhatsApp */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">📱</span>
                <h4 className="text-sm font-medium text-gray-900">
                  Notificações por WhatsApp
                </h4>
                <span className="ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded">
                  Em breve
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Receba mensagens no WhatsApp sobre atividades importantes
              </p>
              <div className="text-xs text-gray-500">
                <p>• Confirmações de agendamento</p>
                <p>• Lembretes 1 hora antes</p>
                <p>• Cancelamentos urgentes</p>
                <p>• Resumo diário</p>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.whatsapp}
                  onChange={(e) => handleToggleChange('whatsapp', e.target.checked)}
                  disabled={true} // Desabilitado por enquanto
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 opacity-50"></div>
              </label>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 flex items-center">
              <span className="mr-1">ℹ️</span>
              Funcionalidade em desenvolvimento. Será liberada em breve.
            </p>
          </div>
        </div>

        {/* Configurações Avançadas */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-3">
            Configurações Avançadas
          </h4>
          <div className="space-y-2 text-xs text-blue-800">
            <div className="flex items-center justify-between">
              <span>Frequência de emails:</span>
              <span className="font-medium">Imediata</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Horário de envio:</span>
              <span className="font-medium">8h às 22h</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Fuso horário:</span>
              <span className="font-medium">Brasília (GMT-3)</span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              💡 Dica: Mantenha as notificações por email ativadas para não perder agendamentos importantes.
            </p>
          </div>
        </div>

        {/* Status das Notificações */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Status das Notificações
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${formData.email ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-gray-700">Email:</span>
              <span className={`ml-1 font-medium ${formData.email ? 'text-green-600' : 'text-gray-500'}`}>
                {formData.email ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${formData.whatsapp ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-gray-700">WhatsApp:</span>
              <span className="ml-1 font-medium text-gray-500">
                Em breve
              </span>
            </div>
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
              if (settings?.settings?.notifications) {
                const notifications = settings.settings.notifications;
                setFormData({
                  email: notifications.email ?? true,
                  whatsapp: notifications.whatsapp ?? false
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
            Salvar Notificações
          </button>
        </div>
      </div>
    </div>
  );
};