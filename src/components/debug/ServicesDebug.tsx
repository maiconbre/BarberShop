import React, { useEffect, useState } from 'react';
import { useServices } from '../../hooks/useServices';
import { useTenant } from '../../contexts/TenantContext';

interface DebugInfo {
  isValidTenant?: boolean;
  barbershopId?: string | null;
  barbershopData?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  servicesCount?: number;
  services?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  loading?: boolean;
  error?: string | null;
  fetchError?: string;
}

const ServicesDebug: React.FC = () => {
  const { services, loading, error, loadServices, isValidTenant, barbershopId } = useServices();
  const { barbershopData } = useTenant();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        // Tentar carregar serviços
        if (isValidTenant) {
          await loadServices();
        }
        
        setDebugInfo({
          isValidTenant,
          barbershopId,
          barbershopData: barbershopData ? {
            id: barbershopData.id,
            name: barbershopData.name,
            slug: barbershopData.slug
          } : null,
          servicesCount: services?.length || 0,
          services: services?.map(s => ({
            id: s.id,
            name: s.name,
            price: s.price
          })) || [],
          loading,
          error: error?.message || null
        });
      } catch (err) {
        setDebugInfo(prev => ({
          ...prev,
          fetchError: err instanceof Error ? err.message : String(err)
        }));
      }
    };

    fetchDebugInfo();
  }, [isValidTenant, barbershopId, barbershopData, services, loading, error, loadServices]);

  return (
    <div className="fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg max-w-md z-50 text-xs">
      <h3 className="font-bold mb-2 text-yellow-400">🔍 Services Debug</h3>
      <pre className="whitespace-pre-wrap overflow-auto max-h-96">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      {isValidTenant && (
        <button 
          onClick={() => loadServices()}
          className="mt-2 px-2 py-1 bg-blue-600 rounded text-xs"
        >
          Reload Services
        </button>
      )}
    </div>
  );
};

export default ServicesDebug;