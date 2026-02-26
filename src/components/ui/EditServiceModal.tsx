import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scissors } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  price: number;
  barbers?: string[];
  selected?: boolean;
}

interface EditServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updatedService: Service) => void;
  service: Service | null;
  isLoading?: boolean;
}

const EditServiceModal: React.FC<EditServiceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  service,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    price: 0
  });
  const [errors, setErrors] = useState({
    name: '',
    price: ''
  });

  // Preencher formulário quando o serviço for selecionado
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        price: service.price
      });
      setErrors({ name: '', price: '' });
    }
  }, [service]);

  const validateForm = () => {
    const newErrors = { name: '', price: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do serviço é obrigatório';
      isValid = false;
    }

    if (formData.price <= 0) {
      newErrors.price = 'Preço deve ser maior que zero';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !service) return;

    const updatedService: Service = {
      ...service,
      name: formData.name.trim(),
      price: formData.price
    };

    onConfirm(updatedService);
  };

  const handleClose = () => {
    setFormData({ name: '', price: 0 });
    setErrors({ name: '', price: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 rounded-xl max-w-md w-full border border-[#F0B35B]/20 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#F0B35B]/20 rounded-lg">
                  <Scissors className="w-5 h-5 text-[#F0B35B]" />
                </div>
                <h3 className="text-xl font-semibold text-white">Editar Serviço</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome do Serviço */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Serviço
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full p-3 bg-[#0D121E] rounded-lg focus:ring-2 focus:ring-[#F0B35B] outline-none transition-all duration-300 border text-white placeholder-gray-500 ${
                    errors.name ? 'border-red-500' : 'border-transparent hover:border-[#F0B35B]/30'
                  }`}
                  placeholder="Ex: Corte Tradicional"
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Preço */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preço (R$)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className={`w-full p-3 bg-[#0D121E] rounded-lg focus:ring-2 focus:ring-[#F0B35B] outline-none transition-all duration-300 border text-white placeholder-gray-500 ${
                    errors.price ? 'border-red-500' : 'border-transparent hover:border-[#F0B35B]/30'
                  }`}
                  placeholder="Ex: 45.00"
                  step="0.01"
                  min="0"
                  disabled={isLoading}
                />
                {errors.price && (
                  <p className="text-red-400 text-sm mt-1">{errors.price}</p>
                )}
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#F0B35B]/20">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 text-sm bg-[#F0B35B] text-black hover:bg-[#F0B35B]/90 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  whileHover={{ scale: isLoading ? 1 : 1.05 }}
                  whileTap={{ scale: isLoading ? 1 : 0.95 }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditServiceModal;