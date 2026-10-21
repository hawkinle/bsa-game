/**
 * OfficeDeskUI.js
 * 
 * Interactive BCT Management & Trading Desk modal.
 * Connects the regional demand heatmap, credit trading order book,
 * Total Fund Deposit (TFD) progress bar, tailgate equipment shop,
 * and 5-year compliance audit history.
 */

export class OfficeDeskUI {
  constructor(gameInstance, campaignState = null, marketEngine = null) {
    this.game = gameInstance;
    this.campaignState = campaignState;
    this.marketEngine = marketEngine;

    this.isOpen = false;
    this.activeTab = 'demand'; // 'demand' | 'market' | 'treasury' | 'shop' | 'audit_history'
    this.selectedBioregion = 'Brigalow Belt South';

    // State baseline (synced from CampaignState/MarketEngine when available)
    this.state = {
      year: 3,
      totalYears: 5,
      tfdTarget: 850000,
      tfdCurrent: 520000,
      ampPayment: 48250,
      isGazetted: false,
      operatingFunds: 64500,
      credits: {
        ecosystem: {
          'White Box - Yellow Box - Blakely\'s Red Gum Woodland': { available: 42, sold: 18, price: 12500 },
          'Derived Native Grassland of the NSW North Western Slopes': { available: 80, sold: 20, price: 6800 },
          'Semi-evergreen Vine Thicket (SEVT)': { available: 15, sold: 0, price: 14200 }
        },
        species: {
          'Koala (Phascolarctos cinereus) Habitat': { available: 12, sold: 4, price: 9500 },
          'Regent Honeyeater (Anthochaera phrygia) Breeding': { available: 8, sold: 0, price: 16800 }
        }
      },
      equipment: {
        boots: { name: 'Heavy Blundstone Boots', owned: true, tier: 1, cost: 0, desc: 'Standard foot travel. Stamina degrades over distance.' },
        quad: { name: 'Yamaha Kodiak 450 Quad Bike', owned: false, tier: 2, cost: 8500, desc: 'Traverse 200ha paddocks at 40km/h with knapsack rack.' },
        ute: { name: 'LandCruiser 79 Farm HiLux', owned: false, tier: 3, cost: 24000, desc: 'Fitted with 400L slip-on spray & bushfire hose reel.' },
        camera: { name: 'Handheld BCT GPS Camera', owned: true, tier: 1, cost: 0, desc: 'Standard photopoint logging with optical reticle.' },
        songmeter: { name: 'Acoustic SongMeter SM4', owned: false, tier: 2, cost: 4200, desc: 'Auto-detects Regent Honeyeater acoustic calls at dawn.' },
        drone: { name: 'Matrice Autonomous Scout Drone', owned: false, tier: 3, cost: 12500, desc: 'Thermal camera sweeps 20ha for weeds & fence breaches in 30s.' },
        bore: { name: 'Solar Bore Watering Station', owned: false, tier: 2, cost: 6800, desc: 'Passive fauna attraction point, raising species credit yield.' },
        fence: { name: 'High-Tensile Exclusion Fence', owned: false, tier: 2, cost: 9500, desc: 'Reinforced 8-wire fence immune to stock flood breaches.' }
      },
      bids: [
        {
          id: 'bid-1',
          buyer: 'Apex Infrastructure (Inland Rail)',
          badge: 'URGENT STATUTORY DEADLINE',
          badgeColor: 'rose',
          creditType: 'White Box - Yellow Box - Blakely\'s Red Gum Woodland',
          quantity: 25,
          offerPrice: 12800,
          quote: '"We must discharge our offset liability before track-laying commences in Quarter 3. Prompt settlement guaranteed."'
        },
        {
          id: 'bid-2',
          buyer: 'Helios Renewables (Golden Plains Solar)',
          badge: 'BULK ESG PURCHASE',
          badgeColor: 'amber',
          creditType: 'Derived Native Grassland of the NSW North Western Slopes',
          quantity: 50,
          offerPrice: 6500,
          quote: '"Seeking bulk native grassland credits for solar farm development approval. Direct escrow release to your TFD."'
        },
        {
          id: 'bid-3',
          buyer: 'Pinnacle Residential Estates',
          badge: 'PRIVATE DEVELOPER',
          badgeColor: 'stone',
          creditType: 'White Box - Yellow Box - Blakely\'s Red Gum Woodland',
          quantity: 12,
          offerPrice: 11200,
          quote: '"Bypass corridor subdivision offset. Offering flexible staged settlement with bonus dividend."'
        }
      ],
      auditHistory: [
        { year: 1, determination: 'SATISFACTORY COMPLIANCE', score: '100% (Gold Tier)', amp: 48250, inspector: 'M. Henderson', notes: 'Baseline infrastructure and primary boxthorn knockdown certified.' },
        { year: 2, determination: 'SATISFACTORY (POST-FLOOD REPAIR)', score: '95% (Silver Tier)', amp: 48250, inspector: 'M. Henderson', notes: 'Creek fence line reconstructed following high-water washout.' }
      ]
    };

    this.container = null;
    this.initDOM();
  }

