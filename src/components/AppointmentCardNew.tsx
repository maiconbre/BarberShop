import React, { useState, useRef, useEffect } from 'react';
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
  FaChevronDown
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

const AppointmentCardNew: React.FC<Props> = ({ appointment, onDelete, onToggleStatus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Fechar o card quando clicar fora dele
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const statusColors = {
    pending: 'bg-yellow-500',
    completed: 'bg-green-500',
    confirmed: 'bg-blue-500'
  };

  const statusLabels = {
    pending: 'Pendente',
    completed: 'Concluído',
    confirmed: 'Confirmado'
  };

  const formatDate = (date: string) => {
    const [year, month, day] = date.split('-');
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('pt-BR');
  };

  // Melhorar variantes de animação
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  // Melhorar variantes do dropdown
  const contentVariants = {
    hidden: { height: 0, opacity: 0, transition: { duration: 0.2 } },
    visible: { 
      height: 'auto', 
      opacity: 1,
      transition: { 
        height: { duration: 0.3, ease: "easeOut" },
        opacity: { duration: 0.2, delay: 0.1 }
      }
    },
    exit: { 
      height: 0, 
      opacity: 0,
      transition: { 
        height: { duration: 0.3, ease: "easeIn" },
        opacity: { duration: 0.2 }
      }
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    onDelete();
    setShowDeleteConfirm(false);
  };

  return (
    <motion.div
      ref={cardRef}
      layout="position"
      layoutId={appointment.id}
      className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl overflow-hidden shadow-lg hover:shadow-xl border border-gray-700/30 transition-all duration-300"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
    >
      <motion.div
        className="p-5 cursor-pointer relative overflow-hidden group"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: prefersReducedMotion ? 1 : 1.005 }}
        whileTap={{ scale: prefersReducedMotion ? 1 : 0.995 }}
      >
        {/* Header do Card */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                appointment.status === 'pending' ? 'bg-yellow-500/10' : 
                appointment.status === 'completed' ? 'bg-green-500/10' : 
                'bg-blue-500/10'
              }`}>
                <FaUser className={`w-5 h-5 ${
                  appointment.status === 'pending' ? 'text-yellow-400' : 
                  appointment.status === 'completed' ? 'text-green-400' : 
                  'text-blue-400'
                }`} />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${statusColors[appointment.status]} ring-2 ring-[#1A1F2E]`} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg tracking-tight">{appointment.clientName}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  appointment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 
                  appointment.status === 'completed' ? 'bg-green-500/20 text-green-300' : 
                  'bg-blue-500/20 text-blue-300'
                }`}>
                  {statusLabels[appointment.status]}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-300 font-medium">{appointment.time}</span>
              </div>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "anticipate" }}
            className="bg-[#252B3B] p-2.5 rounded-xl hover:bg-[#2A3042] transition-colors"
          >
            <FaChevronDown className="text-gray-300 w-4 h-4" />
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence mode="sync">
        {isOpen && (
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="border-t border-gray-700/50 bg-[#1E2334]/80 backdrop-blur-sm"
          >
            {/* Detalhes do Agendamento */}
            <div className="p-5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 bg-[#252B3B]/50 p-3.5 rounded-xl group hover:bg-[#252B3B]/70 transition-all duration-200">
                  <div className="p-2.5 rounded-lg bg-[#F0B35B]/10 group-hover:bg-[#F0B35B]/20 transition-colors">
                    <FaCut className="w-5 h-5 text-[#F0B35B]" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 font-medium">Serviço</span>
                    <span className="text-sm text-white">{appointment.service}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-[#252B3B]/50 p-3.5 rounded-xl group hover:bg-[#252B3B]/70 transition-all duration-200">
                  <div className="p-2.5 rounded-lg bg-[#F0B35B]/10 group-hover:bg-[#F0B35B]/20 transition-colors">
                    <FaCalendar className="w-5 h-5 text-[#F0B35B]" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 font-medium">Data</span>
                    <span className="text-sm text-white">{formatDate(appointment.date)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-[#252B3B]/50 p-3.5 rounded-xl group hover:bg-[#252B3B]/70 transition-all duration-200">
                  <div className="p-2.5 rounded-lg bg-[#F0B35B]/10 group-hover:bg-[#F0B35B]/20 transition-colors">
                    <FaClock className="w-5 h-5 text-[#F0B35B]" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 font-medium">Horário</span>
                    <span className="text-sm text-white">{appointment.time}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-[#252B3B]/50 p-3.5 rounded-xl group hover:bg-[#252B3B]/70 transition-all duration-200">
                  <div className="p-2.5 rounded-lg bg-[#F0B35B]/10 group-hover:bg-[#F0B35B]/20 transition-colors">
                    <FaMoneyBill className="w-5 h-5 text-[#F0B35B]" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 font-medium">Valor</span>
                    <span className="text-sm text-white font-semibold">R$ {appointment.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <motion.button
                  data-tooltip-id="delete-tooltip"
                  data-tooltip-content={showDeleteConfirm ? "Clique novamente para confirmar" : "Excluir agendamento"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                    showDeleteConfirm 
                      ? 'bg-red-500/30 text-red-300 animate-pulse'
                      : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300'
                  }`}
                  onClick={handleDelete}
                  onMouseLeave={() => setTimeout(() => setShowDeleteConfirm(false), 2000)}
                >
                  <FaTrash className="w-4 h-4" />
                  <span className="font-medium">
                    {showDeleteConfirm ? 'Confirmar exclusão?' : 'Excluir Agendamento'}
                  </span>
                </motion.button>

                <motion.button
                  data-tooltip-id="status-tooltip"
                  data-tooltip-content={
                    appointment.status === 'completed' 
                      ? 'Marcar como pendente'
                      : 'Marcar como concluído'
                  }
                  whileHover={{ scale: prefersReducedMotion ? 1 : 1.02 }}
                  whileTap={{ scale: prefersReducedMotion ? 0.98 : 0.98 }}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-colors duration-300 ${
                    appointment.status === 'completed'
                      ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300'
                      : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus();
                  }}
                >
                  <FaCheck className="w-4 h-4" />
                  <span className="font-medium">
                    {appointment.status === 'completed' ? 'Marcar como Pendente' : 'Marcar como Concluído'}
                  </span>
                </motion.button>
              </div>
              
              <Tooltip id="delete-tooltip" className="z-50" />
              <Tooltip id="status-tooltip" className="z-50" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Otimizar memo com comparação personalizada
export default React.memo(AppointmentCardNew, (prevProps, nextProps) => {
  return (
    prevProps.appointment.id === nextProps.appointment.id &&
    prevProps.appointment.status === nextProps.appointment.status
  );
});
