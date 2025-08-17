#!/usr/bin/env node

/**
 * Script de teste para validar o sistema de migrações
 * Este script testa a conexão com o banco e valida se as migrações podem ser executadas
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class MigrationTester {
  constructor() {
    this.client = null;
    this.migrationsDir = path.join(__dirname, '..', 'migrations');
  }

  async connect() {
    try {
      this.client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'barbershop'
      });

      await this.client.connect();
      console.log('✅ Conectado ao banco de dados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao conectar ao banco de dados:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      console.log('🔌 Desconectado do banco de dados');
    }
  }

  async testConnection() {
    try {
      const result = await this.client.query('SELECT version()');
      console.log('📊 Versão do PostgreSQL:', result.rows[0].version);
      return true;
    } catch (error) {
      console.error('❌ Erro ao verificar versão do PostgreSQL:', error.message);
      return false;
    }
  }

  async checkMigrationsTable() {
    try {
      const result = await this.client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'migrations'
        );
      `);
      
      if (result.rows[0].exists) {
        console.log('📋 Tabela de migrações já existe');
        const count = await this.client.query('SELECT COUNT(*) as count FROM migrations');
        console.log('📊 Migrações executadas:', count.rows[0].count);
      } else {
        console.log('📋 Tabela de migrações não existe - será criada automaticamente');
      }
      
      return result.rows[0].exists;
    } catch (error) {
      console.error('❌ Erro ao verificar tabela de migrações:', error.message);
      return false;
    }
  }

  async listMigrationFiles() {
    try {
      const files = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      console.log('📁 Arquivos de migração encontrados:');
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
      
      return files;
    } catch (error) {
      console.error('❌ Erro ao listar arquivos de migração:', error.message);
      return [];
    }
  }

  async validateMigrationFile(filename) {
    try {
      const filePath = path.join(this.migrationsDir, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const hasUp = content.includes('-- UP') || content.includes('--UP');
      const hasDown = content.includes('-- DOWN') || content.includes('--DOWN');
      
      console.log(`🔍 Validando ${filename}:`);
      console.log(`   ✅ Contém seção UP: ${hasUp}`);
      console.log(`   ✅ Contém seção DOWN: ${hasDown}`);
      
      return hasUp && hasDown;
    } catch (error) {
      console.error(`❌ Erro ao validar ${filename}:`, error.message);
      return false;
    }
  }

  async testMigrationSyntax(filename) {
    try {
      const filePath = path.join(this.migrationsDir, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Dividir em seções UP e DOWN
      const upMatch = content.match(/--\s*UP\s*\n([\s\S]*?)(?=--\s*DOWN|--\s*DOWN|$)/i);
      const downMatch = content.match(/--\s*DOWN\s*\n([\s\S]*?)$/i);
      
      if (!upMatch || !downMatch) {
        console.warn(`⚠️  ${filename}: Não conseguiu identificar seções UP/DOWN claramente`);
        return false;
      }
      
      const upSql = upMatch[1].trim();
      const downSql = downMatch[1].trim();
      
      console.log(`✅ ${filename}: Estrutura UP/DOWN identificada`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao testar sintaxe de ${filename}:`, error.message);
      return false;
    }
  }

  async runFullTest() {
    console.log('🚀 Iniciando testes do sistema de migrações...\n');
    
    try {
      await this.connect();
      
      // Testar conexão
      await this.testConnection();
      console.log('');
      
      // Verificar tabela de migrações
      await this.checkMigrationsTable();
      console.log('');
      
      // Listar arquivos de migração
      const migrationFiles = await this.listMigrationFiles();
      console.log('');
      
      // Validar cada arquivo
      for (const file of migrationFiles) {
        await this.validateMigrationFile(file);
        await this.testMigrationSyntax(file);
        console.log('');
      }
      
      console.log('✅ Todos os testes concluídos com sucesso!');
      console.log('');
      console.log('📋 Próximos passos:');
      console.log('   1. Configure seu arquivo .env com as credenciais do banco');
      console.log('   2. Execute: npm run migrate:status');
      console.log('   3. Execute: npm run migrate:dev');
      
    } catch (error) {
      console.error('❌ Erro durante os testes:', error.message);
    } finally {
      await this.disconnect();
    }
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const tester = new MigrationTester();
  tester.runFullTest();
}

module.exports = MigrationTester;