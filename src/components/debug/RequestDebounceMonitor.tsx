import React, { useState, useEffect } from 'react';
import { requestDebouncer } from '../../utils/requestDebouncer';
import { LogConfig } from '../../config/logConfig';

interface RequestStats {
  totalRequests: number;
  debouncedRequests: number;
  pendingRequests: number;
  savedRequests: number;
}

const RequestDebounceMonitor: React.FC = () => {
  const [stats, setStats] = useState<RequestStats>({
    totalRequests: 0,
    debouncedRequests: 0,
    pendingRequests: 0,
    savedRequests: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Só mostrar em desenvolvimento
    if (!LogConfig.verboseLogging || import.meta.env.PROD) {
      return;
    }

    const updateStats = () => {
      const debounceStats = requestDebouncer.getStats();
      setStats({
        totalRequests: debounceStats.totalRequests,
        debouncedRequests: debounceStats.debouncedRequests,
        pendingRequests: debounceStats.pendingRequests,
        savedRequests: debounceStats.savedRequests
      });
    };

    // Atualizar a cada 2 segundos
    const interval = setInterval(updateStats, 2000);
    updateStats(); // Primeira atualização imediata

    return () => clearInterval(interval);
  }, []);

  // Não renderizar em produção ou se logs não estão habilitados
  if (!LogConfig.verboseLogging || import.meta.env.PROD) {
    return null;
  }

  const efficiency = stats.totalRequests > 0 
    ? Math.round((stats.savedRequests / stats.totalRequests) * 100)
    : 0;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded-full shadow-lg transition-colors"
        title="Request Debounce Monitor"
      >
        🚀 {stats.pendingRequests}
      </button>
      
      {isVisible && (
        <div className="absolute bottom-10 right-0 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-xl min-w-[200px]">
          <div className="font-bold mb-2 text-blue-400">Request Debounce Stats</div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="font-mono">{stats.totalRequests}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Executed:</span>
              <span className="font-mono text-green-400">{stats.debouncedRequests}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Pending:</span>
              <span className="font-mono text-yellow-400">{stats.pendingRequests}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Saved:</span>
              <span className="font-mono text-blue-400">{stats.savedRequests}</span>
            </div>
            
            <div className="border-t border-gray-700 pt-1 mt-2">
              <div className="flex justify-between">
                <span>Efficiency:</span>
                <span className={`font-mono ${
                  efficiency >= 50 ? 'text-green-400' : 
                  efficiency >= 25 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {efficiency}%
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              requestDebouncer.clear();
              setStats({
                totalRequests: 0,
                debouncedRequests: 0,
                pendingRequests: 0,
                savedRequests: 0
              });
            }}
            className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white text-xs py-1 rounded transition-colors"
          >
            Clear Stats
          </button>
        </div>
      )}
    </div>
  );
};

export default RequestDebounceMonitor;