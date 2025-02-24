import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
  const [currentBarberId, setCurrentBarberId] = useState<string>('');
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  }>({ labels: [], datasets: [] });

  useEffect(() => {
    const handleStorageChange = () => {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const isAdmin = user?.role === 'admin';
      const barberId = isAdmin ? '' : (localStorage.getItem('currentBarberId') || sessionStorage.getItem('currentBarberId') || '');
      setCurrentBarberId(barberId);
    };

    window.addEventListener('storage', handleStorageChange);
    handleStorageChange(); // Initial load
    loadAppointments(); // Load appointments on mount

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadAppointments = async () => {
    try {
      // Definir as datas específicas de 17 a 23 de fevereiro
      const specificDates = [
        '2024-02-17',
        '2024-02-18',
        '2024-02-19',
        '2024-02-20',
        '2024-02-21',
        '2024-02-22',
        '2024-02-23'
      ];

      // Mock services and their prices
      const services = [
        { name: 'Corte de Cabelo', price: 35 },
        { name: 'Barba', price: 25 },
        { name: 'Corte + Barba', price: 55 },
        { name: 'Platinado', price: 120 },
        { name: 'Degradê', price: 40 }
      ];

      // Generate mock appointments for specific dates
      const mockData = specificDates.flatMap(date => {
        const dayOfWeek = new Date(date).getDay();
        // More appointments on weekends (5-8) vs weekdays (2-5)
        const appointmentCount = dayOfWeek === 0 || dayOfWeek === 6 
          ? Math.floor(Math.random() * 4) + 5 // 5-8 appointments
          : Math.floor(Math.random() * 4) + 2; // 2-5 appointments

        return Array.from({ length: appointmentCount }, (_, i) => ({
          id: `${date}-${i}`,
          clientName: `Cliente ${Math.floor(Math.random() * 100) + 1}`,
          date: date,
          time: `${Math.floor(Math.random() * 8) + 9}:00`, // 9:00 - 16:00
          status: Math.random() > 0.3 ? 'completed' : 'pending',
          barberId: '1',
          barberName: 'João Silva',
          ...services[Math.floor(Math.random() * services.length)]
        }));
      });

      const data = mockData;

      const formattedAppointments = data
        .map((app: any) => {
          if (!app.id || !app.clientName || !app.time) return null;
          
          return {
            id: app.id.toString(),
            clientName: app.clientName,
            service: app.name || 'N/A',
            date: app.date,
            time: app.time,
            status: app.status || 'pending',
            barberId: app.barberId || '',
            barberName: app.barberName || 'N/A',
            price: typeof app.price === 'number' ? app.price : parseFloat(app.price) || 0,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });

      setAppointments(formattedAppointments);
      updateChartData(formattedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
    }
  };

  const updateChartData = (currentAppointments: Appointment[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const appointmentCounts = last7Days.map(date =>
      currentAppointments.filter(app => app.date === date).length
    );

    setChartData({
      labels: last7Days.map(date =>
        new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' })
      ),
      datasets: [{
        label: 'Agendamentos',
        data: appointmentCounts,
        borderColor: '#F0B35B',
        backgroundColor: '#F0B35B20',
      }]
    });
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'complete' | 'delete' | 'toggle', currentStatus?: string) => {
    try {
      if (action === 'complete' || action === 'toggle') {
        const newStatus = action === 'complete' ? 'completed' : (currentStatus === 'completed' ? 'pending' : 'completed');
        
        // Atualiza o estado localmente primeiro para feedback imediato
        setAppointments(prev =>
          prev.map(app => app.id === appointmentId ? { ...app, status: newStatus } : app)
        );

        // Simula a atualização no backend (já que estamos usando dados mock)
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (action === 'delete') {
        // Atualiza o estado localmente primeiro para feedback imediato
        setAppointments(prev => prev.filter(app => app.id !== appointmentId));

        // Simula a exclusão no backend (já que estamos usando dados mock)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Error ${action}ing appointment:`, error);
      // Recarrega os agendamentos em caso de erro
      loadAppointments();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalRevenue = appointments.reduce((sum, app) => sum + app.price, 0);
  const filteredAppointments = appointments.filter(app => showCompleted || app.status !== 'completed');
  const totalAppointments = filteredAppointments.length;
  const pendingAppointments = filteredAppointments.filter(app => app.status === 'pending').length;
  const completedAppointments = appointments.filter(app => app.status === 'completed').length;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#fff' },
      },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#fff', stepSize: 1 },
        grid: { color: '#ffffff20' },
      },
      x: {
        ticks: { color: '#fff' },
        grid: { color: '#ffffff20' },
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#0D121E]">
      <nav className="bg-[#1A1F2E] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-[#F0B35B] font-bold text-xl">GR Barber</div>
            <button
              onClick={handleLogout}
              className="bg-[#F0B35B] text-black px-4 py-2 rounded-md hover:bg-[#F0B35B]/80 transition-all duration-300 transform hover:scale-105"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 mt-4">
        <h1 className="text-2xl font-semibold text-white mb-6">Painel de Controle</h1>
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

        <div className="mb-6 bg-[#1A1F2E] p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-white mb-4">Histórico de Agendamentos</h2>
          <div style={{ height: '200px' }}>
            <Line options={chartOptions} data={chartData} />
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
              key={appointment.id}
              appointment={appointment}
              onDelete={(e) => handleAppointmentAction(appointment.id, 'delete')}
              onToggleStatus={(e) => handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
              onMarkAsCompleted={(e) => handleAppointmentAction(appointment.id, 'complete')}
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