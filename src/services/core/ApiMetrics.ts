import type { IApiMetrics, ApiMetricsData } from '../interfaces/IApiService';

/**
 * Implementação de métricas de API seguindo Single Responsibility Principle
 */
export class ApiMetrics implements IApiMetrics {
  private metrics: Map<string, EndpointMetrics> = new Map();
  private globalMetrics: GlobalMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalResponseTime: 0,
    cacheHits: 0,
  };

  /**
   * Registra uma nova requisição
   */
  recordRequest(endpoint: string, method: string): void {
    const key = this.getMetricKey(endpoint, method);
    const endpointMetrics = this.getOrCreateEndpointMetrics(key);
    
    endpointMetrics.totalRequests++;
    this.globalMetrics.totalRequests++;
  }

  /**
   * Registra uma resposta
   */
  recordResponse(endpoint: string, method: string, duration: number, status: number): void {
    const key = this.getMetricKey(endpoint, method);
    const endpointMetrics = this.getOrCreateEndpointMetrics(key);
    
    endpointMetrics.totalResponseTime += duration;
    this.globalMetrics.totalResponseTime += duration;

    if (status >= 200 && status < 300) {
      endpointMetrics.successfulRequests++;
      this.globalMetrics.successfulRequests++;
    } else {
      endpointMetrics.failedRequests++;
      this.globalMetrics.failedRequests++;
    }

    // Atualiza estatísticas de status
    const statusKey = Math.floor(status / 100) * 100; // 200, 300, 400, 500
    endpointMetrics.statusCodes.set(statusKey, (endpointMetrics.statusCodes.get(statusKey) || 0) + 1);
  }

  /**
   * Registra um erro
   */
  recordError(endpoint: string, method: string, error: unknown): void {
    const key = this.getMetricKey(endpoint, method);
    const endpointMetrics = this.getOrCreateEndpointMetrics(key);
    
    endpointMetrics.failedRequests++;
    endpointMetrics.errors.push({
      timestamp: Date.now(),
      error: this.serializeError(error),
    });

    this.globalMetrics.failedRequests++;

    // Limita o histórico de erros para evitar vazamento de memória
    if (endpointMetrics.errors.length > 100) {
      endpointMetrics.errors = endpointMetrics.errors.slice(-50);
    }
  }

  /**
   * Registra um cache hit
   */
  recordCacheHit(endpoint: string, method: string): void {
    const key = this.getMetricKey(endpoint, method);
    const endpointMetrics = this.getOrCreateEndpointMetrics(key);
    
    endpointMetrics.cacheHits++;
    this.globalMetrics.cacheHits++;
  }

  /**
   * Obtém métricas globais
   */
  getMetrics(): ApiMetricsData {
    const totalRequests = this.globalMetrics.totalRequests;
    
    return {
      totalRequests,
      successfulRequests: this.globalMetrics.successfulRequests,
      failedRequests: this.globalMetrics.failedRequests,
      averageResponseTime: totalRequests > 0 
        ? this.globalMetrics.totalResponseTime / totalRequests 
        : 0,
      cacheHitRate: totalRequests > 0 
        ? (this.globalMetrics.cacheHits / totalRequests) * 100 
        : 0,
    };
  }

  /**
   * Obtém métricas de um endpoint específico
   */
  getEndpointMetrics(endpoint: string, method: string): EndpointMetricsData | null {
    const key = this.getMetricKey(endpoint, method);
    const metrics = this.metrics.get(key);
    
    if (!metrics) {
      return null;
    }

    const totalRequests = metrics.totalRequests;
    
    return {
      endpoint,
      method,
      totalRequests,
      successfulRequests: metrics.successfulRequests,
      failedRequests: metrics.failedRequests,
      averageResponseTime: totalRequests > 0 
        ? metrics.totalResponseTime / totalRequests 
        : 0,
      cacheHitRate: totalRequests > 0 
        ? (metrics.cacheHits / totalRequests) * 100 
        : 0,
      statusCodes: Object.fromEntries(metrics.statusCodes),
      recentErrors: metrics.errors.slice(-10), // Últimos 10 erros
    };
  }

  /**
   * Obtém métricas de todos os endpoints
   */
  getAllEndpointMetrics(): EndpointMetricsData[] {
    return Array.from(this.metrics.entries()).map(([key, metrics]) => {
      const [endpoint, method] = key.split('::');
      return this.getEndpointMetrics(endpoint, method)!;
    });
  }

  /**
   * Reseta as métricas
   */
  reset(): void {
    this.metrics.clear();
    this.globalMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      cacheHits: 0,
    };
  }

  /**
   * Gera chave única para endpoint + método
   */
  private getMetricKey(endpoint: string, method: string): string {
    return `${endpoint}::${method}`;
  }

  /**
   * Obtém ou cria métricas para um endpoint
   */
  private getOrCreateEndpointMetrics(key: string): EndpointMetrics {
    let metrics = this.metrics.get(key);
    
    if (!metrics) {
      metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalResponseTime: 0,
        cacheHits: 0,
        statusCodes: new Map(),
        errors: [],
      };
      this.metrics.set(key, metrics);
    }
    
    return metrics;
  }

  /**
   * Serializa erro para armazenamento
   */
  private serializeError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }
    return String(error);
  }
}

interface EndpointMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalResponseTime: number;
  cacheHits: number;
  statusCodes: Map<number, number>;
  errors: Array<{
    timestamp: number;
    error: string;
  }>;
}

interface GlobalMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalResponseTime: number;
  cacheHits: number;
}

export interface EndpointMetricsData {
  endpoint: string;
  method: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  statusCodes: Record<number, number>;
  recentErrors: Array<{
    timestamp: number;
    error: string;
  }>;
}