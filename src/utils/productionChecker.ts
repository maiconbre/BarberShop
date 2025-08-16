/**
 * Verificador de configurações de produção
 * Valida se todas as configurações necessárias estão corretas
 */

export interface ConfigCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  critical: boolean;
}

export interface ProductionReadinessReport {
  overall: 'ready' | 'warning' | 'not_ready';
  score: number;
  checks: ConfigCheck[];
  recommendations: string[];
}

class ProductionChecker {
  private static instance: ProductionChecker;

  private constructor() { }

  public static getInstance(): ProductionChecker {
    if (!ProductionChecker.instance) {
      ProductionChecker.instance = new ProductionChecker();
    }
    return ProductionChecker.instance;
  }

  /**
   * Executar todas as verificações de produção
   */
  public async runAllChecks(): Promise<ProductionReadinessReport> {
    const checks: ConfigCheck[] = [];

    // Verificações de ambiente
    checks.push(...this.checkEnvironmentVariables());

    // Verificações de API
    checks.push(...await this.checkApiConnectivity());

    // Verificações de segurança
    checks.push(...this.checkSecuritySettings());

    // Verificações de performance
    checks.push(...this.checkPerformanceSettings());

    // Verificações de monitoramento
    checks.push(...this.checkMonitoringSettings());

    // Calcular score e status geral
    const { overall, score } = this.calculateOverallStatus(checks);

    // Gerar recomendações
    const recommendations = this.generateRecommendations(checks);

    return {
      overall,
      score,
      checks,
      recommendations
    };
  }

  /**
   * Verificar variáveis de ambiente
   */
  private checkEnvironmentVariables(): ConfigCheck[] {
    const checks: ConfigCheck[] = [];

    // API URL
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      checks.push({
        name: 'API URL',
        status: 'fail',
        message: 'VITE_API_URL não está definida',
        critical: true
      });
    } else if (apiUrl.includes('localhost')) {
      checks.push({
        name: 'API URL',
        status: 'warning',
        message: 'API URL aponta para localhost - não adequado para produção',
        critical: false
      });
    } else {
      checks.push({
        name: 'API URL',
        status: 'pass',
        message: `API URL configurada: ${apiUrl}`,
        critical: false
      });
    }

    // Modo de desenvolvimento
    const devMode = import.meta.env.VITE_DEV_MODE;
    if (devMode === 'true') {
      checks.push({
        name: 'Development Mode',
        status: 'warning',
        message: 'Modo de desenvolvimento ativado em produção',
        critical: false
      });
    } else {
      checks.push({
        name: 'Development Mode',
        status: 'pass',
        message: 'Modo de desenvolvimento desativado',
        critical: false
      });
    }

    // Debug API
    const debugApi = import.meta.env.VITE_DEBUG_API;
    if (debugApi === 'true') {
      checks.push({
        name: 'API Debug',
        status: 'warning',
        message: 'Debug da API ativado em produção',
        critical: false
      });
    } else {
      checks.push({
        name: 'API Debug',
        status: 'pass',
        message: 'Debug da API desativado',
        critical: false
      });
    }

