<template>
  <div class="lighting-view">
    <!-- 主体左右双栏 -->
    <div class="light-main-wrap">
      <!-- 左侧预览卡片 -->
      <div class="preview-card">
        <div class="preview-title">{{ $t('lighting.preview') }}</div>
        <div class="mouse-preview-box">
          <svg class="preview-svg" viewBox="0 0 200 300" width="200" height="300">
            <defs>
              <linearGradient id="mouseLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#00E5FF"/>
                <stop offset="100%" stop-color="#39FF77"/>
              </linearGradient>
              <linearGradient id="mouseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#192233"/>
                <stop offset="100%" stop-color="#0F1522"/>
              </linearGradient>
            </defs>
            <path d="M50,30 C20,80 10,180 40,250 C70,280 130,280 160,250 C190,180 180,80 150,30 C130,10 70,10 50,30Z" fill="url(#mouseFill)" stroke="url(#mouseLine)" stroke-width="2.5"/>
            <path d="M52,33 C55,65 80,72 98,72 L98,35 C82,28 60,30 52,33Z" fill="#111722" stroke="#00E5FF" stroke-width="1.5"/>
            <path d="M148,33 C145,65 120,72 102,72 L102,35 C118,28 140,30 148,33Z" fill="#111722" stroke="#00E5FF" stroke-width="1.5"/>
            <ellipse cx="100" cy="82" rx="18" ry="12" fill="#0c1018" stroke="url(#mouseLine)" stroke-width="2"/>
            <rect x="32" y="122" width="12" height="32" rx="3" fill="#121824" stroke="#00E5FF" stroke-width="1"/>
            <rect x="32" y="164" width="12" height="32" rx="3" fill="#121824" stroke="#00E5FF" stroke-width="1"/>
            <rect x="94" y="114" width="12" height="32" rx="3" fill="#121824" stroke="#00E5FF" stroke-width="1"/>
            <path d="M65,220 L135,220" stroke="#00E5FF66" stroke-width="1"/>
            <path d="M70,235 L130,235" stroke="#00E5FF66" stroke-width="1"/>

          </svg>
        </div>
      </div>

      <!-- 右侧设置区域 -->
      <div class="setting-card">
        <!-- 灯效模式 -->
        <div class="sub-card">
          <div class="mode-top-row">
            <span class="mode-title">{{ $t('lighting.effectMode') }}</span>
            <div class="switch-wrap">
              <span>{{ $t('lighting.turnOff') }}</span>
              <div class="switch-btn" :class="{ on: lightOff || config.effect === 6 }" @click="toggleLightOff">
                <div class="switch-dot"></div>
              </div>
            </div>
          </div>
          <div class="effect-grid">
            <div
              v-for="effect in effects"
              :key="effect.key"
              class="effect-item"
              :class="{ active: config.effect === effect.key }"
              @click="handleEffectChange(effect.key)"
            >
              <div class="effect-color-dot" :style="{ background: effect.gradient }"></div>
              <span>{{ $t('lighting.' + effect.i18nKey) }}</span>
            </div>
          </div>
        </div>

        <!-- LED颜色设置 -->
        <div class="sub-card" v-if="showMultiColorPicker">
          <div class="led-section-label">{{ $t('lighting.ledSelect') }}</div>
          <div class="led-checkbox-grid">
            <div
              v-for="i in ledCount"
              :key="'ledck' + i"
              class="led-checkbox-item"
              :class="{ selected: selectedLeds.has(i - 1) }"
              @click="toggleLed(i - 1, $event)"
            >
              <div class="led-check-dot" :style="{ background: rgbStr(config.colors[i - 1]) }"></div>
              <span class="led-check-label">{{ ledLabel(i) }}</span>
              <div class="led-check-mark" v-if="selectedLeds.has(i - 1)">✓</div>
            </div>
          </div>

          <div class="led-color-section">
            <div class="led-section-label">{{ $t('lighting.colorSetting') }}</div>
            <div class="color-picker-row">
              <div class="color-preview-large" :style="{ background: selectedColorStr }"></div>
              <ColorSliderBar v-model="sliderColor" @release="onColorRelease" />
            </div>
          </div>
        </div>

        <!-- 方向按钮 -->
        <div class="sub-card" v-if="showDirection">
          <div class="mode-title" style="margin-bottom:16px;">{{ $t('lighting.direction') }}</div>
          <div class="direction-buttons">
            <button
              class="direction-btn"
              :class="{ active: config.direction === FlowDirection.FORWARD }"
              @click="handleDirectionChange(FlowDirection.FORWARD)"
            >{{ $t('lighting.forward') }}</button>
            <button
              class="direction-btn"
              :class="{ active: config.direction === FlowDirection.BACKWARD }"
              @click="handleDirectionChange(FlowDirection.BACKWARD)"
            >{{ $t('lighting.backward') }}</button>
          </div>
        </div>

        <!-- 亮度 -->
        <div class="sub-card">
          <div class="slider-row">
            <div class="slider-head">
              <span>{{ $t('lighting.brightness') }}</span>
              <span>{{ brightnessLabel }}</span>
            </div>
            <div class="slider-bar" @mousedown.prevent="(e) => startSliderDrag(e, 'brightness')">
              <div class="slider-fill" :style="{ width: (config.brightness / 5 * 100) + '%' }"></div>
              <div class="slider-thumb" :style="{ left: (config.brightness / 5 * 100) + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- 速度 -->
        <div class="sub-card" v-if="showSpeed">
          <div class="slider-row">
            <div class="slider-head">
              <span>{{ $t('lighting.speed') }}</span>
              <span>{{ speedLabel }}</span>
            </div>
            <div class="slider-bar" @mousedown.prevent="(e) => startSliderDrag(e, 'speed')">
              <div class="slider-fill" :style="{ width: (config.speed / 9 * 100) + '%' }"></div>
              <div class="slider-thumb" :style="{ left: (config.speed / 9 * 100) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useLightingStore } from '@/stores/modules/lighting'
