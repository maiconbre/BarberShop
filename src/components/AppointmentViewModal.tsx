import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCheck,
  FaTrash,
  FaTimes
} from 'react-icons/fa';

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

interface AppointmentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onDelete: () => void;
  onToggleStatus: () => void;
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

const formatDateTime = (date: string, time: string) => {
  // Configurar timezone para Brasília
  const timeZone = 'America/Sao_Paulo';
  
  // Criar data atual no fuso horário correto
  const today = new Date().toLocaleString('en-US', { timeZone });
  const todayDate = new Date(today);
  
  // Criar data de amanhã
  const tomorrow = new Date(todayDate);
  tomorrow.setDate(todayDate.getDate() + 1);
  
  // Criar data do agendamento no fuso horário correto
  const [year, month, day] = date.split('-');
  const appointmentDate = new Date(
    `${year}-${month}-${day}T00:00:00`
  ).toLocaleString('en-US', { timeZone });
  const appointmentDateTime = new Date(appointmentDate);
  
  // Remover horários para comparação apenas das datas
  todayDate.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  appointmentDateTime.setHours(0, 0, 0, 0);

  // Comparar as datas
  if (appointmentDateTime.getTime() === todayDate.getTime()) {
    return `Hoje às ${time}`;
  }
  
  if (appointmentDateTime.getTime() === tomorrow.getTime()) {
    return `Amanhã às ${time}`;
  }

  // Para outras datas, mostrar dia e mês formatados para pt-BR
  return appointmentDateTime.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'numeric'
  }).replace(',', '') + ` às ${time}`;
};

const AppointmentViewModal: React.FC<AppointmentViewModalProps> = ({ 
  isOpen, 
  onClose, 
  appointment, 
  onDelete, 
  onToggleStatus 
}) => {
  if (!isOpen || !appointment) return null;
  
  const status = statusStyles[appointment.status];

  return (
    <AnimatePresence>
      {isOpen && appointment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              layout
              className={`relative bg-[#1A1F2E] rounded-xl border border-white/5 overflow-hidden
                       border-l-4 ${status.border} shadow-lg`}
            >
              <div className="p-4 sm:p-5">
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium text-base sm:text-lg">
                      {appointment.clientName}
                    </h3>
                    <p className="text-sm text-gray-400">{appointment.service}</p>
                  </div>
                  <span className={`text-sm font-medium ${status.text} 
                                px-2 py-1 rounded-full`}>
                    {formatDateTime(appointment.date, appointment.time)}
                  </span>
                </div>

                {/* Informações adicionais */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-300">
                    <span className="text-gray-400">Barbeiro:</span> {appointment.barberName}
                  </p>
                </div>

                {/* Informações e Ações */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-green-400">
                      R$ {appointment.price.toFixed(2)}
                    </span>
                    <span className={`text-sm ${status.text} px-2 py-1 rounded-full ${status.bg}`}>
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus();
                      }}
                      className={`p-2 rounded-lg ${status.text} ${status.bg} transition-colors hover:bg-opacity-20`}
                    >
                      {appointment.status === 'completed' ? <FaTimes size={18} /> : <FaCheck size={18} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="p-2 rounded-lg text-red-400 bg-red-400/10 transition-colors hover:bg-red-400/20"
                    >
                      <FaTrash size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppointmentViewModal;