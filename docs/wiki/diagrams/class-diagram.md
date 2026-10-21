# Class Diagram

## Core Types and Relationships

```mermaid
classDiagram
    class CampaignState {
        +int currentYear
        +int totalYears
        +float tfdTarget
        +float tfdCurrent
        +float operationalCash
        +int inspectorTrust
        +object credits
        +object inventory
        +list annualLedger
        +resetCampaign() void
        +applyCreditSaleProceeds(float grossProceeds, string description) object
        +purchaseSupply(string supplyId) bool
        +unlockPerk(string perkId) bool
        +recordAuditAndAdvanceYear(object auditData) object
    }

    class MarketEngine {
        +CampaignState state
        +list activeBids
        +list marketHistory
        +list buyers
        +generateBids() list
        +acceptBid(string bidId, float customQuantity) object
        +counterOffer(string bidId, float proposedUnitPrice) object
        +depositToTFD(float amount) object
    }

    class CrisisManager {
        +CampaignState state
        +object activeCrisis
        +object crisisCatalog
        +loadCrisisForYear(int year) object
        +resolveActiveCrisis() object
    }

    class Software3DRenderer {
        +HTMLCanvasElement domElement
        +CanvasRenderingContext2D ctx
        +int width
        +int height
        +setSize(int w, int h) void
        +render(Scene scene, Camera camera, Interactables interactables, string activeTool, ToolViewModel toolView) void
        +drawWaypoints(CanvasRenderingContext2D ctx, Matrix4 viewMat, float fovScale, float halfW, float halfH, Interactables interactables) void
        +drawFirstPersonTool(CanvasRenderingContext2D ctx, int W, int H, string activeTool, ToolViewModel toolView) void
    }

    class World {
        +Scene scene
        +list colliders
        +DirectionalLight sun
        +init() void
        +getHeightAt(float x, float z) float
        +createTerrain() void
        +createFences() void
        +createRegulatorHilux() void
    }

    class Interactables {
        +Scene scene
        +World world
        +list weeds
        +list photoPoints
        +object pigTrap
        +init() void
        +spawnWeeds() void
        +damageWeed(object weed, float damage, string mode) object
        +baitPigTrap() object
        +capturePhotoPoint(object pp) object
        +reset() void
    }

    class OfficeDeskUI {
        +Game game
        +CampaignState campaignState
        +MarketEngine marketEngine
        +bool isOpen
        +string activeTab
        +open() void
        +close() void
        +toggle() void
        +setTab(string tabId) void
        +syncState() void
        +renderTab() void
    }

    class MinigamesUI {
        +Game game
        +int comboCount
        +float pressure
        +bool isSpraying
        +startRootPop(function onResult) void
        +pumpPressure() void
        +consumePressure(float dt) bool
        +showComboDisplay(string title, string subtitle, bool isCrit) void
    }

    MarketEngine --> CampaignState : modifies
    CrisisManager --> CampaignState : evaluates
    OfficeDeskUI --> CampaignState : reads and displays
    OfficeDeskUI --> MarketEngine : triggers trades
    Interactables --> CampaignState : deducts inventory
    Interactables --> World : queries height
    Software3DRenderer --> World : renders
    Software3DRenderer --> Interactables : renders waypoints
```

## Notes

- **Separation of Simulation & Rendering**: `CampaignState` and `MarketEngine` have zero dependencies on Canvas or DOM libraries, enabling headless automated unit testing.
- **UI State Synchronization**: `OfficeDeskUI` reads directly from `CampaignState` and calls `syncState()` every time the player presses `O`, guaranteeing that financial balances and market order books always reflect real-time transactions.
