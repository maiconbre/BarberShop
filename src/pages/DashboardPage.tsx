import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

import AppointmentCard from '../components/AppointmentCard';

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
}

const DashboardPage: React.FC = () => {
  const [completingAppointments, setCompletingAppointments] = useState<{[key: number]: boolean}>({});
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Calcular estatísticas
  const totalAppointments = appointments.length;
  const totalRevenue = appointments.reduce((sum, app) => sum + app.price, 0);
  const pendingAppointments = appointments.filter(app => app.status === 'pending').length;
  const completedAppointments = appointments.filter(app => app.status === 'completed').length;

  // Filtrar agendamentos baseado no estado showCompleted
  const filteredAppointments = showCompleted 
    ? appointments 
    : appointments.filter(app => app.status !== 'completed');

  useEffect(() => {
    loadAppointments(); // Load appointments on mount
  }, []);

  const loadAppointments = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/appointments');
      const result = await response.json();
      
      if (result.success) {
        const formattedAppointments = result.data
          .map((app: any) => ({
            ...app,
            service: app.serviceName // Ajuste para corresponder ao backend
          }))
          .sort((a: Appointment, b: Appointment) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA.getTime() - dateB.getTime();
          });

        setAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
    }
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'complete' | 'delete' | 'toggle', currentStatus?: string) => {
    if (!appointmentId) return; // Evitar chamadas com ID nulo

    try {
      if (action === 'delete') {
        const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setAppointments(prev => prev.filter(app => app.id !== appointmentId));
        }
      } else {
        // Unificar ações de status (complete e toggle)
        const newStatus = action === 'complete' ? 'completed' : 
          (currentStatus === 'completed' ? 'pending' : 'completed');

        const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
          setAppointments(prev => 
            prev.map(app => app.id === appointmentId 
              ? { ...app, status: newStatus } 
              : app
            )
          );
        }
      }
    } catch (error) {
      console.error(`Erro na ação ${action}:`, error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D121E] pt-16">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-white">Painel de Controle</h1>
          <button
            onClick={logout}
            className="bg-[#F0B35B] text-black px-4 py-2 rounded-md hover:bg-[#F0B35B]/80 transition-all duration-300 transform hover:scale-105"
          >
            Sair
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1A1F2E] p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 className="text-gray-400 text-sm">Agendamentos</h3>
            <p className="text-xl font-bold text-white">{totalAppointments}</p>
          </div>
          <div className="bg-[#1A1F2E] p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 className="text-gray-400 text-sm">Receita Total</h3>
            <p className="text-xl font-bold text-[#F0B35B]">R$ {totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-[#1A1F2E] p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 className="text-gray-400 text-sm">Aguardando</h3>
            <p className="text-xl font-bold text-yellow-500">{pendingAppointments}</p>
          </div>
          <div className="bg-[#1A1F2E] p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 className="text-gray-400 text-sm">Concluídos</h3>
            <p className="text-xl font-bold text-green-500">{completedAppointments}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Seus Agendamentos</h2>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="bg-[#F0B35B] text-black px-4 py-2 rounded-md hover:bg-[#F0B35B]/80 transition-all duration-300 transform hover:scale-105"
          >
            {showCompleted ? 'Ocultar Finalizados' : 'Mostrar Finalizados'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id || `temp-${appointment.date}-${appointment.time}`}
              appointment={appointment}
              onDelete={(e) => appointment.id && handleAppointmentAction(appointment.id, 'delete')}
              onToggleStatus={(e) => appointment.id && handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
              onMarkAsCompleted={(e) => appointment.id && handleAppointmentAction(appointment.id, 'complete')}
              completingAppointments={completingAppointments}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;



  const handleToggleStatus = async (appointmentId: number, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    try {
      const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setAppointments(prev => 
          prev.map(app => app.id === appointmentId 
            ? { ...app, status: newStatus } 
            : app
          )
        );
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };