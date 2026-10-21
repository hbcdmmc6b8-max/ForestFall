# FORESTFALL 🌲
A playable **3D forest fighting prototype** made with [Three.js](https://threejs.org/). No VS Code, Node installation, or build tooling required.

## Play
Once GitHub Pages is enabled for this repository, the game lives at:
**https://hbcdmmc6b8-max.github.io/ForestFall/**

To enable it: Repository → **Settings** → **Pages** → **Build and deployment** → Source: **GitHub Actions**. The included `.github/workflows/pages.yml` automatically publishes the site on pushes to `main`.

## What's in alpha 0.1?
- Procedural forest arena with trees, rocks, ruins, sunlight and atmospheric fog
- Third-person character movement, sprint, jump and dash
- Three weapons: starter **Iron Sword**, unlockable **Twin Daggers** and **War Hammer**
- Three weapon-specific special attacks: Whirlwind, Blade Rush, Earth Shock
- Combo attacks, blocking, cooldowns, knockback and hit particles
- Four forest sentinels that approach, telegraph attacks, deal damage and respawn
- Coins on eliminations, a weapon arsenal, and local saved unlocks
- Desktop keyboard/mouse controls and on-screen mobile joystick/buttons

## Controls
| Action | Desktop | Phone/tablet |
| --- | --- | --- |
| Move | WASD | Left joystick |
| Aim/look | Mouse (click Enter to capture) | Drag on world |
| Attack | Left click | ATTACK |
| Block | Right click or F | Shield button (hold) |
| Dash | Q | DASH |
| Weapon special | E | SKILL |
| Jump | Space | *Desktop only in alpha 0.1* |
| Sprint | Left Shift | *Desktop only in alpha 0.1* |
| Arsenal | B or ARSENAL button | ARSENAL button |
| Pause | Escape | PAUSE button |

## Implementation
Files: `index.html` (UI), `style.css` (presentation), `game.js` (rendering and gameplay). The game imports a pinned Three.js ES module from jsDelivr, so **an internet connection is required** for the game engine to load.

This is a **single-player vertical slice**; multiplayer, online accounts, servers and reliable cross-device save syncing are not implemented. Saves are in localStorage on each device.

## Planned next upgrades
Proper mobile jump and sprint, improved animation/sounds, combo polish, multiple arenas, new weapons and abilities, then authoritative multiplayer networking.

Created as an original prototype; no Roblox RIVALS assets are included.
