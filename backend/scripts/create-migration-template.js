#!/usr/bin/env node

/**
 * Script auxiliar para criar novos arquivos de migração com template
 * Facilita a criação de migrações seguindo os padrões do projeto
 */

const fs = require('fs');
const path = require('path');

class MigrationTemplateGenerator {
  constructor() {
    this.migrationsDir = path.join(__dirname, '..', 'migrations');
  }

  generateTemplate(name, description = '') {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 14);
    const filename = `${timestamp}-${name.toLowerCase().replace(/\s+/g, '-')}.sql`;
    
    const template = `-- Migration: ${name}
-- Description: ${description}
-- Created: ${new Date().toISOString()}

-- UP: Alterações para aplicar a migração
-- Exemplo: Adicionar nova coluna
-- ALTER TABLE table_name ADD COLUMN new_column VARCHAR(255);

-- Exemplo: Criar nova tabela
-- CREATE TABLE IF NOT EXISTS new_table (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Exemplo: Criar índice
-- CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column_name);

-- Exemplo: Adicionar constraint
-- ALTER TABLE table_name ADD CONSTRAINT fk_table_reference FOREIGN KEY (column_name) REFERENCES other_table(id);

-- DOWN: Reverter as alterações (ordem inversa)
-- Exemplo: Remover constraint
-- ALTER TABLE table_name DROP CONSTRAINT IF EXISTS fk_table_reference;

-- Exemplo: Remover índice
-- DROP INDEX IF EXISTS idx_table_column;

-- Exemplo: Remover tabela
-- DROP TABLE IF EXISTS new_table;

-- Exemplo: Remover coluna
-- ALTER TABLE table_name DROP COLUMN IF EXISTS new_column;

-- UP
-- Adicione suas alterações aqui

-- DOWN  
-- Adicione suas reversões aqui
`;

    return { filename, template };
  }

  createMigration(name, description = '') {
    if (!name) {
      console.error('❌ Por favor, forneça um nome para a migração');
      console.log('   Uso: node create-migration-template.js nome-da-migracao "descrição opcional"');
      process.exit(1);
    }

    try {
      const { filename, template } = this.generateTemplate(name, description);
      const filePath = path.join(this.migrationsDir, filename);

      // Verificar se o diretório existe
      if (!fs.existsSync(this.migrationsDir)) {
        fs.mkdirSync(this.migrationsDir, { recursive: true });
      }

      // Verificar se o arquivo já existe
      if (fs.existsSync(filePath)) {
        console.error(`❌ Arquivo já existe: ${filename}`);
        process.exit(1);
      }

      // Criar arquivo
      fs.writeFileSync(filePath, template);
      
      console.log('✅ Arquivo de migração criado com sucesso!');
      console.log(`   📁 Arquivo: ${filename}`);
      console.log(`   📍 Caminho: ${filePath}`);
      console.log('');
      console.log('📋 Próximos passos:');
      console.log('   1. Edite o arquivo criado');
      console.log('   2. Adicione as instruções SQL nas seções UP e DOWN');
      console.log('   3. Teste a migração: npm run migrate:dev');
      console.log('   4. Verifique o status: npm run migrate:status');

    } catch (error) {
      console.error('❌ Erro ao criar arquivo de migração:', error.message);
      process.exit(1);
    }
  }

  listExamples() {
    console.log('📋 Exemplos de uso:');
    console.log('');
    console.log('   Criar migração simples:');
    console.log('   node scripts/create-migration-template.js add-phone-to-users');
    console.log('');
    console.log('   Criar migração com descrição:');
    console.log('   node scripts/create-migration-template.js add-phone-to-users "Adiciona campo de telefone aos usuários"');
    console.log('');
    console.log('   Criar migração complexa:');
    console.log('   node scripts/create-migration-template.js create-appointments-table "Cria tabela de agendamentos com relacionamentos"');
    console.log('');
  }
}

// Executar script
if (require.main === module) {
  const args = process.argv.slice(2);
  const generator = new MigrationTemplateGenerator();

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('📝 Gerador de Templates de Migração');
    console.log('');
    console.log('Uso: node create-migration-template.js <nome> [descrição]');
    console.log('');
    generator.listExamples();
  } else {
    const name = args[0];
    const description = args.slice(1).join(' ');
    generator.createMigration(name, description);
  }
}

module.exports = MigrationTemplateGenerator;