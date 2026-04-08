// Post-build: mark the CLI entry executable on POSIX systems.
// On Windows this is a no-op — the npm `bin` field handles shim generation.
import { chmodSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const binPath = resolve(__dirname, '..', 'dist', 'cli.js');

if (process.platform === 'win32') {
  process.exit(0);
}

if (!existsSync(binPath)) {
  console.error('[chmod-bin] %s not found — did tsup build succeed?', binPath);
  process.exit(1);
}

try {
  chmodSync(binPath, 0o755);
} catch (err) {
  console.error('[chmod-bin] failed to chmod %s: %s', binPath, err);
  process.exit(1);
}
