<template>
  <div class="help-describe">
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
