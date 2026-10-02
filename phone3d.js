/* phone3d.js — the live 3D upgrade for the software hero's phone.
   Never on the critical path: phone-frames.js shows a pre-rendered snapshot
   immediately and only imports this module once the page has loaded and
   the browser is idle. It renders the same iPhone model at exactly the
   snapshot's pose and framing, then cross-fades its canvas in over the
   image, so the swap is invisible — after that the phone turns for real
   with the pointer and as the hero scrolls away.

   Model: "Apple iPhone 15 Pro Max Black" by polyman
   (https://sketchfab.com/Polyman_3D), CC-BY-4.0 —
   https://sketchfab.com/3d-models/apple-iphone-15-pro-max-black-df17520841214c1792fb8a44c6783ee7 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// must match tools/render-phone-frames.html, so the canvas lands exactly
// on top of the snapshot it replaces
const MODEL_URL = 'models/iphone-15-pro.glb';
const SCREEN_NODE = 'xXDHkMplTIDAXLN';
const BASE = { x: -0.22, y: -0.38, z: -0.26 };

export async function mount(wrap, screenUrl, img) {
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/');
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(24, 4 / 5, 0.01, 100);

  const [gltf, tex] = await Promise.all([
    loader.loadAsync(MODEL_URL),
    new THREE.TextureLoader().loadAsync(screenUrl),
  ]);
  tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = true; tex.anisotropy = 8;

  const phone = gltf.scene;
  const screen = phone.getObjectByName(SCREEN_NODE);
  if (screen) screen.material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });

  const box = new THREE.Box3().setFromObject(phone);
  const size = box.getSize(new THREE.Vector3());
  phone.position.sub(box.getCenter(new THREE.Vector3()));
  const facing = new THREE.Group(); facing.add(phone); facing.rotation.y = Math.PI;
  const pivot = new THREE.Group(); pivot.add(facing); scene.add(pivot);
  const tallest = Math.max(size.x, size.y, size.z);
  camera.position.set(0, 0, tallest * 2.75); camera.lookAt(0, 0, 0);
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(3, 4, 5); scene.add(key);
  pivot.rotation.set(BASE.x, BASE.y, BASE.z);

  const canvas = renderer.domElement;
  canvas.className = 'fl-phone-hero__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  wrap.appendChild(canvas);

  const resize = () => {
    const r = wrap.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(wrap);

  // pointer and scroll turn the real model; the float stays on the wrapper
  let px = 0, py = 0;
  wrap.addEventListener('pointermove', (e) => {
    const r = wrap.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width - 0.5;
    py = (e.clientY - r.top) / r.height - 0.5;
  });
  wrap.addEventListener('pointerleave', () => { px = 0; py = 0; });

  let visible = true, raf = null;
  const frame = () => {
    raf = visible ? requestAnimationFrame(frame) : null;
    const s = Math.min(1, window.scrollY / window.innerHeight);
    const ease = 1 - s * 0.7;
    const tx = BASE.x * ease - py * 0.25, ty = BASE.y * ease + px * 0.5, tz = BASE.z * ease;
    pivot.rotation.x += (tx - pivot.rotation.x) * 0.06;
    pivot.rotation.y += (ty - pivot.rotation.y) * 0.06;
    pivot.rotation.z += (tz - pivot.rotation.z) * 0.06;
    renderer.render(scene, camera);
  };
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  }).observe(wrap);

  // first frame on screen, then fade the canvas in over the snapshot
  renderer.render(scene, camera);
  requestAnimationFrame(() => {
    wrap.classList.add('is-3d');
    canvas.addEventListener('transitionend', () => { if (img) img.style.visibility = 'hidden'; }, { once: true });
    if (!raf) raf = requestAnimationFrame(frame);
  });
}
