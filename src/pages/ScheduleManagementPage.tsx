import React, { useState, useEffect } from 'react';
import ScheduleManager from '../components/ScheduleManager';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ArrowLeft, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ScheduleManagementPage: React.FC = () => {
  const { getCurrentUser } = useAuth();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [barbers, setBarbers] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar barbeiros da API
  useEffect(() => {
    const fetchBarbers = async () => {
      if (!currentUser) return;

      try {
        if (currentUser.role === 'admin') {
          const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/barbers`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const data = await response.json();
          if (data.success) {
            setBarbers(data.data.map((barber: any) => ({
              id: barber.id,
              name: barber.name
            })));
          }
        } else {
          // Se for barbeiro, só mostra ele mesmo
          setBarbers([{ id: currentUser.id || '', name: currentUser.name || '' }]);
        }
      } catch (error) {
        console.error('Erro ao buscar barbeiros:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBarbers();
  }, [currentUser]);

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

      {/* Seção de instruções */}
      <div className="max-w-4xl mx-auto mt-8 mb-16 bg-[#1A1F2E] rounded-xl border border-[#F0B35B]/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-[#F0B35B]" />
          <h2 className="text-xl font-bold text-white">Como gerenciar seus horários</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#252B3B] p-4 rounded-lg border border-[#F0B35B]/10">
            <h3 className="text-[#F0B35B] font-medium mb-2">Bloquear Horários</h3>
            <p className="text-gray-300 text-sm">
              Selecione uma data e um horário disponível no calendário e clique para bloqueá-lo. 
              Horários bloqueados não estarão disponíveis para agendamentos de clientes.
            </p>
          </div>
          
          <div className="bg-[#252B3B] p-4 rounded-lg border border-[#F0B35B]/10">
            <h3 className="text-[#F0B35B] font-medium mb-2">Cancelar Agendamentos</h3>
            <p className="text-gray-300 text-sm">
              Clique em um horário ocupado (vermelho) para ver os detalhes do agendamento e 
              cancelá-lo se necessário. Esta ação não pode ser desfeita.
            </p>
          </div>
          
          <div className="bg-[#252B3B] p-4 rounded-lg border border-[#F0B35B]/10">
            <h3 className="text-[#F0B35B] font-medium mb-2">Desbloquear Horários</h3>
            <p className="text-gray-300 text-sm">
              Clique em um horário bloqueado (laranja) para desbloqueá-lo e torná-lo 
              disponível novamente para agendamentos.
            </p>
          </div>
          
          <div className="bg-[#252B3B] p-4 rounded-lg border border-[#F0B35B]/10">
            <h3 className="text-[#F0B35B] font-medium mb-2">Visualizar Agendamentos</h3>
            <p className="text-gray-300 text-sm">
              Alterne entre as visualizações de calendário e lista para ver todos os seus 
              agendamentos organizados por data e horário.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManagementPage;