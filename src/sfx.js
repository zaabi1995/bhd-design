import { createUISFX } from './vendor/uisfx.js';

const STORAGE_KEY = 'bhd-interface-sound';
const PACKS = {
  minimal: { pack: 'minimal', volume: 0.28 },
  mechanical: { pack: 'mechanical', volume: 0.34 },
  soft: { pack: 'soft', volume: 0.25 },
  default: { pack: 'default', volume: 0.28 },
};

let preference = localStorage.getItem(STORAGE_KEY) || 'off';
let profile = document.documentElement.dataset.bhdSfxProfile || 'minimal';
let player;

function currentPlayer() {
  if (!player) player = createUISFX(PACKS[profile] || PACKS.minimal);
  return player;
}

function isEnabled() { return preference === 'on'; }

function play(cue, options) {
  if (!isEnabled()) return;
  try { return currentPlayer().play(cue === 'tap' ? 'press' : cue, options); } catch { return null; }
}

function stop() {
  try { currentPlayer().stopAll(); } catch { /* No active audio context. */ }
}

async function setEnabled(enabled) {
  preference = enabled ? 'on' : 'off';
  localStorage.setItem(STORAGE_KEY, preference);
  document.querySelectorAll('[data-bhd-sound-toggle]').forEach((button) => {
    button.setAttribute('aria-pressed', String(enabled));
  });
  currentPlayer().setEnabled(enabled);
  if (enabled) {
    await currentPlayer().unlock();
    play('toggle-on');
  } else stop();
  window.dispatchEvent(new CustomEvent('bhd:sound-preference', { detail: { enabled } }));
}

function setProfile(next) {
  profile = PACKS[next] ? next : 'minimal';
  if (player) player.setPack(profile);
}

function bind(root = document) {
  root.querySelectorAll('[data-bhd-sound-toggle]').forEach((button) => {
    button.classList.add('bhd-sound-toggle');
    button.setAttribute('aria-pressed', String(isEnabled()));
    if (!button.dataset.bhdSoundReady) {
      button.dataset.bhdSoundReady = 'true';
      button.addEventListener('click', () => setEnabled(!isEnabled()));
    }
  });
  root.addEventListener('click', (event) => {
    const target = event.target.closest('[data-bhd-sfx]');
    if (target && !target.disabled) play(target.dataset.bhdSfx || 'tap');
  });
  root.addEventListener('bhd:confirmed', () => play('long-press'));
  root.addEventListener('bhd:files-dropped', () => play('drop'));
  root.addEventListener('bhd:action-state', (event) => {
    if (event.detail.state === 'loading') play('loading');
    if (event.detail.state === 'success') { stop(); play('success'); }
    if (event.detail.state === 'error') { stop(); play('error'); }
    if (event.detail.state === 'idle') stop();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', () => stop());
}

window.BHDSFX = { play, stop, bind, isEnabled, setEnabled, setProfile };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => bind(), { once: true });
else bind();
