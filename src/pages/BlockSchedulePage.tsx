import React, { useState, useEffect } from 'react';
import BlockAppointment from '../components/BlockAppointment';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const BlockSchedulePage: React.FC = () => {
  const { getCurrentUser } = useAuth();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [barbers, setBarbers] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar barbeiros da API
  useEffect(() => {
    const fetchBarbers = async () => {
      if (!currentUser) return;

      if (currentUser.role === 'admin') {
        try {
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
        } catch (error) {
          console.error('Erro ao buscar barbeiros:', error);
        }
      } else {
        // Se for barbeiro, usa seus próprios dados
        setBarbers([{ id: currentUser.id || '', name: currentUser.name || '' }]);
      }
      setIsLoading(false);
    };

    fetchBarbers();
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#0D121E] pt-24 px-4 sm:px-6 lg:px-8">
      {/* Botão Voltar */}
      <motion.button 
        onClick={() => navigate('/dashboard')}
        className="relative overflow-hidden group flex items-center gap-2 px-4 py-2 mb-6 bg-[#1A1F2E] rounded-lg hover:bg-[#252B3B] transition-all duration-300 text-white border border-[#F0B35B]/20 hover:border-[#F0B35B]/40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft size={18} className="text-[#F0B35B]" />
        <span>Voltar ao Dashboard</span>
        <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/10 to-[#F0B35B]/0 opacity-0 group-hover:opacity-100 transition-opacity -skew-x-45 animate-shine" />
      </motion.button>

      <div className="max-w-4xl mx-auto py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-[#F0B35B]" />
          </div>
        ) : (
          <BlockAppointment
            barbers={barbers}
            userRole={currentUser?.role || 'barber'}
            currentBarberId={currentUser?.id}
          />
        )}
      </div>
    </div>
  );
};

export default BlockSchedulePage;
