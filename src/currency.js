/*
 * BHD Currency v1
 * https://design.bhd.om/currency.js
 *
 * Canonical OMR (Omani Rial) formatter. Symbol always on the LEFT in both
 * LTR + RTL contexts. 3-decimal precision per Omani banking convention
 * (1 OMR = 1000 baisa). Uses ﷼ (U+FDFC, Arabic Ligature Rial Sign).
 *
 * Usage (inline):
 *   element.innerHTML = BHDCurrency.formatOMR(1250.5);
 *   // <span class="bhd-omr"><span class="bhd-omr__sym">﷼</span> <bdi>1,250.500</bdi></span>
 *
 * Usage (declarative, hydrates on DOMContentLoaded):
 *   <span data-bhd-omr="1250.5"></span>
 *   <td data-bhd-omr="100"></td>
 *
 * Locale-aware digits:
 *   BHDCurrency.formatOMR(100, { locale: 'ar-OM' })
 *   // <span class="bhd-omr"><span class="bhd-omr__sym">﷼</span> <bdi>١٠٠٫٠٠٠</bdi></span>
 */
(function () {
  // The visual glyph is the official Omani Rial sign from Central Bank of
  // Oman (2025), rendered via CSS mask on .bhd-omr__sym. Keep this span
  // empty in HTML so the SVG from currency.css is the ONLY visible glyph.
  // Older code that emits the ﷼ Unicode character still works (currency.css
  // suppresses the inner text), but new code emits an empty <span>.

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatNumber(value, locale, decimals) {
    var n = Number(value);
    if (!isFinite(n)) return '—';
    var opts = { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
    try {
      return new Intl.NumberFormat(locale || 'en-OM', opts).format(n);
    } catch (e) {
      return n.toFixed(decimals);
    }
  }

  function formatOMR(value, opts) {
    opts = opts || {};
    var decimals = typeof opts.decimals === 'number' ? opts.decimals : 3;
    var locale = opts.locale; // undefined → auto-detect from <html lang>
    if (!locale && typeof document !== 'undefined') {
      var langAttr = document.documentElement.getAttribute('lang') || '';
      locale = langAttr.indexOf('ar') === 0 ? 'ar-OM' : 'en-OM';
    }
    var n = formatNumber(value, locale, decimals);
    var classes = ['bhd-omr'];
    if (opts.brand)  classes.push('bhd-omr--brand');
    if (opts.pill)   classes.push('bhd-omr--pill');
    if (opts.size === 'xs') classes.push('bhd-omr--xs');
    return '<span class="' + classes.join(' ') + '">' +
             '<span class="bhd-omr__sym" role="img" aria-label="OMR"></span>' +
             '<bdi>' + escapeHtml(n) + '</bdi>' +
           '</span>';
  }

  function hydrate(root) {
    root = root || document;
    var nodes = root.querySelectorAll('[data-bhd-omr]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var val = el.getAttribute('data-bhd-omr');
      var opts = {};
      if (el.hasAttribute('data-bhd-omr-decimals')) opts.decimals = parseInt(el.getAttribute('data-bhd-omr-decimals'), 10);
      if (el.hasAttribute('data-bhd-omr-locale'))   opts.locale = el.getAttribute('data-bhd-omr-locale');
      if (el.hasAttribute('data-bhd-omr-brand'))    opts.brand = true;
      if (el.hasAttribute('data-bhd-omr-pill'))     opts.pill = true;
      if (el.hasAttribute('data-bhd-omr-size'))     opts.size = el.getAttribute('data-bhd-omr-size');
      el.innerHTML = formatOMR(val, opts);
    }
  }

  window.BHDCurrency = {
    SYM_OMR: SYM_OMR,
    formatOMR: formatOMR,
    hydrate: hydrate
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { hydrate(); });
    } else {
      hydrate();
    }
  }
})();
