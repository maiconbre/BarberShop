import type { IErrorHandler } from '../interfaces/IApiService';
import { logger } from '@/utils/logger';

/**
 * Implementação do tratamento de erros seguindo Single Responsibility Principle
 */
export class ErrorHandler implements IErrorHandler {
  private readonly maxRetries: number;
  private readonly baseDelay: number;
  private readonly maxDelay: number;

  constructor(
    maxRetries: number = 3,
    baseDelay: number = 1000,
    maxDelay: number = 30000
  ) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  /**
   * Trata erros de forma centralizada
   */
  handleError(error: unknown, context: string): void {
    const errorInfo = this.extractErrorInfo(error);
    
    logger.apiError(`[${context}] ${errorInfo.message}`, {
      error: errorInfo,
      context,
      timestamp: new Date().toISOString(),
    });

    // Aqui poderia integrar com serviços de monitoramento como Sentry
    this.reportError(error, context);
  }

  /**
   * Verifica se o erro pode ser retentado
   */
  isRetryableError(error: unknown): boolean {
    const errorInfo = this.extractErrorInfo(error);
    
    // Erros de rede são retentáveis
    if (errorInfo.type === 'network') {
      return true;
    }

    // Erros 5xx são retentáveis
    if (errorInfo.status && errorInfo.status >= 500) {
      return true;
    }

    // Rate limiting é retentável
    if (errorInfo.status === 429) {
      return true;
    }

    // Timeout é retentável
    if (errorInfo.type === 'timeout') {
      return true;
    }

    return false;
  }

  /**
   * Calcula o delay para retry com backoff exponencial
   */
  getRetryDelay(attempt: number): number {
    const delay = this.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * delay; // Adiciona jitter para evitar thundering herd
    
    return Math.min(delay + jitter, this.maxDelay);
  }

  /**
   * Extrai informações do erro
   */
  private extractErrorInfo(error: unknown): ErrorInfo {
    if (error instanceof Error) {
      // Erro de rede
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          message: 'Erro de conexão de rede',
          type: 'network',
          originalError: error,
        };
      }

      // Timeout
      if (error.name === 'AbortError') {
        return {
          message: 'Timeout na requisição',
          type: 'timeout',
          originalError: error,
        };
      }

      // HTTP Error
      if ('status' in error && typeof error.status === 'number') {
        return {
          message: error.message,
          type: 'http',
          status: error.status,
          originalError: error,
        };
      }

      return {
        message: error.message,
        type: 'unknown',
        originalError: error,
      };
    }

    return {
      message: String(error),
      type: 'unknown',
      originalError: error,
    };
  }

  /**
   * Reporta erro para serviços de monitoramento
   */
  private reportError(error: unknown, context: string): void {
    // Implementação futura para integração com Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Aqui integraria com serviços de monitoramento
      console.error('Error reported to monitoring service:', { error, context });
    }
  }
}

interface ErrorInfo {
  message: string;
  type: 'network' | 'timeout' | 'http' | 'unknown';
  status?: number;
  originalError: unknown;
}