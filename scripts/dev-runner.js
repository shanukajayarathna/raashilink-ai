import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import path from 'node:path';

const isWindows = process.platform === 'win32';
const WATCH_WARMUP_MS = 3000;
const SERVER_WATCH_EXTENSIONS = new Set(['.js', '.json']);

function shouldRestartServer(filename = '') {
  const normalized = String(filename).replaceAll('\\', '/');

  if (!normalized) {
    return false;
  }

  if (
    normalized.startsWith('python/ephe/') ||
    normalized.startsWith('python/recommendation/')
  ) {
    return false;
  }

  return SERVER_WATCH_EXTENSIONS.has(path.extname(normalized));
}

function createCommand(scriptName) {
  if (isWindows) {
    return {
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', `npm run ${scriptName}`],
    };
  }

  return {
    command: 'npm',
    args: ['run', scriptName],
  };
}

function stopChildProcess(child, onDone = () => {}) {
  if (!child || child.killed) {
    onDone();
    return;
  }

  if (isWindows) {
    const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
      stdio: 'ignore',
      shell: false,
    });

    killer.on('exit', () => onDone());
    killer.on('error', () => onDone());
    return;
  }

  child.kill('SIGTERM');
  setTimeout(() => {
    if (!child.killed) child.kill('SIGKILL');
    onDone();
  }, 1500);
}

function run(name, scriptName, color, autoRestart = true) {
  let child;
  let isRestarting = false;

  function spawn_child() {
    const { command, args } = createCommand(scriptName);

    child = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
      env: process.env,
    });

    child.stdout.on('data', (chunk) => {
      process.stdout.write(`${color}[${name}] ${chunk}\x1b[0m`);
    });

    child.stderr.on('data', (chunk) => {
      process.stderr.write(`${color}[${name}] ${chunk}\x1b[0m`);
    });

    child.on('exit', (code) => {
      if (isRestarting) return;
      if (code && code !== 0) {
        process.stderr.write(`${color}[${name}] Process exited with code ${code}\x1b[0m\n`);
      }
    });

    child.on('error', (error) => {
      process.stderr.write(`${color}[${name}] Failed to start: ${error.message}\x1b[0m\n`);
    });
  }

  function restart() {
    if (isRestarting) return;
    isRestarting = true;

    process.stdout.write(`${color}[${name}] Restarting...\x1b[0m\n`);

    stopChildProcess(child, () => {
      setTimeout(() => {
        isRestarting = false;
        spawn_child();
      }, 300);
    });
  }

  spawn_child();

  return { child: () => child, restart };
}

const webRunner = run('web', 'dev:web', '\x1b[36m');
const apiRunner = run('api', 'dev:api', '\x1b[33m');
let serverWatchReady = false;
let restartTimer;

setTimeout(() => {
  serverWatchReady = true;
}, WATCH_WARMUP_MS);

const serverWatcher = watch('server', { recursive: true }, (_eventType, filename) => {
  if (!serverWatchReady || !shouldRestartServer(filename)) {
    return;
  }

  clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    apiRunner.restart();
  }, 250);
});

function shutdown() {
  clearTimeout(restartTimer);
  serverWatcher.close();

  const web = webRunner.child();
  const api = apiRunner.child();

  stopChildProcess(web);
  stopChildProcess(api);
}

process.on('SIGINT', () => {
  shutdown();
  setTimeout(() => process.exit(0), 1000);
});

process.on('SIGTERM', () => {
  shutdown();
  setTimeout(() => process.exit(0), 1000);
});
