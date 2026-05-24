/*
 * BHD Dark-Mode Init v1
 * https://design.bhd.om/dark-mode.js
 *
 * Inline-load this BEFORE any stylesheet to avoid flash-of-wrong-theme.
 *   <script src="https://design.bhd.om/dark-mode.js"></script>
 * Or paste the body inline (smaller, no extra request):
 *   <script>...contents below...</script>
 *
 * Behaviour:
 *   1. localStorage('bhd-theme') wins if set ("light" | "dark" | "system")
 *   2. else <html data-bhd-theme-mode="..."> attribute
 *   3. else fallback to "light"
 *   4. "system" resolves via prefers-color-scheme at load AND on change
 *
 * Toggle in app code:
 *   BHDTheme.set('dark');         // explicit
 *   BHDTheme.set('system');       // follow OS
 *   BHDTheme.toggle();            // light <-> dark
 *   BHDTheme.current();           // "light" | "dark"
 */
(function () {
  var KEY = 'bhd-theme';
  var DEFAULT = 'light';

  function resolve(mode) {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode === 'dark' ? 'dark' : 'light';
  }

  function apply(mode) {
    var resolved = resolve(mode);
    var html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(resolved);
    html.setAttribute('data-bhd-theme', resolved);
    html.style.colorScheme = resolved;
  }

  function readStored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function store(mode) {
    try { localStorage.setItem(KEY, mode); } catch (e) {}
  }

  var stored = readStored();
  var html = document.documentElement;
  var attr = html.getAttribute('data-bhd-theme-mode');
  var initial = stored || attr || DEFAULT;

  apply(initial);

  // Live-follow OS if user picked "system"
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var listener = function () {
      var current = readStored() || attr || DEFAULT;
      if (current === 'system') apply('system');
    };
    if (mq.addEventListener) mq.addEventListener('change', listener);
    else if (mq.addListener) mq.addListener(listener);
  }

  window.BHDTheme = {
    set: function (mode) { store(mode); apply(mode); },
    toggle: function () {
      var now = resolve(readStored() || attr || DEFAULT);
      var next = now === 'dark' ? 'light' : 'dark';
      this.set(next);
      return next;
    },
    current: function () { return resolve(readStored() || attr || DEFAULT); },
    stored: function () { return readStored() || attr || DEFAULT; }
  };
})();
