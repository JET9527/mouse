<template>
  <div class="macro-view">
    <div class="macro-container">
      <!-- Macro step editor -->
      <div class="macro-panel">
        <!-- Macro selector -->
        <div class="macro-selector">
          <div class="macro-buttons">
            <button
              v-for="i in MACRO_COUNT"
              :key="i - 1"
              class="macro-btn"
              :class="{ active: macroSelectIndex === i - 1, hasData: macroData[i - 1].length > 0 }"
              @click="switchMacro(i - 1)"
            >
              M{{ i - 1 }}
            </button>
          </div>
        </div>

        <div class="panel-header">
          <h3>编辑宏动作</h3>
          <div class="header-info">
            <span class="step-count">剩余内存</span>
            <span class="byte-count" :class="{ 'byte-over': totalBytes > MAX_MACRO_BYTES }">
              {{ totalBytes }} / {{ MAX_MACRO_BYTES }} B
            </span>
          </div>
        </div>

        <!-- Step list -->
        <div class="step-list">
          <div class="step-row" v-for="(step, index) in steps" :key="step.id">
            <span class="step-index">{{ index + 1 }}</span>

            <!-- Action type dropdown -->
            <select class="step-action" v-model="step.action" @change="onActionChange(step)">
              <option value="press">按下</option>
              <option value="click">点击</option>
              <option value="release">抬起</option>
              <option value="text">文本</option>
              <option value="delay">延时</option>
            </select>

            <!-- Parameter input -->
            <div class="step-param">
              <!-- 按下/点击/抬起 - multi key selector -->
              <div v-if="step.action === 'press' || step.action === 'click' || step.action === 'release'" class="param-multi-keys">
                <div class="key-tags">
                  <span
                    v-for="(k, ki) in step.keys"
                    :key="ki"
                    class="key-tag"
                    @click="editKeyIndex = ki; openKeyPicker(index)"
                  >
                    {{ k.label }}
                    <span class="key-tag-remove" @click.stop="removeKey(index, ki)">✕</span>
                  </span>
                </div>
                <button class="key-add-btn" @click="editKeyIndex = -1; openKeyPicker(index)">
                  + 添加按键
                </button>
                <div v-if="step.keys.length === 0" class="key-empty-hint">
                  尚未添加按键
                </div>
              </div>
              <!-- 文本 - text input -->
              <input
                v-else-if="step.action === 'text'"
                v-model="step.text"
                class="param-input"
                type="text"
                placeholder="输入文本内容..."
              />
              <!-- 延时 -->
              <div v-else-if="step.action === 'delay'" class="param-delay">
                <div class="delay-header">
                  <span class="delay-label">{{ step.delayRandom ? '随机延时' : '固定延时' }}</span>
                  <label class="delay-toggle">
                    <span class="toggle-text">随机</span>
                    <input type="checkbox" v-model="step.delayRandom" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div v-if="!step.delayRandom" class="delay-fixed">
                  <input
                    v-model="step.duration"
                    class="param-input delay-input"
                    type="number"
                    min="0"
                    placeholder="500"
                  />
                  <span class="delay-unit">ms</span>
                </div>
                <div v-else class="delay-random">
                  <input
                    v-model="step.delayMin"
                    class="param-input delay-input"
                    type="number"
                    min="0"
                    placeholder="最小"
                  />
                  <span class="delay-sep">~</span>
                  <input
                    v-model="step.delayMax"
                    class="param-input delay-input"
                    type="number"
                    min="0"
                    placeholder="最大"
                  />
                  <span class="delay-unit">ms</span>
                </div>
              </div>
            </div>

            <!-- Byte count & Delete button -->
            <div class="step-actions">
              <span class="step-bytes" :class="{ 'byte-over': totalBytes > MAX_MACRO_BYTES }">{{ calcStepBytes(step) }}B</span>
              <button class="step-delete" @click="removeStep(index)">✕</button>
            </div>
          </div>

          <div class="empty-hint" v-if="steps.length === 0">
            暂无步骤，点击下方添加动作
          </div>
        </div>

        <!-- Toolbar -->
        <div class="step-toolbar">
          <button class="gaming-btn" @click="addStep">
            + 添加动作
          </button>
          <div class="toolbar-right">
            <button class="gaming-btn btn-success" :disabled="steps.length === 0 || totalBytes > MAX_MACRO_BYTES || !deviceStore.isConnected" @click="saveToDevice">
              保存到设备
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Key code picker dialog -->
    <el-dialog
      v-model="keyPickerVisible"
      title="选择按键"
      width="720px"
      :close-on-click-modal="false"
      class="key-picker-dialog"
    >
      <KeyCodeSelector @select="onKeyPicked" ref="keyPickerRef" />
      <template #footer>
        <button class="gaming-btn" @click="keyPickerVisible = false">关闭</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import KeyCodeSelector from '@/components/mapping/KeyCodeSelector.vue'
