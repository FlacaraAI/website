/* phone3d.js — a real iPhone 15 Pro model (glTF), rendered with three.js,
   with an app screenshot mapped onto its actual screen mesh. This is the
   same approach Apple-style product pages use: a modelled device + an
   environment map for believable titanium/glass reflections + the UI as a
   texture on the display.

   Model: "Apple iPhone 15 Pro Max Black" by polyman
   (https://sketchfab.com/Polyman_3D), CC-BY-4.0 —
   https://sketchfab.com/3d-models/apple-iphone-15-pro-max-black-df17520841214c1792fb8a44c6783ee7

   Every [data-phone3d] container gets one. If WebGL or the model fails to
   load, the container is left empty rather than breaking the page. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// the model's geometry is Draco-compressed; the decoder ships with three
const draco = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(draco);

const MODEL_URL = 'models/iphone-15-pro.glb';
const SCREEN_NODE = 'xXDHkMplTIDAXLN';

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = true; // this model's screen UVs run the other way to glTF's default
      tex.anisotropy = 8;
      resolve(tex);
    }, undefined, reject);
  });
}

async function initOne(container) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(24, 1, 0.01, 100);

  const [gltf, screenTex] = await Promise.all([
    gltfLoader.loadAsync(MODEL_URL),
    loadTexture(container.getAttribute('data-screen')),
  ]);

  const phone = gltf.scene;
  const screen = phone.getObjectByName(SCREEN_NODE);
  if (screen) {
    // unlit, so the UI shows its true colours instead of being shaded
    screen.material = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
  }

  // centre the model on the origin and size the camera to it
  const box = new THREE.Box3().setFromObject(phone);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  phone.position.sub(center);

  // the model is authored facing away from the camera — turn the display to us
  const facing = new THREE.Group();
  facing.add(phone);
  facing.rotation.y = Math.PI;
  const pivot = new THREE.Group();
  pivot.add(facing);
  scene.add(pivot);

  const tallest = Math.max(size.x, size.y, size.z);
  camera.position.set(0, 0, tallest * 2.75);
  camera.lookAt(0, 0, 0);

  // a soft key from the upper right on top of the environment, so the
  // titanium band catches a clear highlight along its edge
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(3, 4, 5);
  scene.add(key);

  container.appendChild(renderer.domElement);

  // the phone points up: its top corner rises to the upper right, while
  // the screen tips back and turns toward the headline, so the screen's
  // own vector aims up-left and still mostly at the viewer
  const baseY = -0.38, baseX = -0.22, baseZ = -0.26;
  pivot.rotation.set(baseX, baseY, baseZ);
  let pointerX = 0, pointerY = 0, pointer = false;

  container.addEventListener('pointermove', (e) => {
    const r = container.getBoundingClientRect();
    pointerY = ((e.clientX - r.left) / r.width - 0.5) * 0.6;
    pointerX = -((e.clientY - r.top) / r.height - 0.5) * 0.3;
    pointer = true;
  });
  container.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; pointer = false; });

  let scrollP = 0;
  const onScroll = () => { scrollP = Math.min(1, window.scrollY / window.innerHeight); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function resize() {
    const r = container.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(container);

  let t = 0, raf = null;
  function frame() {
    raf = requestAnimationFrame(frame);
    t += 1 / 60;
    // slow drift through angles when idle, like it's turning in zero-g
    const driftY = pointer ? 0 : Math.sin(t * 0.32) * 0.1;
    const driftX = pointer ? 0 : Math.sin(t * 0.23 + 1) * 0.05;
    // scrolling unwinds it toward upright as the hero leaves
    const ease = 1 - scrollP * 0.7;
    const targetY = baseY * ease + driftY + pointerY;
    const targetX = baseX * ease + driftX + pointerX;
    const targetZ = baseZ * ease + Math.sin(t * 0.27) * 0.02;
    pivot.rotation.x += (targetX - pivot.rotation.x) * 0.05;
    pivot.rotation.y += (targetY - pivot.rotation.y) * 0.05;
    pivot.rotation.z += (targetZ - pivot.rotation.z) * 0.05;
    pivot.position.y = Math.sin(t * 0.6) * tallest * 0.014;
    renderer.render(scene, camera);
  }
  if (reduceMotion) renderer.render(scene, camera);
  else frame();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; }
    else if (!document.hidden && !raf && !reduceMotion) frame();
  });

  container.classList.add('is-ready');
}

document.querySelectorAll('[data-phone3d]').forEach((el) => {
  initOne(el).catch((err) => console.warn('phone3d:', err));
});
