import { format } from 'date-fns';
import { adjustToBrasilia } from '../utils/DateTimeUtils';

// Constante com horários disponíveis
export const AVAILABLE_TIME_SLOTS = [
  '09:00', '10:00', '11:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00'
];

/**
 * Verifica se um horário está disponível para agendamento
 */
export const isTimeSlotAvailable = (date: string, time: string, barberId: string, appointments: any[]): boolean => {
  if (!appointments || !Array.isArray(appointments)) return true;
  
  return !appointments.some(appointment => 
    appointment.date === date && 
    appointment.time === time && 
    appointment.barberId === barberId &&
    !appointment.isCancelled && 
    !appointment.isRemoved
  );
};

/**
 * Carrega os agendamentos da API com retry e cache
 */
export const loadAppointments = async (retryCount = 0): Promise<any[]> => {
  // Verificar cache local primeiro
  const localCache = localStorage.getItem('appointments');
  if (localCache) {
    try {
      return JSON.parse(localCache);
    } catch (e) {
      console.error('Erro ao parsear cache local:', e);
    }
  }

  try {
    const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/appointments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const jsonData = await response.json();
    if (!jsonData.success) {
      throw new Error('Erro na resposta da API');
    }

    // Filtrar apenas agendamentos válidos e não cancelados
    const validAppointments = jsonData.data.filter((apt: any) => 
      apt && apt.date && apt.time && !apt.isCancelled
    );
    
    // Atualizar cache local
    localStorage.setItem('appointments', JSON.stringify(validAppointments));
    
    return validAppointments;
  } catch (err) {
    console.error('Erro ao carregar agendamentos:', err);
    
    // Retry lógico em caso de falha
    if (retryCount < 3) {
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      return loadAppointments(retryCount + 1);
    }
    
    return [];
  }
};

/**
 * Cria um novo agendamento
 */
export const createAppointment = async (appointmentData: {
  clientName: string;
  wppclient: string;
  serviceName: string;
  date: string;
  time: string;
  barberId: string;
  barberName: string;
  price: number;
}) => {
  const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(appointmentData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao criar agendamento');
  }

  return response.json();
};

/**
 * Formata a mensagem para o WhatsApp
 */
export const formatWhatsappMessage = (data: {
  name: string;
  whatsapp: string;
  barber: string;
  services: string[];
  date: string;
  time: string;
  totalPrice: number;
}) => {
  const formattedDate = data.date
    ? format(new Date(data.date), 'dd/MM/yyyy')
    : format(new Date(), 'dd/MM/yyyy');

  const message = `Olá, segue meu agendamento:
Nome: ${data.name}
WhatsApp: ${data.whatsapp}
Barbeiro: ${data.barber}
Serviços: ${data.services.join(', ')}
Valor: R$ ${data.totalPrice.toFixed(2)}
Data: ${formattedDate}
Horário: ${data.time}
  
Aguardo a confirmação.`;
  
  return encodeURIComponent(message);
};

/**
 * Formata a data para exibição
 */
export const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return '';
  return format(adjustToBrasilia(new Date(new Date(dateString).setDate(new Date(dateString).getDate() + 1))), 'dd/MM/yyyy');
};