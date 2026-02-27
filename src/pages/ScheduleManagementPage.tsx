import React, { useState, useEffect } from 'react';
import ScheduleManager from '../components/feature/ScheduleManager';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBarbers } from '../hooks/useBarbers';
import { useTenant } from '../contexts/TenantContext';
import StandardLayout from '../components/layout/StandardLayout';

const ScheduleManagementPage: React.FC = () => {
  const { user } = useAuth();
  const currentUser = user;
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
            id: currentUser?.id || '',
            name: currentUser?.user_metadata?.name || currentUser?.email || 'Barbeiro'
          }]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erro ao buscar barbeiros:', error);
        setIsLoading(false);
      }
    };

    loadBarbersData();
  }, [currentUser, isValidTenant, loadBarbers]);

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

  if (!isValidTenant) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Contexto de tenant inválido</p>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout
      hideMobileHeader={true}
      title="Horários"
      subtitle="Gerencie sua agenda de alta performance"
      icon={<Calendar className="w-5 h-5 text-[#F0B35B]" />}
    >
      <main className="max-w-5xl mx-auto space-y-8">
        {/* Info Card Premium */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A1F2E]/40 p-6 rounded-[2.3rem] border border-white/5 shadow-xl flex flex-col sm:flex-row items-center gap-6"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-[#F0B35B] to-orange-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(240,179,91,0.3)] shrink-0">
            <Calendar className="w-8 h-8 text-black stroke-[2.5px]" />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Agenda Master</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Sincronize sua produtividade com eficiência</p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="bg-[#1A1F2E]/40 rounded-[2.3rem] border border-white/5 p-20 flex flex-col items-center gap-4">
            <RefreshCw className="w-10 h-10 animate-spin text-[#F0B35B]" />
            <span className="text-xs font-black uppercase tracking-widest text-gray-500">Sincronizando...</span>
          </div>
        ) : (
          <div className="relative">
            <ScheduleManager
              barbers={barbers}
              userRole={typeof currentUser === 'object' && 'role' in currentUser && (currentUser.role === 'admin' || currentUser.role === 'barber') ? currentUser.role : 'barber'}
              currentBarberId={currentUser?.id}
            />
          </div>
        )}
      </main>
    </StandardLayout>
  );
};

export default ScheduleManagementPage;