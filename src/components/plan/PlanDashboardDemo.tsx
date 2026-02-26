import React, { useState } from 'react';
import { usePlanContext } from '../../contexts/PlanContext';
import { PlanUsageCard } from './PlanUsageCard';
import { PlanLimitGuard } from './PlanLimitGuard';
import { PlanLimitNotification } from './PlanLimitNotification';

/**
 * Componente de demonstração que mostra como usar o sistema de planos
 * Este componente pode ser integrado no dashboard principal
 */
export const PlanDashboardDemo: React.FC = () => {
  const { 
    usage, 
    planInfo, 
    loading, 
    error, 
    upgradePlan,
    lastLimitError,
    clearLimitError
  } = usePlanContext();

  const [upgrading, setUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      await upgradePlan({ planType: 'pro' });
      setUpgradeSuccess(true);
      setTimeout(() => setUpgradeSuccess(false), 5000);
    } catch (error) {
      console.error('Erro no upgrade:', error);
    } finally {
      setUpgrading(false);
    }
  };

  const simulateCreateBarber = async () => {
    // Simular criação de barbeiro
    console.log('Criando barbeiro...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Barbeiro criado com sucesso!');
  };

  const simulateCreateAppointment = async () => {
    // Simular criação de agendamento
    console.log('Criando agendamento...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Agendamento criado com sucesso!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Carregando informações do plano...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="text-red-400">Erro ao carregar plano: {error}</div>
      </div>
    );
  }

  if (!usage || !planInfo) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="text-yellow-400">Informações do plano não disponíveis</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {upgradeSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="text-green-400 font-semibold">
            🎉 Upgrade realizado com sucesso! Agora você tem acesso ao Plano Pro.
          </div>
        </div>
      )}

      {/* Plan Usage Card */}
      <PlanUsageCard 
        usage={usage}
        onUpgrade={handleUpgrade}
      />

      {/* Global Limit Error Notification */}
      {lastLimitError && (
        <PlanLimitNotification
          error={lastLimitError}
          onUpgrade={handleUpgrade}
          onClose={clearLimitError}
        />
      )}

      {/* Demo Actions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Ações de Demonstração</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Create Barber Demo */}
          <PlanLimitGuard
            feature="barbers"
            action={simulateCreateBarber}
            onUpgrade={handleUpgrade}
            fallbackMessage="Limite de barbeiros atingido para o plano gratuito"
          >
            {({ canExecute, execute, loading: actionLoading }) => (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Criar Barbeiro</h4>
                <p className="text-gray-300 text-sm mb-3">
                  Teste a criação de um novo barbeiro
                </p>
                <button
                  onClick={execute}
                  disabled={actionLoading || upgrading}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    canExecute && !actionLoading && !upgrading
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {actionLoading ? 'Criando...' : 'Criar Barbeiro'}
                </button>
                {!canExecute && (
                  <p className="text-yellow-400 text-xs mt-2">
                    ⚠️ Limite atingido - upgrade necessário
                  </p>
                )}
              </div>
            )}
          </PlanLimitGuard>

          {/* Create Appointment Demo */}
          <PlanLimitGuard
            feature="appointments"
            action={simulateCreateAppointment}
            onUpgrade={handleUpgrade}
            fallbackMessage="Limite de agendamentos mensais atingido para o plano gratuito"
          >
            {({ canExecute, execute, loading: actionLoading }) => (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Criar Agendamento</h4>
                <p className="text-gray-300 text-sm mb-3">
                  Teste a criação de um novo agendamento
                </p>
                <button
                  onClick={execute}
                  disabled={actionLoading || upgrading}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    canExecute && !actionLoading && !upgrading
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {actionLoading ? 'Criando...' : 'Criar Agendamento'}
                </button>
                {!canExecute && (
                  <p className="text-yellow-400 text-xs mt-2">
                    ⚠️ Limite atingido - upgrade necessário
                  </p>
                )}
              </div>
            )}
          </PlanLimitGuard>
        </div>
      </div>

      {/* Plan Info */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Informações da Barbearia</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Nome:</span>
            <span className="text-white ml-2">{planInfo.name}</span>
          </div>
          <div>
            <span className="text-gray-400">Slug:</span>
            <span className="text-white ml-2">{planInfo.slug}</span>
          </div>
          <div>
            <span className="text-gray-400">Plano:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
              planInfo.planType === 'pro' 
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-gray-600/20 text-gray-300'
            }`}>
              {planInfo.planType === 'pro' ? 'Pro' : 'Gratuito'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Criado em:</span>
            <span className="text-white ml-2">
              {new Date(planInfo.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};