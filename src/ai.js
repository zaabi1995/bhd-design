/*
 * BHD AI Blocks v1
 * https://design.bhd.om/ai.js
 *
 * Behaviour for the blocks in ai.css. Markup-first: every block is plain HTML
 * with a class, and this file only wires the four that actually need script.
 *
 *   [data-bhd-ai-thinking]   counts the elapsed seconds honestly
 *   [data-bhd-ai-reasoning]  collapse and expand the reasoning trail
 *   [data-bhd-ai-stream]     type a string out, or feed it chunks
 *   [data-bhd-ai-copy]       copy a code block
 *   [data-bhd-ai-input]      auto-grow composer, Enter sends, Shift+Enter breaks
 *
 * Programmatic:
 *   BHDAI.stream(el, 'text', { cps: 42 }).then(...)
 *   BHDAI.thinking(el).stop()          // freezes the timer, drops the shimmer
 *   BHDAI.todo(el).advance()           // active item becomes done
 *
 * Everything respects prefers-reduced-motion: streams land in one paint rather
 * than typing, and no shimmer runs.
 */
(function (global) {
  'use strict';

  var doc = global.document;

  function reducedMotion() {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function emit(el, name, detail) {
    el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: detail || {} }));
  }

  /* ---- thinking: an honest elapsed timer ---- */
  function thinking(el) {
    if (!el) return null;
    var out = el.querySelector('.bhd-ai-thinking__time');
    var start = global.performance ? global.performance.now() : Date.now();
    var timer = 0;

    function tick() {
      var now = global.performance ? global.performance.now() : Date.now();
      var seconds = Math.floor((now - start) / 1000);
      if (out) out.textContent = seconds + 's';
    }

    if (out) {
      tick();
      timer = global.setInterval(tick, 1000);
    }

    return {
      el: el,
      stop: function (label) {
        global.clearInterval(timer);
        tick();
        el.dataset.done = 'true';
        var text = el.querySelector('.bhd-ai-thinking__label');
        if (text && label) text.textContent = label;
        if (text) text.style.animation = 'none';
        emit(el, 'bhd-ai:thinking-stop');
      }
    };
  }

  /* ---- reasoning: collapse and expand ---- */
  function initReasoning(root) {
    root.querySelectorAll('[data-bhd-ai-reasoning]').forEach(function (el) {
      if (el.dataset.bhdAiReady) return;
      el.dataset.bhdAiReady = 'true';
      var toggle = el.querySelector('.bhd-ai-reasoning__toggle');
      var body = el.querySelector('.bhd-ai-reasoning__body');
      if (!toggle || !body) return;
      if (!body.id) body.id = 'bhd-ai-reasoning-' + Math.abs(el.textContent.length * 31 + root.childElementCount);
      el.dataset.open = el.dataset.open === 'true' ? 'true' : 'false';
      toggle.setAttribute('aria-expanded', el.dataset.open);
      toggle.setAttribute('aria-controls', body.id);
      toggle.addEventListener('click', function () {
        var open = el.dataset.open !== 'true';
        el.dataset.open = String(open);
        toggle.setAttribute('aria-expanded', String(open));
        emit(el, 'bhd-ai:reasoning-toggle', { open: open });
      });
    });
  }

  /* ---- streaming text ---- */
  function stream(el, text, options) {
    if (!el) return Promise.resolve();
    var opts = options || {};
    var cps = Number(opts.cps) || 45;
    var body = el.querySelector('.bhd-ai-stream__text');
    if (!body) {
      body = doc.createElement('span');
      body.className = 'bhd-ai-stream__text';
      el.insertBefore(body, el.firstChild);
    }
    if (!el.querySelector('.bhd-ai-stream__caret')) {
      var caret = doc.createElement('span');
      caret.className = 'bhd-ai-stream__caret';
      caret.setAttribute('aria-hidden', 'true');
      el.appendChild(caret);
    }

    el.dataset.done = 'false';
    el.setAttribute('aria-live', 'polite');
    body.textContent = '';

    if (reducedMotion()) {
      body.textContent = text;
      el.dataset.done = 'true';
      emit(el, 'bhd-ai:stream-end');
      return Promise.resolve();
    }

    return new Promise(function (resolve) {
      var index = 0;
      var last = 0;
      function frame(now) {
        if (!last) last = now;
        var due = Math.floor(((now - last) / 1000) * cps);
        if (due > 0) {
          index = Math.min(text.length, index + due);
          body.textContent = text.slice(0, index);
          last = now;
        }
        if (index < text.length) {
          global.requestAnimationFrame(frame);
        } else {
          el.dataset.done = 'true';
          emit(el, 'bhd-ai:stream-end');
          resolve();
        }
      }
      global.requestAnimationFrame(frame);
    });
  }

  /* ---- to-do progress ---- */
  function todo(el) {
    if (!el) return null;
    var items = [].slice.call(el.querySelectorAll('.bhd-ai-todo__item'));
    var count = el.querySelector('.bhd-ai-todo__count');

    function sync() {
      var done = items.filter(function (i) { return i.dataset.state === 'done'; }).length;
      if (count) count.textContent = done + ' / ' + items.length;
      return done;
    }

    sync();

    return {
      el: el,
      sync: sync,
      advance: function () {
        var next = items.filter(function (i) { return i.dataset.state !== 'done'; })[0];
        if (!next) return false;
        next.dataset.state = 'done';
        var after = items.filter(function (i) { return i.dataset.state !== 'done'; })[0];
        if (after) after.dataset.state = 'active';
        sync();
        emit(el, 'bhd-ai:todo-advance', { done: sync(), total: items.length });
        return true;
      }
    };
  }

  /* ---- copy button on a code block ---- */
  function initCopy(root) {
    root.querySelectorAll('[data-bhd-ai-copy]').forEach(function (btn) {
      if (btn.dataset.bhdAiReady) return;
      btn.dataset.bhdAiReady = 'true';
      btn.addEventListener('click', function () {
        var target = doc.getElementById(btn.dataset.bhdAiCopy) ||
          btn.closest('.bhd-ai-surface').querySelector('.bhd-ai-code__body');
        if (!target) return;
        var text = [].slice.call(target.querySelectorAll('.bhd-ai-code__text'))
          .map(function (line) { return line.textContent; }).join('\n') || target.textContent;
        var label = btn.querySelector('.bhd-ai-btn__label') || btn;
        var original = label.textContent;
        var write = global.navigator.clipboard
          ? global.navigator.clipboard.writeText(text)
          : Promise.reject();
        write.then(function () {
          label.textContent = 'Copied';
          setTimeout(function () { label.textContent = original; }, 1200);
        }).catch(function () {
          global.prompt('Copy this code', text);
        });
      });
    });
  }

  /* ---- composer ---- */
  function initInput(root) {
    root.querySelectorAll('[data-bhd-ai-input]').forEach(function (el) {
      if (el.dataset.bhdAiReady) return;
      el.dataset.bhdAiReady = 'true';
      var field = el.querySelector('.bhd-ai-input__field');
      var send = el.querySelector('.bhd-ai-input__send');
      if (!field) return;

      function resize() {
        field.style.height = 'auto';
        field.style.height = field.scrollHeight + 'px';
      }
      function sync() {
        if (send) send.disabled = !field.value.trim();
      }
      function submit() {
        var value = field.value.trim();
        if (!value) return;
        emit(el, 'bhd-ai:submit', { value: value });
        field.value = '';
        resize();
        sync();
      }

      field.addEventListener('input', function () { resize(); sync(); });
      field.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          submit();
        }
      });
      if (send) send.addEventListener('click', submit);
      resize();
      sync();
      el.bhdAiSubmit = submit;
    });
  }

  function init(root) {
    var scope = root || doc;
    initReasoning(scope);
    initCopy(scope);
    initInput(scope);
    scope.querySelectorAll('[data-bhd-ai-thinking]').forEach(function (el) {
      if (el.dataset.bhdAiReady) return;
      el.dataset.bhdAiReady = 'true';
      el.bhdAiThinking = thinking(el);
    });
    scope.querySelectorAll('[data-bhd-ai-todo]').forEach(function (el) {
      if (el.bhdAiTodo) return;
      el.bhdAiTodo = todo(el);
    });
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', function () { init(doc); });
  } else {
    init(doc);
  }

  global.BHDAI = {
    init: init,
    thinking: thinking,
    stream: stream,
    todo: todo,
    blocks: [
      'thinking', 'reasoning', 'search', 'diff', 'image', 'response', 'stream',
      'citations', 'code', 'todo', 'table', 'compare', 'input'
    ]
  };
})(window);