  initDOM() {
    let existing = document.getElementById('office-desk-modal');
    if (existing) {
      this.container = existing;
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'office-desk-modal';
    modal.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 hidden select-none';
    modal.innerHTML = `
      <div class="relative w-full max-w-6xl h-[92vh] max-h-[850px] bg-[#1a1c1e] text-stone-100 rounded-xl shadow-2xl border-2 border-amber-600/60 flex flex-col overflow-hidden font-sans-ui">
        
        <!-- NSW Government Official Header -->
        <header class="bg-[#121416] border-b border-stone-800 px-6 py-3 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-amber-700 flex items-center justify-center text-white font-black text-xs shadow">
              NSW
            </div>
            <div>
              <div class="text-[11px] font-mono-tech uppercase tracking-widest text-stone-400">Department of Climate Change, Energy, the Environment & Water</div>
              <div class="text-base font-extrabold text-amber-400 tracking-wide flex items-center gap-2">
                <span>BIODIVERSITY STEWARDSHIP TRADING DESK</span>
                <span class="text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-600/60 font-mono-tech" id="desk-status-badge">BSA #2026-NW-042</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <!-- Operational AMP Bank Balance -->
            <div class="text-right">
              <div class="text-[10px] text-stone-400 font-mono-tech uppercase">OPERATIONAL FUNDS</div>
              <div class="text-lg font-black text-emerald-400 font-mono-tech" id="desk-operating-funds">$64,500 AUD</div>
            </div>

            <!-- Close / Return to Paddock Button -->
            <button id="btn-close-desk" class="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-lg border border-stone-600 font-mono-tech text-xs tracking-wider transition-all flex items-center gap-1.5">
              <span>RETURN TO PADDOCK</span>
              <kbd class="px-1.5 py-0.5 bg-stone-900 text-stone-400 rounded text-[10px]">TAB / ESC</kbd>
            </button>
          </div>
        </header>

        <!-- Navigation Tabs Bar -->
        <nav class="bg-[#16181b] border-b border-stone-800 px-6 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button data-tab="demand" class="desk-tab-btn active px-4 py-3 text-xs font-bold font-mono-tech tracking-wider border-b-2 border-amber-500 text-amber-400 flex items-center gap-2">
            <span>🗺️</span> 1. DEMAND HEATMAP & BAM PREVIEW
          </button>
          <button data-tab="market" class="desk-tab-btn px-4 py-3 text-xs font-bold font-mono-tech tracking-wider border-b-2 border-transparent text-stone-400 hover:text-stone-200 flex items-center gap-2">
            <span>📈</span> 2. CREDIT REGISTRY & ORDER BOOK
          </button>
          <button data-tab="treasury" class="desk-tab-btn px-4 py-3 text-xs font-bold font-mono-tech tracking-wider border-b-2 border-transparent text-stone-400 hover:text-stone-200 flex items-center gap-2">
            <span>🏦</span> 3. TOTAL FUND DEPOSIT (TFD)
          </button>
          <button data-tab="shop" class="desk-tab-btn px-4 py-3 text-xs font-bold font-mono-tech tracking-wider border-b-2 border-transparent text-stone-400 hover:text-stone-200 flex items-center gap-2">
            <span>🛻</span> 4. TAILGATE EQUIPMENT SHOP
          </button>
          <button data-tab="audit_history" class="desk-tab-btn px-4 py-3 text-xs font-bold font-mono-tech tracking-wider border-b-2 border-transparent text-stone-400 hover:text-stone-200 flex items-center gap-2">
            <span>📋</span> 5. BCT COMPLIANCE LEDGER
          </button>
        </nav>

        <!-- Tab Body Content Container -->
        <main id="desk-tab-content" class="flex-1 p-6 overflow-y-auto bg-stone-950/50">
          <!-- Dynamically populated via renderTab() -->
        </main>

        <!-- TFD Quick Telemetry Sticky Bottom Bar -->
        <footer class="bg-[#121416] border-t border-stone-800 px-6 py-2.5 flex items-center justify-between text-xs font-mono-tech shrink-0">
          <div class="flex items-center gap-3">
            <span class="text-stone-400">TOTAL FUND DEPOSIT PROGRESS:</span>
            <div class="w-64 h-3 bg-stone-800 rounded-full overflow-hidden border border-stone-700 relative">
              <div id="footer-tfd-fill" class="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-500 transition-all duration-500" style="width: 61.2%"></div>
            </div>
            <span id="footer-tfd-text" class="text-amber-400 font-bold">$520,000 / $850,000 (61.2%)</span>
          </div>

          <div class="flex items-center gap-4 text-stone-400">
            <span>ANNUAL STEWARDSHIP CYCLE: <strong class="text-white">YEAR 3 OF 5</strong></span>
            <span class="w-1.5 h-1.5 rounded-full bg-stone-600"></span>
            <span>SCHEDULED AMP: <strong class="text-emerald-400">$48,250 AUD/YR</strong></span>
          </div>
        </footer>

      </div>
    `;

    document.body.appendChild(modal);
    this.container = modal;
    this.bindEvents();
  }

  bindEvents() {
    const btnClose = this.container.querySelector('#btn-close-desk');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.close());
    }

