<template>
  <div class="settings-view">
    <div class="settings-container">
      <!-- DPI Settings -->
      <div class="settings-panel">
        <div class="panel-title">
          <el-icon><Aim /></el-icon>
          DPI 设置
        </div>

        <div class="dpi-levels">
          <div class="dpi-level-item" v-for="(level, index) in dpiLevels" :key="index">
            <span class="level-label">档位 {{ index + 1 }}</span>
            <div class="level-inputs">
              <div class="input-group">
                <label>X</label>
                <input type="number" v-model.number="level.dpiX" :min="100" :max="26000" :step="50" />
              </div>
              <div class="input-group">
                <label>Y</label>
                <input type="number" v-model.number="level.dpiY" :min="100" :max="26000" :step="50" />
              </div>
            </div>
            <el-switch
              v-model="level.enabled"
              active-text="启用"
              :active-color="'#00d4ff'"
            />
          </div>
        </div>

        <div class="setting-row">
          <label>当前档位</label>
          <el-select v-model="activeDpiIndex" size="small" style="width: 120px">
            <el-option v-for="i in 5" :key="i" :label="`档位 ${i}`" :value="i - 1" />
          </el-select>
        </div>
      </div>

      <!-- Polling Rate -->
      <div class="settings-panel">
        <div class="panel-title">
          <el-icon><Timer /></el-icon>
          回报率设置
        </div>

        <div class="polling-rates">
          <button
            v-for="rate in [125, 250, 500, 1000, 2000, 4000]"
            :key="rate"
            class="rate-btn"
            :class="{ active: pollingRate === rate }"
            @click="pollingRate = rate"
          >
            {{ rate }}Hz
          </button>
        </div>
      </div>

      <!-- Pointer & Wheel Speed -->
      <div class="settings-panel">
        <div class="panel-title">
          <el-icon><Pointer /></el-icon>
          速度设置
        </div>

        <div class="setting-row">
          <label>指针速度</label>
          <el-slider v-model="pointerSpeed" :min="1" :max="20" :step="1" show-input input-size="small" />
        </div>

        <div class="setting-row">
          <label>滚轮速度</label>
          <el-slider v-model="wheelSpeed" :min="1" :max="20" :step="1" show-input input-size="small" />
        </div>
      </div>

      <!-- Fire Key -->
      <div class="settings-panel">
        <div class="panel-title">
          <el-icon><Odometer /></el-icon>
          火力键设置
        </div>

        <div class="setting-row">
          <label>启用火力键</label>
          <el-switch v-model="fireKeyEnabled" active-color="#00d4ff" />
        </div>

        <div class="setting-row" v-if="fireKeyEnabled">
          <label>触发按钮</label>
          <el-select v-model="fireKeyButton" size="small" style="width: 120px">
            <el-option v-for="btn in fireKeyButtons" :key="btn.id" :label="btn.label" :value="btn.id" />
          </el-select>
        </div>

        <div class="setting-row" v-if="fireKeyEnabled">
          <label>点击间隔 (ms)</label>
          <el-input-number v-model="fireKeyInterval" :min="10" :max="500" :step="10" size="small" />
        </div>

        <div class="setting-row" v-if="fireKeyEnabled">
          <label>持续时间 (ms, 0=持续)</label>
          <el-input-number v-model="fireKeyDuration" :min="0" :max="60000" :step="100" size="small" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Aim, Timer, Pointer, Odometer } from '@element-plus/icons-vue'
import { useDeviceStore } from '@/stores/modules/device'
import { useWebHID } from '@/composables/useWebHID'
import { HIDProtocol } from '@/services/hidProtocol'
import { ElMessage } from 'element-plus'

const deviceStore = useDeviceStore()
const { sendReport } = useWebHID()
const protocol = new HIDProtocol(sendReport)

const dpiLevels = ref([
  { dpiX: 800, dpiY: 800, enabled: true },
  { dpiX: 1200, dpiY: 1200, enabled: true },
  { dpiX: 1600, dpiY: 1600, enabled: true },
  { dpiX: 2400, dpiY: 2400, enabled: false },
  { dpiX: 3200, dpiY: 3200, enabled: false },
])

const activeDpiIndex = ref(0)
const pollingRate = ref(1000)
const pointerSpeed = ref(10)
const wheelSpeed = ref(10)
const fireKeyEnabled = ref(false)
const fireKeyButton = ref(9)
const fireKeyInterval = ref(50)
const fireKeyDuration = ref(0)

const fireKeyButtons = [
  { id: 1, label: '左键' },
  { id: 2, label: '右键' },
  { id: 3, label: '中键' },
  { id: 4, label: '前进' },
  { id: 5, label: '后退' },
  { id: 6, label: 'DPI+' },
  { id: 7, label: 'DPI-' },
  { id: 8, label: '老按键' },
  { id: 9, label: '火力键' },
]

// Watch for changes and auto-send to device
import { watch } from 'vue'

watch(pollingRate, async (newRate) => {
  if (deviceStore.isConnected) {
    try {
      await protocol.setPollingRate(newRate)
      ElMessage.success(`回报率已设置为 ${newRate}Hz`)
    } catch (e) {
      console.error('设置回报率失败:', e)
    }
  }
})

watch(pointerSpeed, async (newVal) => {
  if (deviceStore.isConnected) {
    // Send pointer speed to device
  }
})

watch(wheelSpeed, async (newVal) => {
  if (deviceStore.isConnected) {
    // Send wheel speed to device
  }
})

watch(fireKeyEnabled, async (enabled) => {
  if (deviceStore.isConnected && enabled) {
    try {
      await protocol.setFireKey(true, fireKeyButton.value, fireKeyInterval.value, fireKeyDuration.value)
    } catch (e) {
      console.error('设置火力键失败:', e)
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.settings-view {
  width: 100%;
  height: 100%;
  padding: 24px;
  overflow: auto;
}

.settings-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.settings-panel {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: 20px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: $accent-blue;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid $border-color;
}

.dpi-levels {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.dpi-level-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: $bg-secondary;
  border-radius: $radius-sm;
}

.level-label {
  font-size: 13px;
  color: $text-secondary;
  min-width: 50px;
}

.level-inputs {
  display: flex;
  gap: 8px;
  flex: 1;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 4px;

  label {
    font-size: 12px;
    color: $text-muted;
  }

  input {
    width: 70px;
  }
}

.polling-rates {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.rate-btn {
  padding: 10px;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  color: $text-primary;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: $accent-blue;
  }

  &.active {
    border-color: $accent-blue;
    background: rgba(0, 212, 255, 0.15);
    color: $accent-blue;
    box-shadow: $glow-blue;
  }
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(42, 42, 74, 0.5);

  &:last-child {
    border-bottom: none;
  }

  label {
    font-size: 14px;
    color: $text-secondary;
  }
}
</style>
