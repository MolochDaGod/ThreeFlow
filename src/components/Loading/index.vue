<template>
  <div id="loading-component" v-show="loading">
    <div class="loading-box">
      <div class="loading">
        <img src="@/assets/image/loading.svg" />
        <div class="progress-txt" v-if="percentage > 0">
          Loaded <b>{{ percentage }}</b> %
          <div class="progress-bar">
            <div class="progress" :style="{ width: `${percentage}%` }"></div>
          </div>
        </div>
        <div class="loading-txt">{{ loadingText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { percentage, loading, loadingText } = defineProps({
  percentage: {
    type: [Number],
    default: 0,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  loadingText: {
    type: String,
    default: 'First load can take a while. Please wait...',
  },
});
</script>

<style scoped lang="scss" src="./index.scss"></style>
