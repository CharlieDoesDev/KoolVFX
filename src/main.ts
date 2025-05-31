import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";

// Remove Vite/TS starter UI
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = "";
app.style.width = "100vw";
app.style.height = "100vh";
app.style.margin = "0";
app.style.padding = "0";
app.style.overflow = "hidden";

// Three.js basic setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// Placeholder mesh (replace with imported mesh later)
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Center the cube at the origin (0,0,0)
mesh.position.set(0, 0, 0);

// --- Particle System ---
// Create a geometry for particles
const particleCount = 200;
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);

// Get cube geometry data for surface sampling
const cubeGeometry = geometry;
cubeGeometry.computeBoundingBox();
const posAttr = cubeGeometry.getAttribute("position");
const indexAttr = cubeGeometry.getIndex();
const faceCount = indexAttr ? indexAttr.count / 3 : posAttr.count / 3;

function randomPointOnFace(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3
) {
  let u = Math.random();
  let v = Math.random();
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  const w = 1 - u - v;
  return new THREE.Vector3(
    a.x * u + b.x * v + c.x * w,
    a.y * u + b.y * v + c.y * w,
    a.z * u + b.z * v + c.z * w
  );
}

for (let i = 0; i < particleCount; i++) {
  // Pick a random face
  const faceIdx = Math.floor(Math.random() * faceCount);
  let aIdx, bIdx, cIdx;
  if (indexAttr) {
    aIdx = indexAttr.getX(faceIdx * 3);
    bIdx = indexAttr.getX(faceIdx * 3 + 1);
    cIdx = indexAttr.getX(faceIdx * 3 + 2);
  } else {
    aIdx = faceIdx * 3;
    bIdx = faceIdx * 3 + 1;
    cIdx = faceIdx * 3 + 2;
  }
  const a = new THREE.Vector3().fromBufferAttribute(posAttr, aIdx);
  const b = new THREE.Vector3().fromBufferAttribute(posAttr, bIdx);
  const c = new THREE.Vector3().fromBufferAttribute(posAttr, cIdx);
  const p = randomPointOnFace(a, b, c);
  positions.set([p.x, p.y, p.z], i * 3);
}
particleGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);

// Particle material
const particleMaterial = new THREE.PointsMaterial({
  color: 0xffcc00,
  size: 0.06,
});
const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

// VFX array (each effect is a function that takes the mesh and scene)
const vfxArray: Array<
  (mesh: THREE.Mesh, scene: THREE.Scene, time: number) => void
> = [];

// Example VFX: make mesh pulse
vfxArray.push((mesh, scene, time) => {
  mesh.scale.setScalar(1 + 0.2 * Math.sin(time * 2));
});

// VFX: Make particles jitter on the cube surface
const originalPositions = positions.slice(); // Save initial surface positions
vfxArray.push((mesh, scene, time) => {
  const pos = particleGeometry.getAttribute("position");
  for (let i = 0; i < particleCount; i++) {
    // Jitter each particle slightly around its original surface position
    const ox = originalPositions[i * 3];
    const oy = originalPositions[i * 3 + 1];
    const oz = originalPositions[i * 3 + 2];
    pos.setX(i, ox + 0.08 * Math.sin(time * 2 + i));
    pos.setY(i, oy + 0.08 * Math.cos(time * 2.2 + i));
    pos.setZ(i, oz + 0.08 * Math.sin(time * 1.7 + i));
  }
  pos.needsUpdate = true;
});

// Animation loop
function animate(time: number) {
  time *= 0.001; // ms to seconds
  vfxArray.forEach((vfx) => vfx(mesh, scene, time));
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

camera.position.z = 3;
animate(0);

// Handle resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// TODO: Import mesh using GLTFLoader and replace placeholder mesh
// Example:
// const loader = new GLTFLoader();
// loader.load('path/to/model.glb', (gltf) => {
//   scene.remove(mesh);
//   const importedMesh = gltf.scene.children[0];
//   scene.add(importedMesh);
//   // Optionally update vfxArray to use importedMesh
// });
