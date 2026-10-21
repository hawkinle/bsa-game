# Getting Started

## Prerequisites

- **Node.js**: Version 18.0.0 or higher (v20+ recommended).
- **npm**: Version 9.0.0 or higher.
- **Web Browser**: Any modern evergreen browser (Chrome, Firefox, Safari, Edge) supporting ES2020 modules and HTML5 Canvas2D. Hardware WebGL is **not** required.

## Installation

Clone the repository and install dependencies:

```bash
git clone git@github.com:hawkinle/bsa-game.git
cd bsa-game
npm install
```

## Running Locally

To launch the local Vite development server with hot module replacement:

```bash
npm run dev
```

Open your browser to:
🔗 `http://localhost:5173`

Click anywhere on the start screen to capture pointer lock and enter the paddock.

## Production Build

To compile and bundle the production release for static hosting:

```bash
npm run build
```

The compiled output is emitted to `./dist/` with relative asset links (`base: './'`), ready for direct deployment on any static web host, CDN, or GitHub Pages.

## Gameplay Controls Cheatsheet

| Key / Action | Function |
|---|---|
| **W, A, S, D** | Walk forward, left, backward, right across the paddock |
| **Shift** | Sprint (1.8x movement speed) |
| **Mouse Look** | Rotate first-person camera view |
| **Left Click** | Use active tool / strike weed crown / trigger photo capture |
| **1** | Select **Mattock** (physical root-chipping & crown cracking) |
| **2** | Select **Knapsack Sprayer** (chemical spot-spraying) |
| **3** | Select **Feral Pig Bait** (bucket for arming the creek silo trap) |
| **4** | Select **BCT GPS Camera** (photopoint monitoring post verification) |
| **R** / **Right Click** | Pump knapsack chemical pressure (+0.6 Bar) |
| **O** | Open / Close the **BCT Management & Trading Desk** |
| **Escape** | Close open modals / Release pointer lock |

## Configuration Files

- [`vite.config.js`](../../vite.config.js) — Defines the development server port (`5173`) and sets `base: './'` for subdirectory hosting on GitHub Pages.
- [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) — GitHub Actions CI/CD automation deploying the `./dist` directory on every push to the `main` branch.
- [`package.json`](../../package.json) — NPM scripts (`dev`, `build`, `preview`) and core dependencies.

## Live Deployment

The game is deployed and hosted on GitHub Pages at:
🔗 [**https://hawkinle.github.io/bsa-game/**](https://hawkinle.github.io/bsa-game/)

## Where to Go Next

- System Architecture: [architecture.md](architecture.md)
- Core State Engine: [modules/campaign-state.md](modules/campaign-state.md)
- Credit Market Simulation: [modules/market-engine.md](modules/market-engine.md)
- Complete Module Map: [README.md#module-map](README.md#module-map)
