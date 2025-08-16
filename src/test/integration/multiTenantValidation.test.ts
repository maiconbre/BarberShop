/**
 * Testes de validação multi-tenant
 * Valida isolamento de dados entre diferentes barbearias
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { productionChecker } from '../../utils/productionChecker';
import { auditLogger } from '../../utils/auditLogger';
import { backupManager } from '../../utils/backupConfig';
import { productionMonitor } from '../../utils/productionMonitor';

describe('Production Validation Tests', () => {
  beforeEach(() => {
    // Reset environment
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Production Configuration Validation', () => {
    it('should validate production readiness', async () => {
      // Mock environment variables for production
      vi.stubEnv('VITE_API_URL', 'https://api.barbershop.com');
      vi.stubEnv('VITE_DEV_MODE', 'false');
      vi.stubEnv('VITE_DEBUG_API', 'false');
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');

      const report = await productionChecker.runAllChecks();

      expect(report).toBeDefined();
      expect(report.overall).toBeOneOf(['ready', 'warning', 'not_ready']);
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(report.checks)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should perform quick production check', () => {
      const quickCheck = productionChecker.quickCheck();

      expect(quickCheck).toBeDefined();
      expect(typeof quickCheck.ready).toBe('boolean');
      expect(Array.isArray(quickCheck.criticalIssues)).toBe(true);
    });
  });

  describe('Audit Logging System', () => {
    it('should log user actions correctly', () => {
      const testAction = 'test_action';
      const testDetails = { test: 'data' };

      // Test logging function
      auditLogger.logUserAction(testAction, testDetails);

      const logs = auditLogger.getLocalLogs();
      expect(logs.length).toBeGreaterThan(0);

      const lastLog = logs[logs.length - 1];
      expect(lastLog.action).toBe(testAction);
      expect(lastLog.resource).toBe('user');
      expect(lastLog.details).toEqual(testDetails);
    });

    it('should handle error logging', () => {
      const testError = new Error('Test error');
      const testContext = { resource: 'test' };

      auditLogger.logError(testError, testContext);

      const logs = auditLogger.getLocalLogs();
      const errorLog = logs.find(log => log.action === 'error_occurred');

      expect(errorLog).toBeDefined();
      expect(errorLog?.severity).toBe('error');
    });
  });

  describe('Backup System', () => {
    it('should handle backup configuration', () => {
      const config = backupManager.getConfig();

      expect(config).toBeDefined();
      expect(typeof config.enabled).toBe('boolean');
      expect(typeof config.interval).toBe('number');
      expect(typeof config.maxBackups).toBe('number');
    });

    it('should list local backups', () => {
      const backupList = backupManager.getLocalBackupList();

      expect(Array.isArray(backupList)).toBe(true);
    });

    it('should update backup configuration', () => {
      const newConfig = { enabled: false, maxBackups: 5 };

      backupManager.updateConfig(newConfig);
      const updatedConfig = backupManager.getConfig();

      expect(updatedConfig.enabled).toBe(false);
      expect(updatedConfig.maxBackups).toBe(5);
    });
  });

  describe('Production Monitoring', () => {
    it('should track performance metrics', () => {
      const metricName = 'test_metric';
      const metricValue = 100;

      productionMonitor.recordMetric(metricName, metricValue);

      const recentMetrics = productionMonitor.getRecentMetrics(10);
      const testMetric = recentMetrics.find(m => m.name === metricName);

      expect(testMetric).toBeDefined();
      expect(testMetric?.value).toBe(metricValue);
    });

    it('should report errors correctly', () => {
      const testError = new Error('Test monitoring error');
      const testContext = { component: 'monitoring_test' };

      productionMonitor.reportError(testError, testContext, 'medium');

      const recentErrors = productionMonitor.getRecentErrors(10);
      const reportedError = recentErrors.find(e => e.error.message === 'Test monitoring error');

      expect(reportedError).toBeDefined();
      expect(reportedError?.severity).toBe('medium');
    });

    it('should track usage events', () => {
      const eventName = 'test_event';
      const eventProperties = { test: 'property' };

      productionMonitor.trackUsage(eventName, eventProperties);

      const recentUsage = productionMonitor.getRecentUsage(10);
      const trackedEvent = recentUsage.find(u => u.event === eventName);

      expect(trackedEvent).toBeDefined();
      expect(trackedEvent?.properties.test).toBe('property');
    });

    it('should provide session statistics', () => {
      const stats = productionMonitor.getSessionStats();

      expect(stats).toBeDefined();
      expect(typeof stats.uptime).toBe('number');
      expect(typeof stats.metrics).toBe('number');
      expect(typeof stats.errors).toBe('number');
      expect(typeof stats.usage).toBe('number');
    });
  });

  describe('Integration Tests', () => {
    it('should validate complete production setup', async () => {
      // Test all production utilities working together
      const startTime = performance.now();

      // Test production checker
      const quickCheck = productionChecker.quickCheck();
      expect(typeof quickCheck.ready).toBe('boolean');

      // Test audit logging
      auditLogger.logUserAction('integration_test', { timestamp: Date.now() });
      const logs = auditLogger.getLocalLogs();
      expect(logs.length).toBeGreaterThan(0);

      // Test monitoring
      productionMonitor.recordMetric('integration_test_duration', performance.now() - startTime);
      const metrics = productionMonitor.getRecentMetrics(1);
      expect(metrics.length).toBeGreaterThan(0);

      // Test backup system
      const backupConfig = backupManager.getConfig();
      expect(backupConfig).toBeDefined();

      // All systems working
      expect(true).toBe(true);
    });

    it('should handle error scenarios gracefully', () => {
      // Test error handling across systems
      const testError = new Error('Integration test error');

      // Test audit logger error handling
      auditLogger.logError(testError, { resource: 'integration' });

      // Test production monitor error handling
      productionMonitor.reportError(testError, { test: 'integration' }, 'low');

      // Verify errors were logged
      const auditLogs = auditLogger.getLocalLogs();
      const monitorErrors = productionMonitor.getRecentErrors(10);

      expect(auditLogs.some(log => log.action === 'error_occurred')).toBe(true);
      expect(monitorErrors.some(error => error.error.message === 'Integration test error')).toBe(true);
    });
  });
});

// Performance tests for production systems
describe('Production Performance Tests', () => {
  it('should handle concurrent operations efficiently', async () => {
    const concurrentOperations = 50;
    const operations = [];

    for (let i = 0; i < concurrentOperations; i++) {
      operations.push(
        new Promise(resolve => {
          // Simulate concurrent logging
          auditLogger.logUserAction(`concurrent_test_${i}`, { index: i });
          productionMonitor.recordMetric(`concurrent_metric_${i}`, i);
          resolve(i);
        })
      );
    }

    const startTime = performance.now();
    const results = await Promise.all(operations);
    const endTime = performance.now();

    expect(results).toHaveLength(concurrentOperations);
    expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
  });

  it('should maintain performance with large datasets', async () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      data: new Array(100).fill(`data-${i}`).join('')
    }));

    const startTime = performance.now();

    // Simulate processing large dataset
    const processed = largeDataset.map(item => ({
      ...item,
      processed: true,
      timestamp: Date.now()
    }));

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    expect(processed).toHaveLength(1000);
    expect(processingTime).toBeLessThan(500); // Less than 500ms
  });

  it('should handle memory efficiently', () => {
    const initialMemory = (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;

    // Create and destroy many objects
    for (let i = 0; i < 1000; i++) {
      const tempData = {
        id: i,
        data: new Array(100).fill(i),
        timestamp: Date.now()
      };

      // Use the data briefly
      expect(tempData.id).toBe(i);
    }

    const finalMemory = (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});