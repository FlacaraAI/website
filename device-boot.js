/* device-boot.js — the heroes' draw-ins and 3D, in stages that never block
   the page:
   1. Each [data-draw-in] stage holds a short alpha clip of the device as
      line art and the still underneath. The clip plays as soon as it can
      while the still stays hidden; if it isn't playing within a second the
      page goes straight to the still.
   2. The still crossfades in as the drawing finishes.
   3. The 3D (device3d.js on the doctors page; phone3d.js, via
      phone-frames.js, on the patients page) starts loading at page load,
      during the drawing, and fades in over the still once the drawing has
      handed off. Skipped for reduced motion, data saver, small screens and
      no WebGL. */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};

  document.querySelectorAll('[data-draw-in]').forEach(function (stage) {
    var wire = stage.querySelector('video');
    var drawn = false;
    function finishDrawing() {
      if (drawn) return;
      drawn = true;
      stage.classList.remove('is-drawing');
      stage.classList.add('is-drawn');
      // straight to the live scene if it's already rendering; the still only
      // stands in when the 3D isn't there yet (the 3D module takes over then)
      if (stage.classList.contains('is-3d-ready')) stage.classList.add('is-3d');
      if (wire) setTimeout(function () { wire.pause(); wire.removeAttribute('src'); }, 1200);
    }
    // the drawing is complete at 1.5 s; hand off then if the 3D is up, or
    // hold the finished drawing up to 1.1 s more for it (the clip's last
    // frame is the complete drawing, so holding costs nothing)
    function handOff() {
      if (drawn) return;
      if (stage.classList.contains('is-3d-ready') || reduceMotion) return finishDrawing();
      var waited = 0, tick = setInterval(function () {
        waited += 50;
        if (stage.classList.contains('is-3d-ready') || waited >= 1100) { clearInterval(tick); finishDrawing(); }
      }, 50);
    }
    if (!wire || reduceMotion || conn.saveData) { finishDrawing(); return; }
    var started = false;
    wire.addEventListener('playing', function () { started = true; setTimeout(handOff, 1500); }, { once: true });
    wire.addEventListener('error', finishDrawing, { once: true });
    wire.play().catch(function () {});
    setTimeout(function () { if (!started) finishDrawing(); }, 1000);
    setTimeout(finishDrawing, 4200);
  });

  var stage = document.querySelector('[data-device3d]');
  if (!stage) return;
  var turnBox = document.querySelector('.fl-swap__turn');
  var turnSheet = turnBox && turnBox.querySelector('canvas[data-fl-sheet]');
  var releaseSheet = function () { if (turnSheet && turnSheet.flSheetEnable) turnSheet.flSheetEnable(); };
  if (reduceMotion || conn.saveData || !window.WebGLRenderingContext) { releaseSheet(); return; }
  var start = function () {
    import('./device3d.js')
      .then(function (m) {
        // the run-through's first step, rendered live: same models, crisp at
        // any pixel density — the sprite sheet is only fetched if this fails
        var run = turnBox ? m.mountRun(turnBox, ['images/app-home.webp', 'images/app-home.webp', 'images/app-mesh.webp', 'images/app-notes.webp', 'images/app-compare-rot.webp'])
          .catch(function (err) { console.warn('device3d: run-through stays on the sheet', err); releaseSheet(); }) : Promise.resolve();
        return run.then(function () { return m.mount(stage); });
      })
      .catch(function (err) { console.warn('device3d: staying on the still', err); releaseSheet(); });
  };
  // the models start downloading right away, while the line art draws (its
  // clip is already in flight, so it stays ahead); mount() waits for the
  // handoff before showing anything
  (window.requestIdleCallback || setTimeout)(start, { timeout: 300 });
})();
