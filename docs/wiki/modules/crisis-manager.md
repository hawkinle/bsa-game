# Module: `CrisisManager`

Coordinates narrative campaign progression, multi-year ecological crises, biosecurity threats, and annual statutory compliance audits by the NSW BCT.

## Responsibilities

- Sequences the 5-year campaign storyline with authentic Australian climatic and ecological challenges.
- Controls emergency intervention actions (fence washout repairs, BAM variation lodgements, slip-on fire suppression).
- Enforces statutory penalties if crises are left unmitigated during the annual audit.

## Key Files

- [`src/state/CrisisManager.js`](../../../src/state/CrisisManager.js) — Crisis catalog, event state transitions, and special intervention handlers.

## Public API

### Methods

- `constructor(campaignState: CampaignState)`  
  Links the manager to the active campaign ledger.
- `loadCrisisForYear(year: number): CrisisEvent`  
  Loads and activates the crisis scenario corresponding to the current campaign year (1 through 5).
- `resolveActiveCrisis(): { success: boolean, message: string }`  
  Executes the special action associated with the active crisis. Validates inventory supplies (e.g. fencing wire, farm diesel) or emergency contractor cash reserves, updates target state, and awards ecological bonuses.

## Campaign Storyline Catalog

| Year | Event Identifier | Badge / Threat | Directive & Stakes |
|---|---|---|---|
| **Year 1** | `year1_inception` | `SCHEDULE 3 BASELINE` | Baseline establishment: Eradicate initial woody weeds (African Boxthorn, Coolatai Grass), bait the creek feral pig trap, and photo-monitor plots before Inspector Henderson's first visit. |
| **Year 2** | `year2_flood` | `⚠️ BIOSECURITY & GRAZING BREACH RISK` | La Niña flash flood washes out 40m of boundary fencing; stray cattle breach Zone 1. Requires 1x Fencing Bundle or $1,200 emergency contractor. |
| **Year 3** | `year3_species_discovery` | `🌿 ECOLOGICAL VARIATION OPPORTUNITY` | Regent Honeyeater pair and Koala maternal joey sighted near PP-01. Lodging a BAM Variation ($1,500 assessor fee) mints +8 Regent Honeyeater and +4 Koala species credits. |
| **Year 4** | `year4_bushfire` | `🔥 EMERGENCY ASSET PROTECTION` | El Niño dry lightning grassfire threatens hollow-bearing habitat trees. Requires deploying the ute slip-on fire unit (40L Diesel or $1,800 contractor). |
| **Year 5** | `year5_comprehensive_audit` | `🏛️ FIVE-YEAR TRUST MILESTONE` | Final statutory review. 100% fieldwork compliance and >85% TFD capitalization required to unlock the in-perpetuity stewardship dividend. |

## Dependencies

- **Used by:** [`OfficeDeskUI`](office-desk-ui.md), [`main.js`](../../../src/main.js).
- **Uses:** [`CampaignState`](campaign-state.md).

## Notable Patterns / Gotchas

- **Breach Escalation**: Failing to resolve an active crisis prior to calling `recordAuditAndAdvanceYear()` results in automatic regulatory breach points (-15 to -25 Inspector Trust) and forfeiture of the annual management payment.
