import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { TrendingUp, Clock, DollarSign, BarChart3, Calendar, Bell, CheckCircle2 } from 'lucide-react';
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

const safeFixed = (num: number | undefined, digits: number) => {
  if (num === undefined || num === null || isNaN(num)) return '0.00';
  return num.toFixed(digits);
};

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
      title: 'Total',
      value: totalAppointments,
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Receita',
      value: `R$ ${safeFixed(totalRevenue, 2)}`,
      icon: DollarSign,
      color: 'text-[#D4AF37]', // Gold color
      bgColor: 'bg-[#D4AF37]/10'
    },
    {
      title: 'Concluídos',
      value: completedAppointments,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Pendentes',
      value: pendingAppointments,
      icon: Clock,
      color: 'text-[#E6A555]',
      bgColor: 'bg-[#E6A555]/10'
    }
  ];

  return (
    <div>
      {/* Date Filter - Right Applied */}
      <div className="flex justify-end mb-4">
        <div className="relative">
          <select
            value={revenueDisplayMode}
            onChange={(e) => setRevenueDisplayMode(e.target.value)}
            className="appearance-none bg-[#1A1F2E] text-white text-xs font-medium rounded-lg px-3 py-1.5 pr-8 border border-white/10 focus:outline-none"
          >
            <option value="month">Este Mês</option>
            <option value="week">Esta Semana</option>
            <option value="all">Todos</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <Calendar className="h-3 w-3" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-8">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-[#1A1F2E] p-3 sm:p-4 rounded-2xl border border-white/5 relative overflow-hidden group">
              <div className="flex flex-col h-full justify-between gap-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-xs sm:text-sm font-medium block mb-0.5">{stat.title}</span>
                  <p className="text-xl sm:text-2xl font-bold text-white tracking-wide">{stat.value}</p>
                </div>
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
  const { user } = useAuth(); // Get user for avatar

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
        setAppointments((data as unknown) as DashboardAppointment[]);
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();

    const handleCacheUpdate = () => {
      fetchAppointments();
    };

    window.addEventListener('cacheUpdated', handleCacheUpdate);
    return () => {
      window.removeEventListener('cacheUpdated', handleCacheUpdate);
    };
  }, []);

  const filteredForAnalytics = appointments.filter(app => app.status === 'completed') as any[];

  if (loading || tenantLoading) {
    return (
      <StandardLayout hideMobileHeader={true}>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </StandardLayout>
    );
  }

  // Current Date formatted "Dom, 25 Jan"
  const formattedDate = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });

  // Get user name safely
  const getUserName = () => {
    if (!user) return 'Visitante';
    const userAny = user as any;
    return userAny.user_metadata?.name || userAny.name || 'Visitante';
  };
  const userName = getUserName();

  return (
    <StandardLayout hideMobileHeader={true}>
      <div className="space-y-6 pb-20 px-2 sm:px-0"> {/* Adjusted padding */}

        {/* Custom Header matching Design */}
        <div className="flex items-center justify-between py-2 sm:py-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#D4AF37]/10 rounded-md">
              <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white capitalize">
              Visão Geral
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <h2 className="text-sm font-medium text-white capitalize leading-tight">
                Olá, {userName.split(' ')[0]}
              </h2>
              <p className="text-gray-400 text-[10px] sm:text-xs leading-tight">
                {formattedDate}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full border border-white/10 text-white relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-[#E6A555] rounded-full border border-[#0D121E]"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <Stats
          appointments={appointments}
          revenueDisplayMode={revenueDisplayMode}
          setRevenueDisplayMode={setRevenueDisplayMode}
        />

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
          {/* Analytics Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-[#D4AF37]/10 rounded-md">
                <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-bold text-white">Análise de Desempenho</h3>
            </div>
            {/* ClientAnalytics with simpleMode to hide internal stats */}
            <ClientAnalytics appointments={filteredForAnalytics} simpleMode={true} />
          </div>

          {/* Upcoming Section */}
          <div className="space-y-6">
            {/* Upcoming Appointments Component */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-bold text-white">Próximos Agendamentos</h3>
              </div>

              <div className="space-y-3">
                {appointments
                  .filter(app => new Date(app.date + 'T' + app.time) >= new Date() && app.status !== 'cancelled')
                  .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
                  .slice(0, 5)
                  .map((app, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-[#1A1F2E] border border-white/5">
                      <div>
                        <p className="font-bold text-white text-sm">{app.clientName || 'Cliente'}</p>
                        <p className="text-xs text-gray-400">{app.serviceName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-sm">{app.time}</p>
                        <p className="text-xs text-gray-500">{new Date(app.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}

                {appointments.filter(app => new Date(app.date + 'T' + app.time) >= new Date()).length === 0 && (
                  <div className="p-6 rounded-2xl bg-[#1A1F2E] border border-white/5 text-center">
                    <p className="text-gray-500 text-sm">Nenhum agendamento hoje</p>
                  </div>
                )}
              </div>
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