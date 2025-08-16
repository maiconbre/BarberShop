// Plan and billing types for multi-tenant SaaS

export type PlanType = 'free' | 'pro';

export interface PlanLimits {
  barbers: number;
  appointments_per_month: number;
  services: number;
  storage_mb: number;
}

export interface UsageStats {
  current: number;
  limit: number;
  remaining: number;
  percentage: number;
  nearLimit: boolean;
}

export interface PlanUsage {
  planType: PlanType;
  limits: PlanLimits;
  usage: {
    barbers: UsageStats;
    appointments: UsageStats;
  };
  upgradeRecommended: boolean;
  upgradeRequired: boolean;
}

export interface PlanInfo {
  barbershopId: string;
  name: string;
  slug: string;
  planType: PlanType;
  settings: Record<string, unknown>;
  createdAt: string;
}

export interface UpgradeRequest {
  planType: PlanType;
}

export interface UpgradeResponse {
  barbershopId: string;
  name: string;
  slug: string;
  planType: PlanType;
  upgradedAt: string;
  transactionId: string;
  paymentMethod: string;
}

export interface TransactionHistory {
  id: string;
  type: 'plan_activation' | 'plan_upgrade';
  planType: PlanType;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  createdAt: string;
  paymentMethod: string | null;
  transactionId: string | null;
}

export interface PlanHistoryResponse {
  barbershopId: string;
  currentPlan: PlanType;
  transactions: TransactionHistory[];
}

// Plan features for display
export interface PlanFeature {
  name: string;
  free: string | number | boolean;
  pro: string | number | boolean;
  highlight?: boolean;
}

export const PLAN_FEATURES: PlanFeature[] = [
  {
    name: 'Barbeiros',
    free: 1,
    pro: 'Ilimitados',
    highlight: true
  },
  {
    name: 'Agendamentos/mês',
    free: 20,
    pro: 'Ilimitados',
    highlight: true
  },
  {
    name: 'Serviços',
    free: 5,
    pro: 'Ilimitados'
  },
  {
    name: 'Armazenamento',
    free: '100MB',
    pro: '1GB'
  },
  {
    name: 'Suporte',
    free: 'Email',
    pro: 'Prioritário'
  },
  {
    name: 'Relatórios',
    free: false,
    pro: true
  }
];

export const PLAN_PRICES = {
  free: 0,
  pro: 39.90
} as const;

// Notification types for plan limits
export interface PlanLimitNotification {
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Error types for plan operations
export interface PlanError {
  code: string;
  message: string;
  data?: {
    current: number;
    limit: number;
    planType: PlanType;
    upgradeRequired: boolean;
  };
}