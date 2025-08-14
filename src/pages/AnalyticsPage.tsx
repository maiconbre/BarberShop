import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3 } from 'lucide-react';
import ClientAnalytics from '../components/feature/ClientAnalytics';
import StandardLayout from '../components/layout/StandardLayout';
import { loadAppointments as loadAppointmentsService } from '../services/AppointmentService';

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed';
  barberId: string;
  barberName: string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
  viewed?: boolean;
  isBlocked?: boolean;
}

const AnalyticsPage: React.FC = () => {
  const { getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const filteredAppointments = useMemo(() => {
    if (!appointments.length) return [];

    let filtered = appointments;

    // Filtro por role do usuário: barbeiros veem apenas seus agendamentos
    if (currentUser && typeof currentUser === 'object' && 'role' in currentUser && currentUser.role === 'barber' && 'id' in currentUser) {
      filtered = filtered.filter(app => app.barberId === (currentUser as { id: string | number }).id.toString());
    }

    return filtered;
  }, [appointments, currentUser]);



  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      if (!isSubscribed || !navigator.onLine) return;

      try {
        const fetchedAppointments = await loadAppointmentsService();
        
        if (!isSubscribed) return;
        
        if (!Array.isArray(fetchedAppointments)) {
          throw new Error('Invalid appointments data received');
        }
        
        setAppointments(fetchedAppointments);
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        if (isSubscribed) {
          setAppointments(prev => prev.length > 0 ? prev : []);
        }
      }
    };

    const timeoutId = setTimeout(fetchData, 50);

    return () => {
      isSubscribed = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <StandardLayout
      title="Relatórios"
      subtitle="Análise de desempenho e estatísticas detalhadas"
      icon={<BarChart3 className="w-6 h-6" />}
    >
      <style>{`
        .refresh-icon-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

      `}</style>

      <div className="space-y-1">


        {/* Analytics de Clientes */}
        <div className="bg-[#1A1F2E]/50 p-6 border border-[#F0B35B]/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#F0B35B]" />
            Análise de Clientes
          </h3>
          <ClientAnalytics appointments={filteredAppointments} />
        </div>

        {/* Informações adicionais */}
        <div className="bg-[#1A1F2E]/30 p-6 border border-[#F0B35B]/10">
          <h4 className="text-md font-medium text-white mb-3">Sobre os Relatórios</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <h5 className="text-[#F0B35B] font-medium mb-1">Análise de Clientes</h5>
              <p>Insights detalhados sobre comportamento e preferências dos clientes, incluindo gráficos de serviços populares.</p>
            </div>
            <div>
              <h5 className="text-[#F0B35B] font-medium mb-1">Dados em Tempo Real</h5>
              <p>Informações atualizadas automaticamente com base nos agendamentos mais recentes.</p>
            </div>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
};

export default AnalyticsPage;