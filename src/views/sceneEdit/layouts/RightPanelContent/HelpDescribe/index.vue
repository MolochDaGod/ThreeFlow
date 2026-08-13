<template>
  <div class="help-describe">
    <div class="help-describe-title">About</div>
    <div class="help-describe-content about-block">
      <p>
        <strong>Grudge Studio · Warlords Engine</strong> — fork of ThreeFlow for
        era layout. Live
        <a href="https://threeflow-grudgenexus.vercel.app/" target="_blank"
          >threeflow-grudgenexus.vercel.app</a
        >.
        Not a second Forge, not ThreeFlowX, not a player database.
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
        <strong>Islands / scenes</strong> — home island, pirate lobby (Chicken
        Gun), Fruzer, Lyoko, Spiral, Hoth dojo stand-in. Drop one large GLB at
        a time.
      </p>
      <p>
        <strong>9 sectors + HD zones</strong> — Hard Road DS2
        (<a href="https://hardroad.xyz/demos/ds2-terrain.html" target="_blank"
          >hardroad.xyz</a
        >). <strong>Scene → HD terrain deploy pack</strong> then
        <code>pnpm bake:hd-terrain</code>. Load screen stays up until CDN HEAD
        200.
      </p>
      <p>
        Host <code>assets.grudge-studio.com</code>. Railway owns bag / roster.
        SI: 1 unit = 1 m, human ~1.8 m. AGPL-3.0 — keep author answer /
        zhangbo126, logo, and name.
      </p>
      <p>
        <strong>Systems</strong> — Rapier, BVH, pathfinding, Yuka (root only).
        MMO aggro 25/15/30/50 m, threat table, cast telegraphs
        (<code>grudge-ai-brains</code>). Pop Forge / AI hub from the AI menu —
        do not treat this SPA as a second Forge.
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
        <span class="help-content-value">F / double-click mesh</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">Pan camera</span>
        <span class="help-content-value">Hold RMB and drag</span>
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
    </div>
  </div>
</template>
<script setup lang="ts"></script>

<style lang="scss" scoped src="./index.scss"></style>
