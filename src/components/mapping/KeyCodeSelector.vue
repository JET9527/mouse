<template>
  <div class="keycode-selector">
    <el-tabs v-model="activeTab" class="type-tabs">
      <!-- 字母键 -->
      <el-tab-pane label="字母键" name="letters">
        <div class="key-grid columns-7">
          <button
            v-for="key in letterKeys"
            :key="key.code"
            class="key-item"
            :class="{ selected: selectedCode === key.code }"
            @click="selectKey(key)"
          >{{ key.label }}</button>
        </div>
      </el-tab-pane>

      <!-- 数字/符号 + 方向键 -->
      <el-tab-pane label="数字/符号" name="symbols">
        <div class="key-grid columns-7">
          <button
            v-for="key in symbolRowKeys"
            :key="key.code"
            class="key-item"
            :class="{ selected: selectedCode === key.code }"
            @click="selectKey(key)"
          >{{ key.label }}</button>
        </div>
        <div class="arrow-inline">
          <button
            v-for="key in arrowKeys"
            :key="key.code"
            class="key-item"
            :class="{ selected: selectedCode === key.code }"
            @click="selectKey(key)"
          >{{ key.label }}</button>
        </div>
      </el-tab-pane>

      <!-- 功能键 -->
      <el-tab-pane label="功能键" name="functions">
        <div class="key-grid columns-7">
          <button
            v-for="key in functionKeys"
            :key="key.code"
            class="key-item"
            :class="{ selected: selectedCode === key.code }"
            @click="selectKey(key)"
          >{{ key.label }}</button>
        </div>
      </el-tab-pane>

      <!-- 控制键 -->
      <el-tab-pane label="控制键" name="controls">
        <div class="key-grid columns-5">
          <button
            v-for="key in controlKeys"
            :key="key.code"
            class="key-item"
            :class="{ selected: selectedCode === key.code }"
            @click="selectKey(key)"
          >{{ key.label }}</button>
        </div>
      </el-tab-pane>

      <!-- 编辑键 -->
      <el-tab-pane label="编辑键" name="edits">
        <div class="key-grid columns-5">
          <button
            v-for="key in editKeys"
            :key="key.code"
            class="key-item"
            :class="{ selected: selectedCode === key.code }"
            @click="selectKey(key)"
          >{{ key.label }}</button>
        </div>
      </el-tab-pane>

      <!-- 小键盘 -->
      <el-tab-pane label="小键盘" name="numpad">
        <div class="key-grid columns-5">
          <button
            v-for="key in numpadKeys"
            :key="key.code"
            class="key-item"
            :class="{ selected: selectedCode === key.code }"
            @click="selectKey(key)"
          >{{ key.label }}</button>
        </div>
      </el-tab-pane>

      <!-- 多媒体 -->
      <el-tab-pane label="多媒体" name="media">
        <div class="key-grid columns-5">
          <button
            v-for="key in mediaKeys"
            :key="key.code"
            class="key-item"
            :class="{ selected: selectedCode === key.code }"
            @click="selectKey(key)"
          >{{ key.label }}</button>
        </div>
      </el-tab-pane>
    </el-tabs>

    <div class="selected-preview" v-if="selectedKey">
      <span class="preview-label">已选择：</span>
      <span class="preview-value">{{ selectedKey.label }}</span>
      <span class="preview-code">(0x{{ selectedKey.code.toString(16).padStart(2, '0').toUpperCase() }})</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface KeyCodeOption {
  code: number
  label: string
}

const activeTab = ref('letters')
const selectedCode = ref<number | null>(null)
const selectedKey = ref<KeyCodeOption | null>(null)

const emit = defineEmits<{
  select: [key: KeyCodeOption]
}>()

const props = defineProps<{
  hideModifiers?: boolean
}>()

const MODIFIER_CODES = [0xE0, 0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7]

// 字母键 A-Z (0x04-0x1D)
const letterKeys: KeyCodeOption[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c, i) => ({
  code: 0x04 + i,
  label: c,
}))

// 数字行和符号键 (0x1E-0x38) — 标准键盘主键盘区数字和符号行
const symbolRowKeys: KeyCodeOption[] = [
  { code: 0x1E, label: '1' },
  { code: 0x1F, label: '2' },
  { code: 0x20, label: '3' },
  { code: 0x21, label: '4' },
  { code: 0x22, label: '5' },
  { code: 0x23, label: '6' },
  { code: 0x24, label: '7' },
  { code: 0x25, label: '8' },
  { code: 0x26, label: '9' },
  { code: 0x27, label: '0' },
  { code: 0x2D, label: '-_' },
  { code: 0x2E, label: '=+' },
  { code: 0x2F, label: '[{' },
  { code: 0x30, label: ']}' },
  { code: 0x31, label: '\\|' },
  { code: 0x33, label: ';:' },
  { code: 0x34, label: '\'"' },
  { code: 0x35, label: '`~' },
  { code: 0x36, label: ',<' },
  { code: 0x37, label: '.>' },
  { code: 0x38, label: '/?' },
]

// 功能键 Esc + F1-F12 (0x29, 0x3A-0x45)
const functionKeys: KeyCodeOption[] = [
  { code: 0x29, label: 'Esc' },
  ...Array.from({ length: 12 }, (_, i) => ({ code: 0x3A + i, label: `F${i + 1}` })),
]

