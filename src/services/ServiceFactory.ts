import { ServiceRepository } from './repositories/ServiceRepository';
import { UserRepository } from './repositories/UserRepository';
import { AppointmentRepository } from './repositories/AppointmentRepository';
import { BarberRepository } from './repositories/BarberRepository';
import { CommentRepository } from './repositories/CommentRepository';
import { logger } from '../utils/logger';

export class ServiceFactory {
  private static serviceRepositoryInstance: ServiceRepository | null = null;
  private static userRepositoryInstance: UserRepository | null = null;
  private static appointmentRepositoryInstance: AppointmentRepository | null = null;
  private static barberRepositoryInstance: BarberRepository | null = null;
  private static commentRepositoryInstance: CommentRepository | null = null;

  /**
   * Get the ServiceRepository instance
   */
  static getServiceRepository(): ServiceRepository {
    if (!this.serviceRepositoryInstance) {
      this.serviceRepositoryInstance = new ServiceRepository();
      logger.info('ServiceRepository instance created');
    }
    return this.serviceRepositoryInstance;
  }

  /**
   * Get the UserRepository instance
   */
  static getUserRepository(): UserRepository {
    if (!this.userRepositoryInstance) {
      this.userRepositoryInstance = new UserRepository();
      logger.info('UserRepository instance created');
    }
    return this.userRepositoryInstance;
  }

  /**
   * Get the AppointmentRepository instance
   */
  static getAppointmentRepository(): AppointmentRepository {
    if (!this.appointmentRepositoryInstance) {
      this.appointmentRepositoryInstance = new AppointmentRepository();
      logger.info('AppointmentRepository instance created');
    }
    return this.appointmentRepositoryInstance;
  }

  /**
   * Get the BarberRepository instance
   */
  static getBarberRepository(): BarberRepository {
    if (!this.barberRepositoryInstance) {
      this.barberRepositoryInstance = new BarberRepository();
      logger.info('BarberRepository instance created');
    }
    return this.barberRepositoryInstance;
  }

  /**
   * Get the CommentRepository instance
   */
  static getCommentRepository(): CommentRepository {
    if (!this.commentRepositoryInstance) {
      this.commentRepositoryInstance = new CommentRepository();
      logger.info('CommentRepository instance created');
    }
    return this.commentRepositoryInstance;
  }

  /**
   * Reset all service instances (useful for testing)
   */
  static reset(): void {
    this.serviceRepositoryInstance = null;
    this.userRepositoryInstance = null;
    this.appointmentRepositoryInstance = null;
    this.barberRepositoryInstance = null;
    this.commentRepositoryInstance = null;
    logger.info('ServiceFactory instances reset');
  }

  /**
   * Update the tenant context for all services
   */
  static updateTenantContext(tenantId: string): void {
    logger.info(`Updating tenant context to: ${tenantId}`);
    // Update API Service headers or context if needed
    // This is a placeholder for future implementation where services might need tenant awareness
    // For now, it just logs, preventing the crash
  }
}

// Export singleton instances for convenience
// export const apiService = ServiceFactory.getApiService(); // REMOVED
// export const apiServiceV2 = ServiceFactory.getApiServiceV2(); // REMOVED

// Export repository hooks for React components
// export const useApiService = () => ServiceFactory.getApiService(); // REMOVED
export const useUserRepository = () => ServiceFactory.getUserRepository();
export const useServiceRepository = () => ServiceFactory.getServiceRepository();
export const useAppointmentRepository = () => ServiceFactory.getAppointmentRepository();
export const useBarberRepository = () => ServiceFactory.getBarberRepository();
export const useCommentRepository = () => ServiceFactory.getCommentRepository();