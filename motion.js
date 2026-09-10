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
  var canvas = handoff && handoff.querySelector('.fl-reveal__canvas');
  var playBtn = handoff && handoff.querySelector('.fl-reveal__play');
  if (handoff && clip && !reduceMotion && clip.canPlayType('video/webm; codecs="vp9"')) {
    var isSafari = /^((?!chrome|chromium|crios|fxios|edg|android).)*safari/i.test(navigator.userAgent);
    clip.src = clip.getAttribute('data-src') + '#t=0.001'; /* paints frame 0 while paused */
    handoff.classList.add('has-video');

    /* ponytail: UA sniff. Nothing reports "can decode alpha in WebM", and Safari
       plays VP9 WebM with the alpha silently dropped to solid black instead of
       composited. Rather than fall back to the still there, the clip's own black
       matte is chroma-keyed out by hand, frame by frame, onto a canvas the same
       size and mask as the video — so Safari gets the motion too, just recomposited
       in software instead of by the decoder. Delete once an HEVC-with-alpha MP4
       exists for Safari and this can go back to being a plain <video>. */
    if (canvas && isSafari) {
      var ctx = canvas.getContext('2d');
      var off = document.createElement('canvas');
      var offCtx = off.getContext('2d', { willReadFrequently: true });
      /* the matte is a true black (0,0,0); a soft ramp between the two thresholds
         avoids a hard-edged cutout where the render itself anti-aliases into it */
      var lo = 10, hi = 46;
      var keying = false;
      /* only hides the raw (black-matte) video once a frame has actually been
         keyed onto the canvas — if playback or metadata never arrives, the
         video stays as the visible layer rather than leaving an empty hole */
      function keyFrame() {
        var w = clip.videoWidth, h = clip.videoHeight;
        if (!w) return false;
        if (canvas.width !== w) { canvas.width = w; canvas.height = h; off.width = w; off.height = h; }
        offCtx.drawImage(clip, 0, 0, w, h);
        var frame = offCtx.getImageData(0, 0, w, h);
        var d = frame.data;
        for (var i = 0; i < d.length; i += 4) {
          var luma = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
          var a = (luma - lo) / (hi - lo);
          d[i + 3] = a < 0 ? 0 : a > 1 ? 255 : Math.round(a * 255);
        }
        ctx.putImageData(frame, 0, 0);
        handoff.classList.add('is-keyed');
        return true;
      }
      function loop() {
        if (!keying) return;
        keyFrame();
        if (clip.ended) { keying = false; return; }
        if (clip.requestVideoFrameCallback) clip.requestVideoFrameCallback(loop);
        else requestAnimationFrame(loop);
      }
      function start() {
        if (keying || !keyFrame()) return;
        keying = true;
        loop();
      }
      clip.addEventListener('loadeddata', start);
      clip.addEventListener('play', start);
      start(); /* paints frame 0 immediately if metadata is already there */
    }

    clip.addEventListener('error', function () {
      handoff.classList.remove('has-video', 'is-keyed'); /* falls back to the still */
    });

    /* Low Power Mode (confirmed on a real device) suppresses autoplay
       outright — a script-triggered play() rejects with NotAllowedError.
       Not fixable from here; the platform only honours a play() that traces
       back to a genuine user gesture. Retry on the page's first one, so it
       recovers instead of sitting frozen forever — 'ended' also leaves
       paused true, so that has to be checked too or a later click would
       restart the clip instead of leaving it settled on its last frame. */
    var gestureKinds = ['pointerdown', 'touchstart', 'keydown', 'scroll'];
    function retryOnGesture() {
      if (clip.ended || !clip.paused) { gestureKinds.forEach(function (k) { document.removeEventListener(k, retryOnGesture); }); return; }
      clip.play().catch(function () {});
    }
    if (isSafari) gestureKinds.forEach(function (k) { document.addEventListener(k, retryOnGesture, { passive: true }); });

    /* there is no API to ask the platform "is autoplay being blocked" — the
       only signal available is whether play() actually took, checked a beat
       after asking. If it didn't, show an explicit control rather than
       leaving the frozen frame with no clue that a tap would start it. */
    if (playBtn) {
      playBtn.hidden = false; /* CSS now owns visibility via .awaiting-play */
      playBtn.addEventListener('click', function () {
        clip.play().catch(function () {});
      });
      clip.addEventListener('playing', function () { handoff.classList.remove('awaiting-play'); });
    }

    var pending = handoff.querySelectorAll('.fl-outline path').length;
    handoff.addEventListener('animationend', function (e) {
      if (e.animationName !== 'fl-trace' || --pending) return;
      handoff.classList.add('is-handed-off');
      /* 900ms = the transform leg of the crossfade, see .is-handed-off in flacara.css */
      setTimeout(function () {
        clip.play().catch(function () {});
        setTimeout(function () {
          if (playBtn && clip.paused && !clip.ended) handoff.classList.add('awaiting-play');
        }, 400);
      }, 900);
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

  /* ---------- body-mesh tracking: the reticle finds each red dot in turn ----------
     Pulls its target straight off each pin's own --x/--y, so the pins stay the
     single source of truth for where the dots actually are on the image. */
  document.querySelectorAll('[data-track]').forEach(function (mesh) {
    var pins = Array.prototype.slice.call(mesh.querySelectorAll('[data-track-pin]'));
    var reticle = mesh.querySelector('.fl-track-reticle');
    if (!pins.length || !reticle) return;
    var card = mesh.closest('.fl-tracking-card');
    var logItems = card ? Array.prototype.slice.call(card.querySelectorAll('[data-track-log-item]')) : [];

    function target(idx) {
      pins.forEach(function (p) { p.classList.remove('is-targeted'); });
      logItems.forEach(function (li) { li.classList.remove('is-targeted'); });
      pins[idx].classList.add('is-targeted');
      if (logItems[idx]) logItems[idx].classList.add('is-targeted');
      reticle.style.left = pins[idx].style.getPropertyValue('--x');
      reticle.style.top = pins[idx].style.getPropertyValue('--y');
    }

    target(0);
    if (reduceMotion) return;

    var i = 0;
    setInterval(function () {
      i = (i + 1) % pins.length;
      target(i);
    }, 2400);
  });
})();
