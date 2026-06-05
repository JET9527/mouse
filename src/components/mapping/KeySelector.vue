<template>
  <el-dialog
    v-model="visible"
    title="选择按键功能"
    width="720px"
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
        <!-- Mouse function keys -->
        <el-tab-pane label="鼠标功能" name="mouseFunc">
          <div class="key-grid">
            <button
              v-for="key in mouseFuncKeys"
              :key="key.code"
              class="key-item"
              :class="{ selected: selectedKey?.code === key.code }"
              @click="selectKey(key)"
            >
              {{ key.label }}
            </button>
          </div>
        </el-tab-pane>

        <!-- Extended keys (国际键值码) -->
        <el-tab-pane label="按键定义" name="keyDef">
          <KeyCodeSelector @select="handleKeyDefSelect" ref="keyDefSelectorRef" />
        </el-tab-pane>

        <!-- Macro keys -->
        <el-tab-pane label="宏录制" name="macro">
          <div class="key-grid" v-if="macroKeysWithData.length > 0">
            <button
              v-for="key in macroKeysWithData"
              :key="key.code"
              class="key-item"
              :class="{ selected: selectedKey?.code === key.code }"
              @click="selectKey(key)"
            >
              {{ key.label }}
            </button>
          </div>
          <div v-else class="empty-hint">暂无录制数据</div>
        </el-tab-pane>

        <!-- Combo keys -->
        <el-tab-pane label="组合键" name="combo">
          <div class="combo-layout">
            <!-- Left: key selector + combo preview -->
            <div class="combo-left">
              <div class="combo-preview-area">
                <div class="section-label">组合键</div>
                <div class="combo-result" :class="{ 'has-combo': !!selectedComboKey }">
                  <template v-if="selectedComboKey">
                    <span class="combo-text">{{ comboLabel }}</span>
                    <button class="combo-remove-btn" @click="clearComboKey" title="删除按键">×</button>
                  </template>
                  <span v-else class="combo-placeholder">请选择 MODIFIER 和按键</span>
                </div>
              </div>
              <div class="key-select-area">
                <div class="section-label">选择按键</div>
                <KeyCodeSelector @select="handleComboKeySelect" ref="comboKeySelectorRef" :hide-modifiers="true" />
              </div>
            </div>

            <!-- Right: modifier checkboxes -->
            <div class="combo-right">
              <div class="section-label">MODIFIER 键</div>
              <div class="modifier-list">
                <label
                  v-for="mod in modifierOptions"
                  :key="mod.code"
                  class="modifier-item"
                  :class="{ active: selectedModifiers.includes(mod.code) }"
                >
                  <input type="checkbox" :value="mod.code" v-model="selectedModifiers" />
                  <span class="modifier-label">{{ mod.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </el-tab-pane>

      </el-tabs>

      <!-- Selected key preview (按键定义tab使用KeyCodeSelector自带的预览) -->
      <div class="selected-preview" v-if="selectedKey && activeType !== 'keyDef' && activeType !== 'combo'">
        <span class="preview-label">已选择：</span>
        <span class="preview-value">{{ selectedKey.label }}</span>
      </div>
    </div>

    <template #footer>
      <button class="gaming-btn" @click="handleCancel">取消</button>
      <button class="gaming-btn btn-success" @click="handleConfirm" :disabled="!canConfirm">
        确认
      </button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { KeyType } from '@/types/keyMapping'
import type { MouseButton } from '@/types/keyMapping'
import { useDeviceStore } from '@/stores/modules/device'
import { parseMacroData } from '@/utils/macroProtocol'
import KeyCodeSelector from './KeyCodeSelector.vue'

interface KeyOption {
  code: number
  label: string
  type: KeyType
  comboData?: Uint8Array
}

// 组合键已有数据（从设备读取后回填用）
interface ComboInitData {
  modifiers: number[]
  nonModifierKey: { code: number; label: string } | null
}

const props = defineProps<{
  modelValue: boolean
  currentButton: MouseButton | null
  comboInitData?: ComboInitData | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [key: KeyOption]
  'tab-change': [tab: string]
}>()

const deviceStore = useDeviceStore()
const visible = ref(props.modelValue)
const activeType = ref('mouseFunc')
const selectedKey = ref<KeyOption | null>(null)
const macroHasData = ref<boolean[]>(Array(15).fill(false))
const keyDefSelectorRef = ref<InstanceType<typeof KeyCodeSelector> | null>(null)

// 组合键新状态
const selectedModifiers = ref<number[]>([])
const selectedComboKey = ref<{ code: number; label: string } | null>(null)
const comboKeySelectorRef = ref<InstanceType<typeof KeyCodeSelector> | null>(null)

const modifierOptions = [
  { code: 0xE0, label: 'CTRL' },
  { code: 0xE1, label: 'SHIFT' },
  { code: 0xE2, label: 'ALT' },
  { code: 0xE3, label: 'WIN' },
]

const MODIFIER_CODE_MAP: Record<number, string> = {
  0xE0: 'Ctrl',
  0xE1: 'Shift',
  0xE2: 'Alt',
  0xE3: 'Win',
}

const comboLabel = computed(() => {
  const mods = selectedModifiers.value.map(c => MODIFIER_CODE_MAP[c]).filter(Boolean)
  const key = selectedComboKey.value?.label
  if (mods.length === 0 && !key) return ''
  return [...mods, key].filter(Boolean).join('+')
})

const canConfirm = computed(() => {
  if (activeType.value === 'combo') {
    return selectedModifiers.value.length > 0 && !!selectedComboKey.value
  }
  return !!selectedKey.value
})

const macroKeysWithData = computed(() =>
  macroKeys.filter((_, i) => macroHasData.value[i])
)

// 切换到组合键tab时通知父组件获取设备组合快捷键数据
// 切换到宏录制tab时获取设备宏数据
watch(activeType, async (tab, oldTab) => {
  // 切换tab时清空选中，避免不同功能tab间状态携带
  if (oldTab) {
    selectedKey.value = null
  }
  // 离开按键定义tab时清除KeyCodeSelector选中
  if (oldTab === 'keyDef' && keyDefSelectorRef.value) {
    keyDefSelectorRef.value.clearSelection()
  }
  // 离开组合键tab时清除组合键状态
  if (oldTab === 'combo') {
    selectedModifiers.value = []
    selectedComboKey.value = null
  }

  if (tab === 'combo') {
    emit('tab-change', tab)
  } else if (tab === 'macro') {
    emit('tab-change', tab)
    await fetchMacroDataStatus()
  }
})

// 当父组件传入已有的组合键数据时，回填到 UI
watch(() => props.comboInitData, (data) => {
  if (!data || activeType.value !== 'combo') return
  selectedModifiers.value = data.modifiers.filter(m => [0xE0, 0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7].includes(m))
  if (data.nonModifierKey) {
    selectedComboKey.value = data.nonModifierKey
  }
}, { immediate: true })

async function fetchMacroDataStatus() {
  if (!deviceStore.isConnected || !deviceStore.protocol) return
  for (let i = 0; i < 15; i++) {
    try {
      const raw = await deviceStore.protocol.getMacroData(i)
      const steps = parseMacroData(raw)
      macroHasData.value[i] = steps.length > 0
    } catch {
      macroHasData.value[i] = false
    }
  }
}

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) selectedKey.value = null
})

