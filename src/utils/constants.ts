// Constants definitions

import type { MouseButton } from '../types/keyMapping'
import { ProfileLayer } from '../types/keyMapping'

// 6 mouse buttons definition
// 协议ID: 0x00-左键, 0x01-右键, 0x02-中键, 0x03-后退, 0x04-前进, 0x05-DPI
export const MOUSE_BUTTONS: MouseButton[] = [
  { id: 1, label: '左键', side: 'left' },
  { id: 2, label: '右键', side: 'right' },
  { id: 3, label: '中键', side: 'right' },
  { id: 4, label: '后退键', side: 'left' },
  { id: 5, label: '前进键', side: 'left' },
  { id: 6, label: 'DPI键', side: 'right' },
]

// Profile layers (4 profiles: 默认模式, 办公模式, 游戏模式1, 游戏模式2)
export const PROFILE_LAYERS: Array<{ key: ProfileLayer; label: string }> = [
  { key: ProfileLayer.DEFAULT, label: '默认模式' },
  { key: ProfileLayer.OFFICE, label: '办公模式' },
  { key: ProfileLayer.GAME1, label: '游戏模式1' },
  { key: ProfileLayer.GAME2, label: '游戏模式2' },
]

// Default profile name
export const DEFAULT_PROFILE_NAME = '默认层'

// Top navigation tabs
export const NAV_TABS = [
  { key: 'mapping', label: '基本设置', path: '/mapping' },
  { key: 'macro', label: '宏设置', path: '/macro' },
  { key: 'lighting', label: '灯光设置', path: '/lighting' },
  { key: 'settings', label: '高级设置', path: '/settings' },
]

// HID Report command IDs
export enum HIDCommand {
  GET_KEY_MAPPING = 0x01,
  SET_KEY_MAPPING = 0x02,
  SWITCH_PROFILE = 0x03,
  SAVE_PROFILE = 0x04,
  GET_MACRO = 0x10,
  SET_MACRO = 0x11,
  DELETE_MACRO = 0x12,
  GET_DPI_CONFIG = 0x20,
  SET_DPI_LEVEL = 0x21,
  GET_POLLING_RATE = 0x22,
  SET_POLLING_RATE = 0x23,
  SET_FIRE_KEY = 0x24,
  SET_RGB_EFFECT = 0x30,
  SET_RGB_COLOR = 0x31,
  SET_BRIGHTNESS = 0x32,
  GET_DEVICE_INFO = 0x40,
  GET_FIRMWARE_VERSION = 0x41,
}

// Config file version
export const CONFIG_VERSION = '1.0.0'

// Mapping constraints
export const MAPPING_CONSTRAINTS = {
  MIN_LEFT_BUTTON: 1,
  LEFT_BUTTON_IDS: [1],
  TOTAL_BUTTONS: 6,
}
