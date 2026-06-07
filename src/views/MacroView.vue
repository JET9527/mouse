<template>
  <div class="macro-view">
    <!--宏编辑主卡片【全屏宽】-->
    <div class="macro-card">
      <!--M0~M14槽位-->
      <div class="macro-tab-bar">
        <button
          v-for="i in MACRO_COUNT"
          :key="i - 1"
          class="macro-slot"
          :class="{ active: macroSelectIndex === i - 1, hasData: macroData[i - 1].length > 0 }"
          @click="switchMacro(i - 1)"
        >
          M{{ i - 1 }}
        </button>
      </div>

      <!--标题+剩余内存-->
      <div class="macro-head-row">
        <div class="macro-title">编辑宏动作</div>
        <div class="mem-info">剩余内存：{{ totalBytes }} / {{ MAX_MACRO_BYTES }} B</div>
      </div>

      <!--动作条目列表-->
      <div class="action-list" @dragover.prevent="onDragOver" @drop.prevent="onDrop">
        <div
          class="action-item"
          :class="{ 'drag-over': dragOverIndex === index }"
          v-for="(step, index) in steps"
          :key="step.id"
          draggable="true"
          @dragstart="onDragStart($event, index)"
          @dragend="onDragEnd"
          @dragover.prevent="onDragItemOver(index)"
        >
          <span class="drag-handle" title="拖拽排序">⠿</span>
          <span class="action-index">{{ index + 1 }}</span>

          <!-- 动作类型下拉 -->
          <select class="sel-action-type" v-model="step.action" @change="onActionChange(step)">
            <option value="press">按下</option>
            <option value="click">点击</option>
            <option value="release">抬起</option>
            <option value="text">文本</option>
            <option value="delay">延时</option>
          </select>

          <!-- 参数输入 -->
          <div class="step-param">
            <!-- 按下/点击/抬起 -->
            <div v-if="step.action === 'press' || step.action === 'click' || step.action === 'release'" class="param-multi-keys">
              <span
                v-for="(k, ki) in step.keys"
                :key="ki"
                class="key-tag-item"
                @click="editKeyIndex = ki; openKeyPicker(index)"
              >
                {{ k.label }}
                <span class="key-tag-remove" @click.stop="removeKey(index, ki)">✕</span>
              </span>
              <span class="add-key-text" @click="editKeyIndex = -1; openKeyPicker(index)">+添加按键</span>
              <div v-if="step.keys.length === 0" class="key-empty-hint">尚未添加按键</div>
            </div>
            <!-- 文本 -->
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

          <!-- 占用字节 & 删除 -->
          <span class="byte-desc" :class="{ 'byte-over': totalBytes > MAX_MACRO_BYTES }">{{ calcStepBytes(step) }}B</span>
          <span class="del-action" @click="removeStep(index)">×</span>
        </div>

        <div class="empty-hint" v-if="steps.length === 0">暂无步骤，点击下方添加动作</div>
      </div>

      <!--底部按钮栏-->
      <div class="macro-bottom-bar">
        <button class="add-action-btn" @click="addStep">+ 添加动作</button>
        <button class="save-macro-btn" :disabled="steps.length === 0 || totalBytes > MAX_MACRO_BYTES || !deviceStore.isConnected" @click="saveToDevice">保存到设备</button>
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
import { useKeyMappingStore } from '@/stores/modules/keyMapping'
import { useAppStore } from '@/stores/modules/app'
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
const appStore = useAppStore()

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
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

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

// 拖拽排序
let dragFromIndex = -1

function onDragStart(e: DragEvent, index: number) {
  dragFromIndex = index
  dragIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
  dragFromIndex = -1
}

function onDragOver(e: DragEvent) {
  // 阻止默认，允许 drop
}

function onDragItemOver(index: number) {
  dragOverIndex.value = index
}

function onDrop(e: DragEvent) {
  const from = dragFromIndex
  const to = dragOverIndex.value
  dragIndex.value = null
  dragOverIndex.value = null
  dragFromIndex = -1
  if (from < 0 || to === null || from === to) return
  moveStep(from, to)
}

