import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RGBColor } from '@/types/lighting'
import { LightingEffect, FlowDirection } from '@/types/lighting'

export const useLightingStore = defineStore('lighting', () => {
  const config = ref({
    effect: LightingEffect.SOLID,
    brightness: 3,
    speed: 5,
    colors: [
      { r: 0, g: 212, b: 255 },
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 255, g: 255, b: 0 },
      { r: 255, g: 0, b: 255 },
      { r: 0, g: 255, b: 255 },
      { r: 255, g: 128, b: 0 },
    ] as RGBColor[],
    direction: FlowDirection.FORWARD,
  })

  function setEffect(effect: LightingEffect) {
    config.value.effect = effect
  }

  function setBrightness(brightness: number) {
    config.value.brightness = Math.max(0, Math.min(5, Math.round(brightness)))
  }

  function setSpeed(speed: number) {
    config.value.speed = Math.max(0, Math.min(9, Math.round(speed)))
  }

  function setColors(colors: RGBColor[]) {
    config.value.colors = colors
  }

  function setColor(color: RGBColor, index: number = 0) {
    if (config.value.colors[index]) {
      config.value.colors[index] = color
    } else {
      config.value.colors.push(color)
    }
  }

  function setDirection(direction: FlowDirection) {
    config.value.direction = direction
  }

  return {
    config,
    setEffect,
    setBrightness,
    setSpeed,
    setColors,
    setColor,
    setDirection,
  }
})
