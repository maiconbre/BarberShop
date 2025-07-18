import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonClass?: string;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "Confirmar",
  cancelButtonText = "Cancelar",
  confirmButtonClass = "",
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
                {cancelButtonText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`${confirmButtonClass || "px-4 py-2 text-sm bg-[#F0B35B] text-black hover:bg-[#F0B35B]/90 rounded-lg transition-colors"} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Processando...' : confirmButtonText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;