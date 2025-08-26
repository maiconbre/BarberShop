import { logger } from '../../utils/logger';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class ErrorHandler {
  static handle(error: any): ApiError {
    logger.error('API Error:', error);

    // Handle fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: 'Network error. Please check your connection.',
        status: 0,
        code: 'NETWORK_ERROR'
      };
    }

    // Handle timeout errors
    if (error.name === 'AbortError') {
      return {
        message: 'Request timeout. Please try again.',
        status: 408,
        code: 'TIMEOUT_ERROR'
      };
    }

    // Handle HTTP errors
    if (error.message && error.message.includes('HTTP error!')) {
      const statusMatch = error.message.match(/status: (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 500;
      
      return {
        message: this.getHttpErrorMessage(status),
        status,
        code: `HTTP_${status}`
      };
    }

    // Handle generic errors
    return {
      message: error.message || 'An unexpected error occurred.',
      status: 500,
      code: 'UNKNOWN_ERROR',
      details: error
    };
  }

  private static getHttpErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Bad request. Please check your input.';
      case 401:
        return 'Unauthorized. Please log in again.';
      case 403:
        return 'Forbidden. You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 409:
        return 'Conflict. The resource already exists or there is a conflict.';
      case 422:
        return 'Validation error. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Internal server error. Please try again later.';
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return `HTTP error ${status}. Please try again.`;
    }
  }

  static isRetryableError(error: ApiError): boolean {
    if (!error.status) return false;
    
    // Retry on server errors and rate limiting
    return error.status >= 500 || error.status === 429;
  }

  static shouldRefreshToken(error: ApiError): boolean {
    return error.status === 401;
  }
}