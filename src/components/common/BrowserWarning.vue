<template>
  <div class="browser-warning">
    <el-alert
      :title="$t('browserWarning.title')"
      type="warning"
      :closable="false"
      show-icon
    >
      <p>{{ $t('browserWarning.message') }}</p>
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
