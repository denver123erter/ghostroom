# 🏚️ 3D Horror Room Explorer (Three.js & WebGL)

A browser-based first-person interactive 3D horror room exploration experience built with Three.js, WebGL, and modern TypeScript.

---

## 🌟 Features

- **True 3D Geometry**: Full 8m x 8m abandoned Victorian horror room with detailed 3D architecture, wooden baseboards, ceiling beams, double-hung windows, openable wooden door, Victorian bed, nightstand with melting candle, antique wardrobe with slideable drawer, study desk with rotary radio, framed wall paintings, and the haunted rocking chair.
- **First-Person Controller**: Human eye height (1.65m), WASD / Arrow keys, continuous hold on-screen D-Pad (↑, ← ↓ →) for mobile/touch, mouse Pointer-Lock, and touch-drag look rotation.
- **Physics & Collision Detection**: Real-time bounding box / capsule collision prevention against all 4 perimeter walls, doors, and furniture obstacles with smooth sliding along obstacles.
- **Atmospheric Lighting**: Very low ambient light, cold blue moonlight pouring through the north window panes with soft shadow mapping, flickering hanging ceiling lamp, and togglable player flashlight (`F` key).
- **Procedural Web Audio Engine**: Generates realistic continuous ambient sub-drone, wind howling through the window, dusty floorboard creaks, footstep thuds synced to walking pace, double heartbeat thumps, electrical bulb buzzing, whispers, and jump scare stingers without requiring external audio files.
- **Reusable Horror Event System**:
  - **The Smiling Woman Event**: Approaching the empty wooden corner chair triggers a suspenseful pause, bulb flicker and electrical spark, brief darkness, and reveals a pale 3D woman sitting silently on the chair facing you. When looking away and looking back, she vanishes.
  - **Window Breeze Event**: Approaching the north window triggers a cold gust, ghost whisper, and shivering curtains.
  - **Floorboard Groan & Wardrobe Scratch**: Spatial proximity triggers throughout the room.
- **Interactive Objects**:
  - Open/Close heavy wooden door with realistic creak
  - Open/Close wardrobe drawer to reveal key
  - Toggle ceiling light fixture
  - Turn antique radio dial
  - Read recover diary pages & clinical case notes
  - Inspect the haunted chair and fogged window

---

## 📁 Project Structure

```
├── public/
│   └── assets/
│       ├── models/       <- Place custom .glb / .gltf 3D character or furniture models here
│       ├── textures/     <- Place optional custom texture maps (diffuse, normal, roughness)
│       └── audio/        <- Place optional custom sound files (.mp3, .wav, .ogg)
├── src/
│   ├── audio/
│   │   └── SoundSystem.ts        <- Web Audio synthesizer & external file loader
│   ├── engine/
│   │   ├── EventSystem.ts        <- Horror trigger manager & Smiling Woman event
│   │   ├── InteractionSystem.ts  <- Raycasting & interactive object handlers
│   │   ├── PlayerController.ts   <- First-person camera, movement, & collision detection
│   │   ├── RoomBuilder.ts        <- 3D Room geometry builder & GLTF model loader hooks
│   │   ├── SceneManager.ts       <- Three.js rendering loop, lights, & atmosphere
│   │   └── TextureGenerator.ts   <- High-fidelity procedural canvas texture engine
│   ├── components/
│   │   └── HorrorUI.tsx          <- HUD, D-Pad, Crosshair, Note Reader & Modals
│   ├── types.ts                  <- TypeScript definitions & interfaces
│   ├── App.tsx                   <- Main application entry component
│   └── main.tsx
├── package.json
└── vite.config.ts
```

---

## 🚀 Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

---

## 🔄 Replacing Placeholder Assets with GLB/GLTF Models

To replace the procedural 3D room, chair, or character with custom `.glb` / `.gltf` 3D models:

1. Copy your `.glb` file into `public/assets/models/` (e.g., `public/assets/models/ghost_woman.glb`).
2. In `src/engine/RoomBuilder.ts`, call `RoomBuilder.loadGLBModel()`:

```typescript
RoomBuilder.loadGLBModel('/assets/models/ghost_woman.glb', (gltf) => {
  const model = gltf.scene;
  model.position.set(-2.2, 0, 2.0);
  model.rotation.y = Math.PI * 0.25;
  scene.add(model);
});
```

*Note: If the external model fails to load or is not found, the app automatically falls back to the built-in procedural geometry with zero crashes.*

---

## 🔊 Using Custom Audio Files

To replace procedural sounds with real `.mp3` or `.wav` recordings:

1. Place your audio files in `public/assets/audio/` (e.g., `public/assets/audio/creak.mp3`).
2. In your code, load the file using:

```typescript
import { soundSystem } from './audio/SoundSystem';

await soundSystem.loadSoundFile('door', '/assets/audio/door_creak.mp3');
await soundSystem.loadSoundFile('ambient', '/assets/audio/dark_drone.mp3');
```

---

## 🌐 Deploying to Static Hosting

This project is 100% client-side WebGL and can be deployed to any static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages, Firebase Hosting):

1. **Build the production bundle:**
   ```bash
   npm run build
   ```

2. **Deploy the generated `dist/` directory:**
   - **Vercel / Netlify**: Connect repository with build command `npm run build` and output directory `dist`.
   - **GitHub Pages**: Deploy the `dist` folder via `gh-pages` or GitHub Actions.
   - **Surge / Firebase**: `npx surge dist` or `firebase deploy`.
