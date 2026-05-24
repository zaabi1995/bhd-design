/*
 * BHD Command Palette (Cmd+K) v1, vanilla
 * https://design.bhd.om/cmdk.js
 *
 * Framework-agnostic command palette overlay. Works in any project that
 * loads tokens.css. Opens on Cmd+K (macOS) / Ctrl+K (Win/Linux).
 *
 * Quick start:
 *   <link rel="stylesheet" href="https://design.bhd.om/tokens.css">
 *   <link rel="stylesheet" href="https://design.bhd.om/cmdk.css">
 *   <script src="https://design.bhd.om/cmdk.js"></script>
 *   <script>
 *     BHDCmdK.init({
 *       commands: [
 *         { id: 'home',     label: 'Go home',        hint: 'Dashboard',
 *           action: () => location.href = '/' },
 *         { id: 'invoices', label: 'New invoice',    hint: 'Action',
 *           action: () => location.href = '/invoices/new' },
 *       ],
 *       hotkey: { key: 'k', meta: true } // default
 *     });
 *   </script>
 */
(function () {
  var state = {
    open: false,
    commands: [],
    filtered: [],
    cursor: 0,
    el: null,
    inputEl: null,
    listEl: null
  };

  function html(tpl) {
    var d = document.createElement('div');
    d.innerHTML = tpl.trim();
    return d.firstElementChild;
  }

  function render() {
    if (state.el) return;
    state.el = html(
      '<div class="bhd-cmdk" data-open="false" role="dialog" aria-modal="true" aria-label="Command palette">' +
        '<div class="bhd-cmdk__backdrop"></div>' +
        '<div class="bhd-cmdk__panel">' +
          '<input class="bhd-cmdk__input" placeholder="Type a command, or search..." autocomplete="off" />' +
          '<ul class="bhd-cmdk__list" role="listbox"></ul>' +
          '<div class="bhd-cmdk__footer">' +
            '<span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>' +
            '<span><kbd>⏎</kbd> run</span>' +
            '<span><kbd>esc</kbd> close</span>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    document.body.appendChild(state.el);
    state.inputEl = state.el.querySelector('.bhd-cmdk__input');
    state.listEl = state.el.querySelector('.bhd-cmdk__list');

    state.el.querySelector('.bhd-cmdk__backdrop').addEventListener('click', close);
    state.inputEl.addEventListener('input', function () { filter(state.inputEl.value); });
    state.inputEl.addEventListener('keydown', onKey);
  }

  function filter(q) {
    q = (q || '').toLowerCase().trim();
    state.filtered = q
      ? state.commands.filter(function (c) {
          return (c.label + ' ' + (c.hint || '') + ' ' + (c.keywords || '')).toLowerCase().indexOf(q) !== -1;
        })
      : state.commands.slice();
    state.cursor = 0;
    paint();
  }

  function paint() {
    state.listEl.innerHTML = '';
    if (!state.filtered.length) {
      var empty = html('<li class="bhd-cmdk__empty">No results.</li>');
      state.listEl.appendChild(empty);
      return;
    }
    state.filtered.forEach(function (c, i) {
      var li = html(
        '<li class="bhd-cmdk__item" role="option" data-id="' + c.id + '"' +
          (i === state.cursor ? ' aria-selected="true"' : '') + '>' +
          (c.icon ? '<span class="bhd-cmdk__icon">' + c.icon + '</span>' : '') +
          '<span class="bhd-cmdk__label">' + escapeHtml(c.label) + '</span>' +
          (c.hint ? '<span class="bhd-cmdk__hint">' + escapeHtml(c.hint) + '</span>' : '') +
        '</li>'
      );
      li.addEventListener('click', function () { run(c); });
      li.addEventListener('mouseenter', function () { state.cursor = i; paint(); });
      state.listEl.appendChild(li);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function onKey(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      state.cursor = Math.min(state.cursor + 1, state.filtered.length - 1);
      paint();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      state.cursor = Math.max(state.cursor - 1, 0);
      paint();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      var c = state.filtered[state.cursor];
      if (c) run(c);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }

  function run(c) {
    close();
    if (typeof c.action === 'function') c.action();
  }

  function open() {
    if (state.open) return;
    render();
    state.open = true;
    state.el.setAttribute('data-open', 'true');
    state.inputEl.value = '';
    filter('');
    setTimeout(function () { state.inputEl.focus(); }, 10);
  }

  function close() {
    if (!state.open) return;
    state.open = false;
    state.el.setAttribute('data-open', 'false');
  }

  function toggle() { state.open ? close() : open(); }

  function bindHotkey(opts) {
    var key = (opts && opts.key) || 'k';
    var meta = !(opts && opts.meta === false);
    document.addEventListener('keydown', function (e) {
      if (e.key && e.key.toLowerCase() === key && (meta ? (e.metaKey || e.ctrlKey) : true)) {
        e.preventDefault();
        toggle();
      }
    });
  }

  window.BHDCmdK = {
    init: function (opts) {
      opts = opts || {};
      state.commands = Array.isArray(opts.commands) ? opts.commands : [];
      bindHotkey(opts.hotkey);
    },
    setCommands: function (arr) { state.commands = arr || []; },
    addCommand: function (c) { state.commands.push(c); },
    open: open,
    close: close,
    toggle: toggle
  };
})();
