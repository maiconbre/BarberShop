import { useMemo } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { ServiceFactory } from '../services/ServiceFactory';
import type { UserRepository } from '../services/repositories/UserRepository';
import type { ServiceRepository } from '../services/repositories/ServiceRepository';
import type { AppointmentRepository } from '../services/repositories/AppointmentRepository';
import type { BarberRepository } from '../services/repositories/BarberRepository';
import type { CommentRepository } from '../services/repositories/CommentRepository';
import type { IApiService } from '../services/interfaces/IApiService';

/**
 * Hook que fornece repositórios com contexto de tenant garantido
 * Assegura que os repositórios sempre usem o tenant correto
 */
export const useTenantRepositories = () => {
  const { barbershopId, isValidTenant } = useTenant();

  // Memoizar repositórios baseado no barbershopId
  const repositories = useMemo(() => {
    // Se não há tenant válido, retornar null para todos os repositórios
    if (!isValidTenant || !barbershopId) {
      return {
        apiService: null,
        userRepository: null,
        serviceRepository: null,
        appointmentRepository: null,
        barberRepository: null,
        commentRepository: null,
        isReady: false
      };
    }

    // Garantir que o ServiceFactory está usando o tenant correto
    ServiceFactory.updateTenantContext(barbershopId);

    return {
      apiService: ServiceFactory.getApiService(),
      userRepository: ServiceFactory.getUserRepository(),
      serviceRepository: ServiceFactory.getServiceRepository(),
      appointmentRepository: ServiceFactory.getAppointmentRepository(),
      barberRepository: ServiceFactory.getBarberRepository(),
      commentRepository: ServiceFactory.getCommentRepository(),
      isReady: true
    };
  }, [barbershopId, isValidTenant]);

  return repositories;
};

/**
 * Hook específico para ApiService com contexto de tenant
 */
export const useTenantApiService = (): IApiService | null => {
  const repositories = useTenantRepositories();
  return repositories.apiService;
};

/**
 * Hook específico para UserRepository com contexto de tenant
 */
export const useTenantUserRepository = (): UserRepository | null => {
  const repositories = useTenantRepositories();
  return repositories.userRepository;
};

/**
 * Hook específico para ServiceRepository com contexto de tenant
 */
export const useTenantServiceRepository = (): ServiceRepository | null => {
  const repositories = useTenantRepositories();
  return repositories.serviceRepository;
};

/**
 * Hook específico para AppointmentRepository com contexto de tenant
 */
export const useTenantAppointmentRepository = (): AppointmentRepository | null => {
  const repositories = useTenantRepositories();
  return repositories.appointmentRepository;
};

/**
 * Hook específico para BarberRepository com contexto de tenant
 */
export const useTenantBarberRepository = (): BarberRepository | null => {
  const repositories = useTenantRepositories();
  return repositories.barberRepository;
};

/**
 * Hook específico para CommentRepository com contexto de tenant
 */
export const useTenantCommentRepository = (): CommentRepository | null => {
  const repositories = useTenantRepositories();
  return repositories.commentRepository;
};

export default useTenantRepositories;