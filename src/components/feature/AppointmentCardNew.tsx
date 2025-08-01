import { memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, DollarSign, User } from 'lucide-react';
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
  className?: string;
}



const AppointmentCardNew = memo<Props>(({ appointment, onView, className = '' }) => {

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'confirmed':
        return 'text-blue-400';
      default:
        return 'text-yellow-400';
    }
  };



  return (
    <motion.div
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
      className={`bg-[#1A1F2E] rounded-xl border border-white/5 border-l-4 ${getStatusBorderColor(appointment.status)} p-4 cursor-pointer group will-change-transform ${className}`}
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
      onClick={() => onView()}
    >
      {/* Header com cliente e status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="bg-[#252B3B] rounded-full p-2 flex-shrink-0">
            <User className="w-4 h-4 text-[#F0B35B]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate leading-tight">{appointment.clientName}</h3>
            <p className="text-xs text-gray-400 truncate mt-0.5">{appointment.service}</p>
          </div>
        </div>
        <div className="flex-shrink-0 ml-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full bg-black/20 ${getStatusColor(appointment.status)}`}>
            {getStatusText(appointment.status)}
          </span>
        </div>
      </div>

      {/* Informações principais */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-[#F0B35B] flex-shrink-0" />
            <span className="text-xs font-medium">{formatDate(appointment.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Clock className="w-3.5 h-3.5 text-[#F0B35B] flex-shrink-0" />
            <span className="text-xs font-medium">{formatTime(appointment.time)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#F0B35B]">R$ {appointment.price.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

AppointmentCardNew.displayName = 'AppointmentCardNew';

export default AppointmentCardNew;