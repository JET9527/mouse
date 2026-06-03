// 宏录制协议编解码工具
// 动作类型字节定义
export const MACRO_ACTION = {
  PRESS: 0x01,
  RELEASE: 0x02,
  DELAY: 0x03,
  CLICK: 0x04,
  TEXT: 0x05,
} as const

export const MACRO_ACTION_NAME: Record<number, string> = {
  [MACRO_ACTION.PRESS]: 'press',
  [MACRO_ACTION.CLICK]: 'click',
  [MACRO_ACTION.RELEASE]: 'release',
  [MACRO_ACTION.TEXT]: 'text',
  [MACRO_ACTION.DELAY]: 'delay',
}

// 反向映射：名字 → 动作字节
export const ACTION_NAME_TO_BYTE: Record<string, number> = {
  press: MACRO_ACTION.PRESS,
  click: MACRO_ACTION.CLICK,
  release: MACRO_ACTION.RELEASE,
  text: MACRO_ACTION.TEXT,
  delay: MACRO_ACTION.DELAY,
}

// HID 键值码 → 标签映射（标准 US 键盘 108 键）
export const HID_KEY_LABELS: Record<number, string> = {
  0x04: 'A', 0x05: 'B', 0x06: 'C', 0x07: 'D', 0x08: 'E',
  0x09: 'F', 0x0A: 'G', 0x0B: 'H', 0x0C: 'I', 0x0D: 'J',
  0x0E: 'K', 0x0F: 'L', 0x10: 'M', 0x11: 'N', 0x12: 'O',
  0x13: 'P', 0x14: 'Q', 0x15: 'R', 0x16: 'S', 0x17: 'T',
  0x18: 'U', 0x19: 'V', 0x1A: 'W', 0x1B: 'X', 0x1C: 'Y', 0x1D: 'Z',

  0x1E: '1', 0x1F: '2', 0x20: '3', 0x21: '4', 0x22: '5',
  0x23: '6', 0x24: '7', 0x25: '8', 0x26: '9', 0x27: '0',

  0x28: 'Enter', 0x29: 'Esc', 0x2A: 'Backspace', 0x2B: 'Tab', 0x2C: 'Space',
  0x2D: '-', 0x2E: '=', 0x2F: '[', 0x30: ']', 0x31: '\\',
  0x33: ';', 0x34: "'", 0x35: '`',
  0x36: ',', 0x37: '.', 0x38: '/', 0x39: 'Caps Lock',

  0x3A: 'F1', 0x3B: 'F2', 0x3C: 'F3', 0x3D: 'F4', 0x3E: 'F5',
  0x3F: 'F6', 0x40: 'F7', 0x41: 'F8', 0x42: 'F9', 0x43: 'F10',
  0x44: 'F11', 0x45: 'F12',

  0x46: 'PrtSc', 0x47: 'ScrlLk', 0x48: 'Pause',
  0x49: 'Insert', 0x4A: 'Home', 0x4B: 'PgUp',
  0x4C: 'Delete', 0x4D: 'End', 0x4E: 'PgDn',

  0x4F: '→', 0x50: '←', 0x51: '↓', 0x52: '↑',

  0x53: 'NumLk', 0x54: 'KP/', 0x55: 'KP*', 0x56: 'KP-', 0x57: 'KP+',
  0x58: 'KP Enter', 0x59: 'KP1', 0x5A: 'KP2', 0x5B: 'KP3',
  0x5C: 'KP4', 0x5D: 'KP5', 0x5E: 'KP6',
  0x5F: 'KP7', 0x60: 'KP8', 0x61: 'KP9',
  0x62: 'KP0', 0x63: 'KP.',

  0x65: 'App', 0x87: 'F13', 0x88: 'F14', 0x89: 'F15',
  0x8A: 'F16', 0x8B: 'F17', 0x8C: 'F18', 0x8D: 'F19',
  0x8E: 'F20', 0x8F: 'F21', 0x90: 'F22', 0x91: 'F23', 0x92: 'F24',

  0xA8: '静音', 0xA9: '音量+', 0xAA: '音量-',
  0xAB: '下一曲', 0xAC: '上一曲', 0xAD: '停止', 0xAE: '播放/暂停',
  0xB0: '浏览器', 0xB1: '计算器',
  0xB5: '我的电脑', 0xB7: '停止', 0xB8: '前一页',

  0xE0: 'Ctrl(L)', 0xE1: 'Shift(L)', 0xE2: 'Alt(L)', 0xE3: 'Win(L)',
  0xE4: 'Ctrl(R)', 0xE5: 'Shift(R)', 0xE6: 'Alt(R)', 0xE7: 'Win(R)',
}

