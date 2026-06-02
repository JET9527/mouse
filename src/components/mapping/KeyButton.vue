<template>
  <div class="key-button" @click="$emit('click')">
    <div class="key-button-id">{{ button.id }}</div>
    <div class="key-button-content">
      <div class="key-button-mapping">{{ (mapping?.target as any)?.label || '未设置' }}</div>
      <div class="key-button-sub" v-if="mapping">{{ getSubLabel(mapping) }}</div>
    </div>
    <div class="key-button-arrow">›</div>
  </div>
</template>

<script setup lang="ts">
import { KeyType } from '@/types/keyMapping'
import type { MouseButton } from '@/types/keyMapping'
import type { KeyMapping } from '@/types/keyMapping'

defineProps<{
  button: MouseButton
  mapping?: KeyMapping
}>()

defineEmits<{
  click: []
}>()

function getSubLabel(mapping: KeyMapping): string {
  const label = (mapping.target as any)?.label || ''
  switch (mapping.type) {
    case KeyType.MOUSE_FUNC:
      return '鼠标' + label
    case KeyType.KEY:
      return '按键' + label
    case KeyType.MACRO:
      return '宏录制' + label
    case KeyType.COMBO:
      return '组合' + label
    default:
      return ''
  }
}
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
  font-size: 14px;
  color: $text-primary;
  font-weight: 600;
}

.key-button-sub {
  font-size: 11px;
  color: #2ed573;
  margin-top: 1px;
}

.key-button-arrow {
  font-size: 20px;
  color: $text-muted;
  flex-shrink: 0;
}
</style>