watch(visible, (val) => emit('update:modelValue', val))

const macroKeys: KeyOption[] = Array.from({ length: 15 }, (_, i) => ({
  code: i,
  label: `M${i}`,
  type: KeyType.MACRO,
}))

// 组合键：由 MODIFIER 勾选 + KeyCodeSelector 选择组合而成
// 移除旧的 comboKeys 预设列表

// 鼠标功能键 (协议 0x03)
const mouseFuncKeys: KeyOption[] = [
  { code: 0xF4, label: '左键', type: KeyType.MOUSE_FUNC },
  { code: 0xF5, label: '右键', type: KeyType.MOUSE_FUNC },
  { code: 0xF6, label: '中键', type: KeyType.MOUSE_FUNC },
  { code: 0xF7, label: '后退', type: KeyType.MOUSE_FUNC },
  { code: 0xF8, label: '前进', type: KeyType.MOUSE_FUNC },
  { code: 0xF9, label: '滚轮上', type: KeyType.MOUSE_FUNC },
  { code: 0xFA, label: '滚轮下', type: KeyType.MOUSE_FUNC },
  { code: 0xD0, label: 'DPI切换', type: KeyType.MOUSE_FUNC },
  { code: 0xD1, label: '回报率', type: KeyType.MOUSE_FUNC },
  { code: 0xD2, label: '火力键', type: KeyType.MOUSE_FUNC },
  { code: 0xD3, label: 'BT配对', type: KeyType.MOUSE_FUNC },
  { code: 0xD4, label: '2.4G配对', type: KeyType.MOUSE_FUNC },
  { code: 0xD5, label: '模式切换', type: KeyType.MOUSE_FUNC },
  { code: 0xD6, label: '老板键', type: KeyType.MOUSE_FUNC },
]

