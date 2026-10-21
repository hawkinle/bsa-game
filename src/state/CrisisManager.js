/**
 * CrisisManager.js
 * Manages multi-year ecological, climatic, and regulatory events across the 5-Year
 * NSW Biodiversity Stewardship Agreement (BSA) lifecycle.
 */

export class CrisisManager {
  constructor(campaignState) {
    this.state = campaignState;
    this.activeCrisis = null;

    this.crisisCatalog = {
      1: {
        year: 1,
        id: 'year1_inception',
        title: 'YEAR 1: BASELINE INCEPTION & WEED KNOCKDOWN',
        badge: 'SCHEDULE 3 BASELINE',
        severity: 'STANDARD',
        summary: 'Establish baseline photo-points (PP-01 & PP-02), eradicate initial woody weeds (African Boxthorn & Coolatai Grass), and bait the creek feral pig trap before Inspector Henderson’s first audit.',
        fieldDirective: 'Complete all 3 core paddock tasks (6 Weeds, 1 Creek Pig Trap, 2 Photo-Points).',
        hasSpecialAction: false,
        resolved: true
      },
      2: {
        year: 2,
        id: 'year2_flood',
        title: 'YEAR 2 CRISIS: LA NIÑA FLASH FLOOD & FENCE WASHOUT',
        badge: '⚠️ BIOSECURITY & GRAZING BREACH RISK',
        severity: 'HIGH',
        summary: 'An intense La Niña storm cell over the Liverpool Ranges sent a flash flood down the western creek gully, washing out 40m of boundary star-picket fencing and allowing neighbour’s Hereford cattle to stray into Zone 1!',
        fieldDirective: 'Repair the washed-out creek boundary fence (uses 1x Fencing Gear bundle or $1,200 emergency contractor) AND clear flood-borne weed flushes.',
        hasSpecialAction: true,
        actionLabel: 'DEPLOY FENCING GEAR & EVICT STRAY CATTLE (1x Fencing Bundle)',
        actionCostSupply: 'fencingGear',
        fallbackCashCost: 1200,
        resolved: false
      },
      3: {
        year: 3,
        id: 'year3_species_discovery',
        title: 'YEAR 3 DISCOVERY: REGENT HONEYEATER & KOALA CANOPY SIGHTING',
        badge: '🌿 ECOLOGICAL VARIATION OPPORTUNITY',
        severity: 'OPPORTUNITY',
        summary: 'During spring mistletoe flowering in the Box-Gum woodland canopy, a breeding pair of Critically Endangered Regent Honeyeaters (Anthochaera phrygia) and a Koala maternal joey were recorded near PP-01!',
        fieldDirective: 'Lodge an Ecological BAM Variation Report with the NSW BCT ($1,500 assessor fee) to mint +8 bonus Regent Honeyeater & +4 Koala Species Credits!',
        hasSpecialAction: true,
        actionLabel: 'LODGE BAM VARIATION REPORT ($1,500 Assessor Fee → +12 Species Credits)',
        actionCostCash: 1500,
        resolved: false
      },
      4: {
        year: 4,
        id: 'year4_bushfire',
        title: 'YEAR 4 CRISIS: EL NIÑO DRY LIGHTNING GRASSFIRE',
        badge: '🔥 EMERGENCY ASSET PROTECTION',
        severity: 'CRITICAL',
        summary: 'Dry lightning along Ironbark Ridge ignited cured tussock grass along the northern fenceline. Spot-fires threaten hollow-bearing habitat trees and permanent photo-point reference plots!',
        fieldDirective: 'Deploy the Ute Slip-On Fire Unit (uses 40L Farm Diesel) to extinguish spot-fires around hollow logs before completing annual weed & trap duties.',
        hasSpecialAction: true,
        actionLabel: 'RUN SLIP-ON FIRE PUMP & CONTAIN SPOT-FIRES (40L Diesel)',
        actionCostDiesel: 40,
        fallbackCashCost: 1800,
        resolved: false
      },
      5: {
        year: 5,
        id: 'year5_comprehensive_audit',
        title: 'YEAR 5: COMPREHENSIVE 5-YEAR BCT STATUTORY REVIEW',
        badge: '🏛️ FIVE-YEAR TRUST MILESTONE',
        severity: 'MILESTONE',
        summary: 'Senior Inspector M. Henderson and the BCT Ecological Audit Team have arrived for the mandatory 5-Year Comprehensive Review. Full field compliance and >85% Total Fund Deposit unlock your Perpetual Stewardship Dividend!',
        fieldDirective: 'Achieve 100% field compliance (Weeds, Trap, Photo-Points) and ensure your Total Fund Deposit (TFD) is funded via the Credit Market.',
        hasSpecialAction: false,
        resolved: true
      }
    };

    this.loadCrisisForYear(this.state.currentYear);
  }

  loadCrisisForYear(year) {
    const template = this.crisisCatalog[year] || this.crisisCatalog[1];
    this.activeCrisis = { ...template };
    return this.activeCrisis;
  }

