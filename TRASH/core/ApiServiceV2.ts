import type { IApiService } from '../interfaces/IApiService';
import { HttpClient } from './HttpClient';
import { ErrorHandler } from './ErrorHandler';
import { ApiMetrics } from './ApiMetrics';
import { supabase as supabaseClient } from '../../config/supabaseConfig';
import { logger } from '../../utils/logger';

export interface ApiServiceConfig {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class ApiServiceV2 implements IApiService {
  private httpClient: HttpClient;
  private metrics: ApiMetrics;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config: ApiServiceConfig = {}) {
    this.httpClient = new HttpClient({
      baseURL: config.baseURL || import.meta.env.VITE_API_URL || 'http://localhost:3000',
      timeout: config.timeout || 30000
    });
    this.metrics = ApiMetrics.getInstance();
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  async get<T>(url: string): Promise<T> {
    return this.executeWithMetrics('GET', url, () => 
      this.executeWithRetry(async () => this.httpClient.get<T>(url, await this.getAuthHeaders()))
    );
  }

  async post<T>(url: string, data?: any): Promise<T> {
    return this.executeWithMetrics('POST', url, () => 
      this.executeWithRetry(async () => this.httpClient.post<T>(url, data, await this.getAuthHeaders()))
    );
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    return this.executeWithMetrics('PATCH', url, () => 
      this.executeWithRetry(() => this.httpClient.patch<T>(url, data, this.getAuthHeaders()))
    );
  }

  async delete<T>(url: string): Promise<T> {
    return this.executeWithMetrics('DELETE', url, () => 
      this.executeWithRetry(() => this.httpClient.delete<T>(url, this.getAuthHeaders()))
    );
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session?.access_token) {
        return {
          'Authorization': `Bearer ${session.access_token}`
        };
      }
    } catch (error) {
      logger.warn('Failed to get auth token:', error);
    }
    return {};
  }

  private async executeWithMetrics<T>(
    method: string,
    url: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let status = 200;

    try {
      const result = await operation();
      return result;
    } catch (error) {
      const apiError = ErrorHandler.handle(error);
      status = apiError.status || 500;
      throw apiError;
    } finally {
      const duration = Date.now() - startTime;
      this.metrics.recordRequest(url, method, duration, status);
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const apiError = ErrorHandler.handle(error);

        // Don't retry on client errors (4xx) except 429
        if (!ErrorHandler.isRetryableError(apiError)) {
          throw apiError;
        }

        // Don't retry on the last attempt
        if (attempt === this.retryAttempts) {
          throw apiError;
        }

        // Wait before retrying
        await this.delay(this.retryDelay * attempt);
        logger.info(`Retrying request (attempt ${attempt + 1}/${this.retryAttempts})`);
      }
    }

    throw ErrorHandler.handle(lastError);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMetrics() {
    return this.metrics.getMetrics();
  }

  clearMetrics() {
    this.metrics.clearMetrics();
  }
}