import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { formatFriendlyDateTime, BRASILIA_TIMEZONE } from '../utils/DateTimeUtils';

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
}

interface AppointmentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onDelete: () => void;
  onToggleStatus: () => void;
  isBarber?: boolean; // Nova prop para identificar se é barbeiro
  allAppointments?: Appointment[]; // Nova prop para acessar histórico
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
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", scale: 1 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: "100%", scale: 1 }}
            transition={{ type: "spring", damping: 20 }}
            className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-xl sm:rounded-xl"
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              layout
              className={`relative bg-[#1A1F2E] rounded-t-xl sm:rounded-xl border border-white/5 overflow-hidden
                       border-l-4 ${status.border} shadow-lg`}
            >
              {/* Botão de fechar (X) */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors z-10"
                aria-label="Fechar"
              >
                <FaTimesCircle size={18} />
              </button>
              <div className="p-4 sm:p-5 space-y-4">
                {/* Cabeçalho com indicador de arraste para mobile */}
                <div className="sm:hidden w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4" />

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

                {/* Seção WhatsApp */}
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
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-all"
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

                {/* Histórico de agendamentos */}
                {clientHistory.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex items-center justify-between w-full text-sm text-gray-300 mb-2 hover:text-[#F0B35B] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FaHistory className="text-[#F0B35B]" />
                        <span>Histórico de Agendamentos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[#F0B35B] font-medium">{clientHistory.length}</span>
                        <span className="text-xs text-gray-400">{showHistory ? '(ocultar)' : '(mostrar)'}</span>
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {showHistory && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-2 mt-3 max-h-48 overflow-y-auto pr-1"
                        >
                          {clientHistory.map((hist) => (
                            <motion.div
                              key={hist.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className={`p-3 rounded-lg bg-[#0D121E] border-l-2 ${statusStyles[hist.status].border} hover:bg-[#151C2A] transition-colors`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm text-white font-medium">
                                    {formatDateTime(hist.date, hist.time)}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {hist.service}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Barbeiro: {hist.barberName}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[hist.status].bg} ${statusStyles[hist.status].text}`}>
                                    {statusStyles[hist.status].label}
                                  </span>
                                  <span className="text-xs text-green-400 font-medium">
                                    R$ {hist.price.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Ações */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
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
                        setStatusModalOpen(true);
                      }}
                      className={`p-2 rounded-lg ${status.text} ${status.bg} transition-colors hover:bg-opacity-20`}
                    >
                      {appointment.status === 'completed' ? <FaTimes size={18} /> : <FaCheck size={18} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModalOpen(true);
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
          
          {/* Modal de confirmação para exclusão */}
          <ConfirmationModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={() => {
              setDeleteModalOpen(false);
              onDelete();
            }}
            title="Excluir Agendamento"
            message={`Tem certeza que deseja excluir o agendamento de ${appointment.clientName}? Esta ação não pode ser desfeita.`}
            confirmButtonText="Excluir"
            confirmButtonClass="px-4 py-2 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
          />
          
          {/* Modal de confirmação para alteração de status */}
          <ConfirmationModal
            isOpen={statusModalOpen}
            onClose={() => setStatusModalOpen(false)}
            onConfirm={() => {
              setStatusModalOpen(false);
              onToggleStatus();
            }}
            title={appointment.status === 'completed' ? "Reverter Status" : "Alterar Status"}
            message={appointment.status === 'completed' ? 
              `Tem certeza que deseja reverter o status do agendamento de ${appointment.clientName} para não concluído?` : 
              `Tem certeza que deseja marcar o agendamento de ${appointment.clientName} como concluído?`}
            confirmButtonText={appointment.status === 'completed' ? "Reverter" : "Concluir"}
            confirmButtonClass={`px-4 py-2 text-sm ${status.bg} ${status.text} hover:bg-opacity-20 rounded-lg transition-colors`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppointmentViewModal;