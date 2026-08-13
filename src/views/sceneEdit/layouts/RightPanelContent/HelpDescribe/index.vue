<template>
  <div class="help-describe">
    <div class="help-describe-title">About</div>
    <div class="help-describe-content about-block">
      <p>
        Grudge fork of ThreeFlow for Warlords-era layout. Left library loads
        <strong>game-ready CDN GLBs</strong> — not demo police / taxi packs.
      </p>
      <p>
        <strong>Captains</strong> are Toon RTS play kits
        (<code>asset-packs/toon-rts-characters/glb/characters/{race}.glb</code>).
        Play code still uses <code>loadRaceKit</code>. This viewer only places
        the mesh.
      </p>
      <p>
        <strong>Units, buildings, mounts, ships, siege</strong> come from
        ObjectStore
        <code>ummorpg-placeables-for-forge.json</code> — <code>cdn_ready</code>
        GLBs only. Mage / paladin / merc rows that still point at race FBX kits
        are skipped.
      </p>
      <p>
        <strong>Enemies / monsters</strong> are the migrated land creatures
        (<code>drake</code>, <code>ifrit</code>, <code>lava_golem</code>,
        reptile, monster pack, crab) plus skeleton residuals.
      </p>
      <p>
        <strong>Weapons</strong> are verified CDN meshes (hand axe, greataxe,
        greatswords, bows) plus uMMORPG siege (catapult, bolt thrower). Many
        Fantasy Weapons keys are still FBX-only and are not listed.
      </p>
      <p>
        <strong>Islands</strong>: home island concept mesh, pirate-islands lobby
        (uMMORPG / Chicken Gun opening map), Lyoko, Spiral Mountain, Hoth boss
        room. Island GLBs are large — drop one at a time.
      </p>
      <p>
        <strong>HD zones</strong>: Hard Road erosion terrain
        (<a href="https://hardroad.xyz/demos/ds2-terrain.html" target="_blank"
          >hardroad.xyz/demos/ds2-terrain.html</a
        >). Mountains, crags, and a flatter zone — SI metres, ~400 m across.
        Editor mesh is 256² (the live demo is 1536²). Drop generates in-place;
        do not scale the result to 1.2 m.
      </p>
      <p>
        Host: <code>assets.grudge-studio.com</code>. Player bag / roster stays
        on Railway. SI: 1 unit = 1 m, human ~1.8 m. AGPL-3.0 — keep author
        answer / zhangbo126, logo, and name.
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
