import * as THREE from '../../vendor/three.module.js';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.amberLight = null;
    this.init();
  }

  init() {
    this.setupLighting();
    this.setupSkyAndFog();
    this.createTerrain();
    this.createFences();
    this.createTreesAndLogs();
    this.createRegulatorHilux();
  }

  setupLighting() {
    // Australian bush sun
    const sun = new THREE.DirectionalLight(0xfff1dc, 1.3);
    sun.position.set(40, 60, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 150;
    const d = 50;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    this.scene.add(sun);

    // Hemisphere light (sky blue to warm outback dirt)
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8a5d3b, 1.1);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(ambient);
  }

  setupSkyAndFog() {
    // Outback sky blue
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0xc8d9e6, 0.006);
  }

  createTerrain() {
    const size = 110;
    const segments = 22;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this.getHeightAt(x, z));
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x9e6f47, // Dry clay-loam
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true
    });

    const ground = new THREE.Mesh(geo, mat);
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    // Add tussock grass clusters
    this.createNativeGrass(70);
  }

  createNativeGrass(count) {
    const grassGeo = new THREE.ConeGeometry(0.32, 0.75, 4);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x6b703b, // Mitchell/Native tussock grass
      roughness: 0.9,
      flatShading: true
    });

    const grassGroup = new THREE.Group();
    // Deterministic pseudo-random so grass is consistent
    let seed = 42;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < count; i++) {
      const x = (rand() - 0.5) * 90;
      const z = (rand() - 0.5) * 90;
      const tuft = new THREE.Mesh(grassGeo, grassMat);
      tuft.position.set(x, this.getHeightAt(x, z) + 0.35, z);
      tuft.scale.set(0.8 + rand() * 0.8, 0.7 + rand() * 0.6, 0.8 + rand() * 0.8);
      tuft.rotation.y = rand() * Math.PI;
      grassGroup.add(tuft);
    }
    this.scene.add(grassGroup);
  }

  getHeightAt(x, z) {
    let y = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1.2;
    const creekDist = Math.abs(x + 25);
    if (creekDist < 12) {
      y -= Math.cos((creekDist / 12) * Math.PI * 0.5) * 2.2;
    }
    return y;
  }

  createFences() {
    // Boundary fences with authentic star pickets & yellow caps
    const fenceGroup = new THREE.Group();
    const picketGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6);
    const picketMat = new THREE.MeshStandardMaterial({ color: 0x242424, roughness: 0.8 });
    const capGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.15, 6);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 }); // High-vis yellow safety cap

    const perimeter = 48;
    const step = 6;

    const addPicket = (x, z) => {
      const y = this.getHeightAt(x, z);
      const post = new THREE.Mesh(picketGeo, picketMat);
      post.position.set(x, y + 0.75, z);
      post.castShadow = true;
      fenceGroup.add(post);

      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(x, y + 1.45, z);
      fenceGroup.add(cap);
    };

    // Four boundaries (skip front entry gate at z = 48, between x = -6 and 6)
    for (let p = -perimeter; p <= perimeter; p += step) {
      addPicket(p, -perimeter); // Back fence
      addPicket(-perimeter, p); // Left fence
      addPicket(perimeter, p);  // Right fence
      if (p < -6 || p > 6) {
        addPicket(p, perimeter); // Front fence leaving gate open
      }
    }

    // Gate posts (heavy wooden strainer posts)
    const strainerGeo = new THREE.CylinderGeometry(0.18, 0.2, 1.8, 8);
    const strainerMat = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.9 });
    [-6, 6].forEach(x => {
      const post = new THREE.Mesh(strainerGeo, strainerMat);
      post.position.set(x, this.getHeightAt(x, perimeter) + 0.9, perimeter);
      post.castShadow = true;
      fenceGroup.add(post);
    });

    this.scene.add(fenceGroup);
  }

  createTreesAndLogs() {
    const treeGroup = new THREE.Group();

    // Box Gum / River Red Gum positions
    const treeCoords = [
      { x: -18, z: -25 },
      { x: -32, z: -10 },
      { x: 15, z: -30 },
      { x: 28, z: 12 },
      { x: 35, z: -18 },
      { x: -12, z: 22 }
    ];

    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 4.5, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e685f, roughness: 0.9 }); // Mottled gum bark
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x3d5438, roughness: 0.85, flatShading: true }); // Olive gum leaves

    treeCoords.forEach(pos => {
      const y = this.getHeightAt(pos.x, pos.z);
      const tree = new THREE.Group();

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(0, 2.25, 0);
      trunk.castShadow = true;
      tree.add(trunk);

      // Low-poly canopy clusters
      const canopy1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 1), foliageMat);
      canopy1.position.set(0, 4.5, 0);
      canopy1.castShadow = true;
      tree.add(canopy1);

      const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 1), foliageMat);
      canopy2.position.set(1.2, 5.2, -0.6);
      canopy2.castShadow = true;
      tree.add(canopy2);

      tree.position.set(pos.x, y, pos.z);
      treeGroup.add(tree);
    });

    // Fallen hollow logs (BAM plot habitat attributes)
    const logGeo = new THREE.CylinderGeometry(0.25, 0.3, 4, 6);
    const logMat = new THREE.MeshStandardMaterial({ color: 0x3d2d1f, roughness: 0.95 });
    const logCoords = [
      { x: -10, z: -15, rot: 0.6 },
      { x: 20, z: -5, rot: -1.2 },
      { x: -28, z: 15, rot: 2.1 }
    ];

    logCoords.forEach(l => {
      const log = new THREE.Mesh(logGeo, logMat);
      const y = this.getHeightAt(l.x, l.z);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = l.rot;
      log.position.set(l.x, y + 0.25, l.z);
      log.castShadow = true;
      treeGroup.add(log);
    });

    this.scene.add(treeGroup);
  }

  createRegulatorHilux() {
    // The NSW Government Compliance Vehicle parked at the front gate
    const hilux = new THREE.Group();

    // Body cabin
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3 }); // White fleet paint
    const bodyGeo = new THREE.BoxGeometry(2.1, 1.1, 4.8);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.9, 0);
    body.castShadow = true;
    hilux.add(body);

    // Cab roof
    const cabGeo = new THREE.BoxGeometry(2.0, 0.85, 2.2);
    const cab = new THREE.Mesh(cabGeo, bodyMat);
    cab.position.set(0, 1.8, -0.2);
    cab.castShadow = true;
    hilux.add(cab);

    // Windshield (dark glass)
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.1 });
    const glassGeo = new THREE.BoxGeometry(1.9, 0.7, 0.1);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.8, 0.92);
    hilux.add(glass);

    // Bullbar
    const barMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.6 });
    const barGeo = new THREE.BoxGeometry(2.1, 0.6, 0.2);
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(0, 0.8, 2.5);
    hilux.add(bar);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const wheelPositions = [
      [-1.05, 0.42, 1.4],
      [1.05, 0.42, 1.4],
      [-1.05, 0.42, -1.4],
      [1.05, 0.42, -1.4]
    ];
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      hilux.add(wheel);
    });

    // Amber roof beacon (The Regulator is watching!)
    const beaconGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.15, 8);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 2.3, -0.2);
    hilux.add(beacon);

    // Flashing point light on beacon
    this.amberLight = new THREE.PointLight(0xf59e0b, 1.5, 12);
    this.amberLight.position.set(0, 2.5, -0.2);
    hilux.add(this.amberLight);

    // Position Hilux outside the front boundary gate
    const gateZ = 52;
    const gateX = 1.5;
    hilux.position.set(gateX, this.getHeightAt(gateX, gateZ), gateZ);
    hilux.rotation.y = Math.PI * 0.95; // Pointing towards paddock gate
    this.scene.add(hilux);
  }

  update(time) {
    // Pulse the regulator beacon light
    if (this.amberLight) {
      this.amberLight.intensity = (Math.sin(time * 8) > 0) ? 2.5 : 0.2;
    }
  }
}
