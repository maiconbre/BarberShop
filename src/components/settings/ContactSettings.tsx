import React, { useState, useEffect } from 'react';
import { BarbershopConfiguration, BarbershopUpdateData } from '../../types/barbershop';

interface ContactSettingsProps {
  settings: BarbershopConfiguration | null;
  onSave: (data: BarbershopUpdateData) => Promise<void>;
  onChange: () => void;
  saving: boolean;
}

export const ContactSettings: React.FC<ContactSettingsProps> = ({
  settings,
  onSave,
  onChange,
  saving
}) => {
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    website: ''
  });

  // Atualizar form quando settings mudarem
  useEffect(() => {
    if (settings?.settings?.contact) {
      const contact = settings.settings.contact;
      setFormData({
        phone: contact.phone || '',
        address: contact.address || '',
        website: contact.website || ''
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
   * Formatar telefone automaticamente
   */
  const handlePhoneChange = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica máscara (XX) XXXXX-XXXX
    let formatted = numbers;
    if (numbers.length >= 2) {
      formatted = `(${numbers.slice(0, 2)})`;
      if (numbers.length > 2) {
        formatted += ` ${numbers.slice(2, 7)}`;
        if (numbers.length > 7) {
          formatted += `-${numbers.slice(7, 11)}`;
        }
      }
    }
    
    handleInputChange('phone', formatted);
  };

  /**
   * Salvar configurações de contato
   */
  const handleSave = async () => {
    const updateData: BarbershopUpdateData = {
      settings: {
        contact: {
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          website: formData.website.trim()
        }
      }
    };

    await onSave(updateData);
  };

  /**
   * Verificar se há mudanças
   */
  const hasChanges = () => {
    if (!settings?.settings?.contact) return true;
    
    const contact = settings.settings.contact;
    return (
      formData.phone !== (contact.phone || '') ||
      formData.address !== (contact.address || '') ||
      formData.website !== (contact.website || '')
    );
  };

  /**
   * Validar URL do website
   */
  const isValidWebsite = (url: string) => {
    if (!url) return true; // Campo opcional
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  if (!settings) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Informações de Contato
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure as informações de contato que aparecerão na sua página
        </p>
      </div>

      <div className="space-y-6">
        {/* Telefone */}
        <div>
          <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <input
            id="contact-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="(11) 99999-9999"
            maxLength={15}
          />
          <p className="text-xs text-gray-500 mt-1">
            Telefone principal para contato com clientes
          </p>
        </div>

        {/* Endereço */}
        <div>
          <label htmlFor="contact-address" className="block text-sm font-medium text-gray-700 mb-2">
            Endereço
          </label>
          <textarea
            id="contact-address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Rua das Barbearias, 123 - Centro, São Paulo - SP, 01234-567"
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">
            Endereço completo da barbearia para localização
          </p>
        </div>

        {/* Website */}
        <div>
          <label htmlFor="contact-website" className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <input
            id="contact-website"
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              formData.website && !isValidWebsite(formData.website)
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="https://www.minhabarbearia.com.br"
          />
          {formData.website && !isValidWebsite(formData.website) && (
            <p className="text-xs text-red-600 mt-1">
              URL inválida. Exemplo: https://www.exemplo.com
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Site ou página da barbearia (opcional)
          </p>
        </div>

        {/* Email do Proprietário (somente leitura) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email do Proprietário
          </label>
          <input
            type="email"
            value={settings.ownerEmail}
            readOnly
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            Email usado no cadastro da barbearia (não pode ser alterado)
          </p>
        </div>
      </div>

      {/* Preview das Informações */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Preview das Informações de Contato
        </h4>
        <div className="space-y-2 text-sm">
          {formData.phone && (
            <div className="flex items-center">
              <span className="text-gray-600 w-16">📞</span>
              <span className="text-gray-900">{formData.phone}</span>
            </div>
          )}
          
          {formData.address && (
            <div className="flex items-start">
              <span className="text-gray-600 w-16 mt-0.5">📍</span>
              <span className="text-gray-900">{formData.address}</span>
            </div>
          )}
          
          {formData.website && isValidWebsite(formData.website) && (
            <div className="flex items-center">
              <span className="text-gray-600 w-16">🌐</span>
              <a
                href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {formData.website}
              </a>
            </div>
          )}
          
          <div className="flex items-center">
            <span className="text-gray-600 w-16">✉️</span>
            <span className="text-gray-900">{settings.ownerEmail}</span>
          </div>

          {!formData.phone && !formData.address && !formData.website && (
            <p className="text-gray-500 text-center py-4">
              Nenhuma informação de contato configurada
            </p>
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
              if (settings?.settings?.contact) {
                const contact = settings.settings.contact;
                setFormData({
                  phone: contact.phone || '',
                  address: contact.address || '',
                  website: contact.website || ''
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
            disabled={!hasChanges() || saving || (formData.website && !isValidWebsite(formData.website))}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Salvar Contato
          </button>
        </div>
      </div>
    </div>
  );
};