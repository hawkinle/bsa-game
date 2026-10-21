# BSA: Biodiversity Stewardship Simulator

A first-person ecological management and compliance simulator set in rural NSW.

## Overview
Balance hands-on paddock work (weed chipping, feral pig trapping, photo-point monitoring) with the financial and bureaucratic reality of managing a Biodiversity Stewardship Agreement (BSA) under the NSW Biodiversity Conservation Trust (BCT).

---

## 1. Core Architecture & Tech Stack

- **Platform:** Web browser (PC / Desktop Chrome/Firefox/Edge)
- **Engine / 3D Framework:** Three.js / React Three Fiber (R3F) + Vite
- **Styling & UI HUD:** Tailwind CSS / HTML overlay (inventory, compass, GPS, camera viewfinder, clipboard)
- **Physics & Controls:** PointerLockControls (standard FPS WASD + mouse look), raycasting for tool interactions

---

## 2. Paddock & Management Gameplay Loop

### A. Fieldwork Mode (First-Person)
1. **Weed Control:**
   - Equip Mattock / Chip Hoe or 15L Knapsack Sprayer.
   - Target species: African Boxthorn, Coolatai Grass, Tiger Pear.
   - Paddock weed density directly affects annual audit score.
2. **Feral Animal Control (Pigs):**
   - Identify pig rooting along gullies and creeks.
   - Build/check silo mesh box traps, bait with fermented corn, drop gates.
3. **Ecological Monitoring:**
   - **Photo-Points:** Locate tagged star pickets using GPS coordinates, line up the compass bearing and overlay, capture the annual record.
   - **Vegetation Quadrats (BAM Plots):** 20m x 20m / 50m transects assessing native ground cover vs exotic perennials.

### B. Management & Compliance Mode (The Office / Ute Tailgate)
1. **Annual Management Payments:** Submit operational records to claim your scheduled Trust Fund payment.
2. **Operational Budget:** Allocate funds between diesel, bait, herbicide, and fencing materials.
3. **The Regulator Audit:** Annual inspection by BCT compliance officers. Pass and secure next year's operational payment; fail and receive remediation notices and withheld funds.

---

## 3. Preview & Local Execution Alignment

- **Local Preview:** Run `npm run dev` inside `BSA_Game/`.
- **Port:** Served on `http://localhost:5173` (isolated from other running services like the geo stack on :80/:8000).
- **Controls:**
  - `W, A, S, D`: Walk
  - `Mouse`: Look around
  - `Left Click`: Use active tool (chip / spray / bait / snap photo)
  - `1 - 4`: Select tool (1: Mattock, 2: Knapsack, 3: Trap Bait, 4: GPS/Camera)
  - `Tab` or `E`: Toggle Landholder Clipboard & Management Plan
