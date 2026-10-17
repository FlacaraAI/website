/* device-fit.js — seats the flacara v5 CAD model over the iPhone model's
   camera plateau. Shared by phone3d.js (the live 3D phone) and
   tools/fit-device.html (the stills), so both put it in the same place.

   The CAD came through an online converter: its units are lost (it's sized
   here by the housing's real diameter) and every material is flat and
   non-metallic, so finishes are restored from the material names. */
import * as THREE from 'three';

// iPhone model (metres): the camera plateau's centre on the back face,
// and the height of its top surface
const PLATEAU = { x: -0.0152, y: 0.0561, z: 0.0062 };
// the housing's outer diameter in the CAD's own units, and the real one
const HOUSING_CAD = 1.331, HOUSING_M = 0.038;

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
  device.traverse((o) => { if (o.isMesh) o.material = finish(o.material); });
  const holder = new THREE.Group();
  holder.add(device);
  holder.scale.setScalar(HOUSING_M / HOUSING_CAD);
  // the CAD's base (z = 0) sits on the plateau, glass facing out the back
  holder.position.set(PLATEAU.x, PLATEAU.y, PLATEAU.z);
  holder.name = 'flacara-v5';
  phone.add(holder);
  return holder;
}
