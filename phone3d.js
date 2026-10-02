/* phone3d.js — an actual WebGL render of the phone, not a CSS skew.
   Finds every [data-phone3d] container, builds a rounded-box mesh sized
   like a real phone, bakes the screenshot + bezel + island + home-bar onto
   its front face as a canvas texture, lights it, and renders it with a
   real perspective camera. Degrades to nothing (container stays empty) if
   WebGL or module imports fail — never blocks the rest of the page. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

function buildScreenTexture(imgUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = 640, h = Math.round(640 * (img.height / img.width));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');

      // bezel
      ctx.fillStyle = '#060708';
      ctx.fillRect(0, 0, w, h);

      // screenshot, inset
      const inset = Math.round(w * 0.028);
      const sw = w - inset * 2, sh = h - inset * 2;
      ctx.save();
      roundedRectPath(ctx, inset, inset, sw, sh, w * 0.1);
      ctx.clip();
      ctx.drawImage(img, inset, inset, sw, sh);
      ctx.restore();

      // dynamic island
      const islandW = w * 0.27, islandH = w * 0.085;
      ctx.fillStyle = '#000';
      roundedRectPath(ctx, (w - islandW) / 2, inset + w * 0.045, islandW, islandH, islandH / 2);
      ctx.fill();

      // home indicator
      const barW = w * 0.34, barH = h * 0.006;
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      roundedRectPath(ctx, (w - barW) / 2, h - inset - barH - w * 0.012, barW, barH, barH / 2);
      ctx.fill();

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      resolve(tex);
    };
    img.onerror = reject;
    img.src = imgUrl;
  });
}

/* the back face: a camera plateau with three lenses, top-left — the single
   biggest cue that reads "iPhone Pro" rather than "generic dark rectangle"
   from any angle that catches the back. */
function buildBackTexture() {
  const w = 320, h = Math.round(320 * (146.6 / 70.6));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#948e82');
  grad.addColorStop(0.5, '#827c70');
  grad.addColorStop(1, '#716b60');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const plateauX = w * 0.1, plateauY = w * 0.1, plateau = w * 0.42;
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  roundedRectPath(ctx, plateauX, plateauY, plateau, plateau, plateau * 0.26);
  ctx.fill();

  const lensR = plateau * 0.24;
  const positions = [
    [plateauX + plateau * 0.27, plateauY + plateau * 0.27],
    [plateauX + plateau * 0.73, plateauY + plateau * 0.27],
    [plateauX + plateau * 0.27, plateauY + plateau * 0.73],
  ];
  positions.forEach(([cx, cy]) => {
    const lg = ctx.createRadialGradient(cx - lensR * 0.3, cy - lensR * 0.3, lensR * 0.1, cx, cy, lensR);
    lg.addColorStop(0, '#3a4a5c');
    lg.addColorStop(0.7, '#0c0d0e');
    lg.addColorStop(1, '#000');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(cx, cy, lensR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = lensR * 0.08;
    ctx.stroke();
  });
  // LiDAR / flash, the fourth small circle
  const fx = plateauX + plateau * 0.73, fy = plateauY + plateau * 0.73, fr = lensR * 0.45;
  ctx.fillStyle = '#17181a';
  ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI * 2); ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function initOne(container) {
  if (!window.WebGLRenderingContext) return;

  const screenUrl = container.getAttribute('data-screen');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0, 9);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  // phone body: an iPhone Pro's actual proportions (146.6 x 70.6 x 8.25mm)
  // and its flat titanium band, not a generic rounded-pebble phone — a
  // tight corner radius and a slim depth read as that specific object.
  const bodyW = 2.1, bodyH = bodyW * (146.6 / 70.6), bodyD = bodyW * (8.25 / 70.6);
  const geo = new RoundedBoxGeometry(bodyW, bodyH, bodyD, 8, 0.1);

  // natural titanium: a warm, desaturated grey, brushed rather than glossy
  const titanium = new THREE.MeshStandardMaterial({ color: 0x8c877d, metalness: 0.88, roughness: 0.38 });
  const titaniumEdge = new THREE.MeshStandardMaterial({ color: 0x7a756b, metalness: 0.9, roughness: 0.3 });
  const backMat = new THREE.MeshStandardMaterial({ color: 0x242321, metalness: 0.5, roughness: 0.55 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.45 });
  // box face order: +x, -x, +y, -y, +z, -z
  const materials = [titaniumEdge, titaniumEdge, titanium, titanium, screenMat, backMat];
  const mesh = new THREE.Mesh(geo, materials);
  scene.add(mesh);

  try {
    const tex = await buildScreenTexture(screenUrl);
    screenMat.map = tex;
    screenMat.color.set(0xffffff);
    screenMat.roughness = 0.3;
    screenMat.needsUpdate = true;
  } catch (e) { /* texture failed to load; body still renders */ }

  try {
    backMat.map = buildBackTexture();
    backMat.needsUpdate = true;
  } catch (e) { /* plain back material still renders */ }

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(4, 5, 6);
  scene.add(key);
  const fillBlue = new THREE.DirectionalLight(0x9db9ea, 0.5);
  fillBlue.position.set(-5, -2, 3);
  scene.add(fillBlue);
  const rim = new THREE.DirectionalLight(0xffffff, 0.4);
  rim.position.set(-3, 4, -5);
  scene.add(rim);
  // a light aimed square at the near (right) edge — the one thing that
  // actually sells "this has a side", since that edge is thin and would
  // otherwise read as a dark sliver against the hero's own dark field.
  const edgeLight = new THREE.DirectionalLight(0xffffff, 0.9);
  edgeLight.position.set(6, 0.5, 1);
  scene.add(edgeLight);

  const baseRotY = -0.46, baseRotX = 0.1;
  mesh.rotation.set(baseRotX, baseRotY, -0.02);

  let targetRotX = baseRotX, targetRotY = baseRotY;
  let pointerActive = false;

  function onPointerMove(e) {
    const r = container.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    targetRotY = baseRotY + px * 0.5;
    targetRotX = baseRotX - py * 0.35;
    pointerActive = true;
  }
  function onPointerLeave() {
    pointerActive = false;
    targetRotX = baseRotX; targetRotY = baseRotY;
  }
  container.addEventListener('pointermove', onPointerMove);
  container.addEventListener('pointerleave', onPointerLeave);

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
  function animate() {
    raf = requestAnimationFrame(animate);
    t += 0.016;
    mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.06;
    mesh.rotation.y += (targetRotY - mesh.rotation.y) * 0.06;
    if (!reduceMotion) {
      mesh.position.y = Math.sin(t * 0.6) * 0.09;
      if (!pointerActive) mesh.rotation.y = baseRotY + Math.sin(t * 0.3) * 0.035;
    }
    renderer.render(scene, camera);
  }
  if (reduceMotion) {
    renderer.render(scene, camera);
  } else {
    animate();
  }

  // pause the loop off-screen — this sits in a hero at the very top of the
  // page, so in practice it's rarely out of view, but no reason to keep a
  // render loop going behind other tabs.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; }
    else if (!document.hidden && !raf && !reduceMotion) animate();
  });
}

document.querySelectorAll('[data-phone3d]').forEach((el) => {
  initOne(el).catch(() => {});
});
