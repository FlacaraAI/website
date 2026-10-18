/* attach.js — "lift it on": a pre-rendered sequence of the h1 descending
   onto the phone, scrubbed by scroll while the section is pinned, or by
   dragging the handle. Frames live in one sprite sheet so there's a single
   image to fetch and no decoder to wait on; a canvas blits the frame. */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-fl-attach]').forEach(function (root) {
    var canvas = root.querySelector('canvas');
    var range = root.querySelector('input[type=range]');
    var seated = root.querySelector('[data-attach-seated]');
    var sticky = root.querySelector('.fl-attach__sticky');
    if (!canvas || !range) return;
    var COLS = +root.getAttribute('data-cols') || 8, N = +root.getAttribute('data-frames') || 40;
    var CW = +root.getAttribute('data-w') || 400, CH = +root.getAttribute('data-h') || 500;
    var ctx = canvas.getContext('2d');
    var sheet = new Image();
    sheet.src = root.getAttribute('data-sheet');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var current = -1, progress = 0, shown = 0, manual = false, manualUntil = 0;

    function size() {
      var r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      current = -1; draw();
    }
    function draw() {
      if (!sheet.complete || !sheet.naturalWidth) return;
      var i = Math.round(shown * (N - 1));
      if (i === current) return;
      current = i;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(sheet, (i % COLS) * CW, Math.floor(i / COLS) * CH, CW, CH, 0, 0, canvas.width, canvas.height);
      root.classList.toggle('is-seated', shown > 0.97);
      range.value = Math.round(shown * 1000);
      range.style.setProperty('--p', (shown * 100).toFixed(1));
    }
    function fromScroll() {
      if (!sticky) return;
      var r = root.getBoundingClientRect();
      var run = r.height - window.innerHeight;
      progress = run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 1;
    }
    var raf = null;
    function tick() {
      raf = null;
      if (!manual) fromScroll();
      // the shown frame eases toward the target so trackpad flicks don't stutter
      var d = progress - shown;
      shown += reduceMotion ? d : d * 0.18;
      if (Math.abs(progress - shown) < 0.002) shown = progress;
      draw();
      if (shown !== progress) raf = requestAnimationFrame(tick);
    }
    function wake() { if (!raf) raf = requestAnimationFrame(tick); }

    range.addEventListener('input', function () {
      manual = true; manualUntil = Date.now() + 1500;
      progress = range.value / 1000; wake();
    });
    window.addEventListener('scroll', function () {
      if (manual && Date.now() > manualUntil) manual = false;
      if (!manual) wake();
    }, { passive: true });
    window.addEventListener('resize', size);
    sheet.addEventListener('load', function () { size(); wake(); });
    size();
  });
})();
