(function (global) {
  'use strict';

  const reducedMotion = () => global.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const emit = (el, name, detail = {}) => el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));

  function setActionState(el, state, label) {
    if (!el) return;
    el.dataset.bhdState = state;
    const fallback = { loading: 'Working…', success: 'Done', error: 'Try again', idle: '' };
    el.dataset.bhdStatusLabel = label || fallback[state] || '';
    el.toggleAttribute('aria-busy', state === 'loading');
    if (state === 'loading') el.setAttribute('aria-disabled', 'true');
    else el.removeAttribute('aria-disabled');
    emit(el, 'bhd:action-state', { state });
  }

  function initActions(root) {
    root.querySelectorAll('[data-bhd-action]').forEach((el) => {
      el.classList.add('bhd-action');
      if (!el.querySelector('.bhd-action__label')) {
        const label = document.createElement('span');
        label.className = 'bhd-action__label';
        while (el.firstChild) label.appendChild(el.firstChild);
        el.appendChild(label);
      }
      el.dataset.bhdState ||= 'idle';
    });
  }

  function initHold(root) {
    root.querySelectorAll('[data-bhd-hold]').forEach((el) => {
      if (el.dataset.bhdHoldReady) return;
      el.dataset.bhdHoldReady = 'true';
      el.classList.add('bhd-hold');
      const duration = Number(el.dataset.bhdHold) || 900;
      let started = 0;
      let frame = 0;
      const reset = () => {
        cancelAnimationFrame(frame);
        started = 0;
        el.dataset.bhdHolding = 'false';
        el.style.setProperty('--bhd-hold-progress', '0%');
      };
      const tick = (now) => {
        if (!started) return;
        const progress = Math.min(1, (now - started) / duration);
        el.style.setProperty('--bhd-hold-progress', `${progress * 100}%`);
        if (progress >= 1) {
          el.dataset.bhdHolding = 'false';
          started = 0;
          emit(el, 'bhd:confirmed');
          return;
        }
        frame = requestAnimationFrame(tick);
      };
      const start = (event) => {
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
        if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        if (started) return;
        started = performance.now();
        el.dataset.bhdHolding = 'true';
        frame = requestAnimationFrame(tick);
      };
      el.addEventListener('pointerdown', start);
      el.addEventListener('pointerup', reset);
      el.addEventListener('pointercancel', reset);
      el.addEventListener('pointerleave', reset);
      el.addEventListener('keydown', start);
      el.addEventListener('keyup', reset);
      el.addEventListener('blur', reset);
      el.addEventListener('contextmenu', (event) => event.preventDefault());
    });
  }

  function initDropzones(root) {
    root.querySelectorAll('[data-bhd-dropzone]').forEach((el) => {
      if (el.dataset.bhdDropReady) return;
      el.dataset.bhdDropReady = 'true';
      el.classList.add('bhd-dropzone');
      let depth = 0;
      el.addEventListener('dragenter', (event) => {
        event.preventDefault(); depth += 1; el.dataset.bhdDragging = 'true';
      });
      el.addEventListener('dragover', (event) => event.preventDefault());
      el.addEventListener('dragleave', () => {
        depth = Math.max(0, depth - 1);
        if (!depth) el.dataset.bhdDragging = 'false';
      });
      el.addEventListener('drop', (event) => {
        event.preventDefault(); depth = 0; el.dataset.bhdDragging = 'false';
        const files = Array.from(event.dataTransfer?.files || []);
        if (files.length) { el.dataset.bhdAccepted = 'true'; emit(el, 'bhd:files-dropped', { files }); }
      });
    });
  }

  function updateFade(el) {
    const max = el.scrollHeight - el.clientHeight;
    el.style.setProperty('--bhd-fade-top', el.scrollTop > 2 ? '0' : '1');
    el.style.setProperty('--bhd-fade-bottom', el.scrollTop < max - 2 ? '0' : '1');
  }

  function initScrollFade(root) {
    root.querySelectorAll('[data-bhd-scroll-fade]').forEach((el) => {
      if (el.dataset.bhdFadeReady) return;
      el.dataset.bhdFadeReady = 'true'; el.classList.add('bhd-scroll-fade');
      el.addEventListener('scroll', () => updateFade(el), { passive: true });
      new ResizeObserver(() => updateFade(el)).observe(el);
      updateFade(el);
    });
  }

  function scramble(el, finalText = el.dataset.bhdScramble || el.textContent) {
    if (reducedMotion()) { el.textContent = finalText; return; }
    const glyphs = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const started = performance.now();
    const duration = Number(el.dataset.bhdScrambleDuration) || 520;
    const draw = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      const fixed = Math.floor(progress * finalText.length);
      el.textContent = [...finalText].map((char, index) => {
        if (/\s/.test(char) || index < fixed) return char;
        return glyphs[Math.floor(Math.random() * glyphs.length)];
      }).join('');
      if (progress < 1) requestAnimationFrame(draw);
      else el.textContent = finalText;
    };
    requestAnimationFrame(draw);
  }

  function initFoil(root) {
    root.querySelectorAll('[data-bhd-foil]').forEach((el) => {
      el.classList.add('bhd-foil');
      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--bhd-foil-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      });
    });
  }

  function init(root = document) {
    initActions(root); initHold(root); initDropzones(root); initScrollFade(root); initFoil(root);
    root.querySelectorAll('[data-bhd-scramble]').forEach((el) => scramble(el));
    root.querySelectorAll('[data-bhd-deal]').forEach((el) => requestAnimationFrame(() => { el.dataset.bhdDealt = 'true'; }));
    root.querySelectorAll('[data-bhd-draw]').forEach((el) => requestAnimationFrame(() => { el.dataset.bhdDraw = 'true'; }));
  }

  const api = { init, setActionState, scramble, emit };
  global.BHDInteractions = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
  else init();
})(window);
