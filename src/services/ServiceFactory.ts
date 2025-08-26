import { ApiServiceV2 } from './core/ApiServiceV2';
import { ApiService } from './ApiService';
import type { IApiService } from './interfaces/IApiService';
import { ServiceRepository } from './repositories/ServiceRepository';
import { UserRepository } from './repositories/UserRepository';
import { AppointmentRepository } from './repositories/AppointmentRepository';
import { BarberRepository } from './repositories/BarberRepository';
import { CommentRepository } from './repositories/CommentRepository';
import { logger } from '../utils/logger';

export class ServiceFactory {
  private static apiServiceInstance: IApiService | null = null;
  private static apiServiceV2Instance: ApiServiceV2 | null = null;
  private static serviceRepositoryInstance: ServiceRepository | null = null;
  private static userRepositoryInstance: UserRepository | null = null;
  private static appointmentRepositoryInstance: AppointmentRepository | null = null;
  private static barberRepositoryInstance: BarberRepository | null = null;
  private static commentRepositoryInstance: CommentRepository | null = null;

  /**
   * Get the legacy ApiService instance for backward compatibility
   */
  static getApiService(): IApiService {
    if (!this.apiServiceInstance) {
      this.apiServiceInstance = new ApiService();
      logger.info('Legacy ApiService instance created');
    }
    return this.apiServiceInstance;
  }

  /**
   * Get the new ApiServiceV2 instance with enhanced features
   */
  static getApiServiceV2(): ApiServiceV2 {
    if (!this.apiServiceV2Instance) {
      this.apiServiceV2Instance = new ApiServiceV2({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
      });
      logger.info('ApiServiceV2 instance created');
    }
    return this.apiServiceV2Instance;
  }

  /**
   * Get the ServiceRepository instance
   */
  static getServiceRepository(): ServiceRepository {
    if (!this.serviceRepositoryInstance) {
      this.serviceRepositoryInstance = new ServiceRepository(this.getApiService());
      logger.info('ServiceRepository instance created');
    }
    return this.serviceRepositoryInstance;
  }

  /**
   * Get the UserRepository instance
   */
  static getUserRepository(): UserRepository {
    if (!this.userRepositoryInstance) {
      this.userRepositoryInstance = new UserRepository(this.getApiService());
      logger.info('UserRepository instance created');
    }
    return this.userRepositoryInstance;
  }

  /**
   * Get the AppointmentRepository instance
   */
  static getAppointmentRepository(): AppointmentRepository {
    if (!this.appointmentRepositoryInstance) {
      this.appointmentRepositoryInstance = new AppointmentRepository(this.getApiService());
      logger.info('AppointmentRepository instance created');
    }
    return this.appointmentRepositoryInstance;
  }

  /**
   * Get the BarberRepository instance
   */
  static getBarberRepository(): BarberRepository {
    if (!this.barberRepositoryInstance) {
      this.barberRepositoryInstance = new BarberRepository(this.getApiService());
      logger.info('BarberRepository instance created');
    }
    return this.barberRepositoryInstance;
  }

  /**
   * Get the CommentRepository instance
   */
  static getCommentRepository(): CommentRepository {
    if (!this.commentRepositoryInstance) {
      this.commentRepositoryInstance = new CommentRepository(this.getApiService());
      logger.info('CommentRepository instance created');
    }
    return this.commentRepositoryInstance;
  }

  /**
   * Reset all service instances (useful for testing)
   */
  static reset(): void {
    this.apiServiceInstance = null;
    this.apiServiceV2Instance = null;
    this.serviceRepositoryInstance = null;
    this.userRepositoryInstance = null;
    this.appointmentRepositoryInstance = null;
    this.barberRepositoryInstance = null;
    this.commentRepositoryInstance = null;
    logger.info('ServiceFactory instances reset');
  }

  /**
   * Create a new ApiService instance with custom configuration
   */
  static createApiService(): IApiService {
    return new ApiService();
  }

  /**
   * Create a new ApiServiceV2 instance with custom configuration
   */
  static createApiServiceV2(config?: {
    baseURL?: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  }): ApiServiceV2 {
    return new ApiServiceV2(config);
  }
}

// Export singleton instances for convenience
export const apiService = ServiceFactory.getApiService();
export const apiServiceV2 = ServiceFactory.getApiServiceV2();

// Export repository hooks for React components
export const useApiService = () => ServiceFactory.getApiService();
export const useUserRepository = () => ServiceFactory.getUserRepository();
export const useServiceRepository = () => ServiceFactory.getServiceRepository();
export const useAppointmentRepository = () => ServiceFactory.getAppointmentRepository();
export const useBarberRepository = () => ServiceFactory.getBarberRepository();
export const useCommentRepository = () => ServiceFactory.getCommentRepository();