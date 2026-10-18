/* sheets.js — scroll-scrubbed frame sequences. Each [data-fl-sheet] canvas
   blits one cell of a sprite sheet (one image to fetch, no decoder to wait
   on). Two users:
   - the "lift it on" section: scrubbed by scroll while pinned, or by its
     drag handle;
   - the run-through's opening turn: scrubbed by motion.js from the swap's
     first step (it calls el.flSheetSet(progress)).
   The sheet is fetched only after the page has loaded and once the canvas
   is near; until then the first frame, a small image in the HTML, shows. */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var loaded = document.readyState === 'complete';
  var pending = [];
  if (!loaded) window.addEventListener('load', function () { loaded = true; pending.forEach(function (f) { f(); }); pending = []; });

  function sheetCanvas(canvas) {
    var COLS = +canvas.getAttribute('data-cols'), N = +canvas.getAttribute('data-frames');
    var CW = +canvas.getAttribute('data-w'), CH = +canvas.getAttribute('data-h');
    var first = canvas.parentNode.querySelector('.fl-sheet__first');
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var sheet = new Image(), ready = false, current = -1, shown = 0, target = 0, raf = null;
    var fetched = false;
    function fetchSheet() {
      if (fetched) return;
      if (!loaded) { pending.push(fetchSheet); return; }
      fetched = true; sheet.src = canvas.getAttribute('data-sheet');
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es, io) { if (es[0].isIntersecting) { fetchSheet(); io.disconnect(); } }, { rootMargin: '120% 0px' }).observe(canvas);
    } else fetchSheet();

    function size() {
      var r = canvas.getBoundingClientRect();
      if (!r.width) return;
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      current = -1; draw();
    }
    function draw() {
      if (!ready) return;
      var i = Math.round(shown * (N - 1));
      if (i === current) return;
      current = i;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(sheet, (i % COLS) * CW, Math.floor(i / COLS) * CH, CW, CH, 0, 0, canvas.width, canvas.height);
      if (canvas.onframe) canvas.onframe(shown);
    }
    function tick() {
      raf = null;
      var d = target - shown;
      shown += reduceMotion ? d : d * 0.34;
      if (Math.abs(target - shown) < 0.002) shown = target;
      draw();
      if (shown !== target) raf = requestAnimationFrame(tick);
    }
    canvas.flSheetSet = function (p) {
      target = Math.min(1, Math.max(0, p));
      if (!raf) raf = requestAnimationFrame(tick);
    };
    canvas.flSheetShown = function () { return shown; };
    sheet.addEventListener('load', function () {
      ready = true; canvas.classList.add('is-ready');
      if (first) first.hidden = true;
      size(); current = -1; draw();
    });
    window.addEventListener('resize', size);
    size();
  }
  document.querySelectorAll('canvas[data-fl-sheet]').forEach(sheetCanvas);

})();
