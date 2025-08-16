import React, { useState, useEffect } from 'react';
import ScheduleManager from '../components/feature/ScheduleManager';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Calendar } from 'lucide-react';
import { useBarbers } from '../hooks/useBarbers';
import { useTenant } from '../contexts/TenantContext';
import StandardLayout from '../components/layout/StandardLayout';

const ScheduleManagementPage: React.FC = () => {
  const { getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();
  const [isLoading, setIsLoading] = useState(true);
  
  // Hooks multi-tenant
  const { barbers: tenantBarbers, loadBarbers } = useBarbers();
  const { isValidTenant } = useTenant();
  
  // Local state for barbers (transformed for component use)
  const [barbers, setBarbers] = useState<Array<{ id: string; name: string }>>([]);

  // Função para buscar barbeiros usando o hook multi-tenant
  useEffect(() => {
    const loadBarbersData = async () => {
      if (!currentUser || !isValidTenant) return;

      try {
        if (currentUser && typeof currentUser === 'object' && 'role' in currentUser && currentUser.role === 'admin') {
          await loadBarbers();
          // Os dados serão atualizados no próximo useEffect
        } else {
          // Se for barbeiro, usar os dados do usuário atual
          setBarbers([{
            id: currentUser && typeof currentUser === 'object' && 'id' in currentUser && typeof currentUser.id === 'number' ? currentUser.id.toString() : '', // Ensure ID is string
            name: currentUser && typeof currentUser === 'object' && 'name' in currentUser && typeof currentUser.name === 'string' ? currentUser.name : ''
          }]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erro ao buscar barbeiros:', error);
        setIsLoading(false);
      }
    };

    loadBarbersData();
  }, [currentUser, isValidTenant, loadBarbers, setIsLoading, setBarbers]);
  
  // Atualizar barbeiros quando os dados do hook mudarem
  const currentUserRole = currentUser && typeof currentUser === 'object' && 'role' in currentUser ? currentUser.role : undefined;
  
  useEffect(() => {
    if (currentUser && typeof currentUser === 'object' && 'role' in currentUser && currentUser.role === 'admin' && tenantBarbers && tenantBarbers.length > 0) {
      const formattedBarbers = tenantBarbers.map((barber: { id: string; name: string }) => ({
        id: barber.id.toString(),
        name: barber.name
      }));
      setBarbers(formattedBarbers);
      setIsLoading(false); // Finalizar loading quando os dados chegarem
    }
  }, [tenantBarbers, currentUserRole, currentUser, setBarbers, setIsLoading]);

  if (!currentUser) return null;

  return (
    <StandardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Info Card */}
        <div className="mb-6">
          <div className="flex items-center gap-3 bg-[#1A1F2E] p-4 border border-[#F0B35B]/20">
            <div className="bg-[#F0B35B]/20 p-2 rounded-full">
              <Calendar className="w-5 h-5 text-[#F0B35B]" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Gerencie sua agenda</p>
              <p className="text-white font-medium">Horários e Agendamentos</p>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64 bg-[#1A1F2E] border border-[#F0B35B]/20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#F0B35B]" />
              <p className="text-gray-400">Carregando informações...</p>
            </div>
          </div>
        ) : (
          <ScheduleManager
            barbers={barbers}
            userRole={typeof currentUser === 'object' && 'role' in currentUser && (currentUser.role === 'admin' || currentUser.role === 'barber') ? currentUser.role : 'barber'}
            currentBarberId={currentUser && typeof currentUser === 'object' && 'id' in currentUser && typeof currentUser.id === 'number' ? currentUser.id.toString() : undefined}
          />
        )}
      </div>
    </StandardLayout>
  );
};

export default ScheduleManagementPage;