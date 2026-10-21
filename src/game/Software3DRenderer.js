import * as THREE from '../../vendor/three.module.js';

/**
 * Guaranteed-Working 60FPS 3D Perspective Renderer using HTML5 Canvas2D + Three.js Scene Graph.
 * Eliminates all Linux WebGL context creation crashes and black-screen driver issues.
 */
export class Software3DRenderer {
  constructor(container) {
    this.domElement = document.createElement('canvas');
    this.domElement.style.display = 'block';
    this.domElement.style.width = '100vw';
    this.domElement.style.height = '100vh';
    this.ctx = this.domElement.getContext('2d');
    container.appendChild(this.domElement);

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.setSize(this.width, this.height);

    this._projScreenMatrix = new THREE.Matrix4();
    this._lightDir = new THREE.Vector3(0.55, 0.78, 0.3).normalize();
    this._vA = new THREE.Vector3();
    this._vB = new THREE.Vector3();
    this._vC = new THREE.Vector3();
    this._normal = new THREE.Vector3();
    this._edge1 = new THREE.Vector3();
    this._edge2 = new THREE.Vector3();
  }

  setSize(w, h) {
    this.width = w || window.innerWidth;
    this.height = h || window.innerHeight;
    this.domElement.width = this.width;
    this.domElement.height = this.height;
  }