import { useDeviceStore } from '@/stores/modules/device'
import { ElMessage } from 'element-plus'
import { parseMacroData, serializeMacroData, MAX_MACRO_BYTES } from '@/utils/macroProtocol'

interface KeyEntry {
  code: number
  label: string
}

interface MacroStep {
  id: string
  action: 'press' | 'click' | 'release' | 'text' | 'delay'
  keys: KeyEntry[]
  text?: string
  duration?: number
  delayRandom?: boolean
  delayMin?: number
  delayMax?: number
}

function calcStepBytes(step: MacroStep): number {
  switch (step.action) {
    case 'press':
    case 'click':
    case 'release':
      return 2 + step.keys.length  // 1(action) + 1(count) + N(keyCodes)
    case 'text':
      return 2 + (step.text?.length || 0)  // 1(action) + 1(length) + N(chars)
    case 'delay':
      return 6  // 1(action) + 1(len) + 2(T0) + 2(T1)
    default:
      return 0
  }
}

const totalBytes = computed(() => {
  let total = 0
  for (const step of steps.value) {
    total += calcStepBytes(step)
  }
  // +1 字节总动作数头
  return total + 1
})

const deviceStore = useDeviceStore()

const MACRO_COUNT = 15

const macroData = ref<MacroStep[][]>(
  Array.from({ length: MACRO_COUNT }, () => [])
)
const macroSelectIndex = ref(0)
const steps = ref<MacroStep[]>(macroData.value[0])
const keyPickerVisible = ref(false)
const editingStepIndex = ref(-1)
const editKeyIndex = ref(-1)
const keyPickerRef = ref<any>(null)

let stepCounter = 0
function genId(): string {
  return `step_${++stepCounter}`
}

function switchMacro(index: number) {
  macroSelectIndex.value = index
  steps.value = macroData.value[index]
  fetchCurrentMacro()
}

function addStep() {
  const newStep: MacroStep = { id: genId(), action: 'press', keys: [] }
  if (totalBytes.value + calcStepBytes(newStep) > MAX_MACRO_BYTES) {
    ElMessage.warning(`数据已超出 ${MAX_MACRO_BYTES} 字节限制，无法添加新动作`)
    return
  }
  steps.value.push(newStep)
}

function removeStep(index: number) {
  steps.value.splice(index, 1)
}

function onActionChange(step: MacroStep) {
  // Reset params when action changes
  step.keys = []
  delete step.text
  delete step.duration
  delete step.delayRandom
  delete step.delayMin
  delete step.delayMax
}

function removeKey(stepIndex: number, keyIndex: number) {
  const step = steps.value[stepIndex]
  if (step) {
    step.keys.splice(keyIndex, 1)
  }
}

function openKeyPicker(index: number) {
  editingStepIndex.value = index
  keyPickerVisible.value = true
  // Reset KeyCodeSelector selection
  keyPickerRef.value?.clearSelection()
}

function onKeyPicked(key: any) {
  if (editingStepIndex.value >= 0 && editingStepIndex.value < steps.value.length) {
    const step = steps.value[editingStepIndex.value]
    if (editKeyIndex.value >= 0 && editKeyIndex.value < step.keys.length) {
      // Replace existing key
      step.keys[editKeyIndex.value] = { code: key.code, label: key.label }
    } else {
      // Add new key - check byte limit
      const newBytes = 2 + (step.keys.length + 1)
      const otherBytes = totalBytes.value - calcStepBytes(step)
      if (otherBytes + newBytes > MAX_MACRO_BYTES) {
        ElMessage.warning(`数据已超出 ${MAX_MACRO_BYTES} 字节限制，无法添加更多按键`)
        keyPickerVisible.value = false
        editingStepIndex.value = -1
        editKeyIndex.value = -1
        return
      }
      step.keys.push({ code: key.code, label: key.label })
    }
  }
  keyPickerVisible.value = false
  editingStepIndex.value = -1
  editKeyIndex.value = -1
}

