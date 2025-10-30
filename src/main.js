import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/* === Scene Setup === */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 3.5;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('earthCanvas'),
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

/* === Lighting === */
scene.add(new THREE.AmbientLight(0xffffff, 1));
const light = new THREE.PointLight(0x00aaff, 2);
light.position.set(5, 3, 5);
scene.add(light);

/* === Controls === */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false;
controls.enablePan = false;
controls.autoRotate = false;

/* === Earth + India + Karnataka === */
const loader = new GLTFLoader();
let earth, indiaMesh, karnatakaMesh;

loader.load('/earth.glb', (gltf) => {
  earth = gltf.scene;
  earth.scale.set(1.5, 1.5, 1.5);
  scene.add(earth);

  const textureLoader = new THREE.TextureLoader();

  // === India Outline Layer ===
  textureLoader.load('/india4.png', (indiaTexture) => {
    indiaTexture.colorSpace = THREE.SRGBColorSpace;

    const indiaMat = new THREE.MeshBasicMaterial({
      map: indiaTexture,
      transparent: true,
      opacity: 0.9,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const indiaGeo = new THREE.SphereGeometry(1.53, 64, 64, 1.1, 0.55, 0.9, 0.8);
    indiaMesh = new THREE.Mesh(indiaGeo, indiaMat);

    indiaMesh.rotation.y = 1.2;
    indiaMesh.rotation.x = 0.02;
    indiaMesh.position.y = -0.55;
    indiaMesh.scale.set(1.18, 1.18, 1.18);

    scene.add(indiaMesh);
  });

 let karMesh; // global reference

textureLoader.load('./karnataka2.png', (karTexture) => {
  karTexture.colorSpace = THREE.SRGBColorSpace;

  const karMat = new THREE.MeshBasicMaterial({
    map: karTexture,
    transparent: true,
    opacity: 0.0, 
     alphaTest: 0.1,// invisible at start
    blending: THREE.AdditiveBlending,
    depthTest: false,
  });

  const karGeo = new THREE.SphereGeometry(
    1.53, 64, 64,
    1.24, 0.14,
    1.38, 0.13
  );

  karMesh = new THREE.Mesh(karGeo, karMat);

  karMesh.rotation.y = 1.2;
  karMesh.rotation.x = 0.02;
  karMesh.position.y = -0.55;
  karMesh.scale.set(1.18, 1.18, 1.18);
  karMesh.renderOrder = 3;

  karMesh.visible = false;
  scene.add(karMesh);
});


// === Scroll Button ===
document.getElementById('scrollBtn').addEventListener('click', () => {
  if (!karMesh) return;

  karMesh.visible = true;
  karMesh.material.opacity = 0;

  let opacity = 0;
  const fadeIn = setInterval(() => {
    opacity += 0.03;
    karMesh.material.opacity = opacity;
    if (opacity >= 1.0) {
      clearInterval(fadeIn);
      startShineEffect(); // start glowing after fade-in
    }
  }, 60);
});


// === Shining Animation ===
function startShineEffect() {
  let glowDirection = 1;
  function animateGlow() {
    if (!karMesh) return;
    karMesh.material.opacity += glowDirection * 0.01;

    if (karMesh.material.opacity >= 1.0) glowDirection = -1;
    if (karMesh.material.opacity <= 0.85) glowDirection = 1;

    requestAnimationFrame(animateGlow);
  }
  animateGlow();
}


});

/* === Enhanced Background Animation === */
function createStarLayer(count, color, size, spread) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const opacities = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 2] = Math.random() * -spread;
    speeds[i] = 0.01 + Math.random() * 0.015;
    opacities[i] = 0.5 + Math.random() * 0.5;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.userData = { speeds, opacities };

  const material = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const layer = new THREE.Points(geometry, material);
  scene.add(layer);
  return layer;
}

const starsNear = createStarLayer(800, 0x00ccff, 0.04, 40);
const starsFar = createStarLayer(1000, 0x0077ff, 0.025, 80);
const starsDeep = createStarLayer(1200, 0x004466, 0.015, 150);

/* === Animation Loop === */
function animate() {
  requestAnimationFrame(animate);

  [starsNear, starsFar, starsDeep].forEach((layer, index) => {
    const pos = layer.geometry.attributes.position.array;
    const speeds = layer.geometry.userData.speeds;
    for (let i = 0; i < speeds.length; i++) {
      pos[i * 3 + 2] += speeds[i] * (index + 1) * 0.5;
      if (pos[i * 3 + 2] > 20) {
        pos[i * 3 + 2] = -150;
        pos[i * 3] = (Math.random() - 0.5) * (40 * (index + 1));
        pos[i * 3 + 1] = (Math.random() - 0.5) * (40 * (index + 1));
      }
    }
    layer.geometry.attributes.position.needsUpdate = true;

    layer.rotation.y += 0.0004 * (index + 1);
    layer.rotation.x += 0.0002 * (index + 1);
    layer.material.opacity = 0.7 + Math.sin(Date.now() * 0.001 * (index + 1)) * 0.2;
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

/* === Resize Handler === */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* === Scroll Button === */
document.getElementById('scrollBtn').addEventListener('click', () => {
  if (karnatakaMesh) {
    karnatakaMesh.visible = true;
    let opacity = 0;
    const fadeIn = setInterval(() => {
      opacity += 0.03;
      karnatakaMesh.material.opacity = opacity;
      if (opacity >= 0.95) clearInterval(fadeIn);
    }, 60);
  }
});