  /**
   * Resolves the current year's special crisis or ecological opportunity from the HUD/Clipboard.
   */
  resolveActiveCrisis() {
    if (!this.activeCrisis || !this.activeCrisis.hasSpecialAction) {
      return { ok: false, message: 'No special crisis response required this season.' };
    }
    if (this.activeCrisis.resolved) {
      return { ok: false, message: 'This seasonal event has already been resolved.' };
    }

    const id = this.activeCrisis.id;

    // Year 2: Flash Flood Fence Washout
    if (id === 'year2_flood') {
      const fenceSupply = this.state.inventory.fencingGear;
      if (fenceSupply && fenceSupply.quantity >= 1) {
        fenceSupply.quantity -= 1;
        this.activeCrisis.resolved = true;
        this.state.inspector.trustScore = Math.min(100, this.state.inspector.trustScore + 6);
        this.state.ledgerLog.unshift({
          year: this.state.currentYear,
          type: 'CRISIS_RESPONSE',
          description: 'Repaired creek flood fence washout & evicted stray cattle (Used 1x Fencing Gear).',
          amount: 0
        });
        return {
          ok: true,
          message: 'FLOOD WASHOUT REPAIRED: Creek boundary fence re-strained & stray cattle evicted (+6% Regulator Trust)!'
        };
      } else if (this.state.operatingCash >= this.activeCrisis.fallbackCashCost) {
        this.state.operatingCash -= this.activeCrisis.fallbackCashCost;
        this.activeCrisis.resolved = true;
        this.state.ledgerLog.unshift({
          year: this.state.currentYear,
          type: 'CRISIS_RESPONSE',
          description: 'Emergency fencing contractor repaired creek washout.',
          amount: -this.activeCrisis.fallbackCashCost
        });
        return {
          ok: true,
          message: `FLOOD WASHOUT REPAIRED: Emergency contractor restored creek boundary fence (-$${this.activeCrisis.fallbackCashCost}).`
        };
      }
      return {
        ok: false,
        message: 'Need 1x Fencing Gear bundle (or $1,200 cash) to repair the flood fence washout!'
      };
    }

    // Year 3: Threatened Species Discovery (BAM Variation)
    if (id === 'year3_species_discovery') {
      const cost = this.activeCrisis.actionCostCash || 1500;
      if (this.state.operatingCash < cost) {
        return {
          ok: false,
          message: `Insufficient cash ($${cost.toLocaleString()} required for Accredited BAM Assessor variation report).`
        };
      }
      this.state.operatingCash -= cost;
      this.state.credits.regentHoneyeater.totalGenerated += 8;
      this.state.credits.regentHoneyeater.available += 8;
      this.state.credits.koalaSpecies.totalGenerated += 4;
      this.state.credits.koalaSpecies.available += 4;
      this.activeCrisis.resolved = true;
      this.state.inspector.trustScore = Math.min(100, this.state.inspector.trustScore + 8);

      this.state.ledgerLog.unshift({
        year: this.state.currentYear,
        type: 'BAM_VARIATION',
        description: 'BCT Approved BAM Variation: Minted +8 Regent Honeyeater & +4 Koala Species Credits!',
        amount: -cost
      });

      return {
        ok: true,
        message: 'BCT VARIATION APPROVED: +8 Regent Honeyeater & +4 Koala Species Credits added to your registry!'
      };
    }

    // Year 4: Dry Lightning Grassfire
    if (id === 'year4_bushfire') {
      const diesel = this.state.inventory.diesel;
      const needed = this.activeCrisis.actionCostDiesel || 40;
      if (diesel && diesel.quantity >= needed) {
        diesel.quantity -= needed;
        this.activeCrisis.resolved = true;
        this.state.inspector.trustScore = Math.min(100, this.state.inspector.trustScore + 8);
        this.state.ledgerLog.unshift({
          year: this.state.currentYear,
          type: 'CRISIS_RESPONSE',
          description: `Extinguished ridge grassfire & protected hollow logs (Used ${needed}L Diesel).`,
          amount: 0
        });
        return {
          ok: true,
          message: 'GRASSFIRE CONTAINED: Ute slip-on unit blacked out spot-fires around hollow habitat logs (+8% Regulator Trust)!'
        };
      } else if (this.state.operatingCash >= this.activeCrisis.fallbackCashCost) {
        this.state.operatingCash -= this.activeCrisis.fallbackCashCost;
        this.activeCrisis.resolved = true;
        this.state.ledgerLog.unshift({
          year: this.state.currentYear,
          type: 'CRISIS_RESPONSE',
          description: 'Contracted water-cart tanker to contain northern ridge grassfire.',
          amount: -this.activeCrisis.fallbackCashCost
        });
        return {
          ok: true,
          message: `GRASSFIRE CONTAINED: Contracted water-cart extinguished ridge spot-fires (-$${this.activeCrisis.fallbackCashCost}).`
        };
      }
      return {
        ok: false,
        message: `Need ${needed}L Farm Diesel (or $1,800 emergency water-cart) to contain the grassfire!`
      };
    }

    return { ok: false, message: 'Unable to resolve crisis.' };
  }
}
