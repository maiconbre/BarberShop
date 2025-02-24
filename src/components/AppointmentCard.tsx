import React from 'react';

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

interface AppointmentCardProps {
  appointment: Appointment;
  onDelete: (e: React.MouseEvent) => void;
  onToggleStatus: (e: React.MouseEvent) => void;
  onMarkAsCompleted: (e: React.MouseEvent) => void;
  completingAppointments: { [key: number]: boolean };
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onDelete,
  onToggleStatus,
  onMarkAsCompleted,
  completingAppointments
}) => {
  const formattedDate = new Date(appointment.date).toLocaleDateString('pt-BR');
  const isCompleting = completingAppointments[parseInt(appointment.id)];

  return (
    <div className="bg-[#1A1F2E] p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-white font-semibold">{appointment.clientName}</h3>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            appointment.status === 'completed'
              ? 'bg-green-500/20 text-green-500'
              : appointment.status === 'confirmed'
              ? 'bg-blue-500/20 text-blue-500'
              : 'bg-yellow-500/20 text-yellow-500'
          }`}
        >
          {appointment.status === 'completed'
            ? 'Concluído'
            : appointment.status === 'confirmed'
            ? 'Confirmado'
            : 'Pendente'}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-400">
        <p>Serviço: {appointment.service}</p>
        <p>Data: {formattedDate}</p>
        <p>Horário: {appointment.time}</p>
        <p>Barbeiro: {appointment.barberName}</p>
        <p className="text-[#F0B35B]">Valor: R$ {appointment.price.toFixed(2)}</p>
      </div>

      <div className="mt-4 space-x-2 flex justify-end">
        <button
          onClick={onDelete}
          className="px-3 py-1 text-xs rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
        >
          Excluir
        </button>
        <button
          onClick={onToggleStatus}
          className={`px-3 py-1 text-xs rounded ${
            appointment.status === 'completed'
              ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
              : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
          } transition-colors`}
        >
          {appointment.status === 'completed' ? 'Marcar como Pendente' : 'Marcar como Concluído'}
        </button>
      </div>
    </div>
  );
};

export default AppointmentCard;