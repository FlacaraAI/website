/* device-fit.js — seats the flacara v5 CAD model over the iPhone model's
   camera plateau. Shared by phone3d.js (the live 3D phone) and
   tools/fit-device.html (the stills), so both put it in the same place.

   The CAD came through an online converter: its units are lost and every
   material is flat and non-metallic. It is sized by its mounting plate — the
   square steel plate under the housing is the part that sits on the phone's
   camera plateau and reaches its rounded corners, so the plate is scaled to
   the plateau — and the finishes are restored from the material names. */
import * as THREE from 'three';

// iPhone model (metres): the camera plateau's top face
const PLATEAU = { min: { x: -0.0323, y: 0.0384 }, max: { x: 0.0019, y: 0.0737 }, z: 0.0062 };
// the CAD's mounting plate, in its own units (Body1_5, z = -0.0864..0)
const PLATE = { min: { x: -0.2411, y: -0.7297 }, max: { x: 0.6919, y: 0.2411 }, bottom: -0.0864 };

function finish(mat) {
  const n = (mat.name || '').toLowerCase();
  const m = new THREE.MeshPhysicalMaterial({ color: mat.color, side: THREE.FrontSide });
  if (n.includes('alumin')) { m.metalness = 0.85; m.roughness = 0.38; m.color = new THREE.Color(0x8d9096); }
  else if (n.includes('steel')) { m.metalness = 0.95; m.roughness = 0.22; m.color = new THREE.Color(0xc9ccd0); }
  else if (n.includes('glass')) { m.metalness = 0; m.roughness = 0.05; m.transparent = true; m.opacity = 0.25; m.color = new THREE.Color(0xdfe6ee); }
  else { m.metalness = 0; m.roughness = mat.roughness ?? 0.55; }
  return m;
}

export function seatDevice(phone, device) {
  device.traverse((o) => { if (o.isMesh) { o.userData.sourceMaterial = o.material.name; o.material = finish(o.material); } });
  const plateW = PLATE.max.x - PLATE.min.x, plateauW = PLATEAU.max.x - PLATEAU.min.x;
  const s = plateauW / plateW;
  const holder = new THREE.Group();
  holder.add(device);
  holder.scale.setScalar(s);
  // the plate's centre over the plateau's centre, its underside on the plateau's top
  const plateCx = (PLATE.min.x + PLATE.max.x) / 2, plateCy = (PLATE.min.y + PLATE.max.y) / 2;
  holder.position.set(
    (PLATEAU.min.x + PLATEAU.max.x) / 2 - plateCx * s,
    (PLATEAU.min.y + PLATEAU.max.y) / 2 - plateCy * s,
    PLATEAU.z - PLATE.bottom * s
  );
  holder.name = 'flacara-v5';
  phone.add(holder);
  return holder;
}
