import "./style.css";
import { WebGLRenderer } from "three";
import { createBasicScene } from "./lib/scene.js";
import { ParticleSystem } from "./lib/particle-base.js";
import * as THREE from "three";
import createFireworkVFX from "./vfx/firework.js";
import createExplosionVFX from "./vfx/explosion.js";
import createFountainVFX from "./vfx/fountain.js";
import createSmokeVFX from "./vfx/smoke.js";
import createStarburstVFX from "./vfx/starburst.js";
import createRingTrailVFX from "./vfx/ringtrail.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { setupWorld } from "./world.js";
import { CameraManager } from "./cameraManager.js";
import MeshParticleSystem, {
  DustParticleSystem,
} from "./vfx/meshParticleSystem.js";

// Load scene configuration
async function loadConfig() {
  try {
    const response = await fetch("/sceneconfig.json");
    return await response.json();
  } catch (error) {
    console.error("Failed to load scene configuration:", error);
    // Return default configuration if loading fails
    return {
      environment: {
        modelPath: "/models/gaming_room.glb",
        position: [0, 0, 0],
        scale: 0.1,
      },
      camera: {
        height: 3,
        initialYaw: -100,
        initialPitch: -30,
        initialDistance: 5,
        minDistance: 2,
        maxDistance: 20,
        maxPitch: 30,
        minPitch: -30,
        sensitivity: 0.01,
        fov: 75,
      },
    };
  }
}

