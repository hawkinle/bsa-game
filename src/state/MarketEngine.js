/**
 * MarketEngine.js
 * Simulates the NSW Biodiversity Offsets Scheme (BOS) Public Register & Credit Trading Desk.
 */

export class MarketEngine {
  constructor(campaignState) {
    this.state = campaignState;
    this.activeBids = [];
    this.marketHistory = [];

    this.buyers = [
      {
        id: 'apex_infra',
        name: 'Apex Infrastructure Consortium',
        sector: 'Inland Rail & Newell Highway Bypass (State Significant Infrastructure)',
        avatar: '🛣️',
        preferredCredits: ['pct101BoxGum', 'koalaSpecies'],
        baseMultiplier: 1.32,
        urgency: 'HIGH (EIS Approval Condition)',
        tolerance: 0.12,
        notes: 'Requires immediate retirement of Box-Gum CEEC & Koala credits before Stage 2 earthworks.'
      },
      {
        id: 'helios_solar',
        name: 'Helios New England Renewables',
        sector: 'Liverpool Plains 400MW Solar & BESS Project',
        avatar: '☀️',
        preferredCredits: ['pct101BoxGum'],
        baseMultiplier: 0.92,
        urgency: 'BULK VOLUME',
        tolerance: 0.06,
        notes: 'Purchases large credit blocks at a slight discount; settles 100% upfront into BCT Total Fund Deposit.'
      },
      {
        id: 'pinnacle_estates',
        name: 'Pinnacle Regional Developments',
        sector: 'Peri-Urban Residential Subdivision (Part 4 DA)',
        avatar: '🏘️',
        preferredCredits: ['koalaSpecies', 'regentHoneyeater'],
        baseMultiplier: 1.12,
        urgency: 'MODERATE',
        tolerance: 0.10,
        notes: 'Seeking targeted hollow-bearing tree & Koala foraging habitat species credits.'
      },
      {
        id: 'bct_tender',
        name: 'NSW BCT Fixed-Price & Conservation Tender',
        sector: 'NSW Government Statutory Credit Purchase Facility',
        avatar: '🏛️',
        preferredCredits: ['pct101BoxGum', 'koalaSpecies', 'regentHoneyeater'],
        baseMultiplier: 1.05,
        urgency: 'GUARANTEED SETTLEMENT',
        tolerance: 0.03,
        notes: 'Government reverse-auction tender. Zero default risk; boosts Inspector Henderson trust score (+4%).'
      }
    ];

    this.generateBids();
  }

  generateBids() {
    const year = this.state.currentYear;
    const yearMarketFactor = 1.0 + (year - 1) * 0.07;
    this.activeBids = [];

    this.activeBids.push({
      bidId: `BID-Y${year}-APEX`,
      buyerId: 'apex_infra',
      buyerName: 'Apex Infrastructure (Highway Bypass)',
      sector: 'Major Transport Infrastructure',
      creditType: 'pct101BoxGum',
      creditName: 'PCT-101 Box-Gum Woodland (CEEC)',
      quantityRequested: 6,
      unitPrice: Math.round(12500 * yearMarketFactor),
      status: 'OPEN',
      countered: false,
      notes: 'Urgent EIS offset obligation. High willingness to pay.'
    });

    this.activeBids.push({
      bidId: `BID-Y${year}-HELIOS`,
      buyerId: 'helios_solar',
      buyerName: 'Helios Renewables (Solar Farm)',
      sector: 'Renewable Energy Zone',
      creditType: 'pct101BoxGum',
      creditName: 'PCT-101 Box-Gum Woodland (CEEC)',
      quantityRequested: 10,
      unitPrice: Math.round(7200 * yearMarketFactor),
      status: 'OPEN',
      countered: false,
      notes: 'Bulk order to fast-track your Total Fund Deposit (TFD).'
    });

    this.activeBids.push({
      bidId: `BID-Y${year}-PINNACLE`,
      buyerId: 'pinnacle_estates',
      buyerName: 'Pinnacle Residential Estates',
      sector: 'Suburban Subdivision',
      creditType: 'koalaSpecies',
      creditName: 'Koala Species Credits (SPC-KOALA)',
      quantityRequested: 5,
      unitPrice: Math.round(8500 * yearMarketFactor),
      status: 'OPEN',
      countered: false,
      notes: 'Requires verified hollow-bearing gum habitat credits.'
    });

    const hasRegent = this.state.credits.regentHoneyeater.available > 0;
    this.activeBids.push({
      bidId: `BID-Y${year}-BCT`,
      buyerId: 'bct_tender',
      buyerName: 'NSW BCT Conservation Tender',
      sector: 'State Biodiversity Offset Fund',
      creditType: hasRegent ? 'regentHoneyeater' : 'koalaSpecies',
      creditName: hasRegent
        ? 'Regent Honeyeater Credits (SPC-ANTHO)'
        : 'Koala Species Credits (SPC-KOALA)',
      quantityRequested: 4,
      unitPrice: Math.round((hasRegent ? 14200 : 8100) * yearMarketFactor),
      status: 'OPEN',
      countered: false,
      notes: 'Official BCT tender purchase. Adds +4% Regulator Trust upon settlement.'
    });

    return this.activeBids;
  }

