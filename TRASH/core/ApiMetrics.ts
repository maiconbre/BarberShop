import { logger } from '../../utils/logger';

export interface RequestMetrics {
  url: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
}

export interface ApiMetricsData {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  recentRequests: RequestMetrics[];
}

export class ApiMetrics {
  private static instance: ApiMetrics;
  private metrics: RequestMetrics[] = [];
  private maxStoredMetrics = 100;

  static getInstance(): ApiMetrics {
    if (!ApiMetrics.instance) {
      ApiMetrics.instance = new ApiMetrics();
    }
    return ApiMetrics.instance;
  }

  recordRequest(url: string, method: string, duration: number, status: number): void {
    const metric: RequestMetrics = {
      url,
      method,
      duration,
      status,
      timestamp: Date.now()
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics = this.metrics.slice(-this.maxStoredMetrics);
    }

    logger.info(`API Metrics: ${method} ${url} - ${duration}ms - ${status}`);
  }

  getMetrics(): ApiMetricsData {
    const totalRequests = this.metrics.length;
    const successfulRequests = this.metrics.filter(m => m.status >= 200 && m.status < 300).length;
    const failedRequests = totalRequests - successfulRequests;
    const averageResponseTime = totalRequests > 0 
      ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests 
      : 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      recentRequests: [...this.metrics]
    };
  }

  getMetricsForUrl(url: string): RequestMetrics[] {
    return this.metrics.filter(m => m.url.includes(url));
  }

  getMetricsForTimeRange(startTime: number, endTime: number): RequestMetrics[] {
    return this.metrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
  }

  clearMetrics(): void {
    this.metrics = [];
    logger.info('API metrics cleared');
  }

  getSuccessRate(): number {
    if (this.metrics.length === 0) return 0;
    const successfulRequests = this.metrics.filter(m => m.status >= 200 && m.status < 300).length;
    return (successfulRequests / this.metrics.length) * 100;
  }

  getAverageResponseTimeForUrl(url: string): number {
    const urlMetrics = this.getMetricsForUrl(url);
    if (urlMetrics.length === 0) return 0;
    return urlMetrics.reduce((sum, m) => sum + m.duration, 0) / urlMetrics.length;
  }
}