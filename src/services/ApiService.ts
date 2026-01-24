import { logger } from '../utils/logger';

class ApiService {
  private static baseURL = '/api';

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Prevent double /api if endpoint already starts with it
    const url = endpoint.startsWith('http') 
        ? endpoint 
        : endpoint.startsWith('/api')
            ? endpoint
            : `${this.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    // Default headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }
        
        const error = new Error(errorData.message || `Request failed with status ${response.status}`);
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }

      // Check for 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      logger.apiError(`Request failed: ${options.method || 'GET'} ${url}`, error);
      throw error;
    }
  }

  static async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    let queryString = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      queryString = `?${searchParams.toString()}`;
    }
    
    return this.request<T>(`${url}${queryString}`, { method: 'GET' });
  }

  static async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async patch<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' });
  }

  /**
   * Loads critical data required for app initialization
   */
  static async preloadCriticalData(): Promise<void> {
    try {
      logger.apiInfo('Preloading critical data...');
      // Implement specific preloading logic here if needed
    } catch (error) {
      logger.apiWarn('Failed to preload data', error);
    }
  }

  /**
   * Fetches the list of services for the current barbershop
   * @deprecated Should be replaced by ServiceRepository
   */
  static async getServices(): Promise<any[]> {
    try {
      const barbershopSlug = localStorage.getItem('barbershopSlug');
      
      // If we are migrating to Supabase, we might want to use the Repository here
      // But for backward compatibility with existing ApiService calls in components:
      if (barbershopSlug) {
           return await this.get<any[]>(`/api/app/${barbershopSlug}/services`);
      }
      return [];
    } catch (error) {
      logger.apiError('Failed to get services', error);
      return [];
    }
  }
}

export default ApiService;