// 字符转HID键值码（用于文本动作序列化）
const CHAR_TO_HID: Record<string, number> = {
  'a': 0x04, 'b': 0x05, 'c': 0x06, 'd': 0x07, 'e': 0x08,
  'f': 0x09, 'g': 0x0A, 'h': 0x0B, 'i': 0x0C, 'j': 0x0D,
  'k': 0x0E, 'l': 0x0F, 'm': 0x10, 'n': 0x11, 'o': 0x12,
  'p': 0x13, 'q': 0x14, 'r': 0x15, 's': 0x16, 't': 0x17,
  'u': 0x18, 'v': 0x19, 'w': 0x1A, 'x': 0x1B, 'y': 0x1C, 'z': 0x1D,
  'A': 0x04, 'B': 0x05, 'C': 0x06, 'D': 0x07, 'E': 0x08,
  'F': 0x09, 'G': 0x0A, 'H': 0x0B, 'I': 0x0C, 'J': 0x0D,
  'K': 0x0E, 'L': 0x0F, 'M': 0x10, 'N': 0x11, 'O': 0x12,
  'P': 0x13, 'Q': 0x14, 'R': 0x15, 'S': 0x16, 'T': 0x17,
  'U': 0x18, 'V': 0x19, 'W': 0x1A, 'X': 0x1B, 'Y': 0x1C, 'Z': 0x1D,
  '1': 0x1E, '2': 0x1F, '3': 0x20, '4': 0x21, '5': 0x22,
  '6': 0x23, '7': 0x24, '8': 0x25, '9': 0x26, '0': 0x27,
  '\n': 0x28, ' ': 0x2C,
  '-': 0x2D, '=': 0x2E, '[': 0x2F, ']': 0x30, '\\': 0x31,
  ';': 0x33, "'": 0x34, '`': 0x35,
  ',': 0x36, '.': 0x37, '/': 0x38,
}

// HID键值码转字符（用于文本动作解析）
const HID_TO_CHAR: Record<number, string> = {
  0x04: 'a', 0x05: 'b', 0x06: 'c', 0x07: 'd', 0x08: 'e',
  0x09: 'f', 0x0A: 'g', 0x0B: 'h', 0x0C: 'i', 0x0D: 'j',
  0x0E: 'k', 0x0F: 'l', 0x10: 'm', 0x11: 'n', 0x12: 'o',
  0x13: 'p', 0x14: 'q', 0x15: 'r', 0x16: 's', 0x17: 't',
  0x18: 'u', 0x19: 'v', 0x1A: 'w', 0x1B: 'x', 0x1C: 'y', 0x1D: 'z',
  0x1E: '1', 0x1F: '2', 0x20: '3', 0x21: '4', 0x22: '5',
  0x23: '6', 0x24: '7', 0x25: '8', 0x26: '9', 0x27: '0',
  0x28: '\n', 0x2C: ' ',
  0x2D: '-', 0x2E: '=', 0x2F: '[', 0x30: ']', 0x31: '\\',
  0x33: ';', 0x34: "'", 0x35: '`',
  0x36: ',', 0x37: '.', 0x38: '/',
}

export function getKeyLabel(code: number): string {
  return HID_KEY_LABELS[code] || `0x${code.toString(16).padStart(2, '0').toUpperCase()}`
}

export interface KeyEntry {
  code: number
  label: string
}

export interface MacroStepData {
  id: string
  action: 'press' | 'click' | 'release' | 'text' | 'delay'
  keys: KeyEntry[]
  text?: string
  duration?: number
  delayRandom?: boolean
  delayMin?: number
  delayMax?: number
}

let stepIdCounter = 0
function genStepId(): string {
  return `step_${++stepIdCounter}`
}

/**
 * 宏录制数据最大长度
 */
export const MAX_MACRO_BYTES = 57

/**
 * 计算单个步骤占用的字节数
 */
export function calcStepBytes(step: MacroStepData): number {
  switch (step.action) {
    case 'press':
    case 'click':
    case 'release':
      return 2 + step.keys.length
    case 'text':
      return 2 + (step.text?.length || 0)
    case 'delay':
      return 6
    default:
      return 0
  }
}

/**
 * 解析从设备获取的宏数据(原始字节)为 MacroStepData[]
 * @param raw 原始宏数据字节（不含包头包尾）
 */
