#!/usr/bin/env node

/**
 * Script de Gerenciamento de Migrações - Sequelize ORM
 * 
 * Executa migrações de banco de dados de forma programática
 * Uso: node scripts/migration-runner.js [comando] [opções]
 * 
 * Comandos:
 *   up      - Executa todas as migrações pendentes
 *   down    - Reverte a última migração
 *   status  - Mostra o status das migrações
 *   create  - Cria uma nova migração
 */

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

class MigrationRunner {
  constructor() {
    this.sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'barbershop',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    });

    this.migrationsTable = 'SequelizeMeta';
    this.migrationsDir = path.join(__dirname, '..', 'migrations');
  }

  /**
   * Inicializa a conexão com o banco
   */
  async initialize() {
    try {
      await this.sequelize.authenticate();
      console.log('✅ Conexão com o banco estabelecida com sucesso!');
      
      // Cria a tabela de controle de migrações se não existir
      await this.createMigrationsTable();
    } catch (error) {
      console.error('❌ Erro ao conectar ao banco:', error.message);
      process.exit(1);
    }
  }

  /**
   * Cria a tabela de controle de migrações
   */
  async createMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS "${this.migrationsTable}" (
        "name" VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `;
    await this.sequelize.query(query);
  }

  /**
   * Lista todas as migrações disponíveis
   */
  async getAvailableMigrations() {
    try {
      const files = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      return files.map(file => ({
        name: file,
        path: path.join(this.migrationsDir, file)
      }));
    } catch (error) {
      console.warn('⚠️  Diretório de migrações não encontrado ou vazio');
      return [];
    }
  }

  /**
   * Lista migrações já executadas
   */
  async getExecutedMigrations() {
    try {
      const [results] = await this.sequelize.query(
        `SELECT "name" FROM "${this.migrationsTable}" ORDER BY "name"`
      );
      return results.map(row => row.name);
    } catch (error) {
      console.error('❌ Erro ao buscar migrações executadas:', error.message);
      return [];
    }
  }

  /**
   * Mostra status das migrações
   */
  async showStatus() {
    const available = await this.getAvailableMigrations();
    const executed = await this.getExecutedMigrations();

    console.log('\n📊 Status das Migrações:');
    console.log('=' .repeat(50));

    if (available.length === 0) {
      console.log('📁 Nenhuma migração encontrada');
      return;
    }

    available.forEach(migration => {
      const isExecuted = executed.includes(migration.name);
      const status = isExecuted ? '✅ Executada' : '⏳ Pendente';
      console.log(`${status} - ${migration.name}`);
    });

    const pendingCount = available.length - executed.length;
    console.log(`\n📈 Total: ${available.length} | Executadas: ${executed.length} | Pendentes: ${pendingCount}`);
  }

  /**
   * Executa uma migração específica
   */
  async executeMigration(migrationPath) {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const queries = this.splitSQL(sql);

    const transaction = await this.sequelize.transaction();
    
    try {
      for (const query of queries) {
        if (query.trim()) {
          await this.sequelize.query(query, { transaction });
        }
      }
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Divide SQL em queries individuais
   */
  splitSQL(sql) {
    return sql
      .split(/;\s*\n/)
      .map(query => query.trim())
      .filter(query => query.length > 0 && !query.startsWith('--'));
  }

  /**
   * Executa todas as migrações pendentes
   */
  async up() {
    const available = await this.getAvailableMigrations();
    const executed = await this.getExecutedMigrations();
    const pending = available.filter(m => !executed.includes(m.name));

    if (pending.length === 0) {
      console.log('✅ Todas as migrações já estão executadas!');
      return;
    }

    console.log(`🚀 Executando ${pending.length} migração(ões) pendente(s)...`);

    for (const migration of pending) {
      try {
        console.log(`⏳ Executando: ${migration.name}...`);
        
        await this.executeMigration(migration.path);
        
        // Registra migração como executada
        await this.sequelize.query(
          `INSERT INTO "${this.migrationsTable}" ("name") VALUES (:name)`,
          { replacements: { name: migration.name } }
        );
        
        console.log(`✅ ${migration.name} - Executada com sucesso!`);
      } catch (error) {
        console.error(`❌ Erro ao executar ${migration.name}:`, error.message);
        throw error;
      }
    }

    console.log('\n🎉 Todas as migrações foram executadas com sucesso!');
  }

  /**
   * Reverte a última migração
   */
  async down() {
    const executed = await this.getExecutedMigrations();
    
    if (executed.length === 0) {
      console.log('📁 Nenhuma migração para reverter');
      return;
    }

    const lastMigration = executed[executed.length - 1];
    const migrationPath = path.join(this.migrationsDir, lastMigration);

    console.log(`🔄 Revertendo: ${lastMigration}...`);

    try {
      // Para SQL, precisamos de scripts de rollback separados
      // Neste exemplo, vamos apenas remover o registro
      await this.sequelize.query(
        `DELETE FROM "${this.migrationsTable}" WHERE "name" = :name`,
        { replacements: { name: lastMigration } }
      );

      console.log(`✅ ${lastMigration} - Revertida (registro removido)`);
      console.log('⚠️  Nota: Para rollback completo, crie scripts de reversão separados');
    } catch (error) {
      console.error(`❌ Erro ao reverter ${lastMigration}:`, error.message);
      throw error;
    }
  }

  /**
   * Cria uma nova migração
   */
  async create(name) {
    if (!name) {
      console.error('❌ Nome da migração é obrigatório');
      process.exit(1);
    }

    const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 14);
    const filename = `${timestamp}-${name.toLowerCase().replace(/\s+/g, '-')}.sql`;
    const filepath = path.join(this.migrationsDir, filename);

    const template = `-- ========================================
-- MIGRAÇÃO: ${name}
-- ========================================
-- Data: ${new Date().toISOString()}
-- Descrição: [Adicione descrição aqui]
-- ========================================

-- Comandos UP (execução)
-- ALTER TABLE "TableName" ADD COLUMN "newColumn" VARCHAR(255);

-- Comandos DOWN (reversão)
-- ALTER TABLE "TableName" DROP COLUMN "newColumn";

-- ========================================
-- FIM DA MIGRAÇÃO
-- ========================================`;

    fs.writeFileSync(filepath, template);
    console.log(`📝 Migração criada: ${filename}`);
    console.log(`📁 Caminho: ${filepath}`);
  }

  /**
   * Fecha a conexão com o banco
   */
  async close() {
    await this.sequelize.close();
  }
}

/**
 * Função principal
 */
async function main() {
  const [,, command, ...args] = process.argv;
  const runner = new MigrationRunner();

  try {
    await runner.initialize();

    switch (command) {
      case 'up':
        await runner.up();
        break;
      
      case 'down':
        await runner.down();
        break;
      
      case 'status':
        await runner.showStatus();
        break;
      
      case 'create':
        const migrationName = args[0];
        await runner.create(migrationName);
        break;
      
      default:
        console.log(`
🛠️  Gerenciador de Migrações - Sequelize ORM

Comandos disponíveis:
  node scripts/migration-runner.js up      - Executa migrações pendentes
  node scripts/migration-runner.js down    - Reverte última migração
  node scripts/migration-runner.js status  - Mostra status das migrações
  node scripts/migration-runner.js create <nome> - Cria nova migração

Exemplos:
  node scripts/migration-runner.js create add-userid-to-barbers
  node scripts/migration-runner.js up
  node scripts/migration-runner.js status
        `);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = MigrationRunner;