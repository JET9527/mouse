// Config file types
export interface ConfigFile {
  version: string
  deviceId: string
  deviceName: string
  createdAt: number
  updatedAt: number
  keyMapping: KeyMappingExport
  macros: MacroExport[]
  deviceSettings: DeviceSettingsExport
  lighting: LightingConfigExport
  metadata: {
    author?: string
    description?: string
    tags?: string[]
  }
}

export interface KeyMappingExport {
  profiles: {
    [key: string]: {
      name: string
      mappings: Array<{
        buttonId: number
        type: string
        target: any
        enabled: boolean
      }>
    }
  }
}

export interface MacroExport {
  id: string
  name: string
  events: any[]
  triggerButton?: number
}

export interface DeviceSettingsExport {
  dpi: any
  pollingRate: number
  fireKey: any
}

export interface LightingConfigExport {
  effect: string
  brightness: number
  speed: number
  colors: Array<{ r: number; g: number; b: number }>
}
