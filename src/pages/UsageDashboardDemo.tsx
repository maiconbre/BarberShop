import React from 'react';
import StandardLayout from '../components/layout/StandardLayout';
import { UsageDashboard } from '../components/plan';
import { PlanProvider } from '../contexts/PlanContext';

/**
 * Demo page to showcase the Usage Dashboard component
 * This page demonstrates all the features implemented in task 12.3
 */
const UsageDashboardDemo: React.FC = () => {
  return (
    <PlanProvider>
      <StandardLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="bg-[#1A1F2E]/50 border border-[#F0B35B]/20 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              📊 Dashboard de Uso - Demo
            </h1>
            <p className="text-gray-400 mb-4">
              Demonstração completa do dashboard de uso implementado na tarefa 12.3
            </p>
            
            {/* Features List */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">✅ Funcionalidades Implementadas:</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">•</span>
                  <strong>Uso atual:</strong> X/1 barbeiros, Y/20 agendamentos no mês
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">•</span>
                  <strong>Indicador visual:</strong> Barras de progresso com cores baseadas na proximidade dos limites
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">•</span>
                  <strong>Botão de upgrade:</strong> Destacado quando necessário (plano gratuito próximo dos limites)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">•</span>
                  <strong>Histórico de transações:</strong> Lista expansível com detalhes de upgrades realizados
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">•</span>
                  <strong>Multi-tenant:</strong> Dados isolados por barbearia
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">•</span>
                  <strong>Estados responsivos:</strong> Loading, erro, plano gratuito e pro
                </li>
              </ul>
            </div>
          </div>

          {/* Usage Dashboard Component */}
          <UsageDashboard />

          {/* Implementation Notes */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">🔧 Detalhes da Implementação</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-300">
              <div>
                <h4 className="font-medium mb-2">Componentes Criados:</h4>
                <ul className="space-y-1">
                  <li>• <code>UsageDashboard.tsx</code></li>
                  <li>• <code>UsageDashboardPage.tsx</code></li>
                  <li>• <code>TransactionCard</code> (interno)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Integração:</h4>
                <ul className="space-y-1">
                  <li>• Integrado ao <code>DashboardPageNew</code></li>
                  <li>• Usa <code>PlanContext</code> existente</li>
                  <li>• Compatível com sistema multi-tenant</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </StandardLayout>
    </PlanProvider>
  );
};

export default UsageDashboardDemo;