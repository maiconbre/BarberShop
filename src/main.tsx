import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Configuração do QueryClient com opções otimizadas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Evita refetch ao focar na janela
      retry: 1, // Limita tentativas de retry
      staleTime: 1000 * 60 * 5, // Dados considerados fresh por 5 minutos
      cacheTime: 1000 * 60 * 30, // Cache mantido por 30 minutos
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
