// VFX preset: Explosion
// Usage: import createExplosionVFX from './vfx/explosion.js'
import { ParticleSystem } from "../lib/particle-base.js";
import * as THREE from "three";

class ExplosionSystem extends ParticleSystem {
  constructor(options) {
    super(options);
    this.initParticles();
  }
  spawnParticlePosition() {
    // Spawn in a small sphere for explosion
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 0.3 * Math.cbrt(Math.random());
    return new THREE.Vector3(
      this.position.x + r * Math.sin(phi) * Math.cos(theta),
      this.position.y + r * Math.sin(phi) * Math.sin(theta),
      this.position.z + r * Math.cos(phi)
    );
  }
}

export default function createExplosionVFX(position = new THREE.Vector3()) {
  return new ExplosionSystem({
    position,
    color: 0xff6600,
    size: 0.15,
    lifetime: 1.0,
    velocity: new THREE.Vector3(0, 0.5, 0),
    particleCount: 80,
  });
}
