import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Star, Send, Bug, Lightbulb, Settings, MessageCircle } from 'lucide-react';
import { monitoringService } from '../../services/MonitoringService';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import toast from 'react-hot-toast';

interface UserFeedbackProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserFeedback: React.FC<UserFeedbackProps> = ({ isOpen, onClose }) => {
  const [type, setType] = useState<'bug' | 'feature' | 'improvement' | 'general'>('general');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getCurrentUser } = useAuth();
  const { barbershopId } = useTenant();
  const currentUser = getCurrentUser();

  const feedbackTypes = [
    { id: 'general', label: 'Geral', icon: MessageCircle, color: 'bg-blue-500' },
    { id: 'bug', label: 'Bug/Erro', icon: Bug, color: 'bg-red-500' },
    { id: 'feature', label: 'Nova Funcionalidade', icon: Lightbulb, color: 'bg-green-500' },
    { id: 'improvement', label: 'Melhoria', icon: Settings, color: 'bg-purple-500' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('Por favor, escreva sua mensagem');
      return;
    }

    setIsSubmitting(true);

    try {
      await monitoringService.submitFeedback({
        type,
        rating,
        message: message.trim(),
        email: email.trim() || undefined,
        userId: currentUser?.id,
        barbershopId: barbershopId || undefined,
      });

      toast.success('Feedback enviado com sucesso! Obrigado pela sua contribuição.');
      
      // Reset form
      setMessage('');
      setEmail('');
      setRating(5);
      setType('general');
      onClose();
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      toast.error('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-[#1A1F2E] rounded-2xl border border-[#F0B35B]/20 w-full max-w-md max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#F0B35B]/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#F0B35B]/20 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-[#F0B35B]" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Enviar Feedback</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252B3B] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Feedback Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Tipo de Feedback
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {feedbackTypes.map((feedbackType) => {
                      const Icon = feedbackType.icon;
                      return (
                        <button
                          key={feedbackType.id}
                          type="button"
                          onClick={() => setType(feedbackType.id as typeof type)}
                          className={`p-3 rounded-lg border transition-all duration-200 ${
                            type === feedbackType.id
                              ? 'border-[#F0B35B] bg-[#F0B35B]/10'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 ${feedbackType.color} rounded-md flex items-center justify-center`}>
                              <Icon className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm text-white">{feedbackType.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Como você avalia nossa plataforma?
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star as typeof rating)}
                        className="p-1 rounded transition-colors"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating
                              ? 'text-[#F0B35B] fill-current'
                              : 'text-gray-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sua Mensagem *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Conte-nos sobre sua experiência, sugestões ou problemas..."
                    className="w-full px-4 py-3 bg-[#252B3B] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#F0B35B] focus:outline-none resize-none"
                    rows={4}
                    required
                  />
                </div>

                {/* Email (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 bg-[#252B3B] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#F0B35B] focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Deixe seu email se quiser receber uma resposta
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="w-full bg-[#F0B35B] text-black py-3 px-4 rounded-lg font-semibold hover:bg-[#E6A555] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserFeedback;