/**
 * MinigamesUI.js
 * 
 * Interactive HUD overlays for the gamified fieldwork:
 * 1. Root-Pop sweet-spot contraction ring meter (+100 BAM, combo multiplier).
 * 2. Knapsack sprayer pressure gauge (0 to 4 Bar with 2.5-3.0 Bar sweet zone).
 * 3. Wire strainer tension gauge (twang audio indicator, crimp button).
 * 4. Surveyor optical camera reticle with parallax percentage score.
 * 5. Inspector Henderson's rubber stamp slam animations.
 */

export class MinigamesUI {
  constructor(gameInstance) {
    this.game = gameInstance;
    this.comboCount = 0;
    this.comboTimer = null;
    this.pressure = 2.7; // Starting knapsack pressure (Bar)
    this.isSpraying = false;
    this.isStrainingFence = false;
    this.wireTension = 0.2; // 0.0 to 1.0

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    const root = document.createElement('div');
    root.id = 'minigames-overlay-root';
    root.className = 'fixed inset-0 pointer-events-none z-30 select-none overflow-hidden';
    root.innerHTML = `
      <!-- 1. ROOT-POP CONTRACTION RING METER -->
      <div id="root-pop-container" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden flex flex-col items-center pointer-events-none">
        <div class="relative w-36 h-36 flex items-center justify-center">
          <!-- Target stationary bullseye collar -->
          <div class="absolute w-14 h-14 rounded-full border-2 border-dashed border-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.4)]"></div>
          <!-- Contracting outer timing ring -->
          <div id="root-pop-ring" class="w-32 h-32 rounded-full border-2 border-amber-400 transition-all duration-75"></div>
          <!-- Center strike reticle dot -->
          <div class="w-2.5 h-2.5 rounded-full bg-white shadow"></div>
        </div>
        <div id="root-pop-label" class="mt-2 text-xs font-mono-tech text-amber-300 font-bold tracking-wider uppercase bg-black/75 px-3 py-1 rounded border border-amber-500/50">
          [CLICK TO CRACK ROOT CROWN]
        </div>
      </div>

      <!-- COMBO COUNTER POPUP -->
      <div id="combo-display" class="fixed top-24 left-1/2 -translate-x-1/2 opacity-0 transform -translate-y-2 transition-all duration-300 pointer-events-none text-center">
        <div id="combo-title" class="font-black text-2xl tracking-tighter text-amber-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] font-mono-tech">
          ROOT CRACK! +100 BAM
        </div>
        <div id="combo-streak" class="text-xs font-mono-tech text-emerald-300 tracking-widest uppercase">
          STREAK x2 (WEED BUSTER ACTIVE)
        </div>
      </div>

      <!-- 2. KNAPSACK SPRAYER PRESSURE GAUGE (Bottom Right) -->
      <div id="knapsack-pressure-hud" class="fixed bottom-28 right-6 hidden pointer-events-auto bg-stone-950/85 backdrop-blur-md p-3 rounded-xl border border-stone-700/80 shadow-2xl font-mono-tech text-xs w-48">
        <div class="flex justify-between items-center mb-1">
          <span class="text-stone-400 uppercase text-[10px]">KNAPSACK PRESSURE</span>
          <span id="pressure-val" class="text-emerald-400 font-bold">2.7 BAR</span>
        </div>
        
        <!-- Pressure bar -->
        <div class="w-full h-3 bg-stone-800 rounded-full overflow-hidden border border-stone-700 relative">
          <!-- Green sweet zone indicator -->
          <div class="absolute left-[50%] right-[25%] top-0 bottom-0 bg-emerald-500/30 border-x border-emerald-400 pointer-events-none"></div>
          <div id="pressure-bar-fill" class="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-150" style="width: 67.5%"></div>
        </div>

        <div class="flex justify-between text-[9px] text-stone-500 mt-1">
          <span>0 BAR (DRIP)</span>
          <span class="text-emerald-400 font-bold">2.5 - 3.0 BAR</span>
          <span class="text-rose-400">4 BAR (DRIFT)</span>
        </div>

        <button id="btn-pump-pressure" class="mt-2.5 w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded transition-all shadow border border-amber-400">
          ⚡ PUMP PRESSURE [SPACE]
        </button>
      </div>

      <!-- 3. WIRE STRAINER TENSION GAUGE (Fence Repair) -->
      <div id="fence-strainer-hud" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden pointer-events-auto bg-stone-900/95 border-2 border-stone-600 p-6 rounded-2xl shadow-2xl font-mono-tech text-stone-100 max-w-md w-full">
        <div class="flex items-center justify-between border-b border-stone-700 pb-2 mb-4">
          <div class="font-bold text-amber-400 text-sm">BOUNDARY FENCE REPAIR // WIRE STRAINER</div>
          <button id="btn-close-fence" class="text-stone-400 hover:text-white">✕</button>
        </div>

        <p class="text-xs text-stone-300 leading-relaxed mb-4">
          Rachet the chain wire strainer until the high-tensile wire reaches specification (1.8 - 2.2 kN). Avoid over-straining to prevent snapping the wire!
        </p>

        <!-- Tension Bar -->
        <div class="mb-4">
          <div class="flex justify-between text-xs font-bold mb-1">
            <span class="text-stone-400">WIRE TENSION</span>
            <span id="wire-tension-text" class="text-amber-400">0.4 kN (SLACK)</span>
          </div>
          <div class="w-full h-5 bg-stone-950 rounded-full overflow-hidden border border-stone-700 relative p-0.5">
            <!-- Optimal Zone -->
            <div class="absolute left-[65%] right-[15%] top-0 bottom-0 bg-emerald-500/30 border-x border-emerald-400"></div>
            <div id="wire-tension-fill" class="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-emerald-400 rounded-full transition-all duration-100" style="width: 20%"></div>
          </div>
          <div class="flex justify-between text-[10px] text-stone-500 mt-1">
            <span>0.0 kN (SLACK)</span>
            <span class="text-emerald-400 font-bold">1.8 - 2.2 kN (SPEC)</span>
            <span class="text-rose-400">2.6+ kN (SNAP RISK)</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button id="btn-ratchet-wire" class="py-3 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs rounded border border-stone-600 transition-all">
            🔧 RATCHET STRAINER
          </button>
          <button id="btn-crimp-wire" class="py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded transition-all shadow">
            ✂️ CRIMP &amp; TIE OFF
          </button>
        </div>
      </div>

      <!-- 4. SURVEYOR OPTICAL CAMERA RETICLE OVERLAY -->
      <div id="surveyor-reticle-hud" class="fixed inset-0 pointer-events-none hidden">
        <!-- Parallax Accuracy Match Bar (Top Center) -->
        <div class="absolute top-16 left-1/2 -translate-x-1/2 bg-stone-950/85 backdrop-blur-md px-5 py-2.5 rounded-xl border border-stone-700 text-center font-mono-tech shadow-xl">
          <div class="text-[10px] text-stone-400 uppercase tracking-widest">BAM PERMANENT PHOTOLOG ALIGNMENT</div>
          <div class="flex items-center gap-3 mt-1">
            <div class="w-48 h-2.5 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
              <div id="parallax-match-fill" class="h-full bg-amber-500 transition-all duration-200" style="width: 45%"></div>
            </div>
            <span id="parallax-match-text" class="text-xs font-bold text-amber-400">45% MATCH</span>
          </div>
          <div id="parallax-match-hint" class="text-[10px] text-stone-400 mt-1">
            Align Star Picket tag within central framing bracket (>85%)
          </div>
        </div>
      </div>

      <!-- 5. INSPECTOR HENDERSON RUBBER STAMP SLAM CONTAINER -->
      <div id="stamp-slam-container" class="fixed inset-0 pointer-events-none z-50 flex items-center justify-center hidden">
        <div id="stamp-element" class="transform scale-150 opacity-0 transition-all duration-200 uppercase font-mono-tech font-black text-center p-6 rounded-2xl border-8 shadow-2xl">
          <!-- Populated by triggerStampSlam() -->
        </div>
      </div>
    `;

    document.body.appendChild(root);
    this.root = root;
  }

