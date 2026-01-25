import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, TrendingUp } from 'lucide-react';
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
  const { user } = useAuth();
  const currentUser = user;

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

        setAppointments(fetchedAppointments as Appointment[]);
      } catch (error: unknown) {
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

      <div className="space-y-6">

        {/* Analytics de Clientes */}
        <div className="bg-surface/50 backdrop-blur-md p-6 border border-white/5 rounded-2xl shadow-xl">
          <ClientAnalytics appointments={filteredAppointments} />
        </div>

        {/* Informações adicionais */}
        <div className="bg-surface/30 p-6 border border-white/5 rounded-xl">
          <h4 className="text-md font-medium text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Sobre os Relatórios
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div className="bg-background-paper/30 p-4 rounded-lg">
              <h5 className="text-primary font-medium mb-1">Análise de Clientes</h5>
              <p>Insights detalhados sobre comportamento e preferências dos clientes, incluindo gráficos de serviços populares.</p>
            </div>
            <div className="bg-background-paper/30 p-4 rounded-lg">
              <h5 className="text-primary font-medium mb-1">Dados em Tempo Real</h5>
              <p>Informações atualizadas automaticamente com base nos agendamentos mais recentes.</p>
            </div>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
};

export default AnalyticsPage;