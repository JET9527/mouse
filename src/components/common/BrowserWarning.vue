<template>
  <div class="browser-warning">
    <el-alert
      title="浏览器兼容性提示"
      type="warning"
      :closable="false"
      show-icon
    >
      <p>您的浏览器不支持 WebHID API。请使用 Chrome 89+ 或 Edge 89+ 浏览器以获得完整功能。</p>
    </el-alert>
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.browser-warning {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;

  :deep(.el-alert) {
    background: rgba(255, 165, 2, 0.15);
    border: 1px solid $warning-color;
    border-radius: 0;
    color: $warning-color;
  }
}
</style>
