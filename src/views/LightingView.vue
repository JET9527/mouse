<template>
  <div class="lighting-view">
    <div class="lighting-container">
      <!-- Left: Mouse preview with lighting -->
      <div class="preview-panel">
        <div class="panel-title">灯光预览</div>
        <div class="mouse-preview">
          <svg viewBox="0 0 200 340" class="preview-svg">
            <defs>
              <filter id="rgbGlow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <linearGradient id="ledGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop v-for="(color, i) in previewColors" :key="i"
                      :offset="(i / (previewColors.length - 1 || 1)) * 100 + '%'"
                      :style="{ stopColor: `rgb(${color.r},${color.g},${color.b})` }" />
              </linearGradient>
              <filter id="ledGlow">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            <!-- Mouse body -->
            <path d="M100 20 C60 20, 30 60, 30 120 L30 220 C30 280, 50 310, 100 320 C150 310, 170 280, 170 220 L170 120 C170 60, 140 20, 100 20Z"
                  fill="#1a1a2e" stroke="#3a3a5a" stroke-width="1.5"/>

            <!-- RGB light strip with device colors -->
            <path d="M50 300 C60 310, 80 315, 100 315 C120 315, 140 310, 150 300"
                  stroke="url(#ledGradient)"
                  stroke-width="6"
                  stroke-linecap="round"
                  filter="url(#rgbGlow)"
                  :opacity="config.brightness / 5"
                  class="rgb-strip"/>

            <!-- LED indicator dots -->
            <circle v-for="(color, i) in previewColors" :key="'led'+i"
                    :cx="ledPositions[i].x" :cy="ledPositions[i].y"
                    r="5"
                    :fill="`rgb(${color.r},${color.g},${color.b})`"
                    :opacity="config.brightness / 5"
                    filter="url(#ledGlow)" />
          </svg>
        </div>
      </div>

      <!-- Right: Controls -->
      <div class="controls-panel">
        <!-- Effect selection -->
        <div class="control-section">
          <div class="section-title">
            <span>灯效模式</span>
            <el-switch
              v-model="lightOff"
              size="small"
              active-text="关灯"
              @change="handleTurnOffLighting"
            />
          </div>
          <div class="effect-grid">
            <button
              v-for="effect in effects"
              :key="effect.key"
              class="effect-btn"
              :class="{ active: config.effect === effect.key }"
              @click="handleEffectChange(effect.key)"
            >
              <div class="effect-icon" :style="{ background: effect.gradient }"></div>
              <span>{{ effect.label }}</span>
            </button>
          </div>
        </div>

        <!-- Color pickers (multi-LED modes: SOLID/FLOWING/CYCLE_BREATHING/RAINBOW) -->
        <div class="control-section" v-if="showMultiColorPicker">
          <div class="section-title">LED 颜色设置</div>
          <div class="color-grid">
            <div v-for="(color, i) in config.colors" :key="'color'+i" class="color-item">
              <span class="color-label">LED{{ i + 1 }}</span>
              <ColorSliderBar v-model="config.colors[i]" @release="handleColorChange(i)" />
            </div>
          </div>
        </div>

        <!-- Color pickers (gradient: start/end) -->
        <div class="control-section" v-if="showGradientColorPicker">
          <div class="section-title">渐变颜色设置</div>
          <div class="color-grid">
            <div class="color-item">
              <span class="color-label">起始色</span>
              <ColorSliderBar v-model="config.colors[0]" @release="handleColorChange(0)" />
            </div>
            <div class="color-item">
              <span class="color-label">结束色</span>
              <ColorSliderBar v-model="config.colors[1]" @release="handleColorChange(1)" />
            </div>
          </div>
        </div>

        <!-- Direction (FLOWING/GRADIENT) -->
        <div class="control-section" v-if="showDirection">
          <div class="section-title">方向</div>
          <div class="direction-buttons">
            <button
              class="direction-btn"
              :class="{ active: config.direction === FlowDirection.FORWARD }"
              @click="handleDirectionChange(FlowDirection.FORWARD)"
            >正向</button>
            <button
              class="direction-btn"
              :class="{ active: config.direction === FlowDirection.BACKWARD }"
              @click="handleDirectionChange(FlowDirection.BACKWARD)"
            >反向</button>
          </div>
        </div>

        <!-- Brightness -->
        <div class="control-section">
          <div class="section-title">
            <span>亮度</span>
            <span class="value-text">{{ brightnessLabel }}</span>
          </div>
          <el-slider v-model="config.brightness" :min="0" :max="5" :step="1" show-stops @change="handleBrightnessChange" />
        </div>

        <!-- Speed (for animated effects) -->
        <div class="control-section" v-if="showSpeed">
          <div class="section-title">
            <span>速度</span>
            <span class="value-text">{{ speedLabel }}</span>
          </div>
          <el-slider v-model="config.speed" :min="0" :max="9" :step="1" show-stops @change="handleSpeedChange" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useLightingStore } from '@/stores/modules/lighting'