// 控制键 (辅助键 + 修饰键)
const baseControlKeys: KeyCodeOption[] = [
  { code: 0x2B, label: 'Tab' },
  { code: 0x39, label: 'CapsLock' },
  { code: 0xE1, label: 'Shift(L)' },
  { code: 0xE5, label: 'Shift(R)' },
  { code: 0xE0, label: 'Ctrl(L)' },
  { code: 0xE4, label: 'Ctrl(R)' },
  { code: 0xE2, label: 'Alt(L)' },
  { code: 0xE6, label: 'Alt(R)' },
  { code: 0xE3, label: 'Win(L)' },
  { code: 0xE7, label: 'Win(R)' },
  { code: 0x65, label: 'App' },
  { code: 0x28, label: 'Enter' },
  { code: 0x2A, label: 'Backspace' },
  { code: 0x2C, label: 'Space' },
]

// 当 hideModifiers=true 时过滤掉 MODIFIER 键
const controlKeys = computed(() => {
  if (props.hideModifiers) {
    return baseControlKeys.filter(k => !MODIFIER_CODES.includes(k.code))
  }
  return baseControlKeys
})

// 编辑/导航键
const editKeys: KeyCodeOption[] = [
  { code: 0x46, label: 'PrtSc' },
  { code: 0x47, label: 'ScrlLk' },
  { code: 0x48, label: 'Pause' },
  { code: 0x49, label: 'Insert' },
  { code: 0x4C, label: 'Delete' },
  { code: 0x4A, label: 'Home' },
  { code: 0x4D, label: 'End' },
  { code: 0x4B, label: 'PgUp' },
  { code: 0x4E, label: 'PgDn' },
]

// 方向键
const arrowKeys: KeyCodeOption[] = [
  { code: 0x52, label: '↑' },
  { code: 0x51, label: '↓' },
  { code: 0x50, label: '←' },
  { code: 0x4F, label: '→' },
]

// 小键盘 (0x53-0x63)
const numpadKeys: KeyCodeOption[] = [
  { code: 0x53, label: 'NumLk' },
  { code: 0x54, label: '/' },
  { code: 0x55, label: '*' },
  { code: 0x56, label: '-' },
  { code: 0x57, label: '+' },
  { code: 0x58, label: 'Enter' },
  { code: 0x59, label: '7' },
  { code: 0x5A, label: '8' },
  { code: 0x5B, label: '9' },
  { code: 0x5C, label: '4' },
  { code: 0x5D, label: '5' },
  { code: 0x5E, label: '6' },
  { code: 0x5F, label: '1' },
  { code: 0x60, label: '2' },
  { code: 0x61, label: '3' },
  { code: 0x62, label: '0' },
  { code: 0x63, label: '.' },
]

// 常用多媒体键
const mediaKeys: KeyCodeOption[] = [
  { code: 0xA8, label: '静音' },
  { code: 0xA9, label: '音量+' },
  { code: 0xAA, label: '音量-' },
  { code: 0xAB, label: '下一曲' },
  { code: 0xAC, label: '上一曲' },
  { code: 0xAF, label: '停止' },
  { code: 0xB0, label: '播放/暂停' },
  { code: 0xB7, label: '计算器' },
  { code: 0xB8, label: '我的电脑' },
]

function selectKey(key: KeyCodeOption) {
  selectedCode.value = key.code
  selectedKey.value = key
  emit('select', key)
}

function clearSelection() {
  selectedCode.value = null
  selectedKey.value = null
}

defineExpose({ clearSelection })
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.keycode-selector {
  padding: 4px 0;
}

.type-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 12px;
  }

  :deep(.el-tabs__item) {
    color: $text-secondary;
    font-size: 12px;
    padding: 0 10px;

    &.is-active {
      color: $accent-blue;
    }
  }
}

.key-grid {
  display: grid;
  gap: 6px;
  max-height: 260px;
  overflow-y: auto;
  padding: 4px;

  &.columns-7 {
    grid-template-columns: repeat(7, 1fr);
  }

  &.columns-5 {
    grid-template-columns: repeat(5, 1fr);
  }

  &.columns-4 {
    grid-template-columns: repeat(4, 1fr);
  }

  &.arrow-grid {
    max-width: 240px;
    margin: 0 auto;
  }
}

.arrow-inline {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid $border-color;

  .key-item {
    width: 52px;
  }
}

.key-item {
  padding: 8px 4px;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  color: $text-primary;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    border-color: $accent-blue;
    background: rgba(0, 212, 255, 0.1);
  }

  &.selected {
    border-color: $accent-blue;
    background: linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.1));
    color: $accent-blue;
    box-shadow: $glow-blue;
  }
}

.selected-preview {
  margin-top: 12px;
  padding: 8px 14px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: $radius-sm;
  font-size: 13px;

  .preview-label {
    color: $text-secondary;
  }

  .preview-value {
    color: $accent-cyan;
    font-weight: 600;
  }

  .preview-code {
    color: $text-muted;
    font-size: 11px;
    margin-left: 6px;
    font-family: monospace;
  }
}
</style>