async function main() {
  // Load configuration
  const config = await loadConfig();
  console.log("Loaded scene config:", config);

  const app = document.querySelector("#app");
  app.innerHTML = "";
  app.style.cssText =
    "width:100vw;height:100vh;margin:0;padding:0;overflow:hidden;";

  // Add slideshow navigation buttons
  const leftBtn = document.createElement("button");
  leftBtn.textContent = "◀";
  leftBtn.style.cssText =
    "position:absolute;left:20px;top:50%;z-index:20;font-size:2rem;background:rgba(0,0,0,0.5);color:white;border:none;border-radius:50%;width:48px;height:48px;transform:translateY(-50%);cursor:pointer;";
  app.appendChild(leftBtn);
  const rightBtn = document.createElement("button");
  rightBtn.textContent = "▶";
  rightBtn.style.cssText =
    "position:absolute;right:20px;top:50%;z-index:20;font-size:2rem;background:rgba(0,0,0,0.5);color:white;border:none;border-radius:50%;width:48px;height:48px;transform:translateY(-50%);cursor:pointer;";
  app.appendChild(rightBtn);

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "width:100vw;height:100vh;display:block;position:absolute;top:0;left:0;z-index:1;";
  app.appendChild(canvas);
  const { scene, camera } = createBasicScene(config);
  setupWorld(scene, config);

  // Gather collision objects (walls + environment)
  const collisionObjects = [];
  scene.traverse((obj) => {
    if (obj.isMesh && obj.name.startsWith("wall")) {
      collisionObjects.push(obj);
    }
  });

  // --- Load environment GLB (gaming_room.glb) ---
  const gltfLoader = new GLTFLoader();
  gltfLoader.load(config.environment.modelPath, (gltf) => {
    const env = gltf.scene;
    env.position.set(...config.environment.position);
    env.scale.set(
      config.environment.scale,
      config.environment.scale,
      config.environment.scale
    );
    // Enable shadow receiving and casting for all meshes in the environment
    env.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        // Add environment mesh to collision objects
        collisionObjects.push(obj);
        // Upgrade MeshBasicMaterial to MeshStandardMaterial for shadow support
        if (obj.material && obj.material.isMeshBasicMaterial) {
          obj.material = new THREE.MeshStandardMaterial({
            color: obj.material.color,
            map: obj.material.map || null,
          });
        }
      }
    });
    scene.add(env);

    // --- Add DustParticleSystem for ambiance ---
    let roomMesh = null;
    env.traverse((obj) => {
      if (obj.isMesh && !roomMesh) roomMesh = obj;
    });
    if (roomMesh) {
      const dust = new DustParticleSystem(roomMesh, {
        count: 1200,
        color: 0xffffff,
        size: 0.04,
        speed: 0.003,
      });
      scene.add(dust.points);
      // Animate dust in main loop
      if (!window._dustSystems) window._dustSystems = [];
      window._dustSystems.push(dust);
    }
  });

  // Camera manager setup
  let cameraManager;

  // Remove previous lighting
  // Add professional lighting setup
  // Key light
  const keyLight = new THREE.DirectionalLight(
    parseInt(config.lighting?.keyLight?.color || "0xffffff"),
    config.lighting?.keyLight?.intensity || 1.1
  );
  keyLight.position.set(...(config.lighting?.keyLight?.position || [5, 8, 6]));
  keyLight.castShadow = config.lighting?.keyLight?.castShadow !== false;
  if (keyLight.castShadow) {
    const shadowRes =
      config.lighting?.keyLight?.shadowMapSize ||
      config.lighting?.shadows?.shadowMapSize ||
      2048;
    keyLight.shadow.mapSize.width = shadowRes;
    keyLight.shadow.mapSize.height = shadowRes;
    keyLight.shadow.bias = -0.0001;
    keyLight.shadow.normalBias = 0.01;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
  }
  scene.add(keyLight);

  // Fill light
  const fillLight = new THREE.DirectionalLight(
    parseInt(config.lighting?.fillLight?.color || "0x88aaff"),
    config.lighting?.fillLight?.intensity || 0.5
  );
  fillLight.position.set(
    ...(config.lighting?.fillLight?.position || [-6, 4, 4])
  );
  scene.add(fillLight);

  // Rim light
  const rimLight = new THREE.DirectionalLight(
    parseInt(config.lighting?.rimLight?.color || "0xffeecc"),
    config.lighting?.rimLight?.intensity || 0.4
  );
  rimLight.position.set(...(config.lighting?.rimLight?.position || [0, 6, -8]));
  scene.add(rimLight);

  // Soft ambient
  const ambientLight = new THREE.AmbientLight(
    parseInt(config.lighting?.ambient?.color || "0xffffff"),
    0.08 // Lowered for more visible shadows
  );
  scene.add(ambientLight);

  // Renderer
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Enable high-res shadows on renderer
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Scene fog from config
  if (config.fog) {
    scene.fog = new THREE.Fog(
      config.fog.color || 0x222233,
      config.fog.near || 1.5,
      config.fog.far || 7.5
    );
    renderer.setClearColor(config.fog.color || 0x222233);
  }

  // Slideshow data: five different particle systems
  const vfxPresets = [
    createFireworkVFX,
    createExplosionVFX,
    createFountainVFX,
    createSmokeVFX,
    createStarburstVFX,
    createRingTrailVFX,
  ];
  const vfxNames = [
    "Firework",
    "Explosion",
    "Fountain",
    "Smoke",
    "Starburst",
    "Ring Trail",
  ];
  const vfxKeys = [
    "firework",
    "explosion",
    "fountain",
    "smoke",
    "starburst",
    "ringtrail",
  ];
  const slideCount = vfxPresets.length;
  const slideSpacing = 2.5;
  let selectedIndex = Math.floor(slideCount / 2); // Center
  const particleSystems = [];
  // Create all VFX ParticleSystem instances, but only add the selected one to the scene
  for (let i = 0; i < slideCount; i++) {
    // Get specific position for this effect from config if available
    const defaultPos = [0, 0, 0];
    const configPos = config.vfx?.systems?.[vfxKeys[i]]?.position || defaultPos;
    const position = new THREE.Vector3(...configPos);
    const system = vfxPresets[i](position);
    particleSystems.push(system);
  }

  function showOnlySelectedSystem() {
    // Remove all systems from scene
    for (let i = 0; i < particleSystems.length; i++) {
      const sys = particleSystems[i];
      if (typeof sys.removeFromScene === "function") {
        sys.removeFromScene(scene);
      } else {
        scene.remove(sys.points);
      }
    }
    // Add only the selected system
    const selected = particleSystems[selectedIndex];
    if (typeof selected.addToScene === "function") {
      selected.addToScene(scene);
    } else {
      scene.add(selected.points);
    }
    // Update captions: only show the active effect name
    for (let i = 0; i < captions.length; i++) {
      captions[i].style.opacity = i === selectedIndex ? "1" : "0";
      captions[i].style.display = i === selectedIndex ? "block" : "none";
    }
  }

  // Initial display
  let captions = [];
  for (let i = 0; i < vfxNames.length; i++) {
    const caption = document.createElement("div");
    caption.textContent = vfxNames[i];
    caption.style.cssText =
      "position:absolute;left:50%;top:80%;transform:translate(-50%,0);z-index:10;font-size:1.5rem;color:white;text-shadow:0 2px 8px #000;opacity:0;pointer-events:none;transition:opacity 0.3s;display:none;";
    caption.style.opacity = i === selectedIndex ? "1" : "0";
    caption.style.display = i === selectedIndex ? "block" : "none";
    app.appendChild(caption);
    captions.push(caption);
  }
  showOnlySelectedSystem();

  leftBtn.onclick = () => {
    selectedIndex = (selectedIndex - 1 + slideCount) % slideCount;
    showOnlySelectedSystem();
  };
  rightBtn.onclick = () => {
    selectedIndex = (selectedIndex + 1) % slideCount;
    showOnlySelectedSystem();
  };
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      selectedIndex = (selectedIndex - 1 + slideCount) % slideCount;
      showOnlySelectedSystem();
    } else if (e.key === "ArrowRight") {
      selectedIndex = (selectedIndex + 1) % slideCount;
      showOnlySelectedSystem();
    }
  });

  function updateSystemPositions() {
    // Only update the selected system's position (centered)
    const pos = particleSystems[selectedIndex].position;
    pos.x += (0 - pos.x) * 0.15;
    // Update captions
    for (let i = 0; i < captions.length; i++) {
      captions[i].style.opacity = i === selectedIndex ? "1" : "0";
      captions[i].style.display = i === selectedIndex ? "block" : "none";
    }
  }

  const clock = new THREE.Clock();
  let elapsedTime = 0;

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    elapsedTime += deltaTime;

    // Update all particle systems
    for (let i = 0; i < particleSystems.length; i++) {
      const sys = particleSystems[i];
      if (typeof sys.update === "function") {
        sys.update(deltaTime);
      }
    }
    // Update dust
    if (window._dustSystems) {
      for (const dust of window._dustSystems) dust.update();
    }

    // Update system positions to stay centered
    updateSystemPositions();

    // Camera update (lerped orbit)
    cameraManager.update();

    // Render
    renderer.render(scene, camera);
  }
  // Camera manager initialization
  cameraManager = new CameraManager(
    camera,
    canvas,
    config,
    () => particleSystems[selectedIndex].position,
    collisionObjects,
    0.25 // camera collision radius
  );

  // Add scene-level particle systems from config
  if (config.sceneParticleSystems) {
    for (const psys of config.sceneParticleSystems) {
      if (psys.type === "dust" && psys.volume) {
        const dust = new DustParticleSystem(psys.volume, {
          count: psys.count || 1000,
          color: psys.color || 0xffffff,
          size: psys.size || 0.04,
          speed: psys.speed || 0.003,
        });
        scene.add(dust.points);
        if (!window._dustSystems) window._dustSystems = [];
        window._dustSystems.push(dust);
      }
      // Add more types here as needed
    }
  }

  // Style arrow buttons to remove outlines
  leftBtn.style.outline = "none";
  leftBtn.style.boxShadow = "none";
  rightBtn.style.outline = "none";
  rightBtn.style.boxShadow = "none";

  animate();
}

main();
