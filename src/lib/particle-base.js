// Base Particle class for VFX library
import * as THREE from "three";

export class ParticleSystem {
  constructor({
    position = new THREE.Vector3(),
    velocity = new THREE.Vector3(),
    lifetime = 1,
    color = 0xffffff,
    size = 0.05,
    subEmitter = null,
    particleCount = 100,
  } = {}) {
    this.position = position.clone();
    this.velocity = velocity.clone();
    this.lifetime = lifetime;
    this.age = 0;
    this.color = color;
    this.size = size;
    this.alpha = 1.0;
    this.subEmitter = subEmitter;
    this.particleCount = particleCount;
    this.particles = [];
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      size: this.size,
      color: this.color,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    // The user must add this.points to the scene
    // this.initParticles(); // <-- Removed from base class
  }

  // Virtual: override in subclasses for custom spawn logic
  spawnParticlePosition() {
    // Default: random point in a small sphere around this.position
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 0.5 * Math.cbrt(Math.random());
    return new THREE.Vector3(
      this.position.x + r * Math.sin(phi) * Math.cos(theta),
      this.position.y + r * Math.sin(phi) * Math.sin(theta),
      this.position.z + r * Math.cos(phi)
    );
  }

  initParticles() {
    this.particles = [];
    const positions = new Float32Array(this.particleCount * 3);
    for (let i = 0; i < this.particleCount; i++) {
      const pos = this.spawnParticlePosition();
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      this.particles.push({
        position: pos,
        velocity: this.velocity.clone(),
        lifetime: this.lifetime,
        age: 0,
        alpha: 1.0,
      });
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
      p.age += dt;
      if (p.age > p.lifetime) {
        // Respawn
        const pos = this.spawnParticlePosition();
        p.position.copy(pos);
        p.velocity.copy(this.velocity);
        p.age = 0;
        p.alpha = 1.0;
      }
      // Simple upward drift
      p.position.addScaledVector(p.velocity, dt);
      // Fade out
      p.alpha = 1.0 - p.age / p.lifetime;
      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
    }
    this.geometry.attributes.position.needsUpdate = true;
  }
}
