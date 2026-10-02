/* phone-frames.js — the software hero's phone.
   1. Instantly: one pre-rendered snapshot of the iPhone model
      (images/phone-hero.webp, from tools/render-phone-frames.*), floating
      on a single eased animation loop — a slow bob and sway, a small lean
      toward the pointer, a gentle lift as the hero scrolls away.
   2. Later: once the page has loaded and the browser is idle, phone3d.js is
      imported and swaps in the real 3D model at the identical pose. Skipped
      for reduced-motion, data-saver and small screens, where the snapshot
      is already the right answer. */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-phone-float]').forEach(function (stage) {
    var wrap = stage.querySelector('.fl-phone-hero');
    var img = wrap && wrap.querySelector('img');
    if (!wrap || !img) return;

    // ---------- the 3D upgrade, off the critical path ----------
    var conn = navigator.connection || {};
    var want3d = !reduceMotion && !conn.saveData && window.innerWidth >= 900 &&
                 !!window.WebGLRenderingContext && stage.getAttribute('data-screen');
    if (want3d) {
      var start = function () {
        import('./phone3d.js')
          .then(function (m) { return m.mount(wrap, stage.getAttribute('data-screen'), img); })
          .catch(function (err) { console.warn('phone3d: staying on the snapshot', err); });
      };
      var idle = function () { (window.requestIdleCallback || setTimeout)(start, { timeout: 2500 }); };
      if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle);
    }

    if (reduceMotion) return;

    // ---------- the float, on the wrapper so the 3D canvas inherits it ----------
    var px = 0, py = 0, cx = 0, cy = 0, cs = 0;
    var t0 = performance.now(), raf = null, visible = true;
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - 0.5;
      py = (e.clientY - r.top) / r.height - 0.5;
    });
    stage.addEventListener('pointerleave', function () { px = 0; py = 0; });

    function frame(now) {
      raf = visible ? requestAnimationFrame(frame) : null;
      var t = (now - t0) / 1000;
      var scroll = Math.min(1, window.scrollY / window.innerHeight);
      cx += (px - cx) * 0.06;
      cy += (py - cy) * 0.06;
      cs += (scroll - cs) * 0.1;
      // once the real model is in, it does its own turning — keep only the float
      var tilt = wrap.classList.contains('is-3d') ? 0 : 1;
      var bob = Math.sin(t * 0.9) * 10;
      var sway = Math.sin(t * 0.55) * 1.6;
      var ry = (cx * 9 + Math.sin(t * 0.4) * 2) * tilt;
      var rx = -cy * 6 * tilt;
      var lift = -cs * 40;
      wrap.style.transform =
        'translate3d(0,' + (bob + lift).toFixed(2) + 'px,0) ' +
        'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) ' +
        'rotateZ(' + sway.toFixed(2) + 'deg)';
    }
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    }).observe(stage);
  });
})();
