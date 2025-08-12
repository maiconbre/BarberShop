/**
 * Configuração do JWT
 * Este arquivo centraliza as configurações do JWT para diferentes ambientes
 */

require('dotenv').config({ path: process.env.NODE_ENV === 'development' ? '../../.env.local' : '../../.env' });

const jwtConfig = {
  development: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_key',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  },
  production: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  },
  test: {
    secret: 'test_jwt_secret_key',
    expiresIn: '1h',
    refreshSecret: 'test_refresh_secret_key',
    refreshExpiresIn: '24h'
  }
};

// Determinar o ambiente atual
const env = process.env.NODE_ENV || 'development';
const config = jwtConfig[env];

if (!config) {
  throw new Error(`Configuração de JWT não encontrada para o ambiente: ${env}`);
}

// Verificar se as chaves secretas estão definidas em produção
if (env === 'production') {
  if (!config.secret) {
    throw new Error('JWT_SECRET não está definido no ambiente de produção');
  }
  if (!config.refreshSecret) {
    throw new Error('REFRESH_TOKEN_SECRET não está definido no ambiente de produção');
  }
}

module.exports = config;