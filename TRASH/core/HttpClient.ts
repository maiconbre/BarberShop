import type { IHttpClient, HttpRequestConfig, HttpResponse } from '../interfaces/IHttpClient';
import { logger } from '../../utils/logger';

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class HttpClient implements IHttpClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: HttpClientConfig = {}) {
    this.baseURL = config.baseURL || '';
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers
    };
  }

  async request<T>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    const fullUrl = this.baseURL + config.url;
    const requestHeaders = { ...this.defaultHeaders, ...config.headers };
    const timeout = config.timeout || this.timeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      logger.info(`HTTP ${config.method}: ${fullUrl}`);

      const response = await fetch(fullUrl, {
        method: config.method,
        headers: requestHeaders,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = response.ok ? await response.json() : null;
      
      const result: HttpResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      };

      if (!response.ok) {
        logger.error(`HTTP ${config.method} error: ${fullUrl} - ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      logger.info(`HTTP ${config.method} success: ${fullUrl}`);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      logger.error(`HTTP ${config.method} error: ${fullUrl}`, error);
      throw error;
    }
  }

  // Convenience methods for backward compatibility
  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await this.request<T>({
      url,
      method: 'GET',
      headers
    });
    return response.data;
  }

  async post<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    const response = await this.request<T>({
      url,
      method: 'POST',
      body: data,
      headers
    });
    return response.data;
  }

  async patch<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    const response = await this.request<T>({
      url,
      method: 'PATCH',
      body: data,
      headers
    });
    return response.data;
  }

  async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await this.request<T>({
      url,
      method: 'DELETE',
      headers
    });
    return response.data;
  }
}