import { useDeviceStore } from '@/stores/modules/device'
import { useAppStore } from '@/stores/modules/app'
import { LightingEffect, ColorPreset, FlowDirection } from '@/types/lighting'
import type { LightingConfig, RGBColor } from '@/types/lighting'
import ColorSliderBar from '@/components/common/ColorSliderBar.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const lightingStore = useLightingStore()
const deviceStore = useDeviceStore()
const appStore = useAppStore()

const { config } = storeToRefs(lightingStore)

// 响应式监听连接状态，连接建立后自动获取灯效配置
const hasFetchedLighting = ref(false)

watch(() => deviceStore.isConnected && deviceStore.protocol, async (ready) => {
  if (!ready) {
    hasFetchedLighting.value = false
    return
  }
  if (hasFetchedLighting.value) return
  hasFetchedLighting.value = true
  await fetchLightingConfig()
}, { immediate: true })

// 提取为共享函数：获取并解析灯效配置
async function fetchLightingConfig() {
  if (!deviceStore.isConnected || !deviceStore.protocol) return
  console.log('[LightingView] 获取灯效配置...')
  try {
    const lightingConfig = await deviceStore.protocol!.getLightingConfig()
    console.log('[LightingView] 灯效配置:', {
      模式: lightingConfig.mode,
      速度_raw: lightingConfig.runningSpeed,
      颜色ID: lightingConfig.colorId,
      亮度_raw: lightingConfig.lightness,
      方向: lightingConfig.direction,
      颜色列表: lightingConfig.colors.map((c, i) =>
        `LED${i + 1}: #${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`
      ),
      magic: lightingConfig.magic
    })
    lightingStore.setEffect(lightingConfig.mode)
    lightingStore.setBrightness(lightingConfig.lightness)
    lightingStore.setSpeed(lightingConfig.runningSpeed)
    lightingStore.setColors(lightingConfig.colors)
    if (lightingConfig.mode === LightingEffect.OFF) {
      lightOff.value = true
    }
  } catch (error) {
    console.warn('[LightingView] 获取灯效配置失败:', error)
  }
}

// 恢复出厂设置后重新获取灯效配置
watch(() => appStore.factoryResetVersion, async () => {
  if (!deviceStore.isConnected || !deviceStore.protocol) return
  console.log('[LightingView] 恢复出厂后重新获取灯效配置...')
  await fetchLightingConfig()
})

const effects = [
  { key: LightingEffect.SOLID, label: '常亮模式', i18nKey: 'effectSolid', gradient: 'linear-gradient(135deg, #33e8cc, #33e8cc)' },
  { key: LightingEffect.FLOWING, label: '流水模式', i18nKey: 'effectFlowing', gradient: 'linear-gradient(135deg, #d868d8, #d868d8)' },
  { key: LightingEffect.DPI_BREATHING, label: 'DPI呼吸', i18nKey: 'effectDpiBreathing', gradient: 'linear-gradient(135deg, #ff9944, #ff9944)' },
  { key: LightingEffect.CYCLE_BREATHING, label: '循环呼吸', i18nKey: 'effectCycleBreathing', gradient: 'linear-gradient(135deg, #ff6644, #ff6644)' },
  { key: LightingEffect.GRADIENT, label: '渐变颜色', i18nKey: 'effectGradient', gradient: 'linear-gradient(45deg, #ff0000, #00ff00, #0000ff)' },
  { key: LightingEffect.RAINBOW, label: '炫彩色', i18nKey: 'effectRainbow', gradient: 'linear-gradient(45deg, #ff8800, #00ccff, #ff00ff)' },
]

const BRIGHTNESS_LABEL_KEYS = ['brightnessOff', 'brightnessDim', 'brightnessLow', 'brightnessMedium', 'brightnessHigh', 'brightnessMax']
const SPEED_LABEL_KEYS = ['speedStop', '1', '2', '3', '4', '5', '6', '7', '8', 'speedFastest']

const brightnessLabel = computed(() => t('lighting.' + BRIGHTNESS_LABEL_KEYS[config.value.brightness]) || `${config.value.brightness}`)
const speedLabel = computed(() => {
  const key = SPEED_LABEL_KEYS[config.value.speed]
  if (key.startsWith('speed')) {
    return t('lighting.' + key)
  }
  return key
})

const lightOff = ref(false)

// LED多选状态
const selectedLeds = ref<Set<number>>(new Set())

// 颜色滑动条的当前颜色
const sliderColor = ref<RGBColor>({ r: 255, g: 0, b: 0 })

// 当前选中颜色的RGB字符串
const selectedColorStr = computed(() => {
  return `rgb(${sliderColor.value.r}, ${sliderColor.value.g}, ${sliderColor.value.b})`
})

// RGBColor 转 rgb(r,g,b) 字符串
function rgbStr(color: RGBColor): string {
  return `rgb(${color.r},${color.g},${color.b})`
}

// 切换LED选中状态
function toggleLed(index: number, event: MouseEvent) {
  const set = new Set(selectedLeds.value)
  if (event.shiftKey && selectedLeds.value.size > 0) {
    // Shift点击：范围选择
    const currentArr = Array.from(selectedLeds.value).sort((a, b) => a - b)
    const first = currentArr[0]
    const last = currentArr[currentArr.length - 1]
    const start = Math.min(first, index)
    const end = Math.max(last, index)
    for (let i = start; i <= end; i++) {
      set.add(i)
    }
  } else if (event.ctrlKey || event.metaKey) {
    // Ctrl点击：切换单个
    if (set.has(index)) {
      set.delete(index)
    } else {
      set.add(index)
    }
  } else {
    // 普通点击：单选
    if (set.has(index) && set.size === 1) {
      set.delete(index)
    } else {
      set.clear()
      set.add(index)
    }
  }
  selectedLeds.value = set

  // 更新颜色滑动条为最后选中的LED的颜色
  if (set.size > 0) {
    const lastIdx = Array.from(set).pop()!
    const c = config.value.colors[lastIdx]
    sliderColor.value = { ...c }
  }
}

// 颜色滑动条释放时应用到所有选中的LED
function onColorRelease() {
  const color = sliderColor.value
  for (const idx of selectedLeds.value) {
    config.value.colors[idx] = { ...color }
  }
  if (selectedLeds.value.size > 0) {
    applyLighting()
  }
}

function toggleLightOff() {
  lightOff.value = !lightOff.value
  handleTurnOffLighting(lightOff.value)
}

