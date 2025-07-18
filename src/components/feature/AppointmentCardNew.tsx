import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, DollarSign, MoreVertical, Trash2, CheckCircle2, XCircle, Eye, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ConfirmationModal from '../ui/ConfirmationModal';

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

interface Props {
  appointment: Appointment;
  onDelete: () => void;
  onToggleStatus: () => void;
  onView: () => void;
  className?: string;
}



const AppointmentCardNew = memo<Props>(({ appointment, onDelete, onToggleStatus, onView, className = '' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Fechar o menu quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = async (action: () => void) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await action();
    } finally {
      setIsProcessing(false);
      setIsMenuOpen(false);
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "dd 'de' MMMM", { locale: ptBR });
    } catch (error) {
      return date;
    }
  };

  const formatTime = (time: string) => {
    try {
      return format(new Date(`2000-01-01T${time}`), 'HH:mm');
    } catch (error) {
      return time;
    }
  };



  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-l-green-500';
      case 'confirmed':
        return 'border-l-blue-500';
      default:
        return 'border-l-yellow-500';
    }
  };



  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          height: 'auto',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className={`bg-[#1A1F2E] rounded-xl border border-white/5 border-l-4 ${getStatusBorderColor(appointment.status)} p-3 sm:p-4 relative group will-change-transform mb-3 ${className}`}
        style={{ 
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          overflowY: 'visible', 
          overflowX: 'hidden',
          transitionProperty: 'transform, box-shadow',
          transitionDuration: '0.2s',
          transitionTimingFunction: 'ease-out'
        }}
      >
        {/* Menu button */}
        <div className="absolute top-2 right-2 z-10">
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                !isProcessing && setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              disabled={isProcessing}
              aria-label="Menu de ações"
            >
              <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1 w-40 bg-[#252B3B] rounded-lg shadow-lg border border-white/10 py-1 z-10"
                >
                  <button
                    onClick={() => handleAction(onView)}
                    className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                    disabled={isProcessing}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Visualizar</span>
                  </button>
                  <button
                    onClick={() => handleAction(() => setShowStatusModal(true))}
                    className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                    disabled={isProcessing}
                  >
                    {appointment.status === 'completed' ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Marcar Pendente</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Marcar Concluído</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleAction(() => setShowDeleteModal(true))}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2 transition-colors"
                    disabled={isProcessing}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Card content with clickable area */}
        <div 
          className="cursor-pointer" 
          onClick={() => onView()}
        >
          <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-[#252B3B] rounded-full p-1.5">
                <User className="w-4 h-4 text-[#F0B35B]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-medium text-white truncate">{appointment.clientName}</h3>
                <p className="text-xs sm:text-sm text-gray-400 truncate">{appointment.service}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-gray-400">
            <div className="flex items-center gap-1.5 bg-[#252B3B]/70 px-2 py-1 rounded-md">
              <Calendar className="w-3.5 h-3.5 text-[#F0B35B]" />
              <span>{formatDate(appointment.date)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#252B3B]/70 px-2 py-1 rounded-md">
              <Clock className="w-3.5 h-3.5 text-[#F0B35B]" />
              <span>{formatTime(appointment.time)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#252B3B]/70 px-2 py-1 rounded-md">
              <DollarSign className="w-3.5 h-3.5 text-[#F0B35B]" />
              <span>R$ {appointment.price.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDeleteModal && (
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
            onConfirm={() => handleAction(onDelete)}
            title="Excluir Agendamento"
        message="Tem certeza que deseja excluir este agendamento?"
      />
        )}

        {showStatusModal && (
      <ConfirmationModal
            isOpen={showStatusModal}
            onClose={() => setShowStatusModal(false)}
            onConfirm={() => handleAction(onToggleStatus)}
            title="Alterar Status"
            message={`Deseja marcar este agendamento como ${
              appointment.status === 'completed' ? 'pendente' : 'concluído'
            }?`}
          />
        )}
      </AnimatePresence>
    </>
  );
});

AppointmentCardNew.displayName = 'AppointmentCardNew';

export default AppointmentCardNew;