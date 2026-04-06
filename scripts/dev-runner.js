import { spawn } from 'node:child_process';

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

function run(name, scriptName, color) {
  const { command, args } = createCommand(scriptName);

  const child = spawn(command, args, {
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
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  child.on('error', (error) => {
    process.stderr.write(`${color}[${name}] Failed to start: ${error.message}\x1b[0m\n`);
    process.exitCode = 1;
  });

  return child;
}

const web = run('web', 'dev:web', '\x1b[36m');
const api = run('api', 'dev:api', '\x1b[33m');

function shutdown() {
  if (!web.killed) {
    web.kill();
  }

  if (!api.killed) {
    api.kill();
  }
}

process.on('SIGINT', () => {
  shutdown();
  process.exit();
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit();
});
