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

  // Estado para armazenar os dados do formulário (incluindo os checkboxes "barba" e "sobrancelha")
  const [formData, setFormData] = useState({
    name: '',
    barber: '',
    date: '',
    time: '',
    service: '',
    barba: false,
    sobrancelha: false,
  });

  // Mapeamento de preços (valores em R$)
  const priceMapping: { [key: string]: number } = {
    "Corte Tradicional": 45,
    "Tesoura": 60,
    "Navalha": 70,
    "Reflexo": 80,
    "Nevou": 90,
    "barba": 25,
    "sobrancelha": 10,
  };

  // Função que calcula o valor total do serviço (serviço + extras, se selecionados)
  const getServicePrice = () => {
    let total = 0;
    if (formData.service && priceMapping[formData.service]) {
      total += priceMapping[formData.service];
    }
    if (formData.barba) {
      total += priceMapping["barba"];
    }
    if (formData.sobrancelha) {
      total += priceMapping["sobrancelha"];
    }
    return `R$ ${total.toFixed(2)}`;
  };

  // Dados estáticos com a propriedade "pix" adicionada
  const barbers = [
    { name: 'Gabriel', whatsapp: '5521997760398', pix: '21997760398' },
    { name: 'Estevão', whatsapp: '5511988888881', pix: '21997764658' }
  ];
  const services = ['Corte Tradicional', 'Tesoura', 'Navalha', 'Reflexo', 'Nevou'];
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

  // Função para obter o código PIX do barbeiro selecionado
  const getBarberPix = () => {
    const barber = barbers.find(b => b.name === formData.barber);
    return barber?.pix || '';
  };

  // Função que monta a mensagem com os dados do agendamento para o WhatsApp, incluindo os extras e o valor do serviço
  const getWhatsappMessage = () => {
    const formattedDate = formData.date
      ? new Date(formData.date).toLocaleDateString()
      : new Date().toLocaleDateString();

    const extras = [];
    if (formData.barba) extras.push("Barba");
    if (formData.sobrancelha) extras.push("Sobrancelha");
    const extrasMessage = extras.length ? `Extras: ${extras.join(', ')}\n` : '';

    const message = `Olá, segue meu agendamento:
Nome: ${formData.name}
Barbeiro: ${formData.barber}
Serviço: ${formData.service}
${extrasMessage}Valor: ${getServicePrice()}
Data: ${formattedDate}
Horário: ${formData.time}
  
Aguardo a confirmação.`;
    return encodeURIComponent(message);
  };

  // Função para copiar o PIX para a área de transferência
  const handleCopyPix = () => {
    const pix = getBarberPix();
    navigator.clipboard.writeText(pix).then(() => {
      alert("PIX copiado!");
    }).catch(err => {
      console.error("Erro ao copiar PIX:", err);
    });
  };

  // Obtém a data atual formatada para o input date
  const today = new Date().toISOString().split('T')[0];

  // Não renderiza nada se o modal estiver fechado
  if (!isOpen) return null;

  // Calcula os extras para o resumo do agendamento
  const extrasText: string[] = [];
  if (formData.barba) extrasText.push("Barba");
  if (formData.sobrancelha) extrasText.push("Sobrancelha");

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="relative bg-[#1A1F2E] rounded-lg max-w-md w-full max-h-[80vh] overflow-auto shadow-2xl transform transition-transform duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <X size={20} />
        </button>
        <div className="p-6">
          {/* Cabeçalho do modal */}
          <div className="flex justify-center items-center text-center mb-6">
            <h2 className="text-2xl font-semibold tracking-wide">
              {step === 1 ? 'Agendar Horário' : 'Agendamento Confirmado!'}
            </h2>
          </div>

          {step === 1 ? (
            // Formulário de agendamento
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Nome */}
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-[#0D121E] rounded-md focus:ring-2 focus:ring-[#F0B35B] outline-none transition-colors"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              {/* Campo Barbeiro */}
              <div>
                <label className="block text-sm font-medium mb-1">Barbeiro</label>
                <select
                  required
                  className="w-full px-4 py-2 bg-[#0D121E] rounded-md focus:ring-2 focus:ring-[#F0B35B] outline-none transition-colors"
                  value={formData.barber}
                  onChange={(e) =>
                    setFormData({ ...formData, barber: e.target.value })
                  }
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
                  className="w-full px-4 py-2 bg-[#0D121E] rounded-md focus:ring-2 focus:ring-[#F0B35B] outline-none transition-colors"
                  value={formData.service}
                  onChange={(e) =>
                    setFormData({ ...formData, service: e.target.value })
                  }
                >
                  <option value="">Selecione um serviço</option>
                  {services.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkboxes para extras */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="barba"
                    value="barba"
                    checked={formData.barba}
                    onChange={(e) =>
                      setFormData({ ...formData, barba: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <label htmlFor="barba" >Barba</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sobrancelha"
                    value="sobrancelha"
                    checked={formData.sobrancelha}
                    onChange={(e) =>
                      setFormData({ ...formData, sobrancelha: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <label htmlFor="sobrancelha">Sobrancelha</label>
                </div>
              </div>

              {/* Campo Data */}
              <div>
                <label className="block text-sm font-medium mb-1">Data</label>
                <input
                  type="date"
                  required
                  min={today}
                  value={formData.date || today}
                  className="w-full px-4 py-2 bg-[#0D121E] rounded-md focus:ring-2 focus:ring-[#F0B35B] outline-none transition-colors"
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
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
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${formData.time === time
                          ? 'bg-[#F0B35B] text-black'
                          : 'bg-[#0D121E] hover:bg-[#F0B35B]/20'
                        }`}
                      onClick={() =>
                        setFormData({ ...formData, time })
                      }
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#F0B35B] text-black py-3 rounded-md font-semibold hover:bg-[#F0B35B]/80 transition-colors"
              >
                Confirmar Agendamento
              </button>
            </form>
          ) : (
            // Tela de confirmação
            <div className="text-center">
              <div className="bg-[#0D121E] p-6 rounded-lg mb-6 shadow-lg">
                <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                  {/* Área do QR Code e PIX */}
                  <div className="w-48 bg-white p-2 rounded-lg flex flex-col items-center justify-center">
                    {formData.barber ? (
                      <>
                        <img
                          src={`/qr-codes/${formData.barber.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}.svg`}
                          alt={`QR Code de ${formData.barber}`}
                          className="w-36 h-36 object-contain hover:scale-105 transition-transform duration-200"
                        />
                        <div className="mt-2 flex items-center">
                          <span className="text-gray-700 font-bold">
                            {getBarberPix()}
                          </span>
                          <button
                            onClick={handleCopyPix}
                            className="ml-4 text-sm bg-green-400 px-2 py-1 rounded hover:shadow-md transition-shadow"
                          >
                            Copiar
                          </button>
                        </div>
                      </>
                    ) : (
                      <span>Sem QR</span>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-300 text-lg font-medium">
                      Pague antecipado e garanta a sua vaga.
                    </p>
                    <p className="text-gray-300 mt-4 text-base">
                      Valor <strong>{getServicePrice()}</strong>
                    </p>
                  </div>
                </div>

                {/* Botão WhatsApp */}
                <a
                  href={`https://wa.me/${getBarberWhatsApp()}?text=${getWhatsappMessage()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-transform hover:scale-105 mb-6"
                >
                  <MessageCircle size={20} />
                  Confirmar vaga
                </a>

                {/* Resumo do agendamento */}
                <div className="text-left space-y-2 bg-[#1A1F2E] p-4 rounded-lg">
                  <p>
                    <strong>Nome:</strong> {formData.name}
                  </p>
                  <p>
                    <strong>Barbeiro:</strong> {formData.barber}
                  </p>
                  <p>
                    <strong>Serviço:</strong> {formData.service}
                  </p>
                  <p>
                    <strong>Extras:</strong> {extrasText.length ? extrasText.join(", ") : "Nenhum"}
                  </p>
                  <p>
                    <strong>Valor:</strong> {getServicePrice()}
                  </p>
                  <p>
                    <strong>Data:</strong>{' '}
                    {formData.date
                      ? new Date(formData.date).toLocaleDateString()
                      : new Date().toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Horário:</strong> {formData.time}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-[#F0B35B] text-black py-3 rounded-md font-semibold hover:bg-[#F0B35B]/80 transition-colors"
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
