<template>
  <div class="key-row" @click="$emit('click')">
    <div class="key-name-wrap">
      <span class="key-tag">{{ button.id }}</span>
      <div>
        <div>{{ displayLabel }}</div>
        <div class="key-desc">{{ displayDesc }}</div>
      </div>
    </div>
    <button class="config-btn" @click.stop="$emit('click')">配置 &gt;</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { KeyType } from '@/types/keyMapping'
import type { MouseButton } from '@/types/keyMapping'
import type { KeyMapping } from '@/types/keyMapping'

const props = defineProps<{
  button: MouseButton
  mapping?: KeyMapping
}>()

defineEmits<{
  click: []
}>()

const displayLabel = computed(() => {
  if (!props.mapping) return props.button.label
  const target = props.mapping.target as any
  const label = target?.label || ''
  if (props.mapping.type === KeyType.COMBO) return label || '组合快捷键'
  if (props.mapping.type === KeyType.MACRO) return label || '宏录制'
  if (props.mapping.type === KeyType.KEY) return label || '按键'
  if (props.mapping.type === KeyType.MOUSE_FUNC) return label || '鼠标功能'
  return label || '未设置'
})

const displayDesc = computed(() => {
  if (!props.mapping) return ''
  const target = props.mapping.target as any
  const label = target?.label || ''
  switch (props.mapping.type) {
    case KeyType.MOUSE_FUNC:
      return `鼠标${label}功能`
    case KeyType.KEY:
      return `按键: ${label}`
    case KeyType.MACRO:
      return `宏录制: ${label}`
    case KeyType.COMBO:
      return `组合快捷键`
    default:
      return ''
  }
})
</script>

<style lang="scss" scoped>
.key-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
  transition: 0.3s;

  &:last-child {
    border: none;
  }

  &:hover {
    .config-btn {
      background: #00E5FF;
      color: #0C0E16;
      box-shadow: 0 0 6px #00E5FF66;
    }
  }
}

.key-name-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.key-tag {
  width: 26px;
  height: 26px;
  background: #00B4E8;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  font-size: 13px;
  flex-shrink: 0;
}

.key-desc {
  font-size: 12px;
  color: #8A98B3;
  margin-top: 3px;
}

.config-btn {
  border: 1px solid #00E5FF;
  color: #00E5FF;
  background: transparent;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.25s;
  font-size: 13px;
  flex-shrink: 0;

  &:hover {
    background: #00E5FF;
    color: #0C0E16;
    box-shadow: 0 0 6px #00E5FF66;
  }
}
</style>
