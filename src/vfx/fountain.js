// VFX preset: Fountain
// Usage: import createFountainVFX from './vfx/fountain.js'
import { ParticleSystem } from "../lib/particle-base.js";
import * as THREE from "three";

class FountainSystem extends ParticleSystem {
  constructor(options) {
    super(options);
    this.initParticles();
  }
  spawnParticlePosition() {
    // Spawn at base, with some horizontal spread
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.2;
    return new THREE.Vector3(
      this.position.x + Math.cos(angle) * radius,
      this.position.y,
      this.position.z + Math.sin(angle) * radius
    );
  }
}

export default function createFountainVFX(position = new THREE.Vector3()) {
  return new FountainSystem({
    position,
    color: 0x66ccff,
    size: 0.09,
    lifetime: 1.5,
    velocity: new THREE.Vector3(0, 2.5, 0),
    particleCount: 100,
  });
}