function selectKey(key: KeyOption) {
  selectedKey.value = key
  // 切换到按键定义tab时清除KeyCodeSelector选中
  if (activeType.value !== 'keyDef' && keyDefSelectorRef.value) {
    keyDefSelectorRef.value.clearSelection()
  }
}

// 从KeyCodeSelector选择国际键值码
function handleKeyDefSelect(key: { code: number; label: string }) {
  selectedKey.value = { code: key.code, label: key.label, type: KeyType.KEY }
}

// 组合键：从KeyCodeSelector选择非MODIFIER键
function handleComboKeySelect(key: { code: number; label: string }) {
  selectedComboKey.value = key
  if (comboKeySelectorRef.value) {
    comboKeySelectorRef.value.clearSelection()
  }
}

// 清除选择的非MODIFIER键
function clearComboKey() {
  selectedComboKey.value = null
}

// 构建组合键协议数据：{count, modifier1, modifier2, ..., keyCode, 0x00}
function buildComboData(): Uint8Array {
  const modifiers = selectedModifiers.value
  const keyCode = selectedComboKey.value?.code ?? 0
  const totalKeys = modifiers.length + 1
  const data = new Uint8Array(5)
  data[0] = totalKeys
  modifiers.forEach((mod, i) => {
    data[1 + i] = mod
  })
  data[1 + modifiers.length] = keyCode
  // 剩余字节默认为 0x00
  return data
}

function handleConfirm() {
  if (activeType.value === 'combo') {
    if (!canConfirm.value) return
    const comboData = buildComboData()
    console.log('[KeySelector] 组合键数据:', Array.from(comboData).map(b => b.toString(16).padStart(2, '0')).join(' '))
    emit('confirm', {
      code: 0,
      label: comboLabel.value,
      type: KeyType.COMBO,
      comboData,
    })
    visible.value = false
  } else if (selectedKey.value) {
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

.macro-grid {
  grid-template-columns: repeat(5, 1fr);
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

  &.has-data {
    border-color: #52c41a;
    color: #52c41a;

    &.selected {
      border-color: $accent-blue;
      color: $accent-blue;
      background: linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.1));
      box-shadow: $glow-blue;
    }
  }

  &.combo-item {
    font-size: 12px;
  }
}

/* 组合键构建布局 */
.combo-layout {
  display: flex;
  gap: 16px;
  min-height: 300px;
}

.combo-left {
  flex: 1;
  min-width: 0;
}

.combo-right {
  width: 140px;
  flex-shrink: 0;
  padding-left: 16px;
  border-left: 1px solid $border-color;
}

.section-label {
  font-size: 13px;
  color: $text-secondary;
  margin-bottom: 8px;
  font-weight: 500;
}

.combo-preview-area {
  margin-bottom: 12px;
}

.combo-result {
  padding: 10px 14px;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;

  &.has-combo {
    border-color: rgba(0, 229, 255, 0.4);
    background: rgba(0, 229, 255, 0.08);
  }
}

.combo-text {
  color: $accent-cyan;
  font-weight: 600;
  font-size: 14px;
}

.combo-placeholder {
  color: $text-muted;
  font-size: 12px;
}

.combo-remove-btn {
  width: 22px;
  height: 22px;
  border: 1px solid rgba(255, 51, 85, 0.4);
  background: rgba(255, 51, 85, 0.15);
  color: #ff3355;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 51, 85, 0.3);
    border-color: #ff3355;
  }
}

.key-select-area {
  .keycode-selector {
    padding: 0;
  }
}

.modifier-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modifier-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;

  &:hover {
    border-color: rgba(0, 229, 255, 0.3);
  }

  &.active {
    border-color: $accent-blue;
    background: rgba(0, 212, 255, 0.12);
  }

  input[type="checkbox"] {
    accent-color: $accent-blue;
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
}

.modifier-label {
  color: $text-primary;
  font-size: 13px;
  font-weight: 500;
}

.empty-hint {
  text-align: center;
  color: $text-muted;
  padding: 30px 0;
  font-size: 13px;
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
