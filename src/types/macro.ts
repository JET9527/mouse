// Macro types

export enum MacroEventType {
  KEY_DOWN = 'keyDown',
  KEY_UP = 'keyUp',
  MOUSE_DOWN = 'mouseDown',
  MOUSE_UP = 'mouseUp',
  DELAY = 'delay',
}

export enum MouseButton {
  LEFT = 0,
  RIGHT = 1,
  MIDDLE = 2,
  BACK = 3,
  FORWARD = 4,
}

export interface MacroEvent {
  id: string
  type: MacroEventType
  timestamp: number

  // Keyboard
  keyCode?: number
  keyLabel?: string
  modifiers?: number[]

  // Mouse
  button?: MouseButton
  x?: number
  y?: number

  // Delay
  duration?: number
}

export interface Macro {
  id: string
  name: string
  description?: string
  events: MacroEvent[]
  createdAt: number
  updatedAt: number
  triggerButton?: number
}

export interface MacroState {
  macros: Macro[]
  isRecording: boolean
  currentRecordingEvents: MacroEvent[]
  activeMacroId: string | null
}
