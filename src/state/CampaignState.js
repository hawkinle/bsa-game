/**
 * CampaignState.js
 * Core 5-Year NSW Biodiversity Conservation Trust (BCT) & Biodiversity Offsets Scheme (BOS)
 * Stewardship Agreement state machine, financial trust ledger, credit registry, and inventory.
 */

export class CampaignState {
  constructor() {
    this.resetCampaign();
  }

  resetCampaign() {
    // 1. Timeline & Statutory Property Metadata
    this.currentYear = 1;
    this.maxYears = 5;
    this.seasonDurationSeconds = 225; // 03:45 per annual field season

    this.property = {
      agreementId: 'BSA #2026-NW-042',
      propertyName: 'Ironbark Ridge',
      lotDp: 'Lot 4 // DP 754329',
      bioregion: 'Brigalow Belt South / Liverpool Plains IBRA',
      localGovernmentArea: 'Gunnedah / Tamworth Regional',
      totalHectares: 142.5,
      zoneName: 'Zone 1: Box-Gum Grassy Woodland & Riparian Creek Line'
    };

    // 2. BCT Financial Trust & Landholder Operating Ledger
    // Under the NSW BC Act 2016, credit proceeds go first to satisfy the Total Fund Deposit (TFD).
    // Once TFD reaches 100%, the BCT releases Annual Management Payments (AMP) & surplus proceeds.
    this.tfdTarget = 850000;          // $850,000 present value of perpetual stewardship obligations
    this.tfdCurrentBalance = 510000;  // Starting at 60% funded ($510,000 in BCT Trust Account)
    this.annualManagementPayment = 48250; // $48,250 scheduled annual disbursement
    this.operatingCash = 25000;       // Landholder working capital ($25,000 starting cash)
    this.totalPenaltiesIncurred = 0;
    this.totalSurplusEarned = 0;

    // 3. Biodiversity Credit Registry (BAM Calculator Entitlements)
    this.credits = {
      pct101BoxGum: {
        id: 'pct101BoxGum',
        code: 'PCT-101',
        name: 'White Box – Yellow Box – Blakely’s Red Gum Grassy Woodland',
        category: 'Ecosystem Credit',
        threatStatus: 'Critically Endangered Ecological Community (CEEC)',
        totalGenerated: 42,
        available: 24,
        retired: 18,
        floorPrice: 9200
      },
      koalaSpecies: {
        id: 'koalaSpecies',
        code: 'SPC-KOALA',
        name: 'Phascolarctos cinereus (Koala — North West Slopes)',
        category: 'Species Credit',
        threatStatus: 'Endangered (BC Act 2016)',
        totalGenerated: 20,
        available: 12,
        retired: 8,
        floorPrice: 7800
      },
      regentHoneyeater: {
        id: 'regentHoneyeater',
        code: 'SPC-ANTHO',
        name: 'Anthochaera phrygia (Regent Honeyeater)',
        category: 'Species Credit',
        threatStatus: 'Critically Endangered (BC Act 2016)',
        totalGenerated: 10,
        available: 0, // Unlocked/bonus credits upon Year 3 canopy sighting variation
        retired: 10,
        floorPrice: 11500
      }
    };

    // 4. Operational Field Supplies & Consumables Inventory
    this.inventory = {
      diesel: {
        id: 'diesel',
        name: 'Farm Diesel Fuel (L)',
        quantity: 120,
        maxQuantity: 200,
        unitCost: 2.15,
        packSize: 50,
        packCost: 110,
        description: 'Powers ute patrol, fire slip-on pump, and mechanical slasher.'
      },
      glyphosate: {
        id: 'glyphosate',
        name: 'Bio-Active Herbicide Mix (L)',
        quantity: 8,
        maxQuantity: 20,
        unitCost: 45,
        packSize: 5,
        packCost: 225,
        description: 'Selective spot-spray chemical for Coolatai Grass & Boxthorn knockdown.'
      },
      cornBait: {
        id: 'cornBait',
        name: 'Fermented Silo Corn Bait (Bags)',
        quantity: 3,
        maxQuantity: 10,
        unitCost: 65,
        packSize: 2,
        packCost: 130,
        description: 'Aromatic fermented grain to draw feral pig sounders into creek mesh traps.'
      },
      fencingGear: {
        id: 'fencingGear',
        name: 'Star Pickets & High-Tensile Wire (Bundles)',
        quantity: 2,
        maxQuantity: 10,
        unitCost: 340,
        packSize: 2,
        packCost: 680,
        description: 'Essential for flood washout repairs and stray cattle exclusion fencing.'
      }
    };

    // 5. Landholder Stewardship Skill Perks
    this.perks = {
      bushMechanic: {
        id: 'bushMechanic',
        name: 'Bush Mechanic & High-Flow Nozzle',
        cost: 6500,
        unlocked: false,
        description: '+25% movement speed and +50% knapsack sprayer reach & efficiency.'
      },
      masterBotanist: {
        id: 'masterBotanist',
        name: 'BAM Accredited Botanist Eye',
        cost: 8000,
        unlocked: false,
        description: 'Single-strike mattock root-crown removal & +15% BCT audit score buffer.'
      },
      feralTrapper: {
        id: 'feralTrapper',
        name: 'Remote Cellular Trap Telemetry',
        cost: 7200,
        unlocked: false,
        description: 'Auto-arms creek traps with 50% less bait & alerts on feral pig incursions.'
      }
    };

    // 6. Regulator Relationship & Audit History (Senior Inspector M. Henderson)
    this.inspector = {
      name: 'M. Henderson',
      title: 'Senior Compliance Inspector (NSW BCT)',
      vehicle: 'NSW Govt HiLux (Fleet #409)',
      trustScore: 72,
      scrutinyLevel: 'Standard Annual Audit'
    };

    this.auditHistory = [];
    this.ledgerLog = [
      {
        year: 1,
        type: 'INCEPTION',
        description: 'BSA #2026-NW-042 Registered on Land Title. Initial TFD at 60% ($510,000 / $850,000).',
        amount: 0
      }
    ];
  }

