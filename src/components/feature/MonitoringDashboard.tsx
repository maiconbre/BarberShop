import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
 
  MessageSquare, 
  TrendingUp,
  RefreshCw,
  Download
} from 'lucide-react';
import { monitoringService, ErrorLog, PerformanceMetric, UserFeedback } from '../../services/MonitoringService';
import { safeFixed } from '../../utils/numberUtils';

const MonitoringDashboard: React.FC = () => {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [userFeedbacks, setUserFeedbacks] = useState<UserFeedback[]>([]);
  const [healthStatus, setHealthStatus] = useState(monitoringService.getHealthStatus());
  const [activeTab, setActiveTab] = useState<'overview' | 'errors' | 'performance' | 'feedback'>('overview');

  const refreshData = () => {
    setErrorLogs(monitoringService.getErrorLogs());
    setPerformanceMetrics(monitoringService.getPerformanceMetrics());
    setUserFeedbacks(monitoringService.getUserFeedbacks());
    setHealthStatus(monitoringService.getHealthStatus());
  };

  useEffect(() => {
    refreshData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const exportLogs = () => {
    const data = {
      timestamp: new Date().toISOString(),
      healthStatus,
      errorLogs,
      performanceMetrics,
      userFeedbacks,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return AlertTriangle;
      default: return Activity;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Activity },
    { id: 'errors', label: 'Erros', icon: AlertTriangle },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitoramento do Sistema</h1>
          <p className="text-gray-400">Acompanhe a saúde e performance da plataforma</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-[#252B3B] text-white rounded-lg hover:bg-[#2E354A] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 px-4 py-2 bg-[#F0B35B] text-black rounded-lg hover:bg-[#E6A555] transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A1F2E] p-6 rounded-xl border border-[#F0B35B]/20"
        >
          <div className="flex items-center gap-3">
            {React.createElement(getStatusIcon(healthStatus.status), {
              className: `w-8 h-8 ${getStatusColor(healthStatus.status)}`
            })}
            <div>
              <p className="text-sm text-gray-400">Status do Sistema</p>
              <p className={`text-lg font-semibold capitalize ${getStatusColor(healthStatus.status)}`}>
                {healthStatus.status === 'healthy' ? 'Saudável' : 
                 healthStatus.status === 'warning' ? 'Atenção' : 'Crítico'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1A1F2E] p-6 rounded-xl border border-[#F0B35B]/20"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-sm text-gray-400">Erros (1h)</p>
              <p className="text-lg font-semibold text-white">{healthStatus.errorCount}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1A1F2E] p-6 rounded-xl border border-[#F0B35B]/20"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-sm text-gray-400">Avisos (1h)</p>
              <p className="text-lg font-semibold text-white">{healthStatus.warningCount}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1A1F2E] p-6 rounded-xl border border-[#F0B35B]/20"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm text-gray-400">Feedbacks</p>
              <p className="text-lg font-semibold text-white">{userFeedbacks.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#F0B35B]/20">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#F0B35B] text-[#F0B35B]'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            {Object.keys(healthStatus.averagePerformance).length > 0 && (
              <div className="bg-[#1A1F2E] p-6 rounded-xl border border-[#F0B35B]/20">
                <h3 className="text-lg font-semibold text-white mb-4">Performance Média (1h)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(healthStatus.averagePerformance).map(([metric, value]) => (
                    <div key={metric} className="bg-[#252B3B] p-4 rounded-lg">
                      <p className="text-sm text-gray-400 capitalize">{metric.replace('_', ' ')}</p>
                      <p className="text-xl font-semibold text-white">
                        {typeof value === 'number' ? safeFixed(value, 2) : value}
                        {metric.includes('time') ? 'ms' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Errors */}
            {healthStatus.lastError && (
              <div className="bg-[#1A1F2E] p-6 rounded-xl border border-red-500/20">
                <h3 className="text-lg font-semibold text-white mb-4">Último Erro</h3>
                <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                  <p className="text-red-400 font-medium">{healthStatus.lastError.message}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {new Date(healthStatus.lastError.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="bg-[#1A1F2E] p-6 rounded-xl border border-[#F0B35B]/20">
            <h3 className="text-lg font-semibold text-white mb-4">Logs de Erro</h3>
            <div className="space-y-3">
              {errorLogs.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Nenhum erro registrado</p>
              ) : (
                errorLogs.map((log) => (
                  <div key={log.id} className="bg-[#252B3B] p-4 rounded-lg border-l-4 border-red-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-white font-medium">{log.message}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                        {log.url && (
                          <p className="text-xs text-gray-500 mt-1">URL: {log.url}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.level === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {log.level}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="bg-[#1A1F2E] p-6 rounded-xl border border-[#F0B35B]/20">
            <h3 className="text-lg font-semibold text-white mb-4">Métricas de Performance</h3>
            <div className="space-y-3">
              {performanceMetrics.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Nenhuma métrica registrada</p>
              ) : (
                performanceMetrics.map((metric) => (
                  <div key={metric.id} className="bg-[#252B3B] p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium capitalize">{metric.metric.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(metric.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-[#F0B35B]">
                          {safeFixed(metric.value, 2)}
                          {metric.metric.includes('time') ? 'ms' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="bg-[#1A1F2E] p-6 rounded-xl border border-[#F0B35B]/20">
            <h3 className="text-lg font-semibold text-white mb-4">Feedback dos Usuários</h3>
            <div className="space-y-3">
              {userFeedbacks.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Nenhum feedback recebido</p>
              ) : (
                userFeedbacks.map((feedback) => (
                  <div key={feedback.id} className="bg-[#252B3B] p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          feedback.type === 'bug' ? 'bg-red-500/20 text-red-400' :
                          feedback.type === 'feature' ? 'bg-green-500/20 text-green-400' :
                          feedback.type === 'improvement' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {feedback.type}
                        </span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${
                                star <= feedback.rating ? 'text-[#F0B35B]' : 'text-gray-600'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(feedback.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-white">{feedback.message}</p>
                    {feedback.email && (
                      <p className="text-sm text-gray-400 mt-2">Contato: {feedback.email}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringDashboard;