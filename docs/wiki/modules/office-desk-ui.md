# Module: `OfficeDeskUI`

Provides the full-screen BCT Stewardship Management Desk modal, connecting regional market demand, credit trading, TFD progress tracking, equipment procurement, and statutory audit reviews.

## Responsibilities

- Renders an authentic Australian rural landholder's regulatory desk interface.
- Hosts 5 distinct operational tabs:
  1. **Regional Demand Heatmap (`demand`)** — Displays credit shortages, major infrastructure developments, and offset demand across NSW bioregions (Brigalow Belt South, Nandewar, Sydney Basin).
  2. **Credit Market Order Book (`market`)** — Interactive bidding desk where players review institutional offers, negotiate counter-offers, accept bids, and review transaction certificates.
  3. **BCT Treasury & TFD Milestone (`treasury`)** — Tracks progress toward the $850,000 statutory deposit and annual management payment schedules.
  4. **Tailgate Supply & Gear Shop (`shop`)** — Purchase equipment upgrades (quad bike, slip-on spray ute, SongMeter acoustic detectors) and consumables.
  5. **5-Year Compliance Audit Log (`audit_history`)** — Historical archive of Inspector Henderson's annual findings, audit ratings, and trust scores.
- Pauses spatial simulation and releases pointer lock when open.

## Key Files

- [`src/ui/OfficeDeskUI.js`](../../../src/ui/OfficeDeskUI.js) — Desk DOM modal creation, tab switching, and reactive render methods.

## Public API

### Methods

- `constructor(gameInstance: Game, campaignState: CampaignState = null, marketEngine: MarketEngine = null)`  
  Constructs the desk controller and injects game and state engine dependencies.
- `open(): void`  
  Displays the modal, unlocks pointer controls, and triggers `syncState()` and `renderTab()`.
- `close(): void`  
  Hides the desk modal and returns focus to the 3D paddock simulation.
- `toggle(): void`  
  Toggles open/closed state (bound to the `O` key).
- `setTab(tabId: string): void`  
  Switches active tab view (`demand` | `market` | `treasury` | `shop` | `audit_history`).
- `syncState(): void`  
  Pulls real-time values from `CampaignState` and `MarketEngine` to refresh UI displays.

## Dependencies

- **Used by:** [`src/main.js`](../../../src/main.js).
- **Uses:** [`CampaignState`](campaign-state.md), [`MarketEngine`](market-engine.md).

## Notable Patterns / Gotchas

- **DOM Caching**: Modals and tab content are generated once upon instantiation (`initDOM()`) and selectively shown/hidden via CSS, avoiding heavy DOM reconstruction during gameplay.
- **Escape Key Handling**: Pressing `Escape` automatically closes the desk modal before releasing browser pointer lock.
