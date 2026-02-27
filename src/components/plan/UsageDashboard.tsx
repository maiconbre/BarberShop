import React, { useState } from 'react';
import { usePlanContext } from '../../contexts/PlanContext';
import {
  BarChart3,
  Users,
  Calendar,
  TrendingUp,
  Crown,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../services/PlanService';
import { TransactionHistory } from '../../types/plan';
import { safeFixed } from '../../utils/numberUtils';

interface UsageDashboardProps {
  className?: string;
}

export const UsageDashboard: React.FC<UsageDashboardProps> = ({ className = '' }) => {
  const {
    usage,
    planInfo,
    history,
    loading,
    error,
    upgradePlan,
    refreshHistory
  } = usePlanContext();

  const [upgrading, setUpgrading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      await upgradePlan({ planType: 'pro' });
      await refreshHistory();
    } catch (error) {
      console.error('Erro no upgrade:', error);
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <div className="flex items-center justify-center h-48">
          <div className="text-white">Carregando dashboard de uso...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-[#2D1D1E] border border-red-500/20 rounded-lg p-6 ${className}`}>
        <div className="text-red-400">Erro ao carregar dashboard: {error}</div>
      </div>
    );
  }

  if (!usage || !planInfo) {
    return (
      <div className={`bg-[#2D2A1E] border border-yellow-500/20 rounded-lg p-6 ${className}`}>
        <div className="text-yellow-400">Informações do plano não disponíveis</div>
      </div>
    );
  }

  const getUsageColor = (percentage: number, nearLimit: boolean) => {
    if (nearLimit || percentage >= 90) return 'text-red-400';
    if (percentage >= 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getProgressBarColor = (percentage: number, nearLimit: boolean) => {
    if (nearLimit || percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const barbersPercentage = usage.usage?.barbers?.limit === Infinity
    ? 0
    : Math.min((usage.usage?.barbers?.current || 0) / (usage.usage?.barbers?.limit || 1) * 100, 100);

  const appointmentsPercentage = usage.usage?.appointments?.limit === Infinity
    ? 0
    : Math.min((usage.usage?.appointments?.current || 0) / (usage.usage?.appointments?.limit || 1) * 100, 100);

  const shouldShowUpgrade = usage.planType === 'free' && (
    usage.upgradeRecommended ||
    usage.usage?.barbers?.nearLimit ||
    usage.usage?.appointments?.nearLimit
  );

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-[#F0B35B]" />
            <div>
              <h2 className="text-xl font-semibold text-white">Dashboard de Uso</h2>
              <p className="text-gray-400 text-sm">{planInfo.name}</p>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full text-sm font-medium ${planInfo.planType === 'pro'
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              : 'bg-gray-600 text-gray-200'
            }`}>
            {planInfo.planType === 'pro' ? (
              <span className="flex items-center gap-1">
                <Crown className="w-4 h-4" />
                Plano Pro
              </span>
            ) : (
              'Plano Gratuito'
            )}
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Barbeiros */}
          <div className="bg-[#1A1F2E] rounded-lg p-4 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-blue-400" />
              <h3 className="font-medium text-white">Barbeiros</h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">
                  {usage.usage?.barbers?.current || 0}
                </span>
                <span className="text-gray-400">
                  / {usage.usage?.barbers?.limit === Infinity ? '∞' : usage.usage?.barbers?.limit || 0}
                </span>
              </div>

              {usage.usage?.barbers?.limit !== Infinity && (
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(barbersPercentage, usage.usage?.barbers?.nearLimit || false)}`}
                    style={{ width: `${barbersPercentage}%` }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className={getUsageColor(barbersPercentage, usage.usage?.barbers?.nearLimit || false)}>
                  {safeFixed(barbersPercentage, 0)}% usado
                </span>
                {usage.usage?.barbers?.nearLimit && (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <AlertTriangle className="w-4 h-4" />
                    Próximo do limite
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Agendamentos */}
          <div className="bg-[#1A1F2E] rounded-lg p-4 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-green-400" />
              <h3 className="font-medium text-white">Agendamentos (mês atual)</h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">
                  {usage.usage?.appointments?.current || 0}
                </span>
                <span className="text-gray-400">
                  / {usage.usage?.appointments?.limit === Infinity ? '∞' : usage.usage?.appointments?.limit || 0}
                </span>
              </div>

              {usage.usage?.appointments?.limit !== Infinity && (
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(appointmentsPercentage, usage.usage?.appointments?.nearLimit || false)}`}
                    style={{ width: `${appointmentsPercentage}%` }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className={getUsageColor(appointmentsPercentage, usage.usage?.appointments?.nearLimit || false)}>
                  {safeFixed(appointmentsPercentage, 0)}% usado
                </span>
                {usage.usage?.appointments?.nearLimit && (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <AlertTriangle className="w-4 h-4" />
                    Próximo do limite
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Section */}
        {shouldShowUpgrade && (
          <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-purple-400 mt-1" />
              <div className="flex-1">
                <h4 className="text-purple-400 font-semibold mb-1">
                  {usage.upgradeRequired ? 'Upgrade Necessário' : 'Upgrade Recomendado'}
                </h4>
                <p className="text-purple-300 text-sm mb-3">
                  {usage.upgradeRequired
                    ? 'Você atingiu os limites do plano gratuito. Faça upgrade para continuar.'
                    : 'Você está próximo dos limites. Considere fazer upgrade para o Plano Pro.'
                  }
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                  >
                    {upgrading ? 'Processando...' : `Upgrade por ${formatCurrency(39.90)}/mês`}
                  </button>
                  <div className="text-purple-300 text-sm">
                    ✨ Barbeiros e agendamentos ilimitados
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#F0B35B]" />
              Histórico de Transações
            </h3>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-[#F0B35B] hover:text-[#F0B35B]/80 text-sm font-medium transition-colors"
            >
              {showHistory ? 'Ocultar' : 'Ver histórico'}
            </button>
          </div>

          {showHistory && (
            <div className="space-y-3">
              {history?.transactions && history.transactions.length > 0 ? (
                history.transactions.map((transaction: TransactionHistory) => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma transação encontrada</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Transaction Card Component
interface TransactionCardProps {
  transaction: TransactionHistory;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'plan_activation':
        return 'Ativação do Plano';
      case 'plan_upgrade':
        return 'Upgrade do Plano';
      default:
        return 'Transação';
    }
  };

  return (
    <div className="bg-[#1A1F2E] rounded-lg p-4 border border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon(transaction.status)}
          <div>
            <h4 className="text-white font-medium text-sm">
              {getTypeLabel(transaction.type)}
            </h4>
            <p className="text-gray-400 text-xs">
              {transaction.description}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-white font-semibold">
            {transaction.amount > 0 ? formatCurrency(transaction.amount) : 'Gratuito'}
          </div>
          <div className={`text-xs ${getStatusColor(transaction.status)}`}>
            {transaction.status === 'completed' ? 'Concluído' :
              transaction.status === 'pending' ? 'Pendente' : 'Falhou'}
          </div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-600/30">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{formatDate(transaction.createdAt)}</span>
          {transaction.transactionId && (
            <span>ID: {transaction.transactionId.slice(-8)}</span>
          )}
        </div>
      </div>
    </div>
  );
};