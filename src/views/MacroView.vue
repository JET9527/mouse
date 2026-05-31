<template>
  <div class="macro-view">
    <div class="macro-container">
      <!-- Left: Recording and event list -->
      <div class="macro-panel">
        <div class="panel-header">
          <h3>宏录制</h3>
          <div class="recording-indicator" v-if="macroStore.isRecording">
            <span class="recording-dot"></span>
            录制中...
          </div>
        </div>

        <div class="recording-controls">
          <button
            class="gaming-btn"
            :class="{ 'btn-danger': macroStore.isRecording }"
            @click="toggleRecording"
          >
            {{ macroStore.isRecording ? '停止录制' : '开始录制' }}
          </button>
          <span class="event-count">
            {{ macroStore.currentRecordingEvents.length }} 个事件
          </span>
        </div>

        <div class="event-list">
          <div class="event-item" v-for="(event, index) in macroStore.currentRecordingEvents" :key="index">
            <span class="event-type">{{ getEventLabel(event.type) }}</span>
            <span class="event-detail">{{ getEventDetail(event) }}</span>
            <span class="event-time">{{ event.timestamp }}ms</span>
          </div>
          <div class="empty-hint" v-if="macroStore.currentRecordingEvents.length === 0">
            点击"开始录制"捕获按键和鼠标操作
          </div>
        </div>
      </div>

      <!-- Right: Macro library -->
      <div class="macro-panel">
        <div class="panel-header">
          <h3>宏列表</h3>
          <span class="macro-count">{{ macroStore.macros.length }} 个宏</span>
        </div>

        <div class="macro-list">
          <div class="macro-item" v-for="macro in macroStore.macros" :key="macro.id">
            <div class="macro-info">
              <div class="macro-name">{{ macro.name }}</div>
              <div class="macro-detail">{{ macro.events.length }} 个事件</div>
            </div>
            <div class="macro-actions">
              <button class="gaming-btn btn-sm" @click="sendMacroToDevice(macro)">
                发送
              </button>
              <button class="gaming-btn btn-sm btn-danger" @click="deleteMacro(macro.id)">
                删除
              </button>
            </div>
          </div>
          <div class="empty-hint" v-if="macroStore.macros.length === 0">
            暂无宏，请先录制
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMacroStore } from '@/stores/modules/macro'
import { useDeviceStore } from '@/stores/modules/device'
import { useWebHID } from '@/composables/useWebHID'
import { HIDProtocol } from '@/services/hidProtocol'
import { serializeMacro } from '@/utils/helpers'
import { ElMessage, ElMessageBox } from 'element-plus'

const macroStore = useMacroStore()
const deviceStore = useDeviceStore()
const { sendReport } = useWebHID()
const protocol = new HIDProtocol(sendReport)

// Global event handlers for recording
let keyDownHandler: ((e: KeyboardEvent) => void) | null = null
let keyUpHandler: ((e: KeyboardEvent) => void) | null = null
let mouseDownHandler: ((e: MouseEvent) => void) | null = null
let mouseUpHandler: ((e: MouseEvent) => void) | null = null

function toggleRecording() {
  if (macroStore.isRecording) {
    stopRecording()
  } else {
    startRecording()
  }
}

function startRecording() {
  macroStore.startRecording()

  keyDownHandler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'r') return
    macroStore.addRecordingEvent({
      type: 'keyDown',
      timestamp: Date.now() - (Date.now() - macroStore.currentRecordingEvents[0]?.timestamp || 0),
      keyCode: e.code,
      keyLabel: e.key,
    })
  }

  keyUpHandler = (e: KeyboardEvent) => {
    macroStore.addRecordingEvent({
      type: 'keyUp',
      timestamp: Date.now(),
      keyCode: e.code,
      keyLabel: e.key,
    })
  }

  mouseDownHandler = (e: MouseEvent) => {
    macroStore.addRecordingEvent({
      type: 'mouseDown',
      timestamp: Date.now(),
      button: e.button,
    })
  }

  mouseUpHandler = (e: MouseEvent) => {
    macroStore.addRecordingEvent({
      type: 'mouseUp',
      timestamp: Date.now(),
      button: e.button,
    })
  }

  window.addEventListener('keydown', keyDownHandler)
  window.addEventListener('keyup', keyUpHandler)
  window.addEventListener('mousedown', mouseDownHandler)
  window.addEventListener('mouseup', mouseUpHandler)
}

function stopRecording() {
  if (keyDownHandler) window.removeEventListener('keydown', keyDownHandler)
  if (keyUpHandler) window.removeEventListener('keyup', keyUpHandler)
  if (mouseDownHandler) window.removeEventListener('mousedown', mouseDownHandler)
  if (mouseUpHandler) window.removeEventListener('mouseup', mouseUpHandler)
  macroStore.stopRecording()
}

function getEventLabel(type: string): string {
  const labels: Record<string, string> = {
    keyDown: '按下',
    keyUp: '抬起',
    mouseDown: '点击',
    mouseUp: '释放',
    delay: '延迟',
  }
  return labels[type] || type
}

function getEventDetail(event: any): string {
  if (event.keyLabel) return event.keyLabel
  if (event.button !== undefined) return `按钮${event.button}`
  if (event.duration !== undefined) return `${event.duration}ms`
  return ''
}

async function sendMacroToDevice(macro: any) {
  if (!deviceStore.isConnected) {
    ElMessage.warning('请先连接设备')
    return
  }
  try {
    const data = serializeMacro(macro.events)
    await protocol.setMacro(1, data)
    ElMessage.success(`宏"${macro.name}"已发送到设备`)
  } catch (error: any) {
    ElMessage.error('发送失败: ' + error.message)
  }
}

async function deleteMacro(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除这个宏吗？', '提示', { type: 'warning' })
    macroStore.deleteMacro(id)
    ElMessage.success('已删除')
  } catch {
    // Cancelled
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 1100px;
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

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: $danger-color;
  font-size: 13px;
  animation: blink 1s infinite;
}

.recording-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $danger-color;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.recording-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.event-count {
  font-size: 13px;
  color: $text-secondary;
}

.event-list, .macro-list {
  max-height: 360px;
  overflow-y: auto;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: $bg-secondary;
  border-radius: $radius-sm;
  margin-bottom: 4px;
  font-size: 13px;

  .event-type {
    color: $accent-blue;
    min-width: 40px;
  }

  .event-detail {
    flex: 1;
    color: $text-primary;
  }

  .event-time {
    color: $text-muted;
    font-size: 12px;
  }
}

.macro-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  margin-bottom: 8px;
}

.macro-name {
  font-size: 14px;
  color: $text-primary;
  font-weight: 500;
}

.macro-detail {
  font-size: 12px;
  color: $text-muted;
  margin-top: 2px;
}

.macro-actions {
  display: flex;
  gap: 6px;
}

.empty-hint {
  text-align: center;
  padding: 40px 20px;
  color: $text-muted;
  font-size: 14px;
}
</style>
