import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import App from './App.tsx';
import './index.css';
import { initializeServices } from './services/initServices';
import { logger } from './utils/logger';

// Handler global de erros para filtrar erros de extensões
window.addEventListener('error', (event) => {
  const errorMessage = event.error?.message || event.message || '';
  
  // Filtrar erros conhecidos de extensões do Chrome
  const isExtensionError = 
    errorMessage.includes('chrome-extension://') ||
    errorMessage.includes('A listener indicated an asynchronous response') ||
    errorMessage.includes('message channel closed') ||
    event.filename?.includes('chrome-extension://');
  
  if (isExtensionError) {
    // Prevenir que o erro apareça no console
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
  
  // Log apenas erros relevantes da aplicação
  logger.componentError('Erro global capturado:', event.error || event.message);
});

// Handler para promises rejeitadas
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  
  // Filtrar erros de extensões
  if (reason?.message?.includes('chrome-extension://') ||
      reason?.message?.includes('A listener indicated an asynchronous response')) {
    event.preventDefault();
    return false;
  }
  
  logger.componentError('Promise rejeitada:', reason);
});

// Inicializar serviços antes de renderizar a aplicação
initializeServices().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>
  );
});