    // Supabase
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      checks.push({
        name: 'Supabase Configuration',
        status: 'fail',
        message: 'Configurações do Supabase não estão completas',
        critical: true
      });
    } else {
      checks.push({
        name: 'Supabase Configuration',
        status: 'pass',
        message: 'Supabase configurado corretamente',
        critical: false
      });
    }

    return checks;
  }

  /**
   * Verificar conectividade da API
   */
  private async checkApiConnectivity(): Promise<ConfigCheck[]> {
    const checks: ConfigCheck[] = [];
    const apiUrl = import.meta.env.VITE_API_URL;

    if (!apiUrl) {
      checks.push({
        name: 'API Connectivity',
        status: 'fail',
        message: 'Não é possível testar conectividade - API URL não definida',
        critical: true
      });
      return checks;
    }

    try {
      // Testar endpoint de health check
      const healthResponse = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        timeout: 10000
      });

      if (healthResponse.ok) {
        checks.push({
          name: 'API Health Check',
          status: 'pass',
          message: 'API respondendo corretamente',
          critical: false
        });
      } else {
        checks.push({
          name: 'API Health Check',
          status: 'fail',
          message: `API retornou status ${healthResponse.status}`,
          critical: true
        });
      }

      // Testar endpoint de barbershops
      const barbershopsResponse = await fetch(`${apiUrl}/api/barbershops/check-slug/test`, {
        method: 'GET',
        timeout: 10000
      });

      if (barbershopsResponse.ok || barbershopsResponse.status === 404) {
        checks.push({
          name: 'API Endpoints',
          status: 'pass',
          message: 'Endpoints da API acessíveis',
          critical: false
        });
      } else {
        checks.push({
          name: 'API Endpoints',
          status: 'warning',
          message: `Endpoint de teste retornou status ${barbershopsResponse.status}`,
          critical: false
        });
      }

    } catch (error) {
      checks.push({
        name: 'API Connectivity',
        status: 'fail',
        message: `Erro ao conectar com a API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        critical: true
      });
    }

    return checks;
  }

  /**
   * Verificar configurações de segurança
   */
  private checkSecuritySettings(): ConfigCheck[] {
    const checks: ConfigCheck[] = [];

    // HTTPS
    if (window.location.protocol === 'https:') {
      checks.push({
        name: 'HTTPS',
        status: 'pass',
        message: 'Aplicação servida via HTTPS',
        critical: false
      });
    } else {
      checks.push({
        name: 'HTTPS',
        status: 'fail',
        message: 'Aplicação não está usando HTTPS',
        critical: true
      });
    }

    // Content Security Policy
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
      checks.push({
        name: 'Content Security Policy',
        status: 'pass',
        message: 'CSP configurado',
        critical: false
      });
    } else {
      checks.push({
        name: 'Content Security Policy',
        status: 'warning',
        message: 'CSP não configurado',
        critical: false
      });
    }

    // Local Storage Security
    try {
      localStorage.setItem('security_test', 'test');
      localStorage.removeItem('security_test');
      checks.push({
        name: 'Local Storage',
        status: 'pass',
        message: 'Local Storage funcionando corretamente',
        critical: false
      });
    } catch {
      checks.push({
        name: 'Local Storage',
        status: 'fail',
        message: 'Local Storage não está disponível',
        critical: true
      });
    }

    return checks;
  }

  /**
   * Verificar configurações de performance
   */
  private checkPerformanceSettings(): ConfigCheck[] {
    const checks: ConfigCheck[] = [];

    // Service Worker
    if ('serviceWorker' in navigator) {
      checks.push({
        name: 'Service Worker Support',
        status: 'pass',
        message: 'Service Worker suportado',
        critical: false
      });
    } else {
      checks.push({
        name: 'Service Worker Support',
        status: 'warning',
        message: 'Service Worker não suportado',
        critical: false
      });
    }

    // Web Vitals
    if ('performance' in window && 'getEntriesByType' in performance) {
      checks.push({
        name: 'Performance API',
        status: 'pass',
        message: 'Performance API disponível',
        critical: false
      });
    } else {
      checks.push({
        name: 'Performance API',
        status: 'warning',
        message: 'Performance API não disponível',
        critical: false
      });
    }

    // Memory
    const memory = (performance as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (memory) {
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);

      if (usedMB < limitMB * 0.8) {
        checks.push({
          name: 'Memory Usage',
          status: 'pass',
          message: `Uso de memória: ${usedMB}MB / ${limitMB}MB`,
          critical: false
        });
      } else {
        checks.push({
          name: 'Memory Usage',
          status: 'warning',
          message: `Alto uso de memória: ${usedMB}MB / ${limitMB}MB`,
          critical: false
        });
      }
    }

    return checks;
  }

  /**
   * Verificar configurações de monitoramento
   */
  private checkMonitoringSettings(): ConfigCheck[] {
    const checks: ConfigCheck[] = [];

    // Console errors
    const originalError = console.error;
    let errorCount = 0;

    console.error = (...args) => {
      errorCount++;
      originalError.apply(console, args);
    };

    setTimeout(() => {
      console.error = originalError;

      if (errorCount === 0) {
        checks.push({
          name: 'Console Errors',
          status: 'pass',
          message: 'Nenhum erro no console detectado',
          critical: false
        });
      } else {
        checks.push({
          name: 'Console Errors',
          status: 'warning',
          message: `${errorCount} erros no console detectados`,
          critical: false
        });
      }
    }, 1000);

    // Error boundary
    const hasErrorBoundary = document.querySelector('[data-error-boundary]');
    if (hasErrorBoundary) {
      checks.push({
        name: 'Error Boundary',
        status: 'pass',
        message: 'Error Boundary configurado',
        critical: false
      });
    } else {
      checks.push({
        name: 'Error Boundary',
        status: 'warning',
        message: 'Error Boundary não detectado',
        critical: false
      });
    }

    return checks;
  }

  /**
   * Calcular status geral
   */
  private calculateOverallStatus(checks: ConfigCheck[]): { overall: ProductionReadinessReport['overall']; score: number } {
    const totalChecks = checks.length;
    const passedChecks = checks.filter(c => c.status === 'pass').length;
    const failedCritical = checks.filter(c => c.status === 'fail' && c.critical).length;
    const failedNonCritical = checks.filter(c => c.status === 'fail' && !c.critical).length;

    const score = Math.round((passedChecks / totalChecks) * 100);

    if (failedCritical > 0) {
      return { overall: 'not_ready', score };
    } else if (failedNonCritical > 0 || score < 80) {
      return { overall: 'warning', score };
    } else {
      return { overall: 'ready', score };
    }
  }

  /**
   * Gerar recomendações
   */
  private generateRecommendations(checks: ConfigCheck[]): string[] {
    const recommendations: string[] = [];
    const failedChecks = checks.filter(c => c.status === 'fail');
    const warningChecks = checks.filter(c => c.status === 'warning');

    // Recomendações para falhas críticas
    failedChecks.forEach(check => {
      switch (check.name) {
        case 'API URL':
          recommendations.push('Configure VITE_API_URL com a URL da API de produção');
          break;
        case 'Supabase Configuration':
          recommendations.push('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
          break;
        case 'HTTPS':
          recommendations.push('Configure certificado SSL e force redirecionamento HTTPS');
          break;
        case 'API Connectivity':
          recommendations.push('Verifique se a API está online e acessível');
          break;
        default:
          recommendations.push(`Corrija o problema: ${check.message}`);
      }
    });

    // Recomendações para warnings
    if (warningChecks.length > 0) {
      recommendations.push('Considere corrigir os warnings para melhor performance e segurança');
    }

    // Recomendações gerais
    if (recommendations.length === 0) {
      recommendations.push('Aplicação pronta para produção! 🎉');
      recommendations.push('Monitore logs e métricas após o deploy');
      recommendations.push('Configure alertas para erros críticos');
    }

    return recommendations;
  }

  /**
   * Executar verificação rápida
   */
  public quickCheck(): { ready: boolean; criticalIssues: string[] } {
    const criticalIssues: string[] = [];

    // Verificações essenciais
    if (!import.meta.env.VITE_API_URL) {
      criticalIssues.push('API URL não configurada');
    }

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      criticalIssues.push('Supabase não configurado');
    }

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      criticalIssues.push('HTTPS não configurado');
    }

    if (import.meta.env.VITE_DEV_MODE === 'true') {
      criticalIssues.push('Modo de desenvolvimento ativo');
    }

    return {
      ready: criticalIssues.length === 0,
      criticalIssues
    };
  }
}

// Instância singleton
export const productionChecker = ProductionChecker.getInstance();

// Funções de conveniência
export const runProductionChecks = () => productionChecker.runAllChecks();
export const quickProductionCheck = () => productionChecker.quickCheck();

// Tipos para uso externo
export type { ConfigCheck, ProductionReadinessReport };