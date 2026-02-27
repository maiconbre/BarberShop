import { memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Check, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { safeFixed } from '../../utils/numberUtils';

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

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "dd MMM", { locale: ptBR });
    } catch {
      return date;
    }
  };

  const formatTime = (time: string) => {
    try {
      return format(new Date(`2000-01-01T${time}`), 'HH:mm');
    } catch {
      return time;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'confirmed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="w-3 h-3" />;
      case 'confirmed': return <User className="w-3 h-3" />; // Or another icon
      default: return <Clock className="w-3 h-3" />;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative bg-[#1A1F2E] rounded-xl border border-white/5 p-3 flex flex-col justify-between group h-full shadow-sm transition-all ${className}`}
    >
      {/* Top Section: Client & Service */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 mr-2">
          <h3 className="text-white font-semibold text-sm truncate" title={appointment.clientName}>
            {appointment.clientName}
          </h3>
          <p className="text-gray-400 text-xs truncate" title={appointment.service}>
            {appointment.service}
          </p>
        </div>
        {/* Status Badge (Compact) */}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(appointment.status)}`}>
          {getStatusIcon(appointment.status)}
          <span className="capitalize">{appointment.status === 'completed' ? 'Concluído' : appointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}</span>
        </div>
      </div>

      {/* Middle Section: Date, Time, Price */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5 mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{formatDate(appointment.date)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{formatTime(appointment.time)}</span>
          </div>
        </div>
        <div className="text-primary font-bold text-sm">
          R$ {safeFixed(appointment.price, 2)}
        </div>
      </div>

      {/* Bottom Section: Actions */}
      <div className="flex items-center justify-end gap-1 mt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Ver detalhes"
        >
          <Eye className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onToggleStatus(); }}
          className={`p-1.5 rounded-lg transition-colors ${appointment.status === 'completed'
            ? 'text-yellow-400 hover:bg-yellow-400/10'
            : appointment.status === 'confirmed'
              ? 'text-green-400 hover:bg-green-400/10'
              : 'text-blue-400 hover:bg-blue-400/10'
            }`}
          title={appointment.status === 'completed' ? 'Reabrir' : appointment.status === 'confirmed' ? 'Concluir' : 'Confirmar'}
        >
          {appointment.status === 'completed' ? <Clock className="w-4 h-4" /> : appointment.status === 'confirmed' ? <Check className="w-4 h-4" /> : <Check className="w-4 h-4" />}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
});

AppointmentCardNew.displayName = 'AppointmentCardNew';

export default AppointmentCardNew;