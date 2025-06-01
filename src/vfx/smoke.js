// VFX preset: Smoke Puff
// Usage: import createSmokeVFX from './vfx/smoke.js'
import { ParticleSystem } from "../lib/particle-base.js";
import * as THREE from "three";

class SmokeSystem extends ParticleSystem {
  constructor(options) {
    super(options);
    this.initParticles();
  }
  spawnParticlePosition() {
    // Spawn in a small disk at the base
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.25;
    return new THREE.Vector3(
      this.position.x + Math.cos(angle) * radius,
      this.position.y,
      this.position.z + Math.sin(angle) * radius
    );
  }
}

export default function createSmokeVFX(position = new THREE.Vector3()) {
  return new SmokeSystem({
    position,
    color: 0x888888,
    size: 0.18,
    lifetime: 2.0,
    velocity: new THREE.Vector3(0, 0.5, 0),
    particleCount: 60,
  });
}
