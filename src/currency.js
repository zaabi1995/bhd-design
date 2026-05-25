/*
 * BHD Currency v3
 * https://design.bhd.om/currency.js
 *
 * Canonical OMR (Omani Rial) formatter. Inlines the OFFICIAL Omani Rial sign
 * (Central Bank of Oman, 2025) as an SVG with fill=currentColor so the
 * symbol inherits the surrounding text colour (works in dark mode, brand
 * accents, etc.). NOT the generic Arabic Rial ligature ﷼ — that reads as
 * Saudi/Iranian/Yemeni Rial to a designer.
 *
 * Symbol always on the LEFT of the number. 3-decimal precision per Omani
 * banking convention (1 OMR = 1000 baisa).
 *
 * Usage (inline):
 *   element.innerHTML = BHDCurrency.formatOMR(1250.5);
 *
 * Usage (declarative, hydrates on DOMContentLoaded):
 *   <span data-bhd-omr="1250.5"></span>
 *
 * Locale-aware digits:
 *   BHDCurrency.formatOMR(100, { locale: 'ar-OM' })
 *
 * Legacy markup support: any pre-existing <span class="bhd-omr__sym"></span>
 * (empty, no inner content) on the page is auto-hydrated with the inline SVG.
 */
(function () {
  // Official Omani Rial sign, CBO 2025. viewBox 741.36 × 415.06.
  // fill="currentColor" so colour inherits from parent.
  var OMR_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 741.36 415.06" fill="currentColor" aria-hidden="true" focusable="false"><path d="M259.9,219.89c-.63-49.2,11.44-95.41,35.76-137.75C331.7,19.4,371.24-.36,439.78,34.99c10.67,5.5,53.6,35.43,57.81,44.54,5.03,10.87-27.48,103.87-29.11,122.3-34.69-37.51-99.37-98.66-154.85-69.62-45.05,23.58-12.02,62.54,11.46,87.68h406.25l-39.14,70.23-289.2-2c-1.11,4.66.87,3.3,2.53,4.6,12.44,9.72,80.97,31.54,94.75,31.54l172.05,1.99-39.49,71.25H10.03l39.24-71.24h272.14l-37.11-36.13H69.33l39.23-70.23h151.33Z"/></svg>';

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
    var locale = opts.locale;
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
             '<span class="bhd-omr__sym" role="img" aria-label="OMR">' + OMR_SVG + '</span>' +
             '<bdi>' + escapeHtml(n) + '</bdi>' +
           '</span>';
  }

  // Inject the inline SVG into any empty .bhd-omr__sym spans found on the
  // page. This covers both Astro/EJS templates that emit
  // <span class="bhd-omr__sym" role="img" aria-label="OMR"></span> and any
  // other consumer that doesn't render its own SVG.
  function hydrateSymbols(root) {
    root = root || document;
    var syms = root.querySelectorAll('.bhd-omr__sym');
    for (var i = 0; i < syms.length; i++) {
      var el = syms[i];
      // Skip if already populated (contains an <svg>).
      if (el.querySelector('svg')) continue;
      // If the span still has the wrong legacy character (e.g. ﷼) inside,
      // wipe it before injecting the official SVG.
      el.innerHTML = OMR_SVG;
    }
  }

  function hydrateData(root) {
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

  function hydrate(root) {
    hydrateData(root);
    hydrateSymbols(root);
  }

  window.BHDCurrency = {
    OMR_SVG: OMR_SVG,
    formatOMR: formatOMR,
    hydrate: hydrate,
    hydrateSymbols: hydrateSymbols
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { hydrate(); });
    } else {
      hydrate();
    }
  }
})();
