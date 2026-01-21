<template>
  <div class="help-describe">
    <div class="help-describe-title">快捷键</div>
    <div class="help-describe-content">
      <div class="help-content-item">
        <span class="help-content-label">移动</span>
        <span class="help-content-value">W</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">旋转</span>
        <span class="help-content-value">E</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">缩放</span>
        <span class="help-content-value">R</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">撤销</span>
        <span class="help-content-value">
          <i> Ctrl+Z&nbsp;&nbsp;</i>
          <el-tooltip
            content="目前仅支持（position,rotation,scale）属性"
            placement="top"
          >
            <el-icon :size="14" color="#4589ff">
              <Warning />
            </el-icon>
          </el-tooltip>
        </span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">重做</span>
        <span class="help-content-value">
          <i> Ctrl+Shift+Z&nbsp;&nbsp;</i>
          <el-tooltip
            content="目前仅支持（position,rotation,scale）属性"
            placement="top"
          >
            <el-icon :size="14" color="#4589ff">
              <Warning />
            </el-icon>
          </el-tooltip>
        </span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">聚焦</span>
        <span class="help-content-value">F/鼠标双击材质</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">移动镜头</span>
        <span class="help-content-value">长按鼠标右键拖动</span>
      </div>
    </div>
    <div class="help-describe-title">
      <span>第一人称模式</span>
    </div>
    <div class="help-describe-content">
      <div class="help-content-item">
        <span class="help-content-label">前进</span>
        <span class="help-content-value">W</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">后退</span>
        <span class="help-content-value">S</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">左移</span>
        <span class="help-content-value">A</span>
      </div>
      <div class="help-content-item">
        <span class="help-content-label">右移</span>
        <span class="help-content-value">D</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts"></script>

<style lang="scss" scoped src="./index.scss"></style>
