import React from 'react';
import { motion } from 'framer-motion';
import { formatFriendlyDateTime } from '../../utils/DateTimeUtils';

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed';
  price: number;
  barberName: string;
}

interface AppointmentHistoryProps {
  appointments: Appointment[];
}

const statusStyles = {
  pending: { 
    text: 'text-yellow-400', 
    label: 'Pendente',
    border: 'border-l-yellow-400',
    bg: 'bg-yellow-400/10'
  },
  completed: { 
    text: 'text-green-400', 
    label: 'Concluído',
    border: 'border-l-green-400',
    bg: 'bg-green-400/10'
  },
  confirmed: { 
    text: 'text-blue-400', 
    label: 'Confirmado',
    border: 'border-l-blue-400',
    bg: 'bg-blue-400/10'
  }
};

const AppointmentHistory: React.FC<AppointmentHistoryProps> = ({ appointments }) => {
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
      {appointments.map((appointment, index) => (
        <motion.div
          key={appointment.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          className={`p-3 rounded-lg bg-[#0D121E] border-l-2 ${statusStyles[appointment.status].border} hover:bg-[#151C2A] transition-colors`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-white font-medium">
                {formatFriendlyDateTime(appointment.date, appointment.time)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {appointment.service}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Barbeiro: {appointment.barberName}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[appointment.status].bg} ${statusStyles[appointment.status].text}`}>
                {statusStyles[appointment.status].label}
              </span>
              <span className="text-xs text-green-400 font-medium">
                R$ {appointment.price.toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AppointmentHistory;