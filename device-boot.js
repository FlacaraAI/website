/* device-boot.js — the doctors hero's device, in three stages that never
   block the page:
   1. The wireframe draw-in: a short alpha clip already in the HTML plays as
      soon as it can; the still underneath stays hidden while it draws.
      If the clip isn't ready quickly (slow link, no alpha support), we skip
      straight to the still.
   2. The still crossfades in as the drawing finishes.
   3. Once the page has loaded and the browser is idle, device3d.js is
      imported and the live scene fades in over the still at the same pose.
      Skipped for reduced motion, data saver, small screens and no WebGL. */
(function () {
  'use strict';
  var stage = document.querySelector('[data-device3d]');
  if (!stage) return;
  var wire = stage.querySelector('video');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};

  var drawn = false;
  function finishDrawing() {
    if (drawn) return;
    drawn = true;
    stage.classList.remove('is-drawing');
    stage.classList.add('is-drawn');
    if (wire) setTimeout(function () { wire.pause(); wire.removeAttribute('src'); }, 1200);
  }

  if (!wire || reduceMotion || conn.saveData) {
    finishDrawing();
  } else {
    var started = false;
    var onPlaying = function () {
      started = true;
      // the drawing takes 2.6 s; hand off a beat before it ends so the still
      // is in by the last frame (wall clock, so a stuttering decode can't
      // hold the page on the line art)
      setTimeout(finishDrawing, 2400);
    };
    wire.addEventListener('playing', onPlaying, { once: true });
    wire.addEventListener('error', finishDrawing, { once: true });
    wire.play().catch(function () {});
    // not drawing within a second of script start: don't make anyone wait
    setTimeout(function () { if (!started) finishDrawing(); }, 1000);
    // and never longer than the clip itself, whatever happens
    setTimeout(finishDrawing, 4500);
  }

  if (reduceMotion || conn.saveData || window.innerWidth < 900 || !window.WebGLRenderingContext) return;
  var start = function () {
    import('./device3d.js')
      .then(function (m) { return m.mount(stage); })
      .catch(function (err) { console.warn('device3d: staying on the still', err); });
  };
  // the 3D models (~1 MB) only start downloading once the drawing has handed
  // off and the page is idle, so they never compete with what's on screen
  var idle = function () { (window.requestIdleCallback || setTimeout)(start, { timeout: 3000 }); };
  var afterDrawn = function () {
    if (drawn) return idle();
    var mo = new MutationObserver(function () { if (drawn) { mo.disconnect(); idle(); } });
    mo.observe(stage, { attributes: true, attributeFilter: ['class'] });
  };
  if (document.readyState === 'complete') afterDrawn(); else window.addEventListener('load', afterDrawn);
})();
