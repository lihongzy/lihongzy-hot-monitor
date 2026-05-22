import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const tsxCli = path.join(projectRoot, 'server', 'node_modules', 'tsx', 'dist', 'cli.mjs');
const runner = path.join(__dirname, 'collect-real-samples.ts');

const result = spawnSync(process.execPath, [tsxCli, runner, ...process.argv.slice(2)], {
  cwd: __dirname,
  env: process.env,
  stdio: 'inherit'
});

process.exit(result.status ?? 1);
