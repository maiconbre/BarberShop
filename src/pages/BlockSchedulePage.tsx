import React, { useState, useEffect } from 'react';
import BlockAppointment from '../components/BlockAppointment';
import { useAuth } from '../contexts/AuthContext';
import CacheService from '../services/CacheService';
import { Loader2 } from 'lucide-react';

const BlockSchedulePage: React.FC = () => {
  const { getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();
  const [isLoading, setIsLoading] = useState(true);
  const [barbers, setBarbers] = useState<Array<{ id: string; name: string }>>([]);

  // Efeito para carregar barbeiros do cache ou da API
  useEffect(() => {
    const loadBarbers = async () => {
      setIsLoading(true);
      try {
        // Tentar carregar barbeiros do cache
        let barbersData;
        
        if (currentUser?.role === 'admin') {
          // Para admin, buscar todos os barbeiros do cache
          barbersData = await CacheService.getCache<Array<{ id: string; name: string }>>('barbers');
          
          // Se não tiver no cache e o usuário tiver a lista de barbeiros, usar essa
          if (!barbersData && currentUser.barbers) {
            barbersData = currentUser.barbers;
            // Salvar no cache para uso futuro
            await CacheService.setCache('barbers', barbersData);
          }
        } else {
          // Para barbeiro, usar apenas seus próprios dados
          barbersData = [{ id: currentUser?.barberId || '', name: currentUser?.name || '' }];
        }
        
        // Se ainda não tiver dados, usar um array vazio
        setBarbers(barbersData || []);
      } catch (error) {
        console.error('Erro ao carregar barbeiros:', error);
        // Fallback para os dados do usuário atual
        if (currentUser?.role === 'admin') {
          setBarbers(currentUser.barbers || []);
        } else {
          setBarbers([{ id: currentUser?.barberId || '', name: currentUser?.name || '' }]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      loadBarbers();
    }
  }, [currentUser]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0D121E] pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#F0B35B]" />
          </div>
        ) : (
          <BlockAppointment
            barbers={barbers}
            userRole={currentUser?.role || 'barber'}
            currentBarberId={currentUser?.barberId}
          />
        )}
      </div>
    </div>
  );
};

export default BlockSchedulePage;