    const tabBtns = this.container.querySelectorAll('.desk-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.setTab(tab);
      });
    });

    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') {
        this.close();
      }
    });
  }

  open() {
    this.isOpen = true;
    this.container.classList.remove('hidden');
    this.container.style.display = 'flex';
    this.syncState();
    this.renderTab();
  }

  close() {
    this.isOpen = false;
    this.container.classList.add('hidden');
    this.container.style.display = 'none';
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  setTab(tabId) {
    this.activeTab = tabId;
    const tabBtns = this.container.querySelectorAll('.desk-tab-btn');
    tabBtns.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active', 'border-amber-500', 'text-amber-400');
        btn.classList.remove('border-transparent', 'text-stone-400');
      } else {
        btn.classList.remove('active', 'border-amber-500', 'text-amber-400');
        btn.classList.add('border-transparent', 'text-stone-400');
      }
    });
    this.renderTab();
  }

  syncState() {
    if (this.campaignState) {
      this.state.year = this.campaignState.currentYear || this.state.year;
      this.state.tfdCurrent = this.campaignState.tfdDeposited || this.state.tfdCurrent;
      this.state.tfdTarget = this.campaignState.tfdTarget || this.state.tfdTarget;
      this.state.operatingFunds = this.campaignState.operatingFunds || this.state.operatingFunds;
      this.state.isGazetted = this.campaignState.isGazetted || this.state.isGazetted;
      if (this.campaignState.equipment) {
        this.state.equipment = this.campaignState.equipment;
      }
    }

    const pct = Math.min(100, Math.round((this.state.tfdCurrent / this.state.tfdTarget) * 1000) / 10);
    const fillEl = this.container.querySelector('#footer-tfd-fill');
    const textEl = this.container.querySelector('#footer-tfd-text');
    const fundsEl = this.container.querySelector('#desk-operating-funds');

    if (fillEl) fillEl.style.width = `${pct}%`;
    if (textEl) textEl.textContent = `$${this.state.tfdCurrent.toLocaleString()} / $${this.state.tfdTarget.toLocaleString()} (${pct}%)`;
    if (fundsEl) fundsEl.textContent = `$${this.state.operatingFunds.toLocaleString()} AUD`;
  }

  renderTab() {
    const main = this.container.querySelector('#desk-tab-content');
    if (!main) return;

    if (this.activeTab === 'demand') {
      main.innerHTML = this.renderDemandView();
      this.bindDemandEvents();
    } else if (this.activeTab === 'market') {
      main.innerHTML = this.renderMarketView();
      this.bindMarketEvents();
    } else if (this.activeTab === 'treasury') {
      main.innerHTML = this.renderTreasuryView();
    } else if (this.activeTab === 'shop') {
      main.innerHTML = this.renderShopView();
      this.bindShopEvents();
    } else if (this.activeTab === 'audit_history') {
      main.innerHTML = this.renderAuditHistoryView();
    }
  }

  // --- TAB 1: REGIONAL DEMAND & BAM PREVIEW ---
  renderDemandView() {
    return `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-5">
          <div class="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <div class="flex items-center justify-between mb-4 border-b border-stone-800 pb-3">
              <div>
                <h3 class="text-sm font-bold text-white uppercase tracking-wider font-mono-tech">NSW Regional Biodiversity Credit Demand</h3>
                <p class="text-xs text-stone-400">Identified infrastructure corridors driving urgent offset demand under the NSW BOS.</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-stone-400 font-mono-tech">Bioregion:</span>
                <select id="select-bioregion" class="bg-stone-950 border border-stone-700 text-amber-300 font-mono-tech text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500">
                  <option value="Brigalow Belt South" selected>Brigalow Belt South (Current Site)</option>
                  <option value="Liverpool Plains">Liverpool Plains Sub-basin</option>
                  <option value="Nandewar">Nandewar Ranges</option>
                  <option value="Cobar Peneplain">Cobar Peneplain</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono-tech">
              <div class="p-3.5 bg-stone-950/80 rounded-lg border-l-4 border-rose-500 border-t border-r border-b border-stone-800">
                <div class="text-[10px] text-rose-400 uppercase font-bold">PROJECT ALPHA</div>
                <div class="text-xs font-bold text-white mt-1">Inland Rail (Narrabri to North Star)</div>
                <div class="text-[11px] text-stone-400 mt-2">Corridor: 184km rail alignment</div>
                <div class="text-[11px] text-amber-400 mt-1">Urgent Demand: <strong>Box-Gum Woodland</strong></div>
                <div class="mt-2 text-xs font-bold text-emerald-400">$12,000 - $14,500 / credit</div>
              </div>

              <div class="p-3.5 bg-stone-950/80 rounded-lg border-l-4 border-amber-500 border-t border-r border-b border-stone-800">
                <div class="text-[10px] text-amber-400 uppercase font-bold">PROJECT BETA</div>
                <div class="text-xs font-bold text-white mt-1">Golden Plains Renewable Energy Zone</div>
                <div class="text-[11px] text-stone-400 mt-2">Footprint: 1,200ha PV array</div>
                <div class="text-[11px] text-amber-400 mt-1">Bulk Demand: <strong>Derived Native Grassland</strong></div>
                <div class="mt-2 text-xs font-bold text-emerald-400">$6,200 - $7,100 / credit</div>
              </div>

              <div class="p-3.5 bg-stone-950/80 rounded-lg border-l-4 border-cyan-500 border-t border-r border-b border-stone-800">
                <div class="text-[10px] text-cyan-400 uppercase font-bold">PROJECT GAMMA</div>
                <div class="text-xs font-bold text-white mt-1">Highway Realignment & Bypass</div>
                <div class="text-[11px] text-stone-400 mt-2">Target: Hollow-bearing mature timber</div>
                <div class="text-[11px] text-amber-400 mt-1">Species Demand: <strong>Koala &amp; Cockatoo</strong></div>
                <div class="mt-2 text-xs font-bold text-emerald-400">$9,500 - $16,800 / credit</div>
              </div>
            </div>

            <div class="mt-4 p-2.5 bg-black/60 rounded border border-stone-800 flex items-center gap-3 text-xs font-mono-tech">
              <span class="px-2 py-0.5 bg-red-950 text-red-400 border border-red-700/60 rounded text-[10px] font-bold">BOS MARKET TICKER</span>
              <div class="text-stone-300 truncate">
                ⚡ [INLAND RAIL] Issued urgent tender for 60 PCT 42 credits @ $13,200 • [BCT AUCTION] Quarter 2 clearing prices up 8.4% across NW woodland communities • [GOVT GAZETTE] 3 new BSA sites registered in Gunnedah Basin.
              </div>
            </div>
          </div>

          <div class="bg-stone-900 border border-stone-800 rounded-xl p-5 font-mono-tech">
            <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">BAM Survey Projection (Plot 20x50m Baseline)</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div class="p-3 bg-stone-950 rounded border border-stone-800">
                <div class="text-[10px] text-stone-500">BASELINE VIS</div>
                <div class="text-xl font-bold text-stone-300">42.4 / 100</div>
                <div class="text-[10px] text-amber-500">Moderate Degradation</div>
              </div>
              <div class="p-3 bg-stone-950 rounded border border-stone-800">
                <div class="text-[10px] text-stone-500">PROJECTED VIS (YR 5)</div>
                <div class="text-xl font-bold text-emerald-400">76.8 / 100</div>
                <div class="text-[10px] text-emerald-500">+34.4 Point Recovery</div>
              </div>
              <div class="p-3 bg-stone-950 rounded border border-stone-800">
                <div class="text-[10px] text-stone-500">ECOSYSTEM CREDITS</div>
                <div class="text-xl font-bold text-cyan-400">137 CREDITS</div>
                <div class="text-[10px] text-cyan-600">PCT 42 / PCT 592</div>
              </div>
              <div class="p-3 bg-stone-950 rounded border border-stone-800">
                <div class="text-[10px] text-stone-500">EST. GROSS VALUE</div>
                <div class="text-xl font-bold text-emerald-400">$1,385,000</div>
                <div class="text-[10px] text-stone-500">TFD Capitalization Pool</div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-stone-900 border border-stone-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div class="w-10 h-10 rounded-lg bg-emerald-900/40 border border-emerald-600 flex items-center justify-center text-emerald-300 text-lg mb-3">
              🌿
            </div>
            <h3 class="text-sm font-bold text-white uppercase tracking-wider font-mono-tech">BCT Stewardship Feasibility</h3>
            <p class="text-xs text-stone-400 mt-2 leading-relaxed">
              Your property at <strong>Lot 4 // DP 754329 ("Ironbark Ridge")</strong> features remnant Box-Gum Woodland and Riparian Creek corridor. 
              Submitting your BAM assessment to the BCT unlocks credit creation and gazettes your site for in-perpetuity stewardship.
            </p>

            <div class="mt-4 p-3 bg-stone-950 rounded border border-stone-800 text-xs font-mono-tech space-y-2">
              <div class="flex justify-between">
                <span class="text-stone-500">Target TFD Escrow:</span>
                <span class="text-amber-300 font-bold">$850,000 AUD</span>
              </div>
              <div class="flex justify-between">
                <span class="text-stone-500">Mandatory BAM Plots:</span>
                <span class="text-white">4 Transects</span>
              </div>
              <div class="flex justify-between">
                <span class="text-stone-500">Threatened Species:</span>
                <span class="text-emerald-400">Koala, Regent Honeyeater</span>
              </div>
            </div>
          </div>

          <button id="btn-open-orderbook" class="mt-6 w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold font-mono-tech text-xs tracking-wider rounded-lg shadow-lg transition-all">
            PROCEED TO CREDIT TRADING ORDER BOOK →
          </button>
        </div>
      </div>
    `;
  }

  bindDemandEvents() {
    const btn = this.container.querySelector('#btn-open-orderbook');
    if (btn) {
      btn.addEventListener('click', () => this.setTab('market'));
    }
  }

  // --- TAB 2: CREDIT REGISTRY & MARKET ORDER BOOK ---
  renderMarketView() {
    return `
      <div class="space-y-6">
        <div class="bg-stone-900 border border-stone-800 rounded-xl p-5 font-mono-tech">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-xs font-bold text-amber-400 uppercase tracking-wider">Site Credit Registry Ledger</h3>
            <span class="text-xs text-stone-400">Total Available: <strong>141 Credits</strong></span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-stone-800 text-stone-500 text-[10px] uppercase">
                  <th class="py-2.5 px-3">Credit Classification</th>
                  <th class="py-2.5 px-3">Plant Community / Species Target</th>
                  <th class="py-2.5 px-3 text-center">Available</th>
                  <th class="py-2.5 px-3 text-center">Sold</th>
                  <th class="py-2.5 px-3 text-right">Current Market Value</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-800/60">
                <tr class="hover:bg-stone-950/40">
                  <td class="py-3 px-3 text-emerald-400 font-semibold">Ecosystem Credit</td>
                  <td class="py-3 px-3 text-stone-200">White Box - Yellow Box - Blakely's Red Gum Woodland</td>
                  <td class="py-3 px-3 text-center font-bold text-white">${this.state.credits.ecosystem['White Box - Yellow Box - Blakely\'s Red Gum Woodland'].available}</td>
                  <td class="py-3 px-3 text-center text-stone-500">${this.state.credits.ecosystem['White Box - Yellow Box - Blakely\'s Red Gum Woodland'].sold}</td>
                  <td class="py-3 px-3 text-right font-bold text-amber-300">$12,500 AUD</td>
                </tr>
                <tr class="hover:bg-stone-950/40">
                  <td class="py-3 px-3 text-emerald-400 font-semibold">Ecosystem Credit</td>
                  <td class="py-3 px-3 text-stone-200">Derived Native Grassland of NSW Slopes</td>
                  <td class="py-3 px-3 text-center font-bold text-white">${this.state.credits.ecosystem['Derived Native Grassland of the NSW North Western Slopes'].available}</td>
                  <td class="py-3 px-3 text-center text-stone-500">${this.state.credits.ecosystem['Derived Native Grassland of the NSW North Western Slopes'].sold}</td>
                  <td class="py-3 px-3 text-right font-bold text-amber-300">$6,800 AUD</td>
                </tr>
                <tr class="hover:bg-stone-950/40">
                  <td class="py-3 px-3 text-cyan-400 font-semibold">Species Credit</td>
                  <td class="py-3 px-3 text-stone-200">Koala (Phascolarctos cinereus) Habitat</td>
                  <td class="py-3 px-3 text-center font-bold text-white">${this.state.credits.species['Koala (Phascolarctos cinereus) Habitat'].available}</td>
                  <td class="py-3 px-3 text-center text-stone-500">${this.state.credits.species['Koala (Phascolarctos cinereus) Habitat'].sold}</td>
                  <td class="py-3 px-3 text-right font-bold text-cyan-300">$9,500 AUD</td>
                </tr>
                <tr class="hover:bg-stone-950/40">
                  <td class="py-3 px-3 text-cyan-400 font-semibold">Species Credit</td>
                  <td class="py-3 px-3 text-stone-200">Regent Honeyeater (Anthochaera phrygia) Breeding</td>
                  <td class="py-3 px-3 text-center font-bold text-white">${this.state.credits.species['Regent Honeyeater (Anthochaera phrygia) Breeding'].available}</td>
                  <td class="py-3 px-3 text-center text-stone-500">${this.state.credits.species['Regent Honeyeater (Anthochaera phrygia) Breeding'].sold}</td>
                  <td class="py-3 px-3 text-right font-bold text-cyan-300">$16,800 AUD</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-3 font-mono-tech">
            <h3 class="text-xs font-bold text-amber-400 uppercase tracking-wider">Active Developer Purchase Bids</h3>
            <span class="text-xs text-stone-400">3 Verified Bidders in Order Book</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-tech">
            ${this.state.bids.map(bid => `
              <div class="bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-col justify-between hover:border-amber-600/50 transition-all">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-${bid.badgeColor}-950 text-${bid.badgeColor}-400 border border-${bid.badgeColor}-800">
                      ${bid.badge}
                    </span>
                    <span class="text-[10px] text-stone-500">${bid.id.toUpperCase()}</span>
                  </div>

                  <h4 class="text-sm font-bold text-white">${bid.buyer}</h4>
                  <div class="text-xs text-stone-400 mt-1">${bid.creditType}</div>

                  <div class="my-3 p-2.5 bg-black/60 rounded border border-stone-800 text-xs">
                    <div class="flex justify-between">
                      <span class="text-stone-500">Volume Required:</span>
                      <strong class="text-white">${bid.quantity} Credits</strong>
                    </div>
                    <div class="flex justify-between mt-1">
                      <span class="text-stone-500">Offer Price:</span>
                      <strong class="text-emerald-400">$${bid.offerPrice.toLocaleString()} / cred</strong>
                    </div>
                    <div class="flex justify-between mt-1 pt-1 border-t border-stone-800">
                      <span class="text-stone-500">Total Transaction:</span>
                      <strong class="text-amber-300">$${(bid.quantity * bid.offerPrice).toLocaleString()} AUD</strong>
                    </div>
                  </div>

                  <p class="text-[11px] text-stone-400 italic mb-4 leading-tight">${bid.quote}</p>
                </div>

                <div class="flex items-center gap-2 pt-2 border-t border-stone-800">
                  <button data-accept="${bid.id}" class="btn-accept-bid flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded transition-all">
                    ACCEPT OFFER
                  </button>
                  <button data-counter="${bid.id}" class="btn-counter-bid px-3 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs rounded border border-stone-700 transition-all">
                    COUNTER (+10%)
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  bindMarketEvents() {
    this.container.querySelectorAll('.btn-accept-bid').forEach(btn => {
      btn.addEventListener('click', () => {
        const bidId = btn.getAttribute('data-accept');
        this.executeTrade(bidId, false);
      });
    });

    this.container.querySelectorAll('.btn-counter-bid').forEach(btn => {
      btn.addEventListener('click', () => {
        const bidId = btn.getAttribute('data-counter');
        this.executeTrade(bidId, true);
      });
    });
  }

  executeTrade(bidId, isCounter) {
    const bid = this.state.bids.find(b => b.id === bidId);
    if (!bid) return;

    let price = bid.offerPrice;
    if (isCounter) {
      const success = Math.random() < 0.7;
      if (!success) {
        alert(`${bid.buyer} rejected your counter-offer: "Price exceeds our statutory cap. Offer withdrawn."`);
        return;
      }
      price = Math.round(price * 1.1);
    }

    const total = bid.quantity * price;
    const tfdAdd = Math.round(total * 0.8);
    const opAdd = total - tfdAdd;

    this.state.tfdCurrent = Math.min(this.state.tfdTarget, this.state.tfdCurrent + tfdAdd);
    this.state.operatingFunds += opAdd;

    const isSpecies = bid.creditType.includes('Koala') || bid.creditType.includes('Regent');
    const dict = isSpecies ? this.state.credits.species : this.state.credits.ecosystem;
    if (dict[bid.creditType]) {
      dict[bid.creditType].available = Math.max(0, dict[bid.creditType].available - bid.quantity);
      dict[bid.creditType].sold += bid.quantity;
    }

    this.state.bids = this.state.bids.filter(b => b.id !== bidId);

    if (this.game && this.game.showNotification) {
      this.game.showNotification(`TRADE EXECUTED: ${bid.quantity} credits sold to ${bid.buyer} for $${total.toLocaleString()} AUD!`, 'emerald');
    }

    this.syncState();
    this.renderTab();
  }

  // --- TAB 3: TOTAL FUND DEPOSIT (TFD) ---
  renderTreasuryView() {
    const pct = Math.min(100, Math.round((this.state.tfdCurrent / this.state.tfdTarget) * 1000) / 10);
    const isComplete = this.state.tfdCurrent >= this.state.tfdTarget;

    return `
      <div class="max-w-4xl mx-auto space-y-6 font-mono-tech">
        <div class="bg-stone-900 border border-stone-800 rounded-xl p-6 text-center">
          <div class="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-xs uppercase tracking-widest mb-3">
            NSW Biodiversity Conservation Trust Fund Manager
          </div>
          <h2 class="text-2xl font-black text-white">TOTAL FUND DEPOSIT (TFD) ESCROW</h2>
          <p class="text-xs text-stone-400 max-w-xl mx-auto mt-2 leading-relaxed">
            Pursuant to the Biodiversity Conservation Act 2016, the agreement becomes fully gazetted in perpetuity once the TFD target is 100% capitalized. The BCT Fund Manager invests this capital to guarantee annual stewardship payments (AMP) forever.
          </p>

          <div class="my-6">
            <div class="flex justify-between text-sm font-bold mb-2">
              <span class="text-stone-400">CAPITALIZATION LEVEL</span>
              <span class="text-amber-400">${pct}% SATISFIED</span>
            </div>
            <div class="w-full h-6 bg-stone-950 rounded-full overflow-hidden border-2 border-stone-700 p-0.5">
              <div class="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-emerald-400 rounded-full transition-all duration-700" style="width: ${pct}%"></div>
            </div>
            <div class="flex justify-between text-xs text-stone-500 mt-2">
              <span>Invested: <strong class="text-white">$${this.state.tfdCurrent.toLocaleString()} AUD</strong></span>
              <span>Target: <strong class="text-amber-300">$${this.state.tfdTarget.toLocaleString()} AUD</strong></span>
            </div>
          </div>

          <div class="p-4 rounded-lg border-2 ${isComplete ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200' : 'bg-stone-950 border-amber-700/60 text-amber-300'} text-xs text-left flex items-center justify-between">
            <div>
              <div class="font-bold text-sm uppercase">${isComplete ? '✅ AGREEMENT GAZETTED IN PERPETUITY' : '⏳ ACTIVE ESCROW CAPITALIZATION PHASE'}</div>
              <div class="text-stone-400 mt-1">${isComplete ? 'Statutory obligations fully active. Annual Management Payment ($48,250) released on schedule.' : `Sell $${(this.state.tfdTarget - this.state.tfdCurrent).toLocaleString()} more in credits to complete your deposit.`}</div>
            </div>
            <div class="text-right">
              <div class="text-[10px] text-stone-500 uppercase">ANNUAL DISBURSEMENT</div>
              <div class="text-base font-bold text-emerald-400">$48,250.00 / yr</div>
            </div>
          </div>
        </div>

        <div class="bg-stone-900 border border-stone-800 rounded-xl p-5">
          <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Schedule 4: Statutory AMP Annual Allocation Breakdown</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div class="p-3 bg-stone-950 rounded border border-stone-800">
              <div class="text-stone-500 text-[10px]">WEED MANAGEMENT</div>
              <div class="text-base font-bold text-white mt-1">$18,000</div>
              <div class="text-[10px] text-emerald-500">Boxthorn & Coolatai</div>
            </div>
            <div class="p-3 bg-stone-950 rounded border border-stone-800">
              <div class="text-stone-500 text-[10px]">VERTEBRATE PESTS</div>
              <div class="text-base font-bold text-white mt-1">$12,000</div>
              <div class="text-[10px] text-emerald-500">Feral Pig Trap & Bait</div>
            </div>
            <div class="p-3 bg-stone-950 rounded border border-stone-800">
              <div class="text-stone-500 text-[10px]">BOUNDARY FENCING</div>
              <div class="text-base font-bold text-white mt-1">$10,000</div>
              <div class="text-[10px] text-emerald-500">Exclusion & Flood Gaps</div>
            </div>
            <div class="p-3 bg-stone-950 rounded border border-stone-800">
              <div class="text-stone-500 text-[10px]">MONITORING & BAM</div>
              <div class="text-base font-bold text-white mt-1">$8,250</div>
              <div class="text-[10px] text-emerald-500">Photo-Points & Audits</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- TAB 4: TAILGATE EQUIPMENT SHOP ---
  renderShopView() {
    const eq = this.state.equipment;
    return `
      <div>
        <div class="flex items-center justify-between mb-4 font-mono-tech">
          <div>
            <h3 class="text-xs font-bold text-amber-400 uppercase tracking-wider">Tailgate Equipment & Gear Arsenal</h3>
            <p class="text-xs text-stone-400">Equip high-performance mobility, monitoring, and base improvements using your operational funds.</p>
          </div>
          <div class="text-right">
            <span class="text-xs text-stone-400">Available Funds:</span>
            <span class="text-sm font-bold text-emerald-400 ml-2">$${this.state.operatingFunds.toLocaleString()} AUD</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono-tech">
          ${Object.keys(eq).map(key => {
            const item = eq[key];
            const canAfford = this.state.operatingFunds >= item.cost;
            return `
              <div class="bg-stone-900 border ${item.owned ? 'border-emerald-600/50' : 'border-stone-800'} rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${item.owned ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-stone-800 text-stone-400'}">
                      TIER ${item.tier}
                    </span>
                    <span class="text-xs font-bold ${item.cost === 0 ? 'text-stone-500' : 'text-amber-300'}">
                      ${item.cost === 0 ? 'DEFAULT' : `$${item.cost.toLocaleString()} AUD`}
                    </span>
                  </div>

                  <h4 class="text-xs font-bold text-white mt-1">${item.name}</h4>
                  <p class="text-[11px] text-stone-400 mt-2 leading-relaxed">${item.desc}</p>
                </div>

                <div class="mt-4 pt-3 border-t border-stone-800">
                  ${item.owned ? `
                    <div class="w-full py-2 bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-xs font-bold rounded text-center">
                      ✓ OWNED & EQUIPPED
                    </div>
                  ` : `
                    <button data-buy="${key}" class="btn-buy-gear w-full py-2 ${canAfford ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold' : 'bg-stone-800 text-stone-500 cursor-not-allowed'} text-xs rounded transition-all" ${canAfford ? '' : 'disabled'}>
                      ${canAfford ? `BUY FOR $${item.cost.toLocaleString()}` : 'INSUFFICIENT FUNDS'}
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  bindShopEvents() {
    this.container.querySelectorAll('.btn-buy-gear').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-buy');
        const item = this.state.equipment[key];
        if (!item || item.owned || this.state.operatingFunds < item.cost) return;

        this.state.operatingFunds -= item.cost;
        item.owned = true;

        if (this.game && this.game.showNotification) {
          this.game.showNotification(`EQUIPMENT ACQUIRED: ${item.name}!`, 'emerald');
        }

        this.syncState();
        this.renderTab();
      });
    });
  }

  // --- TAB 5: BCT COMPLIANCE LEDGER ---
  renderAuditHistoryView() {
    return `
      <div class="max-w-4xl mx-auto space-y-4 font-typewriter">
        <div class="border-b-2 border-stone-700 pb-3 mb-4">
          <div class="text-[11px] font-mono-tech uppercase tracking-widest text-stone-400">NSW Biodiversity Conservation Trust — Compliance Division</div>
          <h2 class="text-xl font-bold text-stone-100">5-YEAR STATUTORY STEWARDSHIP AUDIT LEDGER</h2>
          <div class="text-xs text-stone-400 font-mono-tech mt-1">Agreement: BSA #2026-NW-042 | Registered Landholder Record</div>
        </div>

        <div class="space-y-3">
          ${this.state.auditHistory.map(audit => `
            <div class="bg-stone-900/90 border border-stone-700 p-4 rounded-lg">
              <div class="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
                <span class="font-bold text-amber-300">ANNUAL AUDIT CYCLE: YEAR ${audit.year} OF 5</span>
                <span class="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-700 rounded text-xs font-mono-tech">
                  ${audit.determination}
                </span>
              </div>
              <div class="grid grid-cols-3 text-xs text-stone-300 font-mono-tech mb-2">
                <div>Inspector: <strong>${audit.inspector}</strong></div>
                <div>Compliance Rating: <strong>${audit.score}</strong></div>
                <div>Disbursed AMP: <strong class="text-emerald-400">$${audit.amp.toLocaleString()} AUD</strong></div>
              </div>
              <p class="text-xs text-stone-400 italic">"${audit.notes}"</p>
            </div>
          `).join('')}

          <div class="bg-stone-950 border-2 border-dashed border-stone-800 p-5 rounded-lg text-center font-mono-tech">
            <div class="text-xs text-stone-500 uppercase tracking-wider">CURRENT AUDIT CYCLE: YEAR 3</div>
            <div class="text-sm font-bold text-amber-400 mt-1">AUDITOR SCHEDULED AT FRONT GATE</div>
            <div class="text-xs text-stone-400 mt-1">Complete all 3 Schedule 3 actions in the paddock before time expires!</div>
          </div>
        </div>
      </div>
    `;
  }
}
