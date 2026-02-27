import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { TrendingUp, Clock, DollarSign, Calendar, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import StandardLayout from '../components/layout/StandardLayout';
import ClientAnalytics from '../components/feature/ClientAnalytics';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import { useAppointments } from '../hooks/useAppointments';
import { useTenant } from '../contexts/TenantContext';

// Local interface that matches the expected shape
interface DashboardAppointment {
  id: string;
  clientName?: string;
  serviceName?: string;
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

const convertToDashboardAppointment = (baseAppointment: any): DashboardAppointment => {
  const appointmentDate = baseAppointment.date instanceof Date ? baseAppointment.date : new Date(baseAppointment.date);

  return {
    id: baseAppointment.id,
    clientName: baseAppointment._backendData?.clientName || baseAppointment.clientName || baseAppointment.clientId,
    serviceName: baseAppointment._backendData?.serviceName || baseAppointment.serviceName || baseAppointment.serviceId,
    date: appointmentDate.toISOString().split('T')[0],
    time: baseAppointment._backendData ? baseAppointment.startTime : (baseAppointment.time || baseAppointment.startTime),
    status: baseAppointment.status,
    barberId: baseAppointment.barberId,
    barberName: baseAppointment._backendData?.barberName || baseAppointment.barberName || '',
    price: baseAppointment._backendData?.price || baseAppointment.price || 0,
    isBlocked: baseAppointment.isBlocked,
  };
};

const safeFixed = (num: number | undefined, digits: number) => {
  if (num === undefined || num === null || isNaN(num)) return '0.00';
  return num.toFixed(digits);
};

interface StatsProps {
  appointments: DashboardAppointment[];
}

const Stats: React.FC<StatsProps> = ({ appointments }) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Filtrar agendamentos do mês atual
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate.getMonth() === currentMonth &&
        appointmentDate.getFullYear() === currentYear;
    });
  }, [appointments, currentMonth, currentYear]);

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 mb-10">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#1A1F2E] p-5 sm:p-7 rounded-[2.5rem] border border-white/10 relative overflow-hidden group shadow-2xl"
            >
              {/* Background Glow */}
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity ${stat.bgColor.replace('/10', '')}`}></div>

              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="flex items-start justify-between">
                  <div className={`p-4 rounded-2xl ${stat.bgColor} flex items-center justify-center border border-white/5 shadow-lg group-hover:shadow-[stat.color]/20 transition-all`}>
                    <IconComponent className={`w-6 h-6 ${stat.color} stroke-[2.5px]`} />
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] block mb-1">{stat.title}</span>
                  <p className="text-2xl sm:text-3xl font-black text-white tracking-tighter italic italic uppercase">{stat.value}</p>
                </div>
              </div>
            </motion.div>
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

  const { appointments: rawAppointments, loadAppointments, loading: appointmentsLoading } = useAppointments();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const appointments = useMemo(() => {
    if (!rawAppointments) return [];
    return rawAppointments.map(convertToDashboardAppointment);
  }, [rawAppointments]);

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
    loadAppointments();

    const handleCacheUpdate = () => {
      loadAppointments();
    };

    window.addEventListener('cacheUpdated', handleCacheUpdate);
    return () => {
      window.removeEventListener('cacheUpdated', handleCacheUpdate);
    };
  }, [loadAppointments]);

  const filteredForAnalytics = appointments.filter(app => app.status === 'completed') as any[];

  if (appointmentsLoading || tenantLoading) {
    return (
      <StandardLayout hideMobileHeader={true}>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </StandardLayout>
    );
  }

  // Current Date (cleaned up unused formattedDate)

  // Get user name safely
  const getUserName = () => {
    if (!user) return 'Visitante';
    const userAny = user as any;
    return userAny.user_metadata?.name || userAny.name || 'Visitante';
  };
  const userName = getUserName();

  return (
    <StandardLayout
      hideMobileHeader={true}
      title="Dashboard"
      subtitle={`Welcome back, ${userName.split(' ')[0]}`}
      icon={<TrendingUp className="w-5 h-5 text-[#F0B35B]" />}
    >
      <div className="space-y-10 pb-20 px-2 sm:px-0">

        {/* Stats Cards */}
        <Stats
          appointments={appointments}
        />

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
          {/* Analytics Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1.5 h-6 bg-[#F0B35B] rounded-full shadow-[0_0_10px_rgba(240,179,91,0.5)]"></div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">Performance Metrics</h3>
            </div>
            {/* ClientAnalytics with simpleMode to hide internal stats */}
            <div className="bg-[#1A1F2E] rounded-[2.8rem] border border-white/10 p-2 overflow-hidden shadow-xl">
              <ClientAnalytics
                appointments={filteredForAnalytics}
                simpleMode={true}
                isOwner={user?.id === barbershopData?.owner_id}
              />
            </div>
          </div>

          {/* Upcoming Section */}
          <div className="space-y-6">
            {/* Upcoming Appointments Component */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-1.5 h-6 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">Live Timeline</h3>
              </div>

              <div className="space-y-4">
                {appointments
                  .filter(app => new Date(app.date + 'T' + app.time) >= new Date() && app.status !== 'cancelled')
                  .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
                  .slice(0, 5)
                  .map((app, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ x: 5 }}
                      className="flex items-center justify-between p-5 rounded-[2rem] bg-[#1A1F2E] border border-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-black to-[#1A1F2E] border border-white/5 flex items-center justify-center text-[#F0B35B] font-black italic uppercase text-lg shrink-0 group-hover:border-[#F0B35B]/30 transition-all shadow-lg">
                          {app.clientName?.[0] || 'C'}
                        </div>
                        <div>
                          <p className="font-black italic text-white text-sm uppercase tracking-tight truncate max-w-[130px]">{app.clientName || 'Cliente'}</p>
                          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.1em] truncate max-w-[130px]">{app.serviceName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[#F0B35B] font-black italic text-base tracking-tighter">{app.time}</p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest font-mono">
                          {new Date(app.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '').toUpperCase()}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                {appointments.filter(app => new Date(app.date + 'T' + app.time) >= new Date()).length === 0 && (
                  <div className="p-10 rounded-[2.5rem] bg-[#1A1F2E] border border-dashed border-white/10 text-center flex flex-col items-center gap-3">
                    <Calendar className="w-8 h-8 text-gray-700" />
                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Aguardando novos clientes...</p>
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
    </StandardLayout >
  );
};

export default DashboardPageNew;