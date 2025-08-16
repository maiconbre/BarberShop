const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando backend automaticamente...');

const backendPath = path.join(__dirname, 'backend');
const backendProcess = spawn('npm', ['start'], {
  cwd: backendPath,
  stdio: 'inherit',
  shell: true
});

backendProcess.on('error', (error) => {
  console.error('❌ Erro ao iniciar backend:', error);
});

backendProcess.on('close', (code) => {
  console.log(`🛑 Backend finalizado com código: ${code}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Parando backend...');
  backendProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Parando backend...');
  backendProcess.kill('SIGTERM');
  process.exit(0);
});