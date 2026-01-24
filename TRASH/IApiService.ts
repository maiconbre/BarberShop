/**
 * Interface principal para serviços de API seguindo Interface Segregation Principle
 */
export interface IApiService {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T>;
  post<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<T>;
  delete<T>(endpoint: string, options?: RequestOptions): Promise<T>;
}

/**
 * Interface para configurações de requisição
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  ttl?: number;
}

/**
 * Interface para tratamento de erros
 */
export interface IErrorHandler {
  handleError(error: unknown, context: string): void;
  isRetryableError(error: unknown): boolean;
  getRetryDelay(attempt: number): number;
}

/**
 * Interface para métricas de API
 */
export interface IApiMetrics {
  recordRequest(endpoint: string, method: string): void;
  recordResponse(endpoint: string, method: string, duration: number, status: number): void;
  recordError(endpoint: string, method: string, error: unknown): void;
  getMetrics(): ApiMetricsData;
}

export interface ApiMetricsData {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
}