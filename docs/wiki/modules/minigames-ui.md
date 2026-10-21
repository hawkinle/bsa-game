# Module: `MinigamesUI`

Implements tactile, responsive HUD mini-games and procedural audio feedback for manual ecological fieldwork activities.

## Responsibilities

- **Root-Pop Sweet-Spot Ring**: An oscillating contraction ring requiring precise timing when chipping woody weeds with the mattock. Awards critical hits, BAM score multipliers, and combo streaks.
- **Knapsack Sprayer Pressure Gauge**: Analog pressure meter (0 to 4.0 Bar) with a highlighted optimal spray window (2.5 to 3.2 Bar). Sprayers must periodically pump pressure using `R` or secondary click to maintain effective atomization.
- **Wire Strainer Tension Gauge**: Fencing tool overlay simulating wire tensioning with audio pitch feedback.
- **Surveyor Camera Viewfinder**: Optical crosshair reticle overlay with GPS coordinates and alignment telemetry.
- **Inspector Henderson Rubber Stamp Animation**: Heavy visual and acoustic stamp animation slamming BCT approval or breach sanctions across the screen.

## Key Files

- [`src/ui/MinigamesUI.js`](../../../src/ui/MinigamesUI.js) — HUD overlay generation, animation loops, and timing minigame mechanics.
- [`src/game/AudioManager.js`](../../../src/game/AudioManager.js) — Procedural Web Audio API sound synthesis (blade chops, chemical spray hiss, shutter clicks, camera winders).
- [`src/game/ToolViewModel.js`](../../../src/game/ToolViewModel.js) — First-person equipment viewmodel animations and recoil interpolation.

## Public API

### `MinigamesUI` Class

- `constructor(gameInstance: Game)`  
  Builds HUD DOM tree and initializes pressure and combo counters.
- `startRootPop(onResult: (result: { success: boolean, isCrit: boolean, delta: number }) => void): void`  
  Spawns an active contraction ring minigame on screen. Captures player click input and computes radial timing accuracy.
- `pumpPressure(): void`  
  Pumps the chemical knapsack sprayer cylinder (+0.6 Bar up to 4.0 Bar max).
- `consumePressure(dt: number): boolean`  
  Depletes pressure while holding spray trigger; returns `false` if pressure falls below minimum threshold (1.0 Bar).
- `showComboDisplay(title: string, subtitle: string, isCrit: boolean): void`  
  Flashes floating arcade-style combo text and multiplier bonuses across the player HUD.

### `AudioManager` Class

- `playChop(): void` — Synthesizes heavy blade impact thud and metallic gravel scrape.
- `playSpray(): void` — Generates filtered white-noise chemical hiss.
- `playBait(): void` — Plays wooden gate latch drop and bucket rattle.
- `playShutter(): void` — Dual-click mechanical camera shutter with motorized film advance.
- `playAuditSuccess(): void` / `playAuditFailure(): void` — Heavy rubber stamp thump accompanied by celebratory brass or sombre compliance penalty tones.

## Dependencies

- **Used by:** [`src/main.js`](../../../src/main.js), [`Interactables`](paddock-world.md).
- **Uses:** Web Audio API (`AudioContext`), standard DOM APIs.

## Notable Patterns / Gotchas

- **Input Passthrough**: Minigame HUD overlays use `pointer-events-none` on container wraps to prevent blocking mouse look and first-person camera rotation while minigames are active.
