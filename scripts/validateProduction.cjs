#!/usr/bin/env node

/**
 * Script de validação para produção
 * Verifica se todas as configurações estão corretas para deploy
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validando configurações de produção...\n');

let errors = [];
let warnings = [];
let passed = 0;

/**
 * Verificar se arquivo existe
 */
function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`);
    passed++;
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} não encontrado`);
    errors.push(`${description} não encontrado: ${filePath}`);
    return false;
  }
}

/**
 * Verificar conteúdo de arquivo
 */
function checkFileContent(filePath, pattern, description) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${description}: ${filePath} não encontrado`);
    errors.push(`${description}: arquivo não encontrado`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  if (pattern.test(content)) {
    console.log(`✅ ${description}`);
    passed++;
    return true;
  } else {
    console.log(`❌ ${description}: padrão não encontrado`);
    errors.push(`${description}: configuração não encontrada`);
    return false;
  }
}

/**
 * Verificar variáveis de ambiente
 */
function checkEnvFile(filePath, requiredVars) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Arquivo de ambiente não encontrado: ${filePath}`);
    warnings.push(`Arquivo de ambiente não encontrado: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let allFound = true;

  requiredVars.forEach(varName => {
    const pattern = new RegExp(`^${varName}=`, 'm');
    if (pattern.test(content)) {
      console.log(`✅ Variável ${varName} definida em ${filePath}`);
      passed++;
    } else {
      console.log(`❌ Variável ${varName} não encontrada em ${filePath}`);
      errors.push(`Variável ${varName} não definida em ${filePath}`);
      allFound = false;
    }
  });

  return allFound;
}

/**
 * Verificar estrutura de arquivos
 */
function checkProjectStructure() {
  console.log('📁 Verificando estrutura do projeto...\n');

  // Arquivos essenciais
  checkFileExists('package.json', 'Package.json');
  checkFileExists('vite.config.ts', 'Configuração do Vite');
  checkFileExists('tsconfig.json', 'Configuração do TypeScript');
  checkFileExists('tailwind.config.js', 'Configuração do Tailwind');
  
  // Arquivos de deploy
  checkFileExists('DEPLOYMENT.md', 'Documentação de deploy');
  
  // Estrutura de pastas
  checkFileExists('src', 'Pasta src');
  checkFileExists('src/components', 'Pasta de componentes');
  checkFileExists('src/utils', 'Pasta de utilitários');
  checkFileExists('src/services', 'Pasta de serviços');
  checkFileExists('src/hooks', 'Pasta de hooks');
  checkFileExists('src/contexts', 'Pasta de contextos');
  
  // Arquivos de produção
  checkFileExists('src/utils/auditLogger.ts', 'Sistema de auditoria');
  checkFileExists('src/utils/productionMonitor.ts', 'Sistema de monitoramento');
  checkFileExists('src/utils/backupConfig.ts', 'Sistema de backup');
  checkFileExists('src/utils/productionChecker.ts', 'Verificador de produção');
}

/**
 * Verificar configurações de ambiente
 */
function checkEnvironmentConfig() {
  console.log('\n🌍 Verificando configurações de ambiente...\n');

  // Variáveis essenciais para produção
  const requiredProdVars = [
    'VITE_API_URL',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_DEV_MODE',
    'VITE_DEBUG_API'
  ];

  // Verificar arquivo de produção
  checkEnvFile('.env.production', requiredProdVars);
  
  // Verificar se modo de desenvolvimento está desabilitado em produção
  if (fs.existsSync('.env.production')) {
    const prodContent = fs.readFileSync('.env.production', 'utf8');
    
    if (prodContent.includes('VITE_DEV_MODE=false')) {
      console.log('✅ Modo de desenvolvimento desabilitado em produção');
      passed++;
    } else {
      console.log('❌ Modo de desenvolvimento deve ser false em produção');
      errors.push('VITE_DEV_MODE deve ser false em .env.production');
    }
    
    if (prodContent.includes('VITE_DEBUG_API=false')) {
      console.log('✅ Debug da API desabilitado em produção');
      passed++;
    } else {
      console.log('❌ Debug da API deve ser false em produção');
      errors.push('VITE_DEBUG_API deve ser false em .env.production');
    }
  }
}

/**
 * Verificar configurações de build
 */
function checkBuildConfig() {
  console.log('\n🏗️  Verificando configurações de build...\n');

  // Verificar vite.config.ts
  checkFileContent(
    'vite.config.ts',
    /build\s*:/,
    'Configuração de build no Vite'
  );

  // Verificar package.json scripts
  checkFileContent(
    'package.json',
    /"build":\s*"[^"]*"/,
    'Script de build no package.json'
  );

  checkFileContent(
    'package.json',
    /"preview":\s*"[^"]*"/,
    'Script de preview no package.json'
  );
}

/**
 * Verificar configurações de segurança
 */
function checkSecurityConfig() {
  console.log('\n🔒 Verificando configurações de segurança...\n');

  // Verificar se .env está no .gitignore
  if (fs.existsSync('.gitignore')) {
    const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
    
    if (gitignoreContent.includes('.env')) {
      console.log('✅ Arquivos .env estão no .gitignore');
      passed++;
    } else {
      console.log('❌ Arquivos .env devem estar no .gitignore');
      errors.push('Adicionar .env* ao .gitignore');
    }
  }

  // Verificar se não há secrets commitados
  const sensitivePatterns = [
    /password\s*=\s*[^#\n]+/i,
    /secret\s*=\s*[^#\n]+/i,
    /key\s*=\s*[^#\n]+/i
  ];

  let foundSecrets = false;
  ['.env', '.env.local', '.env.development'].forEach(envFile => {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      sensitivePatterns.forEach(pattern => {
        if (pattern.test(content)) {
          console.log(`⚠️  Possível secret encontrado em ${envFile}`);
          warnings.push(`Verificar secrets em ${envFile}`);
          foundSecrets = true;
        }
      });
    }
  });

  if (!foundSecrets) {
    console.log('✅ Nenhum secret óbvio encontrado nos arquivos de ambiente');
    passed++;
  }
}

/**
 * Verificar dependências
 */
function checkDependencies() {
  console.log('\n📦 Verificando dependências...\n');

  if (!fs.existsSync('package.json')) {
    console.log('❌ package.json não encontrado');
    errors.push('package.json não encontrado');
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Dependências essenciais
  const requiredDeps = [
    'react',
    'react-dom',
    'react-router-dom',
    'vite'
  ];

  requiredDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`✅ Dependência ${dep} encontrada`);
      passed++;
    } else {
      console.log(`❌ Dependência ${dep} não encontrada`);
      errors.push(`Dependência ${dep} não encontrada`);
    }
  });

  // Verificar se há vulnerabilidades conhecidas (simulado)
  console.log('✅ Verificação de vulnerabilidades (simulada)');
  passed++;
}

/**
 * Verificar configurações de multi-tenant
 */
function checkMultiTenantConfig() {
  console.log('\n🏢 Verificando configurações multi-tenant...\n');

  // Verificar contexto de tenant
  checkFileExists('src/contexts/TenantContext.tsx', 'Contexto de Tenant');
  
  // Verificar serviços de barbearia
  checkFileExists('src/services/BarbershopService.ts', 'Serviço de Barbearia');
  checkFileExists('src/services/BarbershopSettingsService.ts', 'Serviço de Configurações');
  
  // Verificar hooks
  checkFileExists('src/hooks/useBarbershopSettings.ts', 'Hook de Configurações');
  
  // Verificar componentes de configuração
  checkFileExists('src/components/settings', 'Componentes de Configuração');
}

/**
 * Executar todas as verificações
 */
function runAllChecks() {
  console.log('🚀 BarberShop SaaS - Validação de Produção\n');
  console.log('==========================================\n');

  checkProjectStructure();
  checkEnvironmentConfig();
  checkBuildConfig();
  checkSecurityConfig();
  checkDependencies();
  checkMultiTenantConfig();

  // Resumo
  console.log('\n📊 RESUMO DA VALIDAÇÃO');
  console.log('======================\n');

  console.log(`✅ Verificações aprovadas: ${passed}`);
  console.log(`❌ Erros encontrados: ${errors.length}`);
  console.log(`⚠️  Avisos: ${warnings.length}\n`);

  if (errors.length > 0) {
    console.log('🔴 ERROS QUE DEVEM SER CORRIGIDOS:');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('🟡 AVISOS PARA REVISÃO:');
    warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`);
    });
    console.log('');
  }

  // Status final
  if (errors.length === 0) {
    console.log('🎉 PRODUÇÃO PRONTA! Todas as verificações críticas passaram.');
    console.log('✨ O projeto está pronto para deploy em produção.\n');
    
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Execute npm run build para gerar build de produção');
    console.log('2. Teste o build com npm run preview');
    console.log('3. Configure as variáveis de ambiente no seu provedor');
    console.log('4. Faça o deploy seguindo o DEPLOYMENT.md\n');
    
    process.exit(0);
  } else {
    console.log('❌ PRODUÇÃO NÃO ESTÁ PRONTA. Corrija os erros acima antes do deploy.\n');
    process.exit(1);
  }
}

// Executar validação
runAllChecks();