function moveStep(from: number, to: number) {
  const item = steps.value.splice(from, 1)[0]
  steps.value.splice(to, 0, item)
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

// 恢复出厂设置后重新获取宏数据
watch(() => appStore.factoryResetVersion, async () => {
  if (!deviceStore.isConnected || !deviceStore.protocol) return
  console.log('[MacroView] 恢复出厂后重新获取宏数据...')
  await fetchCurrentMacro()
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
.macro-view {
  width: 100%;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  overflow: auto;
}

.macro-card {
  width: 100%;
  background: #181C29;
  border: 1px solid rgba(0,229,255,0.3);
  border-radius: 10px;
  padding: 26px;
  box-shadow: 0 0 14px rgba(0,229,255,0.15);
}

/* M0~M14槽位标签栏 */
.macro-tab-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}

.macro-slot {
  width: 56px;
  height: 38px;
  line-height: 38px;
  text-align: center;
  background: #22283A;
  border: 1px solid rgba(0,229,255,0.25);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: 0.25s;
  color: #8A98B3;

  &.active {
    background: linear-gradient(90deg,#007899,#00C9E6);
    color: #fff;
    border-color: #00E5FF;
    box-shadow: 0 0 6px #00E5FF60;
  }

  &:hover:not(.active) {
    border-color: #00E5FF;
    color: #E6EDF7;
  }

  &.hasData {
    border-color: #39FF77;
    color: #39FF77;

    &.active {
      background: linear-gradient(90deg,#007899,#00C9E6);
      color: #fff;
      border-color: #00E5FF;
    }
  }
}

/* 编辑动作头部 */
.macro-head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.macro-title {
  font-size: 18px;
  font-weight: 500;
  color: #E6EDF7;
}

.mem-info {
  font-size: 13px;
  color: #8A98B3;
}

/* 动作条目列表 */
.action-list {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #22283A;
  border: 1px solid rgba(0,229,255,0.18);
  border-radius: 6px;
  padding: 14px 16px;
  margin-bottom: 12px;

  .action-index {
    color: #8A98B3;
    min-width: 26px;
    font-size: 13px;
  }
}

/* 下拉选择框 */
.sel-action-type {
  background: #0C0E16;
  color: #E6EDF7;
  border: 1px solid rgba(0,229,255,0.35);
  padding: 6px 10px;
  border-radius: 4px;
  outline: none;
  min-width: 110px;
  font-size: 13px;
  cursor: pointer;
}

/* 按键标签 */
.key-tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #00E5FF;
  color: #000;
  padding: 5px 10px;
  border-radius: 3px;
  font-size: 14px;
  cursor: pointer;

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

.add-key-text {
  color: #00E5FF;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.byte-desc {
  margin-left: auto;
  color: #8A98B3;
  font-size: 13px;
  font-family: monospace;
  white-space: nowrap;

  &.byte-over {
    color: #FF3355;
  }
}

.del-action {
  width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  color: #FF3355;
  border: 1px solid #FF335560;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;

  &:hover {
    background: #FF3355;
    color: #fff;
  }
}

/* 底部按钮栏 */
.macro-bottom-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 28px;
}

.add-action-btn {
  padding: 10px 22px;
  background: transparent;
  border: 1px solid #00E5FF;
  color: #00E5FF;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.3s;
  font-size: 14px;

  &:hover {
    background: #00E5FF;
    color: #0C0E16;
    box-shadow: 0 0 8px #00E5FF66;
  }
}

.save-macro-btn {
  padding: 10px 22px;
  background: #39FF77;
  color: #000;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.3s;
  font-size: 14px;

  &:hover:not(:disabled) {
    box-shadow: 0 0 10px #39FF7770;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

/* 参数输入区 */
.step-param {
  flex: 1;
  min-width: 0;
}

.param-multi-keys {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 32px;
}

.key-empty-hint {
  color: #8A98B3;
  font-size: 12px;
}

.param-input {
  width: 100%;
  padding: 6px 10px;
  background: #0C0E16;
  border: 1px solid rgba(0,229,255,0.35);
  border-radius: 4px;
  color: #E6EDF7;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #00E5FF;
  }

  &::placeholder {
    color: #8A98B3;
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
    color: #8A98B3;
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
    color: #8A98B3;
    font-size: 14px;
    font-weight: 600;
  }
}

.delay-unit {
  color: #8A98B3;
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
    color: #8A98B3;
  }

  input {
    display: none;
  }

  .toggle-slider {
    width: 32px;
    height: 18px;
    background: #2c3447;
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
    background: #00E5FF;

    &::after {
      transform: translateX(14px);
    }
  }
}

.empty-hint {
  text-align: center;
  padding: 40px 20px;
  color: #8A98B3;
  font-size: 14px;
}

/* 拖拽把手 */
.drag-handle {
  color: #555;
  font-size: 16px;
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
  letter-spacing: 2px;
  transition: color 0.2s;

  &:hover {
    color: #00E5FF;
  }
}

.action-item {
  &.drag-over {
    border-color: #00E5FF;
    box-shadow: 0 0 10px #00E5FF60;
    background: #28304A;
  }
}

.key-picker-dialog {
  :deep(.el-dialog__body) {
    padding: 12px 20px;
  }
}
</style>