async function handleTurnOffLighting(val: boolean) {
  if (!deviceStore.isConnected || !deviceStore.protocol) return
  if (val) {
    const colors: RGBColor[] = []
    for (let i = 0; i < 8; i++) {
      colors.push(config.value.colors[i] || { r: 0, g: 0, b: 0 })
    }
    const lightingConfig: LightingConfig = {
      mode: LightingEffect.OFF,
      runningSpeed: config.value.speed,
      colorId: ColorPreset.RED,
      lightness: config.value.brightness,
      direction: config.value.direction,
      colors,
      magic: 0,
    }
    try {
      await deviceStore.protocol.setLightingConfig(lightingConfig)
      console.log('[LightingView] 关灯成功')
      lightingStore.setEffect(LightingEffect.OFF)
    } catch (e) {
      console.error('关灯失败:', e)
    }
  } else {
    // 开灯：恢复为之前的灯效
    applyLighting()
  }
}

const showMultiColorPicker = computed(() => {
  return config.value.effect === LightingEffect.SOLID ||
    config.value.effect === LightingEffect.FLOWING ||
    config.value.effect === LightingEffect.CYCLE_BREATHING
})

// 常亮模式只展示LED1-LED6，流水/循环呼吸展示8个
const ledCount = computed(() => {
  if (config.value.effect === LightingEffect.SOLID) {
    return 6
  }
  return 8
})

// 常亮模式标签为LED，流水/循环呼吸标签为Color
function ledLabel(i: number): string {
  if (config.value.effect === LightingEffect.SOLID) {
    return `LED${i}`
  }
  return `Color${i}`
}

const showDirection = computed(() => {
  return config.value.effect === LightingEffect.FLOWING
})

const showSpeed = computed(() => {
  return config.value.effect === LightingEffect.FLOWING ||
    config.value.effect === LightingEffect.DPI_BREATHING ||
    config.value.effect === LightingEffect.CYCLE_BREATHING ||
    config.value.effect === LightingEffect.GRADIENT ||
    config.value.effect === LightingEffect.RAINBOW
})

function handleEffectChange(effect: LightingEffect) {
  config.value.effect = effect
  lightOff.value = false
  applyLighting()
}

function handleColorChange(index: number) {
  applyLighting()
}

function handleDirectionChange(direction: FlowDirection) {
  config.value.direction = direction
  applyLighting()
}

async function applyLighting() {
  if (!deviceStore.isConnected || !deviceStore.protocol) return
  try {
    const colors: RGBColor[] = []
    for (let i = 0; i < 8; i++) {
      colors.push(config.value.colors[i] || { r: 0, g: 0, b: 0 })
    }
    const lightingConfig: LightingConfig = {
      mode: config.value.effect,
      runningSpeed: config.value.speed,
      colorId: ColorPreset.RED,
      lightness: config.value.brightness,
      direction: config.value.direction,
      colors,
      magic: 0,
    }
    console.log('[LightingView] 发送灯效配置:', JSON.stringify(lightingConfig, null, 2))
    await deviceStore.protocol.setLightingConfig(lightingConfig)
    console.log('[LightingView] 灯效设置成功')
  } catch (e) {
    console.error('设置灯光失败:', e)
  }
}

// 自定义滑块拖拽
let dragState: { field: string; el: HTMLElement } | null = null

