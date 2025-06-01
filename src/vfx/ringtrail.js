import { ParticleSystem } from "../lib/particle-base.js";
import * as THREE from "three";

class RingTrailSystem extends ParticleSystem {
  constructor(options = {}) {
    super({ ...options, particleCount: 10 });
    this.trailLength = options.trailLength || 30;
    // Each particle gets a trail (array of previous positions)
    this.trails = Array.from({ length: this.particleCount }, () => []);
    // For rendering trails
    this.trailGeometry = Array.from(
      { length: this.particleCount },
      () => new THREE.BufferGeometry()
    );
    this.trailLines = Array.from({ length: this.particleCount }, (_, i) => {
      const mat = new THREE.LineBasicMaterial({
        color: options.color || 0xffffff,
        transparent: true,
        opacity: 0.5,
      });
      const line = new THREE.Line(this.trailGeometry[i], mat);
      line.frustumCulled = false;
      return line;
    });
    // Re-initialize particles with correct spawn logic
    this.initParticles();
  }

  // Override to accept index for ring placement
  spawnParticlePosition(i = 0) {
    const angle = (i / this.particleCount) * Math.PI * 2;
    const radius = 1.2;
    return new THREE.Vector3(
      this.position.x + Math.cos(angle) * radius,
      this.position.y,
      this.position.z + Math.sin(angle) * radius
    );
  }

  initParticles() {
    this.particles = [];
    const positions = new Float32Array(this.particleCount * 3);
    for (let i = 0; i < this.particleCount; i++) {
      const pos = this.spawnParticlePosition(i);
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      this.particles.push({
        position: pos.clone(),
        angle: (i / this.particleCount) * Math.PI * 2,
        speed: 1.2,
        age: 0,
      });
      this.trails[i] = [pos.clone()];
    }
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
  }

  update(dt) {
    const positions = this.geometry.attributes.position.array;
    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      // Move particle along the ring
      p.angle += p.speed * dt * 0.5;
      const radius = 1.2;
      p.position.x = this.position.x + Math.cos(p.angle) * radius;
      p.position.z = this.position.z + Math.sin(p.angle) * radius;
      p.position.y = this.position.y;
      // Update geometry
      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
      // Update trail
      this.trails[i].push(p.position.clone());
      if (this.trails[i].length > this.trailLength) this.trails[i].shift();
      // Update trail geometry
      const trailPos = new Float32Array(this.trails[i].length * 3);
      for (let j = 0; j < this.trails[i].length; j++) {
        trailPos[j * 3] = this.trails[i][j].x;
        trailPos[j * 3 + 1] = this.trails[i][j].y;
        trailPos[j * 3 + 2] = this.trails[i][j].z;
      }
      this.trailGeometry[i].setAttribute(
        "position",
        new THREE.BufferAttribute(trailPos, 3)
      );
      this.trailGeometry[i].setDrawRange(0, this.trails[i].length);
      this.trailGeometry[i].attributes.position.needsUpdate = true;
    }
    this.geometry.attributes.position.needsUpdate = true;
  }

  addToScene(scene) {
    scene.add(this.points);
    for (const line of this.trailLines) scene.add(line);
  }

  removeFromScene(scene) {
    scene.remove(this.points);
    for (const line of this.trailLines) scene.remove(line);
  }
}

export default function createRingTrailVFX(position = new THREE.Vector3()) {
  return new RingTrailSystem({
    position,
    color: 0xffffff,
    size: 0.15,
    trailLength: 30,
  });
}
