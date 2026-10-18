/* device3d.js — the doctors hero: the flacara h1 on the back of an iPhone,
   rendered live. Never on the critical path: device-boot.js shows the
   pre-rendered still at once and only imports this once the page has loaded
   and the browser is idle. The scene opens at exactly the still's pose, so
   the canvas can fade in over it; then the ring lights up LED by LED, and
   the pair floats, turns with the pointer, and lifts as the hero scrolls.

   tools/render-device-hero.html renders the still from this same setup. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { seatDevice } from './device-fit.js';

const PHONE_URL = 'models/iphone-15-pro.glb';
const DEVICE_URL = 'models/flacara-v5.glb';
export const ASPECT = 4 / 5;
// the hero pose: back of the phone to camera, turned so the housing's depth reads
// the software hero's phone pose, mirrored: there the screen faces up-left; here the back faces up-right
export const BASE = { x: -0.22, y: 0.38, z: 0.26 };
const LED_MATERIALS = ['Opaque(228,227,207)', 'Opaque(210,209,199)'];
const LED_COLOR = new THREE.Color(0xfff2dc);

// the two models are fetched once per page, however many scenes use them
const assets = {};
function loadAssets(base) {
  if (!assets[base]) {
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/');
    const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
    assets[base] = Promise.all([loader.loadAsync(base + PHONE_URL), loader.loadAsync(base + DEVICE_URL)]);
  }
  return assets[base];
}

export async function createScene(renderer, base = '') {

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(24, ASPECT, 0.01, 100);

  const [phG, dvG] = await loadAssets(base);
  const ph = { scene: phG.scene.clone(true) }, dv = { scene: dvG.scene.clone(true) };
  const phone = ph.scene;
  // centred on the phone body (measured before the device goes on), so a
  // turn about the vertical axis keeps the phone in place and the housing
  // swings round it; framed with room for the housing's overhang
  const bare = new THREE.Box3().setFromObject(phone);
  const size = bare.getSize(new THREE.Vector3());
  phone.position.sub(bare.getCenter(new THREE.Vector3()));
  const holder = seatDevice(phone, dv.scene);
  // the housing throws a shadow onto the phone's back; the phone catches it
  dv.scene.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  ph.scene.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });

  // the LEDs: every mesh in the ring's two LED materials, ordered by angle
  // around the housing so they can light in sequence
  const leds = [];
  dv.scene.traverse((o) => {
    if (!o.isMesh) return;
    const name = o.userData.sourceMaterial;
    if (!LED_MATERIALS.includes(name)) return;
    const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
    holder.worldToLocal(c);
    if (Math.hypot(c.x, c.y) < 0.3) return; // parts near the axis aren't ring LEDs
    o.material = o.material.clone();
    o.material.emissive = LED_COLOR; o.material.emissiveIntensity = 0;
    leds.push({ mesh: o, angle: Math.atan2(c.y, c.x) });
  });
  leds.sort((a, b) => a.angle - b.angle);

  // the ring is a real light source: a warm point light at the glass that
  // falls on the phone's back and the housing's rim, and six small lights
  // spaced around the ring so its own face lights unevenly, like LEDs do.
  // Intensities are in candela (physical units) at the model's metre scale.
  const ringLight = new THREE.PointLight(0xfff0d8, 0, 0.22, 2);
  ringLight.position.set(0, 0, 0.38); holder.add(ringLight);
  const ledLights = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const l = new THREE.PointLight(0xfff2dc, 0, 0.05, 2);
    l.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.4);
    holder.add(l); ledLights.push(l);
  }

  const pivot = new THREE.Group(); pivot.add(phone); scene.add(pivot);
  pivot.rotation.set(BASE.x, BASE.y, BASE.z);
  camera.position.set(0, 0.012, size.y * 2.9); camera.lookAt(0, 0.012, 0);
  // studio: one soft key from upper left that casts the housing's shadow,
  // a cool fill from the right, and a warm rim from behind for the edges
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-0.25, 0.4, 0.5); scene.add(key);
  // phones get a lighter shadow map; they also cap the pixel ratio below
  const small = window.innerWidth < 900;
  key.castShadow = true; key.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048); key.shadow.radius = 6; key.shadow.bias = -0.0003;
  const d = 0.12; Object.assign(key.shadow.camera, { left: -d, right: d, top: d, bottom: -d, near: 0.05, far: 2 });
  const fill = new THREE.DirectionalLight(0xdce6ff, 0.45); fill.position.set(3, 1, 4); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffe4d6, 0.8); rim.position.set(4, -2, -3); scene.add(rim);

  // ring: 0 = dark, 1 = fully lit; the sweep lights LEDs in order of angle
  function setRing(t) {
    const n = leds.length;
    leds.forEach((l, i) => {
      const on = THREE.MathUtils.clamp((t * (n + 6) - i) / 6, 0, 1);
      l.mesh.material.emissiveIntensity = on * 4.5;
    });
    const lit = THREE.MathUtils.smoothstep(t, 0.15, 1);
    ringLight.intensity = lit * 0.075;
    ledLights.forEach((l, i) => { l.intensity = lit * 0.014 * (0.8 + 0.2 * Math.sin(i * 2.1)); });
  }
  return { scene, camera, pivot, holder, phone, size, setRing, screen: phone.getObjectByName('xXDHkMplTIDAXLN') };
}

const PIXEL_CAP = () => Math.min(window.devicePixelRatio || 1, window.innerWidth < 900 ? 1.75 : 2);
export async function mount(stage) {
  const still = stage.querySelector('img');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(PIXEL_CAP());
  const { scene, camera, pivot, setRing } = await createScene(renderer);

  const canvas = renderer.domElement;
  canvas.className = 'fl-device3d__canvas'; canvas.setAttribute('aria-hidden', 'true');
  stage.appendChild(canvas);
  const resize = () => {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
  };
  resize(); new ResizeObserver(resize).observe(stage);

  let px = 0, py = 0;
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width - 0.5; py = (e.clientY - r.top) / r.height - 0.5;
  });
  stage.addEventListener('pointerleave', () => { px = 0; py = 0; });

  let t0 = performance.now();
  let visible = true, raf = null;
  const small = window.innerWidth < 900;
  const frame = (now) => {
    raf = visible ? requestAnimationFrame(frame) : null;
    const t = (now - t0) / 1000;
    // no movement at all while the canvas is crossfading in (it would read as
    // two phones), then the sway, the pointer and the scroll lift ease in.
    // On phones the hero stacks and is scrolled past at once, so the scroll
    // lift stays off there — it moved the model away from the still's spot.
    const sway = reduceMotion ? 0 : THREE.MathUtils.smoothstep(t, 1.0, 2.6);
    const s = small ? 0 : Math.min(1, window.scrollY / window.innerHeight) * sway;
    const ease = 1 - s * 0.6;
    // the ring lights up 0.6s after the canvas lands, over 1.4s, then breathes
    const lit = reduceMotion ? 1 : THREE.MathUtils.clamp((t - 0.6) / 1.4, 0, 1);
    setRing(lit * (0.94 + 0.06 * Math.sin(t * 1.6)));
    const tx = BASE.x * ease - py * 0.22 * sway + sway * 0.03 * Math.sin(t * 0.7);
    const ty = BASE.y * ease + px * 0.45 * sway + sway * 0.10 * Math.sin(t * 0.45);
    const tz = BASE.z * ease + sway * 0.015 * Math.sin(t * 0.9);
    pivot.rotation.x += (tx - pivot.rotation.x) * 0.06;
    pivot.rotation.y += (ty - pivot.rotation.y) * 0.06;
    pivot.rotation.z += (tz - pivot.rotation.z) * 0.06;
    pivot.position.y = sway * 0.004 * Math.sin(t * 0.8) - s * 0.03;
    renderer.render(scene, camera);
  };
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  }).observe(stage);

  setRing(0);
  renderer.render(scene, camera);
  // first frame is up: tell the draw-in it can hand straight to us. If the
  // drawing has already handed off to the still, come in over the still.
  const show = () => { t0 = performance.now(); if (!raf) raf = requestAnimationFrame(frame); };
  stage.classList.add('is-3d-ready');
  if (stage.classList.contains('is-3d')) show();
  else if (stage.classList.contains('is-drawn')) { await new Promise((r) => setTimeout(r, 300)); stage.classList.add('is-3d'); show(); }
  else {
    await new Promise((resolve) => {
      const mo = new MutationObserver(() => { if (stage.classList.contains('is-3d')) { mo.disconnect(); resolve(); } });
      mo.observe(stage, { attributes: true, attributeFilter: ['class'] });
    });
    show();
  }
}

/* ---------- the doctors run-through, live ----------
   The whole pinned phone of the run-through, rendered on the spot at the
   screen's own pixel density: step 01 is the device coming down onto the
   phone and the turn to the front (scrubbed by scroll); the later steps swap
   the screen with a crossfade on the same phone, and the comparison step
   turns it sideways — so there is never a handoff to a different drawing.
   Framed through a view offset so it sits on exactly the box the sprite
   sheet's cells use (the fallback where WebGL isn't there). motion.js
   drives it: container.flTurnSet(p), flRunStep(i), flRunLandscape(e). */
