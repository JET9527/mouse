<template>
  <el-dialog
    v-model="visible"
    title="选择按键功能"
    width="520px"
    :close-on-click-modal="false"
    class="key-selector-dialog"
  >
    <div class="key-selector">
      <!-- Current button info -->
      <div class="current-info">
        <span class="info-label">当前按键：</span>
        <span class="info-value">{{ currentButton?.label }}</span>
      </div>

      <!-- Key type tabs -->
      <el-tabs v-model="activeType" class="type-tabs">
        <!-- Basic keys -->
        <el-tab-pane label="基本键" name="basic">
          <div class="key-grid">
            <button
              v-for="key in basicKeys"
              :key="key.code"
              class="key-item"
              :class="{ selected: selectedKey?.code === key.code }"
              @click="selectKey(key)"
            >
              {{ key.label }}
            </button>
          </div>
        </el-tab-pane>

        <!-- Extended keys -->
        <el-tab-pane label="扩展键" name="extended">
          <div class="key-grid">
            <button
              v-for="key in extendedKeys"
              :key="key.code"
              class="key-item"
              :class="{ selected: selectedKey?.code === key.code }"
              @click="selectKey(key)"
            >
              {{ key.label }}
            </button>
          </div>
        </el-tab-pane>

        <!-- Media keys -->
        <el-tab-pane label="多媒体" name="media">
          <div class="key-grid">
            <button
              v-for="key in mediaKeys"
              :key="key.code"
              class="key-item"
              :class="{ selected: selectedKey?.code === key.code }"
              @click="selectKey(key)"
            >
              {{ key.label }}
            </button>
          </div>
        </el-tab-pane>

        <!-- Combo keys -->
        <el-tab-pane label="组合键" name="combo">
          <div class="key-grid">
            <button
              v-for="key in comboKeys"
              :key="key.code"
              class="key-item combo-item"
              :class="{ selected: selectedKey?.code === key.code }"
              @click="selectKey(key)"
            >
              {{ key.label }}
            </button>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- Selected key preview -->
      <div class="selected-preview" v-if="selectedKey">
        <span class="preview-label">已选择：</span>
        <span class="preview-value">{{ selectedKey.label }}</span>
      </div>
    </div>

    <template #footer>
      <button class="gaming-btn" @click="handleCancel">取消</button>
      <button class="gaming-btn btn-success" @click="handleConfirm" :disabled="!selectedKey">
        确认
      </button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { KeyType } from '@/types/keyMapping'
import type { MouseButton } from '@/types/keyMapping'

interface KeyOption {
  code: number
  label: string
  type: KeyType
}

const props = defineProps<{
  modelValue: boolean
  currentButton: MouseButton | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [key: KeyOption]
}>()

const visible = ref(props.modelValue)
const activeType = ref('basic')
const selectedKey = ref<KeyOption | null>(null)

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) selectedKey.value = null
})

watch(visible, (val) => emit('update:modelValue', val))

const basicKeys: KeyOption[] = [
  { code: 1, label: '左键', type: 'basic' },
  { code: 2, label: '右键', type: 'basic' },
  { code: 3, label: '中键', type: 'basic' },
  { code: 4, label: '前进', type: 'basic' },
  { code: 5, label: '后退', type: 'basic' },
  { code: 0, label: '禁用', type: 'disabled' },
]

const extendedKeys: KeyOption[] = [
  { code: 10, label: 'F1', type: 'extended' },
  { code: 11, label: 'F2', type: 'extended' },
  { code: 12, label: 'F3', type: 'extended' },
  { code: 13, label: 'F4', type: 'extended' },
  { code: 14, label: 'F5', type: 'extended' },
  { code: 15, label: 'F6', type: 'extended' },
  { code: 16, label: 'F7', type: 'extended' },
  { code: 17, label: 'F8', type: 'extended' },
  { code: 18, label: 'F9', type: 'extended' },
  { code: 19, label: 'F10', type: 'extended' },
  { code: 20, label: 'F11', type: 'extended' },
  { code: 21, label: 'F12', type: 'extended' },
]

const mediaKeys: KeyOption[] = [
  { code: 100, label: '播放/暂停', type: 'media' },
  { code: 101, label: '停止', type: 'media' },
  { code: 102, label: '上一曲', type: 'media' },
  { code: 103, label: '下一曲', type: 'media' },
  { code: 104, label: '音量+', type: 'media' },
  { code: 105, label: '音量-', type: 'media' },
  { code: 106, label: '静音', type: 'media' },
]

const comboKeys: KeyOption[] = [
  { code: 200, label: 'Ctrl+C', type: 'combo' },
  { code: 201, label: 'Ctrl+V', type: 'combo' },
  { code: 202, label: 'Ctrl+X', type: 'combo' },
  { code: 203, label: 'Ctrl+Z', type: 'combo' },
  { code: 204, label: 'Ctrl+S', type: 'combo' },
  { code: 205, label: 'Ctrl+A', type: 'combo' },
  { code: 206, label: 'Alt+Tab', type: 'combo' },
  { code: 207, label: 'Win+D', type: 'combo' },
  { code: 208, label: 'Win+E', type: 'combo' },
  { code: 209, label: 'Win+L', type: 'combo' },
]

function selectKey(key: KeyOption) {
  selectedKey.value = key
}

function handleConfirm() {
  if (selectedKey.value) {
    emit('confirm', selectedKey.value)
    visible.value = false
  }
}

function handleCancel() {
  visible.value = false
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.key-selector {
  padding: 4px 0;
}

.current-info {
  margin-bottom: 16px;
  padding: 10px 14px;
  background: $bg-secondary;
  border-radius: $radius-sm;
  font-size: 14px;

  .info-label {
    color: $text-secondary;
  }

  .info-value {
    color: $accent-blue;
    font-weight: 600;
  }
}

.type-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 12px;
  }

  :deep(.el-tabs__item) {
    color: $text-secondary;
    font-size: 13px;

    &.is-active {
      color: $accent-blue;
    }
  }
}

.key-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
  padding: 4px;
}

.key-item {
  padding: 10px 8px;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  color: $text-primary;
  font-size: 13px;
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

  &.combo-item {
    font-size: 12px;
  }
}

.selected-preview {
  margin-top: 16px;
  padding: 10px 14px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: $radius-sm;
  font-size: 14px;

  .preview-label {
    color: $text-secondary;
  }

  .preview-value {
    color: $accent-cyan;
    font-weight: 600;
  }
}
</style>
