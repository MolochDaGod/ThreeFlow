<template>
  <div id="directive-loading-mark">
    <div class="loading-box">
      <div class="loading">
        <img src="@/assets/image/loading.svg" />
        <div class="loading-txt">Loading...</div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
#directive-loading-mark {
  position: fixed;
  z-index: 2000;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  backdrop-filter: blur(8px);

  .loading-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: rgb(0 0 0 / 50%);
    transition: opacity 0.3s;
    .loading {
      width: 200px;
      height: 120px;
      text-align: center;
    }
    .loading-txt {
      font-size: 14px;
      color: #ff7c81;
      text-align: center;
    }
  }
}
</style>
