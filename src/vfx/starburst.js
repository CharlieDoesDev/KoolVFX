// VFX preset: Starburst
// Usage: import createStarburstVFX from './vfx/starburst.js'
import { ParticleSystem } from "../lib/particle-base.js";
import * as THREE from "three";

class StarburstSystem extends ParticleSystem {
  constructor(options) {
    super(options);
    this.initParticles();
  }

  spawnParticlePosition() {
    // Starburst: spawn at center, but velocity will be set per-particle
    return this.position.clone();
  }
}

export default function createStarburstVFX(position = new THREE.Vector3()) {
  return new StarburstSystem({
    position,
    color: 0xffff66,
    size: 0.13,
    lifetime: 1.0,
    velocity: new THREE.Vector3(0, 0.5, 0),
    particleCount: 40,
  });
}
