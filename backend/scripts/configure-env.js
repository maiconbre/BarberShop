#!/usr/bin/env node

/**
 * Script de configuração de ambiente para resolver erro de autenticação
 * Detecta automaticamente a melhor configuração e ajusta o .env
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

class EnvConfigurator {
  constructor() {
    this.envPath = path.join(__dirname, '..', '.env');
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async configure() {
    console.log('🔧 Configurador de Ambiente PostgreSQL\n');

    try {
      // 1. Detectar PostgreSQL local
      const localConfig = await this.detectLocalPostgreSQL();
      
      // 2. Perguntar ao usuário qual configuração usar
      const config = await this.askConfiguration(localConfig);
      
      // 3. Atualizar arquivo .env
      await this.updateEnvFile(config);
      
      // 4. Testar conexão
      await this.testConnection(config);

      console.log('\n✅ Configuração concluída com sucesso!');
      console.log('\n📋 Próximos passos:');
      console.log('   npm run migrate:status');
      console.log('   npm run migrate:dev');

    } catch (error) {
      console.error('❌ Erro durante configuração:', error.message);
    } finally {
      this.rl.close();
    }
  }

  async detectLocalPostgreSQL() {
    console.log('🔍 Detectando PostgreSQL local...');
    
    const config = {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'barbershop',
      available: false
    };

    try {
      // Verificar se PostgreSQL está rodando
      const netstat = execSync('netstat -an | findstr :5432', { encoding: 'utf8' });
      if (netstat.includes('LISTENING')) {
        console.log('   ✅ PostgreSQL detectado na porta 5432');
        config.available = true;
      }
    } catch (error) {
      console.log('   ⚠️  PostgreSQL não detectado na porta 5432');
    }

    // Testar diferentes senhas comuns
    const commonPasswords = ['postgres', 'password', 'root', 'admin', '123456'];
    
    for (const pwd of commonPasswords) {
      try {
        const { Client } = require('pg');
        const client = new Client({
          host: config.host,
          port: config.port,
          user: config.user,
          password: pwd,
          database: 'postgres'
        });

        await client.connect();
        await client.end();
        
        console.log(`   ✅ Senha padrão encontrada: ${pwd}`);
        config.password = pwd;
        return config;
      } catch (error) {
        // Continuar tentando
      }
    }

    return config;
  }

  askConfiguration(localConfig) {
    return new Promise((resolve) => {
      console.log('\n📋 Opções de configuração:');
      console.log('');
      
      if (localConfig.available) {
        console.log('1. PostgreSQL Local (recomendado para desenvolvimento)');
        console.log(`   Host: ${localConfig.host}:${localConfig.port}`);
        console.log(`   User: ${localConfig.user}`);
        console.log(`   Password: ${localConfig.password}`);
        console.log('   Database: barbershop');
        console.log('');
      }
      
      console.log('2. Supabase (configuração existente)');
      console.log('   Usar configuração do arquivo .env atual');
      console.log('');
      
      console.log('3. Configuração personalizada');
      console.log('   Definir manualmente host, porta, usuário e senha');
      console.log('');

      this.rl.question('Escolha uma opção (1/2/3): ', (choice) => {
        switch (choice.trim()) {
          case '1':
            if (localConfig.available) {
              resolve(localConfig);
            } else {
              console.log('❌ PostgreSQL local não disponível');
              this.askConfiguration(localConfig).then(resolve);
            }
            break;
          case '2':
            resolve({ useSupabase: true });
            break;
          case '3':
            this.askCustomConfig().then(resolve);
            break;
          default:
            console.log('❌ Opção inválida');
            this.askConfiguration(localConfig).then(resolve);
        }
      });
    });
  }

  askCustomConfig() {
    return new Promise((resolve) => {
      const config = {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        database: 'barbershop'
      };

      this.rl.question(`Host (${config.host}): `, (host) => {
        config.host = host || config.host;
        
        this.rl.question(`Porta (${config.port}): `, (port) => {
          config.port = parseInt(port) || config.port;
          
          this.rl.question(`Usuário (${config.user}): `, (user) => {
            config.user = user || config.user;
            
            this.rl.question(`Senha (${config.password}): `, (password) => {
              config.password = password || config.password;
              
              this.rl.question(`Database (${config.database}): `, (database) => {
                config.database = database || config.database;
                resolve(config);
              });
            });
          });
        });
      });
    });
  }

  async updateEnvFile(config) {
    console.log('\n📝 Atualizando arquivo .env...');
    
    let envContent = fs.readFileSync(this.envPath, 'utf8');
    
    if (config.useSupabase) {
      console.log('   ✅ Mantendo configuração Supabase existente');
      return;
    }

    // Atualizar para configuração local
    const newContent = `# Configuração para desenvolvimento local
NODE_ENV=development

# PostgreSQL local
DB_HOST=${config.host}
DB_PORT=${config.port}
DB_USER=${config.user}
DB_PASSWORD=${config.password}
DB_NAME=${config.database}

# Configuração alternativa (mantida para referência)
# DATABASE_URL=postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}

# JWT configuration
JWT_SECRET=dev_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=1d

# Refresh token configuration
REFRESH_TOKEN_SECRET=dev_refresh_secret_key_change_in_production
REFRESH_TOKEN_EXPIRES_IN=7d

# Server configuration
PORT=8000
HOST=localhost

# Enable SQL logs for development
ENABLE_SQL_LOGS=true

# Desabilitar SSL para desenvolvimento local
DB_SSL=false

# Mantendo configurações Supabase originais (comentadas)
# VITE_SUPABASE_URL=https://xxxsgvqbnkftoswascds.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHNndnFibmtmdG9zd2FzY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3Mjg5NzcsImV4cCI6MjA1NTMwNDk3N30.QWACVgK6VF_XlNRPfeiyBLDLGUj3LmRT8tUj52rh-HQ
# SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHNndnFibmtmdG9zd2FzY2RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTcyODk3NywiZXhwIjoyMDU1MzA0OTc3fQ.8wGxTfqq7qYEaNqfQJ83idUqJyKhAWgWIhj6_g3F_UQ
`;

    fs.writeFileSync(this.envPath, newContent);
    console.log('   ✅ Arquivo .env atualizado com configuração local');
  }

  async testConnection(config) {
    console.log('\n🔗 Testando conexão...');
    
    try {
      if (config.useSupabase) {
        console.log('   ✅ Usando configuração Supabase - não testado automaticamente');
        return;
      }

      const { Client } = require('pg');
      const client = new Client({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database
      });

      await client.connect();
      console.log('   ✅ Conexão estabelecida com sucesso!');
      
      const result = await client.query('SELECT version()');
      console.log(`   📊 PostgreSQL: ${result.rows[0].version.split(' ')[1]}`);
      
      await client.end();
    } catch (error) {
      console.error('   ❌ Falha na conexão:', error.message);
      console.log('\n💡 Verifique:');
      console.log('   - PostgreSQL está rodando');
      console.log('   - Credenciais estão corretas');
      console.log('   - Firewall permite conexão');
    }
  }
}

// Executar configuração
if (require.main === module) {
  const configurator = new EnvConfigurator();
  configurator.configure();
}

module.exports = EnvConfigurator;