import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
}

const AppointmentCardNew: React.FC<Props> = ({ appointment, onDelete, onToggleStatus }) => {
  const [isOpen, setIsOpen] = useState(false);

  const statusColors = {
    pending: 'bg-yellow-500',
    completed: 'bg-green-500',
    confirmed: 'bg-blue-500'
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <motion.div
      layout
      className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${statusColors[appointment.status]}`} />
            <div>
              <h3 className="text-white font-medium">{appointment.clientName}</h3>
              <p className="text-sm text-gray-400">
                {appointment.status === 'pending' ? 'Pendente' : 'Concluído'}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <FaChevronDown className="text-gray-400" />
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-700"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center text-gray-400">
                <FaCut className="mr-2" />
                <span>{appointment.service}</span>
              </div>
              <div className="flex items-center text-gray-400">
                <FaCalendar className="mr-2" />
                <span>{formatDate(appointment.date)}</span>
              </div>
              <div className="flex items-center text-gray-400">
                <FaClock className="mr-2" />
                <span>{appointment.time}</span>
              </div>
              <div className="flex items-center text-[#F0B35B]">
                <FaMoneyBill className="mr-2" />
                <span>R$ {appointment.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center text-gray-400">
                <FaUser className="mr-2" />
                <span>{appointment.barberName}</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <FaTrash />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-full ${
                    appointment.status === 'completed'
                      ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                      : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus();
                  }}
                >
                  <FaCheck />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AppointmentCardNew;
