import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlan } from '../../hooks/usePlan';
import { formatCurrency } from '../../services/PlanService';
import { PLAN_PRICES } from '../../types/plan';

interface PlanUpgradeNotificationProps {
  className?: string;
}

export const PlanUpgradeNotification: React.FC<PlanUpgradeNotificationProps> = ({ 
  className = '' 
}) => {
  const navigate = useNavigate();
  const { barbershopSlug } = useParams();
  const { usage, planInfo, loading } = usePlan();

  // Don't show if loading or already on Pro plan
  if (loading || !usage || !planInfo || planInfo.planType === 'pro') {
    return null;
  }

  // Don't show if not recommended or required
  if (!usage.upgradeRecommended && !usage.upgradeRequired) {
    return null;
  }

  const handleUpgradeClick = () => {
    navigate(`/app/${barbershopSlug}/upgrade`);
  };

  const getNotificationStyle = () => {
    if (usage.upgradeRequired) {
      return {
        container: 'bg-red-500/10 border-red-500/30',
        icon: '🚨',
        title: 'Upgrade Necessário',
        titleColor: 'text-red-400',
        message: 'Você atingiu os limites do plano gratuito. Faça upgrade para continuar usando todos os recursos.',
        messageColor: 'text-red-300',
        button: 'bg-red-500 hover:bg-red-600'
      };
    } else {
      return {
        container: 'bg-yellow-500/10 border-yellow-500/30',
        icon: '⚠️',
        title: 'Upgrade Recomendado',
        titleColor: 'text-yellow-400',
        message: 'Você está próximo dos limites do plano gratuito. Considere fazer upgrade para evitar interrupções.',
        messageColor: 'text-yellow-300',
        button: 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
      };
    }
  };

  const style = getNotificationStyle();

  return (
    <div className={`border rounded-lg p-4 ${style.container} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="text-xl">{style.icon}</div>
        
        <div className="flex-1">
          <h4 className={`font-semibold mb-2 ${style.titleColor}`}>
            {style.title}
          </h4>
          
          <p className={`text-sm mb-4 ${style.messageColor}`}>
            {style.message}
          </p>

          {/* Usage Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Barbeiros</div>
              <div className="text-sm font-medium text-white">
                {usage.usage.barbers.current}/{usage.usage.barbers.limit}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                <div 
                  className={`h-1 rounded-full ${usage.usage.barbers.nearLimit ? 'bg-red-500' : 'bg-yellow-500'}`}
                  style={{ 
                    width: `${Math.min((usage.usage.barbers.current / usage.usage.barbers.limit) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Agendamentos/mês</div>
              <div className="text-sm font-medium text-white">
                {usage.usage.appointments.current}/{usage.usage.appointments.limit}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                <div 
                  className={`h-1 rounded-full ${usage.usage.appointments.nearLimit ? 'bg-red-500' : 'bg-yellow-500'}`}
                  style={{ 
                    width: `${Math.min((usage.usage.appointments.current / usage.usage.appointments.limit) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleUpgradeClick}
              className={`${style.button} text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105`}
            >
              {usage.upgradeRequired ? 'Fazer Upgrade Agora' : 'Upgrade para Pro'}
            </button>
            
            <div className="text-xs text-gray-400">
              Por apenas {formatCurrency(PLAN_PRICES.pro)}/mês
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};