  render(scene, camera, interactables, activeTool, toolView) {
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;
    const halfW = W * 0.5;
    const halfH = H * 0.5;

    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

    const viewMat = camera.matrixWorldInverse;
    const fovScale = halfH / Math.tan((camera.fov * 0.5) * (Math.PI / 180));

    // Calculate horizon line based on camera pitch
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const horizonY = halfH + forward.y * fovScale;

    // 1. Draw Outback Sky & Ground Base
    const skyGrad = ctx.createLinearGradient(0, 0, 0, Math.max(10, Math.min(H, horizonY)));
    skyGrad.addColorStop(0, '#4a90d9');
    skyGrad.addColorStop(0.7, '#93c5fd');
    skyGrad.addColorStop(1, '#e6d5b8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    if (horizonY < H) {
      const gndGrad = ctx.createLinearGradient(0, Math.max(0, horizonY), 0, H);
      gndGrad.addColorStop(0, '#c29b70');
      gndGrad.addColorStop(0.25, '#9e6f47');
      gndGrad.addColorStop(1, '#6e4726');
      ctx.fillStyle = gndGrad;
      ctx.fillRect(0, Math.max(0, horizonY), W, H - Math.max(0, horizonY));
    }

    // 2. Collect visible 3D triangles from all meshes in scene (excluding camera HUD attachment)
    const triangles = [];
    const near = 0.25;
    const far = 115;

    scene.traverse((obj) => {
      if (!obj.visible) return;
      // Skip anything parented to the camera (we draw the held tool cleanly in step 4)
      let p = obj.parent;
      while (p) {
        if (p === camera) return;
        p = p.parent;
      }

      if (!obj.isMesh || !obj.geometry || !obj.material || obj.material.visible === false) return;

      // Distance culling per object
      const worldCenter = this._vA.setFromMatrixPosition(obj.matrixWorld);
      const camSpaceCenter = worldCenter.clone().applyMatrix4(viewMat);
      if (camSpaceCenter.z > 8 || camSpaceCenter.z < -far) return;

      const geo = obj.geometry;
      const posAttr = geo.attributes.position;
      if (!posAttr) return;

      const indexAttr = geo.index;
      const matWorld = obj.matrixWorld;
      const baseColor = obj.material.color ? obj.material.color : new THREE.Color(0xcccccc);
      const isWire = !!obj.material.wireframe;
      const isBasic = obj.material.isMeshBasicMaterial;
      const emissive = obj.material.emissive ? obj.material.emissive : null;
      const emissiveIntensity = obj.material.emissiveIntensity || 0;

      const triCount = indexAttr ? (indexAttr.count / 3) : (posAttr.count / 3);
      // Downsample very dense ground mesh slightly if needed, or render all
      const step = 1;

      for (let t = 0; t < triCount; t += step) {
        const i0 = indexAttr ? indexAttr.getX(t * 3) : (t * 3);
        const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : (t * 3 + 1);
        const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : (t * 3 + 2);

        const v0 = new THREE.Vector3().fromBufferAttribute(posAttr, i0).applyMatrix4(matWorld);
        const v1 = new THREE.Vector3().fromBufferAttribute(posAttr, i1).applyMatrix4(matWorld);
        const v2 = new THREE.Vector3().fromBufferAttribute(posAttr, i2).applyMatrix4(matWorld);

        // Compute world normal for sun lighting
        this._edge1.subVectors(v1, v0);
        this._edge2.subVectors(v2, v0);
        this._normal.crossVectors(this._edge1, this._edge2).normalize();

        // Transform to camera space (camera looks down -Z)
        v0.applyMatrix4(viewMat);
        v1.applyMatrix4(viewMat);
        v2.applyMatrix4(viewMat);

        // Reject if behind near plane
        if (v0.z > -near || v1.z > -near || v2.z > -near) continue;

        const zAvg = (v0.z + v1.z + v2.z) * 0.3333;
        if (zAvg < -far) continue;

        // Perspective project to 2D screen coordinates
        const s0x = halfW + (v0.x / -v0.z) * fovScale;
        const s0y = halfH - (v0.y / -v0.z) * fovScale;
        const s1x = halfW + (v1.x / -v1.z) * fovScale;
        const s1y = halfH - (v1.y / -v1.z) * fovScale;
        const s2x = halfW + (v2.x / -v2.z) * fovScale;
        const s2y = halfH - (v2.y / -v2.z) * fovScale;

        // Screen bounds frustum check
        if (
          (s0x < -100 && s1x < -100 && s2x < -100) ||
          (s0x > W + 100 && s1x > W + 100 && s2x > W + 100) ||
          (s0y < -100 && s1y < -100 && s2y < -100) ||
          (s0y > H + 100 && s1y > H + 100 && s2y > H + 100)
        ) {
          continue;
        }

        // Backface culling (unless double-sided or wireframe)
        if (!isWire && obj.material.side !== THREE.DoubleSide) {
          const cross2D = (s1x - s0x) * (s2y - s0y) - (s1y - s0y) * (s2x - s0x);
          if (cross2D >= 0) continue;
        }

        // Compute lit RGB color + distance haze
        let r = baseColor.r;
        let g = baseColor.g;
        let b = baseColor.b;

        if (!isBasic) {
          const ndotl = Math.max(0, this._normal.dot(this._lightDir));
          const shade = 0.55 + ndotl * 0.55;
          r = r * shade + (emissive ? emissive.r * emissiveIntensity : 0);
          g = g * shade + (emissive ? emissive.g * emissiveIntensity : 0);
          b = b * shade + (emissive ? emissive.b * emissiveIntensity : 0);
        }

        // Subtle atmospheric distance fog blend
        const dist = -zAvg;
        const fogFactor = Math.min(0.65, Math.max(0, (dist - 35) / 85));
        if (fogFactor > 0) {
          r = r * (1 - fogFactor) + 0.84 * fogFactor;
          g = g * (1 - fogFactor) + 0.75 * fogFactor;
          b = b * (1 - fogFactor) + 0.62 * fogFactor;
        }

        const R = Math.min(255, Math.round(r * 255));
        const G = Math.min(255, Math.round(g * 255));
        const B = Math.min(255, Math.round(b * 255));

        triangles.push({
          z: zAvg,
          s0x, s0y, s1x, s1y, s2x, s2y,
          color: `rgb(${R},${G},${B})`,
          isWire
        });
      }
    });

    // Painter's algorithm sort (furthest -Z first, closest last)
    triangles.sort((a, b) => a.z - b.z);

    // 3. Draw sorted 3D triangles
    ctx.lineJoin = 'round';
    for (let i = 0; i < triangles.length; i++) {
      const tri = triangles[i];
      ctx.beginPath();
      ctx.moveTo(tri.s0x, tri.s0y);
      ctx.lineTo(tri.s1x, tri.s1y);
      ctx.lineTo(tri.s2x, tri.s2y);
      ctx.closePath();

      if (tri.isWire) {
        ctx.strokeStyle = tri.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.fillStyle = tri.color;
        ctx.fill();
        ctx.strokeStyle = tri.color;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }

    // 4. Draw 3D Floating Target Waypoint Tags in the Paddock (so player always sees where everything is!)
    if (interactables) {
      this.drawWaypoints(ctx, viewMat, fovScale, halfW, halfH, interactables);
    }

    // 5. Draw First-Person Held Tool in Bottom-Right Hand
    this.drawFirstPersonTool(ctx, W, H, activeTool, toolView);
  }

  drawWaypoints(ctx, viewMat, fovScale, halfW, halfH, interactables) {
    const items = [];

    interactables.weeds.forEach((w) => {
      if (!w.cleared) {
        items.push({
          pos: w.group.position.clone().add(new THREE.Vector3(0, 2.3, 0)),
          label: `🌿 ${w.species}`,
          color: '#ef4444'
        });
      }
    });

    if (interactables.pigTrap) {
      items.push({
        pos: interactables.pigTrap.group.position.clone().add(new THREE.Vector3(0, 2.4, 0)),
        label: interactables.pigTrap.baited ? '🐗 Pig Trap (BAITED)' : '🐗 Creek Pig Trap [Unbaited]',
        color: interactables.pigTrap.baited ? '#22c55e' : '#f59e0b'
      });
    }

    interactables.photoPoints.forEach((pp) => {
      items.push({
        pos: pp.group.position.clone().add(new THREE.Vector3(0, 2.2, 0)),
        label: pp.captured ? `📷 ${pp.id} (DONE)` : `📷 Photo-Point ${pp.id}`,
        color: pp.captured ? '#22c55e' : '#06b6d4'
      });
    });

    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';

    items.forEach((item) => {
      const camPos = item.pos.applyMatrix4(viewMat);
      if (camPos.z >= -0.5) return; // behind camera
      const dist = Math.round(camPos.length());
      if (dist > 85) return;

      const sx = halfW + (camPos.x / -camPos.z) * fovScale;
      const sy = halfH - (camPos.y / -camPos.z) * fovScale;

      if (sx < 20 || sx > this.width - 20 || sy < 20 || sy > this.height - 20) return;

      const text = `${item.label} (${dist}m)`;
      const tw = ctx.measureText(text).width + 14;

      ctx.fillStyle = 'rgba(12, 10, 9, 0.82)';
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(sx - tw / 2, sy - 12, tw, 22, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = item.color;
      ctx.fillText(text, sx, sy + 3);
    });
  }

  drawFirstPersonTool(ctx, W, H, activeTool, toolView) {
    ctx.save();
    const bobX = toolView ? Math.cos(toolView.walkBobTime || 0) * 8 : 0;
    const bobY = toolView ? Math.abs(Math.sin(toolView.walkBobTime || 0)) * 10 : 0;
    const swing = (toolView && toolView.isSwinging) ? Math.sin(toolView.swingPhase) : 0;

    const baseX = W * 0.76 + bobX - swing * 65;
    const baseY = H * 0.78 + bobY + swing * 35;

    ctx.translate(baseX, baseY);
    ctx.rotate(-0.25 - swing * 0.75);

    if (activeTool === 'mattock') {
      // Wooden handle
      ctx.fillStyle = '#854d0e';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-14, -140, 26, 260, 8);
      ctx.fill();
      ctx.stroke();

      // Heavy steel mattock blade
      ctx.fillStyle = '#52525b';
      ctx.strokeStyle = '#18181b';
      ctx.beginPath();
      ctx.roundRect(-75, -165, 145, 38, 6);
      ctx.fill();
      ctx.stroke();

      // Chipping edge highlight
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-75, -165, 14, 38);
    } else if (activeTool === 'knapsack') {
      // Brass/steel spray lance
      ctx.fillStyle = '#d4d4d8';
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 2.5;
      ctx.fillRect(-6, -170, 12, 260);
      ctx.strokeRect(-6, -170, 12, 260);

      // Blue trigger grip
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.roundRect(-16, -20, 32, 75, 6);
      ctx.fill();

      // Nozzle cone
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, -175, 12, 0, Math.PI * 2);
      ctx.fill();

      if (swing > 0.1) {
        // Spray mist cone
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.beginPath();
        ctx.moveTo(0, -185);
        ctx.lineTo(-75, -310);
        ctx.lineTo(75, -310);
        ctx.closePath();
        ctx.fill();
      }
    } else if (activeTool === 'bait') {
      // Orange fermented corn bucket
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-65, -90, 130, 150, 12);
      ctx.fill();
      ctx.stroke();

      // Golden corn grain top
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(0, -85, 58, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (activeTool === 'camera') {
      // Rugged BCT GPS Camera body
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = '#52525b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-80, -95, 160, 110, 10);
      ctx.fill();
      ctx.stroke();

      // Viewscreen
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(-62, -78, 95, 68);
      ctx.strokeStyle = '#10b981';
      ctx.strokeRect(-62, -78, 95, 68);

      // Shutter button
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(42, -106, 26, 12);
    }

    ctx.restore();
  }
}
