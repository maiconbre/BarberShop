/**
 * Configuração do CORS
 * Este arquivo centraliza as configurações do CORS para diferentes ambientes
 */

const corsConfig = {
  development: {
    origin: ['https://barber.targetweb.tech', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200
  },
  production: {
    origin: ['https://barber.targetweb.tech','http://localhost:5173', 'https://barber-shop-git-modal-fix-maiconbres-projects.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200
  },
  test: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200
  }
};

// Determinar o ambiente atual
const env = process.env.NODE_ENV || 'development';
const config = corsConfig[env];

if (!config) {
  throw new Error(`Configuração de CORS não encontrada para o ambiente: ${env}`);
}

module.exports = config;