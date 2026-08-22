<template>
  <div class="help-describe">
    <div class="help-describe-title">About</div>
    <div class="help-describe-content about-block">
      <p>
        <strong>Edit</strong> — W move · E rotate · R scale · F frame selected
        in camera (keeps look direction) · G ground.
        <strong>Scene</strong> menu: Clear · Open · Save · Push assets.
        Left rails: World · Assets · Place · HUD · Game · Deploy. HUD frames
        and managers live in the Scene tree as parent/child. Hierarchy
        <strong>RMB</strong>: save mesh GLB / push / delete. Drag nodes to
        reparent.
        <strong>Shift+Ctrl+LMB drag</strong> a span that should be
        <strong>2 m</strong>, release — uniform scale so that length is 2 metres
        (1 unit = 1 m). RMB drag empty viewport pans. HUD stays 1920×1080.
      </p>
      <p>
        <strong>Grudge Studio · Warlords Engine</strong> — fork of ThreeFlow for
        era layout. Live
        <a href="https://threeflow.vercel.app/" target="_blank"
          >threeflow.vercel.app</a
        >. Not a second Forge, not ThreeFlowX, not a player database.
      </p>
      <p>
        <strong>Captains</strong> — Toon RTS
        <code>asset-packs/toon-rts-characters/glb/characters/{race}.glb</code>.
        This editor places the kit. Play still uses <code>loadRaceKit</code>.
      </p>
      <p>
        <strong>Prefabs</strong> — Warlords entity index
        (<code>warlords-entity-prefabs.json</code>) bound to unique
        <code>models/warlords/entities/*.glb</code>. File type is
        <strong>meshopt GLB on CDN</strong>. Skipped: Unity
        <code>.prefab</code>, FBX, <code>icon_only</code>, fused
        <code>*_characters.glb</code> kits, whole survival packs. Drop stamps
        <code>prefabId</code> + SI + scripts (unit patrol/aggro, structure
        collider). New meshes: convert → R2 → register. Do not git-blob them.
      </p>
      <p>
        <strong>Units / buildings / ships / siege</strong> — ObjectStore
        <code>ummorpg-placeables-for-forge.json</code>,
        <code>cdn_ready</code> GLB only. Mage / paladin / merc still point at
        race FBX kits and are not listed until unique GLBs exist.
      </p>
      <p>
        <strong>Enemies</strong> — drake, ifrit, lava golem, reptile, monster
        pack, crab, skeleton residuals.
      </p>
      <p>
        <strong>Weapons</strong> — verified CDN meshes plus catapult / bolt
        thrower. Fantasy Weapons still FBX-only stay out of the list.
      </p>
      <p>
        <strong>Terrain three-system</strong> —
        <a
          href="https://github.com/MolochDaGod/stylized-components"
          target="_blank"
          >stylized-components</a
        >
        (Cortiz, MIT). Look + nav + collider on seafloor / mountain / tropical.
        Tropical and mountain bind
        <a
          href="https://github.com/MolochDaGod/stylized-components/tree/main/src/components/grassField"
          target="_blank"
          >GrassField</a
        >
        on the real mesh (area-weighted blades, shared dirt, procedural
        flowers). The left <strong>Sectors · DS2</strong> folder is the 9
        Warlords 10 km cells (ethereal_falls … ember_depths) — Hard Road DS2
        bakes, not islands. Islands sit on those cells. Live DS2 generates a new
        mesh. Seafloor 3×3 tiles all nine. Seafloor has no grass. Harvest stays
        nodes. WaterFloor atmosphere adds Voronoi water, sparkles, walk ripples,
        and a sky dome. Spring / Autumn recolor the same field.
      </p>
      <p>
        <strong>Islands / scenes</strong> — home island, pirate lobby (Chicken
        Gun), Fruzer, Lyoko, Spiral, Hoth dojo stand-in. Drop one large GLB at a
        time.
      </p>
      <p>
        <strong>COTW animals</strong> — Call of the Wild land/air from
        <code>D:\Games\Models\*cotw*</code> baked to
        <code>models/creatures/cotw/</code>. Prey (raccoon, deer, beaver, mink,
        mallard, buffalo) drop leather/meat/bone. Predators (lynx, lioness,
        alligator) are monsters; LMB kill then LMB again to skin. Uniform scale
        only.
      </p>
      <p>
        <strong>Sector kits</strong> — one pattern for all 9 cells. Biome from
        world islands → isolated nature GLBs (palm / pine / oak / snow /
        gnarled) + DS2 terrain key. Left tab All sectors / pick a cell. Seafloor
        spawn dresses main islands with that kit, not cones.
      </p>
      <p>
        <strong>Library / prefabs</strong> — live
        <code>organized-nature-manifest</code> trees/rocks + Railway-ready
        harvest SI. Systems → Save as prefab writes an editor recipe (this SPA).
        Script → Attach to selected runs on Play. Not a second player DB.
      </p>
      <p>
        <strong>Map-wide floors</strong> — the y=0 brick plane is a scene layer.
        Inspector Layer: terrain / water / seafloor / lava / quicksand / void.
        Systems → Map-wide mesh layers stacks more of the same mesh. Void = fall
        forever. Water = swim, not feet.
      </p>
      <p>
        <strong>9 sectors + HD zones</strong> — Hard Road DS2 (<a
          href="https://hardroad.xyz/demos/ds2-terrain.html"
          target="_blank"
          >hardroad.xyz</a
        >). <strong>Scene → HD terrain deploy pack</strong> then
        <code>pnpm bake:hd-terrain</code>. Load screen stays up until CDN HEAD
        200.
      </p>
      <p>
        Host <code>assets.grudge-studio.com</code>. Railway owns bag / roster.
        SI: 1 unit = 1 m. Left-tab drops use the character as the yardstick
        (human 1.8 m · orc / barbarian 2.0 m). Scale is one number on the whole
        asset until height matches — no per-axis stretch. Props keep catalog
        metres (tree 4–8 m, rock ~1.4 m). AGPL-3.0 — keep author answer /
        zhangbo126, logo, and name.
      </p>
      <p>
        <strong>Systems</strong> — Rapier, BVH, pathfinding, Yuka (root only).
        AI catalog from
        <a
          href="https://threejs-games.github.io/examples/70-ai/"
          target="_blank"
          >threejs-games 70-ai</a
        >
        (idle / wander / patrol / follow / pursue). MMO aggro 25/15/30/50 m,
        threat table, cast telegraphs (<code>grudge-ai-brains</code>). Icons
        load from <code>assets.grudge-studio.com</code> with
        <code>referrerpolicy=no-referrer</code>. Header <strong>Play</strong>
        is the only TPS enter (Orbit off, no leftover tweens). Systems
        <strong>Play as</strong> only stamps the body. Vue + Rapier — not R3F /
        Cannon. Pop Forge / AI hub from the AI menu — not a second Forge.
      </p>
    </div>
    <div class="help-describe-title">Hotkeys</div>
    <div class="help-describe-content">
      <div class="help-content-item">
        <span class="help-content-label">Move</span>
        <span class="help-content-value">W</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">Rotate</span>
        <span class="help-content-value">E</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">Scale</span>
        <span class="help-content-value">R</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">Undo</span>
        <span class="help-content-value">
          <i> Ctrl+Z&nbsp;&nbsp;</i>
          <el-tooltip
            content="Currently only position, rotation, and scale"
            placement="top"
          >
            <el-icon :size="14" color="#4589ff">
              <Warning />
            </el-icon>
          </el-tooltip>
        </span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">Redo</span>
        <span class="help-content-value">
          <i> Ctrl+Shift+Z&nbsp;&nbsp;</i>
          <el-tooltip
            content="Currently only position, rotation, and scale"
            placement="top"
          >
            <el-icon :size="14" color="#4589ff">
              <Warning />
            </el-icon>
          </el-tooltip>
        </span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">Focus</span>
        <span class="help-content-value">F / double-click mesh (frame in view)</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">Place on terrain</span>
        <span class="help-content-value">G / Ctrl+Shift (on transform)</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">Place in camera view</span>
        <span class="help-content-value">Ctrl+Alt+LMB on hierarchy</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">Orbit</span>
        <span class="help-content-value">LMB drag empty viewport</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">Pan camera</span>
        <span class="help-content-value">RMB drag empty viewport (not HUD)</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">Edit HUD</span>
        <span class="help-content-value">RMB on 2D/UI · LMB drag move · corner resize</span>
      </div>
    </div>
    <div class="help-describe-title">
      <span>First-person mode</span>
    </div>
    <div class="help-describe-content">
      <div class="help-content-item">
        <span class="help-content-label">Forward</span>
        <span class="help-content-value">W</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">Back</span>
        <span class="help-content-value">S</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">Left</span>
        <span class="help-content-value">A</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">Right</span>
        <span class="help-content-value">D</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">Jump</span>
        <span class="help-content-value">Space after ~2 m move</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">Climb / grab</span>
        <span class="help-content-value"
          >Space grab · W/S up/down · A/D sidle · Space at lip = mantle</span
        >
      </div>
    </div>
  </div>
</template>
<script setup lang="ts"></script>

<style lang="scss" scoped src="./index.scss"></style>
