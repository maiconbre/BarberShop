import ApiService from './ApiService';

/**
 * Inicializa os serviços da aplicação e pré-carrega dados críticos
 */
export const initializeServices = async (): Promise<void> => {
  try {
    console.log('Inicializando serviços da aplicação...');
    
    // Pré-carregar dados críticos
    await ApiService.preloadCriticalData();
    
    console.log('Serviços da aplicação inicializados com sucesso');
  } catch (error) {
    console.warn('Erro ao inicializar serviços da aplicação:', error);
    // Não propaga o erro para não bloquear a inicialização da aplicação
  }
};

// Exporta uma função para recarregar dados críticos manualmente
export const reloadCriticalData = async (): Promise<void> => {
  return ApiService.preloadCriticalData();
};