import { useDeviceStore } from '@/stores/modules/device'
import { LightingEffect, ColorPreset, FlowDirection } from '@/types/lighting'
import type { LightingConfig, RGBColor } from '@/types/lighting'
import ColorSliderBar from '@/components/common/ColorSliderBar.vue'
import { ElSwitch } from 'element-plus'

const lightingStore = useLightingStore()
const deviceStore = useDeviceStore()

// 使用 storeToRefs 解构以保持响应性
const { config } = storeToRefs(lightingStore)

// 响应式监听连接状态，连接建立后自动获取灯效配置
const hasFetchedLighting = ref(false)

watch(() => deviceStore.isConnected && deviceStore.protocol, async (ready) => {
  if (!ready || hasFetchedLighting.value) return
  hasFetchedLighting.value = true
  
  console.log('[LightingView] 设备已连接，获取灯效配置...')
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
    
    // 将协议数据同步到 lighting store（MCU 返回的亮度/速度已经是 0-5 / 0-9 范围，直接使用）
    lightingStore.setEffect(lightingConfig.mode)
    lightingStore.setBrightness(lightingConfig.lightness)
    lightingStore.setSpeed(lightingConfig.runningSpeed)
    lightingStore.setColors(lightingConfig.colors)
    
    // 如果当前是关灯模式，同步打开关灯开关
    if (lightingConfig.mode === LightingEffect.OFF) {
      lightOff.value = true
    }
  } catch (error) {
    console.warn('[LightingView] 获取灯效配置失败:', error)
  }
}, { immediate: true })

const effects = [
  { key: LightingEffect.SOLID, label: '常亮模式', gradient: 'linear-gradient(135deg, #00d4ff, #00ff88)' },
  { key: LightingEffect.FLOWING, label: '流水模式', gradient: 'linear-gradient(135deg, #a855f7, #ec4899)' },
  { key: LightingEffect.DPI_BREATHING, label: 'DPI呼吸', gradient: 'linear-gradient(135deg, #ff6b6b, #ffa502)' },
  { key: LightingEffect.CYCLE_BREATHING, label: '循环呼吸', gradient: 'linear-gradient(135deg, #ff4757, #ff6348, #ffa502)' },
  { key: LightingEffect.GRADIENT, label: '渐变颜色', gradient: 'linear-gradient(135deg, #ff0000, #00ff00, #0000ff)' },
  { key: LightingEffect.RAINBOW, label: '炫彩色', gradient: 'linear-gradient(135deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff)' },
]

// 颜色滑块 v-model（读写时自动同步到 config.colors）
const currentColorModel = computed({
  get: () => config.value.colors[0] || { r: 0, g: 212, b: 255 },
  set: (color: RGBColor) => {
    config.value.colors = [color]
    applyLighting()
  },
})

// 亮度/速度等级标签
const BRIGHTNESS_LABELS = ['关', '微亮', '低', '中', '高', '最亮']
const SPEED_LABELS = ['停止', '1', '2', '3', '4', '5', '6', '7', '8', '最快']

