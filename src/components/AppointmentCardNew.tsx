import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCheck,
  FaTrash,
  FaTimes
} from 'react-icons/fa';
import { formatFriendlyDateTime } from '../utils/DateTimeUtils';

interface Appointment {
  id: string;
  clientName: string;
  clientWhatsapp?: string;
  wppclient?: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed';
  price: number;
  barberName: string;
  barberId?: string;
  createdAt?: string;
  updatedAt?: string;
  viewed?: boolean;
}

interface Props {
  appointment: Appointment;
  onDelete: () => void;
  onToggleStatus: () => void;
  onView?: () => void;
  filterMode?: string;
  revenueDisplayMode: string;
  appointments: Appointment[];
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonClass?: string;
}

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmButtonClass = "" }: ConfirmationModalProps) => (
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
              className={confirmButtonClass || "px-4 py-2 text-sm bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"}
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

// Usando a função do utilitário centralizado
const formatDateTime = formatFriendlyDateTime;

const AppointmentCard = memo(({ appointment, onDelete, onToggleStatus, onView }: Props) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const status = statusStyles[appointment.status];

  // Adicionar animação para novos itens
  const isNew = React.useRef(true);
  React.useEffect(() => {
    isNew.current = false;
  }, []);

  const handleCardClick = (e: React.MouseEvent) => {
    // Evitar que o clique no card dispare quando clicar nos botões
    if (e.target instanceof HTMLElement && 
        (e.target.closest('button') || e.target.tagName === 'BUTTON' || e.target.closest('svg'))) {
      return;
    }
    if (onView) {
      onView();
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={isNew.current ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.3,
          ease: "easeOut"
        }}
        onClick={handleCardClick}
        className={`relative bg-[#1A1F2E] rounded-xl border border-white/5 overflow-hidden
                   border-l-4 ${statusStyles[appointment.status].border} hover:shadow-lg transition-all cursor-pointer`}
      >
        <div className="p-3 sm:p-4">
          {/* Cabeçalho do Card */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium text-sm sm:text-base">
                {appointment.clientName}
              </h3>
              <p className="text-xs text-gray-400">{appointment.service}</p>
            </div>
            <span className={`text-xs font-medium ${status.text}  
                            px-2 py-1 rounded-full`}>
              {formatDateTime(appointment.date, appointment.time)}
            </span>
          </div>

          {/* Informações e Ações */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-xs text-green-400">
                R$ {appointment.price.toFixed(2)}
              </span>
              <span className={`text-xs ${status.text} px-2 py-0.5 rounded-full ${status.bg}`}>
                {status.label}
              </span>
            </div>
            
            <div className="flex gap-3 mr-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCompleteModal(true);
                }}
                className={`p-1.5 rounded-lg ${status.text} ${status.bg} transition-colors`}
              >
                {appointment.status === 'completed' ? <FaTimes size={16} /> : <FaCheck size={16} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(true);
                }}
                className="p-1.5 rounded-lg text-red-400 bg-red-400/10 transition-colors"
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
        confirmButtonClass="px-4 py-2 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
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
  const { appointment: prev } = prevProps;
  const { appointment: next } = nextProps;
  
  return (
    prev.id === next.id &&
    prev.status === next.status &&
    prev.date === next.date &&
    prev.time === next.time
  );
});
