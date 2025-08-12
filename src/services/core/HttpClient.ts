import type { 
  IHttpClient, 
  HttpRequestConfig, 
  HttpResponse, 
  IRequestInterceptor, 
  IResponseInterceptor 
} from '../interfaces/IHttpClient';

/**
 * Implementação do cliente HTTP seguindo Single Responsibility Principle
 */
export class HttpClient implements IHttpClient {
  private requestInterceptors: IRequestInterceptor[] = [];
  private responseInterceptors: IResponseInterceptor[] = [];
  private baseURL: string;
  private defaultTimeout: number;

  constructor(baseURL: string = '', defaultTimeout: number = 10000) {
    this.baseURL = baseURL;
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Adiciona interceptador de requisição
   */
  addRequestInterceptor(interceptor: IRequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Adiciona interceptador de resposta
   */
  addResponseInterceptor(interceptor: IResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Executa uma requisição HTTP
   */
  async request<T>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    try {
      // Aplica interceptadores de requisição
      let processedConfig = { ...config };
      for (const interceptor of this.requestInterceptors) {
        processedConfig = await interceptor.onRequest(processedConfig);
      }

      // Prepara a requisição
      const url = this.buildUrl(processedConfig.url);
      const requestInit = this.buildRequestInit(processedConfig);

      // Executa a requisição com timeout
      const response = await this.fetchWithTimeout(url, requestInit, processedConfig.timeout);
      
      // Processa a resposta
      const httpResponse = await this.processResponse<T>(response);

      // Aplica interceptadores de resposta
      let processedResponse = httpResponse;
      for (const interceptor of this.responseInterceptors) {
        processedResponse = await interceptor.onResponse(processedResponse);
      }

      return processedResponse;
    } catch (error) {
      // Aplica interceptadores de erro de requisição
      for (const interceptor of this.requestInterceptors) {
        await interceptor.onRequestError(error);
      }

      // Aplica interceptadores de erro de resposta
      for (const interceptor of this.responseInterceptors) {
        await interceptor.onResponseError(error);
      }

      throw error;
    }
  }

  /**
   * Constrói a URL completa
   */
  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    const baseUrl = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    return `${baseUrl}${path}`;
  }

  /**
   * Constrói as opções da requisição
   */
  private buildRequestInit(config: HttpRequestConfig): RequestInit {
    const init: RequestInit = {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers,
      },
      mode: 'cors',
    };

    if (config.body && config.method !== 'GET') {
      init.body = typeof config.body === 'string' 
        ? config.body 
        : JSON.stringify(config.body);
    }

    return init;
  }

  /**
   * Executa fetch com timeout
   */
  private async fetchWithTimeout(
    url: string, 
    init: RequestInit, 
    timeout?: number
  ): Promise<Response> {
    const timeoutMs = timeout || this.defaultTimeout;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Processa a resposta HTTP
   */
  private async processResponse<T>(response: Response): Promise<HttpResponse<T>> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    if (!response.ok) {
      throw new HttpError(
        `HTTP Error: ${response.status} ${response.statusText}`,
        response.status,
        response.statusText
      );
    }

    let data: T;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text() as unknown as T;
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers,
    };
  }
}

/**
 * Classe de erro HTTP customizada
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}