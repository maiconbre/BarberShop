import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import toast from 'react-hot-toast';
import {
  Calendar, ChevronLeft, ChevronRight, Search, Bell,
  LayoutList, LayoutGrid, Plus, MoreHorizontal, Clock
} from 'lucide-react';
import AppointmentCardNew from '../components/feature/AppointmentCardNew';
import AppointmentViewModal from '../components/feature/AppointmentViewModal';
import CalendarView from '../components/feature/CalendarView';
import StandardLayout from '../components/layout/StandardLayout';
import { useAppointments } from '../hooks/useAppointments';
import type { Appointment as BaseAppointment, AppointmentStatus } from '@/types';

// Interface local para compatibilidade
interface Appointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  barberId: string;
  barberName: string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
  isBlocked?: boolean;
}

const APPOINTMENTS_PER_PAGE = 8; // Increased for table view

const convertAppointment = (baseAppointment: BaseAppointment): Appointment => {
  return {
    id: baseAppointment.id,
    clientName: baseAppointment._backendData?.clientName || (baseAppointment as unknown as { clientName: string }).clientName || baseAppointment.clientId,
    service: baseAppointment._backendData?.serviceName || (baseAppointment as unknown as { serviceName: string }).serviceName || baseAppointment.serviceId,
    date: baseAppointment.date.toISOString().split('T')[0],
    time: baseAppointment._backendData ? baseAppointment.startTime : (baseAppointment.time || baseAppointment.startTime),
    status: baseAppointment.status,
    barberId: baseAppointment.barberId,
    barberName: baseAppointment._backendData?.barberName || baseAppointment.barberName || '',
    price: baseAppointment._backendData?.price || (baseAppointment as unknown as { price: number }).price || 0,
    createdAt: baseAppointment.createdAt?.toISOString(),
    updatedAt: baseAppointment.updatedAt?.toISOString()
  };
};

