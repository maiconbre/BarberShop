#!/usr/bin/env node

/**
 * Script de configuração automática do banco de dados
 * Resolve problemas comuns de autenticação PostgreSQL
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

class DatabaseSetup {
  constructor() {
    this.envPath = path.join(__dirname, '..', '.env');
    this.examplePath = path.join(__dirname, '..', '.env.example');
  }

  async setup() {
    console.log('🚀 Configurando banco de dados...\n');

    try {
      // 1. Verificar se .env existe
      if (!fs.existsSync(this.envPath)) {
        console.log('📋 Criando arquivo .env a partir do exemplo...');
        this.createEnvFromExample();
      }

      // 2. Detectar configurações do sistema
      const config = await this.detectPostgreSQLConfig();
      
      // 3. Atualizar .env com configurações detectadas
      this.updateEnvFile(config);

      // 4. Testar conexão
      await this.testConnection(config);

      console.log('\n✅ Configuração concluída!');
      console.log('\n📋 Próximos passos:');
      console.log('   1. npm run migrate:status');
      console.log('   2. npm run migrate:dev');

    } catch (error) {
      console.error('❌ Erro durante configuração:', error.message);
      console.log('\n💡 Tente as opções manuais em TROUBLESHOOTING.md');
    }
  }

  createEnvFromExample() {
    if (fs.existsSync(this.examplePath)) {
      const content = fs.readFileSync(this.examplePath, 'utf8');
      fs.writeFileSync(this.envPath, content);
      console.log('   ✅ Arquivo .env criado com sucesso');
    } else {
      // Criar .env básico
      const basicEnv = `DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=barbershop
NODE_ENV=development
`;
      fs.writeFileSync(this.envPath, basicEnv);
      console.log('   ✅ Arquivo .env básico criado');
    }
  }

  async detectPostgreSQLConfig() {
    const config = {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'barbershop'
    };

    console.log('🔍 Detectando configurações do PostgreSQL...');

    // Detectar porta
    try {
      const netstat = execSync('netstat -an | findstr :5432', { encoding: 'utf8' });
      if (netstat.includes('LISTENING')) {
        console.log('   ✅ PostgreSQL detectado na porta 5432');
      }
    } catch (error) {
      console.log('   ⚠️  PostgreSQL não encontrado na porta 5432');
    }

    // Detectar usuário
    try {
      execSync('psql --version', { stdio: 'pipe' });
      console.log('   ✅ PostgreSQL CLI disponível');
    } catch (error) {
      console.log('   ⚠️  PostgreSQL CLI não encontrado');
    }

    return config;
  }

  updateEnvFile(config) {
    console.log('\n📝 Atualizando arquivo .env...');
    
    let envContent = fs.readFileSync(this.envPath, 'utf8');
    
    // Atualizar valores
    envContent = envContent
      .replace(/DB_HOST=.*/, `DB_HOST=${config.host}`)
      .replace(/DB_PORT=.*/, `DB_PORT=${config.port}`)
      .replace(/DB_USER=.*/, `DB_USER=${config.user}`)
      .replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${config.password}`)
      .replace(/DB_NAME=.*/, `DB_NAME=${config.database}`);

    fs.writeFileSync(this.envPath, envContent);
    console.log('   ✅ Configurações atualizadas no .env');
  }

  async testConnection(config) {
    console.log('\n🔗 Testando conexão com o banco...');
    
    try {
      const { Client } = require('pg');
      const client = new Client({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: 'postgres' // Conectar ao postgres default
      });

      await client.connect();
      console.log('   ✅ Conexão estabelecida com sucesso');

      // Verificar se o database existe
      const result = await client.query(`
        SELECT 1 FROM pg_database WHERE datname = $1
      `, [config.database]);

      if (result.rows.length === 0) {
        console.log(`   📊 Database "${config.database}" não existe - será criado automaticamente`);
      } else {
        console.log(`   ✅ Database "${config.database}" já existe`);
      }

      await client.end();
    } catch (error) {
      console.error('   ❌ Falha na conexão:', error.message);
      throw error;
    }
  }

  async createDatabase() {
    console.log('\n📊 Criando database se necessário...');
    
    try {
      const { Client } = require('pg');
      const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: 'postgres'
      });

      await client.connect();
      
      await client.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'barbershop'}`);
      console.log('   ✅ Database criado ou já existente');
      
      await client.end();
    } catch (error) {
      console.log('   ⚠️  Não foi possível criar o database automaticamente');
    }
  }
}

// Executar configuração
if (require.main === module) {
  const setup = new DatabaseSetup();
  setup.setup();
}

module.exports = DatabaseSetup;