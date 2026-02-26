/**
 * Multi-tenant test fixtures
 * Provides isolated test data for different barbershops
 */

// import type { BarbershopData } from '@/services/BarbershopService';
import type { Barber, Service, Appointment, PublicComment } from '@/types';

// Test barbershop data
export const testBarbershops: Record<string, {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  plan_type: string;
  settings: {
    theme: string;
    timezone: string;
  };
  created_at: string;
}> = {
  'barbershop-alpha': {
    id: 'bb-alpha-123',
    name: 'Barbearia Alpha',
    slug: 'barbershop-alpha',
    owner_email: 'owner@alpha.com',
    plan_type: 'pro',
    settings: {
      theme: 'dark',
      timezone: 'America/Sao_Paulo'
    },
    created_at: '2024-01-01T10:00:00Z'
  },
  'barbershop-beta': {
    id: 'bb-beta-456',
    name: 'Barbearia Beta',
    slug: 'barbershop-beta',
    owner_email: 'owner@beta.com',
    plan_type: 'free',
    settings: {
      theme: 'light',
      timezone: 'America/Sao_Paulo'
    },
    created_at: '2024-01-02T10:00:00Z'
  },
  'barbershop-gamma': {
    id: 'bb-gamma-789',
    name: 'Barbearia Gamma',
    slug: 'barbershop-gamma',
    owner_email: 'owner@gamma.com',
    plan_type: 'pro',
    settings: {
      theme: 'default',
      timezone: 'America/Sao_Paulo'
    },
    created_at: '2024-01-03T10:00:00Z'
  }
};

// Test barbers per tenant
export const testBarbers: Record<string, Barber[]> = {
  'bb-alpha-123': [
    {
      id: 'barber-alpha-01',
      name: 'João Alpha',
      email: 'joao@alpha.com',
      phone: '+5511999999001',
      specialties: ['Corte', 'Barba'],
      isActive: true,
      workingHours: {
        monday: [{ start: '09:00', end: '18:00' }],
        tuesday: [{ start: '09:00', end: '18:00' }],
        wednesday: [{ start: '09:00', end: '18:00' }],
        thursday: [{ start: '09:00', end: '18:00' }],
        friday: [{ start: '09:00', end: '18:00' }],
        saturday: [{ start: '09:00', end: '16:00' }],
        sunday: []
      },
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z')
    },
    {
      id: 'barber-alpha-02',
      name: 'Pedro Alpha',
      email: 'pedro@alpha.com',
      phone: '+5511999999002',
      specialties: ['Corte', 'Sobrancelha'],
      isActive: true,
      workingHours: {
        monday: [{ start: '10:00', end: '19:00' }],
        tuesday: [{ start: '10:00', end: '19:00' }],
        wednesday: [{ start: '10:00', end: '19:00' }],
        thursday: [{ start: '10:00', end: '19:00' }],
        friday: [{ start: '10:00', end: '19:00' }],
        saturday: [{ start: '10:00', end: '17:00' }],
        sunday: []
      },
      createdAt: new Date('2024-01-01T11:00:00Z'),
      updatedAt: new Date('2024-01-01T11:00:00Z')
    }
  ],
  'bb-beta-456': [
    {
      id: 'barber-beta-01',
      name: 'Carlos Beta',
      email: 'carlos@beta.com',
      phone: '+5511999999003',
      specialties: ['Corte'],
      isActive: true,
      workingHours: {
        monday: [{ start: '08:00', end: '17:00' }],
        tuesday: [{ start: '08:00', end: '17:00' }],
        wednesday: [{ start: '08:00', end: '17:00' }],
        thursday: [{ start: '08:00', end: '17:00' }],
        friday: [{ start: '08:00', end: '17:00' }],
        saturday: [{ start: '08:00', end: '15:00' }],
        sunday: []
      },
      createdAt: new Date('2024-01-02T10:00:00Z'),
      updatedAt: new Date('2024-01-02T10:00:00Z')
    }
  ],
  'bb-gamma-789': [
    {
      id: 'barber-gamma-01',
      name: 'Roberto Gamma',
      email: 'roberto@gamma.com',
      phone: '+5511999999004',
      specialties: ['Corte', 'Barba', 'Sobrancelha'],
      isActive: true,
      workingHours: {
        monday: [{ start: '09:00', end: '18:00' }],
        tuesday: [{ start: '09:00', end: '18:00' }],
        wednesday: [{ start: '09:00', end: '18:00' }],
        thursday: [{ start: '09:00', end: '18:00' }],
        friday: [{ start: '09:00', end: '18:00' }],
        saturday: [{ start: '09:00', end: '16:00' }],
        sunday: [{ start: '10:00', end: '14:00' }]
      },
      createdAt: new Date('2024-01-03T10:00:00Z'),
      updatedAt: new Date('2024-01-03T10:00:00Z')
    }
  ]
};

