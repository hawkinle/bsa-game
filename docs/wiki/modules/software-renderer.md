# Module: `Software3DRenderer`

A high-performance, fault-tolerant 3D perspective projection renderer implemented on an HTML5 Canvas2D context.

## Responsibilities

- Transforms Three.js scene-graph objects into 2D camera viewport coordinates using custom matrix projection math.
- Draws an Australian paddock atmosphere: hazy golden-hour sky, horizon gradients, distant ridge lines, and perspective ground lines.
- Renders 3D billboarding trees, native grasses, star-picket wire fences, and vehicles.
- Projects interactive waypoint markers with distance telemetry and target classification badges.
- Renders first-person tool viewmodels (mattock, knapsack lance, bait bucket, inspection camera) directly in screen space with animated recoil and bob.

## Key Files

- [`src/game/Software3DRenderer.js`](../../../src/game/Software3DRenderer.js) — Pure Canvas2D 3D software rendering pipeline.

## Public API

### Methods

- `constructor(container: HTMLElement)`  
  Creates the full-screen canvas element, acquires the 2D rendering context, and appends it to the DOM container.
- `setSize(w: number, h: number): void`  
  Resizes internal canvas buffer and CSS display dimensions to match viewport changes.
- `render(scene: THREE.Scene, camera: THREE.Camera, interactables: Interactables, activeTool: string, toolView: ToolViewModel): void`  
  Executes the frame render pass:
  1. Computes inverse camera matrix and FOV scaling factor.
  2. Renders sky gradient and distant mountain silhouettes.
  3. Projects perspective ground grid lines across the paddock plane.
  4. Collects and z-sorts 3D entities (trees, fences, weeds, pig traps, Hilux) back-to-front.
  5. Rasterizes billboards, cylinders, and wire segments.
  6. Executes `drawWaypoints()` for active quest markers.
  7. Executes `drawFirstPersonTool()` for active equipment.
- `drawWaypoints(ctx: CanvasRenderingContext2D, viewMat: THREE.Matrix4, fovScale: number, halfW: number, halfH: number, interactables: Interactables): void`  
  Calculates screen coordinates for weed clusters, pig traps, and photo points; renders glowing reticles, distance indicators (e.g. `14m`), and action labels.
- `drawFirstPersonTool(ctx: CanvasRenderingContext2D, W: number, H: number, activeTool: string, toolView: ToolViewModel): void`  
  Draws responsive first-person equipment models in the lower-right foreground, animating strike arcs, chemical spray plumes, and camera shutter flashes.

## Dependencies

- **Used by:** [`src/main.js`](../../../src/main.js).
- **Uses:** `three.module.js` (for Vector3/Matrix4 mathematical primitives and Scene/Camera object structures).

## Notable Patterns / Gotchas

- **Zero-WebGL Architecture**: Bypasses `WebGLRenderer` entirely. Guarantees 60 FPS on headless cloud browsers, low-power laptops, and Linux environments where GPU drivers may disable WebGL contexts.
- **Back-to-Front Depth Sorting**: Objects are projected into camera space, filtered by positive $Z$ (in front of near plane), and sorted by distance before rasterization to eliminate clipping artifacts.
