# Grudge Studio · Warlords Engine (ThreeFlow)

Grudge fork of [zhangbo126/ThreeFlow](https://github.com/zhangbo126/ThreeFlow) for **Warlords-era** scene layout.

| | |
|--|--|
| **Live** | https://threeflow-grudgenexus.vercel.app/ |
| **Repo** | https://github.com/MolochDaGod/ThreeFlow |
| **Play** | https://grudgewarlords.com |
| **Forge (product editor)** | https://forge.grudge-studio.com/editor |
| **AI worker** | https://ai.grudge-studio.com |

This SPA is a **Warlords layout / library / systems host**. It is **not** a second Forge, not a player DB, and not ThreeFlowX.

Upstream author: **answer / zhangbo126**. License: **AGPL-3.0** — keep logo, project name, and author notice.

## What it is

Vue 3 + Vite + Three.js `^0.185` editor. Left library loads **game-ready CDN GLBs**. Right tabs: Scene · Systems · Script · AI · Project · About.

| Column | Rule |
|--------|------|
| Meshes | `https://assets.grudge-studio.com` only (R2). Unique entity `.glb` — never fused race packs or Unity `.prefab` |
| Index | D1 / ObjectStore catalogs. Prefabs: `client.grudge-studio.com/api/v1/warlords-entity-prefabs.json` |
| Placeables | `objectstore.grudge-studio.com/api/v1/ummorpg-placeables-for-forge.json` — `cdn_ready` **GLB only** |
| Player SSOT | Railway (bag / roster / wallet). Not this editor |
| Physics | One world: `@dimforge/rapier3d-compat` |
| Nav (editor) | `three-pathfinding` from stamped terrain. Play bake stays Forge recast |
| AI motion | threejs-games **idle / wander / patrol / follow / pursue** on Yuka. One mixer on the kit |
| SI | 1 unit = 1 m. Human ~1.8 m. Never squash islands/weapons to 1.2 m |

## Left library

| Filter | What you drop |
|--------|----------------|
| **9 sectors** | Warlords map-registry ids as stamped HD terrain |
| **Captains** | Toon RTS `{race}.glb` — look/layout; play still uses `loadRaceKit` |
| **Units** | Unique `models/warlords/entities/{id}.glb` (archer/warrior per race) |
| **Prefabs** | Same GLBs + `prefabId` / kind / SI / default scripts from the prefab index |
| **Enemies** | Land creatures + skeleton residuals |
| **Weapons** | Verified weapon GLBs + catapult / bolt thrower |
| **Meshes** | Camps, houses, ships, mounts — unique entity GLB |
| **Islands / Scenes** | Home island, pirate lobby, Fruzer, Hoth dojo stand-in |
| **HD zones** | Hard Road DS2 — generate, then Scene → HD terrain deploy pack |
| **D1 / R2 / VFX** | Catalog / binaries / VFX GLBs |

**Skipped on purpose:** `unity_prefab_only`, `.fbx`, `icon_only` (no mesh), `kit_linked` fused `*_characters.glb`, whole `free_survival_asset_kit.glb`. Mage / paladin / merc still need unique GLB bakes.

**New prefab assets:** convert to meshopt GLB (`grudge-asset-convert`) → upload R2 `models/warlords/entities/{slug}.glb` → register ObjectStore + prefab JSON. Do not commit multi-GB binaries to this repo.

On drop, prefabs stamp `userData.warlordsPrefab` plus:

| Kind | Script / collider |
|------|-------------------|
| unit / mount | `behavior=patrol` + MMO aggro/threat/cast + Rapier capsule NPC |
| structure | Terrain / fixed / cuboid |
| siege | Item / fixed / cuboid |
| vehicle | Default / kinematic / cuboid |

Aggro rings: 25 / 15 / 30 / 50 m (`AGGRO_CONFIG`). Skill: `grudge-ai-brains`.

## Systems / Script / AI

- **Systems** — scene templates, BVH, nav zone, Rapier preview, brain stamp, MMO telegraph
- **Script** — three.js editor pad (`THREE`, `scene`, `camera`, `selected`). Play scripts stay on Forge
- **AI** — pop live `ai.*` / Forge worker (not 70 tools copied into Vue)

## Dev / build

```bash
pnpm install
pnpm serve          # Vite, port 1000
pnpm build          # vue-tsc + vite
pnpm bake:hd-terrain
```

Vercel production: `npm install --legacy-peer-deps` (`vercel.json`). Node ≥ 20.

HD deploy pack: drop HD zone → **Scene → HD terrain deploy pack…** → `deploys/hd-terrain/in/` → `pnpm bake:hd-terrain` → R2 put from the JSON. Play keeps the load screen until CDN HEAD 200.

## Stack

| Package | Pin | Role |
|---------|-----|------|
| `three` | ^0.185 | Scene |
| `@dimforge/rapier3d-compat` | ^0.19 | Physics |
| `three-mesh-bvh` | ^0.9 | Terrain queries |
| `three-pathfinding` | ^1.3 | Editor nav |
| `yuka` | ^0.7 | Root steering |
| Vue 3.5 / Vite 6 / Element Plus / Pinia | — | Shell |

## License (AGPL-3.0)

You may use and modify. If you run a modified network service, you must publish that complete source. Keep author notices (logo, name, answer / zhangbo126).

Upstream screenshots: `public/image/demo-1.png`. Commercial ThreeFlowX is a **different product** (`threeflowx.cn`) — not this fork.
