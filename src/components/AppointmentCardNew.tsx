import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Tooltip } from 'react-tooltip';
import {
  FaUser,
  FaClock,
  FaCalendar,
  FaMoneyBill,
  FaCut,
  FaCheck,
  FaTrash,
  FaChevronDown,
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

interface Props {
  appointment: Appointment;
  onDelete: () => void;
  onToggleStatus: () => void;
  filterMode: string;
  revenueDisplayMode: string;
  appointments: Appointment[];
}

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-[#1A1F2E] p-5 rounded-xl max-w-sm w-full"
          onClick={e => e.stopPropagation()}
        >
          <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
          <p className="text-gray-400">{message}</p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
            >
              Confirmar
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const statusStyles = {
  pending: { text: 'text-yellow-400', label: 'Pendente' },
  completed: { text: 'text-green-400', label: 'Concluído' },
  confirmed: { text: 'text-blue-400', label: 'Confirmado' }
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

const AppointmentCard = memo(({ appointment, onDelete, onToggleStatus }: Props) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const status = statusStyles[appointment.status];

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-[#1A1F2E] rounded-xl border border-white/5 overflow-hidden"
      >
        {/* Indicador de Status */}
        <div className={`absolute top-0 left-0 w-1 h-full ${status.text.replace('text', 'bg')}`} />

        <div className="p-3 sm:p-4">
          {/* Cabeçalho do Card */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${status.text} bg-white/5`}>
                <FaUser className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm sm:text-base">
                  {appointment.clientName}
                </h3>
                <p className="text-xs text-gray-400">{appointment.service}</p>
              </div>
            </div>
            <span className={`text-xs font-medium ${status.text} bg-white/5 px-2 py-1 rounded-full`}>
              {formatDateTime(appointment.date, appointment.time)}
            </span>
          </div>

          {/* Informações e Ações */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-xs text-green-400">
                R$ {appointment.price.toFixed(2)}
              </span>
              <span className={`text-xs ${status.text}`}>
                {status.label}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowCompleteModal(true)}
                className={`p-1.5 rounded-lg ${status.text} bg-white/5 hover:bg-white/10 transition-colors`}
              >
                {appointment.status === 'completed' ? <FaTimes size={14} /> : <FaCheck size={16} />}
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-1.5 rounded-lg text-red-400 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <FaTrash size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          onDelete();
          setShowDeleteModal(false);
        }}
        title="Confirmar exclusão"
        message="Tem certeza que deseja excluir este agendamento?"
      />

      <ConfirmationModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={() => {
          onToggleStatus();
          setShowCompleteModal(false);
        }}
        title={appointment.status === 'completed' ? 'Desmarcar conclusão' : 'Confirmar conclusão'}
        message={appointment.status === 'completed' 
          ? 'Deseja desmarcar a conclusão deste corte?' 
          : 'Marcar corte como concluído?'}
      />
    </>
  );
});

export default React.memo(AppointmentCard, (prevProps, nextProps) => {
  return (
    prevProps.appointment.id === nextProps.appointment.id &&
    prevProps.appointment.status === nextProps.appointment.status
  );
});