  acceptBid(bidId, customQuantity = null) {
    const bid = this.activeBids.find(b => b.bidId === bidId);
    if (!bid || bid.status !== 'OPEN') {
      return { ok: false, message: 'This bid is no longer open on the BOS Trading Desk.' };
    }

    const creditPool = this.state.credits[bid.creditType];
    if (!creditPool || creditPool.available <= 0) {
      return { ok: false, message: `No available ${bid.creditName} credits in your registry.` };
    }

    const qty = Math.min(
      creditPool.available,
      customQuantity ? Math.max(1, customQuantity) : bid.quantityRequested
    );

    const grossProceeds = qty * bid.unitPrice;
    creditPool.available -= qty;
    creditPool.retired += qty;
    bid.status = 'SETTLED';

    const settlement = this.state.applyCreditSaleProceeds(
      grossProceeds,
      `Sold ${qty}x ${creditPool.code} to ${bid.buyerName} @ $${bid.unitPrice.toLocaleString()}/cr`
    );

    if (bid.buyerId === 'bct_tender') {
      this.state.inspector.trustScore = Math.min(100, this.state.inspector.trustScore + 4);
    }

    this.marketHistory.unshift({
      year: this.state.currentYear,
      bidId: bid.bidId,
      buyerName: bid.buyerName,
      creditCode: creditPool.code,
      quantity: qty,
      unitPrice: bid.unitPrice,
      grossProceeds,
      toTfd: settlement.toTfd,
      toLandholder: settlement.toLandholder
    });

    return {
      ok: true,
      message: `SETTLED: Transferred ${qty}x ${creditPool.code} to ${bid.buyerName} for $${grossProceeds.toLocaleString()} ($${settlement.toTfd.toLocaleString()} to TFD, $${settlement.toLandholder.toLocaleString()} to Cash).`,
      settlement
    };
  }

  counterOffer(bidId, proposedUnitPrice = null) {
    const bid = this.activeBids.find(b => b.bidId === bidId);
    if (!bid || bid.status !== 'OPEN') {
      return { ok: false, message: 'Bid is not open for negotiation.' };
    }
    if (bid.countered) {
      return { ok: false, message: 'Buyer has already given their final price on this parcel.' };
    }

    const buyer = this.buyers.find(b => b.id === bid.buyerId);
    const targetPrice = proposedUnitPrice || Math.round(bid.unitPrice * 1.10);
    const markupRatio = (targetPrice - bid.unitPrice) / bid.unitPrice;

    bid.countered = true;

    const tolerance = buyer ? buyer.tolerance : 0.08;
    if (markupRatio <= tolerance) {
      bid.unitPrice = targetPrice;
      return {
        ok: true,
        accepted: true,
        newPrice: bid.unitPrice,
        message: `${bid.buyerName} ACCEPTED your counter-offer of $${bid.unitPrice.toLocaleString()}/credit! Click Accept Bid to settle.`
      };
    } else {
      bid.status = 'WITHDRAWN';
      return {
        ok: false,
        accepted: false,
        message: `${bid.buyerName} REJECTED the +${Math.round(markupRatio * 100)}% markup and withdrew their tender.`
      };
    }
  }

  depositToTFD(amount) {
    const cleanAmount = Math.max(0, Math.floor(amount));
    if (cleanAmount <= 0 || this.state.operatingCash < cleanAmount) {
      return { ok: false, message: 'Insufficient operating cash for TFD transfer.' };
    }
    if (this.state.isTfdFullyFunded) {
      return { ok: false, message: 'Total Fund Deposit is already 100% funded!' };
    }

    const actualDeposit = Math.min(cleanAmount, this.state.tfdShortfall);
    this.state.operatingCash -= actualDeposit;
    this.state.tfdCurrentBalance += actualDeposit;

    this.state.ledgerLog.unshift({
      year: this.state.currentYear,
      type: 'TFD_TOPUP',
      description: `Voluntary Landholder TFD Top-Up (+$${actualDeposit.toLocaleString()})`,
      amount: -actualDeposit
    });

    return {
      ok: true,
      deposited: actualDeposit,
      tfdPercent: this.state.tfdPercentFunded,
      message: `Deposited $${actualDeposit.toLocaleString()} into BCT Total Fund Deposit (Now ${this.state.tfdPercentFunded}% funded).`
    };
  }
}