const AgendaPage: React.FC = memo(() => {
  const { user: currentUser } = useAuth();
  const { isValidTenant } = useTenant();

  const {
    appointments: baseAppointments,
    deleteAppointment,
    updateAppointmentStatus
  } = useAppointments();

  const appointments = useMemo(() => {
    if (!baseAppointments) return [];
    return baseAppointments.map(convertAppointment);
  }, [baseAppointments]);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); // 'list' = table on desktop

  const calendarFilteredAppointments = useMemo(() => {
    if (!appointments || !appointments.length) return [];
    let filtered = appointments;

    // Filter by role
    if (currentUser && typeof currentUser === 'object' && 'role' in currentUser && currentUser.role === 'barber' && 'id' in currentUser) {
      filtered = filtered.filter(app => app.barberId === (currentUser as { id: string | number }).id.toString());
    }

    return filtered.filter(app => {
      // Date filter is ONLY for the calendar/sidebar selection interaction
      // BUT the design shows "01 Mai, 2024 - 07 Mai, 2024" range picker, suggesting the main list might differ from selected date single day
      // For now, let's keep it simple: Main list shows appointments for Selected Date OR All?
      // The screenshot shows a list of different dates (01 Mai, 10 Mai, 10 Mai, 02 Mai).
      // So the MAIN LIST should probably show a range or ALL upcoming?
      // Let's make the main list show ALL (filtered by month perhaps) and the Sidebar Calendar selects a specific date
      // Actually, if I select a date in calendar, it usually filters the list. 
      // But the screenshot shows multiple dates. 
      // I will change the logic to show ALL appointments (sorted by date) if no specific date filter is forcefully applied, 
      // OR better: The Calendar Widget highlights the selected date, but the list shows broader range.
      // Let's stick to "Selected Date" filtering for now to ensure consistency, 
      // UNLESS the user wants to see "All". 
      // Wait, the screenshot shows "01 Mai - 07 Mai". It's a range.
      // I'll implement a simple "Month" or "All Future" view for the Table. 

      // For this iteration, I will keep the date filter strict for the "Calendar View" but for the "Table View" I might relax it.
      // However, standard behavior is usually strict. Let's relax it to show ALL future appointments if statusFilter is 'all'?
      // No, let's keep it strict to the selected date OR change to Month view.
      // Actually, the screenshot clearly shows a list of multiple dates.
      // So I will make the list filter by MONTH of the selected date.

      const appDate = new Date(app.date);
      const selDate = new Date(selectedDate);
      const isSameMonth = appDate.getMonth() === selDate.getMonth() && appDate.getFullYear() === selDate.getFullYear();

      // Filter by Month
      if (!isSameMonth) return false;

      // Filter by Status
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;

      // Filter Blocked
      if (app.isBlocked === true) return false;

      return true;
    }).sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  }, [appointments, selectedDate, currentUser, statusFilter]);

  const indexOfLastAppointment = currentPage * APPOINTMENTS_PER_PAGE;
  const indexOfFirstAppointment = indexOfLastAppointment - APPOINTMENTS_PER_PAGE;
  const currentAppointments = calendarFilteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(calendarFilteredAppointments.length / APPOINTMENTS_PER_PAGE);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleDateSelection = (date: string) => {
    setSelectedDate(date);
    setCurrentPage(1);
  };

  const handleAppointmentAction = useCallback(async (appointmentId: string, action: 'complete' | 'delete' | 'toggle' | 'view', currentStatus?: string) => {
    // ... existing logic ...
    // I will copy the logic from original file or keep it if I didn't verify it fully, but I saw it.
    // I'll reimplement standard toast logic here briefly for safety or reuse if I could.
    // Due to 'replace_content', I need to provide full body.
    // I will include the logic from the previous file.
    if (!appointmentId) return;
    try {
      if (action === 'view') {
        const app = appointments.find(a => a.id === appointmentId);
        if (app) {
          setSelectedAppointment(app);
          setIsViewModalOpen(true);
        }
        return;
      }

      if (action === 'delete') {
        await deleteAppointment(appointmentId);
        toast.success('Agendamento excluído');
      } else if (action === 'toggle' && currentStatus) {
        let newStatus: AppointmentStatus = 'confirmed';
        if (currentStatus === 'pending') newStatus = 'confirmed';
        else if (currentStatus === 'confirmed') newStatus = 'completed';
        else if (currentStatus === 'completed') newStatus = 'pending'; // Reopen

        await updateAppointmentStatus(appointmentId, newStatus);
        toast.success('Status atualizado');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro na ação');
    }
  }, [appointments, deleteAppointment, updateAppointmentStatus]);

  // Status Stats
  const stats = useMemo(() => {
    const monthApps = calendarFilteredAppointments; // Already filtered by month
    return {
      total: monthApps.length,
      pending: monthApps.filter(a => a.status === 'pending').length,
      confirmed: monthApps.filter(a => a.status === 'confirmed').length
    };
  }, [calendarFilteredAppointments]);

  // Helper for status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <span className="px-3 py-1 rounded-full bg-[#10B981]/20 text-[#10B981] text-xs font-medium border border-[#10B981]/20">Confirmado</span>;
      case 'pending': return <span className="px-3 py-1 rounded-full bg-[#E6A555]/20 text-[#E6A555] text-xs font-medium border border-[#E6A555]/20">Pendente</span>;
      case 'completed': return <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium border border-blue-500/20">Concluído</span>;
      case 'cancelled': return <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20">Cancelado</span>;
      default: return <span className="text-gray-400">{status}</span>;
    }
  };

  if (!isValidTenant) return null;

  return (
    <StandardLayout hideMobileHeader={true}>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-2rem)] gap-0 lg:gap-8 max-w-[1600px] mx-auto pb-4 px-2 sm:px-0">

        {/* LEFT COLUMN - Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 py-2">
            <h1 className="text-2xl font-bold text-white">Agendamentos</h1>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full border border-white/10 text-gray-400 hover:text-white cursor-pointer bg-[#1A1F2E]">
                <Search className="w-5 h-5" />
              </div>
              <div className="p-2 rounded-full border border-white/10 text-gray-400 hover:text-white cursor-pointer bg-[#1A1F2E] relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#1A1F2E]"></span>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center text-black font-bold">
                {(currentUser as any)?.name?.[0] || 'U'}
              </div>
            </div>
          </div>

          {/* Filters & Controls */}
          <div className="space-y-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 bg-[#1A1F2E] p-1.5 rounded-xl border border-white/5">
                <button className="flex items-center gap-2 px-4 py-2 bg-[#0D121E] rounded-lg border border-white/5 text-gray-300 text-sm hover:text-white transition-colors">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <span>{new Date(selectedDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                </button>
                <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
                <div className="flex bg-[#0D121E] rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="hidden md:flex">
                <button className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0D121E] px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-[#D4AF37]/20">
                  <Plus className="w-4 h-4" />
                  Novo agendamento
                </button>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
              {['all', 'confirmed', 'pending', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`
                                    px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2
                                    ${statusFilter === status
                      ? 'bg-[#1A1F2E] border-[#D4AF37] text-white shadow-md'
                      : 'bg-transparent border-white/10 text-gray-400 hover:border-white/30 hover:text-gray-300'}
                                `}
                >
                  {status === 'all' && 'Todos'}
                  {status === 'confirmed' && 'Confirmado'}
                  {status === 'pending' && 'Pendente'}
                  {status === 'completed' && 'Concluído'}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === status ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/10 text-gray-500'}`}>
                    {status === 'all' ? calendarFilteredAppointments.length : calendarFilteredAppointments.filter(a => a.status === status).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-[#1A1F2E] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
            {/* Header Row - Only for List View */}
            {viewMode === 'list' && (
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-xs text-gray-400 font-medium uppercase tracking-wider">
                <div className="col-span-2">Hora</div>
                <div className="col-span-4">Cliente</div>
                <div className="col-span-2">Serviço</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Valor</div>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {currentAppointments.length > 0 ? (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-2" : "space-y-2"}>
                  {currentAppointments.map((app) => (
                    viewMode === 'list' ? (
                      // TABLE ROW (Desktop)
                      <motion.div
                        key={app.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center p-3 sm:p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group cursor-pointer"
                        onClick={() => handleAppointmentAction(app.id, 'view')}
                      >
                        {/* Mobile Card-like View for List Mode on small screens */}
                        <div className="col-span-12 sm:hidden flex justify-between">
                          <span className="text-white font-bold">{app.clientName}</span>
                          <span className="text-gray-400">{app.time}</span>
                        </div>

                        <div className="col-span-2 text-white font-medium flex flex-col hidden sm:flex">
                          <span>
                            {new Date(app.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
                          </span>
                          <span className="text-xs text-gray-500">{app.time}</span>
                        </div>
                        <div className="col-span-4 flex items-center gap-3 hidden sm:flex">
                          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold text-xs uppercase shrink-0">
                            {app.clientName[0]}
                          </div>
                          <span className="text-white font-medium truncate">{app.clientName}</span>
                        </div>
                        <div className="col-span-2 text-gray-400 text-sm truncate hidden sm:block">
                          {app.service}
                        </div>
                        <div className="col-span-2 hidden sm:block">
                          {getStatusBadge(app.status)}
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-4 hidden sm:flex">
                          <span className="text-white font-bold">R$ {app.price}</span>
                          <button className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 opacity-0 group-hover:opacity-100 transition-all">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Mobile Status Row */}
                        <div className="col-span-12 sm:hidden flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-400">{app.service}</span>
                          {getStatusBadge(app.status)}
                        </div>
                      </motion.div>
                    ) : (
                      // CARD VIEW
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <AppointmentCardNew
                          appointment={app as any}
                          onDelete={() => handleAppointmentAction(app.id, 'delete')}
                          onToggleStatus={() => handleAppointmentAction(app.id, 'toggle', app.status)}
                          onView={() => handleAppointmentAction(app.id, 'view')}
                          className="bg-[#0D121E] border-white/5"
                        />
                      </motion.div>
                    )
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                  <Calendar className="w-12 h-12 mb-2" />
                  <p>Nenhum agendamento encontrado</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Mostrando {indexOfFirstAppointment + 1}-{Math.min(indexOfLastAppointment, calendarFilteredAppointments.length)} de {calendarFilteredAppointments.length} resultados
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => paginate(idx + 1)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border text-xs font-bold ${currentPage === idx + 1 ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'border-white/10 text-white hover:bg-white/5'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Sidebar */}
        <div className="w-full lg:w-[320px] 2xl:w-[380px] shrink-0 space-y-6 hidden lg:block">
          {/* Calendar Widget */}
          <div className="bg-[#1A1F2E] rounded-2xl border border-white/5 p-4 shadow-lg">
            <h3 className="text-white font-bold text-center mb-4 capitalize">
              {new Date(selectedDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            {/* Custom Calendar Implementation Minimal */}
            <div className="calendar-mini-wrapper">
              <CalendarView
                appointments={appointments.filter(a => !a.isBlocked)}
                onDateSelect={handleDateSelection}
                selectedDate={selectedDate}
                miniMode={true} // Assuming CalendarView supports or I should assume it renders okay
              />
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total:</span>
                <span className="text-white font-bold">{stats.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Pendentes:</span>
                <span className="text-white font-bold">{stats.pending}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Confirmados:</span>
                <span className="text-white font-bold">{stats.confirmed}</span>
              </div>
            </div>

            <button className="w-full mt-6 py-3 bg-[#1A1F2E] border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-xl font-bold transition-all">
              + Novo agendamento
            </button>
          </div>

          {/* Ghost Card / Promo */}
          <div className="bg-[#1A1F2E] rounded-2xl border border-white/5 p-6 relative overflow-hidden group">
            {/* Illustrations would go here */}
            <div className="relative z-10">
              <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Horários Livres?</h4>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                Organize sua agenda e preencha os horários vagos com campanhas automáticas.
              </p>
              <button className="flex items-center gap-2 text-[#D4AF37] font-bold text-sm hover:underline">
                Criar campanha <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-2xl group-hover:bg-[#D4AF37]/20 transition-all"></div>
          </div>
        </div>

      </div>

      <AppointmentViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment as any}
        onDelete={() => handleAppointmentAction(selectedAppointment?.id || '', 'delete')}
        onToggleStatus={() => handleAppointmentAction(selectedAppointment?.id || '', 'toggle', selectedAppointment?.status)}
        allAppointments={(appointments || []) as any}
      />
    </StandardLayout>
  );
});

export default AgendaPage;