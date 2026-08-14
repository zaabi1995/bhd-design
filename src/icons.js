const sourceMeta = [
  ['all', 'All collections', 138668],
  ['drawn', 'Hand-drawn', 133464],
  ['lucide', 'Lucide', 1713],
  ['emoji', 'Twemoji', 1904],
  ['azure', 'Microsoft Azure', 605],
  ['tech', 'Technology', 453],
  ['aws', 'AWS', 307],
  ['gcp', 'Google Cloud', 216],
  ['mood', 'BHD Mood', 6],
];

const drawnGroups = [
  ['all', 'All hand-drawn', 133464],
  ['face', 'Faces', 1305],
  ['mark', 'Marks', 11830],
  ['object', 'Objects', 78858],
  ['people', 'People', 39448],
  ['scene', 'Scenes', 2023],
];

const state = {
  icons: [],
  source: 'all',
  group: 'all',
  query: '',
  shown: 160,
  selected: null,
};

const els = {
  grid: document.querySelector('#icon-grid'),
  sourceList: document.querySelector('#source-list'),
  groupList: document.querySelector('#drawn-groups'),
  groupWrap: document.querySelector('#drawn-groups-wrap'),
  search: document.querySelector('#icon-search'),
  status: document.querySelector('#result-status'),
  empty: document.querySelector('#empty-state'),
  more: document.querySelector('#load-more'),
  clear: document.querySelector('#clear-filters'),
  dialog: document.querySelector('#detail-panel'),
  detailTitle: document.querySelector('#detail-title'),
  detailSource: document.querySelector('#detail-source'),
  detailImage: document.querySelector('#detail-image'),
  detailGroup: document.querySelector('#detail-group'),
  detailId: document.querySelector('#detail-id'),
  feedback: document.querySelector('#detail-feedback'),
  download: document.querySelector('#download-svg'),
};

const formatNumber = (value) => new Intl.NumberFormat('en-OM').format(value);
const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);

const shardFor = (value) => {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 2);
};

const iconUrl = (icon) => icon.source === 'drawn'
  ? `/icons/sets/drawn/${shardFor(icon.id)}/${encodeURIComponent(icon.id)}.svg`
  : `/icons/sets/${icon.source}/${encodeURIComponent(icon.id)}.svg`;

const normalizeConventional = (icon) => ({
  source: icon.source,
  id: icon.id,
  label: icon.label,
  keywords: (icon.keywords || []).join(' ').toLowerCase(),
  group: '',
  subgroup: '',
});

const normalizeDrawn = (record) => ({
  source: 'drawn',
  id: record[0],
  label: record[1],
  keywords: `${record[2] || ''} ${record[3] || ''}`.toLowerCase(),
  group: record[5] || '',
  subgroup: record[6] || '',
});

const renderFilters = () => {
  els.sourceList.innerHTML = sourceMeta.map(([id, label, count]) => `
    <button class="filter-button" type="button" data-source="${id}" aria-pressed="${state.source === id}">
      <span>${label}</span><span>${formatNumber(count)}</span>
    </button>`).join('');
  els.groupList.innerHTML = drawnGroups.map(([id, label, count]) => `
    <button class="filter-button" type="button" data-group="${id}" aria-pressed="${state.group === id}">
      <span>${label}</span><span>${formatNumber(count)}</span>
    </button>`).join('');
  els.groupWrap.hidden = state.source !== 'drawn';
};

