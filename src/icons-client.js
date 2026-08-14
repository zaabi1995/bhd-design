/*
 * BHD Icon Client v1
 * https://design.bhd.om/icons-client.js
 *
 * Load once, then use:
 *   <bhd-icon name="search"></bhd-icon>
 *   <bhd-icon source="drawn" name="a-3d-printer" label="3D printer"></bhd-icon>
 */
(function () {
  var ORIGIN = 'https://design.bhd.om';
  var IMAGE_SOURCES = new Set(['aws', 'azure', 'drawn', 'emoji', 'gcp', 'tech']);

  function shardFor(value) {
    var hash = 5381;
    for (var index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
    }
    return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 2);
  }

  function iconUrl(name, source) {
    var iconSource = source || 'lucide';
    var id = String(name || '').trim();
    if (!id) return '';
    if (iconSource === 'drawn') {
      return ORIGIN + '/icons/sets/drawn/' + shardFor(id) + '/' + encodeURIComponent(id) + '.svg?v=1';
    }
    return ORIGIN + '/icons/sets/' + encodeURIComponent(iconSource) + '/' + encodeURIComponent(id) + '.svg?v=1';
  }

  function renderIcon(element) {
    var name = element.getAttribute('name') || '';
    var source = element.getAttribute('source') || 'lucide';
    var label = element.getAttribute('label') || '';
    var mode = element.getAttribute('mode') || (IMAGE_SOURCES.has(source) ? 'image' : 'mask');
    var url = iconUrl(name, source);
    var root = element.shadowRoot;

    element.setAttribute('role', label ? 'img' : 'presentation');
    if (label) element.setAttribute('aria-label', label);
    else element.setAttribute('aria-hidden', 'true');

    root.innerHTML = '<style>' +
      ':host{display:inline-flex;inline-size:var(--bhd-icon-size,1em);block-size:var(--bhd-icon-size,1em);flex:0 0 auto;color:inherit;vertical-align:-.125em}' +
      '.icon{display:block;inline-size:100%;block-size:100%}' +
      '.mask{background:currentColor;mask:var(--bhd-icon-url) center/contain no-repeat;-webkit-mask:var(--bhd-icon-url) center/contain no-repeat}' +
      'img{object-fit:contain}' +
      '</style>' +
      (mode === 'mask'
        ? '<span class="icon mask" style="--bhd-icon-url:url(&quot;' + url + '&quot;)"></span>'
        : '<img class="icon" src="' + url + '" alt="" loading="lazy" decoding="async">');
  }

  function BhdIcon() {
    var self = Reflect.construct(HTMLElement, [], BhdIcon);
    self.attachShadow({ mode: 'open' });
    return self;
  }

  BhdIcon.prototype = Object.create(HTMLElement.prototype);
  BhdIcon.prototype.constructor = BhdIcon;
  Object.setPrototypeOf(BhdIcon, HTMLElement);
  Object.defineProperty(BhdIcon, 'observedAttributes', {
    get: function () { return ['label', 'mode', 'name', 'source']; },
  });
  BhdIcon.prototype.connectedCallback = function () { renderIcon(this); };
  BhdIcon.prototype.attributeChangedCallback = function () {
    if (this.isConnected) renderIcon(this);
  };

  if (!customElements.get('bhd-icon')) customElements.define('bhd-icon', BhdIcon);
  window.BHDIcons = Object.freeze({ origin: ORIGIN, shardFor: shardFor, url: iconUrl });
})();
