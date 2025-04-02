const { spawn } = require('child_process');

const app = spawn('node', ['--dns-result-order=ipv4first', 'server.js'], {
  env: { ...process.env },
  stdio: 'inherit'
});

app.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
