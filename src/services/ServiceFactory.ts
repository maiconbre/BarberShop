import { ApiServiceV2 } from './core/ApiServiceV2';
import { UserRepository } from './repositories/UserRepository';
import { ServiceRepository } from './repositories/ServiceRepository';
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
   * Reseta todas as instâncias (útil para testes)
   */
  static reset(): void {
    this.apiService = null;
    this.userRepository = null;
    this.serviceRepository = null;
  }

  /**
   * Configura dependências customizadas (útil para testes)
   */
  static configure(dependencies: {
    apiService?: IApiService;
    userRepository?: UserRepository;
    serviceRepository?: ServiceRepository;
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
  }
}

/**
 * Hooks para facilitar o uso nos componentes React
 */
export const useApiService = () => ServiceFactory.getApiService();
export const useUserRepository = () => ServiceFactory.getUserRepository();
export const useServiceRepository = () => ServiceFactory.getServiceRepository();