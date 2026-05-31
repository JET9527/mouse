// Lighting types

// 灯效模式 (协议定义)
export enum LightingEffect {
  OFF = 0x00,
  SOLID = 0x01,
  FLOWING = 0x02,
  DPI_BREATHING = 0x03,
  CYCLE_BREATHING = 0x04,
  GRADIENT = 0x05,
  RAINBOW = 0x06,
}

// 预设颜色 (协议: 0-7 单色, 8 随机多彩)
export enum ColorPreset {
  RED = 0x00,
  ORANGE = 0x01,
  YELLOW = 0x02,
  GREEN = 0x03,
  CYAN = 0x04,
  BLUE = 0x05,
  PURPLE = 0x06,
  WHITE = 0x07,
  RANDOM_MULTI = 0x08,
}

// 流动方向
export enum FlowDirection {
  FORWARD = 0x00,
  BACKWARD = 0x01,
}

export interface RGBColor {
  r: number
  g: number
  b: number
}

// 灯效参数结构体 (协议定义)
export interface LightingConfig {
  mode: LightingEffect
  runningSpeed: number
  colorId: ColorPreset
  lightness: number
  direction: FlowDirection
  colors: RGBColor[]
  magic: number
}

// LED 数量 (协议默认 N=6)
export const LED_COUNT = 6

export interface ZoneConfig {
  zoneId: number
  enabled: boolean
  color: RGBColor
  effect?: LightingEffect
}