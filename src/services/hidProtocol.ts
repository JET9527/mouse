import { ref, onUnmounted, watch } from 'vue'
import { HIDCommand } from '@/utils/constants'
import { ProfileLayer } from '@/types/keyMapping'
import type { LightingConfig } from '@/types/lighting'
import type { ProtocolDeviceInfo } from '@/types/device'
import type { Ref } from 'vue'

// 协议消息ID定义（根据V1.0.3协议）
export const enum ProtocolMessageId {
  // 连接相关
  CONNECT_REQ = 0x01,
  CONNECT_RSP = 0x02,
  
  // Profile ID相关
  GET_PROFILE_ID_REQ = 0x03,
  GET_PROFILE_ID_RSP = 0x04,
  SAVE_PROFILE_ID_REQ = 0x05,
  SAVE_PROFILE_ID_RSP = 0x06,
  
  // 灯效相关
  LIGHT_EFFECT_CURRENT_REQ = 0x12,
  LIGHT_EFFECT_CURRENT_RSP = 0x13,
  LIGHT_EFFECT_ASYN_REQ = 0x14,
  LIGHT_EFFECT_ASYN_RSP = 0x15,
  LIGHT_EFFECT_SAVE_REQ = 0x16,
  LIGHT_EFFECT_SAVE_RSP = 0x17,
  
  // 按键映射相关
  GET_KEY_MAPPING_REQ = 0x30,
  GET_KEY_MAPPING_RSP = 0x31,
  SAVE_KEY_MAPPING_REQ = 0x32,
  SAVE_KEY_MAPPING_RSP = 0x33,
  RESET_KEY_MAPPING_REQ = 0x34,
  RESET_KEY_MAPPING_RSP = 0x35,
  
  // 宏录制相关
  GET_MACRO_REQ = 0x36,
  GET_MACRO_RSP = 0x37,
  SAVE_MACRO_REQ = 0x38,
  SAVE_MACRO_RSP = 0x39,
  
  // 快捷键相关
  GET_SHORTCUT_REQ = 0x3A,
  GET_SHORTCUT_RSP = 0x3B,
  SAVE_SHORTCUT_REQ = 0x3C,
  SAVE_SHORTCUT_RSP = 0x3D,
  
  // 性能参数相关
  GET_PERFORMANCE_REQ = 0x50,
  GET_PERFORMANCE_RSP = 0x51,
  SAVE_PERFORMANCE_REQ = 0x52,
  SAVE_PERFORMANCE_RSP = 0x53,
  
  // 其他指令
  EXIT_PC_MODE_REQ = 0x54,
  EXIT_PC_MODE_RSP = 0x55,
  
  // 恢复出厂设置
  RESTORE_FACTORY_REQ = 0x90,
  RESTORE_FACTORY_RSP = 0x91,
}

// 协议固定值
const PACKET_HEADER = 0x55
const PACKET_END1 = 0x0D
const PACKET_END2 = 0x0A
const PACKET_DATA_MARKER = 0x66

// 响应等待结果
interface ResponseResolver {
  resolve: (value: Uint8Array) => void
  reject: (reason: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

export class HIDProtocol {
  private sendReportFn: (reportId: number, data: Uint8Array, useFeatureReport?: boolean) => Promise<void>
  private receiveFeatureReportFn?: (reportId: number, length: number) => Promise<DataView>
  private responseHandlers: Map<number, (data: Uint8Array) => void> = new Map()
  private responseResolvers: Map<number, ResponseResolver> = new Map()
  private isConnected: boolean = false
  private deviceInfo: ProtocolDeviceInfo | null = null
  private device: HIDDevice | null = null

  constructor(sendReportFn: (reportId: number, data: Uint8Array) => Promise<void>, receiveFeatureReportFn?: (reportId: number, length: number) => Promise<DataView>, device?: HIDDevice) {
    this.sendReportFn = sendReportFn
    this.receiveFeatureReportFn = receiveFeatureReportFn
    this.device = device ?? null
  }

  /**
   * 设置响应监听器
   */
  onResponse(messageId: number, handler: (data: Uint8Array) => void) {
    this.responseHandlers.set(messageId, handler)
  }

  /**
   * 等待响应（带超时）
   */
  async waitForResponse(messageId: number, timeoutMs: number = 3000): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const resolver = this.responseResolvers.get(messageId)
        if (resolver) {
          this.responseResolvers.delete(messageId)
          reject(new Error(`等待响应超时: 0x${messageId.toString(16).padStart(2, '0')}`))
        }
      }, timeoutMs)

