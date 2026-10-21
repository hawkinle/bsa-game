# Module: `MarketEngine`

Simulates the NSW Biodiversity Offsets Scheme (BOS) credit market, demand generation, bid negotiation, and settlement execution.

## Responsibilities

- Generates commercial bids from diverse institutional buyer personas based on urgency, credit type, and project scale.
- Simulates counter-offer negotiations, allowing players to bargain unit prices within buyer tolerance bands.
- Settles transactions by deducting credit inventory, crediting statutory accounts, and generating compliance transaction certificates.

## Key Files

- [`src/state/MarketEngine.js`](../../../src/state/MarketEngine.js) — Market engine implementation and buyer persona definitions.

## Public API

### Methods

- `constructor(campaignState: CampaignState)`  
  Binds the market engine to the central campaign state.
- `generateBids(): Array<Bid>`  
  Generates 3–5 procedural bids based on available credit inventory and buyer profiles:
  - **Apex Infrastructure Consortium** (`apex_infra`): State Significant Infrastructure (SSI) with high urgency and +32% premium on Box-Gum and Koala credits.
  - **Helios New England Renewables** (`helios_solar`): 400MW Solar project purchasing bulk volume Box-Gum credits at an 8% discount.
  - **Pinnacle Regional Developments** (`pinnacle_estates`): Peri-urban residential subdivision seeking targeted Koala and Regent Honeyeater species credits.
  - **NSW Biodiversity Conservation Trust** (`bct_tender`): Government conservation tender offering fixed fair-value benchmark pricing.
- `acceptBid(bidId: string, customQuantity: number = null): { success: boolean, grossProceeds: number, message: string }`  
  Executes sale. Deducts credit units, routes gross revenue to `CampaignState.applyCreditSaleProceeds()`, logs market history, and removes the accepted bid.
- `counterOffer(bidId: string, proposedUnitPrice: number = null): { status: 'accepted' | 'rejected' | 'countered', newPrice: number, message: string }`  
  Calculates whether the proposed unit price falls within the buyer's tolerance threshold. If accepted, updates bid price; if rejected, the buyer may withdraw or counter.
- `depositToTFD(amount: number): { success: boolean, message: string }`  
  Allows manual direct transfer of operational cash into the statutory Total Fund Deposit account to expedite compliance milestones.

## Internal Structure

Each `Bid` object contains:
```javascript
{
  id: "bid_apex_pct101_1729000000",
  buyerId: "apex_infra",
  buyerName: "Apex Infrastructure Consortium",
  creditId: "pct101BoxGum",
  creditName: "PCT 101 Box-Gum Grassy Woodland CEEC",
  quantity: 24,
  unitPrice: 9900,
  totalOffer: 237600,
  expiryDays: 45,
  status: "PENDING" // 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
}
```

## Dependencies

- **Used by:** [`OfficeDeskUI`](office-desk-ui.md).
- **Uses:** [`CampaignState`](campaign-state.md).

## Notable Patterns / Gotchas

- **Counter-Offer Risk**: Over-pricing bids beyond buyer tolerance risks immediate bid withdrawal, leaving the landholder without liquidity during critical compliance seasons.
- **Credit Retirement Certificate**: On acceptance, credits are marked as permanently retired, preventing double-selling.
