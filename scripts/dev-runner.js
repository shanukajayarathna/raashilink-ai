import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import path from 'node:path';

const isWindows = process.platform === 'win32';
const WATCH_WARMUP_MS = 3000;
const SERVER_WATCH_EXTENSIONS = new Set(['.js', '.json']);
const API_HEALTH_URL = process.env.DEV_API_HEALTH_URL || 'http://127.0.0.1:5000/api/v1/health';
const API_READY_TIMEOUT_MS = 30000;
const API_READY_POLL_MS = 500;

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

function run(name, scriptName, color) {
  let child;
  let isRestarting = false;

  function spawnChild() {
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
        spawnChild();
      }, 300);
    });
  }

  spawnChild();

  return { child: () => child, restart };
}

async function getApiStatus() {
  try {
    const response = await fetch(API_HEALTH_URL);
    const payload = await response.json().catch(() => null);

    return {
      reachable: response.ok,
      ready: response.ok && payload?.ready !== false,
    };
  } catch {
    return {
      reachable: false,
      ready: false,
    };
  }
}

async function waitForApiReady() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < API_READY_TIMEOUT_MS) {
    const status = await getApiStatus();
    if (status.ready) {
      process.stdout.write(`\x1b[33m[api] Ready at ${API_HEALTH_URL}\x1b[0m\n`);
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, API_READY_POLL_MS));
  }

  process.stderr.write(`\x1b[33m[api] Readiness check timed out after ${API_READY_TIMEOUT_MS}ms.\x1b[0m\n`);
  return false;
}

let apiRunner;
const initialApiStatus = await getApiStatus();
if (initialApiStatus.reachable) {
  process.stdout.write(`\x1b[33m[api] Reusing existing API server at ${API_HEALTH_URL}\x1b[0m\n`);
  apiRunner = {
    child: () => null,
    restart: () => {
      process.stdout.write(`\x1b[33m[api] Existing API server is managed outside this terminal.\x1b[0m\n`);
    },
  };
} else {
  apiRunner = run('api', 'dev:api', '\x1b[33m');
}

const webRunner = run('web', 'dev:web', '\x1b[36m');
void waitForApiReady();
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
