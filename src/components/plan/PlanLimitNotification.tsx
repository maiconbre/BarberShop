import React from 'react';
import { PlanError } from '../../types/plan';
import { getLimitMessage } from '../../services/PlanService';

interface PlanLimitNotificationProps {
  error: PlanError;
  onUpgrade?: () => void;
  onClose?: () => void;
  className?: string;
}

export const PlanLimitNotification: React.FC<PlanLimitNotificationProps> = ({
  error,
  onUpgrade,
  onClose,
  className = ''
}) => {
  const message = getLimitMessage(error);
  const isBarberLimit = error.code === 'BARBER_LIMIT_EXCEEDED';
  const isAppointmentLimit = error.code === 'APPOINTMENT_LIMIT_EXCEEDED';

  const getIcon = () => {
    if (isBarberLimit) return '👨‍💼';
    if (isAppointmentLimit) return '📅';
    return '⚠️';
  };

  const getTitle = () => {
    if (isBarberLimit) return 'Limite de Barbeiros Atingido';
    if (isAppointmentLimit) return 'Limite de Agendamentos Atingido';
    return 'Limite do Plano Atingido';
  };

  return (
    <div className={`bg-red-500/10 border border-red-500/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{getIcon()}</div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-red-400 font-semibold">{getTitle()}</h4>
            {onClose && (
              <button
                onClick={onClose}
                className="text-red-400 hover:text-red-300 transition-colors"
                aria-label="Fechar notificação"
              >
                ✕
              </button>
            )}
          </div>
          
          <p className="text-red-300 text-sm mb-4">
            {message}
          </p>

          {/* Usage Details */}
          {error.data && (
            <div className="bg-red-500/5 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-300">Uso atual:</span>
                <span className="text-red-200 font-medium">
                  {error.data.current}/{error.data.limit}
                </span>
              </div>
              <div className="w-full bg-red-900/30 rounded-full h-2 mt-2">
                <div 
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {onUpgrade && error.data?.upgradeRequired && (
              <button
                onClick={onUpgrade}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
              >
                Fazer Upgrade para Pro
              </button>
            )}
            
            <div className="text-xs text-red-400">
              Plano Pro: barbeiros e agendamentos ilimitados por R$ 39,90/mês
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};