async function fetchCurrentMacro() {
  if (!deviceStore.isConnected || !deviceStore.protocol) return
  const idx = macroSelectIndex.value
  try {
    const raw = await deviceStore.protocol.getMacroData(idx)
    console.log(`[MacroView] 宏 M${idx} 原始数据 (${raw.length}B):`, Array.from(raw).map(b => b.toString(16).padStart(2, '0')).join(' '))
    macroData.value[idx] = parseMacroData(raw)
  } catch (e) {
    console.warn(`[MacroView] 获取宏 M${idx} 失败:`, e)
    macroData.value[idx] = []
  }
  steps.value = macroData.value[idx]
}

onMounted(() => {
  fetchCurrentMacro()
})

// 监听 protocol 就绪，设备完全连接后自动获取宏数据
watch(() => deviceStore.protocol, (proto) => {
  if (proto) {
    fetchCurrentMacro()
  }
})

function validatePressReleasePairs(): string | null {
  const stepsList = steps.value
  const pressIndices: number[] = []
  const releaseIndices: number[] = []

  for (let i = 0; i < stepsList.length; i++) {
    const s = stepsList[i]
    if (s.action === 'press') pressIndices.push(i)
    else if (s.action === 'release') releaseIndices.push(i)
  }

  if (pressIndices.length !== releaseIndices.length) {
    return '按下与抬起是一对组合，按键值必须一致才能保存！'
  }

  for (let pi = 0; pi < pressIndices.length; pi++) {
    const pressStep = stepsList[pressIndices[pi]]
    const releaseStep = stepsList[releaseIndices[pi]]

    if (pressStep.keys.length !== releaseStep.keys.length) {
      return '按下与抬起是一对组合，按键值必须一致才能保存！'
    }

    for (let ki = 0; ki < pressStep.keys.length; ki++) {
      if (pressStep.keys[ki].code !== releaseStep.keys[ki].code) {
        return '按下与抬起是一对组合，按键值必须一致才能保存！'
      }
    }
  }

  return null
}

async function saveToDevice() {
  const err = validatePressReleasePairs()
  if (err) {
    ElMessage.warning(err)
    return
  }
  // 检查文本动作中是否包含中文字符
  for (const step of steps.value) {
    if (step.action === 'text' && step.text) {
      if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(step.text)) {
        ElMessage.warning('当前文本不支持中文输入！')
        return
      }
    }
  }
  if (!deviceStore.isConnected || !deviceStore.protocol) {
    ElMessage.warning('设备未连接')
    return
  }
  try {
    const data = serializeMacroData(steps.value)
    if (data.length > MAX_MACRO_BYTES) {
      ElMessage.warning(`数据超出 ${MAX_MACRO_BYTES} 字节限制 (${data.length}B)，无法保存`)
      return
    }
    await deviceStore.protocol.saveMacroData(macroSelectIndex.value, data)
    ElMessage.success(`宏 M${macroSelectIndex.value} 已保存 (${data.length}B)`)
  } catch (e) {
    console.error('[MacroView] 保存宏失败:', e)
    ElMessage.error('保存宏失败')
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.macro-view {
  width: 100%;
  height: 100%;
  padding: 24px;
  overflow: auto;
}

.macro-container {
  max-width: 1000px;
  margin: 0 auto;
}

.macro-panel {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: 20px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h3 {
    font-size: 16px;
    color: $text-primary;
  }
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-count {
  font-size: 13px;
  color: $text-muted;
}

.byte-count {
  font-size: 12px;
  color: $text-muted;
  font-family: monospace;
  padding: 2px 8px;
  background: $bg-secondary;
  border-radius: $radius-sm;

  &.byte-over {
    color: #fff;
    background: $danger-color;
  }
}


/* Macro selector */
.macro-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid $border-color;

  .selector-label {
    font-size: 13px;
    color: $text-secondary;
    white-space: nowrap;
  }

  .macro-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .macro-btn {
    width: 48px;
    height: 30px;
    border: 1px solid $border-color;
    border-radius: $radius-sm;
    background: $bg-card;
    color: $text-secondary;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: $accent-blue;
      color: $accent-blue;
    }

    &.active {
      background: $accent-blue;
      color: #fff;
      border-color: $accent-blue;
    }

    &.hasData {
      border-color: #52c41a;
      color: #52c41a;

      &.active {
        background: $accent-blue;
        color: #fff;
        border-color: $accent-blue;
      }
    }
  }
}