const brightnessLabel = computed(() => BRIGHTNESS_LABELS[config.value.brightness] || `${config.value.brightness}`)
const speedLabel = computed(() => SPEED_LABELS[config.value.speed] || `${config.value.speed}`)

const lightOff = ref(false)

async function handleTurnOffLighting(val: string | number | boolean) {
  if (val) {
    // 关灯：只改mode为6，其余字段保持当前灯效模式的值
    if (!deviceStore.isConnected || !deviceStore.protocol) return
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
  }
}

// 各模式下显示哪些控制区
const showMultiColorPicker = computed(() => {
  return config.value.effect === LightingEffect.SOLID ||
    config.value.effect === LightingEffect.FLOWING ||
    config.value.effect === LightingEffect.CYCLE_BREATHING ||
    config.value.effect === LightingEffect.RAINBOW
})

const showGradientColorPicker = computed(() => {
  return config.value.effect === LightingEffect.GRADIENT
})

const showDirection = computed(() => {
  return config.value.effect === LightingEffect.FLOWING ||
    config.value.effect === LightingEffect.GRADIENT
})

// DPI_BREATHING 不显示颜色
const showColorPicker = computed(() => {
  return config.value.effect === LightingEffect.SOLID ||
    config.value.effect === LightingEffect.DPI_BREATHING ||
    config.value.effect === LightingEffect.FLOWING ||
    config.value.effect === LightingEffect.CYCLE_BREATHING ||
    config.value.effect === LightingEffect.GRADIENT
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
  // 切换模式后立即发送，让设备响应新的灯效
  applyLighting()
}

function handleColorChange(index: number) {
  applyLighting()
}

function handleDirectionChange(direction: FlowDirection) {
  config.value.direction = direction
  applyLighting()
}

async function handleBrightnessChange() {
  applyLighting()
}

async function handleSpeedChange() {
  applyLighting()
}

async function applyLighting() {
  if (!deviceStore.isConnected || !deviceStore.protocol) return
  try {
    // 将 store 配置转换为协议 LightingConfig 格式
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

const previewColors = computed(() => config.value.colors.slice(0, 8))
const ledPositions = [
  { x: 50, y: 20 },
  { x: 85, y: 20 },
  { x: 120, y: 20 },
  { x: 155, y: 20 },
  { x: 50, y: 320 },
  { x: 85, y: 320 },
  { x: 120, y: 320 },
  { x: 155, y: 320 },
]

</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.lighting-view {
  width: 100%;
  height: 100%;
  padding: 24px;
  overflow: auto;
}

.lighting-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.preview-panel {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.panel-title, .section-title {
  font-size: 15px;
  font-weight: 600;
  color: $accent-blue;
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  color: $text-secondary;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.value-text {
  color: $accent-blue;
  font-size: 13px;
}

.mouse-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-svg {
  width: 160px;
  height: 280px;
}

.rgb-strip {
  transition: stroke 0.5s ease;
}

.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.control-section {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: 20px;
}

.effect-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.effect-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 8px;
  background: $bg-secondary;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  color: $text-primary;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: $accent-blue;
  }

  &.active {
    border-color: $accent-blue;
    background: rgba(0, 212, 255, 0.1);
    box-shadow: $glow-blue;
  }
}

.effect-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid $border-color;
}

/* Multi-color grid */
.color-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-label {
  min-width: 40px;
  font-size: 12px;
  color: $text-secondary;
  flex-shrink: 0;
}

/* Direction buttons */
.direction-buttons {
  display: flex;
  gap: 10px;
}

.direction-btn {
  flex: 1;
  padding: 10px 0;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: $bg-secondary;
  color: $text-primary;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: $accent-blue;
  }

  &.active {
    border-color: $accent-blue;
    background: rgba(0, 212, 255, 0.1);
    box-shadow: $glow-blue;
  }
}
</style>
