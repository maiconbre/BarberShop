import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
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

// Renderizar a aplicação imediatamente para melhorar a experiência do usuário
const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1A1F2E',
            color: '#fff',
            border: '1px solid #F0B35B',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '12px',
            fontWeight: '500'
          }
        }}
      />
    </AuthProvider>
  </StrictMode>
);

// Inicializar serviços em segundo plano após a renderização
setTimeout(() => {
  initializeServices().catch(error => {
    logger.apiWarn('Erro ao inicializar serviços em segundo plano:', error);
  });
}, 100);
