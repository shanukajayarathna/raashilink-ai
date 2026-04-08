import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import path from 'node:path';

const isWindows = process.platform === 'win32';

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

    if (child && !child.killed) {
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) child.kill('SIGKILL');
        setTimeout(() => {
          isRestarting = false;
          spawn_child();
        }, 500);
      }, 2000);
    } else {
      setTimeout(() => {
        isRestarting = false;
        spawn_child();
      }, 500);
    }
  }

  spawn_child();

  return { child: () => child, restart };
}

const webRunner = run('web', 'dev:web', '\x1b[36m');
const apiRunner = run('api', 'dev:api', '\x1b[33m');

// Watch for backend changes and restart API
const serverWatcher = watch('server', { recursive: true }, (eventType, filename) => {
  if (filename && (filename.endsWith('.js') || filename.endsWith('.json'))) {
    // Debounce: wait 500ms before restarting
    clearTimeout(serverWatcher._timeout);
    serverWatcher._timeout = setTimeout(() => {
      apiRunner.restart();
    }, 500);
  }
});

// Watch for frontend changes - Vite handles hot reload automatically
// Just ensure the process stays alive
const srcWatcher = watch('src', { recursive: true }, (eventType, filename) => {
  if (filename && (filename.endsWith('.tsx') || filename.endsWith('.ts'))) {
    // Vite's HMR will handle this, so we don't need to restart
    // Just log to show we're watching
  }
});

function shutdown() {
  clearTimeout(serverWatcher._timeout);
  serverWatcher.close();
  srcWatcher.close();

  const web = webRunner.child();
  const api = apiRunner.child();

  if (web && !web.killed) {
    web.kill('SIGTERM');
    setTimeout(() => {
      if (!web.killed) web.kill('SIGKILL');
    }, 2000);
  }

  if (api && !api.killed) {
    api.kill('SIGTERM');
    setTimeout(() => {
      if (!api.killed) api.kill('SIGKILL');
    }, 2000);
  }
}

process.on('SIGINT', () => {
  shutdown();
  setTimeout(() => process.exit(0), 1000);
});

process.on('SIGTERM', () => {
  shutdown();
  setTimeout(() => process.exit(0), 1000);
});
