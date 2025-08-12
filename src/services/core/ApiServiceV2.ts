import type { IApiService, RequestOptions, IErrorHandler, IApiMetrics } from '../interfaces/IApiService';
import type { IHttpClient } from '../interfaces/IHttpClient';
import type { ICacheService } from '../interfaces/ICacheService';
import { HttpClient } from './HttpClient';
import { ErrorHandler } from './ErrorHandler';
import { ApiMetrics } from './ApiMetrics';

/**
 * Implementação do ApiService seguindo princípios SOLID
 * - SRP: Responsabilidade única de coordenar requisições HTTP
 * - OCP: Aberto para extensão através de interfaces
 * - LSP: Implementa IApiService de forma substituível
 * - ISP: Usa interfaces específicas e segregadas
 * - DIP: Depende de abstrações, não de implementações concretas
 */
export class ApiServiceV2 implements IApiService {
  private static instance: ApiServiceV2;

  constructor(
    private httpClient: IHttpClient,
    private cacheService: ICacheService,
    private errorHandler: IErrorHandler,
    private metrics: IApiMetrics,
    private baseURL: string = ''
  ) {}

  /**
   * Factory method para criar instância com dependências padrão
   */
  static create(baseURL: string, cacheService: ICacheService): ApiServiceV2 {
    if (!ApiServiceV2.instance) {
      const httpClient = new HttpClient(baseURL);
      const errorHandler = new ErrorHandler();
      const metrics = new ApiMetrics();

      // Adiciona interceptadores padrão
      httpClient.addRequestInterceptor({
        onRequest: async (config) => {
          // Adiciona token de autenticação se disponível
          const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
          if (token) {
            config.headers = {
              ...config.headers,
              'Authorization': `Bearer ${token}`,
            };
          }
          return config;
        },
        onRequestError: async (error) => {
          throw error;
        },
      });

      httpClient.addResponseInterceptor({
        onResponse: async (response) => {
          return response;
        },
        onResponseError: async (error) => {
          // Trata erros de autenticação
          if (error instanceof Error && 'status' in error && error.status === 401) {
            // Remove tokens inválidos
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            
            // Redireciona para login se necessário
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
          throw error;
        },
      });

      ApiServiceV2.instance = new ApiServiceV2(
        httpClient,
        cacheService,
        errorHandler,
        metrics,
        baseURL
      );
    }

    return ApiServiceV2.instance;
  }

  /**
   * Requisição GET com cache inteligente
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const cacheKey = `GET:${endpoint}`;
    
    // Registra métricas
    this.metrics.recordRequest(endpoint, 'GET');
    const startTime = Date.now();

    try {
      // Verifica cache se habilitado
      if (options.cache !== false) {
        const cachedData = await this.cacheService.get<T>(cacheKey);
        if (cachedData !== null) {
          this.metrics.recordResponse(endpoint, 'GET', Date.now() - startTime, 200);
          return cachedData;
        }
      }

      // Faz a requisição
      const response = await this.executeWithRetry<T>(
        () => this.httpClient.request<T>({
          url: endpoint,
          method: 'GET',
          headers: options.headers,
          timeout: options.timeout,
        }),
        endpoint,
        'GET',
        options.retries
      );

      // Salva no cache se habilitado
      if (options.cache !== false) {
        await this.cacheService.set(cacheKey, response.data, {
          ttl: options.ttl,
        });
      }

      this.metrics.recordResponse(endpoint, 'GET', Date.now() - startTime, response.status);
      return response.data;

    } catch (error) {
      this.metrics.recordError(endpoint, 'GET', error);
      this.errorHandler.handleError(error, `GET ${endpoint}`);
      throw error;
    }
  }

  /**
   * Requisição POST
   */
  async post<T>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<T> {
    this.metrics.recordRequest(endpoint, 'POST');
    const startTime = Date.now();

    try {
      const response = await this.executeWithRetry<T>(
        () => this.httpClient.request<T>({
          url: endpoint,
          method: 'POST',
          headers: options.headers,
          body: data,
          timeout: options.timeout,
        }),
        endpoint,
        'POST',
        options.retries
      );

      // Invalida caches relacionados
      await this.invalidateRelatedCaches(endpoint);

      this.metrics.recordResponse(endpoint, 'POST', Date.now() - startTime, response.status);
      return response.data;

    } catch (error) {
      this.metrics.recordError(endpoint, 'POST', error);
      this.errorHandler.handleError(error, `POST ${endpoint}`);
      throw error;
    }
  }

  /**
   * Requisição PATCH
   */
  async patch<T>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<T> {
    this.metrics.recordRequest(endpoint, 'PATCH');
    const startTime = Date.now();

    try {
      const response = await this.executeWithRetry<T>(
        () => this.httpClient.request<T>({
          url: endpoint,
          method: 'PATCH',
          headers: options.headers,
          body: data,
          timeout: options.timeout,
        }),
        endpoint,
        'PATCH',
        options.retries
      );

      // Invalida caches relacionados
      await this.invalidateRelatedCaches(endpoint);

      this.metrics.recordResponse(endpoint, 'PATCH', Date.now() - startTime, response.status);
      return response.data;

    } catch (error) {
      this.metrics.recordError(endpoint, 'PATCH', error);
      this.errorHandler.handleError(error, `PATCH ${endpoint}`);
      throw error;
    }
  }

  /**
   * Requisição DELETE
   */
  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    this.metrics.recordRequest(endpoint, 'DELETE');
    const startTime = Date.now();

    try {
      const response = await this.executeWithRetry<T>(
        () => this.httpClient.request<T>({
          url: endpoint,
          method: 'DELETE',
          headers: options.headers,
          timeout: options.timeout,
        }),
        endpoint,
        'DELETE',
        options.retries
      );

      // Invalida caches relacionados
      await this.invalidateRelatedCaches(endpoint);

      this.metrics.recordResponse(endpoint, 'DELETE', Date.now() - startTime, response.status);
      return response.data;

    } catch (error) {
      this.metrics.recordError(endpoint, 'DELETE', error);
      this.errorHandler.handleError(error, `DELETE ${endpoint}`);
      throw error;
    }
  }

  /**
   * Executa requisição com retry automático
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<{ data: T; status: number }>,
    endpoint: string,
    method: string,
    maxRetries: number = 3
  ): Promise<{ data: T; status: number }> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        // Se não é retentável ou é a última tentativa, lança o erro
        if (!this.errorHandler.isRetryableError(error) || attempt > maxRetries) {
          throw error;
        }

        // Aguarda antes da próxima tentativa
        const delay = this.errorHandler.getRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Invalida caches relacionados ao endpoint
   */
  private async invalidateRelatedCaches(endpoint: string): Promise<void> {
    // Estratégia simples: invalida caches que começam com o mesmo path base
    const basePath = endpoint.split('/').slice(0, 3).join('/'); // Ex: /api/users
    
    // Esta implementação dependeria de uma funcionalidade no CacheService
    // para listar e invalidar chaves por padrão
    // Por enquanto, implementação básica
    const commonCacheKeys = [
      `GET:${basePath}`,
      `GET:${endpoint}`,
    ];

    for (const key of commonCacheKeys) {
      await this.cacheService.delete(key);
    }
  }

  /**
   * Obtém métricas da API
   */
  getMetrics() {
    return this.metrics.getMetrics();
  }

  /**
   * Reseta métricas
   */
  resetMetrics(): void {
    this.metrics.reset();
  }
}