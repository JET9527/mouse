<template>
  <div class="settings-view">
    <!-- 上侧DPI+回报率双栏 -->
    <div class="adv-top-wrap">
      <!-- 左侧DPI设置 -->
      <div class="col-dpi setting-card">
        <div class="card-title">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
          DPI设置
        </div>
        <div class="dpi-list">
          <div class="dpi-item" v-for="(dpi, index) in dpiValues" :key="index">
            <span class="dpi-name">档位 {{ index + 1 }} <span class="dpi-val">{{ dpi }} DPI</span></span>
            <div
              class="switch-ctrl"
              :class="{ on: dpiEnabled[index] }"
              @click="onDpiSwitchClick(index)"
            >
              <div class="switch-dot"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧回报率设置 -->
      <div class="col-rate setting-card">
        <div class="card-title">
          <svg viewBox="0 0 24 24"><path d="M13 2v8h8c0-4.42-3.58-8-8-8zm6.32 13.89C20.37 14.54 21 12.84 21 11H6.44l-.95-2H3v2h2.22s.89 4.09 4.66 7.12c1.79 1.46 3.98 2.28 6.22 2.28s4.43-.82 6.22-2.28c.98-.8 1.8-1.79 2.38-2.93z"/></svg>
          回报率设置
        </div>
        <div class="rate-grid">
          <div
            v-for="rate in pollingRateOptions"
            :key="rate"
            class="rate-btn"
            :class="{ active: pollingRate === rate }"
            @click="onPollingRateChange(rate)"
          >{{ rate }}Hz</div>
        </div>
      </div>
    </div>

    <!-- 休眠时间设置卡片 -->
    <div class="sleep-card setting-card">
      <div class="card-title">
        <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7zm-1-11h2v6h-2z"/></svg>
        休眠时间设置
      </div>
      <div class="slider-wrap">
        <div class="slider-bar" @mousedown.prevent="startSleepDrag">
          <div class="slider-fill" :style="{ width: (sleepLevel / 4 * 100) + '%' }"></div>
          <div class="slider-thumb" :style="{ left: (sleepLevel / 4 * 100) + '%' }"></div>
        </div>
        <div class="slider-mark">
          <span>档位1</span>
          <span>档位2</span>
          <span>档位3</span>
          <span>档位4</span>
          <span>档位5</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useDeviceStore } from '@/stores/modules/device'
import { useAppStore } from '@/stores/modules/app'
import { ElMessage } from 'element-plus'

const deviceStore = useDeviceStore()
const appStore = useAppStore()

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
function onDpiSwitchClick(index: number) {
  const current = dpiEnabled.value[index]
  if (current) return // 已经是开启状态，不允许关闭
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
    originalRaw = new Uint8Array(raw)
    const newEnabled = new Array(6).fill(false)
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

// 恢复出厂设置后重新获取性能参数
watch(() => appStore.factoryResetVersion, async () => {
  if (!deviceStore.isConnected || !deviceStore.protocol) return
  console.log('[SettingsView] 恢复出厂后重新获取性能参数...')
  await fetchSettings()
})

// 回报率切换保存
function onPollingRateChange(rate: number) {
  pollingRate.value = rate
  console.log(`[Settings] 回报率切换: ${rate}Hz`)
  saveToDevice('回报率')
}

// 自定义滑块拖拽
let sleepDragActive = false
let sleepBarEl: HTMLElement | null = null

function startSleepDrag(e: MouseEvent) {
  e.preventDefault()
  sleepBarEl = e.currentTarget as HTMLElement
  if (!sleepBarEl) return
  sleepDragActive = true
  updateSleepFromEvent(e)

  const onMove = (ev: MouseEvent) => {
    if (!sleepDragActive) return
    updateSleepFromEvent(ev)
  }
  const onUp = () => {
    sleepDragActive = false
    if (sleepBarEl) {
      // 抬起时保存到设备
      saveToDevice('休眠')
    }
    sleepBarEl = null
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function updateSleepFromEvent(e: MouseEvent) {
  if (!sleepBarEl) return
  const rect = sleepBarEl.getBoundingClientRect()
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const val = Math.round(pct * 4)
  if (val !== sleepLevel.value) {
    sleepLevel.value = val
  }
}

onUnmounted(() => {
  sleepDragActive = false
})

</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.settings-view {
  width: 100%;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  overflow: auto;
}

/* 上侧双栏布局 */
.adv-top-wrap {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.col-dpi {
  width: 48%;
}

.col-rate {
  width: 52%;
}

/* 通用卡片样式 */
.setting-card {
  background: #181C29;
  border: 1px solid rgba(0,229,255,0.3);
  border-radius: 10px;
  padding: 22px;
  box-shadow: 0 0 14px #00E5FF28;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #00E5FF;
  margin-bottom: 20px;
  font-size: 16px;

  svg {
    width: 16px;
    height: 16px;
    fill: #00E5FF;
  }
}

/* DPI档位条目 */
.dpi-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dpi-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #22283A;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid rgba(0,229,255,0.15);
}

.dpi-name {
  color: #E6EDF7;
  font-size: 14px;
}

.dpi-val {
  color: #00E5FF;
  margin-left: 8px;
  font-weight: 500;
}

/* 开关样式 */
.switch-ctrl {
  width: 36px;
  height: 18px;
  background: #2c3447;
  border-radius: 9px;
  position: relative;
  cursor: pointer;
  transition: 0.25s;
  flex-shrink: 0;

  &.on {
    background: #00E5FF;
    box-shadow: 0 0 6px #00E5FF60;
  }
}

.switch-dot {
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: 0.25s;
}

.switch-ctrl.on .switch-dot {
  left: 20px;
}

/* 回报率按钮网格 */
.rate-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.rate-btn {
  padding: 14px 0;
  text-align: center;
  background: #22283A;
  border: 1px solid rgba(0,229,255,0.25);
  border-radius: 6px;
  cursor: pointer;
  transition: 0.25s;
  color: #8A98B3;
  font-size: 14px;

  &.active {
    border: 1px solid #00E5FF;
    background: rgba(0,229,255,0.12);
    box-shadow: 0 0 8px #00E5FF50;
    color: #00E5FF;
  }

  &:hover:not(.active) {
    border-color: #00E5FF;
    color: #E6EDF7;
  }
}

/* 休眠滑块卡片 */
.sleep-card {
  width: 100%;
}

.slider-wrap {
  margin-top: 10px;
}

.slider-bar {
  width: 100%;
  height: 8px;
  background: #22283A;
  border-radius: 4px;
  position: relative;
  cursor: pointer;
}

.slider-fill {
  height: 100%;
  background: #00E5FF;
  border-radius: 4px;
  pointer-events: none;
}

.slider-thumb {
  width: 18px;
  height: 18px;
  background: #00E5FF;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 8px #00E5FF80;
  cursor: grab;
  pointer-events: none;
}

.slider-mark {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #8A98B3;
}


</style>
