import React, { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';

// Interface para as props do componente
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  // Estado para controlar as etapas do agendamento (1: formulário, 2: confirmação)
  const [step, setStep] = useState(1);

  // Estado para armazenar os dados do formulário
  const [formData, setFormData] = useState({
    name: '',
    barber: '',
    date: '',
    time: '',
    service: '',
  });

  // Dados estáticos
  const barbers = [
    { name: 'Gabriel', whatsapp: '5511999999999' },
    { name: 'Tavin', whatsapp: '5511988888881' }
  ];
  const services = ['Corte Tradicional', 'Navalha', 'Corte + Barba', 'barba', 'Reflexo', 'Nevou'];
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  // Função para lidar com o envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  // Função para obter o WhatsApp do barbeiro selecionado
  const getBarberWhatsApp = () => {
    const barber = barbers.find(b => b.name === formData.barber);
    return barber?.whatsapp || '';
  };

  // Função que monta a mensagem com os dados do agendamento para o WhatsApp
  const getWhatsappMessage = () => {
    const formattedDate = formData.date
      ? new Date(formData.date).toLocaleDateString()
      : '';
    const message = `Olá, segue meu agendamento:
Nome: ${formData.name}
Barbeiro: ${formData.barber}
Serviço: ${formData.service}
Data: ${formattedDate}
Horário: ${formData.time}
  
Aguardo a confirmação.`;
    return encodeURIComponent(message);
  };

  // Obtém a data atual formatada para o input date
  const today = new Date().toISOString().split('T')[0];

  // Não renderiza nada se o modal estiver fechado
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1F2E] rounded-lg max-w-md w-full shadow-2xl modal-animation">
        <div className="p-6">
          {/* Cabeçalho do modal */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {step === 1 ? 'Agendar Horário' : 'Agendamento Confirmado!'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {step === 1 ? (
            // Formulário de agendamento
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Nome */}
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-[#0D121E] rounded-md focus:ring-2 focus:ring-[#F0B35B] outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Campo Barbeiro */}
              <div>
                <label className="block text-sm font-medium mb-1">Barbeiro</label>
                <select
                  required
                  className="w-full px-3 py-2 bg-[#0D121E] rounded-md focus:ring-2 focus:ring-[#F0B35B] outline-none"
                  value={formData.barber}
                  onChange={(e) => setFormData({ ...formData, barber: e.target.value })}
                >
                  <option value="">Selecione um barbeiro</option>
                  {barbers.map((barber) => (
                    <option key={barber.name} value={barber.name}>
                      {barber.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campo Serviço */}
              <div>
                <label className="block text-sm font-medium mb-1">Serviço</label>
                <select
                  required
                  className="w-full px-3 py-2 bg-[#0D121E] rounded-md focus:ring-2 focus:ring-[#F0B35B] outline-none"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                >
                  <option value="">Selecione um serviço</option>
                  {services.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campo Data */}
              <div>
                <label className="block text-sm font-medium mb-1">Data</label>
                <input
                  type="date"
                  required
                  min={today}
                  defaultValue={today}
                  className="w-full px-3 py-2 bg-[#0D121E] rounded-md focus:ring-2 focus:ring-[#F0B35B] outline-none"
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              {/* Campo Horário */}
              <div>
                <label className="block text-sm font-medium mb-1">Horário</label>
                <div className="grid grid-cols-4 gap-2">
                  {times.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={`px-3 py-2 rounded-md text-sm ${
                        formData.time === time
                          ? 'bg-[#F0B35B] text-black'
                          : 'bg-[#0D121E] hover:bg-[#F0B35B]/20'
                      }`}
                      onClick={() => setFormData({ ...formData, time })}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#F0B35B] text-black py-3 rounded-md font-semibold hover:bg-[#F0B35B]/80"
              >
                Confirmar Agendamento
              </button>
            </form>
          ) : (
            // Tela de confirmação
            <div className="text-center">
              {/* Ícone de sucesso */}
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              {/* Mensagem de sucesso e QR Code */}
              <div className="bg-[#0D121E] p-6 rounded-lg mb-6">
                <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                  {/* Exibe o QR Code do barbeiro selecionado como uma imagem PNG */}
                  <div className="w-150 h-150 bg-white p-1 rounded-lg flex items-center justify-center">
                    {formData.barber ? (
                      <img
                        src={`/qr-codes/${formData.barber}.png`}
                        alt={`QR Code de ${formData.barber}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span>Sem QR</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300">
                    Realize o pagamento via Pix e envie o comprovante para confirmar sua vaga.
                  </p>
                </div>

                {/* Botão WhatsApp com mensagem pré-preenchida */}
                <a
                  href={`https://wa.me/${getBarberWhatsApp()}?text=${getWhatsappMessage()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-md hover:bg-green-700 mb-6"
                >
                  <MessageCircle size={20} />
                  Enviar comprovante no WhatsApp
                </a>

                {/* Resumo do agendamento */}
                <div className="text-left space-y-2 bg-[#1A1F2E] p-4 rounded-lg">
                  <p><strong>Nome:</strong> {formData.name}</p>
                  <p><strong>Barbeiro:</strong> {formData.barber}</p>
                  <p><strong>Serviço:</strong> {formData.service}</p>
                  <p>
                    <strong>Data:</strong>{' '}
                    {formData.date ? new Date(formData.date).toLocaleDateString() : ''}
                  </p>
                  <p><strong>Horário:</strong> {formData.time}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-[#F0B35B] text-black py-3 rounded-md font-semibold hover:bg-[#F0B35B]/80"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
