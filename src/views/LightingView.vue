<template>
  <div class="lighting-view">
    <div class="lighting-container">
      <!-- Left: Mouse preview with lighting -->
      <div class="preview-panel">
        <div class="panel-title">灯光预览</div>
        <div class="mouse-preview">
          <svg viewBox="0 0 200 340" class="preview-svg">
            <defs>
              <linearGradient id="previewBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#2a2a4a;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1" />
              </linearGradient>
              <filter id="rgbGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            <!-- Mouse body -->
            <path d="M100 20 C60 20, 30 60, 30 120 L30 220 C30 280, 50 310, 100 320 C150 310, 170 280, 170 220 L170 120 C170 60, 140 20, 100 20Z"
                  fill="url(#previewBody)" stroke="#3a3a5a" stroke-width="1.5"/>

            <!-- RGB light strip -->
            <path d="M50 300 C60 310, 80 315, 100 315 C120 315, 140 310, 150 300"
                  :stroke="`rgb(${currentColorModel.r}, ${currentColorModel.g}, ${currentColorModel.b})`"
                  stroke-width="3"
                  filter="url(#rgbGlow)"
                  :opacity="config.brightness / 100"
                  class="rgb-strip"/>
          </svg>
        </div>
      </div>

      <!-- Right: Controls -->
      <div class="controls-panel">
        <!-- Effect selection -->
        <div class="control-section">
          <div class="section-title">灯效模式</div>
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

        <!-- Color picker (horizontal slider bar) -->
        <div class="control-section" v-if="showColorPicker">
          <div class="section-title">颜色</div>
          <ColorSliderBar v-model="currentColorModel" />
        </div>

        <!-- Brightness -->
        <div class="control-section">
          <div class="section-title">
            <span>亮度</span>
            <span class="value-text">{{ config.brightness }}%</span>
          </div>
          <el-slider v-model="config.brightness" :min="0" :max="100" @change="handleBrightnessChange" />
        </div>

        <!-- Speed (for animated effects) -->
        <div class="control-section" v-if="showSpeed">
          <div class="section-title">
            <span>速度</span>
            <span class="value-text">{{ config.speed }}%</span>
          </div>
          <el-slider v-model="config.speed" :min="0" :max="100" @change="handleSpeedChange" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLightingStore } from '@/stores/modules/lighting'
import { useDeviceStore } from '@/stores/modules/device'
import { LightingEffect, ColorPreset, FlowDirection } from '@/types/lighting'
import type { LightingConfig, RGBColor } from '@/types/lighting'
import ColorSliderBar from '@/components/common/ColorSliderBar.vue'

const lightingStore = useLightingStore()
const deviceStore = useDeviceStore()

// 从 deviceStore 获取 protocol
const config = lightingStore.config

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
      速度: lightingConfig.runningSpeed,
      颜色ID: lightingConfig.colorId,
      亮度: lightingConfig.lightness,
      方向: lightingConfig.direction,
      颜色列表: lightingConfig.colors.map((c, i) =>
        `LED${i + 1}: #${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`
      ),
      magic: lightingConfig.magic
    })
    
    // 将协议数据同步到 lighting store
    const colors = lightingConfig.colors.filter(c => c.r !== 0 || c.g !== 0 || c.b !== 0)
    lightingStore.setEffect(lightingConfig.mode)
    lightingStore.setBrightness(lightingConfig.lightness)
    lightingStore.setSpeed(lightingConfig.runningSpeed)
    if (colors.length > 0) {
      lightingStore.setColors(colors)
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
  get: () => config.colors[0] || { r: 0, g: 212, b: 255 },
  set: (color: RGBColor) => {
    config.colors = [color]
    applyLighting()
  },
})

const showColorPicker = computed(() => {
  return config.effect === LightingEffect.SOLID ||
    config.effect === LightingEffect.DPI_BREATHING ||
    config.effect === LightingEffect.FLOWING ||
    config.effect === LightingEffect.CYCLE_BREATHING ||
    config.effect === LightingEffect.GRADIENT
})

const showSpeed = computed(() => {
  return config.effect === LightingEffect.FLOWING ||
    config.effect === LightingEffect.DPI_BREATHING ||
    config.effect === LightingEffect.CYCLE_BREATHING ||
    config.effect === LightingEffect.GRADIENT ||
    config.effect === LightingEffect.RAINBOW
})

function handleEffectChange(effect: LightingEffect) {
  config.effect = effect
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
    for (let i = 0; i < 6; i++) {
      colors.push(config.colors[i] || { r: 0, g: 0, b: 0 })
    }
    const lightingConfig: LightingConfig = {
      mode: config.effect,
      runningSpeed: config.speed,
      colorId: ColorPreset.RED,
      lightness: config.brightness,
      direction: FlowDirection.FORWARD,
      colors,
      magic: 0,
    }
    await deviceStore.protocol.setLightingConfig(lightingConfig)
  } catch (e) {
    console.error('设置灯光失败:', e)
  }
}
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
</style>
