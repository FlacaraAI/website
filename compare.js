/* compare.js — the drag-to-compare sliders ([data-fl-slider]) and the pinned
   gallery that scrolls them sideways ([data-fl-scrub]). Shared by the doctors
   and patients pages. */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* each slider gets a one-time sweep (6% → 94% → 50%) so it's obvious it can be dragged */
  Array.prototype.forEach.call(document.querySelectorAll('[data-fl-slider]'), function (wrap) {
    var input = wrap.querySelector('.fl-slider__input');
    if (!input) return;
    function set(v) { wrap.style.setProperty('--pos', v + '%'); }
    input.addEventListener('input', function () { set(input.value); });

    /* drag anywhere on the image, not just the thumb — a native range on
       iOS only moves if the finger lands right on its thumb. touch-action:
       pan-y leaves vertical swipes to the page and sends sideways ones here. */
    var dragging = false;
    function follow(e) {
      var r = wrap.getBoundingClientRect();
      var v = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100));
      input.value = v; set(v);
    }
    wrap.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      dragging = true; played = true;
      wrap.classList.add('is-touched');
      try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
      if (e.pointerType === 'mouse') { follow(e); e.preventDefault(); }
    });
    wrap.addEventListener('pointermove', function (e) { if (dragging) follow(e); });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      wrap.addEventListener(t, function () { dragging = false; });
    });

    var played = false;
    wrap.flSweep = function () {
      if (played || reduceMotion) return;
      played = true;
      var start = null, duration = 1100, from = 6, mid = 94, to = 50;
      function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
      function frame(now) {
        if (start === null) start = now;
        var t = Math.min(1, (now - start) / duration);
        var e = ease(t);
        var v = e < .5 ? from + (mid - from) * (e / .5) : mid + (to - mid) * ((e - .5) / .5);
        set(v);
        input.value = v;
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    };

    /* sliders inside the scrub sweep when their frame comes up, not on page entry */
    if (wrap.closest('[data-fl-scrub]')) return;
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { wrap.flSweep(); io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(wrap);
  });

  /* scrub: a gallery strip pinned for (n) screen-heights of scroll. Which shot
     is centred is read straight off scroll position rather than from observer
     bands, so fast trackpad flicks can't skip a step or leave it stale; the
     strip then slides sideways to it. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-fl-scrub]'), function (scrub) {
    var shots = scrub.querySelectorAll('[data-scrub-shot]');
    var caps = scrub.querySelectorAll('[data-scrub-cap]');
    var tabs = scrub.querySelectorAll('[data-scrub-go]');
    var prev = scrub.querySelector('[data-scrub-step="-1"]');
    var next = scrub.querySelector('[data-scrub-step="1"]');
    var n = shots.length, current = -1, ticking = false;

    function show(idx, quiet) {
      if (idx === current) return;
      current = idx;
      scrub.style.setProperty('--idx', idx);
      for (var i = 0; i < n; i++) {
        var state = i < idx ? 'is-past' : i === idx ? 'is-active' : 'is-next';
        shots[i].className = 'fl-scrub__shot ' + state;
        caps[i].className = 'fl-scrub__cap ' + state;
        tabs[i].classList.toggle('is-active', i === idx);
        if (i === idx) tabs[i].setAttribute('aria-current', 'step');
        else tabs[i].removeAttribute('aria-current');
        shots[i].firstElementChild.toggleAttribute('inert', i !== idx);
      }
      prev.disabled = idx === 0;
      next.disabled = idx === n - 1;
      var slider = shots[idx].querySelector('[data-fl-slider]');
      if (!quiet && slider && slider.flSweep) setTimeout(slider.flSweep, 450);
    }

    function go(i) {
      i = Math.max(0, Math.min(n - 1, i));
      var run = scrub.offsetHeight - window.innerHeight;
      var top = scrub.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + run * (i + 0.5) / n, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    function update() {
      ticking = false;
      var r = scrub.getBoundingClientRect();
      var run = r.height - window.innerHeight;
      var p = run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
      scrub.style.setProperty('--p', p.toFixed(4));
      if (r.top > window.innerHeight * 0.4) return;
      show(Math.min(n - 1, Math.floor(p * n)));
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }

    Array.prototype.forEach.call(tabs, function (tab) {
      tab.addEventListener('click', function () { go(+tab.getAttribute('data-scrub-go')); });
    });
    Array.prototype.forEach.call(shots, function (shot, i) {
      shot.addEventListener('click', function () { if (i !== current) go(i); });
    });
    prev.addEventListener('click', function () { go(Math.max(current, 0) - 1); });
    next.addEventListener('click', function () { go(Math.max(current, 0) + 1); });

    show(0, true);
    current = -1;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  });
})();
