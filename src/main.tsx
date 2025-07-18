import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';
import { initializeServices } from './services/initServices';

// Inicializar serviços antes de renderizar a aplicação
initializeServices().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider>
        <App />
        <Toaster position="top-right" />
      </AuthProvider>
    </StrictMode>
  );
});
