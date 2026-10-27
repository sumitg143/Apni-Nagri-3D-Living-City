import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SceneMode, WeatherType } from '../types/city';
import { sound } from '../utils/sound';
import { NPCManager } from '../systems/npcSystem';

interface Props {
  mode: SceneMode;
  weather: WeatherType;
  showLabels: boolean;
  onEnterMode: (mode: SceneMode) => void;
  onSelectHouseNotify: (text: string) => void;
  targetFollow: 'train' | 'plane' | 'football' | null;
  onClearFollow: () => void;
  cinemaTriggerCounter?: number;
  selectedHouseIndex?: number | null;
}

export const TownshipCanvas: React.FC<Props> = ({
  mode,
  weather,
  showLabels,
  onEnterMode,
  onSelectHouseNotify,
  targetFollow,
  onClearFollow,
  cinemaTriggerCounter = 0,
  selectedHouseIndex = null,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const labelsContainerRef = useRef<HTMLDivElement | null>(null);

  // References for scene state
  const stateRef = useRef({
    mode,
    weather,
    showLabels,
    targetFollow,
    cinemaTriggerCounter,
    selectedHouseIndex,
  });

  stateRef.current = {
    mode,
    weather,
    showLabels,
    targetFollow,
    cinemaTriggerCounter,
    selectedHouseIndex,
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Software WebGL detection
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const SKY_DAY = 0x9fd3f0;
    scene.background = new THREE.Color(SKY_DAY);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -400, 700);
    let az = 0.8;
    let el = 0.62;
    let zoom = 1;
    let view = 70;
    const tgt = new THREE.Vector3(0, 0, 0);

    const fitCamera = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const aspect = w / h;
      const v = view / zoom / Math.min(1.2, aspect);
      camera.left = -v * aspect;
      camera.right = v * aspect;
      camera.top = v;
      camera.bottom = -v;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    fitCamera();

    const placeCamera = () => {
      const d = 120;
      camera.position.set(
        tgt.x + d * Math.sin(az) * Math.cos(el),
        tgt.y + d * Math.sin(el),
        tgt.z + d * Math.cos(az) * Math.cos(el)
      );
      camera.lookAt(tgt);
    };

    // Environment map with PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting setup
    const hemiLight = new THREE.HemisphereLight(0xe6f6ff, 0x6a8f4a, 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff1d6, 0.95);
    sunLight.position.set(65, 95, 45);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.set(2048, 2048);
    Object.assign(sunLight.shadow.camera, {
      left: -90,
      right: 90,
      top: 90,
      bottom: -90,
      near: 1,
      far: 350,
    });
    scene.add(sunLight);

    // Dynamic point lights for night and ambiance
    const streetLightGroup = new THREE.Group();
    scene.add(streetLightGroup);

    const templePointLight = new THREE.PointLight(0xff9900, 1.5, 30);
    templePointLight.position.set(-55, 3, -38);
    scene.add(templePointLight);

    const policeSirenLight = new THREE.PointLight(0x0055ff, 0, 25);
    policeSirenLight.position.set(-50, 8, -11);
    scene.add(policeSirenLight);

    // Starfield for night
    const starCount = 450;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 500;
      starPositions[i * 3 + 1] = 80 + Math.random() * 180;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 500;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.8, transparent: true, opacity: 0 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Weather particle systems (Rain & Snow)
    const rainCount = 1200;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 220;
      rainPositions[i * 3 + 1] = Math.random() * 80;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 220;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x82b1ff,
      size: 0.75,
      transparent: true,
      opacity: 0,
    });
    const rainParticles = new THREE.Points(rainGeo, rainMat);
    scene.add(rainParticles);

    const snowCount = 900;
    const snowGeo = new THREE.BufferGeometry();
    const snowPositions = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount; i++) {
      snowPositions[i * 3] = (Math.random() - 0.5) * 220;
      snowPositions[i * 3 + 1] = Math.random() * 70;
      snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 220;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.4,
      transparent: true,
      opacity: 0,
    });
    const snowParticles = new THREE.Points(snowGeo, snowMat);
    scene.add(snowParticles);

    // Helper material cache
    const mats: Record<string, THREE.Material> = {};
    const M = (c: number, rough: number = 0.6) => {
      const key = `${c}_${rough}`;
      return mats[key] || (mats[key] = new THREE.MeshStandardMaterial({ color: c, roughness: rough, flatShading: true }));
    };

    const BG = new THREE.BoxGeometry(1, 1, 1);

    function box(
      parent: THREE.Object3D,
      w: number,
      h: number,
      d: number,
      c: number,
      x: number,
      y: number,
      z: number,
      sh: number = 1
    ) {
      const m = new THREE.Mesh(BG, M(c));
      m.scale.set(w, h, d);
      m.position.set(x, y + h / 2, z);
      m.castShadow = !isSoftwareGl && !!sh;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    }

    function cyl(
      parent: THREE.Object3D,
      r: number,
      h: number,
      c: number,
      x: number,
      y: number,
      z: number,
      s: number = 10,
      r2?: number
    ) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r2 ?? r, r, h, s), M(c));
      m.position.set(x, y + h / 2, z);
      m.castShadow = !isSoftwareGl;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    }

    function cone(
      parent: THREE.Object3D,
      r: number,
      h: number,
      c: number,
      x: number,
      y: number,
      z: number
    ) {
      return cyl(parent, r, h, c, x, y, z, 8, 0.01);
    }

    function sph(
      parent: THREE.Object3D,
      r: number,
      c: number,
      x: number,
      y: number,
      z: number,
      customMat?: THREE.Material
    ) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), customMat || M(c));
      m.position.set(x, y, z);
      m.castShadow = !isSoftwareGl;
      parent.add(m);
      return m;
    }

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const pick1 = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const COL = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6, 0xe67e22, 0x1abc9c, 0xec407a];
    const SK = [0xe0ac80, 0xc68642, 0x8d5524, 0xf1c27d];

    // Character generator
    interface PersonGroup extends THREE.Group {
      L: THREE.Group;
      R: THREE.Group;
      AL: THREE.Group;
      AR: THREE.Group;
      t: number;
    }

    function person(c: number, skin: number): PersonGroup {
      const g = new THREE.Group() as PersonGroup;
      const lg = (x: number) => {
        const p = new THREE.Group();
        p.position.set(x, 0.8, 0);
        box(p, 0.28, 0.8, 0.3, 0x2b3a55, 0, -0.8, 0, 0);
        g.add(p);
        return p;
      };
      const ar = (x: number) => {
        const p = new THREE.Group();
        p.position.set(x, 1.5, 0);
        box(p, 0.2, 0.7, 0.22, c, 0, -0.7, 0, 0);
        g.add(p);
        return p;
      };
      g.L = lg(-0.17);
      g.R = lg(0.17);
      box(g, 0.7, 0.75, 0.38, c, 0, 0.8, 0);
      sph(g, 0.23, skin, 0, 1.85, 0);
      sph(g, 0.245, 0x1a1a1a, 0, 1.93, -0.05);
      g.AL = ar(-0.45);
      g.AR = ar(0.45);
      g.t = Math.random() * 9;
      return g;
    }

    function walkAnim(g: PersonGroup, dt: number, sp: number = 6, am: number = 0.7) {
      g.t += dt * sp;
      const s = Math.sin(g.t) * am;
      g.L.rotation.x = s;
      g.R.rotation.x = -s;
      g.AL.rotation.x = -s * 0.8;
      g.AR.rotation.x = s * 0.8;
    }

    /* =========================================================================
       CITY WORLD BUILD
       ========================================================================= */
    const city = new THREE.Group();
    scene.add(city);

    const walkers: {
      g: PersonGroup;
      ax: number;
      f: number;
      a: number;
      b: number;
      v: number;
      d: number;
      p: number;
    }[] = [];
    const idle: { g: PersonGroup; k: string }[] = [];
    const cars: { g: THREE.Group; ax: number; f: number; p: number; v: number; o?: number }[] = [];
    const rip: { m: THREE.Mesh; x: number; o: number; v: number }[] = [];
    const WIN: THREE.Mesh[] = [];
    const TOW: THREE.MeshStandardMaterial[] = [];
    const labs: { name: string; x: number; y: number; z: number }[] = [];

    // Terrain ground
    box(city, 320, 0.6, 320, 0x7cb85a, 0, -0.6, 0, 0);
    // Main Roads
    box(city, 170, 0.1, 7, 0x4a4a52, 0, 0, 0, 0);
    box(city, 7, 0.1, 135, 0x4a4a52, 0, 0, 5, 0);
    // Sidewalks
    [-4.3, 4.3].forEach((z) => box(city, 170, 0.15, 1.6, 0xc9b79c, 0, 0, z, 0));
    [-4.3, 4.3].forEach((x) => box(city, 1.6, 0.15, 135, 0xc9b79c, x, 0, 5, 0));
    // Road center white strips
    for (let x = -80; x < 80; x += 5) box(city, 2, 0.12, 0.25, 0xffffff, x, 0, 0, 0);

    // Railway embankment and tracks
    box(city, 230, 0.15, 3.6, 0x6b5d50, 0, 0, -20, 0);
    [-20.7, -19.3].forEach((z) => box(city, 230, 0.25, 0.15, 0xaabbcc, 0, 0.15, z, 0));
    box(city, 40, 0.7, 3, 0xb9a98f, 25, 0, -16, 0);
    box(city, 40, 0.7, 3, 0xb9a98f, 25, 0, -24, 0);

    // River
    const rv = new THREE.PlaneGeometry(320, 13, 100, 1);
    rv.rotateX(-Math.PI / 2);
    const pa = rv.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      pa.setZ(i, pa.getZ(i) - 50 + 6 * Math.sin(pa.getX(i) * 0.05));
    }
    const water = new THREE.Mesh(
      rv,
      new THREE.MeshStandardMaterial({
        color: 0x2f9bd8,
        roughness: 0.1,
        metalness: 0.2,
        transparent: true,
        opacity: 0.92,
      })
    );
    water.position.y = 0.06;
    city.add(water);

    for (let i = 0; i < 46; i++) {
      const m = box(city, rnd(1.5, 3), 0.05, 0.25, 0xdff4ff, 0, 0.1, 0, 0);
      rip.push({ m, x: rnd(-150, 150), o: rnd(-4.5, 4.5), v: rnd(1, 2.5) });
    }
    // Bridge
    box(city, 8, 0.35, 22, 0x555560, 0, 0.1, -50, 0);
    [-3.8, 3.8].forEach((x) => box(city, 0.3, 1, 22, 0xcdbf9a, x, 0.4, -50, 0));

    // Buildings Directory
    interface BuildingDef {
      n: string;
      t: SceneMode;
      x: number;
      z: number;
      w: number;
      d: number;
      h: number;
      c: number;
      s: number;
      r?: number;
    }

    const BL: BuildingDef[] = [
      { n: 'किराना स्टोर', t: 'kirana', x: -14, z: -11, w: 9, d: 7, h: 5, c: 0xf2d7a1, s: 0x2e8b57 },
      { n: 'मिठाई घर', t: 'mithai', x: -26, z: -11, w: 9, d: 7, h: 5, c: 0xf7b7c4, s: 0xe67e22 },
      { n: 'कपड़ा बाज़ार', t: 'kapda', x: -38, z: -11, w: 9, d: 7, h: 5, c: 0xbfd7f2, s: 0x8e44ad },
      { n: 'जिम', t: 'gym', x: -17, z: 12, w: 12, d: 8, h: 6, c: 0x9aa7b8, s: 0xd62828 },
      { n: 'ज़िला अस्पताल', t: 'aspatal', x: -37, z: 13, w: 14, d: 9, h: 10, c: 0xf4f8f8, s: 0x1e90ff },
      { n: 'अग्निशमन केंद्र', t: 'fire', x: 9, z: -11, w: 7, d: 6, h: 5, c: 0xd9382c, s: 0xffffff },
      { n: 'रेलवे स्टेशन', t: 'train', x: 25, z: -29, w: 14, d: 5, h: 5, c: 0xe9d6a5, s: 0x1e5aa8 },
      { n: 'हवाई अड्डा', t: 'plane', x: 47, z: 14, w: 7, d: 18, h: 6, c: 0xdfe7ef, s: 0x2f6fb5 },
      { n: 'पुलिस थाना व जेल', t: 'police', x: -50, z: -11, w: 9, d: 7, h: 6, c: 0xcfd8e8, s: 0x1e3a8a, r: 0x1e3a8a },
      { n: 'होटल अपना', t: 'hotel', x: -54, z: 14, w: 10, d: 8, h: 12, c: 0xf3e0c7, s: 0xc0392b, r: 0x5d4037 },
      { n: 'सिनेमा हॉल', t: 'cinema', x: 21, z: -9, w: 10, d: 6, h: 7, c: 0x6a3d8f, s: 0xffd24d, r: 0x2b1a3a },
      { n: 'रेस्टोरेंट', t: 'restaurant', x: -12, z: 70, w: 10, d: 7, h: 6, c: 0xffe0b2, s: 0xe65100, r: 0x4e342e },
      { n: 'पुस्तकालय', t: 'library', x: 12, z: 70, w: 10, d: 7, h: 7, c: 0xd7ccc8, s: 0x4527a0, r: 0x3e2723 },
      { n: 'स्विमिंग पूल', t: 'pool', x: -12, z: 88, w: 10, d: 7, h: 5, c: 0xb3e5fc, s: 0x0277bd, r: 0x01579b },
      { n: 'नाट्यशाला', t: 'natak', x: 12, z: 88, w: 10, d: 7, h: 8, c: 0xf8bbd0, s: 0xad1457, r: 0x880e4f },
      { n: 'गेम ज़ोन', t: 'game', x: 0, z: 106, w: 12, d: 7, h: 6, c: 0xc5cae9, s: 0x00acc1, r: 0x283593 },
      { n: 'सरकारी स्कूल', t: 'school', x: -76, z: 16, w: 16, d: 9, h: 8, c: 0xfff3b0, s: 0x2e7d32, r: 0xb71c1c },
      { n: 'सिटी मॉल', t: 'mall', x: 96, z: -10, w: 14, d: 9, h: 12, c: 0x90caf9, s: 0xe91e63, r: 0x37474f },
      { n: 'सिटी बैंक', t: 'bank', x: 96, z: 10, w: 9, d: 7, h: 8, c: 0xeceff1, s: 0x1a237e, r: 0x1a237e },
      { n: 'प्रॉपर्टी ऑफिस', t: 'estate', x: 124, z: 10, w: 10, d: 7, h: 7, c: 0xffe0b2, s: 0x00796b, r: 0x004d40 },
      { n: 'मेट्रो स्टेशन', t: 'metro', x: 10, z: -58, w: 8, d: 5, h: 4, c: 0xcfd8dc, s: 0x1565c0, r: 0x1565c0 },
    ];

    function building(o: BuildingDef, hn?: number) {
      const g = new THREE.Group();
      g.position.set(o.x, 0, o.z);
      const { w, d, h } = o;
      box(g, w, h, d, o.c, 0, 0, 0);
      box(g, w + 0.8, 0.5, d + 0.8, o.r || 0x8d3b2a, 0, h, 0);
      box(g, w * 0.6, 1, 0.3, o.s, 0, h - 1.4, d / 2 + 0.1);
      box(g, 1.8, 2.8, 0.2, 0x3a2412, 0, 0, d / 2 + 0.05);

      for (let i = -1; i <= 1; i += 2) {
        for (let k = 0; k < (h > 8 ? 3 : 1); k++) {
          WIN.push(box(g, 1.6, 1.4, 0.2, 0x5aa9d6, i * w * 0.3, 1.6 + k * 3, d / 2 + 0.05, 0));
        }
      }

      g.traverse((m) => {
        m.userData.t = o.t;
        m.userData.n = hn;
      });
      city.add(g);

      if (o.n) {
        labs.push({ name: o.n, x: o.x, y: h + 3, z: o.z });
      }
      return g;
    }

    BL.forEach((o) => {
      building(o);
      if (o.t === 'train') box(city, 16, 0.3, 6.5, 0x1e5aa8, 25, 6, -29, 1);
    });

    // Residential Houses
    let hn = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        hn = 17 + i * 31 + j * 7;
        building(
          {
            n: '',
            t: 'hotel',
            x: 15 + i * 10,
            z: 11 + j * 8,
            w: 5.5,
            d: 5,
            h: 4 + ((i + j) % 2) * 1.5,
            c: pick1([0xf6e3c4, 0xf5c6aa, 0xcfe8c9, 0xe8d1f0, 0xfff0a8]),
            s: 0x2e8b57,
            r: pick1([0xa0452f, 0x6d4c41, 0x8e3b46]),
          },
          hn
        );
      }
    }

    // 317 Houses (नई बस्ती)
    const NR = 317;
    const HP: [number, number][] = [];
    for (let r = 0; r < 18; r++) {
      for (let k = 0; k < 18; k++) {
        if (HP.length < NR) {
          HP.push([k < 9 ? -(k + 1) * 5.5 : (k - 8) * 5.5, -70 - r * 4.6]);
        }
      }
    }

    const hb = new THREE.InstancedMesh(BG, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.6 }), NR);
    const hr = new THREE.InstancedMesh(BG, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.6 }), NR);
    const dm = new THREE.Object3D();
    const cc = new THREE.Color();

    HP.forEach(([x, z], i) => {
      dm.position.set(x, 1.4, z);
      dm.scale.set(3.2, 2.8, 3);
      dm.updateMatrix();
      hb.setMatrixAt(i, dm.matrix);
      hb.setColorAt(i, cc.set(pick1([0xf6e3c4, 0xf5c6aa, 0xcfe8c9, 0xe8d1f0, 0xfff0a8, 0xbfe0f2])));

      dm.position.set(x, 3.1, z);
      dm.scale.set(3.8, 0.7, 3.6);
      dm.updateMatrix();
      hr.setMatrixAt(i, dm.matrix);
      hr.setColorAt(i, cc.set(pick1([0xa0452f, 0x6d4c41, 0x8e3b46, 0x37474f])));
    });

    [hb, hr].forEach((m) => {
      m.castShadow = !isSoftwareGl;
      m.frustumCulled = false;
      m.userData = { t: 'home' };
      city.add(m);
    });
    box(city, 7, 0.1, 92, 0x4a4a52, 0, 0, -106, 0);
    labs.push({ name: 'नई बस्ती — 317 घर', x: 0, y: 8, z: -70 });

    // House beacon light
    const beaconLight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 45, 12),
      new THREE.MeshBasicMaterial({ color: 0xff4081, transparent: true, opacity: 0.65 })
    );
    beaconLight.visible = false;
    city.add(beaconLight);

    // Downtown Skyscrapers
    const tc = document.createElement('canvas');
    tc.width = tc.height = 64;
    const tcx = tc.getContext('2d')!;
    tcx.fillStyle = '#3a4a5c';
    tcx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        tcx.fillStyle = Math.random() < 0.7 ? '#ffeeb0' : '#6b7f95';
        tcx.fillRect(i * 16 + 3, j * 16 + 4, 10, 9);
      }
    }
    const TT = new THREE.CanvasTexture(tc);
    TT.wrapS = TT.wrapT = THREE.RepeatWrapping;

    function tower(x: number, z: number, w: number, h: number, d: number, c: number) {
      const t = TT.clone();
      t.needsUpdate = true;
      t.repeat.set(w / 3, h / 3);
      const m = new THREE.MeshStandardMaterial({
        color: c,
        map: t,
        emissiveMap: t,
        emissive: 0x000000,
        roughness: 0.5,
      });
      TOW.push(m);
      const b = new THREE.Mesh(BG, m);
      b.scale.set(w, h, d);
      b.position.set(x, h / 2, z);
      b.castShadow = !isSoftwareGl;
      b.receiveShadow = true;
      city.add(b);
      box(city, w * 0.5, 2, d * 0.5, 0x78909c, x, h, z, 0);
    }

    box(city, 95, 0.1, 7, 0x4a4a52, 112, 0, 0, 0);
    box(city, 7, 0.1, 150, 0x4a4a52, 110, 0, 0, 0);
    for (const x of [88, 97, 123, 132, 141]) {
      for (const z of [-60, -47, -34, -21, 21, 34, 47, 60]) {
        tower(x, z, 6 + Math.random() * 3, rnd(14, 62), 6 + Math.random() * 3, pick1([0xcfd8dc, 0xb0bec5, 0x90a4ae, 0xa1c4d8]));
      }
    }
    labs.push({ name: 'डाउनटाउन (Downtown)', x: 112, y: 70, z: 0 });

    // Street Lamps with warm bulbs & PointLights
    const lmpMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
    function addLamp(x: number, z: number) {
      box(city, 0.2, 5, 0.2, 0x333333, x, 0, z, 0);
      sph(city, 0.45, 0, x, 5.2, z, lmpMat);
    }
    for (let x = -76; x <= 160; x += 18) {
      addLamp(x, -5.2);
      addLamp(x, 5.2);
    }

    // Trees
    for (let i = 0; i < 90; i++) {
      const tx = rnd(-130, 130);
      const tz = rnd(-130, 130);
      // skip roads
      if (Math.abs(tz) < 8 || Math.abs(tx) < 8 || (tz > -60 && tz < -40)) continue;
      const tg = new THREE.Group();
      tg.position.set(tx, 0, tz);
      cyl(tg, 0.35, 2, 0x6d4c41, 0, 0, 0, 6);
      cone(tg, 2, 3.4, pick1([0x2e7d32, 0x3e8e41, 0x558b2f]), 0, 1.8, 0);
      cone(tg, 1.5, 2.6, 0x388e3c, 0, 3.8, 0);
      city.add(tg);
    }

    // Stadium
    {
      const sg = new THREE.Group();
      sg.position.set(125, 0, 95);
      [
        [27, 24, 11, 0xcfd8dc],
        [24, 20, 8, 0xb0bec5],
        [20, 16, 5, 0x90a4ae],
      ].forEach(([a, b, h, c]) => {
        const m = new THREE.Mesh(
          new THREE.CylinderGeometry(a, b, h, 36, 1, true),
          new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, flatShading: true })
        );
        m.position.y = h / 2;
        sg.add(m);
      });
      cyl(sg, 15, 0.3, 0x43a047, 0, 0, 0, 36);
      const rg = new THREE.Mesh(new THREE.TorusGeometry(27, 0.7, 6, 36), M(0xd32f2f));
      rg.rotation.x = Math.PI / 2;
      rg.position.y = 11;
      sg.add(rg);

      sg.traverse((m) => (m.userData.t = 'stadium'));
      city.add(sg);
      labs.push({ name: 'महा स्टेडियम (Stadium)', x: 125, y: 20, z: 95 });
    }

    // Football Field on Ground
    box(city, 7, 0.1, 42, 0x4a4a52, 0, 0, 93, 0);
    const fbPlayers: { g: PersonGroup; ox: number; oz: number }[] = [];
    const gr = box(city, 30, 0.15, 20, 0x3f9b3a, -42, 0, 78, 0);
    const ball = sph(city, 0.6, 0xffffff, -42, 0.6, 78);
    [68, 88].forEach((z) => box(city, 30, 0.16, 0.2, 0xffffff, -42, 0, z, 0));
    [-57, -42, -27].forEach((x) => box(city, 0.2, 0.16, 20, 0xffffff, x, 0, 78, 0));
    [-57.4, -26.6].forEach((x) => box(city, 0.3, 2.6, 4, 0xeeeeee, x, 0, 78));

    for (let i = 0; i < 10; i++) {
      const g = person(i < 5 ? 0xd32f2f : 0x1976d2, pick1(SK));
      g.scale.setScalar(1.35);
      g.position.set(-42 + rnd(-12, 12), 0, 78 + rnd(-8, 8));
      city.add(g);
      fbPlayers.push({ g, ox: rnd(-10, 10), oz: rnd(-7, 7) });
    }
    const ballTarget = new THREE.Vector3(-42, 0, 78);
    let ballKickTimer = 0;
    gr.userData = { t: 'stadium' };
    ball.userData = { t: 'cam', o: ball };
    labs.push({ name: 'फुटबॉल मैदान (Soccer)', x: -42, y: 5, z: 78 });

    // Cricket Pitch
    const cg = cyl(city, 13, 0.15, 0x4caf50, 38, 0, 86, 24);
    box(city, 2.6, 0.2, 13, 0xd7c28b, 38, 0, 86, 0);
    [79.5, 92.5].forEach((z) =>
      [-0.4, 0, 0.4].forEach((o) => box(city, 0.1, 1.2, 0.1, 0xffffff, 38 + o, 0, z, 0))
    );
    const crBatsman = person(0xffffff, pick1(SK));
    crBatsman.position.set(38, 0, 80.6);
    crBatsman.scale.setScalar(1.35);
    city.add(crBatsman);
    box(crBatsman.AR, 0.25, 1.3, 0.5, 0xd7b36a, 0, -1.4, 0.2, 0);

    const crBowler = person(0x1976d2, pick1(SK));
    crBowler.position.set(38, 0, 92);
    crBowler.scale.setScalar(1.35);
    crBowler.rotation.y = Math.PI;
    city.add(crBowler);

    const crBall = sph(city, 0.3, 0xc0392b, 38, 1, 86);
    const crFielders: PersonGroup[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const fx = 38 + Math.cos(a) * 10;
      const fz = 86 + Math.sin(a) * 10;
      const f = person(0x1976d2, pick1(SK));
      f.position.set(fx, 0, fz);
      f.rotation.y = Math.atan2(38 - fx, 86 - fz);
      f.scale.setScalar(1.35);
      city.add(f);
      crFielders.push(f);
    }
    cg.userData = { t: 'stadium' };
    crBall.userData = { t: 'cam', o: crBall };
    labs.push({ name: 'क्रिकेट मैदान (Cricket)', x: 38, y: 5, z: 86 });

    // Ferris Wheel (मेला झूला)
    const FW = new THREE.Group();
    const FWWheel = new THREE.Group();
    const gondolas: THREE.Group[] = [];
    FW.position.set(-35, 0, -38);
    city.add(FW);
    [-1.6, 1.6].forEach((z) =>
      [[-2, -0.37], [2, 0.37]].forEach(([x, a]) =>
        (box(FW, 0.5, 10.8, 0.5, 0x8d6e63, x, 0, z) as THREE.Mesh).rotation.z = a
      )
    );
    FWWheel.position.y = 10.5;
    FW.add(FWWheel);
    FWWheel.add(new THREE.Mesh(new THREE.TorusGeometry(9, 0.15, 6, 36), M(0xffffff)));
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const sp = new THREE.Group();
      sp.rotation.z = a;
      box(sp, 0.2, 9, 0.2, 0xe0e0e0, 0, 0, 0, 0);
      FWWheel.add(sp);
      const gg = new THREE.Group();
      gg.position.set(-Math.sin(a) * 9, Math.cos(a) * 9, 0);
      box(gg, 1.8, 1.3, 1.6, COL[i % 8], 0, -1.3, 0);
      FWWheel.add(gg);
      gondolas.push(gg);
    }
    FW.traverse((m) => (m.userData.t = 'jhoola'));
    labs.push({ name: 'मेला झूला (Carnival)', x: -35, y: 22, z: -38 });

    // Temple (मंदिर)
    let flagGroup: THREE.Group;
    {
      const tg = new THREE.Group();
      tg.position.set(-55, 0, -38);
      box(tg, 9, 0.6, 9, 0xd7ccc8, 0, 0, 0);
      box(tg, 6, 0.6, 6, 0xefe6dc, 0, 0.6, 0);
      box(tg, 4.6, 3.6, 4.6, 0xf5b041, 0, 1.2, 0);
      box(tg, 1.4, 2.2, 0.2, 0x5d2e0f, 0, 1.2, 2.35);
      cone(tg, 3.4, 3.2, 0xe67e22, 0, 4.8, 0);
      cone(tg, 2.2, 2.4, 0xf39c12, 0, 7, 0);
      sph(tg, 0.35, 0xffd54f, 0, 9.6, 0);
      cyl(tg, 0.06, 2.2, 0x5d4037, 0, 9.6, 0);

      flagGroup = new THREE.Group();
      flagGroup.position.set(0, 11.8, 0);
      box(flagGroup, 0.1, 0.9, 1.6, 0xff6f00, 0, -0.9, 0.8, 0);
      tg.add(flagGroup);

      const dmMat = new THREE.MeshBasicMaterial({ color: 0xff9800 });
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        sph(tg, 0.2, 0, Math.cos(a) * 3.8, 0.8, Math.sin(a) * 3.8, dmMat);
      }
      tg.traverse((m) => (m.userData.t = 'mandir'));
      city.add(tg);
      labs.push({ name: 'मंदिर (Temple)', x: -55, y: 13, z: -38 });
    }

    // Clock Tower (घंटाघर) with real-time moving hands
    let hourHand: THREE.Group;
    let minuteHand: THREE.Group;
    {
      const g = new THREE.Group();
      g.position.set(9, 0, 9);
      box(g, 3.4, 12, 3.4, 0xd7ccc8, 0, 0, 0);
      box(g, 4.2, 3.4, 4.2, 0xc9b79c, 0, 10, 0);
      cone(g, 3.2, 3, 0xb71c1c, 0, 13.4, 0);

      const f = cyl(g, 1.3, 0.2, 0xffffff, 0, 10.9, 2.15, 20);
      f.rotation.x = Math.PI / 2;
      f.position.y = 11.7;

      hourHand = new THREE.Group();
      hourHand.position.set(0, 11.7, 2.3);
      box(hourHand, 0.2, 0.9, 0.06, 0x111111, 0, 0, 0, 0);

      minuteHand = new THREE.Group();
      minuteHand.position.set(0, 11.7, 2.35);
      box(minuteHand, 0.14, 1.3, 0.06, 0x111111, 0, 0, 0, 0);

      g.add(hourHand, minuteHand);
      g.traverse((m) => (m.userData.t = 'library'));
      city.add(g);
      labs.push({ name: 'घंटाघर (Clock Tower)', x: 9, y: 17, z: 9 });
    }

    // Train on Tracks
    const TR = new THREE.Group();
    city.add(TR);
    {
      const lc = new THREE.Group();
      box(lc, 9, 3.6, 3.2, 0xc0392b, 0, 0.5, 0);
      box(lc, 3, 1.4, 3.3, 0x222, 3, 4.1, 0);
      cyl(lc, 0.6, 1.4, 0x333, -2, 4.1, 0);
      lc.position.x = 24;
      TR.add(lc);

      for (let i = 0; i < 4; i++) {
        const c = new THREE.Group();
        box(c, 11, 3.6, 3.2, i % 2 ? 0x2f6fb5 : 0x3e86c9, 0, 0.5, 0);
        for (let k = -4; k <= 4; k += 2) {
          box(c, 1.2, 1.2, 0.1, 0xdff4ff, k, 2.3, 1.63, 0);
          box(c, 1.2, 1.2, 0.1, 0xdff4ff, k, 2.3, -1.63, 0);
        }
        c.position.x = 14 - i * 11.6;
        TR.add(c);
      }
    }
    TR.traverse((m) => (m.userData.t = 'train'));
    TR.position.set(-130, 0, -20);
    let xTrain = -130;

    // Airplane (हवाई जहाज़)
    const PL = new THREE.Group();
    {
      const a = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 12, 12), M(0xf4f6f8));
      a.rotation.x = Math.PI / 2;
      a.castShadow = !isSoftwareGl;
      PL.add(a);

      const n = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3, 12), M(0xf4f6f8));
      n.rotation.x = Math.PI / 2;
      n.position.z = 7.5;
      PL.add(n);

      const t = new THREE.Mesh(new THREE.ConeGeometry(1.1, 4, 12), M(0xf4f6f8));
      t.rotation.x = -Math.PI / 2;
      t.position.z = -8;
      PL.add(t);

      box(PL, 15, 0.25, 3.4, 0xc4ccd6, 0, -0.3, 0.5);
      box(PL, 5.5, 0.2, 1.6, 0xc4ccd6, 0, 0.2, -8);
      box(PL, 0.2, 2.6, 2, 0x2f6fb5, 0, 1, -8);
      box(PL, 2.3, 0.3, 12, 0x2f6fb5, 0, -0.3, 0, 0);
      for (let z = -5; z < 5; z += 1.4) {
        box(PL, 2.25, 0.35, 0.5, 0x223344, 0, 0.5, z, 0);
      }
      PL.children.forEach((m) => (m.position.y += 1.6));
    }
    PL.traverse((m) => (m.userData.t = 'plane'));
    city.add(PL);

    // Metro Train on Elevated Track
    let xMetro = -120;
    const MT = new THREE.Group();
    MT.position.set(xMetro, 9.2, -65);
    city.add(MT);
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Group();
      c.position.x = -12.6 + i * 8.4;
      box(c, 8, 3.4, 3, 0xeceff1, 0, 0, 0);
      box(c, 8.02, 0.8, 3.02, 0x1565c0, 0, 1.2, 0, 0);
      for (let k = -3; k <= 3; k += 2) {
        [-1.52, 1.52].forEach((z) => box(c, 1, 1, 0.05, 0x263238, k, 1.8, z, 0));
      }
      MT.add(c);
    }
    MT.traverse((m) => (m.userData.t = 'metro'));

    // Elevated pillars for metro
    for (let x = -90; x <= 160; x += 20) box(city, 1.6, 8.2, 1.6, 0x757575, x, 0, -65);
    box(city, 260, 0.8, 5, 0x9e9e9e, 35, 8.2, -65, 0);
    labs.push({ name: 'मेट्रो (Metro)', x: 0, y: 17, z: -65 });

    // Cars on streets
    const mkCar = () => {
      const g = new THREE.Group();
      box(g, 3.6, 1, 1.8, pick1(COL), 0, 0.3, 0);
      box(g, 2, 0.9, 1.6, 0xddddee, -0.2, 1.3, 0);
      city.add(g);
      return g;
    };
    for (let i = 0; i < 12; i++) {
      const ax = i % 2;
      cars.push({
        g: mkCar(),
        ax,
        f: ax ? 110 + (i & 2 ? 1.8 : -1.8) : i & 2 ? 1.8 : -1.8,
        p: rnd(-60, 60),
        v: rnd(7, 12) * (i & 2 ? 1 : -1),
        o: ax ? 0 : 115,
      });
    }

    // Walking pedestrians
    for (let i = 0; i < 35; i++) {
      const ax = i % 2;
      const f = pick1([-4.3, 4.3]);
      const p = person(pick1(COL), pick1(SK));
      p.scale.setScalar(1.35);
      city.add(p);
      walkers.push({
        g: p,
        ax,
        f,
        a: -55,
        b: 60,
        v: rnd(2, 4),
        d: Math.random() < 0.5 ? 1 : -1,
        p: rnd(-50, 55),
      });
    }

    // Park Area with Pond and Ducks
    {
      const pg = new THREE.Group();
      pg.position.set(-86, 0, 52);
      box(pg, 40, 0.2, 32, 0x6cc24a, 0, 0, 0, 0);
      cyl(pg, 7, 0.25, 0x4fc3f7, -8, 0.1, -4, 24);
      pg.traverse((m) => (m.userData.t = 'park'));
      city.add(pg);
      labs.push({ name: 'पार्क (Central Park)', x: -86, y: 8, z: 52 });
    }

    // Boats on river & Soaring Birds
    const boats: { g: THREE.Group; x: number; v: number; o: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const bg = new THREE.Group();
      box(bg, 4, 0.8, 1.6, 0x8d5b2b, 0, 0, 0);
      box(bg, 0.15, 3.5, 0.15, 0x444, 0, 0.8, 0, 0);
      cone(bg, 1.6, 3, pick1([0xffffff, 0xffb74d]), 0, 1.2, 0);
      city.add(bg);
      boats.push({ g: bg, x: rnd(-100, 100), v: rnd(2, 4) * (i % 2 ? 1 : -1), o: rnd(-2, 2) });
    }

    const birds: { g: THREE.Group; a: THREE.Group; b: THREE.Group; r: number; s: number; ph: number; y: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const bg = new THREE.Group();
      const a = new THREE.Group();
      const b = new THREE.Group();
      [a, b].forEach((w, k) => {
        box(w, 1.6, 0.08, 0.5, 0x333, k ? 0.8 : -0.8, 0, 0, 0);
        bg.add(w);
      });
      city.add(bg);
      birds.push({ g: bg, a, b, r: rnd(35, 75), s: rnd(0.08, 0.2) * (i % 2 ? 1 : -1), ph: rnd(0, 6), y: rnd(25, 38) });
    }

    // Hot Air Balloon
    const balloon = new THREE.Group();
    sph(balloon, 4, 0xe53935, 0, 0, 0).scale.y = 1.25;
    sph(balloon, 4.05, 0xffd54f, 0, -0.6, 0).scale.set(0.45, 1.25, 1.02);
    box(balloon, 1.4, 1.1, 1.4, 0x8d5b2b, 0, -7.2, 0);
    city.add(balloon);

    // Windmills
    const windmills: THREE.Group[] = [];
    for (let i = 0; i < 3; i++) {
      const wg = new THREE.Group();
      wg.position.set(-54, 0, 30 + i * 8);
      cyl(wg, 0.8, 8, 0xeeeeee, 0, 0, 0, 8, 0.4);
      const head = new THREE.Group();
      head.position.set(0, 8.2, 0.6);
      for (let k = 0; k < 3; k++) {
        const blade = new THREE.Group();
        blade.rotation.z = k * 2.094;
        box(blade, 0.4, 4, 0.15, 0xffffff, 0, 0, 0, 0);
        head.add(blade);
      }
      wg.add(head);
      windmills.push(head);
      city.add(wg);
    }

    /* =========================================================================
       NPC PATHFINDING & ANIMATION SYSTEM
       ========================================================================= */
    const npcManager = new NPCManager();

    // 1. NPC wandering between Park, Temple steps, and Town Center
    npcManager.createWalker('npc_wanderer_1', [
      { x: -80, z: 45, targetBehavior: 'walk' },
      { x: -55, z: 0, waitDuration: 3, targetBehavior: 'sit' },
      { x: -55, z: -32, waitDuration: 4, targetBehavior: 'pray' },
      { x: -10, z: 0, targetBehavior: 'walk' },
    ]);

    // 2. NPC going from Library to Cafe
    npcManager.createWalker('npc_student_2', [
      { x: 12, z: 65, waitDuration: 5, targetBehavior: 'read' },
      { x: -12, z: 65, waitDuration: 4, targetBehavior: 'eat' },
      { x: 0, z: 40, targetBehavior: 'walk' },
      { x: 12, z: 10, targetBehavior: 'walk' },
    ]);

    // 3. NPC walking along shopping boulevard
    npcManager.createWalker('npc_shopper_3', [
      { x: 96, z: -10, targetBehavior: 'walk' },
      { x: 96, z: 10, waitDuration: 2, targetBehavior: 'sit' },
      { x: 124, z: 10, targetBehavior: 'walk' },
      { x: 80, z: 0, targetBehavior: 'walk' },
    ]);

    // Add NPC models to city scene
    npcManager.npcs.forEach((n) => city.add(n.group));

    /* =========================================================================
       INTERIOR ROOMS (3D Interactive Modes)
       ========================================================================= */
    const interior = new THREE.Group();
    scene.add(interior);
    interior.visible = false;

    let interiorUpdaters: ((dt: number, T: number) => void)[] = [];

    const clearInterior = () => {
      while (interior.children.length > 0) {
        interior.remove(interior.children[0]);
      }
      interiorUpdaters = [];
      interior.rotation.set(0, 0, 0);
      interior.position.set(0, 0, 0);
    };

    function room(w: number, d: number, fl: number, wl: number, h: number = 7) {
      box(interior, w, 0.4, d, fl, 0, -0.4, 0);
      box(interior, w, h, 0.4, wl, 0, 0, -d / 2);
      box(interior, 0.4, h, d, wl, -w / 2, 0, 0);
    }

    function seatedPerson(x: number, z: number, ry: number, c?: number) {
      const p = person(c ?? pick1(COL), pick1(SK));
      p.position.set(x, -0.25, z);
      p.rotation.y = ry;
      p.L.rotation.x = p.R.rotation.x = -1.5;
      p.AL.rotation.x = p.AR.rotation.x = -0.6;
      interior.add(p);
      return p;
    }

    function chairProp(x: number, z: number, ry: number, c: number) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = ry;
      box(g, 1.5, 0.5, 1.4, c, 0, 0, 0);
      box(g, 1.5, 1.4, 0.3, c, 0, 0.5, -0.65);
      interior.add(g);
    }

    function scenery(y: number, s: number) {
      const g = new THREE.Group();
      const Pd = 60 * s;
      for (let i = -2; i <= 2; i++) {
        const t = new THREE.Group();
        t.position.x = i * Pd;
        box(t, Pd + 1, 0.4, 170 * s, 0x78b556, 0, -0.4, -90 * s, 0);
        for (let k = 0; k < 9; k++) {
          box(
            t,
            (7 + Math.random() * 8) * s,
            0.3,
            (7 + Math.random() * 8) * s,
            pick1([0xd8c24a, 0x9bd05a, 0xc6dd6a, 0x6fae4e]),
            (Math.random() * 54 - 27) * s,
            0,
            -(20 + Math.random() * 140) * s,
            0
          );
        }
        g.add(t);
      }
      g.position.y = y;
      interior.add(g);
      return { g, Pd };
    }

    // Build Interior Rooms
    const INTERIOR_BUILDERS: Record<string, () => number> = {
      // 🏨 Hotel: Reception, bellboy, dining guests, waiters
      hotel: () => {
        room(28, 16, 0xb08d57, 0xf3e6d0);
        // Reception desk
        box(interior, 7, 1.3, 1.6, 0x5d4037, -6, 0, -5);
        const receptionist = person(0x6a1b9a, pick1(SK));
        receptionist.position.set(-6, 0, -6.6);
        interior.add(receptionist);

        // Chandelier
        sph(interior, 1, 0xffdf8a, 0, 6, 0);

        // Dining tables with eating & drinking guests
        [
          [8, -1.8, Math.PI],
          [8, -4.2, 0],
          [11.5, -1.8, Math.PI],
          [11.5, -4.2, 0],
        ].forEach(([x, z, r]) => {
          chairProp(x, z, r, 0xffffff);
          const p = seatedPerson(x, z, r);
          // Eating motion: arm lifts glass/fork to mouth
          interiorUpdaters.push((dt, t) => {
            p.AR.rotation.x = -1.2 + Math.sin(t * 2 + x) * 0.5;
          });
        });
        [8, 11.5].forEach((x) => cyl(interior, 1.1, 1, 0xfafafa, x, 0, -3, 12));

        // Waiter with luggage / tray
        const bellboy = person(0xc0392b, pick1(SK));
        box(bellboy, 1.2, 0.8, 0.8, 0x8d6e63, 0.9, 0.3, 0.7);
        interior.add(bellboy);
        interiorUpdaters.push((dt, t) => {
          const s = Math.sin(t * 0.8);
          bellboy.position.set(-6 + s * 4, 0, 4);
          bellboy.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
          walkAnim(bellboy, dt, 5, 0.5);
        });

        return 16;
      },

      // 🍽️ Restaurant: Live kitchen with chef stirring and flames, dining tables, waiters
      restaurant: () => {
        room(28, 16, 0xc9a77c, 0xfff0d9);
        // Live kitchen counter
        box(interior, 9, 1.2, 2, 0x78909c, 8, 0, -6.6);
        cyl(interior, 1, 0.15, 0x222, 6.5, 1.2, -6.6, 12);

        // Jumping flames on stove
        const flames = [0, 1, 2].map((i) =>
          sph(interior, 0.3, 0xff7a18, 5.8 + i * 0.7, 1.7, -6.6, new THREE.MeshBasicMaterial({ color: 0xff7a18 }))
        );
        const chef = person(0xffffff, pick1(SK));
        chef.position.set(8, 0, -4.8);
        chef.rotation.y = Math.PI;
        interior.add(chef);

        interiorUpdaters.push((dt, t) => {
          chef.AR.rotation.x = -1.2 + Math.sin(t * 5) * 0.5;
          flames.forEach((s, i) => (s.scale.y = 1 + 0.6 * Math.sin(t * 12 + i)));
        });

        // Dining tables with patrons chewing and drinking
        [
          [-9, -1],
          [-3, -1],
          [3, -1],
          [-9, 5],
          [-3, 5],
          [3, 5],
        ].forEach(([x, z], k) => {
          cyl(interior, 1.1, 1, 0xfafafa, x, 0, z, 12);
          cyl(interior, 0.45, 0.12, pick1(COL), x, 1, z);
          [[-2.2, 0], [2.2, Math.PI]].forEach(([d, r], j) => {
            chairProp(x, z + d, r, 0x8d5b2b);
            const g = seatedPerson(x, z + d, r);
            interiorUpdaters.push((dt, t) => {
              g.AR.rotation.x = -1.2 - 0.8 * Math.sin(t * 2 + k + j);
            });
          });
        });

        // Waiter serving food
        const waiter = person(0xffffff, pick1(SK));
        box(waiter, 1, 0.1, 0.8, 0xcfd8dc, 0.3, 1.6, 0.9, 0);
        interior.add(waiter);
        interiorUpdaters.push((dt, t) => {
          const u = Math.sin(t * 0.9);
          waiter.position.set(u * 8, 0, 2);
          waiter.rotation.y = u > 0 ? Math.PI / 2 : -Math.PI / 2;
          walkAnim(waiter, dt, 6, 0.5);
        });

        return 17;
      },

      // 🎬 Cinema Theater: Tiered seating, synchronized seat filling, cheering crowd, projector beam
      cinema: () => {
        room(26, 16, 0x2b1a3a, 0x3b2a4a);
        const scm = new THREE.MeshBasicMaterial({ color: 0x2266ff });
        const sc = new THREE.Mesh(BG, scm);
        sc.scale.set(16, 6.5, 0.2);
        sc.position.set(0, 4.6, -7.6);
        interior.add(sc);

        // Projector beam
        const bm = new THREE.Mesh(BG, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 }));
        bm.scale.set(6, 3, 16);
        bm.position.set(0, 7, 1);
        interior.add(bm);

        // Audience seats and spectators
        const spectators: { g: PersonGroup; y0: number }[] = [];
        for (let r = 0; r < 5; r++) {
          const z = -3 + r * 2.2;
          const h = 0.45 * (r + 1);
          box(interior, 19, h, 2.2, 0x4a2c4f, 0, 0, z, 0);
          for (let x = -7.2; x <= 7.3; x += 2.4) {
            chairProp(x, z, Math.PI, 0xb71c1c);
            interior.children[interior.children.length - 1].position.y = h;
            const p = seatedPerson(x, z, Math.PI);
            p.position.y += h;
            spectators.push({ g: p, y0: p.position.y });
          }
        }

        // Popcorn seller
        const popcornMan = person(0xff8f00, pick1(SK));
        box(popcornMan, 0.9, 0.8, 0.6, 0xffeb3b, 0, 1.3, 0.5, 0);
        interior.add(popcornMan);

        interiorUpdaters.push((dt, t) => {
          // Dynamic movie screen colors
          scm.color.setHSL((t * 0.12) % 1, 0.8, 0.5);

          // Synchronized audience standing/cheering wave
          spectators.forEach((spec, idx) => {
            const wave = Math.sin(t * 1.5 + idx * 0.4) > 0.8;
            spec.g.position.y = spec.y0 + (wave ? 0.35 : 0);
            spec.g.L.rotation.x = spec.g.R.rotation.x = wave ? 0 : -1.5;
            spec.g.AL.rotation.x = spec.g.AR.rotation.x = wave ? -2.8 + Math.sin(t * 10) * 0.4 : -0.6;
          });

          // Popcorn vendor paces the aisle
          const s = Math.sin(t * 0.7);
          popcornMan.position.set(s * 6, 0, 9);
          popcornMan.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
          walkAnim(popcornMan, dt, 4, 0.4);
        });

        return 16;
      },

      // 🛕 Mandir (Temple): Glowing altar, swinging bell, priest rotating Aarti thali, bowing devotees
      mandir: () => {
        room(26, 16, 0xe9ddc8, 0xf8e8c8, 8);
        box(interior, 10, 1, 5, 0xd7ccc8, 0, 0, -5.5);
        box(interior, 2.4, 3, 1.4, 0x1e88e5, 0, 1, -6);
        sph(interior, 0.7, 0xe0ac80, 0, 4.5, -6);
        cone(interior, 0.8, 1.2, 0xffc107, 0, 5, -6);

        // Halo & flickering lamps
        const hm = new THREE.MeshBasicMaterial({ color: 0xffd54f });
        const mm = new THREE.MeshBasicMaterial({ color: 0xff9800 });
        sph(interior, 1.8, 0, 0, 3.4, -6.9, hm).scale.z = 0.1;

        const diyas: THREE.Mesh[] = [];
        for (let i = 0; i < 12; i++) {
          diyas.push(sph(interior, 0.22, 0, -5 + i * 0.9, 1.3, -3.2, mm));
        }

        // Priest performing rhythmic Aarti with Thali
        const pujari = person(0xff9800, pick1(SK));
        pujari.position.set(2.5, 0, -2.6);
        cyl(pujari.AR, 0.5, 0.08, 0xffd54f, 0, -0.9, 0.1);
        interior.add(pujari);

        // Swinging temple bell
        const bellGroup = new THREE.Group();
        bellGroup.position.set(9, 6, -3);
        sph(bellGroup, 0.7, 0xffc107, 0, -1.5, 0);
        interior.add(bellGroup);

        const bellRinger = person(0x3f51b5, pick1(SK));
        bellRinger.position.set(9, 0, -1.2);
        bellRinger.rotation.y = Math.PI;
        interior.add(bellRinger);

        // Devotees bowing down in Namaste & prayer
        const devotees: PersonGroup[] = [];
        [
          [-7, 2],
          [-4, 2],
          [-1, 2],
          [3, 2],
          [6, 2],
          [-7, 5],
          [-4, 5],
          [0, 5],
          [5, 5],
        ].forEach(([x, z]) => {
          const dev = person(pick1(COL), pick1(SK));
          dev.position.set(x, 0, z);
          dev.rotation.y = Math.PI;
          dev.rotation.order = 'YXZ';
          interior.add(dev);
          devotees.push(dev);
        });

        interiorUpdaters.push((dt, t) => {
          // Circular Aarti motion
          pujari.AR.rotation.x = -1.3 + Math.cos(t * 3) * 0.4;
          pujari.AR.rotation.z = Math.sin(t * 3) * 0.6;

          // Bell swing & ringing arm
          bellGroup.rotation.z = Math.sin(t * 4) * 0.4;
          bellRinger.AR.rotation.x = -2.6 + Math.sin(t * 4) * 0.3;

          // Diya flames flickering
          diyas.forEach((s, i) => (s.scale.y = 1 + 0.4 * Math.sin(t * 10 + i)));

          // Devotees bowing reverently
          devotees.forEach((g, k) => {
            g.rotation.x = 0.85 * Math.max(0, Math.sin(t * 1.2 + k));
            g.AL.rotation.x = g.AR.rotation.x = -1.7;
          });
        });

        return 16;
      },

      // 🚓 Police Station & Jail: Officer at desk, police chasing thief, dragging thief into jail cell and locking gate shut!
      police: () => {
        room(26, 16, 0xa9aeb8, 0xcfd8e8);
        box(interior, 10, 2.2, 0.1, 0x1e3a8a, -4, 4, -7.7, 0);
        // Officer desk
        box(interior, 4, 1.1, 1.8, 0x6d4c2f, -8, 0, -4);
        box(interior, 0.9, 0.7, 0.1, 0x222, -8, 1.1, -4.4, 0);
        chairProp(-8, -5.6, 0, 0x333);
        seatedPerson(-8, -5.6, 0, 0x1e3a8a);

        // Jail cell iron bars
        for (let i = 0; i < 9; i++) {
          box(interior, 0.15, 4, 0.15, 0x333, 3 + i * 1.15, 0, -1.5, 0);
        }
        [3, 12.2].forEach((x) => {
          for (let j = 0; j < 5; j++) {
            box(interior, 0.15, 4, 0.15, 0x333, x, 0, -2.5 - j * 1.1, 0);
          }
        });
        box(interior, 9.4, 0.15, 0.15, 0x333, 7.6, 4, -1.5, 0);

        // Jail sliding gate
        const jailGate = box(interior, 2.2, 3.8, 0.15, 0x777, 10.5, 0, -1.5, 0);

        // Animated Thief & Police Cop
        const thief = person(0x424242, pick1(SK)); // striped / dark
        thief.position.set(-11, 0, 4);
        interior.add(thief);

        const cop = person(0x1e3a8a, pick1(SK));
        cop.position.set(-14, 0, 4);
        interior.add(cop);

        interiorUpdaters.push((dt, t) => {
          const cycle = t % 16;
          // Step 1: Chase sequence across room (0 - 4s)
          if (cycle < 4) {
            const s = cycle / 4;
            thief.position.set(-11 + 14 * s, 0, 4);
            cop.position.set(thief.position.x - 1.8, 0, 4);
            thief.rotation.y = cop.rotation.y = Math.PI / 2;
            walkAnim(thief, dt, 12, 0.9);
            walkAnim(cop, dt, 12, 0.9);
            jailGate.position.x = 10.5;
          }
          // Step 2: Handcuffed at jail door (4 - 6s)
          else if (cycle < 6) {
            thief.position.set(3, 0, 4);
            cop.position.set(1.5, 0, 4);
            thief.AL.rotation.x = thief.AR.rotation.x = -2.8; // hands in air
            cop.AR.rotation.x = -1.2;
          }
          // Step 3: Cop leads thief into jail cell (6 - 9s)
          else if (cycle < 9) {
            const s = (cycle - 6) / 3;
            thief.position.set(3 + 5 * s, 0, 4 - 8.5 * s);
            cop.position.set(thief.position.x - 1.2, 0, thief.position.z + 0.5);
            walkAnim(thief, dt, 5, 0.5);
            walkAnim(cop, dt, 5, 0.5);
            jailGate.position.x = 10.5;
          }
          // Step 4: Jail gate slides shut and locks! (9 - 16s)
          else {
            thief.position.set(8, 0, -4.5); // inside jail
            thief.rotation.y = 0;
            cop.position.set(5.5, 0, 1); // outside jail
            cop.rotation.y = Math.PI;
            // Gate slides shut
            jailGate.position.x = 8.2; // locked!
          }
        });

        return 16;
      },

      // ✈️ Airplane Flight: Inside passenger cabin, clouds rushing past outside window, airplane wing, flight attendant
      plane: () => {
        const L = 32;
        box(interior, L, 0.4, 9.6, 0x9aa8b8, 0, -0.4, 0);
        box(interior, 0.4, 5, 9.6, 0xdfe6ee, -L / 2, 0, 0);
        box(interior, L, 1.5, 0.3, 0xdfe6ee, 0, 0, -4.9, 0);
        box(interior, L, 1.2, 0.3, 0xdfe6ee, 0, 3.8, -4.9, 0);
        for (let x = -14.5; x <= 15; x += 2.4) {
          box(interior, 0.7, 2.3, 0.3, 0xdfe6ee, x, 1.5, -4.9, 0);
        }

        // Seats with passengers
        for (let x = -13; x <= 13; x += 2.4) {
          [-3.6, -2.1, 2.1, 3.6].forEach((z) => {
            chairProp(x, z, Math.PI / 2, 0x2f6fb5);
            if (Math.random() < 0.8) seatedPerson(x, z, Math.PI / 2);
          });
        }

        // Flight attendant with drinks cart
        const flightAttendant = person(0xd62828, pick1(SK));
        box(flightAttendant, 1, 0.9, 0.7, 0xcfd8dc, 0.3, 0.2, 0.8);
        interior.add(flightAttendant);

        // Outside airplane wing & spinning turbine
        const wing = box(interior, 3, 0.4, 16, 0xb7c0cc, 2, -1.6, -13, 0);
        cyl(interior, 1, 3.4, 0x888, 3, -3, -12, 12).rotation.z = Math.PI / 2;

        // Passing 3D clouds
        const clouds: THREE.Group[] = [];
        const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        for (let i = 0; i < 15; i++) {
          const c = new THREE.Group();
          for (let k = 0; k < 4; k++) {
            sph(c, rnd(2, 3.5), 0, k * 2.5, rnd(-0.5, 0.5), 0, cloudMat);
          }
          c.position.set(rnd(-70, 70), rnd(0, 16), rnd(-12, -45));
          interior.add(c);
          clouds.push(c);
        }

        const sc = scenery(-45, 2.2);

        interiorUpdaters.push((dt, t) => {
          sc.g.position.x -= 40 * dt;
          if (sc.g.position.x < -sc.Pd) sc.g.position.x += sc.Pd;

          clouds.forEach((c) => {
            c.position.x -= 28 * dt;
            if (c.position.x < -80) c.position.x = 80;
          });

          // Flight attendant rolls cart down aisle
          const s = Math.sin(t * 0.4);
          flightAttendant.position.set(s * 10, 0, 0);
          flightAttendant.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
          walkAnim(flightAttendant, dt, 4, 0.4);

          // Subtle flight turbulence
          interior.rotation.z = Math.sin(t * 0.9) * 0.012;
          wing.rotation.z = Math.sin(t * 1.3) * 0.02;
        });

        return 19;
      },

      // 🚆 Train Interior: Moving countryside outside, ticket inspector
      train: () => {
        const L = 34;
        box(interior, L, 0.4, 10, 0x6b4a2f, 0, -0.4, 0);
        box(interior, 0.4, 5, 10, 0xb0b8c4, -L / 2, 0, 0);
        box(interior, L, 1.2, 0.3, 0xb0b8c4, 0, 0, -5, 0);
        box(interior, L, 0.6, 0.3, 0xb0b8c4, 0, 3.8, -5, 0);
        for (let x = -16; x <= 16; x += 4) {
          box(interior, 0.6, 3.4, 0.3, 0xb0b8c4, x, 0.6, -5, 0);
        }

        // Seats with passengers
        for (let x = -15; x <= 15; x += 3.3) {
          [[-3.6, 0], [3.6, Math.PI]].forEach(([z, r]) => {
            chairProp(x, z, r, 0x2d5da8);
            if (Math.random() < 0.8) seatedPerson(x, z, r);
          });
        }

        // Ticket checker
        const checker = person(0xc0392b, pick1(SK));
        cyl(checker.AR, 0.3, 0.8, 0xbdbdbd, 0, -1.2, 0.4);
        interior.add(checker);

        const sc = scenery(-1.5, 1);

        interiorUpdaters.push((dt, t) => {
          sc.g.position.x -= 22 * dt;
          if (sc.g.position.x < -sc.Pd) sc.g.position.x += sc.Pd;

          const s = Math.sin(t * 0.5);
          checker.position.set(s * 12, 0, 0);
          checker.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
          walkAnim(checker, dt, 4, 0.4);

          // Train track click-clack rumble
          interior.position.y = Math.sin(t * 18) * 0.03;
        });

        return 18;
      },

      // 📚 Grand Library: Towering bookshelves with books, readers turning pages, librarian
      library: () => {
        room(26, 16, 0x8d6e63, 0xe8d9c0);
        // Bookshelves filled with books
        for (let l = 0; l < 4; l++) {
          box(interior, 25, 0.2, 1.2, 0x5d4037, 0, 0.5 + l * 1.6, -7.2, 0);
          for (let i = 0; i < 20; i++) {
            box(
              interior,
              0.5,
              0.9 + Math.random() * 0.5,
              0.8,
              pick1(COL),
              -11.8 + i * 1.25,
              0.7 + l * 1.6,
              -7.2,
              0
            );
          }
        }

        // Reading study tables
        [
          [-6, 0],
          [5, 0],
          [-1, 5.5],
        ].forEach(([x, z], k) => {
          box(interior, 5, 0.9, 2.4, 0x8d5b2b, x, 0, z);
          [-1, 1].forEach((o, j) => {
            box(interior, 0.8, 0.1, 0.6, pick1(COL), x + o, 0.9, z, 0);
            [[-1.9, 0], [1.9, Math.PI]].forEach(([d, r], m) => {
              chairProp(x + o, z + d, r, 0x6d4c2f);
              const p = seatedPerson(x + o, z + d, r);
              // Holds book and flips pages
              box(p, 0.7, 0.1, 0.5, pick1(COL), 0, 1, 0.5, 0);
              interiorUpdaters.push((dt, t) => {
                p.AR.rotation.x = -0.9 - 0.4 * Math.max(0, Math.sin(t * 0.9 + k + j + m));
              });
            });
          });
        });

        // Librarian walking with book stack
        const librarian = person(0x6a1b9a, pick1(SK));
        box(librarian, 0.6, 0.7, 0.5, 0xd32f2f, 0.3, 1.3, 0.6, 0);
        interior.add(librarian);
        interiorUpdaters.push((dt, t) => {
          const s = Math.sin(t * 0.6);
          librarian.position.set(s * 8, 0, 7.5);
          librarian.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
          walkAnim(librarian, dt, 4, 0.4);
        });

        return 16;
      },

      // 🏊 Swimming Pool: 4 swimming lanes with crawl strokes, high diving board with diver diving into water
      pool: () => {
        box(interior, 32, 0.4, 20, 0xe6e0d4, 0, -0.4, 0, 0);
        box(interior, 17, 0.3, 10.2, 0xffffff, 0, 0, 0);
        const wm = new THREE.MeshStandardMaterial({
          color: 0x29b6f6,
          roughness: 0.1,
          transparent: true,
          opacity: 0.82,
        });
        const w = new THREE.Mesh(BG, wm);
        w.scale.set(16, 0.5, 9);
        w.position.set(0, 0.3, 0);
        interior.add(w);

        // 4 Lane Swimmers doing continuous crawl strokes
        for (let l = 0; l < 4; l++) {
          const sw = person(pick1(COL), pick1(SK));
          sw.rotation.order = 'YXZ';
          sw.rotation.x = Math.PI / 2;
          sw.position.y = 0.55;
          interior.add(sw);

          const z = -3.4 + l * 2.3;
          const v = 1.6 + l * 0.4;
          interiorUpdaters.push((dt, t) => {
            const p = (t * v + l * 6) % 32;
            const dir = p < 16 ? 1 : -1;
            sw.position.x = dir > 0 ? -7.5 + p : 7.5 - (p - 16);
            sw.position.z = z;
            sw.rotation.y = dir * 1.57;
            sw.t += dt * 8;
            const s = sw.t;
            sw.AL.rotation.x = s;
            sw.AR.rotation.x = s + Math.PI;
            sw.L.rotation.x = Math.sin(s * 3) * 0.3;
            sw.R.rotation.x = -Math.sin(s * 3) * 0.3;
          });
        }

        // High Diving Board with diver jumping into water
        const diver = person(0xff5722, pick1(SK));
        diver.rotation.order = 'YXZ';
        box(interior, 0.6, 2.2, 0.6, 0xcfd8dc, 5, 0, -8);
        box(interior, 1, 0.2, 4, 0x37474f, 5, 2.2, -6.2, 0);
        interior.add(diver);

        interiorUpdaters.push((dt, t) => {
          const c = t % 6;
          diver.visible = c < 3.8;
          if (c < 2) {
            diver.position.set(5, 2.4, -4.8);
            diver.rotation.x = 0;
            diver.AL.rotation.x = diver.AR.rotation.x = -2.6 + Math.sin(t * 4) * 0.2;
          } else if (c < 3.8) {
            const s = (c - 2) / 1.8;
            diver.position.set(5, 2.4 + Math.sin(s * Math.PI) * 2 - 2.2 * s, -4.8 + s * 3);
            diver.rotation.x = 1.6 * s;
          }
        });

        // Lifeguard tower
        box(interior, 1.8, 2.2, 1.8, 0xff5252, -13, 0, -7);
        const lifeguard = seatedPerson(-13, -7, 0, 0xffd600);
        lifeguard.position.y = 1.45;

        return 17;
      },

      // 🎡 Fairground Carnival: Spinning Ferris wheel, wave carousel, swings rocking back and forth
      jhoola: () => {
        box(interior, 38, 0.4, 24, 0x78b556, 0, -0.4, 0);
        const W = new THREE.Group();
        const gond: THREE.Group[] = [];
        W.position.set(-12, 0, -5);
        interior.add(W);
        [-1.8, 1.8].forEach((z) =>
          [[-3, -0.33], [3, 0.33]].forEach(([x, a]) =>
            (box(W, 0.5, 11.4, 0.5, 0x8d6e63, x, 0, z) as THREE.Mesh).rotation.z = a
          )
        );
        const wl = new THREE.Group();
        wl.position.y = 10;
        W.add(wl);
        wl.add(new THREE.Mesh(new THREE.TorusGeometry(8, 0.18, 6, 36), M(0xffffff)));
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI) / 5;
          const sp = new THREE.Group();
          sp.rotation.z = a;
          box(sp, 0.2, 8, 0.2, 0xe0e0e0, 0, 0, 0, 0);
          wl.add(sp);
          const gg = new THREE.Group();
          gg.position.set(-Math.sin(a) * 8, Math.cos(a) * 8, 0);
          box(gg, 2, 1.3, 1.8, COL[i % 8], 0, -1.5, 0);
          const p = person(pick1(COL), pick1(SK));
          p.scale.setScalar(0.55);
          p.position.set(0, -1.5, 0);
          gg.add(p);
          wl.add(gg);
          gond.push(gg);
        }

        // Swings rocking back and forth
        [-1.5, 1.5].forEach((o, i) => {
          const sw = new THREE.Group();
          sw.position.set(-2 + o * 3.4, 5, 7);
          interior.add(sw);
          box(interior, 0.3, 5, 0.3, 0x6d4c41, -2 + o * 3.4, 0, 6.2);
          box(interior, 0.3, 5, 0.3, 0x6d4c41, -2 + o * 3.4, 0, 7.8);
          box(sw, 0.1, 3.6, 0.1, 0x999999, 0, -3.6, 0);
          box(sw, 1.2, 0.2, 0.9, 0xff7043, 0, -3.8, 0);
          const p = person(pick1(COL), pick1(SK));
          p.scale.setScalar(0.7);
          p.position.set(0, -4.2, 0);
          p.L.rotation.x = p.R.rotation.x = -1.4;
          sw.add(p);
          interiorUpdaters.push((dt, t) => {
            sw.rotation.x = Math.sin(t * 2 + i * 1.5) * 0.7;
          });
        });

        interiorUpdaters.push((dt) => {
          wl.rotation.z += dt * 0.35;
          gond.forEach((g) => (g.rotation.z = -wl.rotation.z));
        });

        return 22;
      },

      // 🎮 Arcade Game Zone: Glowing screens, ping pong table rally, carrom players
      game: () => {
        room(26, 16, 0x37474f, 0x263238);
        // Arcade cabinets
        const screens: THREE.MeshBasicMaterial[] = [];
        [-10, -6.5, -3].forEach((x, i) => {
          box(interior, 2.4, 3.8, 1.6, pick1(COL), x, 0, -7);
          const mt = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
          const sc = new THREE.Mesh(BG, mt);
          sc.scale.set(1.8, 1.2, 0.1);
          sc.position.set(x, 2.5, -6.15);
          interior.add(sc);
          screens.push(mt);

          const gamer = person(pick1(COL), pick1(SK));
          gamer.position.set(x, 0, -5.3);
          gamer.rotation.y = Math.PI;
          interior.add(gamer);
          interiorUpdaters.push((dt, t) => {
            gamer.AL.rotation.x = -1.2 + Math.sin(t * 9 + i) * 0.2;
            gamer.AR.rotation.x = -1.2 + Math.cos(t * 11 + i) * 0.2;
          });
        });

        // Ping pong table tennis rally
        box(interior, 5, 0.8, 2.8, 0x1565c0, 5, 0, 2);
        box(interior, 0.1, 0.5, 2.8, 0xffffff, 5, 0.8, 2, 0);
        const playerA = person(0xe74c3c, pick1(SK));
        playerA.position.set(1.2, 0, 2);
        playerA.rotation.y = Math.PI / 2;
        interior.add(playerA);

        const playerB = person(0x2ecc71, pick1(SK));
        playerB.position.set(8.8, 0, 2);
        playerB.rotation.y = -Math.PI / 2;
        interior.add(playerB);

        const ttBall = sph(interior, 0.2, 0xffffff, 5, 1.5, 2);

        interiorUpdaters.push((dt, t) => {
          screens.forEach((m, i) => m.color.setHSL((t * 0.5 + i * 0.3) % 1, 1, 0.5));
          const s = (t * 0.9) % 2;
          const u = s < 1 ? s : 2 - s;
          ttBall.position.set(2.6 + u * 4.8, 1.4 + Math.sin(u * Math.PI) * 1.1, 2);
          playerA.AR.rotation.x = -1.4 - Math.max(0, 1 - u * 8) * 0.8;
          playerB.AR.rotation.x = -1.4 - Math.max(0, 1 - (1 - u) * 8) * 0.8;
        });

        return 16;
      },
    };

    // Interior activation helper
    function enterInterior(modeKey: string) {
      clearInterior();
      city.visible = false;
      interior.visible = true;

      const builder = INTERIOR_BUILDERS[modeKey];
      if (builder) {
        view = builder();
      } else {
        // Fallback generic interior
        room(26, 16, 0xcfd8dc, 0xeceff1);
        const p = person(0x1976d2, pick1(SK));
        p.position.set(0, 0, 0);
        interior.add(p);
        view = 16;
      }
      tgt.set(0, 2, 0);
      zoom = 1;
      az = 0.78;
      el = 0.6;
      fitCamera();
    }

    function returnToCity() {
      clearInterior();
      interior.visible = false;
      city.visible = true;
      tgt.set(0, 0, 0);
      view = 70;
      zoom = 1;
      az = 0.8;
      el = 0.62;
      fitCamera();
    }

    /* =========================================================================
       USER INTERACTION & RAYCASTING
       ========================================================================= */
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let dragDistance = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      dragDistance = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      dragDistance += Math.abs(dx) + Math.abs(dy);

      az -= dx * 0.006;
      el = Math.min(1.2, Math.max(0.3, el + dy * 0.004));
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging = false;
      if (dragDistance < 8 && stateRef.current.mode === 'city') {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const hits = raycaster.intersectObjects(city.children, true);
        for (const hit of hits) {
          const t = hit.object.userData.t;
          if (t && t !== 'home') {
            sound.playClick();
            onEnterMode(t);
            break;
          } else if (t === 'home' && hit.instanceId !== undefined) {
            sound.playClick();
            const houseNum = hit.instanceId + 1;
            onSelectHouseNotify(`🏠 घर नं. ${houseNum} — resident_${String(houseNum).padStart(3, '0')}`);
            // Position beacon
            const p = HP[hit.instanceId];
            if (p) {
              beaconLight.position.set(p[0], 22, p[1]);
              beaconLight.visible = true;
              tgt.set(p[0], 0, p[1]);
              zoom = 3.2;
              fitCamera();
            }
            break;
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      zoom = Math.min(8, Math.max(0.5, zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
      fitCamera();
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('resize', fitCamera);

    /* =========================================================================
       ANIMATION RENDER LOOP (60fps Lossless)
       ========================================================================= */
    let lastTime = performance.now();
    let totalTime = 0;
    let frameId = 0;
    const projVec = new THREE.Vector3();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      totalTime += dt;

      const currentMode = stateRef.current.mode;
      const currentWeather = stateRef.current.weather;

      // Update Lighting & Weather effects
      if (currentWeather === 'night') {
        hemiLight.intensity = 0.3;
        hemiLight.color.set(0x6677aa);
        sunLight.intensity = 0.25;
        sunLight.color.set(0x8899ff);
        scene.background = new THREE.Color(0x0b1030);
        stars.material.opacity = 0.85;
        WIN.forEach((m) => (m.material = new THREE.MeshBasicMaterial({ color: 0xffe08a })));
        TOW.forEach((m) => m.emissive.set(0xffe9a0));
        templePointLight.intensity = 2.5;
        policeSirenLight.intensity = 2 + Math.sin(totalTime * 8) * 1.5;
      } else if (currentWeather === 'rain') {
        hemiLight.intensity = 0.55;
        hemiLight.color.set(0x78909c);
        sunLight.intensity = 0.45;
        sunLight.color.set(0xb0bec5);
        scene.background = new THREE.Color(0x546e7a);
        stars.material.opacity = 0;
        rainMat.opacity = 0.85;
        snowMat.opacity = 0;
        WIN.forEach((m) => (m.material = M(0x5aa9d6)));
        TOW.forEach((m) => m.emissive.set(0x000000));
        templePointLight.intensity = 1.0;
        policeSirenLight.intensity = 0;
      } else if (currentWeather === 'snow') {
        hemiLight.intensity = 0.65;
        hemiLight.color.set(0xdceefb);
        sunLight.intensity = 0.6;
        sunLight.color.set(0xe0f7fa);
        scene.background = new THREE.Color(0xb0bec5);
        stars.material.opacity = 0;
        snowMat.opacity = 0.9;
        rainMat.opacity = 0;
        WIN.forEach((m) => (m.material = M(0x5aa9d6)));
        TOW.forEach((m) => m.emissive.set(0x000000));
        templePointLight.intensity = 1.2;
        policeSirenLight.intensity = 0;
      } else {
        // Sunny
        hemiLight.intensity = 0.85;
        hemiLight.color.set(0xe6f6ff);
        sunLight.intensity = 0.95;
        sunLight.color.set(0xfff1d6);
        scene.background = new THREE.Color(SKY_DAY);
        stars.material.opacity = 0;
        rainMat.opacity = 0;
        snowMat.opacity = 0;
        WIN.forEach((m) => (m.material = M(0x5aa9d6)));
        TOW.forEach((m) => m.emissive.set(0x000000));
        templePointLight.intensity = 1.2;
        policeSirenLight.intensity = 0;
      }

      // Rain / Snow particle fall
      if (currentWeather === 'rain') {
        const pos = rainGeo.attributes.position.array as Float32Array;
        for (let i = 1; i < rainCount * 3; i += 3) {
          pos[i] -= dt * 65;
          if (pos[i] < 0) pos[i] = 80;
        }
        rainGeo.attributes.position.needsUpdate = true;
      } else if (currentWeather === 'snow') {
        const pos = snowGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < snowCount; i++) {
          pos[i * 3 + 1] -= dt * 15;
          pos[i * 3] += Math.sin(totalTime + i) * dt * 3;
          if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 70;
        }
        snowGeo.attributes.position.needsUpdate = true;
      }

      // City mode updates
      if (currentMode === 'city') {
        // Pedestrians
        walkers.forEach((w) => {
          w.p += w.v * w.d * dt;
          if (w.p > w.b) w.d = -1;
          if (w.p < w.a) w.d = 1;
          if (w.ax) {
            w.g.position.set(w.f, 0, w.p);
            w.g.rotation.y = w.d > 0 ? 0 : Math.PI;
          } else {
            w.g.position.set(w.p, 0, w.f);
            w.g.rotation.y = w.d > 0 ? Math.PI / 2 : -Math.PI / 2;
          }
          walkAnim(w.g, dt);
        });

        // NPCs with waypoint pathfinding
        npcManager.update(dt);

        // Cars
        cars.forEach((c) => {
          c.p += c.v * dt;
          if (c.p > 70) c.p = -70;
          if (c.p < -70) c.p = 70;
          c.g.position.set(c.ax ? c.f : c.p + (c.o || 0), 0, c.ax ? c.p + (c.o || 0) : c.f);
          c.g.rotation.y = c.ax ? Math.PI / 2 : 0;
        });

        // River ripples
        rip.forEach((r) => {
          r.x += r.v * dt;
          if (r.x > 155) r.x = -155;
          r.m.position.set(r.x, 0.1, -50 + 6 * Math.sin(r.x * 0.05) + r.o);
        });

        // Train
        const spTrain = 3 + 17 * Math.min(1, Math.abs(xTrain - 25) / 30);
        xTrain += spTrain * dt;
        if (xTrain > 150) xTrain = -150;
        TR.position.x = xTrain;

        // Metro
        xMetro += (4 + 14 * Math.min(1, Math.abs(xMetro) / 25)) * dt;
        if (xMetro > 175) xMetro = -175;
        MT.position.x = xMetro;

        // Airplane Takeoff & Flight Cycle
        const cycle = totalTime % 36;
        let pY = 0;
        let pZ = 0;
        let pPitch = 0;
        if (cycle < 8) {
          // Parked / taxi
          pY = 0;
          pZ = 0;
        } else if (cycle < 15) {
          // Takeoff roll
          const s = (cycle - 8) / 7;
          pZ = 45 * s * s;
          pPitch = -0.05;
        } else if (cycle < 24) {
          // Soaring sky
          const s = (cycle - 15) / 9;
          pZ = 45 + 85 * s;
          pY = 40 * s * s;
          pPitch = -0.3;
        } else {
          // Landing approach
          const s = (cycle - 24) / 12;
          const e = 1 - (1 - s) * (1 - s);
          pZ = -130 * (1 - e);
          pY = 40 * Math.pow(1 - e, 1.5);
          pPitch = 0.12 * (1 - e);
        }
        PL.position.set(58, pY, pZ);
        PL.rotation.x = pPitch;

        // Carnival wheel rotation
        FWWheel.rotation.z += dt * 0.25;
        gondolas.forEach((g) => (g.rotation.z = -FWWheel.rotation.z));
        flagGroup.rotation.y = Math.sin(totalTime * 3) * 0.4;

        // Sailing boats & Soaring birds
        boats.forEach((b) => {
          b.x += b.v * dt;
          if (b.x > 150) b.x = -150;
          if (b.x < -150) b.x = 150;
          b.g.position.set(b.x, 0.2, -50 + 6 * Math.sin(b.x * 0.05) + b.o);
          b.g.rotation.y = b.v > 0 ? 0 : Math.PI;
        });

        birds.forEach((o) => {
          const a = totalTime * o.s + o.ph;
          o.g.position.set(Math.cos(a) * o.r, o.y, Math.sin(a) * o.r);
          o.g.rotation.y = -a - (o.s > 0 ? 0 : Math.PI);
          const f = Math.sin(totalTime * 8 + o.ph) * 0.6;
          o.a.rotation.z = f;
          o.b.rotation.z = -f;
        });

        // Hot air balloon
        balloon.position.set(
          Math.cos(totalTime * 0.04) * 50,
          26 + Math.sin(totalTime * 0.5) * 1.2,
          22 + Math.sin(totalTime * 0.04) * 30
        );

        // Windmills
        windmills.forEach((w) => (w.rotation.z += dt * 1.5));

        // Real-time Clock Hands
        const nowTime = new Date();
        minuteHand.rotation.z = -((nowTime.getMinutes() + nowTime.getSeconds() / 60) / 60) * Math.PI * 2;
        hourHand.rotation.z = -(((nowTime.getHours() % 12) + nowTime.getMinutes() / 60) / 12) * Math.PI * 2;

        // Football match animation
        ballKickTimer -= dt;
        if (ballKickTimer < 0) {
          ballKickTimer = rnd(1.5, 3);
          ballTarget.set(-42 + rnd(-13, 13), 0, 78 + rnd(-8, 8));
        }
        const bPos = ball.position;
        bPos.x += (ballTarget.x - bPos.x) * dt * 2.2;
        bPos.z += (ballTarget.z - bPos.z) * dt * 2.2;
        bPos.y = 0.6 + Math.abs(Math.sin(totalTime * 6)) * 0.2;

        fbPlayers.forEach((p) => {
          const g = p.g;
          const dx = bPos.x + p.ox * 0.4 - g.position.x;
          const dz = bPos.z + p.oz * 0.4 - g.position.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 0.8) {
            g.position.x += (dx / dist) * 4.5 * dt;
            g.position.z += (dz / dist) * 4.5 * dt;
            g.rotation.y = Math.atan2(dx, dz);
            walkAnim(g, dt, 10, 0.9);
          } else {
            g.L.rotation.x = g.R.rotation.x = g.AL.rotation.x = g.AR.rotation.x = 0;
          }
        });

        // Cricket match animation
        const cy = Math.floor(totalTime / 6.5);
        const c = totalTime % 6.5;
        const cb = crBall.position;
        const fp = crFielders[cy % 8].position;
        if (c < 2.2) {
          crBowler.position.z = 92 - (8 * c) / 2.2;
          walkAnim(crBowler, dt, 10, 0.9);
          cb.set(38, 1.7, crBowler.position.z - 0.5);
          crBatsman.AR.rotation.x = -2.2;
        } else if (c < 3) {
          const s = (c - 2.2) / 0.8;
          cb.set(38, 1.6 - 0.7 * s, 83.5 - 3 * s);
          crBatsman.AR.rotation.x = c > 2.8 ? Math.min(0.8, -2.2 + (c - 2.8) * 15) : -2.2;
        } else if (c < 5.2) {
          const s = (c - 3) / 2.2;
          cb.set(38 + (fp.x - 38) * s, 0.9 + Math.sin(s * Math.PI) * 5, 80.6 + (fp.z - 80.6) * s);
        } else {
          cb.set(fp.x, 1.2, fp.z);
          crBowler.position.z = 92;
        }

        // Camera follow
        const follow = stateRef.current.targetFollow;
        if (follow === 'plane') {
          tgt.lerp(PL.position, 0.08);
        } else if (follow === 'train') {
          tgt.lerp(TR.position, 0.08);
        } else if (follow === 'football') {
          tgt.lerp(ball.position, 0.08);
        }
      } else {
        // Interior mode execution
        interiorUpdaters.forEach((fn) => fn(dt, totalTime));
      }

      placeCamera();
      renderer.render(scene, camera);

      // 3D HTML Labels Projection
      const labelDivs = labelsContainerRef.current?.children;
      if (labelDivs && stateRef.current.showLabels && currentMode === 'city') {
        for (let i = 0; i < labs.length; i++) {
          const lab = labs[i];
          const el = labelDivs[i] as HTMLElement;
          if (!el) continue;
          projVec.set(lab.x, lab.y, lab.z).project(camera);
          const isVisible = Math.abs(projVec.x) < 1.05 && Math.abs(projVec.y) < 1.05 && projVec.z < 1;
          if (isVisible) {
            el.textContent = lab.name;
            el.style.display = 'block';
            el.style.left = `${((projVec.x + 1) / 2) * container.clientWidth}px`;
            el.style.top = `${((-projVec.y + 1) / 2) * container.clientHeight}px`;
          } else {
            el.style.display = 'none';
          }
        }
      } else if (labelDivs) {
        for (let i = 0; i < labelDivs.length; i++) {
          (labelDivs[i] as HTMLElement).style.display = 'none';
        }
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    // Watch mode changes from React props
    let prevMode = mode;
    const intervalCheck = setInterval(() => {
      if (stateRef.current.mode !== prevMode) {
        prevMode = stateRef.current.mode;
        if (prevMode === 'city') {
          returnToCity();
        } else {
          enterInterior(prevMode);
        }
      }
    }, 50);

    return () => {
      clearInterval(intervalCheck);
      cancelAnimationFrame(frameId);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', fitCamera);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full touch-none" />

      {/* 3D HTML Labels projected over scene */}
      <div
        ref={labelsContainerRef}
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        {/* Pre-allocated DOM labels */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute hidden -translate-x-1/2 -translate-y-full px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/95 text-slate-900 border border-slate-300 shadow-md backdrop-blur-sm whitespace-nowrap transition-transform"
          >
            स्थान
          </div>
        ))}
      </div>
    </div>
  );
};