// Test services per tenant
export const testServices: Record<string, Service[]> = {
  'bb-alpha-123': [
    {
      id: 'service-alpha-01',
      name: 'Corte Masculino Alpha',
      description: 'Corte moderno e estiloso',
      duration: 30,
      price: 35.00,
      category: 'Corte',
      isActive: true,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z')
    },
    {
      id: 'service-alpha-02',
      name: 'Barba Alpha',
      description: 'Aparar e modelar barba',
      duration: 20,
      price: 25.00,
      category: 'Barba',
      isActive: true,
      createdAt: new Date('2024-01-01T10:30:00Z'),
      updatedAt: new Date('2024-01-01T10:30:00Z')
    }
  ],
  'bb-beta-456': [
    {
      id: 'service-beta-01',
      name: 'Corte Simples Beta',
      description: 'Corte básico e rápido',
      duration: 25,
      price: 20.00,
      category: 'Corte',
      isActive: true,
      createdAt: new Date('2024-01-02T10:00:00Z'),
      updatedAt: new Date('2024-01-02T10:00:00Z')
    }
  ],
  'bb-gamma-789': [
    {
      id: 'service-gamma-01',
      name: 'Corte Premium Gamma',
      description: 'Corte premium com acabamento',
      duration: 45,
      price: 50.00,
      category: 'Corte',
      isActive: true,
      createdAt: new Date('2024-01-03T10:00:00Z'),
      updatedAt: new Date('2024-01-03T10:00:00Z')
    },
    {
      id: 'service-gamma-02',
      name: 'Barba Premium Gamma',
      description: 'Barba completa com tratamento',
      duration: 30,
      price: 40.00,
      category: 'Barba',
      isActive: true,
      createdAt: new Date('2024-01-03T10:30:00Z'),
      updatedAt: new Date('2024-01-03T10:30:00Z')
    },
    {
      id: 'service-gamma-03',
      name: 'Sobrancelha Gamma',
      description: 'Design de sobrancelha masculina',
      duration: 15,
      price: 15.00,
      category: 'Sobrancelha',
      isActive: true,
      createdAt: new Date('2024-01-03T11:00:00Z'),
      updatedAt: new Date('2024-01-03T11:00:00Z')
    }
  ]
};

// Test appointments per tenant
export const testAppointments: Record<string, Appointment[]> = {
  'bb-alpha-123': [
    {
      id: 'appt-alpha-01',
      userId: 'user-alpha-01',
      serviceId: 'service-alpha-01',
      barberId: 'barber-alpha-01',
      date: new Date('2024-02-01T10:00:00Z'),
      status: 'confirmed',
      notes: 'Cliente preferencial Alpha',
      createdAt: new Date('2024-01-25T10:00:00Z'),
      updatedAt: new Date('2024-01-25T10:00:00Z')
    },
    {
      id: 'appt-alpha-02',
      userId: 'user-alpha-02',
      serviceId: 'service-alpha-02',
      barberId: 'barber-alpha-02',
      date: new Date('2024-02-01T14:00:00Z'),
      status: 'scheduled',
      notes: 'Primeira vez na Alpha',
      createdAt: new Date('2024-01-26T10:00:00Z'),
      updatedAt: new Date('2024-01-26T10:00:00Z')
    }
  ],
  'bb-beta-456': [
    {
      id: 'appt-beta-01',
      userId: 'user-beta-01',
      serviceId: 'service-beta-01',
      barberId: 'barber-beta-01',
      date: new Date('2024-02-01T09:00:00Z'),
      status: 'confirmed',
      notes: 'Cliente regular Beta',
      createdAt: new Date('2024-01-25T09:00:00Z'),
      updatedAt: new Date('2024-01-25T09:00:00Z')
    }
  ],
  'bb-gamma-789': [
    {
      id: 'appt-gamma-01',
      userId: 'user-gamma-01',
      serviceId: 'service-gamma-01',
      barberId: 'barber-gamma-01',
      date: new Date('2024-02-01T11:00:00Z'),
      status: 'scheduled',
      notes: 'Serviço premium Gamma',
      createdAt: new Date('2024-01-27T10:00:00Z'),
      updatedAt: new Date('2024-01-27T10:00:00Z')
    },
    {
      id: 'appt-gamma-02',
      userId: 'user-gamma-02',
      serviceId: 'service-gamma-02',
      barberId: 'barber-gamma-01',
      date: new Date('2024-02-01T15:30:00Z'),
      status: 'completed',
      notes: 'Serviço completo Gamma',
      createdAt: new Date('2024-01-28T10:00:00Z'),
      updatedAt: new Date('2024-01-28T10:00:00Z')
    }
  ]
};