function startSliderDrag(e: MouseEvent, field: 'brightness' | 'speed') {
  e.preventDefault()
  const bar = e.currentTarget as HTMLElement
  if (!bar) return
  dragState = { field, el: bar }
  updateSliderFromEvent(e, field)

  const onMove = (ev: MouseEvent) => {
    if (!dragState || dragState.field !== field) return
    updateSliderFromEvent(ev, field)
  }
  const onUp = () => {
    if (dragState) {
      // 抬起时再发送指令
      applyLighting()
    }
    dragState = null
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function updateSliderFromEvent(e: MouseEvent, field: 'brightness' | 'speed') {
  if (!dragState) return
  const rect = dragState.el.getBoundingClientRect()
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  if (field === 'brightness') {
    config.value.brightness = Math.round(pct * 5)
  } else {
    config.value.speed = Math.round(pct * 9)
  }
}

onUnmounted(() => {
  dragState = null
})



</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.lighting-view {
  width: 100%;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  overflow: auto;
}

/* 左右双栏布局 */
.light-main-wrap {
  display: flex;
  gap: 24px;
}

/* 左侧预览卡片 */
.preview-card {
  width: 48%;
  background: #181C29;
  border: 1px solid rgba(0,229,255,0.3);
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 0 14px #00E5FF28;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-title {
  color: #00E5FF;
  margin-bottom: 30px;
  font-size: 16px;
}

.mouse-preview-box {
  width: 220px;
  height: 320px;
  position: relative;
}

.preview-svg {
  width: 100%;
  height: 100%;
  animation: mouseGlow 3s ease-in-out infinite;
}

@keyframes mouseGlow {
  0%, 100% { filter: drop-shadow(0 0 8px #00E5FF); }
  50% { filter: drop-shadow(0 0 18px #00E5FF); }
}

/* 右侧设置卡片 */
.setting-card {
  width: 52%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sub-card {
  background: #181C29;
  border: 1px solid rgba(0,229,255,0.3);
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 0 14px #00E5FF28;
}

/* 灯效模式 */
.mode-top-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.mode-title {
  font-size: 15px;
  color: #E6EDF7;
}

.switch-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #8A98B3;
}

.switch-btn {
  width: 34px;
  height: 18px;
  background: #22283A;
  border-radius: 9px;
  position: relative;
  cursor: pointer;
  transition: 0.25s;

  &.on {
    background: #00E5FF;
    box-shadow: 0 0 6px #00E5FF60;
  }
}

.switch-dot {
  width: 14px;
  height: 14px;
  background: #E6EDF7;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: 0.25s;
}

.switch-btn.on .switch-dot {
  left: 18px;
}

.effect-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.effect-item {
  padding: 14px 8px;
  background: #22283A;
  border: 1px solid rgba(0,229,255,0.25);
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  transition: 0.25s;
  color: #8A98B3;
  font-size: 13px;

  &:hover {
    border-color: #00E5FF;
    color: #E6EDF7;
  }

  &.active {
    border: 1px solid #00E5FF;
    box-shadow: 0 0 8px #00E5FF50;
    color: #E6EDF7;
  }
}

.effect-color-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin: 0 auto 8px;
}

/* LED颜色设置 */
.led-section-label {
  font-size: 14px;
  color: #8A98B3;
  margin-bottom: 12px;
}

.led-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.led-checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #22283A;
  border: 1px solid rgba(0,229,255,0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  user-select: none;

  &:hover {
    border-color: #00E5FF;
    background: #28304A;
  }

  &.selected {
    border-color: #00E5FF;
    background: rgba(0,229,255,0.1);
    box-shadow: 0 0 8px #00E5FF40;
  }
}

.led-check-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.25);
  flex-shrink: 0;
}

.led-check-label {
  font-size: 13px;
  color: #E6EDF7;
}

.led-check-mark {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  background: #00E5FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  color: #0C0E16;
  box-shadow: 0 0 6px #00E5FF80;
}

.led-color-section {
  margin-top: 4px;
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.color-preview-large {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 2px solid rgba(255,255,255,0.2);
  flex-shrink: 0;
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
}

/* 方向按钮 */
.direction-buttons {
  display: flex;
  gap: 10px;
}

.direction-btn {
  flex: 1;
  padding: 10px 0;
  background: #22283A;
  border: 1px solid rgba(0,229,255,0.25);
  border-radius: 6px;
  color: #8A98B3;
  font-size: 14px;
  cursor: pointer;
  transition: 0.25s;

  &:hover {
    border-color: #00E5FF;
    color: #E6EDF7;
  }

  &.active {
    border: 1px solid #00E5FF;
    background: rgba(0,229,255,0.12);
    color: #00E5FF;
    box-shadow: 0 0 8px #00E5FF50;
  }
}

/* 滑块通用样式 */
.slider-row {
  .slider-head {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
    color: #8A98B3;
  }
}

.slider-bar {
  width: 100%;
  height: 6px;
  background: #22283A;
  border-radius: 3px;
  position: relative;
  cursor: pointer;
}

.slider-fill {
  height: 100%;
  background: #00E5FF;
  border-radius: 3px;
  pointer-events: none;
}

.slider-thumb {
  width: 16px;
  height: 16px;
  background: #00E5FF;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 6px #00E5FF80;
  pointer-events: none;
}


</style>
