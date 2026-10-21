import * as THREE from '../vendor/three.module.js?v=5';
import { World } from './game/World.js?v=5';
import { Interactables } from './game/Interactables.js?v=5';
import { ToolViewModel } from './game/ToolViewModel.js?v=5';
import { Software3DRenderer } from './game/Software3DRenderer.js?v=5';
import { audio } from './game/AudioManager.js?v=5';
import { campaignState } from './state/CampaignState.js?v=5';
import { MarketEngine } from './state/MarketEngine.js?v=5';
import { CrisisManager } from './state/CrisisManager.js?v=5';
import { OfficeDeskUI } from './ui/OfficeDeskUI.js?v=5';
import { MinigamesUI } from './ui/MinigamesUI.js?v=5';

class BSASimulatorGame {
  constructor() {
    window.__bsaGameInstance = this;
    this.container = document.getElementById('game-container');

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 200);
    this.scene.add(this.camera);

    // Guaranteed-Working 3D Perspective Canvas2D Renderer (immune to WebGL context/driver crashes)
    this.renderer = new Software3DRenderer(this.container);
    this.renderer.domElement.tabIndex = 1;

    // World & Interactive Paddock Objects
    this.world = new World(this.scene);
    this.interactables = new Interactables(this.scene, this.world);
    this.toolView = new ToolViewModel(this.camera);

    // BSA 5-Year Campaign, Market Engine, & Crisis Manager
    this.campaignState = campaignState;
    this.marketEngine = new MarketEngine(this.campaignState);
    this.crisisManager = new CrisisManager(this.campaignState);

    // Gamified Office Desk & Minigames UI Overlays
    this.officeDeskUI = new OfficeDeskUI(this, this.campaignState, this.marketEngine);
    this.minigamesUI = new MinigamesUI(this);

    // Controls state
    this.isPlaying = true;
    this.isDraggingLook = false;
    this.dragMoved = false;
    this.prevMouse = { x: 0, y: 0 };
    this.keys = {
      w: false, a: false, s: false, d: false,
      up: false, down: false, left: false, right: false,
      q: false, e: false, shift: false
    };
    this.walkTime = 0;
    this.lastStepTime = 0;

    // Player state: Start inside front paddock gate facing north into the paddock
    this.playerPos = new THREE.Vector3(0, 1.7, 34);
    this.camera.position.copy(this.playerPos);
    this.activeTool = 'mattock';
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 9.0; // Generous interaction reach

    // BSA Compliance & Season State
    this.seasonSecondsRemaining = 225; // 03:45 countdown
    this.isClipboardOpen = false;
    this.isAuditOpen = false;
    this.hoveredTarget = null;

