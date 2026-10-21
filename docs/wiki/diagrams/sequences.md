# Sequence Diagrams

## Workflow 1: Biodiversity Credit Negotiation and Statutory Settlement

This workflow traces the credit trading process from viewing buyer bids on the BOS order book to calculating proceeds, allocating capital to the BCT Total Fund Deposit, and issuing transaction certificates.

```mermaid
sequenceDiagram
    participant Landholder as Landholder (Player)
    participant Desk as OfficeDeskUI
    participant Market as MarketEngine
    participant State as CampaignState

    Landholder->>Desk: Presses O (Opens BOS Trading Desk)
    Desk->>State: syncState()
    Desk->>Market: generateBids()
    Market-->>Desk: returns active institutional bids
    Desk-->>Landholder: Displays Apex / Helios / Pinnacle bids

    alt Player Counter-Offers
        Landholder->>Desk: Submits counter-offer ($/unit)
        Desk->>Market: counterOffer(bidId, proposedUnitPrice)
        Market-->>Desk: Evaluates buyer tolerance & returns status
    end

    Landholder->>Desk: Clicks "ACCEPT & RETIRE CREDITS"
    Desk->>Market: acceptBid(bidId)
    Market->>State: applyCreditSaleProceeds(grossProceeds)
    State->>State: Allocate 100% to TFD until $850k threshold
    State-->>Market: { toTFD, toOperational, isTfdFulfilled }
    Market-->>Desk: Trade executed + retirement certificate
    Desk-->>Landholder: Displays updated TFD progress bar & funds
```

### Walkthrough

1. **Desk Activation** — [`src/ui/OfficeDeskUI.js:OfficeDeskUI.open`](../../../src/ui/OfficeDeskUI.js)
2. **Order Generation** — [`src/state/MarketEngine.js:MarketEngine.generateBids`](../../../src/state/MarketEngine.js)
3. **Price Negotiation** — [`src/state/MarketEngine.js:MarketEngine.counterOffer`](../../../src/state/MarketEngine.js)
4. **Statutory Allocation** — [`src/state/CampaignState.js:CampaignState.applyCreditSaleProceeds`](../../../src/state/CampaignState.js)

---

## Workflow 2: Tactile Fieldwork and Weed Eradication Loop

This workflow traces the real-time first-person interaction when a player identifies an invasive woody weed, engages the root-pop sweet-spot minigame with the mattock, and updates paddock ecological condition.

```mermaid
sequenceDiagram
    participant Player as Player (First Person)
    participant Main as Game Controller (src/main.js)
    participant UI as MinigamesUI
    participant Audio as AudioManager
    participant Target as Interactables
    participant State as CampaignState

    Player->>Main: Approaches African Boxthorn & clicks left mouse
    Main->>Main: Raycasts / queries nearest interactable
    Main->>UI: startRootPop(callback)
    UI-->>Player: Spawns contracting radial sweet-spot ring
    Player->>UI: Clicks timing strike
    UI->>UI: Evaluates radial proximity (Sweet-Spot vs Normal)
    UI->>Audio: playChop()
    Audio-->>Player: Heavy blade impact sound
    UI-->>Main: onResult({ success: true, isCrit: true })
    Main->>Target: damageWeed(weed, damageAmount, 'chop')
    Target->>State: Decrements target HP & logs weed knockdown
    Target-->>Main: returns { destroyed: true }
    Main->>UI: showComboDisplay("PERFECT ROOT-POP!", "+100 BAM", true)
    Main-->>Player: Screen flash + floating combo notification
```

### Walkthrough

1. **Raycast Detection** — [`src/main.js:Game.useActiveTool`](../../../src/main.js)
2. **Minigame Timing** — [`src/ui/MinigamesUI.js:MinigamesUI.startRootPop`](../../../src/ui/MinigamesUI.js)
3. **Sound Synthesis** — [`src/game/AudioManager.js:AudioManager.playChop`](../../../src/game/AudioManager.js)
4. **Target Mutation** — [`src/game/Interactables.js:Interactables.damageWeed`](../../../src/game/Interactables.js)

---

## Workflow 3: Annual BCT Compliance Audit and Timeline Progression

This workflow illustrates how end-of-year audits evaluate completed paddock duties, penalize unaddressed environmental crises, update trust ratings, and release annual management payments.

```mermaid
sequenceDiagram
    participant Landholder as Landholder (Player)
    participant Desk as OfficeDeskUI
    participant Crisis as CrisisManager
    participant State as CampaignState
    participant Audio as AudioManager

    Landholder->>Desk: Clicks "CALL INSPECTOR HENDERSON / SUBMIT ANNUAL AUDIT"
    Desk->>Crisis: Inspects crisis resolved status
    Desk->>State: recordAuditAndAdvanceYear(auditMetrics)
    State->>State: Calculate breach infractions & trust score delta
    State->>State: Disburse Annual Management Payment ($48,250)
    State->>State: Advance currentYear (e.g. Year 2 -> Year 3)
    State-->>Desk: { rating, trustDelta, paymentDisbursed }
    Desk->>Audio: playAuditSuccess() / playAuditFailure()
    Desk->>Crisis: loadCrisisForYear(newYear)
    Crisis-->>Desk: Activates next scenario (Flood / Fire / Species Discovery)
    Desk-->>Landholder: Slams BCT Inspector Rubber Stamp & shows new year directive
```

### Walkthrough

1. **Audit Invocation** — [`src/ui/OfficeDeskUI.js:OfficeDeskUI.renderAuditHistoryView`](../../../src/ui/OfficeDeskUI.js)
2. **Statutory Evaluation** — [`src/state/CampaignState.js:CampaignState.recordAuditAndAdvanceYear`](../../../src/state/CampaignState.js)
3. **Crisis Sequencing** — [`src/state/CrisisManager.js:CrisisManager.loadCrisisForYear`](../../../src/state/CrisisManager.js)

---

## Workflow 4: GitHub Pages Automated Build and Deployment Pipeline

This workflow describes the deployment path from local commit to GitHub Actions build, artifact generation, and deployment on GitHub Pages.

```mermaid
sequenceDiagram
    participant Dev as Developer / Git CLI
    participant GitHub as GitHub Remote (hawkinle/bsa-game)
    participant Runner as GitHub Actions Runner
    participant Pages as GitHub Pages CDN

    Dev->>GitHub: git push origin main
    GitHub->>Runner: Triggers workflow (.github/workflows/deploy.yml)
    Runner->>Runner: actions/checkout@v4
    Runner->>Runner: actions/setup-node@v4 (Node 20)
    Runner->>Runner: npm ci
    Runner->>Runner: npm run build (Vite relative base ./)
    Runner->>Runner: actions/upload-pages-artifact@v3 (path: ./dist)
    Runner->>Pages: actions/deploy-pages@v4
    Pages-->>Dev: Live at https://hawkinle.github.io/bsa-game/
```

### Walkthrough

1. **Vite Build Configuration** — [`vite.config.js`](../../../vite.config.js)
2. **GitHub Actions Workflow** — [`.github/workflows/deploy.yml`](../../../.github/workflows/deploy.yml)
