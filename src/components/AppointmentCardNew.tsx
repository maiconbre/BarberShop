import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, DollarSign, MoreVertical, Trash2, CheckCircle2, XCircle, Eye, ChevronDown, ChevronUp, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
}

const ConfirmationModal = memo<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}>(({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-[#1A1F2E] rounded-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-sm shadow-xl border border-white/10"
      >
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-300 mb-4">{message}</p>
        <div className="flex justify-end gap-2 sm:gap-3">
            <button
              onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#252B3B] text-white hover:bg-[#2E354A] transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors text-sm"
            >
              Confirmar
            </button>
          </div>
        </motion.div>
    </div>
  );
});

ConfirmationModal.displayName = 'ConfirmationModal';

const AppointmentCardNew = memo<Props>(({ appointment, onDelete, onToggleStatus, onView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

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

  // Manipuladores de toque para gestos em dispositivos móveis
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartY.current) return;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartY.current && touchEndY.current) {
      const diff = touchStartY.current - touchEndY.current;
      if (Math.abs(diff) > 50) {
        // Swipe para cima expande, para baixo retrai
        setIsExpanded(diff > 0);
      }
    }
    touchStartY.current = null;
    touchEndY.current = null;
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'confirmed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
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

  const getStatusGlowColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'shadow-[0_0_15px_rgba(34,197,94,0.2)]';
      case 'confirmed':
        return 'shadow-[0_0_15px_rgba(59,130,246,0.2)]';
      default:
        return 'shadow-[0_0_15px_rgba(234,179,8,0.2)]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'confirmed':
        return 'Confirmado';
      default:
        return 'Pendente';
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
          boxShadow: isExpanded ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className={`bg-[#1A1F2E] rounded-xl border border-white/5 border-l-4 ${getStatusBorderColor(appointment.status)} p-3 sm:p-4 relative group will-change-transform ${isExpanded ? getStatusGlowColor(appointment.status) : ''} mb-3`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          overflowY: 'visible', 
          overflowX: 'hidden',
          maxHeight: isExpanded ? '1000px' : '500px',
          transitionProperty: 'transform, box-shadow, max-height',
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
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
              {getStatusText(appointment.status)}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mb-3 text-xs sm:text-sm text-gray-400">
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
            
          {/* Toggle details button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-white transition-colors bg-[#252B3B]/50 py-1.5 rounded-md mt-1"
          >
            {isExpanded ? (
              <>
                <span>Recolher</span>
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                <span>Expandir</span>
                <ChevronDown size={14} />
              </>
            )}
          </button>
          
          {/* Expanded details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 pt-3 border-t border-white/5"
              >
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#252B3B]/50 rounded-md p-2">
                    <p className="text-gray-400 mb-1">Barbeiro</p>
                    <p className="text-white">{appointment.barberName}</p>
                  </div>
                  <div className="bg-[#252B3B]/50 rounded-md p-2">
                    <p className="text-gray-400 mb-1">Status</p>
                    <p className={appointment.status === 'completed' ? 'text-green-400' : appointment.status === 'confirmed' ? 'text-blue-400' : 'text-yellow-400'}>
                      {getStatusText(appointment.status)}
                    </p>
                  </div>
                  {appointment.createdAt && (
                    <div className="col-span-2 bg-[#252B3B]/50 rounded-md p-2">
                      <p className="text-gray-400 mb-1">Agendado em</p>
                      <p className="text-white">{new Date(appointment.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onView();
                    }}
                    className="flex-1 bg-[#252B3B] hover:bg-[#2E354A] text-white transition-colors rounded-md py-2 text-xs flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} />
                    <span>Detalhes</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                      handleAction(() => setShowStatusModal(true));
                    }}
                    className={`flex-1 transition-colors rounded-md py-2 text-xs flex items-center justify-center gap-1.5
                      ${appointment.status === 'completed' 
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                        : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'}`}
                  >
                    {appointment.status === 'completed' ? (
                      <>
                        <XCircle size={14} />
                        <span>Reverter</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Concluir</span>
                      </>
                    )}
              </button>
            </div>
              </motion.div>
            )}
          </AnimatePresence>
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