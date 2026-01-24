/**
 * Definições de Planos e Limites
 */

export enum PlanType {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

export interface PlanLimits {
  maxBarbers: number;          // -1 = ilimitado
  maxAppointmentsPerMonth: number;
  maxServices: number;
  analytics: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  whatsappIntegration: boolean;
  customDomain: boolean;
}

export interface PlanFeatures {
  name: string;
  price: number;  // em reais
  period: 'monthly' | 'yearly';
  popular?: boolean;
  limits: PlanLimits;
  description: string;
  features: string[];
}

/**
 * Configuração dos Planos Disponíveis
 */
export const PLAN_CONFIGS: Record<PlanType, PlanFeatures> = {
  [PlanType.FREE]: {
    name: 'Gratuito',
    price: 0,
    period: 'monthly',
    description: 'Ideal para testar a plataforma',
    limits: {
      maxBarbers: 1,
      maxAppointmentsPerMonth: 20,
      maxServices: 5,
      analytics: false,
      customBranding: false,
      apiAccess: false,
      prioritySupport: false,
      whatsappIntegration: false,
      customDomain: false
    },
    features: [
      '1 barbeiro',
      '20 agendamentos/mês',
      '5 serviços',
      'Sistema de agendamento básico',
      'Gestão de clientes'
    ]
  },
  [PlanType.PRO]: {
    name: 'Profissional',
    price: 49.90,
    period: 'monthly',
    popular: true,
    description: 'Para barbearias em crescimento',
    limits: {
      maxBarbers: 10,
      maxAppointmentsPerMonth: 500,
      maxServices: 50,
      analytics: true,
      customBranding: true,
      apiAccess: false,
      prioritySupport: true,
      whatsappIntegration: true,
      customDomain: false
    },
    features: [
      'Até 10 barbeiros',
      '500 agendamentos/mês',
      '50 serviços',
      'Analytics e relatórios',
      'Integração WhatsApp',
      'Personalização de marca',
      'Suporte prioritário',
      'Sem anúncios'
    ]
  },
  [PlanType.ENTERPRISE]: {
    name: 'Enterprise',
    price: 149.90,
    period: 'monthly',
    description: 'Para redes de barbearias',
    limits: {
      maxBarbers: -1,  // ilimitado
      maxAppointmentsPerMonth: -1,
      maxServices: -1,
      analytics: true,
      customBranding: true,
      apiAccess: true,
      prioritySupport: true,
      whatsappIntegration: true,
      customDomain: true
    },
    features: [
      'Barbeiros ilimitados',
      'Agendamentos ilimitados',
      'Serviços ilimitados',
      'Analytics avançado',
      'API de integração',
      'Multi-unidades',
      'Domínio personalizado',
      'Gerente de conta dedicado',
      'SLA garantido'
    ]
  }
};

/**
 * Nomes amigáveis para features
 */
export const FEATURE_NAMES: Record<string, string> = {
  maxBarbers: 'Barbeiros',
  maxAppointmentsPerMonth: 'Agendamentos por mês',
  maxServices: 'Serviços',
  analytics: 'Analytics',
  customBranding: 'Personalização de marca',
  apiAccess: 'Acesso à API',
  prioritySupport: 'Suporte prioritário',
  whatsappIntegration: 'Integração WhatsApp',
  customDomain: 'Domínio personalizado'
};
