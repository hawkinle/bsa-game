import * as THREE from '../../vendor/three.module.js';

/**
 * Interactive ecological targets in the paddock:
 * 1. Declared Priority Weeds (African Boxthorn & Coolatai Grass)
 * 2. Feral Pig Silo-Mesh Box Trap (in the creek gully)
 * 3. Permanent Photo-Point Monitoring Pickets (PP-01 & PP-02)
 */
export class Interactables {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.weeds = [];
    this.photoPoints = [];
    this.pigTrap = null;
    this.interactableMeshes = [];

    this.init();
  }

  init() {
    this.spawnWeeds();
    this.spawnPigTrap();
    this.spawnPhotoPoints();
  }

  reset() {
    // Remove existing meshes
    this.weeds.forEach(w => this.scene.remove(w.group));
    this.photoPoints.forEach(p => this.scene.remove(p.group));
    if (this.pigTrap) this.scene.remove(this.pigTrap.group);

    this.weeds = [];
    this.photoPoints = [];
    this.pigTrap = null;
    this.interactableMeshes = [];

    this.init();
  }

  spawnWeeds() {
    const weedConfigs = [
      { id: 'w1', type: 'African Boxthorn', x: -8, z: 12, hp: 2 },
      { id: 'w2', type: 'African Boxthorn', x: 14, z: 18, hp: 2 },
      { id: 'w3', type: 'Coolatai Grass', x: 6, z: -8, hp: 1 },
      { id: 'w4', type: 'African Boxthorn', x: -16, z: -6, hp: 2 },
      { id: 'w5', type: 'Coolatai Grass', x: 22, z: -18, hp: 1 },
      { id: 'w6', type: 'Coolatai Grass', x: -5, z: -28, hp: 1 }
    ];

    weedConfigs.forEach(cfg => {
      const group = new THREE.Group();
      const y = this.world.getHeightAt(cfg.x, cfg.z);

      if (cfg.type === 'African Boxthorn') {
        // Spiky tangled woody shrub with red berries
        const bushMat = new THREE.MeshStandardMaterial({
          color: 0x2d4c1e,
          roughness: 0.85,
          flatShading: true
        });
        const core = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 1), bushMat);
        core.position.y = 0.8;
        core.castShadow = true;
        group.add(core);

        const lobe = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 1), bushMat);
        lobe.position.set(0.6, 0.6, 0.4);
        lobe.castShadow = true;
        group.add(lobe);

        // Bright red/orange noxious berries so player can spot them
        const berryMat = new THREE.MeshStandardMaterial({
          color: 0xdc2626,
          emissive: 0x7f1d1d,
          emissiveIntensity: 0.4
        });
        for (let i = 0; i < 6; i++) {
          const berry = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), berryMat);
          const angle = (i / 6) * Math.PI * 2;
          berry.position.set(Math.cos(angle) * 0.85, 0.7 + (i % 2) * 0.3, Math.sin(angle) * 0.85);
          group.add(berry);
        }
      } else {
        // Coolatai Grass: tall invasive purple-plumed tussock clump
        const stalkMat = new THREE.MeshStandardMaterial({
          color: 0x6b8e23,
          roughness: 0.8,
          flatShading: true
        });
        const plumeMat = new THREE.MeshStandardMaterial({
          color: 0x9333ea, // Distinctive purplish invasive seed heads
          roughness: 0.7
        });

        for (let i = 0; i < 5; i++) {
          const stalk = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.3, 5), stalkMat);
          stalk.position.set((Math.random() - 0.5) * 0.6, 0.65, (Math.random() - 0.5) * 0.6);
          stalk.rotation.z = (Math.random() - 0.5) * 0.25;
          stalk.castShadow = true;
          group.add(stalk);

          const plume = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.4, 5), plumeMat);
          plume.position.set(stalk.position.x, 1.3, stalk.position.z);
          group.add(plume);
        }
      }

      // Vertical survey pole & floating beacon diamond above weed so it's easy to spot from afar
      const beaconGeo = new THREE.OctahedronGeometry(0.28, 0);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = 2.4;
      group.add(beacon);

      // Floating marker ring around weed base
      const ringGeo = new THREE.RingGeometry(0.9, 1.15, 20);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        side: THREE.DoubleSide
      });
      const marker = new THREE.Mesh(ringGeo, ringMat);
      marker.position.y = 0.08;
      group.add(marker);

      // Hitbox for easy raycasting
      const hitboxGeo = new THREE.CylinderGeometry(1.3, 1.3, 2.2, 8);
      const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
      hitbox.position.y = 1.1;
      group.add(hitbox);

      group.position.set(cfg.x, y, cfg.z);
      this.scene.add(group);

      const weedObj = {
        id: cfg.id,
        category: 'weed',
        species: cfg.type,
        hp: cfg.hp,
        maxHp: cfg.hp,
        cleared: false,
        group,
        beacon,
        marker,
        hitbox
      };

      hitbox.userData = { interactable: weedObj };
      this.weeds.push(weedObj);
      this.interactableMeshes.push(hitbox);
    });
  }

  spawnPigTrap() {
    // Placed in the western creek gully (x = -25, z = 4)
    const tx = -25;
    const tz = 4;
    const ty = this.world.getHeightAt(tx, tz);

    const group = new THREE.Group();

    // Silo mesh cage panels (wireframe cylinder / octagonal enclosure)
    const cageGeo = new THREE.CylinderGeometry(2.2, 2.2, 1.5, 8, 2, true);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x71717a,
      metalness: 0.7,
      roughness: 0.4,
      wireframe: true
    });
    const cage = new THREE.Mesh(cageGeo, cageMat);
    cage.position.y = 0.75;
    group.add(cage);

    // Corner steel star pickets holding the trap
    const postGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x18181b });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(Math.cos(a) * 2.2, 0.9, Math.sin(a) * 2.2);
      post.castShadow = true;
      group.add(post);
    }

    // Trap drop-gate frame on the front
    const gateFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.6, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 })
    );
    gateFrame.position.set(0, 1.1, 2.2);
    group.add(gateFrame);

    // Pig rooting mud patches around the creek trap
    const mudGeo = new THREE.CircleGeometry(3.2, 12);
    mudGeo.rotateX(-Math.PI / 2);
    const mudMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 });
    const mud = new THREE.Mesh(mudGeo, mudMat);
    mud.position.y = 0.04;
    group.add(mud);

    // Corn bait pile (initially hidden until baited)
    const cornGeo = new THREE.ConeGeometry(0.65, 0.35, 10);
    const cornMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.25,
      roughness: 0.6
    });
    const cornPile = new THREE.Mesh(cornGeo, cornMat);
    cornPile.position.set(0, 0.18, 0);
    cornPile.visible = false;
    group.add(cornPile);

    // Hitbox for trap interaction
    const hitbox = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.6, 2.2, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = 1.1;
    group.add(hitbox);

    group.position.set(tx, ty, tz);
    this.scene.add(group);

    this.pigTrap = {
      id: 'trap-1',
      category: 'trap',
      name: 'Creek Gully Silo-Mesh Pig Trap',
      baited: false,
      group,
      cornPile,
      gateFrame,
      hitbox
    };

    hitbox.userData = { interactable: this.pigTrap };
    this.interactableMeshes.push(hitbox);
  }

  spawnPhotoPoints() {
    const ppConfigs = [
      { id: 'PP-01', name: 'Photo-Point PP-01 (Box Gum Woodland)', x: 12, z: -12 },
      { id: 'PP-02', name: 'Photo-Point PP-02 (Riparian Creek Flat)', x: -15, z: 18 }
    ];

    ppConfigs.forEach(cfg => {
      const group = new THREE.Group();
      const y = this.world.getHeightAt(cfg.x, cfg.z);

      // Reference star picket
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.65, 6),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5 })
      );
      post.position.y = 0.825;
      post.castShadow = true;
      group.add(post);

      // High-vis survey cap (cyan/blue to distinguish from boundary fence)
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.2, 8),
        new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x0891b2,
          emissiveIntensity: 0.5
        })
      );
      cap.position.y = 1.65;
      group.add(cap);

      // Metal BCT Photo-Point placard plate
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.35, 0.04),
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          roughness: 0.4
        })
      );
      plate.position.set(0, 1.25, 0.06);
      group.add(plate);

      // Ground survey ring
      const ringGeo = new THREE.RingGeometry(0.8, 0.95, 24);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.06;
      group.add(ring);

      // Hitbox for camera framing
      const hitbox = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 2.5, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitbox.position.y = 1.25;
      group.add(hitbox);

      group.position.set(cfg.x, y, cfg.z);
      this.scene.add(group);

      const ppObj = {
        id: cfg.id,
        category: 'photopoint',
        name: cfg.name,
        captured: false,
        group,
        cap,
        ring,
        hitbox
      };

      hitbox.userData = { interactable: ppObj };
      this.photoPoints.push(ppObj);
      this.interactableMeshes.push(hitbox);
    });
  }

  damageWeed(weed, damageAmount, mode = 'chop') {
    if (weed.cleared) return false;

    weed.hp -= damageAmount;
    // Visual recoil / scale shrink
    weed.group.scale.multiplyScalar(0.82);
    weed.group.rotation.z = (Math.random() - 0.5) * 0.3;

    if (weed.hp <= 0) {
      weed.cleared = true;
      if (weed.beacon) weed.beacon.visible = false;
      if (weed.marker) weed.marker.material.color.setHex(0x22c55e);
      // Leave only a flat mulched/sprayed stump
      weed.group.scale.set(0.6, 0.12, 0.6);
      weed.group.position.y = this.world.getHeightAt(weed.group.position.x, weed.group.position.z);
      return true; // Eradicated!
    }
    return false;
  }

  baitPigTrap() {
    if (!this.pigTrap || this.pigTrap.baited) return false;
    this.pigTrap.baited = true;
    this.pigTrap.cornPile.visible = true;
    // Lower the drop gate slightly to show it's armed & set
    this.pigTrap.gateFrame.position.y = 0.85;
    this.pigTrap.gateFrame.material.color.setHex(0x16a34a);
    return true;
  }

  capturePhotoPoint(pp) {
    if (pp.captured) return false;
    pp.captured = true;
    pp.cap.material.color.setHex(0x22c55e);
    pp.cap.material.emissive.setHex(0x15803d);
    pp.ring.material.color.setHex(0x22c55e);
    return true;
  }
}
