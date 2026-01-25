import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { TrendingUp, Users, Clock, DollarSign, BarChart3, Calendar } from 'lucide-react';
import StandardLayout from '../components/layout/StandardLayout';
import ClientAnalytics from '../components/feature/ClientAnalytics';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import { loadAppointments as loadAppointmentsService } from '../services/AppointmentService';
import { useTenant } from '../contexts/TenantContext';

// Local interface that matches the shape returned by loadAppointmentsService (flattened)
interface DashboardAppointment {
  id: string;
  clientName?: string;
  serviceName?: string; // service -> serviceName
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  barberId: string;
  barberName?: string;
  price?: number;
  createdAt?: string;
  updatedAt?: string;
  viewed?: boolean;
  isBlocked?: boolean;
}

interface StatsProps {
  appointments: DashboardAppointment[];
  revenueDisplayMode: string;
  setRevenueDisplayMode: (mode: string) => void;
}

const Stats: React.FC<StatsProps> = ({ appointments, revenueDisplayMode, setRevenueDisplayMode }) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Filtrar agendamentos por período
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);

      if (revenueDisplayMode === 'month') {
        return appointmentDate.getMonth() === currentMonth &&
          appointmentDate.getFullYear() === currentYear;
      } else if (revenueDisplayMode === 'week') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        return appointmentDate >= weekStart && appointmentDate <= weekEnd;
      }

      return true;
    });
  }, [appointments, revenueDisplayMode, currentMonth, currentYear, today]);

  // Calcular estatísticas
  const totalAppointments = filteredAppointments.length;
  const completedAppointments = filteredAppointments.filter(app => app.status === 'completed').length;
  const pendingAppointments = filteredAppointments.filter(app => app.status === 'pending').length;
  const totalRevenue = filteredAppointments
    .filter(app => app.status === 'completed')
    .reduce((sum, app) => sum + (app.price || 0), 0);

  const stats = [
    {
      title: 'Total de Agendamentos',
      value: totalAppointments,
      icon: Calendar,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Agendamentos Concluídos',
      value: completedAppointments,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Agendamentos Pendentes',
      value: pendingAppointments,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Receita Total',
      value: `R$ ${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }
  ];

  return (
    <div className="bg-surface/50 backdrop-blur-md shadow-xl p-6 border border-white/5 rounded-2xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          Visão Geral
        </h2>
        <select
          value={revenueDisplayMode}
          onChange={(e) => setRevenueDisplayMode(e.target.value)}
          className="appearance-none bg-background-dark text-white text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer border border-white/10 hover:border-primary/40 transition-colors"
        >
          <option value="month">Este Mês</option>
          <option value="week">Esta Semana</option>
          <option value="all">Todos</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-background-paper p-5 rounded-xl border border-white/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                  <IconComponent className={`w-6 h-6 ${stat.color}`} />
                </div>
                {index === 3 && <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">HOT</span>}
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-1 group-hover:text-primary transition-colors">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DashboardPageNew: React.FC = () => {
  const location = useLocation();
  const { barbershopData, loading: tenantLoading } = useTenant();

  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [revenueDisplayMode, setRevenueDisplayMode] = useState('month');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se deve mostrar onboarding
    const shouldShowOnboarding = () => {
      const fromRegistration = location.state?.showOnboarding;
      const firstAccess = !localStorage.getItem('hasVisitedDashboard');
      const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';

      return fromRegistration || (firstAccess && !onboardingCompleted);
    };

    if (shouldShowOnboarding()) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
        localStorage.setItem('hasVisitedDashboard', 'true');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const data = await loadAppointmentsService();
        // Cast and map if necessary to ensure compatibility
        // Assuming the service returns data that mostly matches our local interface
        setAppointments((data as unknown) as DashboardAppointment[]);
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();

    // Listen for cache updates
    const handleCacheUpdate = () => {
      fetchAppointments();
    };

    window.addEventListener('cacheUpdated', handleCacheUpdate);
    return () => {
      window.removeEventListener('cacheUpdated', handleCacheUpdate);
    };
  }, []);

  // Helper to get only completed appointments for analytics
  // ClientAnalytics expects "Appointment[]" but likely only uses certain fields.
  // We'll cast it to any to bypass strict type check for now, knowing the shape is compatible for charts
  const filteredForAnalytics = appointments.filter(app => app.status === 'completed') as any[];

  if (loading || tenantLoading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-6">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Olá, {barbershopData?.name || 'Barbearia'}
            </h1>
            <p className="text-gray-400">
              Aqui está o resumo do seu negócio hoje.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-surface/50 px-3 py-1.5 rounded-lg border border-white/5">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        {/* Stats Cards */}
        <Stats
          appointments={appointments}
          revenueDisplayMode={revenueDisplayMode}
          setRevenueDisplayMode={setRevenueDisplayMode}
        />

        {/* Main Dashboard Content - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">

          {/* Analytics Section (2/3 width on desktop) */}
          <div className="lg:col-span-2 bg-surface/50 backdrop-blur-md p-6 border border-white/5 rounded-2xl shadow-xl h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white">Análise de Desempenho</h3>
            </div>
            <ClientAnalytics appointments={filteredForAnalytics} />
          </div>

          {/* Recent/Upcoming Appointments (1/3 width on desktop) */}
          <div className="bg-surface/50 backdrop-blur-md p-6 border border-white/5 rounded-2xl shadow-xl h-fit">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Próximos Agendamentos</h3>
              </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {appointments
                .filter(app => new Date(app.date + 'T' + app.time) >= new Date() && app.status !== 'cancelled')
                .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
                .slice(0, 5)
                .map((app, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-background-paper border border-white/5 hover:border-primary/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{app.clientName || 'Cliente'}</p>
                      <p className="text-xs text-gray-400 truncate">{app.serviceName} com {app.barberName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-bold text-sm">{app.time}</p>
                      <p className="text-[10px] text-gray-500">{new Date(app.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                    </div>
                  </div>
                ))}

              {appointments.filter(app => new Date(app.date + 'T' + app.time) >= new Date()).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">Sem agendamentos futuros.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {showOnboarding && (
          <OnboardingModal
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            barbershopName={barbershopData?.name || 'Barbearia'}
          />
        )}
      </div>
    </StandardLayout>
  );
};

export default DashboardPageNew;