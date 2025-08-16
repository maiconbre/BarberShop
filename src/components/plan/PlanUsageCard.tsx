import React from 'react';
import { PlanUsage } from '../../types/plan';
import { getUsagePercentage, formatCurrency } from '../../services/PlanService';

interface PlanUsageCardProps {
  usage: PlanUsage;
  onUpgrade?: () => void;
  className?: string;
}

export const PlanUsageCard: React.FC<PlanUsageCardProps> = ({ 
  usage, 
  onUpgrade,
  className = '' 
}) => {
  const barbersPercentage = getUsagePercentage(
    usage.usage.barbers.current, 
    usage.usage.barbers.limit
  );
  
  const appointmentsPercentage = getUsagePercentage(
    usage.usage.appointments.current, 
    usage.usage.appointments.limit
  );

  const getProgressColor = (percentage: number, nearLimit: boolean) => {
    if (nearLimit || percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPlanBadgeColor = (planType: string) => {
    return planType === 'pro' 
      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
      : 'bg-gray-600 text-gray-200';
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Uso do Plano</h3>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${getPlanBadgeColor(usage.planType)}`}>
            {usage.planType === 'pro' ? '⭐ Plano Pro' : '🆓 Plano Gratuito'}
          </div>
        </div>
        
        {usage.upgradeRecommended && usage.planType === 'free' && (
          <button
            onClick={onUpgrade}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
          >
            Fazer Upgrade
          </button>
        )}
      </div>

      {/* Usage Stats */}
      <div className="space-y-6">
        {/* Barbeiros */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 font-medium">Barbeiros</span>
            <span className="text-white font-semibold">
              {usage.usage.barbers.current}/{usage.usage.barbers.limit === Infinity ? '∞' : usage.usage.barbers.limit}
            </span>
          </div>
          
          {usage.usage.barbers.limit !== Infinity && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(barbersPercentage, usage.usage.barbers.nearLimit)}`}
                style={{ width: `${barbersPercentage}%` }}
              />
            </div>
          )}
          
          {usage.usage.barbers.nearLimit && (
            <p className="text-yellow-400 text-sm mt-1">
              ⚠️ Próximo do limite de barbeiros
            </p>
          )}
        </div>

        {/* Agendamentos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 font-medium">Agendamentos (mês atual)</span>
            <span className="text-white font-semibold">
              {usage.usage.appointments.current}/{usage.usage.appointments.limit === Infinity ? '∞' : usage.usage.appointments.limit}
            </span>
          </div>
          
          {usage.usage.appointments.limit !== Infinity && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(appointmentsPercentage, usage.usage.appointments.nearLimit)}`}
                style={{ width: `${appointmentsPercentage}%` }}
              />
            </div>
          )}
          
          {usage.usage.appointments.nearLimit && (
            <p className="text-yellow-400 text-sm mt-1">
              ⚠️ Próximo do limite de agendamentos mensais
            </p>
          )}
        </div>
      </div>

      {/* Upgrade Notification */}
      {usage.upgradeRequired && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-red-400 text-xl">🚨</div>
            <div>
              <h4 className="text-red-400 font-semibold mb-1">Limite Atingido</h4>
              <p className="text-red-300 text-sm mb-3">
                Você atingiu os limites do plano gratuito. Faça upgrade para continuar usando todos os recursos.
              </p>
              {onUpgrade && (
                <button
                  onClick={onUpgrade}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Fazer Upgrade Agora
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pro Plan Benefits */}
      {usage.planType === 'free' && !usage.upgradeRequired && (
        <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <h4 className="text-purple-400 font-semibold mb-2">⭐ Benefícios do Plano Pro</h4>
          <ul className="text-purple-300 text-sm space-y-1">
            <li>• Barbeiros ilimitados</li>
            <li>• Agendamentos ilimitados</li>
            <li>• Suporte prioritário</li>
            <li>• Relatórios avançados</li>
          </ul>
          <p className="text-purple-200 text-sm mt-3 font-medium">
            Por apenas {formatCurrency(39.90)}/mês
          </p>
        </div>
      )}
    </div>
  );
};