/**
 * Basic monitoring service for launch and production monitoring
 */

export interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  userId?: string;
  barbershopId?: string;
  url?: string;
  userAgent?: string;
}

export interface PerformanceMetric {
  id: string;
  timestamp: Date;
  metric: string;
  value: number;
  barbershopId?: string;
  userId?: string;
}

export interface UserFeedback {
  id: string;
  timestamp: Date;
  userId?: string;
  barbershopId?: string;
  type: 'bug' | 'feature' | 'improvement' | 'general';
  rating: 1 | 2 | 3 | 4 | 5;
  message: string;
  email?: string;
  resolved: boolean;
}

class MonitoringService {
  private errorLogs: ErrorLog[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private userFeedbacks: UserFeedback[] = [];

  /**
   * Log an error for monitoring
   */
  logError(error: Error | string, context?: {
    userId?: string;
    barbershopId?: string;
    url?: string;
  }): void {
    const errorLog: ErrorLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level: 'error',
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      userId: context?.userId,
      barbershopId: context?.barbershopId,
      url: context?.url || window.location.href,
      userAgent: navigator.userAgent,
    };

    this.errorLogs.push(errorLog);
    
    // Keep only last 100 errors in memory
    if (this.errorLogs.length > 100) {
      this.errorLogs = this.errorLogs.slice(-100);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('MonitoringService - Error logged:', errorLog);
    }

    // In production, you would send this to your monitoring service
    // Example: send to Sentry, LogRocket, or custom endpoint
    this.sendToMonitoringService('error', errorLog);
  }

  /**
   * Log a warning for monitoring
   */
  logWarning(message: string, context?: {
    userId?: string;
    barbershopId?: string;
  }): void {
    const warningLog: ErrorLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level: 'warning',
      message,
      userId: context?.userId,
      barbershopId: context?.barbershopId,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.errorLogs.push(warningLog);
    
    if (import.meta.env.DEV) {
      console.warn('MonitoringService - Warning logged:', warningLog);
    }

    this.sendToMonitoringService('warning', warningLog);
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric: string, value: number, context?: {
    userId?: string;
    barbershopId?: string;
  }): void {
    const performanceMetric: PerformanceMetric = {
      id: Date.now().toString(),
      timestamp: new Date(),
      metric,
      value,
      userId: context?.userId,
      barbershopId: context?.barbershopId,
    };

    this.performanceMetrics.push(performanceMetric);
    
    // Keep only last 50 metrics in memory
    if (this.performanceMetrics.length > 50) {
      this.performanceMetrics = this.performanceMetrics.slice(-50);
    }

    if (import.meta.env.DEV) {
      console.log('MonitoringService - Performance metric:', performanceMetric);
    }

    this.sendToMonitoringService('performance', performanceMetric);
  }

  /**
   * Submit user feedback
   */
  async submitFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const userFeedback: UserFeedback = {
      ...feedback,
      id: Date.now().toString(),
      timestamp: new Date(),
      resolved: false,
    };

    this.userFeedbacks.push(userFeedback);

    if (import.meta.env.DEV) {
      console.log('MonitoringService - User feedback:', userFeedback);
    }

    // Send feedback to backend or monitoring service
    await this.sendToMonitoringService('feedback', userFeedback);
  }

  /**
   * Get error logs for admin dashboard
   */
  getErrorLogs(limit = 20): ErrorLog[] {
    return this.errorLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get performance metrics for admin dashboard
   */
  getPerformanceMetrics(limit = 20): PerformanceMetric[] {
    return this.performanceMetrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get user feedback for admin dashboard
   */
  getUserFeedbacks(limit = 20): UserFeedback[] {
    return this.userFeedbacks
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    errorCount: number;
    warningCount: number;
    lastError?: ErrorLog;
    averagePerformance: Record<string, number>;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentErrors = this.errorLogs.filter(log => 
      log.timestamp > oneHourAgo && log.level === 'error'
    );
    const recentWarnings = this.errorLogs.filter(log => 
      log.timestamp > oneHourAgo && log.level === 'warning'
    );

    // Calculate average performance metrics
    const recentMetrics = this.performanceMetrics.filter(metric => 
      metric.timestamp > oneHourAgo
    );
    
    const averagePerformance: Record<string, number> = {};
    const metricGroups = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.metric]) acc[metric.metric] = [];
      acc[metric.metric].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    Object.entries(metricGroups).forEach(([metric, values]) => {
      averagePerformance[metric] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (recentErrors.length > 10) {
      status = 'critical';
    } else if (recentErrors.length > 3 || recentWarnings.length > 10) {
      status = 'warning';
    }

    return {
      status,
      errorCount: recentErrors.length,
      warningCount: recentWarnings.length,
      lastError: recentErrors[0],
      averagePerformance,
    };
  }

  /**
   * Send data to monitoring service (placeholder for real implementation)
   */
  private async sendToMonitoringService(type: string, data: unknown): Promise<void> {
    try {
      // In production, implement actual monitoring service integration
      // Examples:
      // - Send to Sentry
      // - Send to custom analytics endpoint
      // - Send to LogRocket
      // - Send to DataDog
      
      if (import.meta.env.PROD) {
        // Example implementation:
        // await fetch('/api/monitoring', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ type, data, timestamp: new Date() })
        // });
        
        console.log(`[MONITORING] ${type}:`, data);
      }
    } catch (error) {
      // Don't let monitoring errors break the app
      console.error('Failed to send monitoring data:', error);
    }
  }

  /**
   * Initialize performance monitoring
   */
  initializePerformanceMonitoring(): void {
    // Monitor page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.logPerformance('page_load_time', loadTime);
    });

    // Monitor navigation timing
    if ('navigation' in performance) {
      const navigation = performance.navigation;
      this.logPerformance('navigation_type', navigation.type);
    }

    // Monitor resource timing
    if ('getEntriesByType' in performance) {
      setTimeout(() => {
        const resources = performance.getEntriesByType('resource');
        const slowResources = resources.filter(resource => resource.duration > 1000);
        
        if (slowResources.length > 0) {
          this.logWarning(`${slowResources.length} slow resources detected`);
        }
      }, 5000);
    }
  }

  /**
   * Initialize error monitoring
   */
  initializeErrorMonitoring(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError(event.error || event.message, {
        url: event.filename,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(`Unhandled promise rejection: ${event.reason}`);
    });
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();

// Initialize monitoring on import
monitoringService.initializeErrorMonitoring();
monitoringService.initializePerformanceMonitoring();