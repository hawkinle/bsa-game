# Module: `PaddockWorld`

Constructs and populates the 3D paddock environment, terrain elevation, ecological entities, and fieldwork interaction targets.

## Responsibilities

- Generates undulating paddock terrain with natural height variation and native grassy groundcover.
- Places environmental features: White Box and Ironbark trees, fallen hollow habitat logs, perimeter star-picket wire fences, and Inspector Henderson's Toyota Hilux regulatory truck.
- Spawns and manages life-cycles of declared priority weeds (African Boxthorn & Coolatai Grass).
- Manages the creek gully feral pig silo-mesh trap and permanent photo-point monitoring star-pickets (PP-01 and PP-02).

## Key Files

- [`src/game/World.js`](../../../src/game/World.js) — Terrain geometry, lighting, tree placement, boundary fences, and ambient environment setup.
- [`src/game/Interactables.js`](../../../src/game/Interactables.js) — Spawns, tracks, and modifies interactive ecological targets (weeds, pig trap, photo posts).

## Public API

### `World` Class

- `constructor(scene: THREE.Scene)`  
  Initializes lighting, sky, terrain heightmap, perimeter fencing, and vegetation.
- `getHeightAt(x: number, z: number): number`  
  Calculates continuous terrain elevation at any 2D world coordinate using compound sinusoidal elevation equations.
- `createFences(): void`  
  Constructs star-picket posts and 4-strand high-tensile wire perimeter fences defining site boundaries.
- `createRegulatorHilux(): void`  
  Constructs the NSW BCT Toyota Hilux ute parked at the paddock entrance gate.

### `Interactables` Class

- `constructor(scene: THREE.Scene, world: World)`  
  Binds interactables to the scene graph and world heightmap.
- `spawnWeeds(): void`  
  Spawns 6 declared weed nodes (woody African Boxthorn with thorns, and tussock Coolatai grass).
- `spawnPigTrap(): void`  
  Places a steel silo-mesh box trap with guillotine gate in the creek gully.
- `spawnPhotoPoints(): void`  
  Places yellow-topped galvanized reference star-pickets marked `PP-01` and `PP-02`.
- `damageWeed(weed: Object, damageAmount: number, mode: 'chop' | 'spray'): { destroyed: boolean, remainingHp: number }`  
  Applies manual chipping damage or herbicide knockdown to a targeted weed entity.
- `baitPigTrap(): { success: boolean, message: string }`  
  Consumes fermented grain bait, arming the trigger plate for overnight feral pig trapping.
- `capturePhotoPoint(pp: Object): { success: boolean, message: string }`  
  Captures annual photographic monitoring records required by BCT Schedule 3.
- `reset(): void`  
  Clears and respawns all entities for the subsequent campaign year.

## Dependencies

- **Used by:** [`Software3DRenderer`](software-renderer.md), [`src/main.js`](../../../src/main.js).
- **Uses:** `three.module.js`, [`CampaignState`](campaign-state.md).

## Notable Patterns / Gotchas

- **Procedural Height Alignment**: All interactables, trees, and fence pickets query `world.getHeightAt(x, z)` during instantiation to ensure perfect ground contact regardless of terrain slopes.