    this.bindEvents();
    this.updateClipboardUI();

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  startFromUI() {
    this.isPlaying = true;
    audio.init();
    const blocker = document.getElementById('blocker');
    if (blocker) {
      blocker.classList.add('hidden');
      blocker.style.display = 'none';
    }
    this.closeClipboard();
    window.focus();
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.focus();
    }
    this.showNotification('Paddock Active — Use WASD or Arrow Keys to walk, click targets or tools!', 'emerald');
  }

  bindEvents() {
    const blocker = document.getElementById('blocker');
    const btnStart = document.getElementById('btn-start');
    const btnToggleClip = document.getElementById('btn-toggle-clipboard');
    const btnToggleOffice = document.getElementById('btn-toggle-office');
    const btnCloseClip = document.getElementById('btn-close-clipboard');
    const btnCallAudit = document.getElementById('btn-call-audit');
    const btnAuditNext = document.getElementById('btn-audit-next');
    const btnUseActiveTool = document.getElementById('btn-use-active-tool');

    if (btnStart) {
      btnStart.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startFromUI();
      });
    }

    if (blocker) {
      blocker.addEventListener('click', () => {
        this.startFromUI();
      });
    }

    // Keyboard input: WASD or Up/Down to walk, Left/Right or Q/E to turn
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      const key = (e.key || '').toLowerCase();

      // Auto-dismiss start screen if user presses any game key
      const blockerEl = document.getElementById('blocker');
      if (blockerEl && blockerEl.style.display !== 'none' && !blockerEl.classList.contains('hidden')) {
        this.startFromUI();
      }

      if (code === 'KeyW' || key === 'w') this.keys.w = true;
      if (code === 'KeyS' || key === 's') this.keys.s = true;
      if (code === 'KeyA' || key === 'a') this.keys.a = true;
      if (code === 'KeyD' || key === 'd') this.keys.d = true;
      if (code === 'ArrowUp') { e.preventDefault(); this.keys.up = true; }
      if (code === 'ArrowDown') { e.preventDefault(); this.keys.down = true; }
      if (code === 'ArrowLeft') { e.preventDefault(); this.keys.left = true; }
      if (code === 'ArrowRight') { e.preventDefault(); this.keys.right = true; }
      if (code === 'KeyQ' || key === 'q') this.keys.q = true;
      if (code === 'KeyE' || key === 'e') this.keys.e = true;
      if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') this.keys.shift = true;

      // Space or Enter uses active tool
      if (code === 'Space' || code === 'Enter') {
        if (!this.isClipboardOpen && !this.isAuditOpen) {
          e.preventDefault();
          this.useActiveTool();
        }
      }

      // Tool switching 1 - 4
      if (code === 'Digit1' || key === '1') {
        this.selectTool('mattock');
        this.showNotification('Equipped [1] Mattock / Chip Hoe', 'amber');
      }
      if (code === 'Digit2' || key === '2') {
        this.selectTool('knapsack');
        this.showNotification('Equipped [2] 15L Knapsack Sprayer', 'amber');
      }
      if (code === 'Digit3' || key === '3') {
        this.selectTool('bait');
        this.showNotification('Equipped [3] Fermented Corn Bait', 'amber');
      }
      if (code === 'Digit4' || key === '4') {
        this.selectTool('camera');
        this.showNotification('Equipped [4] Monitoring Camera & GPS', 'amber');
      }

      // Clipboard toggle (Tab) & Office toggle (O)
      if (code === 'KeyO' || key === 'o') {
        e.preventDefault();
        this.toggleOffice();
      }

      if (code === 'Tab') {
        e.preventDefault();
        if (!this.isAuditOpen) {
          this.toggleClipboard();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      const key = (e.key || '').toLowerCase();
      if (code === 'KeyW' || key === 'w') this.keys.w = false;
      if (code === 'KeyS' || key === 's') this.keys.s = false;
      if (code === 'KeyA' || key === 'a') this.keys.a = false;
      if (code === 'KeyD' || key === 'd') this.keys.d = false;
      if (code === 'ArrowUp') this.keys.up = false;
      if (code === 'ArrowDown') this.keys.down = false;
      if (code === 'ArrowLeft') this.keys.left = false;
      if (code === 'ArrowRight') this.keys.right = false;
      if (code === 'KeyQ' || key === 'q') this.keys.q = false;
      if (code === 'KeyE' || key === 'e') this.keys.e = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') this.keys.shift = false;
    });

    // Toolbelt HUD buttons: clicking a tool button equips AND uses/swings it!
    document.querySelectorAll('.tool-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const t = btn.getAttribute('data-tool');
        this.selectTool(t);
        this.findNearestTargetIfNoneHovered();
        this.useActiveTool();
      });
    });

    // On-screen walk/turn buttons (hold or click)
    document.querySelectorAll('.move-btn').forEach((btn) => {
      const dir = btn.getAttribute('data-move');
      const setMove = (state) => {
        if (dir === 'forward') this.keys.up = state;
        if (dir === 'back') this.keys.down = state;
        if (dir === 'left') this.keys.left = state;
        if (dir === 'right') this.keys.right = state;
      };
      btn.addEventListener('mousedown', (e) => { e.stopPropagation(); setMove(true); });
      btn.addEventListener('mouseup', (e) => { e.stopPropagation(); setMove(false); });
      btn.addEventListener('mouseleave', () => setMove(false));
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Also nudge a step on single click
        this.nudgeMove(dir);
      });
    });

    if (btnUseActiveTool) {
      btnUseActiveTool.addEventListener('click', (e) => {
        e.stopPropagation();
        this.findNearestTargetIfNoneHovered();
        this.useActiveTool();
      });
    }

    // Mouse drag-to-look & click-to-interact on the 3D canvas
    this.renderer.domElement.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (this.isClipboardOpen || this.isAuditOpen) return;
      this.isDraggingLook = true;
      this.dragMoved = false;
      this.prevMouse.x = e.clientX;
      this.prevMouse.y = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isClipboardOpen && !this.isAuditOpen) {
        this.updateMouseHoverRaycast(e.clientX, e.clientY);
      }
      if (this.isDraggingLook && !this.isClipboardOpen && !this.isAuditOpen) {
        const dx = e.clientX - this.prevMouse.x;
        const dy = e.clientY - this.prevMouse.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this.dragMoved = true;
        this.prevMouse.x = e.clientX;
        this.prevMouse.y = e.clientY;

        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(this.camera.quaternion);
        euler.y -= dx * 0.005;
        euler.x = Math.max(-Math.PI / 2.6, Math.min(Math.PI / 2.6, euler.x - dy * 0.004));
        this.camera.quaternion.setFromEuler(euler);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (this.isDraggingLook) {
        this.isDraggingLook = false;
        if (!this.dragMoved && !this.isClipboardOpen && !this.isAuditOpen) {
          this.updateMouseHoverRaycast(e.clientX, e.clientY);
          this.useActiveTool();
        }
      }
    });

    // Clipboard & Audit buttons
    if (btnToggleOffice) {
      btnToggleOffice.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleOffice();
      });
    }

    btnToggleClip.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleClipboard();
    });

    btnCloseClip.addEventListener('click', () => {
      this.closeClipboard();
    });

    btnCallAudit.addEventListener('click', () => {
      this.triggerRegulatorAudit();
    });

    btnAuditNext.addEventListener('click', () => {
      this.resetSeason();
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  nudgeMove(dir) {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(this.camera.quaternion);
    if (dir === 'left') euler.y += 0.25;
    if (dir === 'right') euler.y -= 0.25;
    this.camera.quaternion.setFromEuler(euler);

    if (dir === 'forward' || dir === 'back') {
      const sign = dir === 'forward' ? 1 : -1;
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);
      camDir.y = 0;
      if (camDir.lengthSq() > 0.0001) camDir.normalize();
      this.camera.position.addScaledVector(camDir, sign * 2.2);
      const limit = 46.5;
      this.camera.position.x = Math.max(-limit, Math.min(limit, this.camera.position.x));
      this.camera.position.z = Math.max(-limit, Math.min(limit, this.camera.position.z));
      this.walkTime += 0.35;
      audio.playFootstep();
    }
  }

  selectTool(toolName) {
    this.activeTool = toolName;
    this.toolView.setTool(toolName);

    document.querySelectorAll('.tool-btn').forEach((btn) => {
      if (btn.getAttribute('data-tool') === toolName) {
        btn.classList.add('active');
        btn.classList.remove('opacity-60');
      } else {
        btn.classList.remove('active');
        btn.classList.add('opacity-60');
      }
    });

    const camOverlay = document.getElementById('camera-overlay');
    if (toolName === 'camera') {
      camOverlay.classList.remove('hidden');
      this.raycaster.far = 14.0;
    } else {
      camOverlay.classList.add('hidden');
      this.raycaster.far = 9.0;
    }
  }

  findNearestTargetIfNoneHovered() {
    if (this.hoveredTarget) return;
    // Check if player is within range of any matching interactable
    const p = this.camera.position;
    let best = null;
    let bestDist = 11.0;

    this.interactables.weeds.forEach((w) => {
      if (!w.cleared) {
        const d = p.distanceTo(w.group.position);
        if (d < bestDist) { bestDist = d; best = w; }
      }
    });

    if (this.interactables.pigTrap && !this.interactables.pigTrap.baited) {
      const d = p.distanceTo(this.interactables.pigTrap.group.position);
      if (d < bestDist) { bestDist = d; best = this.interactables.pigTrap; }
    }

    this.interactables.photoPoints.forEach((pp) => {
      if (!pp.captured) {
        const d = p.distanceTo(pp.group.position);
        if (d < 15.0 && (this.activeTool === 'camera' || d < bestDist)) {
          bestDist = d;
          best = pp;
        }
      }
    });

    if (best) this.hoveredTarget = best;
  }

  useActiveTool() {
    this.toolView.triggerUseAnimation();

    if (this.activeTool === 'mattock') {
      audio.playChop();
    } else if (this.activeTool === 'knapsack') {
      audio.playSpray();
    } else if (this.activeTool === 'bait') {
      audio.playBait();
    } else if (this.activeTool === 'camera') {
      audio.playShutter();
      this.flashScreen();
    }

    this.findNearestTargetIfNoneHovered();

    if (!this.hoveredTarget) {
      const toolLabels = {
        mattock: 'Swung Mattock — Walk closer to a red Weed beacon to chip it!',
        knapsack: 'Sprayed Glyphosate — Walk closer to a priority Weed to spot-spray!',
        bait: 'Tossed Corn — Walk down to the Creek Pig Trap (west gully) to bait it!',
        camera: 'Snapped Photo — Walk closer to Photo-Point PP-01 or PP-02 to log record!'
      };
      this.showNotification(toolLabels[this.activeTool], 'amber');
      return;
    }

    const target = this.hoveredTarget;

    // 1. Weed Control (Mattock or Knapsack Sprayer)
    if (target.category === 'weed') {
      if (this.activeTool === 'mattock' || this.activeTool === 'knapsack') {
        if (target.cleared) {
          this.showNotification(`${target.species} already eradicated.`, 'amber');
          return;
        }
        const dmg = (this.activeTool === 'mattock') ? 1 : 2;
        const eradicated = this.interactables.damageWeed(target, dmg, this.activeTool);
        this.shakeScreen();

        if (eradicated) {
          audio.playNotification();
          if (this.minigamesUI && typeof this.minigamesUI.triggerRootCrackCombo === 'function') {
            this.minigamesUI.triggerRootCrackCombo();
          }
          const clearedCount = this.interactables.weeds.filter(w => w.cleared).length;
          this.showNotification(
            `💥 ROOT CRACK! Eradicated ${target.species} (+100 BAM PTS)`,
            'emerald'
          );
          this.updateClipboardUI();
        } else {
          this.showNotification(`Chipped ${target.species} — strike once more to remove root crown!`, 'amber');
        }
      } else {
        this.showNotification(`Switch to [1] Mattock or [2] Knapsack Sprayer to clear ${target.species}!`, 'rose');
      }
    }

    // 2. Feral Pig Trap Baiting
    else if (target.category === 'trap') {
      if (this.activeTool === 'bait') {
        if (target.baited) {
          this.showNotification('Creek Pig Trap is already baited and armed.', 'amber');
          return;
        }
        const success = this.interactables.baitPigTrap();
        if (success) {
          audio.playNotification();
          this.showNotification('TRAP BAITED & ARMED: Fermented corn laid in creek silo-mesh trap!', 'emerald');
          this.updateClipboardUI();
        }
      } else {
        this.showNotification('Switch to [3] Fermented Corn to bait & arm the Feral Pig Trap!', 'rose');
      }
    }

    // 3. Permanent Photo-Point Monitoring
    else if (target.category === 'photopoint') {
      if (this.activeTool === 'camera') {
        if (target.captured) {
          this.showNotification(`${target.id} annual photolog already recorded.`, 'amber');
          return;
        }
        const captured = this.interactables.capturePhotoPoint(target);
        if (captured) {
          audio.playNotification();
          const doneCount = this.interactables.photoPoints.filter(p => p.captured).length;
          this.showNotification(
            `PHOTOLOG SAVED: ${target.id} GPS & Bearing Verified (${doneCount}/${this.interactables.photoPoints.length})`,
            'emerald'
          );
          this.updateClipboardUI();
        }
      } else {
        this.showNotification(`Switch to [4] Monitoring Camera to capture ${target.id} photolog!`, 'rose');
      }
    }
  }

  flashScreen() {
    const flash = document.createElement('div');
    flash.className = 'camera-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
  }

  shakeScreen() {
    this.container.classList.remove('screen-shake');
    void this.container.offsetWidth;
    this.container.classList.add('screen-shake');
  }

  showNotification(message) {
    const box = document.getElementById('notification-box');
    const text = document.getElementById('notification-text');
    if (!box || !text) return;
    text.textContent = message;

    box.classList.remove('opacity-0', '-translate-y-4');
    box.classList.add('opacity-100', 'translate-y-0');

    clearTimeout(this.notifyTimeout);
    this.notifyTimeout = setTimeout(() => {
      box.classList.add('opacity-0', '-translate-y-4');
      box.classList.remove('opacity-100', 'translate-y-0');
    }, 3200);
  }

  toggleOffice() {
    if (this.isOfficeOpen) {
      this.closeOffice();
    } else {
      this.openOffice();
    }
  }

  openOffice() {
    this.isOfficeOpen = true;
    this.closeClipboard();
    this.officeDeskUI.open();
  }

  closeOffice() {
    this.isOfficeOpen = false;
    this.officeDeskUI.close();
  }

  toggleClipboard() {
    if (this.isClipboardOpen) {
      this.closeClipboard();
    } else {
      this.openClipboard();
    }
  }

  openClipboard() {
    this.isClipboardOpen = true;
    this.updateClipboardUI();
    const clip = document.getElementById('clipboard-modal');
    clip.classList.remove('hidden');
    clip.style.display = 'flex';
    const blocker = document.getElementById('blocker');
    blocker.classList.add('hidden');
    blocker.style.display = 'none';
  }

  closeClipboard() {
    this.isClipboardOpen = false;
    const clip = document.getElementById('clipboard-modal');
    clip.classList.add('hidden');
    clip.style.display = 'none';
  }

  updateClipboardUI() {
    const weedsCleared = this.interactables.weeds.filter(w => w.cleared).length;
    const totalWeeds = this.interactables.weeds.length;
    const trapBaited = this.interactables.pigTrap?.baited || false;
    const photosCaptured = this.interactables.photoPoints.filter(p => p.captured).length;
    const totalPhotos = this.interactables.photoPoints.length;

    const weedEl = document.getElementById('clip-weeds-status');
    weedEl.textContent = `${weedsCleared} / ${totalWeeds} Cleared`;
    weedEl.className = weedsCleared === totalWeeds
      ? 'inline-block px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-400'
      : 'inline-block px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300';

    const trapEl = document.getElementById('clip-trap-status');
    trapEl.textContent = trapBaited ? 'Baited & Armed' : 'Unbaited (Breach Risk)';
    trapEl.className = trapBaited
      ? 'inline-block px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-400'
      : 'inline-block px-2.5 py-1 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300';

    const photoEl = document.getElementById('clip-photos-status');
    photoEl.textContent = `${photosCaptured} / ${totalPhotos} Captured`;
    photoEl.className = photosCaptured === totalPhotos
      ? 'inline-block px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-400'
      : 'inline-block px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300';
  }

  triggerRegulatorAudit() {
    this.isClipboardOpen = false;
    this.isAuditOpen = true;
    this.closeClipboard();
    const blocker = document.getElementById('blocker');
    blocker.classList.add('hidden');
    blocker.style.display = 'none';

    const weedsCleared = this.interactables.weeds.filter(w => w.cleared).length;
    const totalWeeds = this.interactables.weeds.length;
    const trapBaited = this.interactables.pigTrap?.baited || false;
    const photosCaptured = this.interactables.photoPoints.filter(p => p.captured).length;
    const totalPhotos = this.interactables.photoPoints.length;

    const banner = document.getElementById('audit-banner');
    const title = document.getElementById('audit-verdict-title');
    const subtitle = document.getElementById('audit-verdict-subtitle');
    const findingsList = document.getElementById('audit-findings-list');
    const financialBox = document.getElementById('audit-financial-box');

    findingsList.innerHTML = '';
    let breaches = 0;

    // 1. Weed finding
    const weedItem = document.createElement('div');
    if (weedsCleared === totalWeeds) {
      weedItem.className = 'p-2.5 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-950';
      weedItem.innerHTML = `<strong>[PASS] Priority Weed Suppression:</strong> All ${totalWeeds} mapped clumps of African Boxthorn &amp; Coolatai Grass eradicated below 5% cover threshold.`;
    } else {
      breaches++;
      weedItem.className = 'p-2.5 bg-rose-50 border-l-4 border-rose-600 text-rose-950';
      weedItem.innerHTML = `<strong>[BREACH - Schedule 3.1] Declared Weed Infestation:</strong> Inspector recorded ${totalWeeds - weedsCleared} active stands of seeding African Boxthorn / Coolatai Grass in Zone 1.`;
    }
    findingsList.appendChild(weedItem);

    // 2. Feral Pig Trap finding
    const trapItem = document.createElement('div');
    if (trapBaited) {
      trapItem.className = 'p-2.5 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-950';
      trapItem.innerHTML = `<strong>[PASS] Feral Vertebrate Pest Control:</strong> Creek gully silo-mesh trap verified baited with fermented grain and drop-gate armed.`;
    } else {
      breaches++;
      trapItem.className = 'p-2.5 bg-rose-50 border-l-4 border-rose-600 text-rose-950';
      trapItem.innerHTML = `<strong>[BREACH - Schedule 3.2] Uncontrolled Feral Pig Rooting:</strong> Active <em>Sus scrofa</em> creek disturbance observed; silo-mesh trap left unbaited and inactive.`;
    }
    findingsList.appendChild(trapItem);

    // 3. Photo-point monitoring finding
    const photoItem = document.createElement('div');
    if (photosCaptured === totalPhotos) {
      photoItem.className = 'p-2.5 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-950';
      photoItem.innerHTML = `<strong>[PASS] Ecological Photo-Point Records:</strong> Geotagged permanent photo-point logs PP-01 and PP-02 verified against baseline compass bearings.`;
    } else {
      breaches++;
      photoItem.className = 'p-2.5 bg-rose-50 border-l-4 border-rose-600 text-rose-950';
      photoItem.innerHTML = `<strong>[BREACH - Schedule 4.1] Deficient Monitoring Data:</strong> Missing ${totalPhotos - photosCaptured} mandatory annual photo-point records (PP-01 / PP-02).`;
    }
    findingsList.appendChild(photoItem);

    if (breaches === 0) {
      audio.playAuditSuccess();
      if (this.minigamesUI && typeof this.minigamesUI.slamStamp === 'function') {
        this.minigamesUI.slamStamp('SATISFACTORY COMPLIANCE');
      }
      banner.className = 'p-4 text-center rounded-lg border-2 mb-4 font-sans-ui bg-emerald-100 border-emerald-700 text-emerald-950';
      title.textContent = 'SATISFACTORY COMPLIANCE CONFIRMED';
      subtitle.textContent = 'All Schedule 3 & 4 BSA Management Actions Verified by Senior Inspector M. Henderson';

      financialBox.className = 'p-4 rounded border-2 mb-6 font-mono-tech text-xs bg-emerald-950 text-emerald-200 border-emerald-600';
      financialBox.innerHTML = `
        <div class="font-bold text-sm text-emerald-400 mb-1">✅ BCT TRUST PAYMENT AUTHORISED</div>
        <div>Annual Stewardship Payment Released: <strong>$48,250.00 AUD</strong></div>
        <div>Compliance Rating: <strong>100% (Gold Tier Landholder)</strong></div>
        <div class="mt-1 text-emerald-300/80">Funds have been transferred to your nominated operating account for Year 4 stewardship works.</div>
      `;
    } else if (breaches === 1) {
      audio.playAuditFailure();
      if (this.minigamesUI && typeof this.minigamesUI.slamStamp === 'function') {
        this.minigamesUI.slamStamp('PAYMENT WITHHELD (28-DAY NOTICE)');
      }
      banner.className = 'p-4 text-center rounded-lg border-2 mb-4 font-sans-ui bg-amber-100 border-amber-700 text-amber-950';
      title.textContent = 'TIER 1 BREACH: PAYMENT WITHHELD';
      subtitle.textContent = 'Notice of Deficient Annual Management Performance (1 Non-Compliance Recorded)';

      financialBox.className = 'p-4 rounded border-2 mb-6 font-mono-tech text-xs bg-stone-900 text-amber-300 border-amber-600';
      financialBox.innerHTML = `
        <div class="font-bold text-sm text-amber-400 mb-1">⚠️ ANNUAL PAYMENT FROZEN ($48,250.00 WITHHELD)</div>
        <div>Pursuant to Clause 14.2 of your Biodiversity Stewardship Agreement, BCT has suspended your annual disbursement pending rectification within 28 days.</div>
        <div class="mt-1 text-stone-400">Inspector Note: "Close, mate—but I can't sign off the EFT until all three schedule items are ticked."</div>
      `;
    } else {
      audio.playAuditFailure();
      if (this.minigamesUI && typeof this.minigamesUI.slamStamp === 'function') {
        this.minigamesUI.slamStamp('SECTION 5.12 REMEDIATION ORDER');
      }
      banner.className = 'p-4 text-center rounded-lg border-2 mb-4 font-sans-ui bg-rose-100 border-rose-800 text-rose-950';
      title.textContent = 'STATUTORY REMEDIATION ORDER ISSUED';
      subtitle.textContent = `Section 5.12 Biodiversity Conservation Act 2016 — ${breaches} Major Breaches Recorded`;

      financialBox.className = 'p-4 rounded border-2 mb-6 font-mono-tech text-xs bg-rose-950 text-rose-200 border-rose-600';
      financialBox.innerHTML = `
        <div class="font-bold text-sm text-rose-400 mb-1">🚨 PAYMENT FORFEITED & CONTRACTOR LEVY APPLIED</div>
        <div>Withheld Trust Disbursement: <strong>$0.00 Released</strong></div>
        <div>Mandatory BCT Bush Regeneration Contractor Deduction: <strong>-$14,800.00 AUD</strong></div>
        <div class="mt-1 text-rose-300/90">Failure to comply with statutory remediation directions within 60 days will result in Land & Environment Court proceedings.</div>
      `;
    }

    const auditEl = document.getElementById('audit-modal');
    auditEl.classList.remove('hidden');
    auditEl.style.display = 'flex';
  }

  resetSeason() {
    this.isAuditOpen = false;
    const auditEl = document.getElementById('audit-modal');
    auditEl.classList.add('hidden');
    auditEl.style.display = 'none';

    this.seasonSecondsRemaining = 225;
    this.interactables.reset();
    this.playerPos.set(0, 1.7, 34);
    this.camera.position.copy(this.playerPos);
    this.camera.rotation.set(0, 0, 0);
    this.updateClipboardUI();

    this.startFromUI();
    this.showNotification('New Stewardship Season Started — Complete all 3 BCT tasks before Audit!', 'emerald');
  }

  updateMouseHoverRaycast(clientX, clientY) {
    const ndcX = (clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables.interactableMeshes, false);
    if (hits.length > 0) {
      this.hoveredTarget = hits[0].object.userData.interactable;
    }
  }

  updateRaycast() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables.interactableMeshes, false);

    const promptEl = document.getElementById('crosshair-interaction');

    if (hits.length > 0) {
      const target = hits[0].object.userData.interactable;
      this.hoveredTarget = target;
    }

    if (this.hoveredTarget) {
      const target = this.hoveredTarget;
      let label = '';
      if (target.category === 'weed') {
        label = target.cleared
          ? `${target.species} (Cleared)`
          : `[CLICK] Eradicate ${target.species} (HP: ${target.hp}/${target.maxHp})`;
      } else if (target.category === 'trap') {
        label = target.baited
          ? `${target.name} (Baited & Armed)`
          : `[CLICK] Bait & Arm ${target.name}`;
      } else if (target.category === 'photopoint') {
        label = target.captured
          ? `${target.id} (Photolog Recorded)`
          : `[CLICK] Capture ${target.name}`;
      }

      promptEl.textContent = label;
      promptEl.classList.remove('opacity-0');
      promptEl.classList.add('opacity-100');
    } else {
      promptEl.classList.add('opacity-0');
      promptEl.classList.remove('opacity-100');
    }
  }

  updateMovement(dt) {
    if (this.isClipboardOpen || this.isAuditOpen) return;

    // Turn left/right with ArrowLeft/ArrowRight or Q/E
    const turnSpeed = 1.9;
    const yawTurn = ((this.keys.left || this.keys.q) ? 1 : 0) - ((this.keys.right || this.keys.e) ? 1 : 0);
    if (yawTurn !== 0) {
      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.setFromQuaternion(this.camera.quaternion);
      euler.y += yawTurn * turnSpeed * dt;
      this.camera.quaternion.setFromEuler(euler);
    }

    // Walk forward/back with W/S or ArrowUp/ArrowDown; strafe with A/D
    const speed = this.keys.shift ? 13.0 : 8.0;
    const forward = ((this.keys.w || this.keys.up) ? 1 : 0) - ((this.keys.s || this.keys.down) ? 1 : 0);
    const strafe = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0);

    const isMoving = (forward !== 0 || strafe !== 0);

    if (isMoving) {
      this.walkTime += dt * (this.keys.shift ? 1.5 : 1.0);

      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);
      camDir.y = 0;
      if (camDir.lengthSq() > 0.0001) camDir.normalize();

      const camRight = new THREE.Vector3();
      camRight.crossVectors(camDir, this.camera.up).normalize();

      this.camera.position.addScaledVector(camDir, forward * speed * dt);
      this.camera.position.addScaledVector(camRight, strafe * speed * dt);

      // Keep player inside the 48m star-picket boundary fence
      const limit = 46.5;
      this.camera.position.x = Math.max(-limit, Math.min(limit, this.camera.position.x));
      this.camera.position.z = Math.max(-limit, Math.min(limit, this.camera.position.z));

      if (this.walkTime - this.lastStepTime > 0.45) {
        audio.playFootstep();
        this.lastStepTime = this.walkTime;
      }
    }

    // Lock player height to undulating paddock terrain + creek bed
    const groundY = this.world.getHeightAt(this.camera.position.x, this.camera.position.z);
    const headBob = isMoving ? Math.sin(this.walkTime * 10) * 0.06 : 0;
    this.camera.position.y = groundY + 1.7 + headBob;

    this.toolView.update(dt, isMoving, this.walkTime);
    this.updateHUDTelemetry();
  }

  updateHUDTelemetry() {
    const latSec = (44.0 + this.camera.position.z * 0.08).toFixed(1);
    const lonSec = (22.0 + this.camera.position.x * 0.08).toFixed(1);
    const gpsString = `30°12'${latSec}"S 150°18'${lonSec}"E`;

    document.getElementById('hud-gps').textContent = `GPS: ${gpsString}`;
    document.getElementById('cam-coords').textContent = `COORD: ${gpsString}`;

    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    let angle = Math.atan2(dir.x, -dir.z) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    const deg = Math.round(angle).toString().padStart(3, '0');
    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const card = cardinals[Math.round(angle / 45) % 8];

    document.getElementById('hud-bearing').textContent = `HDG: ${deg}° ${card}`;
    document.getElementById('cam-bearing').textContent = `BEARING: ${deg}° ${card}`;
  }

  updateTimer(dt) {
    const blocker = document.getElementById('blocker');
    const blockerVisible = blocker && !blocker.classList.contains('hidden') && blocker.style.display !== 'none';
    if (blockerVisible || this.isClipboardOpen || this.isAuditOpen) return;

    this.seasonSecondsRemaining -= dt;
    if (this.seasonSecondsRemaining <= 0) {
      this.seasonSecondsRemaining = 0;
      this.triggerRegulatorAudit();
    }

    const mins = Math.floor(this.seasonSecondsRemaining / 60).toString().padStart(2, '0');
    const secs = Math.floor(this.seasonSecondsRemaining % 60).toString().padStart(2, '0');
    document.getElementById('hud-timer').textContent = `${mins}:${secs}`;
  }

  animate() {
    requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    this.world.update(elapsed);
    this.updateMovement(dt);
    this.updateRaycast();
    this.updateTimer(dt);

    this.renderer.render(this.scene, this.camera, this.interactables, this.activeTool, this.toolView);
  }
}

window.bootBSAGame = () => {
  if (!window.__bsaGameInstance) {
    window.__bsaGameInstance = new BSASimulatorGame();
  }
};

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', window.bootBSAGame);
} else {
  window.bootBSAGame();
}
