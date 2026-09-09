/* motion.js — Stage 3 interaction layer. Shared across every page.
   Everything here is progressive: with JS or IntersectionObserver absent,
   [data-reveal] elements are visible by default (see flacara.css), so
   nothing depends on this file for content to appear. */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll progress ---------- */
  var bar = document.querySelector('.fl-progress__bar');
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- nav: compact once the page has moved ---------- */
  var nav = document.querySelector('.fl-nav');
  if (nav) {
    var navState = function () { nav.classList.toggle('is-scrolled', window.scrollY > 24); };
    document.addEventListener('scroll', navState, { passive: true });
    navState();
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- counting numbers into place ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    counters.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;
      if (reduceMotion || !('IntersectionObserver' in window)) { el.textContent = target; return; }
      var done = false;
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || done) return;
          done = true;
          cio.unobserve(entry.target);
          var start = null, duration = 1000;
          function ease(t) { return 1 - Math.pow(1 - t, 3); }
          function frame(now) {
            if (start === null) start = now;
            var t = Math.min(1, (now - start) / duration);
            el.textContent = Math.round(target * ease(t));
            if (t < 1) requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
        });
      }, { threshold: 0.6 });
      cio.observe(el);
    });
  }

  /* ---------- magnetic tilt: cards, tiles, the device photograph ----------
     No hover-capability gate: some embedded/webview browsers misreport
     `(hover: hover)`, which silently drops the listener and makes the
     effect look like it only fires on click. pointermove costs nothing to
     attach on a touch device — it simply won't fire without a pointer. */
  if (!reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      var raf = null;
      el.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform = 'perspective(1000px) rotateX(' + (py * -5).toFixed(2) + 'deg) rotateY(' + (px * 7).toFixed(2) + 'deg) translateY(-3px)';
        });
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- hero aperture: rings drift toward the cursor ----------
     rAF-throttled: a raw pointermove handler that reads
     getBoundingClientRect() on every event forces a layout on every
     trackpad tick, which is heavy enough on some machines that the whole
     page — cursor included — starts to feel unresponsive. */
  var hero = document.querySelector('.fl-hero-aper');
  if (hero && !reduceMotion) {
    var heroRaf = null, heroX = 0, heroY = 0;
    hero.addEventListener('pointermove', function (e) {
      heroX = e.clientX; heroY = e.clientY;
      if (heroRaf) return;
      heroRaf = requestAnimationFrame(function () {
        heroRaf = null;
        var r = hero.getBoundingClientRect();
        hero.style.setProperty('--px', (((heroX - r.left) / r.width) - 0.5).toFixed(3));
        hero.style.setProperty('--py', (((heroY - r.top) / r.height) - 0.5).toFixed(3));
      });
    });
    hero.addEventListener('pointerleave', function () {
      hero.style.setProperty('--px', 0);
      hero.style.setProperty('--py', 0);
    });
  }

  /* ---------- hero: the traced outline hands off to the device reveal ----------
     Waits on the last fl-trace to end rather than on a clock: a backgrounded tab
     pauses CSS animations but still runs timers, and a timer would zoom out over a
     half-drawn outline. Playback then waits out the crossfade, because the clip has
     no still head — it is already moving on frame 1. */
  var handoff = document.querySelector('[data-fl-reveal]');
  var clip = handoff && handoff.querySelector('.fl-reveal__vid');
  if (handoff && clip && !reduceMotion) {
    /* ponytail: UA sniff. Nothing reports "can decode alpha in WebM", and Safari
       plays VP9 WebM with the alpha silently dropped — a black box, worse than the
       still. Delete this once an HEVC-with-alpha MP4 exists for Safari. */
    if (!/^((?!chrome|chromium|crios|fxios|edg|android).)*safari/i.test(navigator.userAgent)) {
      clip.src = clip.getAttribute('data-src') + '#t=0.001'; /* paints frame 0 while paused */
      handoff.classList.add('has-video');
    }
    var pending = handoff.querySelectorAll('.fl-outline path').length;
    handoff.addEventListener('animationend', function (e) {
      if (e.animationName !== 'fl-trace' || --pending) return;
      handoff.classList.add('is-handed-off');
      /* 900ms = the transform leg of the crossfade, see .is-handed-off in flacara.css */
      if (clip.src) setTimeout(function () { clip.play().catch(function () {}); }, 900);
    });
  }

  /* ---------- resolution slider: stop nudging once someone has dragged it ---------- */
  document.querySelectorAll('.fl-slider').forEach(function (s) {
    var input = s.querySelector('.fl-slider__input');
    if (!input) return;
    var mark = function () { s.classList.add('is-touched'); };
    input.addEventListener('pointerdown', mark, { once: true });
    input.addEventListener('keydown', mark, { once: true });
  });
})();