const matches = (icon) => {
  if (state.source !== 'all' && icon.source !== state.source) return false;
  if (state.source === 'drawn' && state.group !== 'all' && icon.group !== state.group) return false;
  if (!state.query) return true;
  const terms = state.query.split(/\s+/).filter(Boolean);
  const haystack = `${icon.label} ${icon.id} ${icon.keywords} ${icon.group} ${icon.subgroup}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
};

const render = () => {
  const filtered = state.icons.filter(matches);
  const visible = filtered.slice(0, state.shown);
  const sourceLabel = sourceMeta.find(([id]) => id === state.source)?.[1] || 'All collections';
  els.status.textContent = `${formatNumber(filtered.length)} results in ${sourceLabel}`;
  els.grid.innerHTML = visible.map((icon) => `
    <button class="icon-tile" type="button" data-key="${escapeHtml(`${icon.source}:${icon.id}`)}" data-source="${icon.source}" title="${escapeHtml(icon.label)}">
      <span class="icon-preview"><img src="${iconUrl(icon)}" alt="" loading="lazy" decoding="async"></span>
      <span class="icon-name">${escapeHtml(icon.label)}</span>
      <span class="icon-source">${icon.source === 'drawn' ? icon.group : icon.source}</span>
    </button>`).join('');
  els.grid.hidden = filtered.length === 0;
  els.empty.hidden = filtered.length !== 0;
  els.more.hidden = visible.length >= filtered.length;
  if (!els.more.hidden) els.more.textContent = `Load more (${formatNumber(filtered.length - visible.length)} remaining)`;
  renderFilters();
};

const setFeedback = (message) => {
  els.feedback.textContent = message;
  window.clearTimeout(setFeedback.timer);
  setFeedback.timer = window.setTimeout(() => { els.feedback.textContent = ''; }, 2200);
};

const fetchSvg = async (icon) => {
  const response = await fetch(iconUrl(icon));
  if (!response.ok) throw new Error('SVG could not be loaded');
  return response.text();
};

const copyText = async (value, message) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('Clipboard access is unavailable');
  }
  setFeedback(message);
};

const openDetail = (icon) => {
  state.selected = icon;
  const url = iconUrl(icon);
  els.dialog.dataset.source = icon.source;
  els.detailTitle.textContent = icon.label;
  els.detailSource.textContent = sourceMeta.find(([id]) => id === icon.source)?.[1] || icon.source;
  els.detailImage.src = url;
  els.detailImage.alt = icon.label;
  els.detailGroup.textContent = [icon.group, icon.subgroup].filter(Boolean).join(' / ') || 'Vector icon';
  els.detailId.textContent = icon.id;
  els.download.href = url;
  els.download.download = `${icon.id}.svg`;
  els.dialog.showModal();
};

els.sourceList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-source]');
  if (!button) return;
  state.source = button.dataset.source;
  state.group = 'all';
  state.shown = 160;
  render();
});

els.groupList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-group]');
  if (!button) return;
  state.group = button.dataset.group;
  state.shown = 160;
  render();
});

let searchTimer;
els.search.addEventListener('input', () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    state.query = els.search.value.trim().toLowerCase();
    state.shown = 160;
    render();
  }, 120);
});

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    els.search.focus();
  }
});

els.grid.addEventListener('click', (event) => {
  const tile = event.target.closest('[data-key]');
  if (!tile) return;
  const [source, ...idParts] = tile.dataset.key.split(':');
  openDetail(state.icons.find((icon) => icon.source === source && icon.id === idParts.join(':')));
});

els.more.addEventListener('click', () => { state.shown += 320; render(); });
els.clear.addEventListener('click', () => {
  state.source = 'all';
  state.group = 'all';
  state.query = '';
  state.shown = 160;
  els.search.value = '';
  render();
});

document.querySelector('#theme-toggle').addEventListener('click', () => window.BHDTheme.toggle());
document.querySelector('#detail-close').addEventListener('click', () => els.dialog.close());
els.dialog.addEventListener('click', (event) => {
  if (event.target === els.dialog) els.dialog.close();
});

document.querySelector('#copy-svg').addEventListener('click', async () => {
  try { await copyText(await fetchSvg(state.selected), 'SVG copied to clipboard'); }
  catch (error) { setFeedback(error.message); }
});
document.querySelector('#copy-html').addEventListener('click', () => copyText(`<img src="${new URL(iconUrl(state.selected), location.origin)}" alt="${state.selected.label}">`, 'HTML copied to clipboard'));
document.querySelector('#copy-url').addEventListener('click', () => copyText(new URL(iconUrl(state.selected), location.origin).href, 'Asset URL copied to clipboard'));

const loadCatalogs = async () => {
  try {
    const [conventionalResponse, drawnResponse] = await Promise.all([
      fetch('/icons/data/catalog.json'),
      fetch('/icons/data/drawn-catalog.json'),
    ]);
    if (!conventionalResponse.ok || !drawnResponse.ok) throw new Error('A catalog file could not be loaded');
    const [conventional, drawn] = await Promise.all([conventionalResponse.json(), drawnResponse.json()]);
    state.icons = [...drawn.icons.map(normalizeDrawn), ...conventional.icons.map(normalizeConventional)];
    document.querySelector('#total-count').textContent = formatNumber(state.icons.length);
    els.grid.setAttribute('aria-busy', 'false');
    render();
  } catch (error) {
    els.status.textContent = error.message;
    els.grid.setAttribute('aria-busy', 'false');
    els.empty.hidden = false;
    els.empty.querySelector('h2').textContent = 'The library did not load';
    els.empty.querySelector('p').textContent = 'Refresh the page or try again shortly.';
  }
};

renderFilters();
els.grid.innerHTML = Array.from({ length: 40 }, () => `
  <div class="icon-tile skeleton" aria-hidden="true">
    <span class="icon-preview"><span class="skeleton-block skeleton-preview"></span></span>
    <span class="skeleton-block skeleton-name"></span>
    <span class="skeleton-block skeleton-source"></span>
  </div>`).join('');
loadCatalogs();
