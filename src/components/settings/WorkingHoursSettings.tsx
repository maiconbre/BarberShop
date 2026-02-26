import React, { useState, useEffect } from 'react';
import { BarbershopConfiguration, BarbershopUpdateData, WorkingHours, DEFAULT_WORKING_HOURS, DAY_LABELS } from '../../types/barbershop';

interface WorkingHoursSettingsProps {
  settings: BarbershopConfiguration | null;
  onSave: (data: BarbershopUpdateData) => Promise<void>;
  onChange: () => void;
  saving: boolean;
}

export const WorkingHoursSettings: React.FC<WorkingHoursSettingsProps> = ({
  settings,
  onSave,
  onChange,
  saving
}) => {
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS);

  // Atualizar form quando settings mudarem
  useEffect(() => {
    if (settings?.settings?.workingHours) {
      setWorkingHours(settings.settings.workingHours);
    }
  }, [settings]);

  /**
   * Atualizar horário de um dia específico
   */
  const handleDayChange = (day: string, field: 'start' | 'end' | 'closed', value: string | boolean) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
    onChange();
  };

  /**
   * Toggle dia fechado
   */
  const handleToggleClosed = (day: string) => {
    const currentDay = workingHours[day];
    const isClosed = currentDay?.closed || false;
    
    if (isClosed) {
      // Abrir o dia com horários padrão
      handleDayChange(day, 'closed', false);
      handleDayChange(day, 'start', '08:00');
      handleDayChange(day, 'end', '18:00');
    } else {
      // Fechar o dia
      handleDayChange(day, 'closed', true);
    }
  };

  /**
   * Aplicar horário padrão para todos os dias
   */
  const applyDefaultHours = () => {
    setWorkingHours(DEFAULT_WORKING_HOURS);
    onChange();
  };

  /**
   * Copiar horário de um dia para todos os outros dias abertos
   */
  const copyToAllDays = (sourceDay: string) => {
    const sourceHours = workingHours[sourceDay];
    if (!sourceHours || sourceHours.closed) return;

    const newHours = { ...workingHours };
    Object.keys(newHours).forEach(day => {
      if (day !== sourceDay && !newHours[day]?.closed) {
        newHours[day] = {
          start: sourceHours.start,
          end: sourceHours.end
        };
      }
    });
    
    setWorkingHours(newHours);
    onChange();
  };

  /**
   * Salvar horários de funcionamento
   */
  const handleSave = async () => {
    const updateData: BarbershopUpdateData = {
      settings: {
        workingHours
      }
    };

    await onSave(updateData);
  };

  /**
   * Verificar se há mudanças
   */
  const hasChanges = () => {
    if (!settings?.settings?.workingHours) return true;
    return JSON.stringify(workingHours) !== JSON.stringify(settings.settings.workingHours);
  };

  /**
   * Gerar opções de horário
   */
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeStr);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  if (!settings) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Horários de Funcionamento
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure os horários de funcionamento da sua barbearia para cada dia da semana
        </p>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Ações Rápidas</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={applyDefaultHours}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Aplicar Horário Padrão
          </button>
        </div>
      </div>

      {/* Horários por Dia */}
      <div className="space-y-4">
        {Object.entries(DAY_LABELS).map(([day, label]) => {
          const dayHours = workingHours[day];
          const isClosed = dayHours?.closed || false;

          return (
            <div key={day} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">{label}</h4>
                
                <div className="flex items-center space-x-3">
                  {!isClosed && (
                    <button
                      onClick={() => copyToAllDays(day)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                      title="Copiar para todos os dias"
                    >
                      Copiar para todos
                    </button>
                  )}
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isClosed}
                      onChange={() => handleToggleClosed(day)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Fechado</span>
                  </label>
                </div>
              </div>

              {!isClosed && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Abertura
                    </label>
                    <select
                      value={dayHours?.start || '08:00'}
                      onChange={(e) => handleDayChange(day, 'start', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {timeOptions.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Fechamento
                    </label>
                    <select
                      value={dayHours?.end || '18:00'}
                      onChange={(e) => handleDayChange(day, 'end', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {timeOptions.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {isClosed && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Fechado neste dia
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumo dos Horários */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-3">Resumo dos Horários</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(DAY_LABELS).map(([day, label]) => {
            const dayHours = workingHours[day];
            const isClosed = dayHours?.closed || false;
            
            return (
              <div key={day} className="flex justify-between">
                <span className="text-blue-700">{label}:</span>
                <span className="text-blue-900 font-medium">
                  {isClosed ? 'Fechado' : `${dayHours?.start} - ${dayHours?.end}`}
                </span>
              </div>
            );
          })}
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
              if (settings?.settings?.workingHours) {
                setWorkingHours(settings.settings.workingHours);
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
            Salvar Horários
          </button>
        </div>
      </div>
    </div>
  );
};