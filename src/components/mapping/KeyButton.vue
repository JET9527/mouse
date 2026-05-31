<template>
  <div class="key-button" @click="$emit('click')">
    <div class="key-button-id">{{ button.id }}</div>
    <div class="key-button-content">
      <div class="key-button-label">{{ button.label }}</div>
      <div class="key-button-mapping">{{ mapping?.target?.label || '未设置' }}</div>
    </div>
    <div class="key-button-arrow">›</div>
  </div>
</template>

<script setup lang="ts">
import type { MouseButton } from '@/types/keyMapping'
import type { KeyMapping } from '@/types/keyMapping'

defineProps<{
  button: MouseButton
  mapping?: KeyMapping
}>()

defineEmits<{
  click: []
}>()
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.key-button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  background: linear-gradient(135deg, rgba(15, 52, 96, 0.6), rgba(15, 52, 96, 0.3));
  border: 1px solid $border-color;
  border-left: 3px solid $accent-blue;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: $accent-blue;
    background: linear-gradient(135deg, rgba(15, 52, 96, 0.8), rgba(15, 52, 96, 0.5));
    box-shadow: $glow-blue;
  }
}

.key-button-id {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: linear-gradient(135deg, $accent-blue, rgba(0, 212, 255, 0.7));
  border-radius: $radius-sm;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.key-button-content {
  flex: 1;
  min-width: 0;
}

.key-button-label {
  font-size: 14px;
  color: $text-primary;
  font-weight: 500;
}

.key-button-mapping {
  font-size: 12px;
  color: $accent-cyan;
  margin-top: 2px;
}

.key-button-arrow {
  font-size: 20px;
  color: $text-muted;
  flex-shrink: 0;
}
</style>
