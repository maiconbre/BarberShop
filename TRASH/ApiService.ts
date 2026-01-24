import { supabase as supabaseClient } from '../config/supabaseConfig';
import { logger } from '../utils/logger';

/**
 * Legacy ApiService for backward compatibility
 * This is a simplified version that delegates to Supabase client
 */
class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  }

  async get<T>(url: string): Promise<T> {
    try {
      logger.info(`API GET: ${url}`);
      
      // For Supabase operations, use the supabase client directly
      if (url.includes('/api/')) {
        const response = await fetch(`${this.baseURL}${url}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabaseClient.auth.getSession()).data.session?.access_token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      }
      
      throw new Error('Invalid API endpoint');
    } catch (error) {
      logger.error('API GET error:', 'ApiService', error);
      throw error;
    }
  }

  async post<T>(url: string, data?: any): Promise<T> {
    try {
      logger.info(`API POST: ${url}`);
      
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabaseClient.auth.getSession()).data.session?.access_token}`
        },
        body: data ? JSON.stringify(data) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('API POST error:', 'ApiService', error);
      throw error;
    }
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    try {
      logger.info(`API PATCH: ${url}`);
      
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabaseClient.auth.getSession()).data.session?.access_token}`
        },
        body: data ? JSON.stringify(data) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      logger.error('API PATCH error:', 'ApiService', error);
      throw error;
    }
  }

  async delete<T>(url: string): Promise<T> {
    try {
      logger.info(`API DELETE: ${url}`);
      
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabaseClient.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Tenta parsear JSON, se falhar retorna objeto vazio como T
      try {
        return await response.json();
      } catch {
        return {} as T;
      }
    } catch (error) {
      logger.error('API DELETE error:', 'ApiService', error);
      throw error;
    }
  }

  // Legacy methods for backward compatibility
  async preloadCriticalData(): Promise<void> {
    logger.info('Preloading critical data...');
    // Implementation can be added as needed
  }

  async getAppointments(): Promise<any[]> {
    return this.get('/api/appointments');
  }
}

const apiService = new ApiService();
export default apiService;
export { ApiService };