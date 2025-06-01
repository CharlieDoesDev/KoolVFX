// src/vfx/meshParticleSystem.js
import * as THREE from "three";

/**
 * Places N particles at random positions on the surface of a mesh.
 * Usage: const mps = new MeshParticleSystem(targetMesh, { count: 1000 }); scene.add(mps.points);
 */
export default class MeshParticleSystem {
  constructor(mesh, options = {}) {
    this.mesh = mesh;
    this.color = options.color || 0xffcc00;
    this.size = options.size || 0.12;
    this.count = options.count || 1;
    this.points = this._createPoints();
  }

  _createPoints() {
    const geom = this.mesh.geometry;
    geom.computeBoundingBox();
    geom.computeBoundingSphere();
    const posAttr = geom.getAttribute("position");
    const indexAttr = geom.getIndex();
    const positions = [];
    for (let i = 0; i < this.count; i++) {
      let faceIdx;
      if (indexAttr) {
        faceIdx = Math.floor(Math.random() * (indexAttr.count / 3));
      } else {
        faceIdx = Math.floor(Math.random() * (posAttr.count / 3));
      }
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
      let u = Math.random(),
        v = Math.random();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      const w = 1 - u - v;
      const p = new THREE.Vector3()
        .addScaledVector(a, u)
        .addScaledVector(b, v)
        .addScaledVector(c, w);
      positions.push(p.x, p.y, p.z);
    }
    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    const mat = new THREE.PointsMaterial({
      color: this.color,
      size: this.size,
    });
    return new THREE.Points(particleGeom, mat);
  }
}

/**
 * DustParticleSystem: Ambient dust effect for a box volume.
 * Spawns many small, slow-moving particles randomly distributed in a box volume.
 * Usage: const dust = new DustParticleSystem(box, { count: 1000 }); scene.add(dust.points);
 * box: { min: {x,y,z}, max: {x,y,z} }
 */
export class DustParticleSystem {
  constructor(volume, options = {}) {
    this.volume = volume; // { min: {x,y,z}, max: {x,y,z} }
    this.count = options.count || 1000;
    this.color = options.color || 0xffffff;
    this.size = options.size || 0.04;
    this.speed = options.speed || 0.02;
    this.points = this._createPoints();
    this.velocities = [];
    this._initVelocities();
  }

  _createPoints() {
    const min = this.volume.min;
    const max = this.volume.max;
    const positions = [];
    for (let i = 0; i < this.count; i++) {
      const x = THREE.MathUtils.lerp(min.x, max.x, Math.random());
      const y = THREE.MathUtils.lerp(min.y, max.y, Math.random());
      const z = THREE.MathUtils.lerp(min.z, max.z, Math.random());
      positions.push(x, y, z);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    const mat = new THREE.PointsMaterial({
      color: this.color,
      size: this.size,
      transparent: true,
      opacity: 0.18,
    });
    return new THREE.Points(geom, mat);
  }

  _initVelocities() {
    for (let i = 0; i < this.count; i++) {
      this.velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * this.speed,
          (Math.random() - 0.5) * this.speed,
          (Math.random() - 0.5) * this.speed
        )
      );
    }
  }

  update() {
    const posAttr = this.points.geometry.getAttribute("position");
    const min = this.volume.min;
    const max = this.volume.max;
    for (let i = 0; i < this.count; i++) {
      let x = posAttr.getX(i) + this.velocities[i].x;
      let y = posAttr.getY(i) + this.velocities[i].y;
      let z = posAttr.getZ(i) + this.velocities[i].z;
      // Wrap in volume
      if (x < min.x) x = max.x;
      else if (x > max.x) x = min.x;
      if (y < min.y) y = max.y;
      else if (y > max.y) y = min.y;
      if (z < min.z) z = max.z;
      else if (z > max.z) z = min.z;
      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  }
}
