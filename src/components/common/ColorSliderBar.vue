<template>
  <div class="color-slider-bar">
    <div class="color-preview" :style="{ background: rgbColor }"></div>
    <div class="slider-track" ref="trackRef" @mousedown="handleMouseDown">
      <div class="slider-gradient"></div>
      <div class="slider-thumb" :style="{ left: `calc(${sliderValue}% - 8px)` }">
        <div class="thumb-inner" :style="{ background: rgbColor }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { RGBColor } from '@/types/lighting'

const props = defineProps<{
  modelValue: RGBColor
}>()

const emit = defineEmits<{
  'update:modelValue': [color: RGBColor]
  'release': [color: RGBColor]
}>()

const trackRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)

// 从 RGB 计算出 Hue 位置 (0-100%)
const sliderValue = computed(() => {
  const { r, g, b } = props.modelValue
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  const delta = max - min

  if (delta === 0) return 0

  let hue = 0
  const maxColor = [r, g, b].indexOf(Math.max(r, g, b))
  
  if (maxColor === 0) {
    hue = ((g - b) / (delta * 255)) % 6
  } else if (maxColor === 1) {
    hue = (b - r) / (delta * 255) + 2
  } else {
    hue = (r - g) / (delta * 255) + 4
  }

  hue = Math.round(hue * 60)
  if (hue < 0) hue += 360
  
  const pos = (hue / 360) * 100
  return pos
})

// 当前 RGB 字符串（用于预览）
const rgbColor = computed(() => {
  return `rgb(${props.modelValue.r}, ${props.modelValue.g}, ${props.modelValue.b})`
})

// HSL → RGB 转换
function hslToRgb(h: number, s: number, l: number): RGBColor {
  h = h / 360
  s = s / 100
  l = l / 100

  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

// 根据滑块位置计算颜色 (0-100)
function positionToColor(pos: number): RGBColor {
  const hue = (pos / 100) * 360
  return hslToRgb(hue, 100, 50)
}

function updateColor(clientX: number) {
  if (!trackRef.value) return
  const rect = trackRef.value.getBoundingClientRect()
  let pos = ((clientX - rect.left) / rect.width) * 100
  pos = Math.max(0, Math.min(100, pos))
  const color = positionToColor(pos)
  emit('update:modelValue', color)
}

function handleMouseDown(e: MouseEvent) {
  e.preventDefault()
  isDragging.value = true
  updateColor(e.clientX)

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    updateColor(e.clientX)
  }

  const onMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    const c = props.modelValue
    emit('release', c)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

onUnmounted(() => {
  isDragging.value = false
})
</script>

<style scoped>
.color-slider-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.color-preview {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  transition: background 0.1s ease;
}

.slider-track {
  position: relative;
  height: 24px;
  flex: 1;
  border-radius: 12px;
  cursor: pointer;
  overflow: visible;
  user-select: none;
}

.slider-gradient {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: linear-gradient(
    to right,
    #ff0000 0%,
    #ff8800 12%,
    #ffff00 25%,
    #00ff00 37%,
    #00ff88 50%,
    #0088ff 62%,
    #8800ff 75%,
    #ff00ff 87%,
    #ff0000 100%
  );
}

.slider-thumb {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  z-index: 2;
  pointer-events: none;
}

.thumb-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
  cursor: grab;
  transition: transform 0.1s ease;
}

.slider-thumb:hover .thumb-inner {
  transform: scale(1.2);
}
</style>
