import React, { useState, useEffect } from 'react';
import ScheduleManager from '../components/feature/ScheduleManager';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ArrowLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBarberList, useFetchBarbers } from '../stores';

const ScheduleManagementPage: React.FC = () => {
  const { getCurrentUser } = useAuth();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [barbers, setBarbers] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Hooks do barberStore
  const barberList = useBarberList();
  const fetchBarbers = useFetchBarbers();

  // Função para buscar barbeiros usando o store
  useEffect(() => {
    const loadBarbers = async () => {
      if (!currentUser) return;

      try {
        if (currentUser.role === 'admin') {
          await fetchBarbers();
          // Não usar barberList aqui para evitar loop - será atualizado no próximo useEffect
        } else {
          // Se for barbeiro, usar os dados do usuário atual
          setBarbers([{
            id: currentUser.id?.toString() || '', // Garantir que o ID seja string
            name: currentUser.name || ''
          }]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erro ao buscar barbeiros:', error);
        setIsLoading(false);
      }
    };

    loadBarbers();
  }, [currentUser]); // Removido fetchBarbers das dependências
  
  // Atualizar barbeiros quando o store mudar
  useEffect(() => {
    if (currentUser?.role === 'admin' && barberList.length > 0) {
      const formattedBarbers = barberList.map((barber: any) => ({
        id: barber.id.toString(),
        name: barber.name
      }));
      setBarbers(formattedBarbers);
      setIsLoading(false); // Finalizar loading quando os dados chegarem
    }
  }, [barberList, currentUser?.role]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#0D121E] pt-24 px-4 sm:px-6 lg:px-8">
      {/* Cabeçalho com botão de voltar */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar ao Dashboard</span>
          </motion.button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Gerenciamento de <span className="text-[#F0B35B]">Horários</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3 bg-[#1A1F2E] p-3 rounded-lg border border-[#F0B35B]/20">
          <div className="bg-[#F0B35B]/20 p-2 rounded-full">
            <Calendar className="w-5 h-5 text-[#F0B35B]" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Gerencie sua agenda</p>
            <p className="text-white font-medium">Horários e Agendamentos</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64 bg-[#1A1F2E] rounded-xl border border-[#F0B35B]/20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#F0B35B]" />
              <p className="text-gray-400">Carregando informações...</p>
            </div>
          </div>
        ) : (
          <ScheduleManager
            barbers={barbers}
            userRole={currentUser?.role || 'barber'}
            currentBarberId={currentUser?.id}
          />
        )}
      </div>

      {/* Espaçamento inferior */}
      <div className="mb-16"></div>
    </div>
  );
};

export default ScheduleManagementPage;