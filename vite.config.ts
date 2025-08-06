import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression2';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-router-dom')) {
              return 'router-vendor';
            }
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
}));

//Para usar o cache atualizado, você pode:

//Usar CacheService.getCache() para recuperar dados
//Usar CacheService.setCache() para salvar dados
//Usar CacheService.fetchWithCache() para buscar dados com cache automático
//Usar CacheService.clearCache() para limpar todo o cache quando necessário
//O sistema agora deve funcionar sem os erros reportados e com melhor gerenciamento de cache.