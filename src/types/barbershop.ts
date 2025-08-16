// Barbershop configuration types

export interface WorkingHours {
  [key: string]: {
    start?: string;
    end?: string;
    closed?: boolean;
  };
}

export interface BarbershopSettings {
  theme?: string;
  workingHours?: WorkingHours;
  notifications?: {
    email?: boolean;
    whatsapp?: boolean;
  };
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
  contact?: {
    phone?: string;
    address?: string;
    website?: string;
  };
}

export interface BarbershopConfiguration {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  planType: 'free' | 'pro';
  settings: BarbershopSettings;
  createdAt: string;
  updatedAt?: string;
}

export interface BarbershopUpdateData {
  name?: string;
  settings?: Partial<BarbershopSettings>;
}

export interface BarbershopUpdateResponse {
  success: boolean;
  message: string;
  data: BarbershopConfiguration;
}

// Theme options
export const THEME_OPTIONS = [
  { value: 'default', label: 'Padrão', description: 'Tema clássico da plataforma' },
  { value: 'dark', label: 'Escuro', description: 'Tema escuro moderno' },
  { value: 'blue', label: 'Azul', description: 'Tema azul profissional' },
  { value: 'green', label: 'Verde', description: 'Tema verde natural' }
] as const;

// Color presets for branding
export const COLOR_PRESETS = [
  { name: 'Clássico', primary: '#3B82F6', secondary: '#1E40AF' },
  { name: 'Elegante', primary: '#6366F1', secondary: '#4338CA' },
  { name: 'Moderno', primary: '#8B5CF6', secondary: '#7C3AED' },
  { name: 'Natural', primary: '#10B981', secondary: '#059669' },
  { name: 'Quente', primary: '#F59E0B', secondary: '#D97706' },
  { name: 'Vibrante', primary: '#EF4444', secondary: '#DC2626' }
] as const;

// Working hours defaults
export const DEFAULT_WORKING_HOURS: WorkingHours = {
  monday: { start: '08:00', end: '18:00' },
  tuesday: { start: '08:00', end: '18:00' },
  wednesday: { start: '08:00', end: '18:00' },
  thursday: { start: '08:00', end: '18:00' },
  friday: { start: '08:00', end: '18:00' },
  saturday: { start: '08:00', end: '16:00' },
  sunday: { closed: true }
};

// Day labels in Portuguese
export const DAY_LABELS = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo'
} as const;