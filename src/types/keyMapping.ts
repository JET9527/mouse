// Key mapping types

// Profile layers (协议: 0x00~0x03)
export enum ProfileLayer {
  DEFAULT = 0x00,
  OFFICE = 0x01,
  GAME1 = 0x02,
  GAME2 = 0x03,
}

// Key types (协议类型定义)
export enum KeyType {
  NONE = 0x00,
  KEY = 0x01,
  MACRO = 0x02,
  MOUSE_FUNC = 0x03,
  COMBO = 0x04,
}

// Mouse function keys (协议定义)
export enum MouseFunctionKey {
  LEFT = 0xF4,
  RIGHT = 0xF5,
  MIDDLE = 0xF6,
  BACK = 0xF7,
  FORWARD = 0xF8,
  WHEEL_UP = 0xF9,
  WHEEL_DOWN = 0xFA,
  DPI_SWITCH = 0xD0,
  POLLING_RATE_SWITCH = 0xD1,
  FIRE_KEY = 0xD2,
  BT_PAIR = 0xD3,
  WIRELESS_24G_PAIR = 0xD4,
  MODE_SWITCH = 0xD5,
}

// Modifiers
export enum Modifier {
  CTRL = 0x01,
  SHIFT = 0x02,
  ALT = 0x04,
  WIN = 0x08,
}

// Key targets
export type KeyTarget =
  | BasicKeyTarget
  | ExtendedKeyTarget
  | MacroTarget
  | MouseFuncTarget
  | ComboKeyTarget

export interface BasicKeyTarget {
  keyCode: number
  label: string
}

export interface ExtendedKeyTarget {
  keyCode: number
  category: 'function' | 'navigation' | 'editing'
  label: string
}

export interface MacroTarget {
  macroId: number
  macroName: string
  playbackMode: 'once' | 'repeat' | 'while_hold'
}

export interface MouseFuncTarget {
  funcCode: MouseFunctionKey
  label: string
}

export interface ComboKeyTarget {
  keys: Array<{
    keyCode: number
    modifiers?: Modifier[]
  }>
  label: string
}

// Key mapping
export interface KeyMapping {
  buttonId: number
  type: KeyType
  target: KeyTarget
  layer: ProfileLayer
  enabled: boolean
}

// Profile data
export interface ProfileData {
  name: string
  mappings: Map<number, KeyMapping>
  isModified: boolean
}

// Mouse button (协议: 9个按键)
export enum MouseButtonIndex {
  LEFT = 0x00,
  RIGHT = 0x01,
  MIDDLE = 0x02,
  BACK = 0x03,
  FORWARD = 0x04,
  FIRE = 0x05,
  DPI = 0x06,
  FUN1 = 0x07,
  FUN2 = 0x08,
}

export interface MouseButton {
  id: MouseButtonIndex
  label: string
  side: 'left' | 'right'
}