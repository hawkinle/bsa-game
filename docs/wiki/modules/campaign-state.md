# Module: `CampaignState`

The statutory and operational ledger engine maintaining all persistent campaign data across the 5-year Biodiversity Stewardship Agreement lifecycle.

## Responsibilities

- Tracks the statutory Total Fund Deposit ($850,000 target) and annual management payment disbursements ($48,250/yr).
- Manages credit asset inventories across ecosystem credits (PCT-101 Box-Gum Woodland) and species credits (Koala, Regent Honeyeater).
- Records annual BCT audit ratings, breach infractions, and Inspector Henderson's trust score (0–100%).
- Manages fieldwork consumables (herbicide, feral pig baits, fencing wire) and operational upgrades.

## Key Files

- [`src/state/CampaignState.js`](../../../src/state/CampaignState.js) — Core state class definition and exported singleton instance (`campaignState`).

## Public API

### Singleton Export

- `const campaignState: CampaignState` — Global singleton instance holding the active game state.

### Methods

- `resetCampaign(): void`  
  Reinitializes all state variables to default Day 1 Year 1 starting conditions ($0 TFD, $48,250 cash, default credit pools, 50% trust).
- `applyCreditSaleProceeds(grossProceeds: number, description: string = 'Biodiversity Credit Transfer'): { toTFD: number, toOperational: number, isTfdFulfilled: boolean }`  
  Allocates credit transaction proceeds. Automatically diverts 100% of revenue to the TFD until the $850,000 threshold is satisfied; any surplus is credited to operational cash.
- `purchaseSupply(supplyId: string): boolean`  
  Deducts cash and increments inventory for chemical supplies (`herbicide_drum`), pig bait (`pig_bait_box`), or fence wire rolls (`fence_wire_roll`). Returns `false` if funds are insufficient.
- `unlockPerk(perkId: string): boolean`  
  Unlocks operational equipment perks (`ute_rack`, `quad_bike`, `drone_survey`, `thermal_scope`) if credit balance meets requirement.
- `recordAuditAndAdvanceYear({ breaches: number, tasksCompleted: number, totalTasks: number, crisisResolved: boolean }): { rating: string, trustDelta: number, paymentDisbursed: number }`  
  Evaluates annual performance, adjusts trust score, releases the next annual AMP installment, logs historical ledger records, and advances `currentYear`.

## Internal Structure

```javascript
{
  siteDetails: { bsaNumber: "BSA-2026-089", siteName: "Ironbark Ridge", areaHa: 142.5 },
  currentYear: 1,
  totalYears: 5,
  tfdTarget: 850000,
  tfdCurrent: 0,
  annualManagementPayment: 48250,
  operationalCash: 48250,
  inspectorTrust: 50,
  credits: {
    ecosystem: [ { id: 'pct101', name: 'PCT 101 Box-Gum Grassy Woodland', initial: 120, available: 120, retired: 0, priceFloor: 7500 } ],
    species: [
      { id: 'koala', name: 'Phascolarctos cinereus (Koala)', initial: 45, available: 45, retired: 0, priceFloor: 4200 },
      { id: 'honeyeater', name: 'Anthochaera phrygia (Regent Honeyeater)', initial: 0, available: 0, retired: 0, priceFloor: 12500 }
    ]
  },
  inventory: { herbicideLiters: 25, pigBaits: 8, fenceWireMeters: 150 },
  annualLedger: []
}
```

## Dependencies

- **Used by:** [`MarketEngine`](market-engine.md), [`CrisisManager`](crisis-manager.md), [`OfficeDeskUI`](office-desk-ui.md), [`Interactables`](paddock-world.md).
- **Uses:** Native JavaScript primitives, ES module export.

## Notable Patterns / Gotchas

- **Statutory TFD Lock**: Landholders cannot withdraw capital from credit sales until `tfdCurrent >= tfdTarget`. Any UI presenting sales revenue must reflect this statutory partition.
- **Trust Penalties**: If `inspectorTrust` drops below 25%, the BCT issues formal remediation notices and halts subsequent annual management payments.
