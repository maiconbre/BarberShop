/**
 * Interface para cliente HTTP seguindo Single Responsibility Principle
 */
export interface IHttpClient {
  request<T>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
}

export interface HttpRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * Interface para interceptadores de requisição
 */
export interface IRequestInterceptor {
  onRequest(config: HttpRequestConfig): HttpRequestConfig | Promise<HttpRequestConfig>;
  onRequestError(error: unknown): Promise<never>;
}

/**
 * Interface para interceptadores de resposta
 */
export interface IResponseInterceptor {
  onResponse<T>(response: HttpResponse<T>): HttpResponse<T> | Promise<HttpResponse<T>>;
  onResponseError(error: unknown): Promise<never>;
}