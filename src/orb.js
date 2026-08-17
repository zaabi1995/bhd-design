/*
 * BHD Orb v1
 * https://design.bhd.om/orb.js
 *
 * The wait indicator for anything driven by a model. One spinner cannot say
 * whether we are listening, searching or solving, so this ships a VOCABULARY:
 * nine named states, each with its own motion, the same names on every
 * platform. Say what the wait is.
 *
 * The state vocabulary is taken from thinking-orbs by Jakub Antalik and Alex
 * Brinza (MIT, orbs.jakubantalik.com). That package is React only; this is an
 * independent vanilla canvas implementation so it can join the drop-in kit.
 * Keep the nine names byte-identical to theirs, so a React surface and a
 * vanilla surface never drift apart.
 *
 * Usage (declarative):
 *   <link rel="stylesheet" href="https://design.bhd.om/orb.css">
 *   <script src="https://design.bhd.om/orb.js"></script>
 *   <span data-bhd-orb="searching" data-bhd-orb-size="64"></span>
 *
 * Usage (programmatic):
 *   const orb = BHDOrb.create(el, { state: 'listening', size: 48, speed: 1 });
 *   orb.setState('solving');
 *   orb.destroy();
 *
 * Colour: dots inherit the element's `color`. .bhd-orb sets it to var(--primary),
 * so light and dark follow tokens.css with no extra work.
 *
 * Motion stops on prefers-reduced-motion, when the tab is hidden, and when the
 * orb scrolls out of view. It never animates a hidden canvas.
 */
