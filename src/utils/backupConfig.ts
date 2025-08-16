/**
 * Configurações de backup para dados críticos
 * Sistema para backup automático de dados importantes
 */

export interface BackupConfig {
  enabled: boolean;
  interval: number; // milliseconds
  maxBackups: number;
  includeUserData: boolean;
  includeSettings: boolean;
  includeAppointments: boolean;
  compression: boolean;
}

export interface BackupData {
  id: string;
  timestamp: string;
  version: string;
  barbershopId: string;
  data: {
    settings?: Record<string, unknown>;
    appointments?: unknown[];
    userData?: Record<string, unknown>;
  };
  checksum: string;
}

class BackupManager {
  private static instance: BackupManager;
  private config: BackupConfig;
  private backupTimer?: NodeJS.Timeout;

  private constructor() {
    this.config = {
      enabled: !import.meta.env.DEV, // Habilitado apenas em produção
      interval: 24 * 60 * 60 * 1000, // 24 horas
      maxBackups: 7, // Manter 7 backups
      includeUserData: true,
      includeSettings: true,
      includeAppointments: true,
      compression: true
    };

    if (this.config.enabled) {
      this.startBackupTimer();
    }
  }

  public static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  /**
   * Iniciar timer de backup automático
   */
  private startBackupTimer(): void {
    this.backupTimer = setInterval(() => {
      this.performBackup();
    }, this.config.interval);

    // Fazer backup inicial após 5 minutos
    setTimeout(() => {
      this.performBackup();
    }, 5 * 60 * 1000);
  }

  /**
   * Realizar backup dos dados
   */
  public async performBackup(): Promise<string | null> {
    if (!this.config.enabled) return null;

    try {
      const barbershopId = this.getCurrentBarbershopId();
      if (!barbershopId) return null;

      const backupData: BackupData = {
        id: this.generateBackupId(),
        timestamp: new Date().toISOString(),
        version: this.getAppVersion(),
        barbershopId,
        data: await this.collectBackupData(),
        checksum: ''
      };

      // Calcular checksum
      backupData.checksum = await this.calculateChecksum(backupData.data);

      // Salvar backup localmente
      await this.saveBackupLocally(backupData);

      // Enviar backup para servidor (se configurado)
      await this.sendBackupToServer(backupData);

      // Limpar backups antigos
      await this.cleanupOldBackups();

      console.log(`Backup realizado com sucesso: ${backupData.id}`);
      return backupData.id;

    } catch (error) {
      console.error('Erro ao realizar backup:', error);
      return null;
    }
  }

  /**
   * Coletar dados para backup
   */
  private async collectBackupData(): Promise<BackupData['data']> {
    const data: BackupData['data'] = {};

    try {
      // Backup das configurações
      if (this.config.includeSettings) {
        const settings = localStorage.getItem('barbershop_settings');
        if (settings) {
          data.settings = JSON.parse(settings);
        }
      }

      // Backup dos dados do usuário
      if (this.config.includeUserData) {
        const userData = {
          preferences: localStorage.getItem('user_preferences'),
          theme: localStorage.getItem('theme'),
          language: localStorage.getItem('language')
        };
        data.userData = userData;
      }

      // Backup dos agendamentos (dados críticos)
      if (this.config.includeAppointments) {
        const appointments = localStorage.getItem('cached_appointments');
        if (appointments) {
          data.appointments = JSON.parse(appointments);
        }
      }

    } catch (error) {
      console.warn('Erro ao coletar dados para backup:', error);
    }

    return data;
  }

  /**
   * Salvar backup localmente
   */
  private async saveBackupLocally(backupData: BackupData): Promise<void> {
    try {
      const backupKey = `backup_${backupData.id}`;
      const dataToStore = this.config.compression 
        ? await this.compressData(backupData)
        : JSON.stringify(backupData);

      localStorage.setItem(backupKey, dataToStore);

      // Manter lista de backups
      const backupList = this.getLocalBackupList();
      backupList.push({
        id: backupData.id,
        timestamp: backupData.timestamp,
        size: dataToStore.length
      });

      localStorage.setItem('backup_list', JSON.stringify(backupList));

    } catch (error) {
      console.error('Erro ao salvar backup localmente:', error);
    }
  }

  /**
   * Enviar backup para servidor
   */
  private async sendBackupToServer(backupData: BackupData): Promise<void> {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/backups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(backupData)
      });

      if (!response.ok) {
        throw new Error(`Backup server error: ${response.statusText}`);
      }

    } catch (error) {
      console.warn('Erro ao enviar backup para servidor:', error);
      // Não falhar o backup se o servidor estiver indisponível
    }
  }

  /**
   * Limpar backups antigos
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backupList = this.getLocalBackupList();
      
      // Ordenar por timestamp (mais recente primeiro)
      backupList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Remover backups excedentes
      const backupsToRemove = backupList.slice(this.config.maxBackups);
      
      for (const backup of backupsToRemove) {
        localStorage.removeItem(`backup_${backup.id}`);
      }

      // Atualizar lista de backups
      const remainingBackups = backupList.slice(0, this.config.maxBackups);
      localStorage.setItem('backup_list', JSON.stringify(remainingBackups));

    } catch (error) {
      console.error('Erro ao limpar backups antigos:', error);
    }
  }

  /**
   * Restaurar backup
   */
  public async restoreBackup(backupId: string): Promise<boolean> {
    try {
      const backupData = await this.loadBackup(backupId);
      if (!backupData) return false;

      // Verificar checksum
      const calculatedChecksum = await this.calculateChecksum(backupData.data);
      if (calculatedChecksum !== backupData.checksum) {
        throw new Error('Backup corrupted: checksum mismatch');
      }

      // Restaurar dados
      if (backupData.data.settings) {
        localStorage.setItem('barbershop_settings', JSON.stringify(backupData.data.settings));
      }

      if (backupData.data.userData) {
        const userData = backupData.data.userData as Record<string, string>;
        Object.entries(userData).forEach(([key, value]) => {
          if (value) localStorage.setItem(key, value);
        });
      }

      if (backupData.data.appointments) {
        localStorage.setItem('cached_appointments', JSON.stringify(backupData.data.appointments));
      }

      console.log(`Backup restaurado com sucesso: ${backupId}`);
      return true;

    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      return false;
    }
  }

  /**
   * Carregar backup
   */
  private async loadBackup(backupId: string): Promise<BackupData | null> {
    try {
      const backupKey = `backup_${backupId}`;
      const storedData = localStorage.getItem(backupKey);
      
      if (!storedData) return null;

      const backupData = this.config.compression
        ? await this.decompressData(storedData)
        : JSON.parse(storedData);

      return backupData;

    } catch (error) {
      console.error('Erro ao carregar backup:', error);
      return null;
    }
  }

  /**
   * Obter lista de backups locais
   */
  public getLocalBackupList(): Array<{ id: string; timestamp: string; size: number }> {
    try {
      const backupList = localStorage.getItem('backup_list');
      return backupList ? JSON.parse(backupList) : [];
    } catch {
      return [];
    }
  }

  /**
   * Comprimir dados (simulado - em produção usar biblioteca real)
   */
  private async compressData(data: BackupData): Promise<string> {
    // Em produção, usar biblioteca como pako ou similar
    return JSON.stringify(data);
  }

  /**
   * Descomprimir dados (simulado)
   */
  private async decompressData(compressedData: string): Promise<BackupData> {
    // Em produção, usar biblioteca como pako ou similar
    return JSON.parse(compressedData);
  }

  /**
   * Calcular checksum dos dados
   */
  private async calculateChecksum(data: BackupData['data']): Promise<string> {
    const dataString = JSON.stringify(data);
    
    // Usar Web Crypto API para hash
    if (crypto.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback: hash simples
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Gerar ID único para backup
   */
  private generateBackupId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}-${random}`;
  }

  /**
   * Obter versão da aplicação
   */
  private getAppVersion(): string {
    return import.meta.env.VITE_APP_VERSION || '1.0.0';
  }

  /**
   * Obter ID da barbearia atual
   */
  private getCurrentBarbershopId(): string | null {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) return null;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.barbershopId || null;
    } catch {
      return null;
    }
  }

  /**
   * Parar timer de backup
   */
  public stopBackupTimer(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = undefined;
    }
  }

  /**
   * Atualizar configuração
   */
  public updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enabled && !this.backupTimer) {
      this.startBackupTimer();
    } else if (!this.config.enabled && this.backupTimer) {
      this.stopBackupTimer();
    }
  }

  /**
   * Obter configuração atual
   */
  public getConfig(): BackupConfig {
    return { ...this.config };
  }
}

// Instância singleton
export const backupManager = BackupManager.getInstance();

// Funções de conveniência
export const performBackup = () => backupManager.performBackup();
export const restoreBackup = (backupId: string) => backupManager.restoreBackup(backupId);
export const getBackupList = () => backupManager.getLocalBackupList();

// Tipos para uso externo
export type { BackupConfig, BackupData };