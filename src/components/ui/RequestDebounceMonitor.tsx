import React, { useState, useEffect } from 'react';
import { useRequestDebouncer } from '../../utils/requestDebouncer';

interface RequestDebounceMonitorProps {
  className?: string;
}

const RequestDebounceMonitor: React.FC<RequestDebounceMonitorProps> = ({ className = '' }) => {
  const { getStats } = useRequestDebouncer();
  const [stats, setStats] = useState(getStats());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Só mostrar em desenvolvimento
    if (import.meta.env.DEV) {
      const interval = setInterval(() => {
        const newStats = getStats();
        setStats(newStats);
        
        // Mostrar apenas se houver atividade
        setIsVisible(newStats.totalRequests > 0);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [getStats]);

  // Não renderizar em produção ou se não há atividade
  if (!import.meta.env.DEV || !isVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded-lg border border-gray-600 z-50 ${className}`}>
      <div className="font-semibold mb-1">🔧 Request Monitor</div>
      <div>Total: {stats.totalRequests}</div>
      <div>Pendentes: {stats.pendingRequests}</div>
      <div>Salvos: {stats.savedRequests}</div>
    </div>
  );
};

export default RequestDebounceMonitor;