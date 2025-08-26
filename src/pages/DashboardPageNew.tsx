import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, Users, Clock, DollarSign } from 'lucide-react';
import AppointmentCardNew from '../components/feature/AppointmentCardNew';
import StandardLayout from '../components/layout/StandardLayout';
import AppointmentViewModal from '../components/feature/AppointmentViewModal';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import { loadAppointments as loadAppointmentsService } from '../services/AppointmentService';
import ApiService from '../services/ApiService';
import { useTenant } from '../contexts/TenantContext';
import toast from 'react-hot-toast';

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

interface StatsProps {
  appointments: Appointment[];
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
      bgColor: 'bg-blue-500/20'
    },
    {
      title: 'Agendamentos Concluídos',
      value: completedAppointments,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      title: 'Agendamentos Pendentes',
      value: pendingAppointments,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    },
    {
      title: 'Receita Total',
      value: `R$ ${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-[#F0B35B]',
      bgColor: 'bg-[#F0B35B]/20'
    }
  ];
  
  return (
    <div className="bg-[#1A1F2E]/50 shadow-lg p-6 border border-[#F0B35B]/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#F0B35B]" />
          Estatísticas
        </h2>
        <select
          value={revenueDisplayMode}
          onChange={(e) => setRevenueDisplayMode(e.target.value)}
          className="appearance-none bg-[#252B3B] text-white text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] cursor-pointer border border-[#F0B35B]/30"
        >
          <option value="month">Este Mês</option>
          <option value="week">Esta Semana</option>
          <option value="all">Todos</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-[#252B3B]/50 p-4 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                  <p className="text-white text-xl font-semibold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <IconComponent className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const APPOINTMENTS_PER_PAGE = 6;

const DashboardPageNew: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { barbershopData, loading: tenantLoading, isValidTenant } = useTenant();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [revenueDisplayMode, setRevenueDisplayMode] = useState('month');
  const [filterMode, setFilterMode] = useState('today');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAppointments = useMemo(() => {
    if (!appointments.length) return [];

    let filtered = appointments;

    // Filtro por role do usuário: barbeiros veem apenas seus agendamentos
    if (user && user.role === 'barber') {
      filtered = filtered.filter(app => app.barberId === user.id);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().split('T')[0];

    if (filterMode === 'today') {
      return filtered.filter(app => app.date === today);
    } else if (filterMode === 'tomorrow') {
      return filtered.filter(app => app.date === tomorrow);
    }
    return filtered;
  }, [appointments, filterMode, user]);

  const indexOfLastAppointment = currentPage * APPOINTMENTS_PER_PAGE;
  const indexOfFirstAppointment = indexOfLastAppointment - APPOINTMENTS_PER_PAGE;
  const visibleAppointments = filteredAppointments.filter(app => !app.isBlocked);
  const currentAppointments = visibleAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(visibleAppointments.length / APPOINTMENTS_PER_PAGE);

  const paginate = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterMode, appointments.length]);

  // Verificar se deve mostrar onboarding
  useEffect(() => {
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

  const handleAppointmentAction = useCallback(async (appointmentId: string, action: 'complete' | 'delete' | 'toggle' | 'view', currentStatus?: string) => {
    if (!appointmentId) return;
    
    try {
      if (action === 'view') {
        const appointment = appointments.find(app => app.id === appointmentId);
        if (appointment) {
          setSelectedAppointment(appointment);
          setIsViewModalOpen(true);

          const viewedAppointmentIds = JSON.parse(localStorage.getItem('viewedAppointments') || '[]');
          if (!viewedAppointmentIds.includes(appointmentId)) {
            viewedAppointmentIds.push(appointmentId);
            localStorage.setItem('viewedAppointments', JSON.stringify(viewedAppointmentIds));
          }
        }
        return;
      }

      if (action === 'delete') {
        if (!appointmentId.trim()) {
          console.error('ID do agendamento inválido');
          return;
        }

        const barbershopSlug = localStorage.getItem('barbershopSlug');
        if (!barbershopSlug) {
          throw new Error('Slug da barbearia não encontrado. Faça login novamente.');
        }

        // TODO: Implementar cancelamento de agendamento com Supabase
        throw new Error('Cancelamento deve ser implementado com Supabase');
      } else if (action === 'toggle' && currentStatus) {
        let newStatus: string;
        
        switch (currentStatus) {
          case 'pending':
            newStatus = 'confirmed';
            break;
          case 'confirmed':
            newStatus = 'completed';
            break;
          case 'completed':
            newStatus = 'pending';
            break;
          default:
            newStatus = 'confirmed';
        }
        
        try {
          const barbershopSlug = localStorage.getItem('barbershopSlug');
          if (!barbershopSlug) {
            throw new Error('Slug da barbearia não encontrado. Faça login novamente.');
          }

          await ApiService.patch(`/api/app/${barbershopSlug}/appointments/${appointmentId}`, { status: newStatus });
          
          setAppointments(prevAppointments =>
            prevAppointments.map(app =>
              app.id === appointmentId ? { ...app, status: newStatus as 'pending' | 'confirmed' | 'completed' } : app
            )
          );
          
          if (selectedAppointment?.id === appointmentId) {
            setSelectedAppointment(prev => prev ? { ...prev, status: newStatus as 'pending' | 'confirmed' | 'completed' } : null);
          }

          let statusMessage: string;
          switch (newStatus) {
            case 'confirmed':
              statusMessage = 'Agendamento confirmado!';
              break;
            case 'completed':
              statusMessage = 'Agendamento finalizado!';
              break;
            case 'pending':
              statusMessage = 'Agendamento reaberto!';
              break;
            default:
              statusMessage = 'Status atualizado!';
          }

          toast.success(statusMessage, {
            duration: 4000,
            style: {
              background: '#1A1F2E',
              color: '#fff',
              border: '1px solid #F0B35B',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '12px',
              fontWeight: '500'
            },
            iconTheme: {
              primary: '#F0B35B',
              secondary: '#1A1F2E'
            }
          });
        } catch (patchError) {
          console.error('Erro ao atualizar status:', patchError);
          throw patchError;
        }
      }
    } catch (error) {
      console.error(`Erro na ação ${action}:`, error);

      if (action === 'delete') {
        toast.error('Erro ao excluir agendamento', {
          duration: 4000,
          style: {
            background: '#1A1F2E',
            color: '#fff',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '12px',
            fontWeight: '500'
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#1A1F2E'
          }
        });
      } else {
        toast.error('Erro ao atualizar agendamento', {
          duration: 4000,
          style: {
            background: '#1A1F2E',
            color: '#fff',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '12px',
            fontWeight: '500'
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#1A1F2E'
          }
        });
      }
    }
  }, [appointments, selectedAppointment]);

  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      if (!isSubscribed || !navigator.onLine) return;

      try {
        const [appointments, services] = await Promise.all([
          loadAppointmentsService(),
          ApiService.getServices()
        ]);
        
        if (isSubscribed && Array.isArray(appointments)) {
          const serviceMap = new Map();
          if (Array.isArray(services)) {
            services.forEach((service: any) => {
              if (service && service.id && service.name) {
                serviceMap.set(service.id, service.name);
              }
            });
          }
          
          const transformedAppointments = appointments.map((appointment: any) => {
            return {
              ...appointment,
              service: appointment.service || appointment.serviceName || serviceMap.get(appointment.serviceId) || 'Serviço não especificado'
            };
          });
          
          setAppointments(transformedAppointments as Appointment[]);
        }
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        if (isSubscribed && appointments.length === 0) {
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

  useEffect(() => {
    const handleOpenAppointmentModal = (event: CustomEvent) => {
      const { appointmentId } = event.detail;
      if (appointmentId) {
        handleAppointmentAction(appointmentId, 'view');
      }
    };

    window.addEventListener('openAppointmentModal', handleOpenAppointmentModal as EventListener);

    return () => {
      window.removeEventListener('openAppointmentModal', handleOpenAppointmentModal as EventListener);
    };
  }, [appointments, handleAppointmentAction]);

  // Aguardar carregamento do tenant antes de renderizar
  if (tenantLoading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#F0B35B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando dados da barbearia...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

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
    <StandardLayout>
      <div className="space-y-6">
        {/* Layout principal do dashboard */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Seção de Estatísticas */}
          <div className="w-full lg:w-1/2">
            <Stats 
              appointments={appointments} 
              revenueDisplayMode={revenueDisplayMode} 
              setRevenueDisplayMode={setRevenueDisplayMode}
            />
          </div>

          {/* Seção de Agendamentos */}
          <div className="w-full lg:w-1/2">
            <div className="bg-[#1A1F2E]/50 shadow-lg p-6 h-full border border-[#F0B35B]/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#F0B35B]" />
                    Agendamentos
                  </h2>
                  <select
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                    className="appearance-none bg-[#252B3B] text-white text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] cursor-pointer border border-[#F0B35B]/30"
                  >
                    <option value="today">Hoje</option>
                    <option value="tomorrow">Amanhã</option>
                    <option value="all">Todos</option>
                  </select>
                </div>
              </div>

              <div className="flex-1">
                {currentAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-[#252B3B] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-400 text-lg mb-2">
                      {filterMode === 'today'
                        ? 'Nenhum agendamento para hoje'
                        : filterMode === 'tomorrow'
                          ? 'Nenhum agendamento para amanhã'
                          : 'Nenhum agendamento encontrado'}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {filterMode === 'today' ? 'Aproveite para organizar sua agenda!' : 'Tente ajustar os filtros'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentAppointments.map((appointment) => (
                      <AppointmentCardNew
                        key={`appointment-${appointment.id}-${appointment.status}`}
                        appointment={appointment}
                        onDelete={() => handleAppointmentAction(appointment.id, 'delete')}
                        onToggleStatus={() => handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
                        onView={() => handleAppointmentAction(appointment.id, 'view')}
                        className="h-fit"
                      />
                    ))}

                    {totalPages > 1 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => {
                              const prevPage = currentPage - 1;
                              if (prevPage >= 1) {
                                paginate(prevPage);
                              }
                            }}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-[#252B3B] text-white hover:bg-[#2E354A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                            const pageNumber = currentPage - 1 + i;
                            if (pageNumber < 1 || pageNumber > totalPages) return null;
                            
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => paginate(pageNumber)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  currentPage === pageNumber
                                    ? 'bg-[#F0B35B] text-black'
                                    : 'bg-[#252B3B] text-white hover:bg-[#2E354A]'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}

                          <button
                            onClick={() => {
                              const nextPage = currentPage + 1;
                              if (nextPage <= totalPages) {
                                paginate(nextPage);
                              }
                            }}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg bg-[#252B3B] text-white hover:bg-[#2E354A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modais */}
      <AppointmentViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onDelete={selectedAppointment ? () => handleAppointmentAction(selectedAppointment.id, 'delete') : undefined}
        onToggleStatus={selectedAppointment ? () => handleAppointmentAction(selectedAppointment.id, 'toggle', selectedAppointment.status) : undefined}
      />

      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => {
            setShowOnboarding(false);
            localStorage.setItem('onboardingCompleted', 'true');
          }}
          barbershopName={barbershopData?.name || 'Sua Barbearia'}
        />
      )}
    </StandardLayout>
  );
};

export default DashboardPageNew;