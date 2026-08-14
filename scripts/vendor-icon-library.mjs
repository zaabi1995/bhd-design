import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(projectRoot, 'scripts', 'icon-sources');
const outputRoot = join(projectRoot, 'src', 'icons');
const setRoot = join(outputRoot, 'sets');
const dataRoot = join(outputRoot, 'data');

const assetSources = ['tech', 'aws', 'gcp', 'azure', 'emoji'];
const sourceLabels = {
  lucide: 'Lucide',
  mood: 'BHD Mood',
  tech: 'Technology',
  aws: 'AWS',
  gcp: 'Google Cloud',
  azure: 'Microsoft Azure',
  emoji: 'Twemoji',
};

const readJson = async (name) => JSON.parse(await readFile(join(sourceRoot, `${name}.json`), 'utf8'));

const escapeAttribute = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const toSvg = (nodes) => {
  const body = nodes.map(([tag, attributes]) => {
    const attrs = Object.entries(attributes)
      .map(([key, value]) => `${key}="${escapeAttribute(value)}"`)
      .join(' ');
    return `<${tag}${attrs ? ` ${attrs}` : ''}/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;
};

const titleCase = (value) => value
  .split('-')
  .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
  .join(' ');

const exists = async (path) => {
  try {
    return (await stat(path)).size > 40;
  } catch {
    return false;
  }
};

const fetchSvg = async (source, id, destination) => {
  if (await exists(destination)) return;
  const url = `https://koboyo.com/icon-sets/${source}/${encodeURIComponent(id)}.svg`;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': 'BHD-Design-Icon-Vendor/1.0' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const svg = await response.text();
      if (!svg.trimStart().startsWith('<svg')) throw new Error('response was not SVG');
      await writeFile(destination, `${svg.trim()}\n`);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 250));
    }
  }
  throw new Error(`${source}/${id}: ${lastError?.message ?? 'download failed'}`);
};

const runPool = async (jobs, concurrency = 24) => {
  let cursor = 0;
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
      if ((index + 1) % 250 === 0) process.stdout.write(`  ${index + 1}/${jobs.length}\n`);
    }
  });
  await Promise.all(workers);
  if (failures.length) throw new Error(`Icon vendoring failed:\n${failures.slice(0, 25).join('\n')}`);
};

await mkdir(dataRoot, { recursive: true });
const catalog = [];

const lucide = await readJson('lucide');
const lucideDir = join(setRoot, 'lucide');
await mkdir(lucideDir, { recursive: true });
for (const [id, nodes] of Object.entries(lucide)) {
  await writeFile(join(lucideDir, `${id}.svg`), toSvg(nodes));
  catalog.push({ source: 'lucide', id, label: titleCase(id), keywords: [] });
}

const mood = await readJson('mood');
for (const [label, id] of mood) {
  catalog.push({ source: 'mood', id, label, keywords: ['feeling', 'rating', 'sentiment'] });
}

const jobs = [];
for (const source of assetSources) {
  const entries = await readJson(source);
  const destinationDir = join(setRoot, source);
  await mkdir(destinationDir, { recursive: true });
  for (const [label, id, keywords = []] of entries) {
    catalog.push({ source, id, label, keywords });
    jobs.push(() => fetchSvg(source, id, join(destinationDir, `${id}.svg`)));
  }
}

console.log(`Downloading ${jobs.length} licensed upstream assets`);
await runPool(jobs);

catalog.sort((a, b) => a.source.localeCompare(b.source) || a.label.localeCompare(b.label));
await writeFile(join(dataRoot, 'catalog.json'), `${JSON.stringify({
  catalogVersion: 1,
  total: catalog.length,
  sourceLabels,
  icons: catalog,
}, null, 2)}\n`);

console.log(`Icon library ready: ${catalog.length} assets`);
