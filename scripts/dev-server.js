const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const host = process.env.HOST || '127.0.0.1';
const port = process.env.PORT || '8000';
const sessionDirectory = path.join(os.tmpdir(), 'gbi-getsemani-sessions');
fs.mkdirSync(sessionDirectory, { recursive: true });

function findPhp() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;

  if (process.platform === 'win32') {
    const xamppPhp = path.join(process.env.SystemDrive || 'C:', 'xampp', 'php', 'php.exe');
    if (fs.existsSync(xamppPhp)) return xamppPhp;
  }

  return 'php';
}

const php = findPhp();
const server = spawn(php, ['-d', `session.save_path=${sessionDirectory}`, '-S', `${host}:${port}`, '-t', projectRoot], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: false,
});

server.on('error', (error) => {
  if (error.code === 'ENOENT') {
    console.error('PHP tidak ditemukan. Instal XAMPP atau tambahkan PHP ke PATH.');
    console.error('Jika lokasi PHP berbeda, jalankan dengan PHP_BIN="C:\\path\\php.exe" npm run dev.');
  } else {
    console.error(`Gagal menjalankan PHP: ${error.message}`);
  }
  process.exitCode = 1;
});

server.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Server PHP berhenti karena signal ${signal}.`);
    process.exitCode = 1;
  } else {
    process.exitCode = code ?? 1;
  }
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill(signal));
}
