#!/usr/bin/env node
/**
 * Script para gerar chaves secretas seguras para JWT
 * Execute: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('🔐 Gerando chaves secretas para JWT...');
console.log('=' .repeat(60));

// Gerar JWT Secret
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);

// Gerar Refresh Token Secret
const refreshSecret = crypto.randomBytes(32).toString('hex');
console.log('REFRESH_TOKEN_SECRET=' + refreshSecret);

console.log('=' .repeat(60));
console.log('✅ Chaves geradas com sucesso!');
console.log('');
console.log('📋 Instruções:');
console.log('1. Copie as chaves acima');
console.log('2. No dashboard do Render, vá para "Environment Variables"');
console.log('3. Adicione cada variável (JWT_SECRET e REFRESH_TOKEN_SECRET)');
console.log('4. Cole os valores gerados');
console.log('5. Faça um novo deploy');
console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('- Mantenha essas chaves em local seguro');
console.log('- Nunca compartilhe essas chaves');
console.log('- Use chaves diferentes para cada ambiente');
console.log('');

// Gerar exemplo completo de variáveis
console.log('📝 Variáveis completas para o Render:');
console.log('=' .repeat(60));
console.log('NODE_ENV=production');
console.log('PORT=8000');
console.log('HOST=0.0.0.0');
console.log('JWT_SECRET=' + jwtSecret);
console.log('JWT_EXPIRES_IN=1d');
console.log('REFRESH_TOKEN_SECRET=' + refreshSecret);
console.log('REFRESH_TOKEN_EXPIRES_IN=7d');
console.log('ENABLE_SQL_LOGS=false');
console.log('DATABASE_URL=postgresql://username:password@hostname:port/database_name');
console.log('=' .repeat(60));
console.log('⚠️  Lembre-se de substituir a DATABASE_URL pela URL real do seu PostgreSQL!');