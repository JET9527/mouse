<template>
  <div class="key-row" @click="$emit('click')">
    <div class="key-name-wrap">
      <span class="key-tag">{{ button.id }}</span>
      <div>
        <div>{{ displayLabel }}</div>
        <div class="key-desc">{{ displayDesc }}</div>
      </div>
    </div>
    <button class="config-btn" @click.stop="$emit('click')">{{ $t('keyButton.configure') }} &gt;</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { KeyType } from '@/types/keyMapping'
import type { MouseButton } from '@/types/keyMapping'
import type { KeyMapping } from '@/types/keyMapping'

const { t } = useI18n()

const BUTTON_I18N_KEYS: Record<number, string> = {
  1: 'mapping.leftButton',
  2: 'mapping.rightButton',
  3: 'mapping.middleButton',
  4: 'mapping.backButton',
  5: 'mapping.forwardButton',
  6: 'mapping.dpiButton',
}

const MOUSE_FUNC_I18N_KEYS: Record<number, string> = {
  0xF4: 'mapping.mouseLeft',
  0xF5: 'mapping.mouseRight',
  0xF6: 'mapping.mouseMiddle',
  0xF7: 'mapping.mouseBack',
  0xF8: 'mapping.mouseForward',
  0xF9: 'mapping.wheelUp',
  0xFA: 'mapping.wheelDown',
  0xD0: 'mapping.dpiSwitch',
  0xD1: 'mapping.pollingRate',
  0xD2: 'mapping.fireKey',
  0xD3: 'mapping.btPair',
  0xD4: 'mapping.wireless24Pair',
  0xD5: 'mapping.modeSwitch',
  0xD6: 'mapping.bossKey',
}

const props = defineProps<{
  button: MouseButton
  mapping?: KeyMapping
}>()

defineEmits<{
  click: []
}>()

const displayLabel = computed(() => {
  if (!props.mapping) return t(BUTTON_I18N_KEYS[props.button.id] || 'mapping.leftButton')
  const target = props.mapping.target as any
  const label = target?.label || ''

  // NONE 类型：未设置功能，显示按键本身名称
  if (props.mapping.type === KeyType.NONE) {
    return t(BUTTON_I18N_KEYS[props.button.id] || 'mapping.leftButton')
  }

  // MOUSE_FUNC 类型：根据 keyCode 动态翻译
  if (props.mapping.type === KeyType.MOUSE_FUNC) {
    const i18nKey = MOUSE_FUNC_I18N_KEYS[target?.keyCode]
    if (i18nKey) return t(i18nKey)
    return label || t('keyButton.mouseFunc')
  }

  if (props.mapping.type === KeyType.COMBO) return label || t('keyButton.combo')
  if (props.mapping.type === KeyType.MACRO) return label || t('keyButton.macro')
  if (props.mapping.type === KeyType.KEY) return label || t('keyButton.key')
  return label || t('keyButton.unset')
})

const displayDesc = computed(() => {
  if (!props.mapping) return ''
  const target = props.mapping.target as any
  const label = target?.label || ''
  switch (props.mapping.type) {
    case KeyType.MOUSE_FUNC: {
      const i18nKey = MOUSE_FUNC_I18N_KEYS[target?.keyCode]
      const translatedLabel = i18nKey ? t(i18nKey) : label
      return t('keyButton.descMouse', { label: translatedLabel })
    }
    case KeyType.KEY:
      return t('keyButton.descKey', { label })
    case KeyType.MACRO:
      return t('keyButton.descMacro', { label })
    case KeyType.COMBO:
      return t('keyButton.descCombo')
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
