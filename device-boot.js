/* device-boot.js — the doctors hero's device. The pre-rendered still is in
   the HTML and shows at once; once the page has loaded and the browser is
   idle, device3d.js is imported and the live scene fades in over it at the
   same pose. Skipped for reduced motion, data saver, small screens and
   machines without WebGL, where the still is the right answer. */
(function () {
  'use strict';
  var stage = document.querySelector('[data-device3d]');
  if (!stage) return;
  var conn = navigator.connection || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || conn.saveData || window.innerWidth < 900 || !window.WebGLRenderingContext) return;
  var start = function () {
    import('./device3d.js')
      .then(function (m) { return m.mount(stage); })
      .catch(function (err) { console.warn('device3d: staying on the still', err); });
  };
  var idle = function () { (window.requestIdleCallback || setTimeout)(start, { timeout: 2500 }); };
  if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle);
})();
