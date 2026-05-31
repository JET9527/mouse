import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RGBColor } from '@/types/lighting'
import { LightingEffect } from '@/types/lighting'

export const useLightingStore = defineStore('lighting', () => {
  const config = ref({
    effect: LightingEffect.SOLID,
    brightness: 80,
    speed: 50,
    colors: [{ r: 0, g: 212, b: 255 }] as RGBColor[],
  })

  function setEffect(effect: LightingEffect) {
    config.value.effect = effect
  }

  function setBrightness(brightness: number) {
    config.value.brightness = Math.max(0, Math.min(100, brightness))
  }

  function setSpeed(speed: number) {
    config.value.speed = Math.max(0, Math.min(100, speed))
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

  return {
    config,
    setEffect,
    setBrightness,
    setSpeed,
    setColors,
    setColor,
  }
})
