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
export const BASE = { x: 0.10, y: 0.42, z: -0.05 };
const LED_MATERIALS = ['Opaque(228,227,207)', 'Opaque(210,209,199)'];
const LED_COLOR = new THREE.Color(0xfff2dc);

export async function createScene(renderer, base = '') {
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/');
  const loader = new GLTFLoader(); loader.setDRACOLoader(draco);

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(24, ASPECT, 0.01, 100);

  const [ph, dv] = await Promise.all([loader.loadAsync(base + PHONE_URL), loader.loadAsync(base + DEVICE_URL)]);
  const phone = ph.scene;
  const holder = seatDevice(phone, dv.scene);
  // framed on the pair, device included, so the housing's overhang isn't cropped
  const box = new THREE.Box3().setFromObject(phone);
  const size = box.getSize(new THREE.Vector3());
  phone.position.sub(box.getCenter(new THREE.Vector3()));

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

  // a soft glow over the glass, additive, for when the ring is lit
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), r = g.createRadialGradient(128, 128, 20, 128, 128, 128);
    r.addColorStop(0, 'rgba(255,240,215,.85)'); r.addColorStop(0.45, 'rgba(255,235,205,.28)'); r.addColorStop(1, 'rgba(255,230,200,0)');
    g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.setScalar(1.6); glow.position.set(0, 0, 0.42); holder.add(glow);

  const pivot = new THREE.Group(); pivot.add(phone); scene.add(pivot);
  pivot.rotation.set(BASE.x, BASE.y, BASE.z);
  camera.position.set(0, 0, size.y * 2.75); camera.lookAt(0, 0, 0);
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe4d6, 0.9); rim.position.set(4, -2, -3); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xdce6ff, 0.5); fill.position.set(3, 1, 4); scene.add(fill);

  // ring: 0 = dark, 1 = fully lit; the sweep lights LEDs in order of angle
  function setRing(t) {
    const n = leds.length;
    leds.forEach((l, i) => {
      const on = THREE.MathUtils.clamp((t * (n + 6) - i) / 6, 0, 1);
      l.mesh.material.emissiveIntensity = on * 1.8;
    });
    glow.material.opacity = THREE.MathUtils.smoothstep(t, 0.3, 1) * 0.5;
  }
  return { scene, camera, pivot, setRing };
}

export async function mount(stage) {
  const still = stage.querySelector('img');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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

  const t0 = performance.now();
  let visible = true, raf = null;
  const frame = (now) => {
    raf = visible ? requestAnimationFrame(frame) : null;
    const t = (now - t0) / 1000;
    const s = Math.min(1, window.scrollY / window.innerHeight);
    const ease = 1 - s * 0.6;
    // the ring lights up 0.6s after the canvas lands, over 1.4s, then breathes
    const lit = reduceMotion ? 1 : THREE.MathUtils.clamp((t - 0.6) / 1.4, 0, 1);
    setRing(lit * (0.94 + 0.06 * Math.sin(t * 1.6)));
    const sway = reduceMotion ? 0 : 1;
    const tx = BASE.x * ease - py * 0.22 + sway * 0.03 * Math.sin(t * 0.7);
    const ty = BASE.y * ease + px * 0.45 + sway * 0.10 * Math.sin(t * 0.45);
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
  requestAnimationFrame(() => {
    stage.classList.add('is-3d');
    canvas.addEventListener('transitionend', () => { if (still) still.style.visibility = 'hidden'; }, { once: true });
    if (!raf) raf = requestAnimationFrame(frame);
  });
}
