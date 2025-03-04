import React, { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import Calendar from './Calendar';
import { format } from 'date-fns';

// Interface para as props do componente
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  // Estado para controlar as etapas do agendamento (1: formulário, 2: confirmação)
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [error, setError] = useState('');

  // Estado para armazenar os dados do formulário (incluindo os checkboxes "barba" e "sobrancelha")
  const [formData, setFormData] = useState({
    name: '',
    barber: '',
    barberId: '',
    date: '',
    time: '',
    service: '',
    barba: false,
    sobrancelha: false,
  });

  // Efeito para prevenir zoom em dispositivos móveis quando o teclado é aberto
  useEffect(() => {
    if (isOpen) {
      // Função para prevenir zoom quando um input recebe foco
      const preventZoom = (e: Event) => {
        e.preventDefault();
        document.body.style.height = window.innerHeight + 'px';
      };

      // Adiciona listeners para eventos de foco em inputs e selects
      document.addEventListener('focus', preventZoom, true);
      
      // Função para restaurar o comportamento normal quando o input perde o foco
      const restoreZoom = () => {
        document.body.style.height = '';
      };
      
      document.addEventListener('blur', restoreZoom, true);
      
      // Cleanup function
      return () => {
        document.removeEventListener('focus', preventZoom, true);
        document.removeEventListener('blur', restoreZoom, true);
        document.body.style.height = '';
      };
    }
  }, [isOpen]);

  // Mapeamento de preços (valores em R$)
  const getServicePrice: { [key: string]: number } = {
    "Corte Tradicional": 45,
    "Tesoura": 60,
    "Navalha": 70,
    "Reflexo": 80,
    "Nevou": 90,
    "barba": 25,
    "sobrancelha": 10,
  };
  const [barbers, setBarbers] = useState([
    { id: '01', name: 'Maicon', whatsapp: '21997764645', pix: '21997761646' },
    { id: '02', name: 'Brendon', whatsapp: '2199774658', pix: '21554875965' }
  ]);
  const services = ['Corte Tradicional', 'Tesoura', 'Navalha', 'Reflexo', 'Nevou'];
  // Buscar barbeiros da API ao carregar o componente
  React.useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const response = await fetch('https://barber-backend-spm8.onrender.com/api/barbers');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setBarbers(result.data);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar barbeiros:', error);
      }
    };

    fetchBarbers();
  }, []);
  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time || !formData.date) {
      setError('Por favor, selecione uma data e horário');
      return;
    }
    if (!formData.barber) {
      setError('Por favor, selecione um barbeiro');
      return;
    }
    if (!formData.service) {
      setError('Por favor, selecione um Corte');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const formattedDate = formData.date;

      const appointmentData = {
        clientName: formData.name,
        serviceName: formData.service + (formData.barba ? ', Barba' : '') + (formData.sobrancelha ? ', Sobrancelha' : ''),
        date: formattedDate,
        time: formData.time,
        barberId: formData.barberId,
        barberName: formData.barber,
        price: getServicePrice[formData.service] +
          (formData.barba ? getServicePrice["barba"] : 0) +
          (formData.sobrancelha ? getServicePrice["sobrancelha"] : 0)
      };

      const response = await fetch('https://barber-backend-spm8.onrender.com/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(appointmentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao criar agendamento');
      }

      // Update local storage
      const storedAppointments = localStorage.getItem('appointments') || '[]';
      const appointments = JSON.parse(storedAppointments);
      appointments.push({
        id: result.data.id.toString(),
        client_name: appointmentData.clientName,
        service_name: appointmentData.serviceName,
        date: appointmentData.date,
        time: appointmentData.time,
        status: 'pending',
        barber_id: appointmentData.barberId,
        barber_name: appointmentData.barberName,
        price: appointmentData.price
      });
      localStorage.setItem('appointments', JSON.stringify(appointments));

      // Trigger storage event for dashboard update
      window.dispatchEvent(new Event('storage'));

      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setStep(2);
      }, 1500);

    } catch (err) {
      console.error('Error saving appointment:', err);
      setError('Erro ao salvar agendamento');
    } finally {
      setIsLoading(false);
    }
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

  // Função que monta a mensagem com os dados do agendamento para o WhatsApp, incluindo os extras e o valor do Corte
  const getWhatsappMessage = () => {
    const formattedDate = formData.date
      ? format(new Date(formData.date), 'dd/MM/yyyy')
      : format(new Date(), 'dd/MM/yyyy');

    const extras = [];
    if (formData.barba) extras.push("Barba");
    if (formData.sobrancelha) extras.push("Sobrancelha");
    const extrasMessage = extras.length ? `Extras: ${extras.join(', ')}\n` : '';

    const message = `Olá, segue meu agendamento:
Nome: ${formData.name}
Barbeiro: ${formData.barber}
Corte: ${formData.service}
${extrasMessage}Valor: R$ ${getServicePrice[formData.service] +
      (formData.barba ? getServicePrice["barba"] : 0) +
      (formData.sobrancelha ? getServicePrice["sobrancelha"] : 0)}
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

  // Função para prevenir zoom ao clicar em inputs
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    // Previne o comportamento padrão que pode causar zoom
    e.preventDefault();
    // Ajusta o tamanho da fonte para evitar que o navegador faça zoom
    document.documentElement.style.fontSize = '16px';
  };

  // Não renderiza nada se o modal estiver fechado
  if (!isOpen) return null;

  // Calcula os extras para o resumo do agendamento
  const extrasText: string[] = [];
  if (formData.barba) extrasText.push("Barba");
  if (formData.sobrancelha) extrasText.push("Sobrancelha");

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 md:p-8 transition-all duration-500 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <div className="relative bg-[#1A1F2E] rounded-lg w-[95%] sm:w-[90%] sm:max-w-md max-h-[95vh] sm:max-h-[85vh] overflow-auto shadow-2xl transform transition-all duration-500 ease-out hover:shadow-[#F0B35B]/10">
        <button
          onClick={onClose}
          className="absolute top-1 right-1 sm:top-2 sm:right-2 text-gray-400 hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-full"
        >
          <X size={18} className="transform hover:rotate-90 transition-transform duration-300" />
        </button>
        <div className="p-4 sm:p-6">
          <div className="text-center mb-6">
            <div className="inline-block mb-2">
              <div className="flex items-center justify-center space-x-2 text-[#F0B35B]">
                <div className="h-px w-5 bg-[#F0B35B]"></div>
                <span className="uppercase text-xs font-semibold tracking-wider">Agende seu horário</span>
                <div className="h-px w-5 bg-[#F0B35B]"></div>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Transforme seu <span className="text-[#F0B35B] relative overflow-hidden "><span className="relative z-10">Visual</span></span>
            </h2>
          </div>

          {showSuccessMessage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 rounded-lg">
              <div className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold animate-bounce">
                Agendamento realizado com sucesso!
              </div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-4 relative">
              <div className="group relative">
                <label className="block text-sm font-medium mb-1.5 text-gray-300 group-hover:text-[#F0B35B] transition-colors">Nome</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#0D121E] rounded-lg focus:ring-2 focus:ring-[#F0B35B] outline-none transition-all duration-300 border border-transparent hover:border-[#F0B35B]/30 text-sm placeholder-gray-500"
                    value={formData.name}
                    placeholder="Digite seu nome completo"
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    onFocus={handleInputFocus}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F0B35B]/70">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-lg pointer-events-none border border-[#F0B35B]/0 group-hover:border-[#F0B35B]/20 transition-colors duration-300"></div>
                </div>
              </div>

              <div className="group relative">
                <label className="block text-sm font-medium mb-1.5 text-gray-300 group-hover:text-[#F0B35B] transition-colors">Barbeiro</label>
                <div className="relative">
                  <select
                    required
                    className="w-full appearance-none pl-10 pr-10 py-3 bg-[#0D121E] rounded-lg focus:ring-2 focus:ring-[#F0B35B] outline-none transition-colors text-sm border border-transparent hover:border-[#F0B35B]/30"
                    value={formData.barberId}
                    onChange={(e) => {
                      const selectedBarber = barbers.find(b => b.id === e.target.value);
                      setFormData({
                        ...formData,
                        barberId: e.target.value,
                        barber: selectedBarber?.name || ''
                      });
                    }}
                    onFocus={handleInputFocus}
                  >
                    <option value="">Selecione um barbeiro</option>
                    {barbers.map((barber) => (
                      <option key={barber.id} value={barber.id}>
                        {barber.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F0B35B]/70">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F0B35B]/70 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-lg pointer-events-none border border-[#F0B35B]/0 group-hover:border-[#F0B35B]/20 transition-colors duration-300"></div>
                </div>
              </div>

              <div className="group relative">
                <label className="block text-sm font-medium mb-1.5 text-gray-300 group-hover:text-[#F0B35B] transition-colors">Corte</label>
                <div className="relative">
                  <select
                    required
                    className="w-full appearance-none pl-10 pr-10 py-3 bg-[#0D121E] rounded-lg focus:ring-2 focus:ring-[#F0B35B] outline-none transition-colors text-sm border border-transparent hover:border-[#F0B35B]/30"
                    value={formData.service}
                    onChange={(e) =>
                      setFormData({ ...formData, service: e.target.value })
                    }
                    onFocus={handleInputFocus}
                  >
                    <option value="">Selecione um Corte</option>
                    {services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F0B35B]/70">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5.5 13a3.5 3.5 0 0 1 2.25-3.27l1.54 1.54a1 1 0 0 0 1.42 0l1.54-1.54a3.5 3.5 0 0 1 2.25 3.27V14H5.5v-1zM10 4.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm1.35 5.65L8 11.79l1.65-1.64a2.5 2.5 0 1 0-3.3 0z"/>
                      <path d="M15 4.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-1.35 5.65L12 11.79l-1.65-1.64a2.5 2.5 0 1 1 3.3 0z"/>
                    </svg>
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F0B35B]/70 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-lg pointer-events-none border border-[#F0B35B]/0 group-hover:border-[#F0B35B]/20 transition-colors duration-300"></div>
                </div>
              </div>

            

              <div className="bg-[#0D121E]/80 p-4 rounded-lg border border-[#F0B35B]/10 mb-2">
                <p className="text-sm text-gray-300 mb-3 font-medium">Serviços adicionais:</p>
                <div className="flex flex-row justify-around space-x-4 text-xs">
                  <div className="flex flex-col space-y-1 group">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <input
                          type="checkbox"
                          id="barba"
                          value="barba"
                          checked={formData.barba}
                          onChange={(e) =>
                            setFormData({ ...formData, barba: e.target.checked })
                          }
                          className="appearance-none w-4 h-4 border-2 border-[#F0B35B]/30 rounded checked:bg-[#F0B35B] checked:border-[#F0B35B] focus:outline-none focus:ring-2 focus:ring-[#F0B35B]/50 transition-colors duration-200"
                          onFocus={handleInputFocus}
                        />
                        <svg className="absolute left-1 top-1 w-2 h-2 text-black pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <label htmlFor="barba" className="text-sm text-gray-300 group-hover:text-white transition-colors">Barba</label>
                    </div>
                    <span className="text-xs text-[#F0B35B] ml-6">R$ {getServicePrice["barba"]}</span>
                  </div>

                  <div className="flex flex-col space-y-1 group">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <input
                          type="checkbox"
                          id="sobrancelha"
                          value="sobrancelha"
                          checked={formData.sobrancelha}
                          onChange={(e) =>
                            setFormData({ ...formData, sobrancelha: e.target.checked })
                          }
                          className="appearance-none w-4 h-4 border-2 border-[#F0B35B]/30 rounded checked:bg-[#F0B35B] checked:border-[#F0B35B] focus:outline-none focus:ring-2 focus:ring-[#F0B35B]/50 transition-colors duration-200"
                          onFocus={handleInputFocus}
                        />
                        <svg className="absolute left-1 top-1 w-2 h-2 text-black pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <label htmlFor="sobrancelha" className="text-sm text-gray-300 group-hover:text-white transition-colors">Sobrancelha</label>
                    </div>
                    <span className="text-xs text-[#F0B35B] ml-6">R$ {getServicePrice["sobrancelha"]}</span>
                  </div>
                </div>
              </div>

              <Calendar
                selectedBarber={formData.barber}
                onTimeSelect={(date, time) => {
                  setFormData({
                    ...formData,
                    date: format(date, 'yyyy-MM-dd'),
                    time: time
                  });
                }}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="relative overflow-hidden group w-full bg-[#F0B35B] text-black py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_25px_rgba(240,179,91,0.5)] active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed border-2 border-[#F0B35B]/70"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando...
                    </span>
                  ) : 'Confirmar Agendamento'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/40 to-[#F0B35B]/0 -skew-x-45 animate-shine"></div>
              </button>
            </form>
          ) : (
            <div className="text-center transform transition-all duration-500 animate-fadeIn">
              <div className="bg-[#0D121E] p-2 sm:p-4 rounded-lg mb-3 sm:mb-4 shadow-lg">
                <div className="flex flex-col md:flex-row items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-40 bg-white p-2 rounded-lg flex flex-col items-center justify-center">
                    {formData.barber ? (
                      <>
                        <img
                          src={`/qr-codes/${formData.barber.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}.svg`}
                          alt={`QR Code de ${formData.barber}`}
                          className="w-32 h-32 object-contain hover:scale-105 transition-transform duration-200"
                        />
                        <div className="mt-1 flex items-center text-xs">
                          <span className="text-gray-700 font-bold">
                            {getBarberPix()}
                          </span>
                          <button
                            onClick={handleCopyPix}
                            className="ml-2 text-xs bg-green-400 text-black px-1.5 py-0.5 rounded hover:shadow-md hover:scale-105 transition-all duration-200"
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
                    <p className="text-gray-300 text-sm sm:text-base font-medium">
                      Pague antecipado e garanta a sua vaga.
                    </p>
                    <p className="text-gray-300 mt-2 text-sm sm:text-base">
                      Valor <strong>R$ {getServicePrice[formData.service] +
                        (formData.barba ? getServicePrice["barba"] : 0) +
                        (formData.sobrancelha ? getServicePrice["sobrancelha"] : 0)}</strong>
                    </p>
                  </div>
                </div>

                <a
                  href={`https://wa.me/${getBarberWhatsApp()}?text=${getWhatsappMessage()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative overflow-hidden group flex items-center justify-center gap-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-all duration-300 hover:scale-105 mb-3 text-sm"
                >
                  <span className="relative z-10 flex items-center gap-1">
                    <MessageCircle size={16} />
                    Confirmar vaga
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/0 via-white/30 to-green-600/0 -skew-x-45 opacity-0 group-hover:opacity-100 group-hover:animate-shine"></div>
                </a>

                <div className="text-left space-y-1 bg-[#1A1F2E] p-3 rounded-lg text-xs sm:text-sm">
                  <p><strong>Nome:</strong> {formData.name}</p>
                  <p><strong>Barbeiro:</strong> {formData.barber}</p>
                  <p><strong>Corte:</strong> {formData.service}</p>
                  <p><strong>Extras:</strong> {extrasText.length ? extrasText.join(", ") : "Nenhum"}</p>
                  <p><strong>Valor:</strong> R$ {getServicePrice[formData.service] +
                    (formData.barba ? getServicePrice["barba"] : 0) +
                    (formData.sobrancelha ? getServicePrice["sobrancelha"] : 0)}</p>
                  <p>
                    <strong>Data:</strong>{' '}
                    {formData.date
                      ? format(new Date(formData.date.replace(/-/g, '/')), 'dd/MM/yyyy')
                      : format(new Date(), 'dd/MM/yyyy')}
                  </p>
                  <p><strong>Horário:</strong> {formData.time}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="relative overflow-hidden group w-full bg-[#F0B35B] text-black py-2 rounded-md font-semibold hover:bg-[#F0B35B] hover:scale-105 hover:shadow-[0_0_20px_rgba(240,179,91,0.5)] transition-all duration-300 text-sm border-2 border-[#F0B35B]/70"
              >
                <span className="relative z-10">Fechar</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/40 to-[#F0B35B]/0 -skew-x-45 opacity-0 group-hover:opacity-100 group-hover:animate-shine"></div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal
