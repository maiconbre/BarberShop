import ApiService from './ApiService';
import { logger } from '../utils/logger';

// Função para inicializar todos os serviços da aplicação
export const initializeServices = async (): Promise<void> => {
  try {
    logger.apiInfo('Inicializando serviços da aplicação...');
    
    // Pré-carregar dados críticos
    await ApiService.preloadCriticalData();
    
    logger.apiInfo('Serviços da aplicação inicializados com sucesso');
  } catch (error) {
    logger.apiWarn('Erro ao inicializar serviços da aplicação:', error);
    // Não propaga o erro para não bloquear a inicialização da aplicação
  }
};

// Exporta uma função para recarregar dados críticos manualmente
export const reloadCriticalData = async (): Promise<void> => {
  return ApiService.preloadCriticalData();
};