  get tfdPercentFunded() {
    return Math.min(100, Math.round((this.tfdCurrentBalance / this.tfdTarget) * 1000) / 10);
  }

  get tfdShortfall() {
    return Math.max(0, this.tfdTarget - this.tfdCurrentBalance);
  }

  get isTfdFullyFunded() {
    return this.tfdCurrentBalance >= this.tfdTarget;
  }

  applyCreditSaleProceeds(grossProceeds, description = 'Biodiversity Credit Transfer') {
    const shortfall = this.tfdShortfall;
    let toTfd = 0;
    let toLandholder = 0;

    if (shortfall > 0) {
      const mandatoryTfdShare = Math.min(shortfall, Math.round(grossProceeds * 0.8));
      toTfd = mandatoryTfdShare;
      toLandholder = grossProceeds - toTfd;
    } else {
      toLandholder = grossProceeds;
    }

    this.tfdCurrentBalance += toTfd;
    this.operatingCash += toLandholder;
    this.totalSurplusEarned += toLandholder;

    this.ledgerLog.unshift({
      year: this.currentYear,
      type: 'CREDIT_SALE',
      description: `${description} (TFD: +$${toTfd.toLocaleString()} | Cash: +$${toLandholder.toLocaleString()})`,
      amount: grossProceeds
    });

    return { grossProceeds, toTfd, toLandholder, tfdPercent: this.tfdPercentFunded };
  }

  purchaseSupply(supplyId) {
    const item = this.inventory[supplyId];
    if (!item) return { ok: false, message: 'Unknown supply item.' };
    if (item.quantity >= item.maxQuantity) {
      return { ok: false, message: `${item.name} storage is already full.` };
    }
    if (this.operatingCash < item.packCost) {
      return { ok: false, message: `Insufficient operating cash ($${item.packCost} required).` };
    }

    this.operatingCash -= item.packCost;
    item.quantity = Math.min(item.maxQuantity, item.quantity + item.packSize);

    this.ledgerLog.unshift({
      year: this.currentYear,
      type: 'EXPENSE',
      description: `Purchased +${item.packSize} ${item.name}`,
      amount: -item.packCost
    });

    return {
      ok: true,
      message: `Purchased +${item.packSize} ${item.name} for $${item.packCost.toLocaleString()}.`
    };
  }

  unlockPerk(perkId) {
    const perk = this.perks[perkId];
    if (!perk) return { ok: false, message: 'Invalid perk.' };
    if (perk.unlocked) return { ok: false, message: `${perk.name} is already unlocked.` };
    if (this.operatingCash < perk.cost) {
      return { ok: false, message: `Insufficient operating cash ($${perk.cost.toLocaleString()} required).` };
    }

    this.operatingCash -= perk.cost;
    perk.unlocked = true;

    this.ledgerLog.unshift({
      year: this.currentYear,
      type: 'CAPEX_UPGRADE',
      description: `Unlocked Capability: ${perk.name}`,
      amount: -perk.cost
    });

    return {
      ok: true,
      message: `UNLOCKED: ${perk.name}!`
    };
  }

  recordAuditAndAdvanceYear({ breaches, tasksCompleted, totalTasks, crisisResolved }) {
    let ampReleased = 0;
    let penalty = 0;
    let verdict = 'SATISFACTORY';

    if (breaches === 0 && crisisResolved !== false) {
      const tfdMultiplier = this.tfdPercentFunded >= 80 ? 1.0 : 0.75;
      ampReleased = Math.round(this.annualManagementPayment * tfdMultiplier);
      this.operatingCash += ampReleased;
      this.inspector.trustScore = Math.min(100, this.inspector.trustScore + 10);
      this.inspector.scrutinyLevel = this.inspector.trustScore >= 85
        ? 'Gold Tier Landholder (Low Scrutiny)'
        : 'Standard Annual Audit';
    } else if (breaches === 1) {
      verdict = 'TIER_1_BREACH_WITHHELD';
      ampReleased = 0;
      this.inspector.trustScore = Math.max(0, this.inspector.trustScore - 15);
      this.inspector.scrutinyLevel = 'Elevated Compliance Watch';
    } else {
      verdict = 'STATUTORY_REMEDIATION_ORDER';
      ampReleased = 0;
      penalty = 14800;
      this.operatingCash = Math.max(0, this.operatingCash - penalty);
      this.totalPenaltiesIncurred += penalty;
      this.inspector.trustScore = Math.max(0, this.inspector.trustScore - 30);
      this.inspector.scrutinyLevel = 'Strict Enforcement / Section 5.12 Notice';
    }

    const record = {
      year: this.currentYear,
      verdict,
      breaches,
      tasksCompleted,
      totalTasks,
      ampReleased,
      penalty,
      tfdPercent: this.tfdPercentFunded,
      trustScore: this.inspector.trustScore
    };

    this.auditHistory.push(record);
    this.ledgerLog.unshift({
      year: this.currentYear,
      type: 'ANNUAL_AUDIT',
      description: `Year ${this.currentYear} BCT Audit (${verdict}): AMP +$${ampReleased.toLocaleString()}, Penalty -$${penalty.toLocaleString()}`,
      amount: ampReleased - penalty
    });

    const completedCampaign = this.currentYear >= this.maxYears;
    if (!completedCampaign) {
      this.currentYear += 1;
    }

    return {
      ...record,
      completedCampaign,
      nextYear: this.currentYear
    };
  }
}

export const campaignState = new CampaignState();
