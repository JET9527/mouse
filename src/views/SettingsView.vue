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
          <div class="dpi-level-item" v-for="(dpi, index) in dpiValues" :key="index">
            <span class="level-label">档位 {{ index + 1 }}</span>
            <span class="level-value">{{ dpi }} DPI</span>
            <el-switch
              :model-value="dpiEnabled[index]"
              active-text="启用"
              :active-color="'#00d4ff'"
              @change="(val: boolean) => onDpiSwitchChange(val, index)"
            />
          </div>
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
            v-for="rate in pollingRateOptions"
            :key="rate"
            class="rate-btn"
            :class="{ active: pollingRate === rate }"
            @click="onPollingRateChange(rate)"
          >
            {{ rate }}Hz
          </button>
        </div>
      </div>

      <!-- Sleep Time -->
      <div class="settings-panel sleep-panel">
        <div class="panel-title">
          <el-icon><Moon /></el-icon>
          休眠时间设置
        </div>

        <el-slider
          v-model="sleepLevel"
          :min="0"
          :max="4"
          :step="1"
          show-stops
          :marks="{
            0: '档位1',
            1: '档位2',
            2: '档位3',
            3: '档位4',
            4: '档位5'
          }"
          @change="onSleepLevelChange"
        />
      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Aim, Timer, Moon } from '@element-plus/icons-vue'
import { useDeviceStore } from '@/stores/modules/device'
import { ElMessage } from 'element-plus'

const deviceStore = useDeviceStore()

// DPI 6档固定值（对应协议0x00~0x05）
const dpiValues = [800, 1600, 3200, 4800, 9600, 20000]
const dpiEnabled = ref([true, false, false, false, false, false])

// 回报率 7档（对应协议0x00~0x06）
const pollingRateOptions = [125, 250, 500, 1000, 2000, 4000, 8000]
const pollingRate = ref(1000)

// 休眠时间 5档（对应协议0x00~0x04）
const sleepLevel = ref(0)

// 保存设备原始性能参数（指针速度、滚轮速度、火力键时间等保留原值）
let originalRaw: Uint8Array | null = null

// 性能参数 8字节格式: {ptrSpeed, wheelSpeed, fireTime(LE), pollingRateIdx, dpiLevel, sleepLevel, reserved}
function buildPerformanceData(): Uint8Array {
  const data = originalRaw ? new Uint8Array(originalRaw) : new Uint8Array(8)
  data[4] = pollingRateOptions.indexOf(pollingRate.value) // 回报率索引
  data[5] = dpiEnabled.value.findIndex(v => v) // DPI挡位
  data[6] = sleepLevel.value // 休眠时间
  return data
}

async function saveToDevice(context: string = '') {
  if (!deviceStore.isConnected || !deviceStore.protocol) return
  const perfData = buildPerformanceData()
  const hexStr = Array.from(perfData).map(b => b.toString(16).padStart(2, '0')).join(' ')
  console.log(`[Settings] 保存性能${context} data=[${hexStr}]`)
  try {
    await deviceStore.protocol.savePerformanceSettings(perfData)
    console.log(`[Settings] 保存性能${context} 成功`)
    ElMessage.success(`设置保存成功`)
  } catch (e) {
    console.error('[Settings] 保存设置失败:', e)
    ElMessage.error(`设置保存失败: ${(e as Error).message}`)
  }
}

// DPI switch 只能开一个
function onDpiSwitchChange(enabled: boolean, index: number) {
  if (!enabled) {
    dpiEnabled.value[index] = true
    return
  }
  for (let i = 0; i < dpiEnabled.value.length; i++) {
    dpiEnabled.value[i] = i === index
  }
  console.log(`[Settings] DPI挡位切换: 档位${index + 1}(${dpiValues[index]}DPI)`)
  saveToDevice('DPI')
}

// 页面加载时从设备获取性能参数
async function fetchSettings() {
  if (!deviceStore.isConnected || !deviceStore.protocol) return
  try {
    const raw = await deviceStore.protocol.getPerformanceSettings()
    const hexStr = Array.from(raw).map(b => b.toString(16).padStart(2, '0')).join(' ')
    console.log(`[Settings] 获取性能参数响应(8B): [${hexStr}]`)
    // 保存原始数据，后续保存时保留指针速度、滚轮速度、火力键时间
    originalRaw = new Uint8Array(raw)
    const newEnabled = new Array(6).fill(false)
    // raw[0]=指针速度, raw[1]=滚轮速度, raw[2~3]=火力键时间, raw[4]=回报率, raw[5]=DPI, raw[6]=休眠, raw[7]=保留
    const dpiLevel = raw[5]
    const rateIdx = raw[4]
    const sleepIdx = raw[6]
    console.log(`[Settings] 解析: DPI挡位=${dpiLevel}, 回报率索引=${rateIdx}, 休眠挡位=${sleepIdx}`)
    if (dpiLevel >= 0 && dpiLevel < 6) newEnabled[dpiLevel] = true
    dpiEnabled.value = newEnabled

    if (rateIdx >= 0 && rateIdx < pollingRateOptions.length) {
      pollingRate.value = pollingRateOptions[rateIdx]
    }

    sleepLevel.value = sleepIdx >= 0 && sleepIdx <= 4 ? sleepIdx : 0
  } catch (e) {
    console.error('[Settings] 获取设置失败:', e)
  }
}

// 设备连接且protocol就绪后自动获取
watch(() => deviceStore.isConnected && deviceStore.protocol, async (ready) => {
  if (ready) {
    await fetchSettings()
  }
}, { immediate: true })

// 回报率切换保存
function onPollingRateChange(rate: number) {
  pollingRate.value = rate
  console.log(`[Settings] 回报率切换: ${rate}Hz`)
  saveToDevice('回报率')
}

// 休眠时间切换保存
function onSleepLevelChange(val: number) {
  console.log(`[Settings] 休眠时间切换: 档位${val + 1}`)
  saveToDevice('休眠')
}




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

.level-value {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: $accent-blue;
}

.polling-rates {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.sleep-panel {
  grid-column: 1 / -1;
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