/* Step list */
.step-list {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.step-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  margin-bottom: 6px;

  .step-index {
    width: 24px;
    text-align: center;
    color: $text-muted;
    font-size: 12px;
    font-weight: 600;
  }

  .step-action {
    width: 80px;
    padding: 6px 4px;
    background: $bg-card;
    border: 1px solid $border-color;
    border-radius: $radius-sm;
    color: $text-primary;
    font-size: 13px;
    cursor: pointer;
    outline: none;

    &:focus {
      border-color: $accent-blue;
    }
  }

  .step-param {
    flex: 1;
    min-width: 0;
  }

  .step-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .step-bytes {
    font-size: 11px;
    color: $text-muted;
    font-family: monospace;
    white-space: nowrap;

    &.byte-over {
      color: $danger-color;
    }
  }

  .step-delete {
    width: 28px;
    height: 28px;
    border: 1px solid transparent;
    border-radius: $radius-sm;
    background: transparent;
    color: $text-muted;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      border-color: $danger-color;
      color: $danger-color;
      background: rgba(255, 77, 77, 0.1);
    }
  }
}

/* Multi-key selector */
.param-multi-keys {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 32px;
}

.key-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.key-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: $accent-blue;
  color: #fff;
  font-size: 12px;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: darken($accent-blue, 10%);
  }

  .key-tag-remove {
    font-size: 10px;
    cursor: pointer;
    opacity: 0.7;
    margin-left: 2px;

    &:hover {
      opacity: 1;
    }
  }
}

.key-add-btn {
  padding: 3px 10px;
  background: transparent;
  border: 1px dashed $border-color;
  border-radius: $radius-sm;
  color: $text-secondary;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    border-color: $accent-blue;
    color: $accent-blue;
  }
}

.key-empty-hint {
  color: $text-muted;
  font-size: 12px;
}

/* Text/delay input */
.param-input {
  width: 100%;
  padding: 6px 10px;
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  color: $text-primary;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: $accent-blue;
  }

  &::placeholder {
    color: $text-muted;
  }
}

.delay-input {
  width: 100px;
  display: inline-block;
}

.param-delay {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.delay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .delay-label {
    color: $text-secondary;
    font-size: 12px;
  }
}

.delay-fixed {
  display: flex;
  align-items: center;
  gap: 6px;
}

.delay-random {
  display: flex;
  align-items: center;
  gap: 4px;

  .delay-sep {
    color: $text-secondary;
    font-size: 14px;
    font-weight: 600;
  }
}

.delay-unit {
  color: $text-secondary;
  font-size: 13px;
  white-space: nowrap;
}

/* Toggle switch */
.delay-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;

  .toggle-text {
    font-size: 12px;
    color: $text-muted;
  }

  input {
    display: none;
  }

  .toggle-slider {
    width: 32px;
    height: 18px;
    background: $border-color;
    border-radius: 9px;
    position: relative;
    transition: background 0.2s;

    &::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 14px;
      height: 14px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s;
    }
  }

  input:checked + .toggle-slider {
    background: $accent-blue;

    &::after {
      transform: translateX(14px);
    }
  }
}

/* Toolbar */
.step-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;

  .toolbar-right {
    display: flex;
    gap: 8px;
  }
}

.empty-hint {
  text-align: center;
  padding: 40px 20px;
  color: $text-muted;
  font-size: 14px;
}

/* Key picker dialog */
.key-picker-dialog {
  :deep(.el-dialog__body) {
    padding: 12px 20px;
  }
}
</style>