      this.responseResolvers.set(messageId, { resolve, reject, timeout })
    })
  }

  /**
   * 构建协议数据包
   * @param messageId 消息ID
   * @param dataPayload 数据负载（不含包头、长度、消息ID、包尾）
   * @returns 完整的数据包
   * 
   * 格式：{包头(0x55), 长度, 消息ID, 数据负载, 包尾(0x0D, 0x0A)}
   * 长度字段 = 数据负载长度（不包括消息ID）
   */
  private buildPacket(messageId: number, dataPayload: Uint8Array): Uint8Array {
    // 数据包结构：包头(1) + 长度(1) + 消息ID(1) + 数据负载(N) + 包尾(2)
    const packet = new Uint8Array(1 + 1 + 1 + dataPayload.length + 2)
    packet[0] = PACKET_HEADER
    packet[1] = dataPayload.length // 长度字段 = 数据负载长度
    packet[2] = messageId
    packet.set(dataPayload, 3)
    packet[packet.length - 2] = PACKET_END1
    packet[packet.length - 1] = PACKET_END2
    return packet
  }

  /**
   * 处理设备输入报告
   * 参考 kb01_keyboard 的连接机制：不过滤数据，将所有数据传递给协议处理
   * 协议格式遵循 V1.0.3：{包头(0x55), 长度, 消息ID, 数据负载, 包尾(0x0D, 0x0A)}
   */
  handleInputReport(reportId: number, data: Uint8Array) {
    if (data.length < 2) return
  
    const isProtocolPacket = data.length >= 4 && data[0] === PACKET_HEADER
    
    if (isProtocolPacket) {
      const messageId = data[2]
      const resolver = this.responseResolvers.get(messageId)
      if (resolver) {
        resolver.resolve(data)
        this.responseResolvers.delete(messageId)
      }
    }
  }

  /**
   * 发送原始数据包
   * @param data 要发送的数据
   * @param reportId 报告ID，默认为0（大多数HID设备使用0）
   * 
   * 注意：
   * - WebHID 的 sendReport(reportId, data) 中，data 不包含 Report ID
   * - Report ID 由 reportId 参数指定
   * - 实际发送的数据就是 data 的内容
   * - 根据 BusHound 测试，设备期望接收 6 字节：55 01 01 66 0D 0A
   */
  async sendPacket(data: Uint8Array, reportId: number = 0): Promise<void> {
    try {
      await this.sendReportFn(reportId, data)
    } catch (error: any) {
      console.error('[HIDProtocol] 发送数据包失败:', error.message)
      throw error
    }
  }

  /**
   * 连接设备 (PC → MCU)
   * 参考 kb01_keyboard 的连接机制：
   * - 使用 watch(receivedData) 等待响应
   * - 通过 onResponse 注册响应监听器处理数据
   * 
   * 协议格式遵循 V1.0.3：{包头(0x55), 长度, 消息ID, 数据负载, 包尾(0x0D, 0x0A)}
   * 
   * @param receivedData 用于 watch 机制的响应数据引用
   */
  async connectToDevice(receivedData?: Ref<Uint8Array | null>): Promise<ProtocolDeviceInfo> {
    if (this.isConnected) {
      throw new Error('设备已连接')
    }

    // V1.0.3 协议格式：{0x55, 长度, MSG_ID, 数据负载, 0x0D, 0x0A}
    const payload = new Uint8Array([PACKET_DATA_MARKER])
    const requestPacket = this.buildPacket(ProtocolMessageId.CONNECT_REQ, payload)

    if (receivedData) {
      receivedData.value = null
      const responsePromise = this.waitForResponseWithWatch(receivedData)
      await this.sendPacket(requestPacket)
      return responsePromise
    }

    await this.sendPacket(requestPacket)
    return this.waitForResponseLegacy()
  }

  /**
   * 使用 watch 机制等待响应（完全参考 kb01_keyboard）
   * 
   * 关键区别：
   * - kb01_keyboard 的 checkResponse 只检查 length > 1，不过滤任何数据
   * - 收到任何数据都认为成功
   * - 不使用 ResponseResolver 机制
   */
  private async waitForResponseWithWatch(receivedData: Ref<Uint8Array | null>): Promise<ProtocolDeviceInfo> {
    return new Promise<ProtocolDeviceInfo>((resolve, reject) => {
      let responseReceived = false
      let unwatch: (() => void) | null = null

      unwatch = watch(receivedData, (newData) => {
        if (responseReceived) return
        if (!newData || newData.length <= 1) return

        responseReceived = true
        clearTimeout(timeout)
        if (unwatch) unwatch()

        try {
          const deviceInfo = this.parseDeviceInfo(newData)
          this.deviceInfo = deviceInfo
          this.isConnected = true
          console.log('[HIDProtocol] 设备连接成功:', {
            型号: `0x${deviceInfo.modelHigh.toString(16).padStart(2, '0')} ${deviceInfo.modelLow.toString(16).padStart(2, '0')}`,
            主题: `0x${deviceInfo.themeHigh.toString(16).padStart(2, '0')} ${deviceInfo.themeLow.toString(16).padStart(2, '0')}`,
            语言: deviceInfo.language,
            固件版本: deviceInfo.firmwareVersion
          })
          resolve(deviceInfo)
        } catch (error) {
          console.warn('[HIDProtocol] 解析设备信息失败，使用默认值:', error)
          resolve({
            modelHigh: 0,
            modelLow: 0,
            themeHigh: 0,
            themeLow: 0,
            language: 0,
            firmwareVersion: 'unknown'
          })
        }
      })

      const timeout = setTimeout(() => {
        if (unwatch) unwatch()
        reject(new Error('设备响应超时'))
      }, 5000)
    })
  }

  /**
   * 降级方案：使用传统的 Promise-based timeout
   */
  private async waitForResponseLegacy(): Promise<ProtocolDeviceInfo> {
    return new Promise<ProtocolDeviceInfo>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('[HIDProtocol] 连接超时！')
        console.error('[HIDProtocol] 请检查 MCU 是否返回了响应数据')
        reject(new Error('设备响应超时'))
      }, 5000)

      // 注册一次性连接响应监听器
      this.onResponse(ProtocolMessageId.CONNECT_RSP, (data) => {
        clearTimeout(timeout)
        try {
          const deviceInfo = this.parseDeviceInfo(data)
          this.deviceInfo = deviceInfo
          this.isConnected = true
          console.log('[HIDProtocol] 设备连接成功:', deviceInfo)
          resolve(deviceInfo)
        } catch (error) {
          clearTimeout(timeout)
          reject(error)
        }
      })
    })
  }

  /**
   * 解析设备信息
   * V1.0.3 协议响应格式: {0x55, LEN, 0x02, 0x66, 型号高位, 型号低位, 主题高位, 主题低位, 语言, VERN[N], 0x0D, 0x0A}
   */
   private parseDeviceInfo(response: Uint8Array): ProtocolDeviceInfo {
    const packetLength = response[1]
    const dataStartIndex = 4
    
    const modelHigh = response[dataStartIndex + 1]
    const modelLow = response[dataStartIndex + 2]
    const themeHigh = response[dataStartIndex + 3]
    const themeLow = response[dataStartIndex + 4]
    const language = response[dataStartIndex + 5]

    const versionStartIndex = dataStartIndex + 5
    const versionEndIndex = (2 + packetLength) - 2
    const versionBytes = response.slice(versionStartIndex, versionEndIndex)
    const firmwareVersion = new TextDecoder().decode(versionBytes)

    return {
      modelHigh,
      modelLow,
      themeHigh,
      themeLow,
      language,
      firmwareVersion
    }
  }

  /**
   * 获取连接状态
   */
  getIsConnected(): boolean {
    return this.isConnected
  }

  /**
   * 获取设备信息
   */
  getDeviceInfo(): ProtocolDeviceInfo | null {
    return this.deviceInfo
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.isConnected = false
    this.deviceInfo = null
    
    // 清理所有等待的响应
    for (const [messageId, resolver] of this.responseResolvers) {
      clearTimeout(resolver.timeout)
      resolver.reject(new Error('设备已断开连接'))
    }
    this.responseResolvers.clear()
    
    console.log('[HIDProtocol] 设备已断开')
  }

  /**
   * 获取 Profile ID (PC → MCU) MSG_ID = 0x03
   */
  async getProfileId(): Promise<ProfileLayer> {
    const data = new Uint8Array([0x55, 0x01, 0x03, 0x66, 0x0D, 0x0A])
    await this.sendPacket(data)
    const response = await this.waitForResponse(0x04)
    return response[3] as ProfileLayer
  }

  /**
   * 设置 Profile ID (PC → MCU) MSG_ID = 0x05
   */
  async setProfileId(profileId: ProfileLayer): Promise<void> {
    const data = new Uint8Array([0x55, 0x02, 0x05, profileId, 0x66, 0x0D, 0x0A])
    await this.sendPacket(data)
    await this.waitForResponse(0x06)
  }

  /**
   * 获取灯效数据 (PC → MCU) MSG_ID = 0x12
   */
  async getLightingConfig(): Promise<LightingConfig> {
    const data = new Uint8Array([0x55, 0x01, 0x12, 0x66, 0x0D, 0x0A])
    await this.sendPacket(data)
    const response = await this.waitForResponse(0x13)
    
    // 解析灯效参数结构体
    const patch = response.slice(3, -2)
    return {
      mode: patch[0],
      runningSpeed: patch[1],
      colorId: patch[2],
      lightness: patch[3],
      direction: patch[4],
      colors: [
        { r: patch[5], g: patch[6], b: patch[7] },
        { r: patch[8], g: patch[9], b: patch[10] },
        { r: patch[11], g: patch[12], b: patch[13] },
        { r: patch[14], g: patch[15], b: patch[16] },
        { r: patch[17], g: patch[18], b: patch[19] },
        { r: patch[20], g: patch[21], b: patch[22] },
      ],
      magic: patch[23],
    }
  }

  /**
   * 设置灯效数据 (PC → MCU) MSG_ID = 0x14
   */
  async setLightingConfig(config: LightingConfig): Promise<void> {
    const patch = new Uint8Array(24)
    patch[0] = config.mode
    patch[1] = config.runningSpeed
    patch[2] = config.colorId
    patch[3] = config.lightness
    patch[4] = config.direction
    
    // 6颗LED的颜色值
    for (let i = 0; i < 6; i++) {
      const color = config.colors[i] || { r: 0, g: 0, b: 0 }
      patch[5 + i * 3] = color.r
      patch[6 + i * 3] = color.g
      patch[7 + i * 3] = color.b
    }
    
    patch[23] = config.magic

    const data = new Uint8Array([0x55, patch.length, 0x14, ...patch, 0x0D, 0x0A])
    await this.sendPacket(data)
    await this.waitForResponse(0x15)
  }

  /**
   * 保存灯效设置 (PC → MCU) MSG_ID = 0x16
   */
  async saveLightingConfig(config: LightingConfig): Promise<void> {
    const patch = new Uint8Array(24)
    patch[0] = config.mode
    patch[1] = config.runningSpeed
    patch[2] = config.colorId
    patch[3] = config.lightness
    patch[4] = config.direction
    
    for (let i = 0; i < 6; i++) {
      const color = config.colors[i] || { r: 0, g: 0, b: 0 }
      patch[5 + i * 3] = color.r
      patch[6 + i * 3] = color.g
      patch[7 + i * 3] = color.b
    }
    
    patch[23] = config.magic

    const data = new Uint8Array([0x55, patch.length, 0x16, ...patch, 0x0D, 0x0A])
    await this.sendPacket(data)
    await this.waitForResponse(0x17)
  }

  /**
   * 获取按键定义 (PC → MCU) MSG_ID = 0x30
   */
  async getKeyMappings(profileId: ProfileLayer): Promise<Uint8Array> {
    const data = new Uint8Array([0x55, 0x01, 0x30, profileId, 0x0D, 0x0A])
    await this.sendPacket(data)
    const response = await this.waitForResponse(0x31)
    return response.slice(4, -2)
  }

  /**
   * 保存按键定义 (PC → MCU) MSG_ID = 0x32
   */
  async saveKeyMappings(profileId: ProfileLayer, mappingData: Uint8Array): Promise<void> {
    const data = new Uint8Array([0x55, mappingData.length + 1, 0x32, profileId, ...mappingData, 0x0D, 0x0A])
    await this.sendPacket(data)
    await this.waitForResponse(0x33)
  }

  /**
   * 复位按键定义 (PC → MCU) MSG_ID = 0x34
   */
  async resetKeyMappings(profileId: ProfileLayer): Promise<Uint8Array> {
    const data = new Uint8Array([0x55, 0x01, 0x34, profileId, 0x0D, 0x0A])
    await this.sendPacket(data)
    const response = await this.waitForResponse(0x35)
    return response.slice(4, -2)
  }

  /**
   * 获取快捷键定义 (PC → MCU) MSG_ID = 0x3A
   */
  async getShortcutKey(profileId: ProfileLayer, keyIndex: number): Promise<Uint8Array> {
    const data = new Uint8Array([0x55, 0x02, 0x3A, profileId, keyIndex, 0x0D, 0x0A])
    await this.sendPacket(data)
    const response = await this.waitForResponse(0x3B)
    return response.slice(5, 10)
  }

  /**
   * 保存快捷键定义 (PC → MCU) MSG_ID = 0x3C
   */
  async saveShortcutKey(profileId: ProfileLayer, keyIndex: number, shortcutData: Uint8Array): Promise<void> {
    const data = new Uint8Array([0x55, 0x07, 0x3C, profileId, keyIndex, ...shortcutData, 0x0D, 0x0A])
    await this.sendPacket(data)
    await this.waitForResponse(0x3D)
  }

  /**
   * 获取宏录制数据 (PC → MCU) MSG_ID = 0x36
   */
  async getMacroData(macroIndex: number): Promise<Uint8Array> {
    const data = new Uint8Array([0x55, 0x01, 0x36, macroIndex, 0x0D, 0x0A])
    await this.sendPacket(data)
    const response = await this.waitForResponse(0x37)
    return response.slice(4, -2)
  }

  /**
   * 保存宏录制数据 (PC → MCU) MSG_ID = 0x38
   */
  async saveMacroData(macroIndex: number, macroData: Uint8Array): Promise<void> {
    const data = new Uint8Array([0x55, macroData.length + 1, 0x38, macroIndex, ...macroData, 0x0D, 0x0A])
    await this.sendPacket(data)
    await this.waitForResponse(0x39)
  }

  /**
   * 获取性能参数 (PC → MCU) MSG_ID = 0x50
   */
  async getPerformanceSettings(): Promise<Uint8Array> {
    const data = new Uint8Array([0x55, 0x01, 0x50, 0x66, 0x0D, 0x0A])
    await this.sendPacket(data)
    const response = await this.waitForResponse(0x51)
    return response.slice(3, 11)
  }

  /**
   * 保存性能参数 (PC → MCU) MSG_ID = 0x52
   */
  async savePerformanceSettings(settings: Uint8Array): Promise<void> {
    const data = new Uint8Array([0x55, 0x08, 0x52, ...settings, 0x0D, 0x0A])
    await this.sendPacket(data)
    await this.waitForResponse(0x53)
  }

  /**
   * 退出PC模式/复位MCU (PC → MCU) MSG_ID = 0x54
   */
  async exitPCMode(): Promise<void> {
    const data = new Uint8Array([0x55, 0x01, 0x54, 0x66, 0x0D, 0x0A])
    await this.sendPacket(data)
    await this.waitForResponse(0x55)
  }

  /**
   * 恢复出厂设置 (PC → MCU) MSG_ID = 0x90
   */
  async restoreFactorySettings(): Promise<void> {
    const data = new Uint8Array([0x55, 0x03, 0x90, 0x33, 0x44, 0x0D, 0x0A])
    await this.sendPacket(data)
    await this.waitForResponse(0x91)
  }

  // 以下方法保持兼容性
  async setKeyMapping(buttonId: number, type: number, keyCode: number): Promise<void> {
    const data = new Uint8Array([buttonId, type, keyCode & 0xff, (keyCode >> 8) & 0xff])
    await this.sendCommand(HIDCommand.SET_KEY_MAPPING, data)
  }

  async switchProfile(profileIndex: number): Promise<void> {
    await this.setProfileId(profileIndex as ProfileLayer)
  }

  async saveProfile(): Promise<void> {
    await this.sendCommand(HIDCommand.SAVE_PROFILE)
  }

  async setDPI(levelIndex: number, dpiX: number, dpiY: number): Promise<void> {
    const data = new Uint8Array([
      levelIndex,
      dpiX & 0xff,
      (dpiX >> 8) & 0xff,
      dpiY & 0xff,
      (dpiY >> 8) & 0xff,
    ])
    await this.sendCommand(HIDCommand.SET_DPI_LEVEL, data)
  }

  async setPollingRate(rate: number): Promise<void> {
    const data = new Uint8Array([rate & 0xff, (rate >> 8) & 0xff])
    await this.sendCommand(HIDCommand.SET_POLLING_RATE, data)
  }

  async setFireKey(enabled: boolean, buttonId: number, interval: number, duration: number): Promise<void> {
    const data = new Uint8Array([
      enabled ? 1 : 0,
      buttonId,
      interval & 0xff,
      (interval >> 8) & 0xff,
      duration & 0xff,
      (duration >> 8) & 0xff,
      (duration >> 16) & 0xff,
      (duration >> 24) & 0xff,
    ])
    await this.sendCommand(HIDCommand.SET_FIRE_KEY, data)
  }

  async setRGBEffect(effect: number, brightness: number, speed: number, colors: Array<{r: number, g: number, b: number}>): Promise<void> {
    const data = new Uint8Array(4 + colors.length * 3)
    data[0] = effect
    data[1] = brightness
    data[2] = speed
    data[3] = colors.length
    colors.forEach((c, i) => {
      data[4 + i * 3] = c.r
      data[5 + i * 3] = c.g
      data[6 + i * 3] = c.b
    })
    await this.sendCommand(HIDCommand.SET_RGB_EFFECT, data)
  }

  async setMacro(macroId: number, events: Uint8Array): Promise<void> {
    const chunkSize = 60
    for (let offset = 0; offset < events.length; offset += chunkSize) {
      const chunk = events.slice(offset, offset + chunkSize)
      const data = new Uint8Array(3 + chunk.length)
      data[0] = macroId & 0xff
      data[1] = offset & 0xff
      data[2] = (offset >> 8) & 0xff
      data.set(chunk, 3)
      await this.sendCommand(HIDCommand.SET_MACRO, data)
    }
  }

  private async sendCommand(command: HIDCommand, data: Uint8Array = new Uint8Array(0)): Promise<void> {
    const report = new Uint8Array(1 + data.length)
    report[0] = command
    report.set(data, 1)
    await this.sendReportFn(0, report)
  }
}