export function parseMacroData(raw: Uint8Array): MacroStepData[] {
  const steps: MacroStepData[] = []
  if (raw.length === 0) return steps
  // 首字节是总动作数，跳过
  let offset = 1

  while (offset < raw.length) {
    const actionByte = raw[offset]
    const action = MACRO_ACTION_NAME[actionByte]
    if (!action) {
      console.warn(`[parseMacroData] 未知动作类型: 0x${actionByte.toString(16)}，停止解析`)
      break
    }

    const parsed = parseOneStep(raw, offset)
    if (!parsed) {
      offset++
      continue
    }
    steps.push(parsed.step)
    offset = parsed.nextOffset
  }

  return steps
}

function parseOneStep(raw: Uint8Array, offset: number): { step: MacroStepData; nextOffset: number } | null {
  if (offset >= raw.length) return null
  const actionByte = raw[offset]
  const action = MACRO_ACTION_NAME[actionByte]
  if (!action) return null

  switch (action) {
    case 'press':
    case 'click':
    case 'release': {
      if (offset + 2 > raw.length) return null
      const keyCount = raw[offset + 1]
      const keys: KeyEntry[] = []
      for (let i = 0; i < keyCount; i++) {
        const keyOffset = offset + 2 + i
        if (keyOffset >= raw.length) break
        const code = raw[keyOffset]
        keys.push({ code, label: getKeyLabel(code) })
      }
      return { step: { id: genStepId(), action, keys }, nextOffset: offset + 2 + keyCount }
    }
    case 'text': {
      if (offset + 2 > raw.length) return null
      const keyCount = raw[offset + 1]
      let text = ''
      for (let i = 0; i < keyCount; i++) {
        const keyOffset = offset + 2 + i
        if (keyOffset >= raw.length) break
        const code = raw[keyOffset]
        text += HID_TO_CHAR[code] || '?'
      }
      return { step: { id: genStepId(), action, keys: [], text }, nextOffset: offset + 2 + keyCount }
    }
    case 'delay': {
      if (offset + 6 > raw.length) return null
      const T0 = raw[offset + 2] | (raw[offset + 3] << 8)
      const T1 = raw[offset + 4] | (raw[offset + 5] << 8)
      if (T1 === 0) {
        return { step: { id: genStepId(), action, keys: [], duration: T0 }, nextOffset: offset + 6 }
      } else {
        return {
          step: { id: genStepId(), action, keys: [], delayRandom: true, delayMin: T0, delayMax: T1 },
          nextOffset: offset + 6,
        }
      }
    }
    default:
      return null
  }
}

/**
 * 将 MacroStepData[] 序列化为设备协议字节数据
 */
export function serializeMacroData(steps: MacroStepData[]): Uint8Array {
  const parts: Uint8Array[] = []

  for (const step of steps) {
    switch (step.action) {
      case 'press':
      case 'click':
      case 'release': {
        const buf = new Uint8Array(2 + step.keys.length)
        buf[0] = ACTION_NAME_TO_BYTE[step.action]
        buf[1] = step.keys.length
        for (let i = 0; i < step.keys.length; i++) {
          buf[2 + i] = step.keys[i].code
        }
        parts.push(buf)
        break
      }
      case 'text': {
        // 将文本字符转换为HID键值码
        const text = step.text || ''
        const keyCodes: number[] = []
        for (const ch of text) {
          const code = CHAR_TO_HID[ch]
          if (code !== undefined) keyCodes.push(code)
        }
        const buf = new Uint8Array(2 + keyCodes.length)
        buf[0] = MACRO_ACTION.TEXT
        buf[1] = keyCodes.length
        for (let i = 0; i < keyCodes.length; i++) {
          buf[2 + i] = keyCodes[i]
        }
        parts.push(buf)
        break
      }
      case 'delay': {
        const buf = new Uint8Array(6)
        buf[0] = MACRO_ACTION.DELAY  // 0x03
        buf[1] = 0x04  // 数据长度 = 4字节
        if (step.delayRandom) {
          const min = step.delayMin || 0
          const max = step.delayMax || 0
          const T0 = min       // 最小值
          const T1 = max        // 最大值
          buf[2] = T0 & 0xFF
          buf[3] = (T0 >> 8) & 0xFF
          buf[4] = T1 & 0xFF
          buf[5] = (T1 >> 8) & 0xFF
        } else {
          const duration = step.duration || 0
          buf[2] = duration & 0xFF
          buf[3] = (duration >> 8) & 0xFF
          buf[4] = 0x00
          buf[5] = 0x00
        }
        parts.push(buf)
        break
      }
    }
  }

  // 合并所有部分，开头加1字节总动作数
  const stepsLen = parts.reduce((sum, p) => sum + p.length, 0)
  const result = new Uint8Array(1 + stepsLen)
  result[0] = steps.length
  let offset = 1
  for (const p of parts) {
    result.set(p, offset)
    offset += p.length
  }
  return result
}
