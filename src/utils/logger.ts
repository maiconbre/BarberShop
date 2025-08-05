/**
 * Sistema de logging configurável para reduzir ruído no console
 * Permite controlar níveis de log e filtrar mensagens desnecessárias
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4
}

export interface LoggerConfig {
  level: LogLevel;
  enableApiLogs: boolean;
  enableComponentLogs: boolean;
  enableCacheLogs: boolean;
  enableRequestLogs: boolean;
  prefix?: string;
}

class Logger {
  private static instance: Logger;
  private config: LoggerConfig;

  private constructor() {
    // Configuração padrão - mais restritiva para reduzir ruído
    this.config = {
      level: LogLevel.WARN, // Apenas warnings e erros por padrão
      enableApiLogs: false, // Desabilitar logs detalhados da API
      enableComponentLogs: false, // Desabilitar logs detalhados de componentes
      enableCacheLogs: false, // Desabilitar logs de cache
      enableRequestLogs: false, // Desabilitar logs de requisições
      prefix: '[BarberGR]'
    };

    // Permitir configuração via localStorage para desenvolvimento
    this.loadConfigFromStorage();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private loadConfigFromStorage(): void {
    try {
      const storedConfig = localStorage.getItem('barberGR_logConfig');
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        this.config = { ...this.config, ...parsed };
      }
    } catch {
      // Ignorar erros de parsing
    }
  }

  public updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem('barberGR_logConfig', JSON.stringify(this.config));
    } catch {
      // Ignorar erros de storage
    }
  }

  public getConfig(): LoggerConfig {
    return { ...this.config };
  }

  private shouldLog(level: LogLevel, category?: string): boolean {
    if (level > this.config.level) {
      return false;
    }

    // Filtros específicos por categoria
    if (category) {
      switch (category) {
        case 'api':
          return this.config.enableApiLogs;
        case 'component':
          return this.config.enableComponentLogs;
        case 'cache':
          return this.config.enableCacheLogs;
        case 'request':
          return this.config.enableRequestLogs;
        default:
          return true;
      }
    }

    return true;
  }

  private formatMessage(level: LogLevel, message: string, category?: string): string {
    const timestamp = new Date().toLocaleTimeString();
    const levelStr = LogLevel[level];
    const categoryStr = category ? `[${category.toUpperCase()}]` : '';
    return `${this.config.prefix} ${timestamp} ${levelStr} ${categoryStr} ${message}`;
  }

  public error(message: string, category?: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR, category)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, category), ...args);
    }
  }

  public warn(message: string, category?: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN, category)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, category), ...args);
    }
  }

  public info(message: string, category?: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO, category)) {
      console.info(this.formatMessage(LogLevel.INFO, message, category), ...args);
    }
  }

  public debug(message: string, category?: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG, category)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, category), ...args);
    }
  }

  public verbose(message: string, category?: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.VERBOSE, category)) {
      console.log(this.formatMessage(LogLevel.VERBOSE, message, category), ...args);
    }
  }

  // Métodos de conveniência para categorias específicas
  public apiError(message: string, ...args: unknown[]): void {
    this.error(message, 'api', ...args);
  }

  public apiWarn(message: string, ...args: unknown[]): void {
    this.warn(message, 'api', ...args);
  }

  public apiInfo(message: string, ...args: unknown[]): void {
    this.info(message, 'api', ...args);
  }

  public apiDebug(message: string, ...args: unknown[]): void {
    this.debug(message, 'api', ...args);
  }

  public componentError(message: string, ...args: unknown[]): void {
    this.error(message, 'component', ...args);
  }

  public componentWarn(message: string, ...args: unknown[]): void {
    this.warn(message, 'component', ...args);
  }

  public componentInfo(message: string, ...args: unknown[]): void {
    this.info(message, 'component', ...args);
  }

  public componentDebug(message: string, ...args: unknown[]): void {
    this.debug(message, 'component', ...args);
  }

  // Método para habilitar logs de desenvolvimento
  public enableDevelopmentLogs(): void {
    this.updateConfig({
      level: LogLevel.DEBUG,
      enableApiLogs: true,
      enableComponentLogs: true,
      enableCacheLogs: true,
      enableRequestLogs: true
    });
    this.info('Logs de desenvolvimento habilitados');
  }

  // Método para desabilitar logs verbosos
  public enableProductionLogs(): void {
    this.updateConfig({
      level: LogLevel.WARN,
      enableApiLogs: false,
      enableComponentLogs: false,
      enableCacheLogs: false,
      enableRequestLogs: false
    });
    this.info('Logs de produção habilitados (apenas warnings e erros)');
  }
}

// Instância singleton do logger
export const logger = Logger.getInstance();

// Funções de conveniência para uso direto
export const logError = (message: string, category?: string, ...args: unknown[]) => 
  logger.error(message, category, ...args);

export const logWarn = (message: string, category?: string, ...args: unknown[]) => 
  logger.warn(message, category, ...args);

export const logInfo = (message: string, category?: string, ...args: unknown[]) => 
  logger.info(message, category, ...args);

export const logDebug = (message: string, category?: string, ...args: unknown[]) => 
  logger.debug(message, category, ...args);

// Extend Window interface to include BarberGRLogger property
declare global {
  interface Window {
    BarberGRLogger: {
      enableDev: () => void;
      enableProd: () => void;
      setLevel: (level: LogLevel) => void;
      getConfig: () => LoggerConfig;
      updateConfig: (config: Partial<LoggerConfig>) => void;
    };
  }
}
if (typeof window !== 'undefined') {
  (window as unknown as Window).BarberGRLogger = {

    enableDev: () => logger.enableDevelopmentLogs(),
    enableProd: () => logger.enableProductionLogs(),
    setLevel: (level: LogLevel) => logger.updateConfig({ level }),
    getConfig: () => logger.getConfig(),
    updateConfig: (config: Partial<LoggerConfig>) => logger.updateConfig(config)
  };
}