  bindEvents() {
    const btnPump = this.root.querySelector('#btn-pump-pressure');
    if (btnPump) {
      btnPump.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pumpPressure();
      });
    }

    const btnRatchet = this.root.querySelector('#btn-ratchet-wire');
    if (btnRatchet) {
      btnRatchet.addEventListener('click', () => this.ratchetWire());
    }

    const btnCrimp = this.root.querySelector('#btn-crimp-wire');
    if (btnCrimp) {
      btnCrimp.addEventListener('click', () => this.crimpWire());
    }

    const btnCloseFence = this.root.querySelector('#btn-close-fence');
    if (btnCloseFence) {
      btnCloseFence.addEventListener('click', () => this.closeFenceStrainer());
    }

    // Spacebar pumps pressure when knapsack is active
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.game && this.game.activeTool === 'knapsack') {
        if (!this.game.isClipboardOpen && !this.game.isAuditOpen) {
          this.pumpPressure();
        }
      }
    });
  }

  // --- 1. ROOT-POP MECHANIC ---
  startRootPop(onResult) {
    const container = this.root.querySelector('#root-pop-container');
    const ring = this.root.querySelector('#root-pop-ring');
    if (!container || !ring) return;

    container.classList.remove('hidden');
    let size = 130;
    const minSize = 46;
    let finished = false;

    const animInterval = setInterval(() => {
      size -= 4;
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;

      if (size <= minSize) {
        clearInterval(animInterval);
        if (!finished) {
          finished = true;
          container.classList.add('hidden');
          this.handleRootPopResult(0.8, onResult); // Missed timing
        }
      }
    }, 25);

    const clickHandler = (e) => {
      if (finished) return;
      finished = true;
      clearInterval(animInterval);
      window.removeEventListener('mousedown', clickHandler);
      container.classList.add('hidden');

      // Target optimal diameter: 56px
      const delta = Math.abs(size - 56) / 56;
      this.handleRootPopResult(delta, onResult);
    };

    window.addEventListener('mousedown', clickHandler, { once: true });
  }

  handleRootPopResult(delta, callback) {
    let result = { type: 'GLANCE', damage: 1, points: 20, isCrit: false };

    if (delta < 0.22) {
      result = { type: 'CRIT_POP', damage: 2, points: 100, isCrit: true };
      this.comboCount++;
      this.showComboDisplay('CRITICAL ROOT CRACK! +100 BAM', `STREAK x${this.comboCount} (WEED BUSTER!)`, true);
    } else if (delta < 0.55) {
      result = { type: 'CLEAN_HIT', damage: 1, points: 40, isCrit: false };
      this.comboCount++;
      this.showComboDisplay('CLEAN CHIP! +40 BAM', `STREAK x${this.comboCount}`, false);
    } else {
      this.comboCount = 0;
      this.showComboDisplay('GLANCE OFF ROOT (+10 BAM)', 'COMBO RESET', false);
    }

    clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(() => {
      this.comboCount = 0;
    }, 8000);

    if (callback) callback(result);
  }

  showComboDisplay(title, subtitle, isCrit) {
    const box = this.root.querySelector('#combo-display');
    const tEl = this.root.querySelector('#combo-title');
    const sEl = this.root.querySelector('#combo-streak');
    if (!box || !tEl || !sEl) return;

    tEl.textContent = title;
    tEl.className = isCrit 
      ? 'font-black text-2xl tracking-tighter text-amber-400 drop-shadow-[0_2px_12px_rgba(245,158,11,0.8)] font-mono-tech animate-bounce'
      : 'font-bold text-xl tracking-tighter text-stone-200 drop-shadow font-mono-tech';
    sEl.textContent = subtitle;

    box.classList.remove('opacity-0', '-translate-y-2');
    box.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      box.classList.add('opacity-0', '-translate-y-2');
      box.classList.remove('opacity-100', 'translate-y-0');
    }, 1800);
  }

  // --- 2. KNAPSACK SPRAYER PRESSURE GAUGE ---
  setKnapsackVisible(visible) {
    const hud = this.root.querySelector('#knapsack-pressure-hud');
    if (!hud) return;
    if (visible) hud.classList.remove('hidden');
    else hud.classList.add('hidden');
  }

  pumpPressure() {
    this.pressure = Math.min(4.0, this.pressure + 0.55);
    this.updatePressureUI();
  }

  consumePressure(dt) {
    this.pressure = Math.max(0.5, this.pressure - 0.45 * dt);
    this.updatePressureUI();
  }

  updatePressureUI() {
    const valEl = this.root.querySelector('#pressure-val');
    const fillEl = this.root.querySelector('#pressure-bar-fill');
    if (!valEl || !fillEl) return;

    valEl.textContent = `${this.pressure.toFixed(1)} BAR`;
    const pct = (this.pressure / 4.0) * 100;
    fillEl.style.width = `${pct}%`;

    if (this.pressure >= 2.3 && this.pressure <= 3.2) {
      valEl.className = 'text-emerald-400 font-bold';
      fillEl.className = 'h-full bg-emerald-500 transition-all duration-150';
    } else if (this.pressure > 3.2) {
      valEl.className = 'text-rose-400 font-bold animate-pulse';
      fillEl.className = 'h-full bg-rose-500 transition-all duration-150';
    } else {
      valEl.className = 'text-amber-400 font-bold';
      fillEl.className = 'h-full bg-amber-500 transition-all duration-150';
    }
  }

  // --- 3. WIRE STRAINER TENSION GAUGE ---
  openFenceStrainer(onRepaired) {
    this.isStrainingFence = true;
    this.wireTension = 0.2;
    this.onFenceRepaired = onRepaired;
    const hud = this.root.querySelector('#fence-strainer-hud');
    if (hud) hud.classList.remove('hidden');
    this.updateWireUI();
  }

  closeFenceStrainer() {
    this.isStrainingFence = false;
    const hud = this.root.querySelector('#fence-strainer-hud');
    if (hud) hud.classList.add('hidden');
  }

  ratchetWire() {
    this.wireTension = Math.min(1.0, this.wireTension + 0.12);
    this.updateWireUI();
  }

  crimpWire() {
    // Spec zone: 0.65 to 0.88
    if (this.wireTension >= 0.65 && this.wireTension <= 0.88) {
      if (this.game && this.game.showNotification) {
        this.game.showNotification('FENCE STRAINED & SECURED: High-tensile boundary verified in spec!', 'emerald');
      }
      this.closeFenceStrainer();
      if (this.onFenceRepaired) this.onFenceRepaired(true);
    } else if (this.wireTension > 0.88) {
      alert('SNAP! Over-tensioned wire snapped the star picket clip! Slacken and try again.');
      this.wireTension = 0.1;
      this.updateWireUI();
    } else {
      alert('Tension too loose (<1.8 kN). Cattle will push through. Ratchet lever further into the green zone!');
    }
  }

  updateWireUI() {
    const textEl = this.root.querySelector('#wire-tension-text');
    const fillEl = this.root.querySelector('#wire-tension-fill');
    if (!textEl || !fillEl) return;

    const kn = (this.wireTension * 2.8).toFixed(1);
    const pct = this.wireTension * 100;
    fillEl.style.width = `${pct}%`;

    if (this.wireTension >= 0.65 && this.wireTension <= 0.88) {
      textEl.textContent = `${kn} kN (OPTIMAL SPEC)`;
      textEl.className = 'text-emerald-400 font-bold';
      fillEl.className = 'h-full bg-emerald-500 rounded-full transition-all duration-100';
    } else if (this.wireTension > 0.88) {
      textEl.textContent = `${kn} kN (SNAP HAZARD!)`;
      textEl.className = 'text-rose-500 font-bold animate-ping';
      fillEl.className = 'h-full bg-rose-600 rounded-full transition-all duration-100';
    } else {
      textEl.textContent = `${kn} kN (SLACK)`;
      textEl.className = 'text-amber-400 font-bold';
      fillEl.className = 'h-full bg-amber-500 rounded-full transition-all duration-100';
    }
  }

  // --- 4. SURVEYOR OPTICAL CAMERA RETICLE ---
  setSurveyorReticleVisible(visible) {
    const hud = this.root.querySelector('#surveyor-reticle-hud');
    if (!hud) return;
    if (visible) hud.classList.remove('hidden');
    else hud.classList.add('hidden');
  }

  updateParallaxScore(scorePct) {
    const fill = this.root.querySelector('#parallax-match-fill');
    const text = this.root.querySelector('#parallax-match-text');
    const hint = this.root.querySelector('#parallax-match-hint');
    if (!fill || !text || !hint) return;

    fill.style.width = `${scorePct}%`;
    text.textContent = `${Math.round(scorePct)}% MATCH`;

    if (scorePct >= 85) {
      text.className = 'text-xs font-bold text-emerald-400 animate-pulse';
      fill.className = 'h-full bg-emerald-400 transition-all duration-150';
      hint.textContent = '✓ ALIGNMENT VERIFIED — CLICK TO LOG PERMANENT RECORD';
      hint.className = 'text-[10px] text-emerald-300 font-bold mt-1';
    } else {
      text.className = 'text-xs font-bold text-amber-400';
      fill.className = 'h-full bg-amber-500 transition-all duration-150';
      hint.textContent = 'Align Star Picket tag within central framing bracket (>85%)';
      hint.className = 'text-[10px] text-stone-400 mt-1';
    }
  }

  // --- 5. INSPECTOR HENDERSON RUBBER STAMP SLAM ---
  triggerStampSlam(type, onComplete) {
    const container = this.root.querySelector('#stamp-slam-container');
    const stamp = this.root.querySelector('#stamp-element');
    if (!container || !stamp) return;

    let content = '';
    let borderClass = '';
    let rotateDeg = (Math.random() * 8 - 4).toFixed(1);

    if (type === 'pass') {
      borderClass = 'border-emerald-600 bg-emerald-950/90 text-emerald-300 shadow-emerald-900/50';
      content = `
        <div class="text-xs tracking-widest text-emerald-400 font-bold">NSW BIODIVERSITY CONSERVATION TRUST</div>
        <div class="text-3xl font-black my-1">PASSED &amp; COMPLIANT</div>
        <div class="text-xs text-emerald-200">ANNUAL STEWARDSHIP DISBURSEMENT: $48,250.00 RELEASED</div>
      `;
    } else if (type === 'frozen') {
      borderClass = 'border-amber-600 bg-stone-900/90 text-amber-300 shadow-amber-900/50';
      content = `
        <div class="text-xs tracking-widest text-amber-400 font-bold">BCT NOTICE OF DEFICIENCY</div>
        <div class="text-3xl font-black my-1">PAYMENT WITHHELD</div>
        <div class="text-xs text-amber-200">28-DAY RECTIFICATION NOTICE ISSUED</div>
      `;
    } else {
      borderClass = 'border-rose-600 bg-rose-950/90 text-rose-300 shadow-rose-900/50';
      content = `
        <div class="text-xs tracking-widest text-rose-400 font-bold">SECTION 5.12 STATUTORY REMEDIATION ORDER</div>
        <div class="text-3xl font-black my-1">NON-COMPLIANT</div>
        <div class="text-xs text-rose-200">PAYMENT FORFEITED // $14,800 CONTRACTOR LEVY</div>
      `;
    }

    stamp.className = `transform uppercase font-mono-tech font-black text-center p-6 rounded-2xl border-8 shadow-2xl ${borderClass}`;
    stamp.style.transform = `scale(2.2) rotate(${rotateDeg}deg)`;
    stamp.style.opacity = '0';
    stamp.innerHTML = content;
    container.classList.remove('hidden');

    // Trigger visual snap / slam
    requestAnimationFrame(() => {
      setTimeout(() => {
        stamp.style.transition = 'all 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        stamp.style.transform = `scale(1.0) rotate(${rotateDeg}deg)`;
        stamp.style.opacity = '1';

        // Shake viewport
        if (this.game && this.game.shakeScreen) {
          this.game.shakeScreen();
        }

        setTimeout(() => {
          if (onComplete) onComplete();
        }, 1200);
      }, 50);
    });
  }
}
