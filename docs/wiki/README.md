# Biodiversity Stewardship Agreement (BSA) Game Wiki

A first-person ecological management simulation and browser game modeling the New South Wales (NSW) Biodiversity Offsets Scheme (BOS) and Biodiversity Conservation Trust (BCT). Players assume the role of an accredited landholder managing a stewardship site across a 5-year campaign—balancing ecological restoration fieldwork (weed control, feral pest trapping, fence repairs, canopy monitoring) with high-stakes regulatory finance (credit sales, Total Fund Deposit milestones, annual management payments, and strict annual BCT compliance audits).

## Key Concepts

- **Biodiversity Stewardship Agreement (BSA)** — A legally binding agreement registered under the NSW Biodiversity Conservation Act 2016 that generates biodiversity credits in exchange for permanent land conservation.
- **Total Fund Deposit (TFD)** — The statutory capital sum required by the BCT to fund in-perpetuity management of the site. A target of $850,000 must be 100% funded before landholders unlock surplus operational profits.
- **Annual Management Payment (AMP)** — An annual operational budget ($48,250/yr) disbursed by the BCT once the TFD is capitalized to cover seasonal fieldwork, chemicals, and contractor labor.
- **Credit Market Order Book** — Market mechanism where ecosystem credits (PCT-101 Box-Gum Woodland) and threatened species credits (Koala, Regent Honeyeater) are negotiated with infrastructure developers, renewable energy consortiums, and government tenders.
- **5-Year Campaign Lifecycle** — A phased regulatory cycle featuring annual environmental crises (flood washouts, bushfire containment, canopy discoveries) and punitive regulator audits led by Inspector Henderson.
- **Canvas2D 3D Software Renderer** — Custom software perspective projection rendering engine ensuring guaranteed 60 FPS performance without WebGL hardware driver dependencies.

## Entry Points

- [`src/main.js`](../../src/main.js) — Game lifecycle coordinator, player input loop, raycast interaction, HUD state bindings, and audio triggers.
- [`src/ui/OfficeDeskUI.js`](../../src/ui/OfficeDeskUI.js) — The BCT Stewardship Desk overlay (toggled with `O`), housing the 5-Year Campaign Ledger, Credit Market Order Book, Site Map, Supply Depot, and Regulatory Compliance Audit logs.
- [`index.html`](../../index.html) — DOM entry point containing the game canvas, tactile UI overlays, knapsack pressure gauge, root-pop sweet spot minigames, and startup blocker modal.

## High-Level Architecture

The game architecture decouples the high-level regulatory state machine (`src/state/`) from the rendering layer (`src/game/`) and tactile interaction overlays (`src/ui/`). Player actions in the field directly manipulate consumable inventories and target health, while seasonal progression and market settlements update statutory financial ledgers and trigger environmental crises.

See [architecture.md](architecture.md).

## Module Map

| Module | Purpose |
|---|---|
| [`CampaignState`](modules/campaign-state.md) | Central state machine tracking the $850k TFD target, AMP disbursements, credit pools, trust scores, consumables, and perks. |
| [`MarketEngine`](modules/market-engine.md) | Credit market simulation with 4 buyer personas, procedural bid generation, counter-offering, and settlement allocation. |
| [`CrisisManager`](modules/crisis-manager.md) | Orchestrates the 5-year campaign storyline, annual crisis events (flood, fire, species discovery), and BCT audit evaluations. |
| [`Software3DRenderer`](modules/software-renderer.md) | Pure Canvas2D perspective 3D rendering pipeline with depth sorting, terrain grid projection, billboarding, and tool viewmodels. |
| [`PaddockWorld`](modules/paddock-world.md) | Procedural 3D terrain generation, native grassy woodland flora, boundary fences, photo points, and interactable target entities. |
| [`OfficeDeskUI`](modules/office-desk-ui.md) | Full-screen BCT desk interface featuring 5 management tabs: Campaign, Market, Map, Supplies, and Compliance Audit. |
| [`MinigamesUI`](modules/minigames-ui.md) | Tactile minigames including root-pop sweet spot timing, knapsack sprayer pressure pumping, and visual combo notifications. |

## Getting Started

See [getting-started.md](getting-started.md) for local installation, build commands, and player controls.
