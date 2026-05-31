// Device-related types

// 协议定义的设备信息
export interface ProtocolDeviceInfo {
  modelHigh: number
  modelLow: number
  themeHigh: number
  themeLow: number
  language: number
  firmwareVersion: string
}

export interface DeviceInfo {
  productName: string
  vendorId: number
  productId: number
  serialNumber: string
  firmwareVersion: string
  // 协议特有信息
  protocolInfo?: ProtocolDeviceInfo
}

// 设备连接状态
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

export interface DeviceCapabilities {
  minDPI: number
  maxDPI: number
  dpiStep: number
  maxDPILevels: number
  supportedPollingRates: PollingRate[]
  maxMacros: number
  maxMacroEvents: number
}

// DPI configuration
export interface DPIConfig {
  levels: DPILevel[]
  activeLevelIndex: number
  switchBehavior: 'cycle' | 'momentary'
}

export interface DPILevel {
  index: number
  dpiX: number
  dpiY: number
  color?: RGBColor
  enabled: boolean
}

// Polling rate
export enum PollingRate {
  HZ_125 = 125,
  HZ_250 = 250,
  HZ_500 = 500,
  HZ_1000 = 1000,
  HZ_2000 = 2000,
  HZ_4000 = 4000,
}

// Fire key config
export interface FireKeyConfig {
  enabled: boolean
  buttonId: number
  clickInterval: number
  duration: number
}

// Device settings
export interface DeviceSettings {
  dpi: DPIConfig
  pollingRate: PollingRate
  fireKey: FireKeyConfig
  pointerSpeed: number
  wheelSpeed: number
}

// RGB Color
export interface RGBColor {
  r: number
  g: number
  b: number
}
