// VFX preset: Firework
// Usage: import createFireworkVFX from './vfx/firework.js'
import { ParticleSystem } from "../lib/particle-base.js";
import * as THREE from "three";

class FireworkSystem extends ParticleSystem {
  constructor(options) {
    super(options);
    this.initParticles();
  }
  spawnParticlePosition() {
    // Firework: spawn at base, shoot upward
    return new THREE.Vector3(this.position.x, this.position.y, this.position.z);
  }
}

export default function createFireworkVFX(position = new THREE.Vector3()) {
  return new FireworkSystem({
    position,
    color: 0xffffff,
    size: 0.12,
    lifetime: 1.2,
    velocity: new THREE.Vector3(0, 2.5, 0),
    particleCount: 120,
  });
}