// Test comments per tenant
export const testComments: Record<string, PublicComment[]> = {
  'bb-alpha-123': [
    {
      id: 'comment-alpha-01',
      name: 'Cliente Alpha 1',
      comment: 'Excelente atendimento na Alpha!',
      status: 'approved',
      createdAt: '2024-01-20T10:00:00.000Z',
      updatedAt: '2024-01-20T10:00:00.000Z'
    },
    {
      id: 'comment-alpha-02',
      name: 'Cliente Alpha 2',
      comment: 'Aguardando aprovação Alpha',
      status: 'pending',
      createdAt: '2024-01-21T10:00:00.000Z',
      updatedAt: '2024-01-21T10:00:00.000Z'
    }
  ],
  'bb-beta-456': [
    {
      id: 'comment-beta-01',
      name: 'Cliente Beta 1',
      comment: 'Bom serviço na Beta',
      status: 'approved',
      createdAt: '2024-01-22T10:00:00.000Z',
      updatedAt: '2024-01-22T10:00:00.000Z'
    }
  ],
  'bb-gamma-789': [
    {
      id: 'comment-gamma-01',
      name: 'Cliente Gamma 1',
      comment: 'Serviço premium excepcional!',
      status: 'approved',
      createdAt: '2024-01-23T10:00:00.000Z',
      updatedAt: '2024-01-23T10:00:00.000Z'
    },
    {
      id: 'comment-gamma-02',
      name: 'Cliente Gamma 2',
      comment: 'Comentário rejeitado',
      status: 'rejected',
      createdAt: '2024-01-24T10:00:00.000Z',
      updatedAt: '2024-01-24T10:00:00.000Z'
    }
  ]
};

/**
 * Get all test data for a specific tenant
 */
export function getTenantTestData(barbershopId: string) {
  return {
    barbershop: Object.values(testBarbershops).find(b => b.id === barbershopId),
    barbers: testBarbers[barbershopId] || [],
    services: testServices[barbershopId] || [],
    appointments: testAppointments[barbershopId] || [],
    comments: testComments[barbershopId] || []
  };
}

/**
 * Get test data for multiple tenants
 */
export function getMultiTenantTestData(barbershopIds: string[]) {
  return barbershopIds.reduce((acc, id) => {
    acc[id] = getTenantTestData(id);
    return acc;
  }, {} as Record<string, ReturnType<typeof getTenantTestData>>);
}

/**
 * Validate that data belongs to correct tenant
 */
export function validateTenantIsolation(data: unknown[], expectedTenantId: string, dataType: string) {
  const violations = data.filter(item => {
    // Check if item has tenant-related fields that don't match
    if (item.barbershopId && item.barbershopId !== expectedTenantId) {
      return true;
    }
    
    // Check ID patterns for tenant isolation
    if (item.id && typeof item.id === 'string') {
      const tenantPrefix = expectedTenantId.split('-')[1]; // Extract tenant identifier
      if (tenantPrefix && !item.id.includes(tenantPrefix)) {
        return true;
      }
    }
    
    return false;
  });
  
  if (violations.length > 0) {
    throw new Error(
      `Tenant isolation violation in ${dataType}: Found ${violations.length} items that don't belong to tenant ${expectedTenantId}`
    );
  }
  
  return true;
}