import React from 'react';
import StandardLayout from '../components/layout/StandardLayout';
import { UsageDashboard } from '../components/plan';
import { PlanProvider } from '../contexts/PlanContext';

const UsageDashboardPage: React.FC = () => {
  return (
    <PlanProvider>
      <StandardLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="bg-[#1A1F2E]/50 border border-[#F0B35B]/20 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              Dashboard de Uso
            </h1>
            <p className="text-gray-400">
              Acompanhe o uso dos recursos da sua barbearia e gerencie seu plano
            </p>
          </div>

          {/* Usage Dashboard */}
          <UsageDashboard />
        </div>
      </StandardLayout>
    </PlanProvider>
  );
};

export default UsageDashboardPage;