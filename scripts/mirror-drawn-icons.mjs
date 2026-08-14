import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(projectRoot, 'src', 'icons', 'data', 'drawn-catalog.json');
const outputRoot = process.env.BHD_DRAWN_OUTPUT;
const concurrency = Number(process.env.BHD_DRAWN_CONCURRENCY || 64);

if (!outputRoot) {
  throw new Error('Set BHD_DRAWN_OUTPUT to the directory that will hold the mirrored SVG files.');
}

const shardFor = (value) => {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 2);
};

const exists = async (path) => {
  try {
    return (await stat(path)).size > 40;
  } catch {
    return false;
  }
};

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const jobs = catalog.icons.map((record) => async () => {
  const id = record[0];
  const destinationDir = join(outputRoot, shardFor(id));
  const destination = join(destinationDir, `${id}.svg`);
  if (await exists(destination)) return;

  await mkdir(destinationDir, { recursive: true });
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(`https://koboyo.com/icons/svg/${encodeURIComponent(id)}.svg`, {
        headers: { 'user-agent': 'BHD-Design-Icon-Mirror/1.0' },
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const svg = await response.text();
      if (!svg.trimStart().startsWith('<svg')) throw new Error('response was not SVG');
      await writeFile(destination, `${svg.trim()}\n`);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 300));
    }
  }
  throw new Error(`${id}: ${lastError?.message ?? 'download failed'}`);
});

let cursor = 0;
let completed = 0;
const failures = [];
const workers = Array.from({ length: concurrency }, async () => {
  while (cursor < jobs.length) {
    const index = cursor;
    cursor += 1;
    try {
      await jobs[index]();
    } catch (error) {
      failures.push(error.message);
    }
    completed += 1;
    if (completed % 1000 === 0 || completed === jobs.length) {
      process.stdout.write(`${completed}/${jobs.length}\n`);
    }
  }
});

await Promise.all(workers);
if (failures.length) {
  throw new Error(`Mirror completed with ${failures.length} failures:\n${failures.slice(0, 50).join('\n')}`);
}

console.log(`Mirrored ${completed} hand-drawn SVG files to ${outputRoot}`);
