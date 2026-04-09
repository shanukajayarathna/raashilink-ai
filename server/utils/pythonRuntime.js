import fs from 'node:fs';
import path from 'node:path';

export function resolvePythonCommand() {
  const projectRoot = process.cwd();
  const candidates = [
    process.env.PYTHON_BIN,
    path.resolve(projectRoot, '.venv', 'Scripts', 'python.exe'),
    path.resolve(projectRoot, '.venv', 'bin', 'python'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return process.platform === 'win32' ? 'python' : 'python3';
}
