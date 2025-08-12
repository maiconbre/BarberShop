import { ApiServiceV2 } from './core/ApiServiceV2';
import { UserRepository } from './repositories/UserRepository';
import { ServiceRepository } from './repositories/ServiceRepository';
import { AppointmentRepository } from './repositories/AppointmentRepository';
import { BarberRepository } from './repositories/BarberRepository';
import { CommentRepository } from './repositories/CommentRepository';
import { cacheService } from './CacheService';
import type { IApiService } from './interfaces/IApiService';

/**
 * Factory para criação de serviços seguindo Dependency Injection
 * Implementa o padrão Factory e facilita a configuração de dependências
 */
export class ServiceFactory {
  private static apiService: IApiService | null = null;
  private static userRepository: UserRepository | null = null;
  private static serviceRepository: ServiceRepository | null = null;
  private static appointmentRepository: AppointmentRepository | null = null;
  private static barberRepository: BarberRepository | null = null;
  private static commentRepository: CommentRepository | null = null;

  /**
   * Obtém instância do ApiService (Singleton)
   */
  static getApiService(): IApiService {
    if (!this.apiService) {
      const baseURL = import.meta.env.VITE_API_URL || '';
      this.apiService = ApiServiceV2.create(baseURL, cacheService);
    }
    return this.apiService;
  }

  /**
   * Obtém instância do UserRepository
   */
  static getUserRepository(): UserRepository {
    if (!this.userRepository) {
      this.userRepository = new UserRepository(this.getApiService());
    }
    return this.userRepository;
  }

  /**
   * Obtém instância do ServiceRepository
   */
  static getServiceRepository(): ServiceRepository {
    if (!this.serviceRepository) {
      this.serviceRepository = new ServiceRepository(this.getApiService());
    }
    return this.serviceRepository;
  }

  /**
   * Obtém instância do AppointmentRepository
   */
  static getAppointmentRepository(): AppointmentRepository {
    if (!this.appointmentRepository) {
      this.appointmentRepository = new AppointmentRepository(this.getApiService());
    }
    return this.appointmentRepository;
  }

  /**
   * Obtém instância do BarberRepository
   */
  static getBarberRepository(): BarberRepository {
    if (!this.barberRepository) {
      this.barberRepository = new BarberRepository(this.getApiService());
    }
    return this.barberRepository;
  }

  /**
   * Obtém instância do CommentRepository
   */
  static getCommentRepository(): CommentRepository {
    if (!this.commentRepository) {
      this.commentRepository = new CommentRepository(this.getApiService());
    }
    return this.commentRepository;
  }

  /**
   * Reseta todas as instâncias (útil para testes)
   */
  static reset(): void {
    this.apiService = null;
    this.userRepository = null;
    this.serviceRepository = null;
    this.appointmentRepository = null;
    this.barberRepository = null;
    this.commentRepository = null;
  }

  /**
   * Configura dependências customizadas (útil para testes)
   */
  static configure(dependencies: {
    apiService?: IApiService;
    userRepository?: UserRepository;
    serviceRepository?: ServiceRepository;
    appointmentRepository?: AppointmentRepository;
    barberRepository?: BarberRepository;
    commentRepository?: CommentRepository;
  }): void {
    if (dependencies.apiService) {
      this.apiService = dependencies.apiService;
    }
    if (dependencies.userRepository) {
      this.userRepository = dependencies.userRepository;
    }
    if (dependencies.serviceRepository) {
      this.serviceRepository = dependencies.serviceRepository;
    }
    if (dependencies.appointmentRepository) {
      this.appointmentRepository = dependencies.appointmentRepository;
    }
    if (dependencies.barberRepository) {
      this.barberRepository = dependencies.barberRepository;
    }
    if (dependencies.commentRepository) {
      this.commentRepository = dependencies.commentRepository;
    }
  }
}

/**
 * Hooks para facilitar o uso nos componentes React
 */
export const useApiService = () => ServiceFactory.getApiService();
export const useUserRepository = () => ServiceFactory.getUserRepository();
export const useServiceRepository = () => ServiceFactory.getServiceRepository();
export const useAppointmentRepository = () => ServiceFactory.getAppointmentRepository();
export const useBarberRepository = () => ServiceFactory.getBarberRepository();
export const useCommentRepository = () => ServiceFactory.getCommentRepository();