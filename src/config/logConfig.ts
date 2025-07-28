/**
 * Configuração centralizada para o sistema de logs da API
 * Controla quando os logs devem aparecer baseado no ambiente
 */

export class LogConfig {
  // Detecta se estamos em modo de desenvolvimento
  private static readonly isDevMode = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV;
  private static readonly isDebugEnabled = import.meta.env.VITE_DEBUG_API === 'true';
  private static readonly isProduction = import.meta.env.PROD;
  
  // Configurações específicas por ambiente
  static readonly shouldLogApiRequests = this.isDevMode || this.isDebugEnabled;
  static readonly shouldLogCacheOperations = this.isDevMode || this.isDebugEnabled;
  static readonly shouldLogAppointmentOperations = this.isDevMode || this.isDebugEnabled;
  
  // Configurações de verbosidade
  static readonly verboseLogging = this.isDebugEnabled;
  static readonly showRequestBodies = this.isDebugEnabled;
  static readonly showResponseData = this.isDebugEnabled;
  
  /**
   * Verifica se os logs devem ser exibidos
   * @returns true se logs devem aparecer (npm run dev:prod ou npm run dev:local)
   */
  static shouldLog(): boolean {
    // Logs aparecem apenas em desenvolvimento
    // npm run dev:prod -> VITE_DEV_MODE=false mas DEV=true
    // npm run dev:local -> VITE_DEV_MODE=true e DEV=true
    // produção real -> VITE_DEV_MODE=false e DEV=false
    return !this.isProduction && (this.isDevMode || this.isDebugEnabled);
  }
  
  /**
   * Configurações específicas para diferentes tipos de log
   */
  static getLogSettings() {
    return {
      apiRequests: this.shouldLogApiRequests,
      cacheOperations: this.shouldLogCacheOperations,
      appointmentOperations: this.shouldLogAppointmentOperations,
      verbose: this.verboseLogging,
      showBodies: this.showRequestBodies,
      showResponses: this.showResponseData,
      environment: {
        isDevMode: this.isDevMode,
        isDebugEnabled: this.isDebugEnabled,
        isProduction: this.isProduction,
        nodeEnv: import.meta.env.MODE
      }
    };
  }
  
  /**
   * Log de inicialização para mostrar configurações ativas
   */
  static logInitialization() {
    if (!this.shouldLog()) return;
    
    const settings = this.getLogSettings();
    
    console.group('🔧 [LOG CONFIG] Sistema de Logs Inicializado');
    console.log('📊 Configurações Ativas:', settings);
    console.log('🌍 Ambiente:', {
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
      devMode: import.meta.env.VITE_DEV_MODE,
      debugApi: import.meta.env.VITE_DEBUG_API
    });
    console.log('✅ Logs de API habilitados para desenvolvimento');
    console.groupEnd();
  }
}

// Inicializar configurações de log
LogConfig.logInitialization();