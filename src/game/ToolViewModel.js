import * as THREE from '../../vendor/three.module.js';

/**
 * First-person viewmodels for the 4 landholder tools:
 * 1. Mattock / Chip Hoe
 * 2. Knapsack SprayerWand
 * 3. Fermented Corn Bait Bucket
 * 4. Monitoring Camera / GPS unit
 */
export class ToolViewModel {
  constructor(camera) {
    this.camera = camera;
    this.root = new THREE.Group();
    this.camera.add(this.root);

    this.activeTool = 'mattock';
    this.swingPhase = 0;
    this.isSwinging = false;
    this.models = {};

    this.buildModels();
    this.setTool('mattock');
  }

  buildModels() {
    // 1. Mattock / Chip Hoe
    const mattock = new THREE.Group();
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.026, 0.85, 8),
      new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 })
    );
    handle.rotation.x = Math.PI * 0.35;
    mattock.add(handle);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.32, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.7, roughness: 0.3 })
    );
    head.position.set(0, 0.25, -0.32);
    head.rotation.x = Math.PI * 0.35;
    mattock.add(head);

    mattock.position.set(0.35, -0.32, -0.55);
    this.root.add(mattock);
    this.models.mattock = mattock;

    // 2. Knapsack Sprayer Lance
    const knapsack = new THREE.Group();
    const wand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.015, 0.9, 8),
      new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.8, roughness: 0.2 })
    );
    wand.rotation.x = Math.PI * 0.42;
    knapsack.add(wand);

    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.14, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 })
    );
    grip.position.set(0, -0.05, 0.15);
    knapsack.add(grip);

    const nozzle = new THREE.Mesh(
      new THREE.ConeGeometry(0.028, 0.06, 8),
      new THREE.MeshStandardMaterial({ color: 0xeab308 })
    );
    nozzle.position.set(0, 0.12, -0.42);
    nozzle.rotation.x = -Math.PI * 0.5;
    knapsack.add(nozzle);

    knapsack.position.set(0.32, -0.28, -0.55);
    this.root.add(knapsack);
    this.models.knapsack = knapsack;

    // 3. Fermented Corn Bait Bucket
    const bait = new THREE.Group();
    const bucket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.11, 0.26, 12),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
    );
    BaitGrain(bucket);
    bait.add(bucket);

    function BaitGrain(parent) {
      const grain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.04, 10),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.8 })
      );
      grain.position.y = 0.12;
      parent.add(grain);
    }

    bait.position.set(0.32, -0.32, -0.5);
    this.root.add(bait);
    this.models.bait = bait;

    // 4. Monitoring Camera / Rugged GPS
    const cameraTool = new THREE.Group();
    const camBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.14, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 })
    );
    cameraTool.add(camBody);

    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.08, 12),
      new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.8 })
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 0, -0.08);
    cameraTool.add(lens);

    cameraTool.position.set(0.28, -0.25, -0.45);
    this.root.add(cameraTool);
    this.models.camera = cameraTool;
  }

  setTool(toolName) {
    this.activeTool = toolName;
    Object.keys(this.models).forEach(k => {
      this.models[k].visible = (k === toolName);
    });
  }

  triggerUseAnimation() {
    this.isSwinging = true;
    this.swingPhase = 0;
  }

  update(dt, isMoving, walkTime) {
    this.walkBobTime = isMoving ? walkTime * 8 : 0;
    const model = this.models[this.activeTool];
    if (!model) return;

    // Base bobbing from walking
    const bobX = isMoving ? Math.cos(walkTime * 8) * 0.015 : 0;
    const bobY = isMoving ? Math.abs(Math.sin(walkTime * 8)) * 0.02 : 0;

    if (this.isSwinging) {
      this.swingPhase += dt * 9;
      if (this.swingPhase >= Math.PI) {
        this.isSwinging = false;
        this.swingPhase = 0;
        model.rotation.set(0, 0, 0);
      } else {
        const s = Math.sin(this.swingPhase);
        model.rotation.x = -s * 0.85;
        model.position.z = -0.55 - s * 0.15;
      }
    } else {
      model.rotation.set(0, 0, 0);
      model.position.z = (this.activeTool === 'camera') ? -0.45 : -0.55;
    }

    this.root.position.set(bobX, bobY, 0);
  }
}
