import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vendor = resolve(root, 'src/vendor');

await mkdir(vendor, { recursive: true });
await copyFile(resolve(root, 'node_modules/uisfx/dist/index.js'), resolve(vendor, 'uisfx.js'));

const license = await readFile(resolve(root, 'node_modules/uisfx/LICENSE'), 'utf8');
await writeFile(
  resolve(vendor, 'uisfx.LICENSE.txt'),
  `${license.trim()}\n\nGenerated UISFX audio output is CC0.\n`,
  'utf8',
);

console.log('Vendored UISFX 0.4.0 runtime and license.');