(function (global) {
  'use strict';

  var STATES = {
    working:    { label: 'Working',        spin: 0.9,  motion: 'orbit' },
    searching:  { label: 'Searching',      spin: 1.4,  motion: 'scan' },
    solving:    { label: 'Solving',        spin: 1.1,  motion: 'contract' },
    listening:  { label: 'Listening',      spin: 0.35, motion: 'breathe' },
    connecting: { label: 'Connecting',     spin: 0.7,  motion: 'converge' },
    weaving:    { label: 'Weaving',        spin: 1.0,  motion: 'twist' },
    composing:  { label: 'Composing',      spin: 0.8,  motion: 'ring' },
    breathing:  { label: 'Breathing',      spin: 0.25, motion: 'breathe' },
    shaping:    { label: 'Shaping',        spin: 0.6,  motion: 'morph' }
  };

  var DOT_COUNT = 132;
  var TAU = Math.PI * 2;

  function reducedMotion() {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* Fibonacci lattice: an even spread on the sphere, no clustering at the poles. */
  function buildLattice(count) {
    var points = [];
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < count; i++) {
      var y = 1 - (i / (count - 1)) * 2;
      var radius = Math.sqrt(Math.max(0, 1 - y * y));
      var theta = golden * i;
      points.push({ x: Math.cos(theta) * radius, y: y, z: Math.sin(theta) * radius, seed: (i % 17) / 17 });
    }
    return points;
  }

  var LATTICE = buildLattice(DOT_COUNT);

  /* Each motion returns the deformed unit position plus a brightness multiplier.
   * Deformations only ever touch position and alpha, never layout. */
  function deform(motion, p, t) {
    var x = p.x, y = p.y, z = p.z, gain = 1;
    var wave, scale, lift, angle, cos, sin;

    if (motion === 'scan') {
      var band = Math.sin(t * 1.1);
      gain = 1 - Math.min(1, Math.abs(y - band) * 2.6) * 0.72;
      gain = 0.28 + gain;
    } else if (motion === 'contract') {
      scale = 1 - 0.24 * Math.max(0, Math.sin(t * 1.3 + p.seed * 0.9));
      x *= scale; y *= scale; z *= scale;
      gain = 0.55 + (1 - scale) * 3.4;
    } else if (motion === 'breathe') {
      scale = 1 + 0.11 * Math.sin(t * 0.9);
      x *= scale; y *= scale; z *= scale;
      gain = 0.8 + 0.2 * Math.sin(t * 0.9);
    } else if (motion === 'converge') {
      lift = 0.22 * Math.sin(t * 1.05);
      y += y >= 0 ? lift : -lift;
      gain = 1 - Math.abs(y) * 0.35;
    } else if (motion === 'twist') {
      angle = 0.9 * Math.sin(t * 1.2 + y * 3.1);
      cos = Math.cos(angle); sin = Math.sin(angle);
      var tx = x * cos - z * sin;
      z = x * sin + z * cos;
      x = tx;
      gain = 0.75 + 0.25 * Math.cos(angle);
    } else if (motion === 'ring') {
      wave = (Math.sin(t * 0.8) + 1) / 2;
      var flatten = 0.75 * wave;
      y *= 1 - flatten;
      var spread = 1 + flatten * 0.28;
      x *= spread; z *= spread;
      gain = 0.7 + 0.3 * wave;
    } else if (motion === 'morph') {
      wave = Math.sin(t * 0.85);
      x *= 1 + 0.2 * wave;
      y *= 1 - 0.2 * wave;
      gain = 0.85 + 0.15 * Math.cos(t * 0.85);
    } else {
      gain = 0.86 + 0.14 * Math.sin(t * 1.6 + p.seed * TAU);
    }

    return { x: x, y: y, z: z, gain: gain };
  }

  function create(el, options) {
    if (!el) return null;
    var opts = options || {};
    var state = STATES[opts.state] ? opts.state : 'working';
    var size = Number(opts.size) || 64;
    var speed = Number(opts.speed) || 1;
    var frame = 0;
    var start = 0;
    var running = false;
    var visible = true;

    el.classList.add('bhd-orb');
    el.style.setProperty('--bhd-orb-size', size + 'px');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');

    var canvas = el.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      el.appendChild(canvas);
    }
    var ctx = canvas.getContext('2d');

    var srLabel = el.querySelector('.bhd-orb__label');
    if (!srLabel) {
      srLabel = document.createElement('span');
      srLabel.className = 'bhd-orb__label';
      el.appendChild(srLabel);
    }

    function resize() {
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = size + 'px';
      canvas.style.height = size + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function label() {
      var text = el.dataset.bhdOrbLabel || STATES[state].label;
      srLabel.textContent = text;
      el.setAttribute('aria-label', text);
    }

    function draw(t) {
      var conf = STATES[state];
      var half = size / 2;
      var radius = half * 0.82;
      var dotBase = Math.max(0.7, size / 46);
      var spin = t * conf.spin * 0.55;
      var colour = global.getComputedStyle(el).color;

      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = colour;

      for (var i = 0; i < LATTICE.length; i++) {
        var d = deform(conf.motion, LATTICE[i], t);
        var cos = Math.cos(spin), sin = Math.sin(spin);
        var rx = d.x * cos - d.z * sin;
        var rz = d.x * sin + d.z * cos;
        var depth = (rz + 1) / 2;

        ctx.globalAlpha = Math.max(0.05, Math.min(1, (0.18 + depth * 0.82) * d.gain));
        ctx.beginPath();
        ctx.arc(half + rx * radius, half + d.y * radius, dotBase * (0.5 + depth * 0.6), 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function tick(now) {
      if (!start) start = now;
      draw(((now - start) / 1000) * speed);
      frame = global.requestAnimationFrame(tick);
    }

    function play() {
      if (running || !visible || document.hidden) return;
      if (reducedMotion()) { draw(0); return; }
      running = true;
      start = 0;
      frame = global.requestAnimationFrame(tick);
    }

    function pause() {
      running = false;
      if (frame) global.cancelAnimationFrame(frame);
      frame = 0;
    }

    var observer = null;
    if (global.IntersectionObserver) {
      observer = new global.IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) play(); else pause();
      });
      observer.observe(el);
    }

    function onVisibility() { if (document.hidden) pause(); else play(); }
    document.addEventListener('visibilitychange', onVisibility);

    resize();
    label();
    play();
    draw(0);

    var handle = {
      el: el,
      get state() { return state; },
      setState: function (next) {
        if (!STATES[next]) return handle;
        state = next;
        el.dataset.bhdOrb = next;
        label();
        if (reducedMotion()) draw(0);
        return handle;
      },
      setSize: function (next) {
        size = Number(next) || size;
        el.style.setProperty('--bhd-orb-size', size + 'px');
        resize();
        if (reducedMotion() || !running) draw(0);
        return handle;
      },
      setSpeed: function (next) {
        speed = Number(next) || speed;
        start = 0;
        return handle;
      },
      destroy: function () {
        pause();
        if (observer) observer.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        el.classList.remove('bhd-orb');
        canvas.remove();
        srLabel.remove();
      }
    };

    el.bhdOrb = handle;
    return handle;
  }

  function init(root) {
    var scope = root || document;
    var made = [];
    scope.querySelectorAll('[data-bhd-orb]').forEach(function (el) {
      if (el.bhdOrb) return;
      made.push(create(el, {
        state: el.dataset.bhdOrb,
        size: el.dataset.bhdOrbSize,
        speed: el.dataset.bhdOrbSpeed
      }));
    });
    return made;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(document); });
  } else {
    init(document);
  }

  global.BHDOrb = { create: create, init: init, states: Object.keys(STATES), STATES: STATES };
})(window);
