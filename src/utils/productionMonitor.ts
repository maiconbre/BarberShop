/**
 * Sistema de monitoramento para produção
 * Coleta métricas de performance, erros e uso da aplicação
 */

import { auditLogger } from './auditLogger';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: {
    url: string;
    userAgent: string;
    userId?: string;
    barbershopId?: string;
    component?: string;
    action?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface UsageMetric {
  event: string;
  timestamp: string;
  userId?: string;
  barbershopId?: string;
  properties: Record<string, unknown>;
}

class ProductionMonitor {
  private static instance: ProductionMonitor;
  private isEnabled: boolean;
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorReport[] = [];
  private usage: UsageMetric[] = [];
  private startTime: number;

  private constructor() {
    this.isEnabled = true; // Always enabled for testing and development
    this.startTime = Date.now();
    
    if (this.isEnabled) {
      this.setupErrorHandling();
      this.setupPerformanceMonitoring();
      this.setupUsageTracking();
    }
  }

  public static getInstance(): ProductionMonitor {
    if (!ProductionMonitor.instance) {
      ProductionMonitor.instance = new ProductionMonitor();
    }
    return ProductionMonitor.instance;
  }

  /**
   * Configurar captura global de erros
   */
  private setupErrorHandling(): void {
    // Capturar erros JavaScript não tratados
    window.addEventListener('error', (event) => {
      this.reportError(event.error || new Error(event.message), {
        component: 'global',
        action: 'unhandled_error',
        url: event.filename,
        line: event.lineno,
        column: event.colno
      }, 'high');
    });

    // Capturar promises rejeitadas não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          component: 'global',
          action: 'unhandled_promise_rejection'
        },
        'high'
      );
    });
  }

  /**
   * Configurar monitoramento de performance
   */
  private setupPerformanceMonitoring(): void {
    // Monitorar carregamento da página
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.collectPageLoadMetrics();
      }, 0);
    });

    // Monitorar mudanças de rota (para SPAs)
    let currentPath = window.location.pathname;
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        this.trackUsage('page_view', { path: currentPath });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Configurar rastreamento de uso
   */
  private setupUsageTracking(): void {
    // Rastrear cliques em elementos importantes
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      // Rastrear cliques em botões
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');
        const buttonText = button?.textContent?.trim() || 'unknown';
        
        this.trackUsage('button_click', {
          button_text: buttonText,
          component: button?.getAttribute('data-component') || 'unknown'
        });
      }

      // Rastrear cliques em links
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.tagName === 'A' ? target : target.closest('a');
        const href = (link as HTMLAnchorElement)?.href || 'unknown';
        
        this.trackUsage('link_click', {
          href,
          text: link?.textContent?.trim() || 'unknown'
        });
      }
    });

    // Rastrear tempo na página
    let pageStartTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - pageStartTime;
      this.trackUsage('page_time', {
        path: window.location.pathname,
        time_seconds: Math.round(timeOnPage / 1000)
      });
    });
  }

  /**
   * Coletar métricas de carregamento da página
   */
  private collectPageLoadMetrics(): void {
    if (!('performance' in window)) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    // Métricas de carregamento
    this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
    this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
    this.recordMetric('first_paint', this.getFirstPaint());
    this.recordMetric('first_contentful_paint', this.getFirstContentfulPaint());

    // Métricas de rede
    this.recordMetric('dns_lookup_time', navigation.domainLookupEnd - navigation.domainLookupStart);
    this.recordMetric('tcp_connect_time', navigation.connectEnd - navigation.connectStart);
    this.recordMetric('request_time', navigation.responseEnd - navigation.requestStart);

    // Métricas de recursos
    const resources = performance.getEntriesByType('resource');
    const totalResourceSize = resources.reduce((total, resource) => {
      return total + ((resource as PerformanceResourceTiming).transferSize || 0);
    }, 0);
    
    this.recordMetric('total_resource_size', totalResourceSize);
    this.recordMetric('resource_count', resources.length);
  }

  /**
   * Obter First Paint
   */
  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  /**
   * Obter First Contentful Paint
   */
  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
  }

  /**
   * Registrar métrica de performance
   */
  public recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date().toISOString(),
      tags
    };

    this.metrics.push(metric);

    // Log em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`[METRIC] ${name}: ${value}`, tags);
    }

    // Manter apenas as últimas 1000 métricas
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  /**
   * Reportar erro
   */
  public reportError(
    error: Error, 
    context: Record<string, unknown> = {}, 
    severity: ErrorReport['severity'] = 'medium'
  ): void {
    const errorReport: ErrorReport = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.getCurrentUserId(),
        barbershopId: this.getCurrentBarbershopId(),
        ...context
      },
      severity
    };

    this.errors.push(errorReport);

    // Log no sistema de auditoria
    auditLogger.logError(error, context);

    // Log crítico: enviar imediatamente
    if (severity === 'critical') {
      this.sendErrorReport(errorReport);
    }

    // Manter apenas os últimos 100 erros
    if (this.errors.length > 100) {
      this.errors.shift();
    }
  }

  /**
   * Rastrear uso/evento
   */
  public trackUsage(event: string, properties: Record<string, unknown> = {}): void {
    const usageMetric: UsageMetric = {
      event,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      barbershopId: this.getCurrentBarbershopId(),
      properties: {
        ...properties,
        url: window.location.href,
        referrer: document.referrer
      }
    };

    this.usage.push(usageMetric);

    // Log em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`[USAGE] ${event}:`, properties);
    }

    // Manter apenas os últimos 500 eventos
    if (this.usage.length > 500) {
      this.usage.shift();
    }
  }

  /**
   * Obter estatísticas da sessão atual
   */
  public getSessionStats(): {
    uptime: number;
    metrics: number;
    errors: number;
    usage: number;
    memoryUsage?: number;
  } {
    return {
      uptime: Date.now() - this.startTime,
      metrics: this.metrics.length,
      errors: this.errors.length,
      usage: this.usage.length,
      memoryUsage: (performance as any).memory?.usedJSHeapSize
    };
  }

  /**
   * Obter métricas recentes
   */
  public getRecentMetrics(limit = 50): PerformanceMetric[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Obter erros recentes
   */
  public getRecentErrors(limit = 20): ErrorReport[] {
    return this.errors.slice(-limit);
  }

  /**
   * Obter eventos de uso recentes
   */
  public getRecentUsage(limit = 100): UsageMetric[] {
    return this.usage.slice(-limit);
  }

  /**
   * Enviar relatório de erro para o servidor
   */
  private async sendErrorReport(errorReport: ErrorReport): Promise<void> {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/monitoring/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify(errorReport)
      });
    } catch (error) {
      console.warn('Failed to send error report:', error);
    }
  }

  /**
   * Obter ID do usuário atual
   */
  private getCurrentUserId(): string | undefined {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) return undefined;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch {
      return undefined;
    }
  }

  /**
   * Obter ID da barbearia atual
   */
  private getCurrentBarbershopId(): string | undefined {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) return undefined;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.barbershopId;
    } catch {
      return undefined;
    }
  }

  /**
   * Limpar dados coletados
   */
  public clearData(): void {
    this.metrics = [];
    this.errors = [];
    this.usage = [];
  }
}

// Instância singleton
export const productionMonitor = ProductionMonitor.getInstance();

// Funções de conveniência
export const recordMetric = (name: string, value: number, tags?: Record<string, string>) =>
  productionMonitor.recordMetric(name, value, tags);

export const reportError = (error: Error, context?: Record<string, unknown>, severity?: ErrorReport['severity']) =>
  productionMonitor.reportError(error, context, severity);

export const trackUsage = (event: string, properties?: Record<string, unknown>) =>
  productionMonitor.trackUsage(event, properties);

// Tipos para uso externo
export type { PerformanceMetric, ErrorReport, UsageMetric };