const TURN_FULL = { w: 1200, h: 1600 };                      // the sheet renderer's frame
const TURN_VIEW = { x: 104.33, y: 0, w: 1075.05, h: 1459 }; // the part of it a cell shows
export async function mountRun(container, screenUrls) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(PIXEL_CAP());
  const { scene, camera, pivot, holder, setRing, screen } = await createScene(renderer);
  camera.aspect = TURN_FULL.w / TURN_FULL.h; camera.position.z *= 1.22;
  camera.setViewOffset(TURN_FULL.w, TURN_FULL.h, TURN_VIEW.x, TURN_VIEW.y, TURN_VIEW.w, TURN_VIEW.h);
  camera.updateProjectionMatrix();

  // the screen is a canvas texture, so one screenshot can crossfade to the next
  const imgs = await Promise.all(screenUrls.map((u) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = u; })));
  const sc = document.createElement('canvas'); sc.width = 620; sc.height = 1348;
  const sctx = sc.getContext('2d');
  const stex = new THREE.CanvasTexture(sc);
  stex.colorSpace = THREE.SRGBColorSpace; stex.flipY = true; stex.anisotropy = 8;
  if (screen) screen.material = new THREE.MeshBasicMaterial({ map: stex, toneMapped: false });
  const cover = (im) => { // like object-fit: cover
    const s = Math.max(sc.width / im.width, sc.height / im.height), w = im.width * s, h = im.height * s;
    sctx.drawImage(im, (sc.width - w) / 2, (sc.height - h) / 2, w, h);
  };
  let fromS = 0, toS = 0, fade = 1;
  function drawScreen() {
    sctx.globalAlpha = 1; sctx.clearRect(0, 0, sc.width, sc.height); cover(imgs[fromS]);
    if (fade < 1) { sctx.globalAlpha = fade; cover(imgs[toS]); }
    stex.needsUpdate = true;
  }
  drawScreen();

  const seated = holder.position.clone();
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  let shown = 0, target = 0, land = 0, landTarget = 0, landScale = 0.88;
  function pose() {
    const p = shown;
    const a = easeOut(Math.min(1, p / 0.58));
    holder.position.copy(seated).add(new THREE.Vector3(0.03, 0.03, 0.12).multiplyScalar(1 - a));
    holder.rotation.set(-0.7 * (1 - a), 0.55 * (1 - a), 0.25 * (1 - a));
    setRing(Math.max(0, Math.min(1, (p - 0.5) / 0.14)));
    const t = easeInOut(Math.max(0, Math.min(1, (p - 0.6) / 0.4)));
    // the comparison step turns the phone on its side, as the CSS phone does
    pivot.rotation.set(lerp(BASE.x, 0, t) + 0.08 * Math.sin(t * Math.PI), lerp(BASE.y, Math.PI, t), lerp(BASE.z, 0, t) - Math.PI / 2 * land);
    pivot.scale.setScalar(1 - (1 - landScale) * land);
  }
  const canvas = renderer.domElement;
  canvas.className = 'fl-swap__turn-live'; canvas.setAttribute('aria-hidden', 'true');
  const resize = () => {
    const r = container.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    landScale = parseFloat(getComputedStyle(container).getPropertyValue('--land-scale')) || 0.88;
    dirty = true; if (!raf) raf = requestAnimationFrame(tick);
  };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = null, dirty = true;
  const tick = () => {
    raf = null;
    let moving = false;
    const d = target - shown; shown += reduceMotion ? d : d * 0.34;
    if (Math.abs(target - shown) < 0.0015) shown = target; else moving = true;
    const dl = landTarget - land; land += reduceMotion ? dl : dl * 0.3;
    if (Math.abs(landTarget - land) < 0.002) land = landTarget; else moving = true;
    if (fade < 1) { fade = Math.min(1, fade + (reduceMotion ? 1 : 0.07)); drawScreen(); if (fade >= 1) { fromS = toS; drawScreen(); } else moving = true; }
    if (moving || dirty) { dirty = false; pose(); renderer.render(scene, camera); }
    if (moving) raf = requestAnimationFrame(tick);
  };
  const wake = () => { if (!raf) raf = requestAnimationFrame(tick); };
  container.flTurnSet = (p) => { target = Math.min(1, Math.max(0, p)); wake(); };
  container.flTurnShown = () => shown;
  // steps 1..n map to screenUrls[1..]; step 0 shows the first screen through the turn
  container.flRunStep = (i) => { const n = Math.max(0, Math.min(imgs.length - 1, i)); if (n === toS) return; fromS = (fade < 1) ? toS : fromS; toS = n; fade = 0; wake(); };
  container.flRunLandscape = (e) => { landTarget = Math.min(1, Math.max(0, e)); wake(); };
  resize(); new ResizeObserver(resize).observe(container);
  pose(); renderer.render(scene, camera);
  container.appendChild(canvas);
  container.classList.add('is-live');
  container.closest('.fl-swap__stage').classList.add('is-live');
  return container;
}
