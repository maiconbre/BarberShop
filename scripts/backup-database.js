#!/usr/bin/env node

/**
 * Script de Backup do Banco de Dados
 * 
 * Realiza backup automático do banco PostgreSQL em produção
 * com compressão e upload para storage seguro.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configurações
const config = {
  database: {
    url: process.env.DATABASE_URL,
    name: process.env.DB_NAME || 'barbershop_saas'
  },
  backup: {
    directory: process.env.BACKUP_DIR || './backups',
    retention: parseInt(process.env.BACKUP_RETENTION_DAYS) || 7,
    compress: process.env.BACKUP_COMPRESS !== 'false'
  },
  storage: {
    type: process.env.BACKUP_STORAGE_TYPE || 'local', // local, s3, supabase
    bucket: process.env.BACKUP_STORAGE_BUCKET,
    accessKey: process.env.BACKUP_STORAGE_ACCESS_KEY,
    secretKey: process.env.BACKUP_STORAGE_SECRET_KEY
  }
};

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function generateBackupFilename() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const extension = config.backup.compress ? '.sql.gz' : '.sql';
  return `backup-${config.database.name}-${timestamp}${extension}`;
}

async function ensureBackupDirectory() {
  try {
    if (!fs.existsSync(config.backup.directory)) {
      fs.mkdirSync(config.backup.directory, { recursive: true });
      log(`Created backup directory: ${config.backup.directory}`, 'blue');
    }
  } catch (error) {
    throw new Error(`Failed to create backup directory: ${error.message}`);
  }
}

async function createDatabaseBackup() {
  log('Starting database backup...', 'blue');
  
  if (!config.database.url) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  const filename = generateBackupFilename();
  const filepath = path.join(config.backup.directory, filename);
  
  try {
    let command;
    
    if (config.backup.compress) {
      // Backup com compressão
      command = `pg_dump "${config.database.url}" | gzip > "${filepath}"`;
    } else {
      // Backup sem compressão
      command = `pg_dump "${config.database.url}" > "${filepath}"`;
    }
    
    log(`Executing backup command...`, 'blue');
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('NOTICE')) {
      log(`Backup warnings: ${stderr}`, 'yellow');
    }
    
    // Verificar se o arquivo foi criado
    if (!fs.existsSync(filepath)) {
      throw new Error('Backup file was not created');
    }
    
    const stats = fs.statSync(filepath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    log(`✅ Backup created successfully: ${filename} (${sizeInMB} MB)`, 'green');
    
    return {
      filename,
      filepath,
      size: stats.size,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    throw new Error(`Database backup failed: ${error.message}`);
  }
}

async function uploadToStorage(backupInfo) {
  if (config.storage.type === 'local') {
    log('Using local storage, skipping upload', 'blue');
    return backupInfo;
  }
  
  log(`Uploading backup to ${config.storage.type} storage...`, 'blue');
  
  try {
    switch (config.storage.type) {
      case 's3':
        return await uploadToS3(backupInfo);
      case 'supabase':
        return await uploadToSupabase(backupInfo);
      default:
        throw new Error(`Unsupported storage type: ${config.storage.type}`);
    }
  } catch (error) {
    log(`Upload failed: ${error.message}`, 'red');
    log('Backup will remain in local storage', 'yellow');
    return backupInfo;
  }
}

async function uploadToS3(backupInfo) {
  // Implementação para AWS S3
  // Requer: npm install aws-sdk
  
  log('S3 upload not implemented yet', 'yellow');
  return backupInfo;
}

async function uploadToSupabase(backupInfo) {
  // Implementação para Supabase Storage
  // Requer: @supabase/supabase-js
  
  log('Supabase upload not implemented yet', 'yellow');
  return backupInfo;
}

async function cleanupOldBackups() {
  log('Cleaning up old backups...', 'blue');
  
  try {
    const files = fs.readdirSync(config.backup.directory);
    const backupFiles = files
      .filter(file => file.startsWith('backup-') && (file.endsWith('.sql') || file.endsWith('.sql.gz')))
      .map(file => {
        const filepath = path.join(config.backup.directory, file);
        const stats = fs.statSync(filepath);
        return {
          name: file,
          path: filepath,
          created: stats.birthtime
        };
      })
      .sort((a, b) => b.created - a.created); // Mais recentes primeiro
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.backup.retention);
    
    let deletedCount = 0;
    
    for (const file of backupFiles) {
      if (file.created < cutoffDate) {
        try {
          fs.unlinkSync(file.path);
          log(`Deleted old backup: ${file.name}`, 'blue');
          deletedCount++;
        } catch (error) {
          log(`Failed to delete ${file.name}: ${error.message}`, 'yellow');
        }
      }
    }
    
    if (deletedCount > 0) {
      log(`✅ Cleaned up ${deletedCount} old backup(s)`, 'green');
    } else {
      log('No old backups to clean up', 'blue');
    }
    
  } catch (error) {
    log(`Cleanup failed: ${error.message}`, 'yellow');
  }
}

async function verifyBackup(backupInfo) {
  log('Verifying backup integrity...', 'blue');
  
  try {
    // Verificar se o arquivo existe e tem tamanho > 0
    if (!fs.existsSync(backupInfo.filepath)) {
      throw new Error('Backup file does not exist');
    }
    
    const stats = fs.statSync(backupInfo.filepath);
    if (stats.size === 0) {
      throw new Error('Backup file is empty');
    }
    
    // Para backups comprimidos, verificar se o gzip é válido
    if (config.backup.compress && backupInfo.filename.endsWith('.gz')) {
      try {
        await execAsync(`gzip -t "${backupInfo.filepath}"`);
        log('✅ Compressed backup integrity verified', 'green');
      } catch (error) {
        throw new Error('Compressed backup is corrupted');
      }
    }
    
    // Verificar se o SQL é válido (teste básico)
    let testCommand;
    if (config.backup.compress) {
      testCommand = `zcat "${backupInfo.filepath}" | head -10 | grep -q "PostgreSQL database dump"`;
    } else {
      testCommand = `head -10 "${backupInfo.filepath}" | grep -q "PostgreSQL database dump"`;
    }
    
    try {
      await execAsync(testCommand);
      log('✅ Backup content verified', 'green');
    } catch (error) {
      log('⚠️  Could not verify backup content format', 'yellow');
    }
    
    return true;
    
  } catch (error) {
    throw new Error(`Backup verification failed: ${error.message}`);
  }
}

async function generateBackupReport(backupInfo) {
  const report = {
    timestamp: backupInfo.timestamp,
    filename: backupInfo.filename,
    size: backupInfo.size,
    sizeFormatted: `${(backupInfo.size / (1024 * 1024)).toFixed(2)} MB`,
    compressed: config.backup.compress,
    storage: config.storage.type,
    retention: `${config.backup.retention} days`,
    status: 'success'
  };
  
  // Salvar relatório
  const reportPath = path.join(config.backup.directory, 'backup-report.json');
  
  let reports = [];
  if (fs.existsSync(reportPath)) {
    try {
      reports = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    } catch (error) {
      log('Could not read existing reports', 'yellow');
    }
  }
  
  reports.unshift(report);
  
  // Manter apenas os últimos 30 relatórios
  if (reports.length > 30) {
    reports = reports.slice(0, 30);
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2));
  
  log('✅ Backup report generated', 'green');
  return report;
}

async function main() {
  log('🗄️  Database Backup Starting...', 'blue');
  
  try {
    // Verificar dependências
    try {
      await execAsync('pg_dump --version');
    } catch (error) {
      throw new Error('pg_dump is not installed or not in PATH');
    }
    
    // Executar backup
    await ensureBackupDirectory();
    const backupInfo = await createDatabaseBackup();
    await verifyBackup(backupInfo);
    await uploadToStorage(backupInfo);
    await cleanupOldBackups();
    const report = await generateBackupReport(backupInfo);
    
    log('🎉 Backup completed successfully!', 'green');
    log(`Backup file: ${report.filename}`, 'green');
    log(`Size: ${report.sizeFormatted}`, 'green');
    
    process.exit(0);
    
  } catch (error) {
    log(`❌ Backup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n⏹️  Backup interrupted', 'yellow');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('\n⏹️  Backup terminated', 'yellow');
  process.exit(143);
});

// Run the backup
if (require.main === module) {
  main().catch((error) => {
    log(`❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  createDatabaseBackup,
  uploadToStorage,
  cleanupOldBackups,
  verifyBackup
};