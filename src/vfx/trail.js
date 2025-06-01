// VFX preset: Trail (sub-emitting particles)
// Usage: import createTrailVFX from './vfx/trail.js'
import { ParticleSystem } from "../lib/particle-base.js";
import * as THREE from "three";

class TrailSystem extends ParticleSystem {
  constructor(options) {
    super(options);
    this.initParticles();
  }
  spawnParticlePosition() {
    // Trail: spawn at center, can be customized for more complex trails
    return this.position.clone();
  }
}

export default function createTrailVFX(position = new THREE.Vector3()) {
  return new TrailSystem({
    position,
    color: 0x00ccff,
    size: 0.09,
    lifetime: 1.2,
    velocity: new THREE.Vector3(0, 1.5, 0),
    particleCount: 80,
  });
}
