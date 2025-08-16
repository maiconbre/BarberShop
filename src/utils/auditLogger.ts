/**
 * Sistema de Logs de Auditoria para Produção
 * 
 * Implementa logging estruturado para rastreamento de ações críticas
 * do sistema multi-tenant em produção.
 */

export interface AuditLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  event: string;
  tenantId?: string;
  tenantSlug?: string;
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  details?: Record<string, any>; // Add details property for test compatibility
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  severity?: string; // Add severity property for compatibility
}

export interface SecurityEvent {
  type: 'auth_failure' | 'unauthorized_access' | 'data_breach_attempt' | 'rate_limit_exceeded' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
}

class AuditLogger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  /**
   * Log de ações de usuário críticas
   */
  logUserAction(action: string, details: Record<string, any> | Partial<AuditLogEntry> = {}): void {
    // If details is a plain object (not an AuditLogEntry), treat it as details
    const isPlainDetails = !('timestamp' in details || 'level' in details || 'event' in details);
    
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'user_action',
      action,
      resource: 'user', // Set default resource for user actions
      details: isPlainDetails ? details as Record<string, any> : (details as Partial<AuditLogEntry>).details,
      ip: this.getClientIP(),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
      ...(isPlainDetails ? {} : details as Partial<AuditLogEntry>)
    };

    this.writeLog(entry);
  }

  /**
   * Log de eventos de segurança
   */
  logSecurityEvent(event: SecurityEvent, details: Partial<AuditLogEntry> = {}): void {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level: this.mapSeverityToLevel(event.severity),
      event: 'security_event',
      action: event.type,
      metadata: {
        severity: event.severity,
        ...event.details
      },
      ip: this.getClientIP(),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
      ...details
    };

    this.writeLog(entry);

    // Em produção, eventos críticos devem ser reportados imediatamente
    if (this.isProduction && event.severity === 'critical') {
      this.reportCriticalEvent(entry);
    }
  }

  /**
   * Log de operações multi-tenant
   */
  logTenantOperation(operation: string, tenantSlug: string, details: Partial<AuditLogEntry> = {}): void {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'tenant_operation',
      action: operation,
      tenantSlug,
      ip: this.getClientIP(),
      sessionId: this.getSessionId(),
      ...details
    };

    this.writeLog(entry);
  }

  /**
   * Log de erros de aplicação
   */
  logError(error: Error, context: Partial<AuditLogEntry> = {}): void {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      event: 'application_error',
      action: 'error_occurred',
      severity: 'error', // Add severity property for tests
      metadata: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      ip: this.getClientIP(),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
      ...context
    };

    this.writeLog(entry);
  }

  /**
   * Log de performance crítica
   */
  logPerformance(metric: string, value: number, threshold: number, details: Partial<AuditLogEntry> = {}): void {
    const isSlowPerformance = value > threshold;
    
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level: isSlowPerformance ? 'warn' : 'info',
      event: 'performance_metric',
      action: metric,
      metadata: {
        value,
        threshold,
        exceeded: isSlowPerformance
      },
      sessionId: this.getSessionId(),
      ...details
    };

    this.writeLog(entry);
  }

  /**
   * Log de mudanças de dados críticos
   */
  logDataChange(operation: 'create' | 'update' | 'delete', resource: string, resourceId: string, details: Partial<AuditLogEntry> = {}): void {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'data_change',
      action: `${resource}_${operation}`,
      resource,
      resourceId,
      ip: this.getClientIP(),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
      ...details
    };

    this.writeLog(entry);
  }

  /**
   * Escreve o log no destino apropriado
   */
  private writeLog(entry: AuditLogEntry): void {
    if (this.isDevelopment) {
      // Em desenvolvimento, usar console com formatação
      this.logToConsole(entry);
    }

    if (this.isProduction) {
      // Em produção, enviar para serviço de logging
      this.logToService(entry);
    }

    // Sempre armazenar localmente para backup
    this.logToLocalStorage(entry);
  }

  /**
   * Log formatado para console (desenvolvimento)
   */
  private logToConsole(entry: AuditLogEntry): void {
    const color = this.getLevelColor(entry.level);
    const prefix = `🔍 [AUDIT:${entry.level.toUpperCase()}]`;
    
    console.group(`%c${prefix} ${entry.event}`, `color: ${color}; font-weight: bold;`);
    console.log('Timestamp:', entry.timestamp);
    console.log('Action:', entry.action);
    
    if (entry.tenantSlug) console.log('Tenant:', entry.tenantSlug);
    if (entry.userId) console.log('User:', entry.userId);
    if (entry.resource) console.log('Resource:', `${entry.resource}:${entry.resourceId}`);
    if (entry.metadata) console.log('Metadata:', entry.metadata);
    if (entry.ip) console.log('IP:', entry.ip);
    
    console.groupEnd();
  }

  /**
   * Envio para serviço de logging em produção
   */
  private async logToService(entry: AuditLogEntry): Promise<void> {
    try {
      // Em produção real, enviar para serviço como Datadog, New Relic, etc.
      // Por enquanto, simular o envio
      
      const logEndpoint = import.meta.env.VITE_LOG_ENDPOINT;
      if (!logEndpoint) return;

      await fetch(logEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_LOG_API_KEY}`
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      // Falha no logging não deve quebrar a aplicação
      console.error('Failed to send audit log:', error);
    }
  }

  /**
   * Armazenamento local para backup
   */
  private logToLocalStorage(entry: AuditLogEntry): void {
    try {
      const logs = this.getLocalLogs();
      logs.push(entry);

      // Manter apenas os últimos 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      localStorage.setItem('audit_logs', JSON.stringify(logs));
    } catch (error) {
      // Ignorar erros de localStorage
    }
  }

  /**
   * Recuperar logs locais
   */
  getLocalLogs(): AuditLogEntry[] {
    try {
      const logs = localStorage.getItem('audit_logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  /**
   * Limpar logs locais
   */
  clearLocalLogs(): void {
    localStorage.removeItem('audit_logs');
  }

  /**
   * Reportar evento crítico imediatamente
   */
  private async reportCriticalEvent(entry: AuditLogEntry): Promise<void> {
    try {
      const alertEndpoint = import.meta.env.VITE_ALERT_ENDPOINT;
      if (!alertEndpoint) return;

      await fetch(alertEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_ALERT_API_KEY}`
        },
        body: JSON.stringify({
          ...entry,
          alert: true,
          priority: 'critical'
        })
      });
    } catch (error) {
      console.error('Failed to send critical alert:', error);
    }
  }

  /**
   * Utilitários
   */
  private mapSeverityToLevel(severity: SecurityEvent['severity']): AuditLogEntry['level'] {
    const mapping = {
      low: 'info' as const,
      medium: 'warn' as const,
      high: 'error' as const,
      critical: 'critical' as const
    };
    return mapping[severity];
  }

  private getLevelColor(level: AuditLogEntry['level']): string {
    const colors = {
      info: '#2563eb',
      warn: '#d97706',
      error: '#dc2626',
      critical: '#991b1b'
    };
    return colors[level];
  }

  private getClientIP(): string {
    // Em produção, isso seria obtido do header ou serviço
    return 'client-ip';
  }

  private getSessionId(): string {
    // Obter ID da sessão atual
    return sessionStorage.getItem('session_id') || 'anonymous';
  }
}

// Instância singleton
export const auditLogger = new AuditLogger();

// Hooks para uso em componentes React
export const useAuditLogger = () => {
  return {
    logUserAction: auditLogger.logUserAction.bind(auditLogger),
    logSecurityEvent: auditLogger.logSecurityEvent.bind(auditLogger),
    logTenantOperation: auditLogger.logTenantOperation.bind(auditLogger),
    logError: auditLogger.logError.bind(auditLogger),
    logPerformance: auditLogger.logPerformance.bind(auditLogger),
    logDataChange: auditLogger.logDataChange.bind(auditLogger)
  };
};

// Interceptador global de erros
window.addEventListener('error', (event) => {
  auditLogger.logError(event.error, {
    metadata: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }
  });
});

window.addEventListener('unhandledrejection', (event) => {
  auditLogger.logError(new Error(event.reason), {
    metadata: {
      type: 'unhandled_promise_rejection'
    }
  });
});