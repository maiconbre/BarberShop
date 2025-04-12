import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});


//Para usar o cache atualizado, você pode:

//Usar CacheService.getCache() para recuperar dados
//Usar CacheService.setCache() para salvar dados
//Usar CacheService.fetchWithCache() para buscar dados com cache automático
//Usar CacheService.clearCache() para limpar todo o cache quando necessário
//O sistema agora deve funcionar sem os erros reportados e com melhor gerenciamento de cache.