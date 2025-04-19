import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import {
  FaCheck,
  FaTrash,
  FaTimes,
  FaWhatsapp,
  FaHistory,
  FaTimesCircle
} from 'react-icons/fa';
import { MessageCircle } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { formatFriendlyDateTime } from '../utils/DateTimeUtils';

// Lazy load the appointment history component
const AppointmentHistory = lazy(() => import('./AppointmentHistory'));

// Função formatWhatsApp reutilizada do ClientAnalytics
const formatWhatsApp = (whatsapp: string | undefined): string => {
    if (!whatsapp) return '-';
    let formatted = whatsapp.replace(/^55/, '');
    formatted = formatted.replace(/\D/g, '');
    if (formatted.length >= 10) {
        const ddd = formatted.substring(0, 2);
        const parte1 = formatted.length === 10 ? 
            formatted.substring(2, 6) : 
            formatted.substring(2, 7);
        const parte2 = formatted.length === 10 ? 
            formatted.substring(6) : 
            formatted.substring(7);
        return `(${ddd})${parte1}-${parte2}`;
    }
    return formatted;
};

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed';
  price: number;
  barberName: string;
  clientWhatsapp?: string;
  wppclient?: string;
  createdAt?: string;
  isBlocked?: boolean;
}

interface AppointmentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onDelete: () => void;
  onToggleStatus: () => void;
  isBarber?: boolean;
  allAppointments?: Appointment[];
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

// Usando a função do utilitário centralizado
const formatDateTime = formatFriendlyDateTime;

const AppointmentViewModal: React.FC<AppointmentViewModalProps> = ({ 
  isOpen, 
  onClose, 
  appointment, 
  onDelete, 
  onToggleStatus,
  isBarber = false,
  allAppointments = []
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const modalY = useMotionValue(0);
  const modalOpacity = useTransform(modalY, [0, 300], [1, 0]);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detectar se é dispositivo móvel
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Função para lidar com o gesto de deslize com melhor performance
  const handleDrag = (_: any, info: PanInfo) => {
    if (info.offset.y > 0) {
      modalY.set(info.offset.y);
    }
  };
  
  // Função para lidar com o fim do gesto de deslize com feedback visual
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100) {
      modalY.set(300);
      setTimeout(onClose, 200);
    } else {
      modalY.set(0);
    }
    setIsDragging(false);
  };

  // Função para lidar com ações com feedback visual
  const handleAction = async (action: () => void) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen || !appointment) return null;
  
  const status = statusStyles[appointment.status];
  const whatsapp = appointment?.wppclient || appointment?.clientWhatsapp;

  // Filtrar histórico de agendamentos do mesmo cliente
  const clientHistory = allAppointments.filter(app => 
    (app.wppclient === whatsapp || app.clientWhatsapp === whatsapp) && 
    app.id !== appointment.id
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <AnimatePresence>
      {isOpen && appointment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            initial={{ y: "100%" }}
            exit={{ y: "100%" }}
            transition={{ 
              type: "spring", 
              damping: 30, 
              stiffness: 300,
              mass: 0.8 
            }}
            className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-xl sm:rounded-xl bg-[#1A1F2E] will-change-transform"
            onClick={e => e.stopPropagation()}
            style={{ y: modalY }}
            drag={isMobile ? "y" : false}
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onDragStart={() => setIsDragging(true)}
          >
            {/* Barra superior de arraste e fechamento */}
            <div 
              className="sticky top-0 z-10 px-4 pt-3 pb-2 bg-[#1A1F2E] border-b border-white/5"
              onClick={onClose}
            >
              <div className="flex justify-center mb-2">
                <div className="w-12 h-1 bg-gray-600 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">Detalhes do Agendamento</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  aria-label="Fechar"
                >
                  <FaTimesCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            <motion.div
              layout
              className={`relative border-l-4 ${status.border}`}
            >
              <div className="p-4 space-y-4">
                {/* Informações principais */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-white font-medium text-lg">
                      {appointment.clientName}
                    </h3>
                    <p className="text-sm text-gray-400">{appointment.service}</p>
                  </div>
                  <span className={`text-sm font-medium ${status.text} 
                                px-2 py-1 rounded-full self-start`}>
                    {formatDateTime(appointment.date, appointment.time)}
                  </span>
                </div>

                {/* Seção WhatsApp com feedback visual */}
                {whatsapp && (
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaWhatsapp className="text-green-400" />
                        <p className="text-sm text-gray-300">
                          {formatWhatsApp(whatsapp)}
                        </p>
                      </div>
                      <a
                        href={`https://wa.me/${whatsapp?.replace(/\D/g, '')}?text=Olá ${appointment.clientName}, tudo bem?`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 
                                  bg-green-500/20 text-green-400 rounded-lg text-sm 
                                  hover:bg-green-500/30 transition-all
                                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handleAction(async () => {})}
                      >
                        <MessageCircle size={16} />
                        <span>Enviar Mensagem</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Informações adicionais */}
                {!isBarber && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-300">
                      <span className="text-gray-400">Barbeiro:</span> {appointment.barberName}
                    </p>
                  </div>
                )}

                {/* Histórico de agendamentos com lazy loading */}
                {clientHistory.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      <FaHistory />
                      <span>Histórico de Agendamentos ({clientHistory.length})</span>
                    </button>
                    
                    <AnimatePresence>
                      {showHistory && (
                        <Suspense fallback={
                          <div className="mt-4 p-4 bg-white/5 rounded-lg animate-pulse">
                            <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-white/10 rounded w-1/2"></div>
                          </div>
                        }>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 space-y-3"
                          >
                            <AppointmentHistory appointments={clientHistory} />
                          </motion.div>
                        </Suspense>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Ações com feedback visual */}
                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleAction(() => setStatusModalOpen(true))}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 
                              rounded-lg bg-white/5 text-white hover:bg-white/10 
                              transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    <FaCheck className="w-4 h-4" />
                    <span>Alterar Status</span>
                  </button>
                  <button
                    onClick={() => handleAction(() => setDeleteModalOpen(true))}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 
                              rounded-lg bg-red-500/10 text-red-400 
                              hover:bg-red-500/20 transition-all
                              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    <FaTrash className="w-4 h-4" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Modais de confirmação */}
          <ConfirmationModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={() => handleAction(onDelete)}
            title="Excluir Agendamento"
            message="Tem certeza que deseja excluir este agendamento?"
          />

          <ConfirmationModal
            isOpen={statusModalOpen}
            onClose={() => setStatusModalOpen(false)}
            onConfirm={() => handleAction(onToggleStatus)}
            title="Alterar Status"
            message={`Deseja marcar este agendamento como ${
              appointment.status === 'completed' ? 'pendente' : 'concluído'
            }?`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppointmentViewModal;