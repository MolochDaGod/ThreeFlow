<template>
  <el-config-provider>
    <router-view />
  </el-config-provider>
</template>
<script setup lang="ts">
import DisableDevtool from "disable-devtool";
import { ElNotification } from "element-plus";
import { onMounted } from "vue";
const env = import.meta.env.VITE_USER_NODE_ENV;

onMounted(async () => {
  if (env === "production") {
    DisableDevtool({
      disableMenu: true, // 禁用右键菜单
      disableSelect: true, // 禁用选择
      disableCopy: false, // 禁用复制
      disableCut: false, // 禁用剪切
      disablePaste: false, // 禁用粘贴
      ondevtoolopen: function () {
        // 当开发者工具打开时的回调
        window.location.reload();
      },
    });
    ElNotification.success({
      title: '3D模型场景编辑器(Vue3/React18)',
      dangerouslyUseHTMLString: true,
      message: `<div>
        <div>提供高度灵活便捷化的3D模型场景操作编辑功能。</div>
        <div style="margin-top: 10px;">
           <a href="https://three3d-0gte3eg619c78ffd-1301256746.tcloudbaseapp.com/threejs-3dscene-docs/" target="_blank">查看详情</a>
        </div>
    </div>`,
      duration: 0,
    });
  }
});
</script>
