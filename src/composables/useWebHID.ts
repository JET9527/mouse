import { ref } from 'vue'
import { useDeviceStore } from '@/stores/modules/device'
import { isWebHIDSupported, getBrowserInfo } from '@/utils/helpers'
import type { DeviceInfo } from '@/types/device'

// Input report handler type
export type InputReportHandler = (reportId: number, data: Uint8Array) => void

export function useWebHID() {
  const deviceStore = useDeviceStore()
  const isConnecting = ref(false)
  let inputReportHandler: InputReportHandler | null = null

  // 接收到的数据（使用 reactive ref 存储，类似 kb01_keyboard）
  const receivedData = ref<Uint8Array | null>(null)

  /**
   * 获取之前已授权过的设备（用于页面刷新后自动重连）
   */
  async function getAuthorizedDevice(): Promise<HIDDevice | null> {
    if (!navigator.hid) return null
    try {
      const devices = await navigator.hid.getDevices()
      for (const device of devices) {
        for (const collection of device.collections) {
          if (collection.usagePage === 0xFF80 && collection.usage === 0x0001) {
            return device
          }
        }
      }
    } catch (e) {
      console.warn('获取已授权设备失败:', e)
    }
    return null
  }

  /**
   * Get the received data ref for watch()
   */
  function getReceivedData() {
    return receivedData
  }

  /**
   * Request device connection
   */
  async function requestDevice(filters: HIDDeviceFilter[] = []) {
    if (!isWebHIDSupported()) {
      const browser = getBrowserInfo()
      throw new Error(`您的浏览器 (${browser.name}) 不支持 WebHID API，请使用 Chrome 89+ 或 Edge 89+`)
    }

    isConnecting.value = true

    try {
      const devices = await navigator.hid!.requestDevice({ filters })

      if (devices.length === 0) {
        throw new Error('用户未选择设备')
      }

      let targetDevice: HIDDevice | null = null
      
      const allDevices = await navigator.hid!.getDevices()
      
      for (let i = 0; i < allDevices.length; i++) {
        const device = allDevices[i]
        
        if (!device.opened && device.collections.length === 0) {
          try {
            await device.open()
          } catch (error) {
            continue
          }
        }
        
        if (device.collections.length > 0) {
          const usagePage = device.collections[0].usagePage
          const usage = device.collections[0].usage
          
          if (usagePage === 0xFF80 && usage === 0x0001) {
            targetDevice = device
            break
          }
        }
      }
      
      if (!targetDevice) {
        targetDevice = devices[0]
      }

      await connectToDevice(targetDevice)
      return targetDevice
    } catch (error) {
      console.error('请求设备失败:', error)
      throw error
    } finally {
      isConnecting.value = false
    }
  }

  /**
   * Connect to a specific device
   */
  async function connectToDevice(selectedDevice: HIDDevice) {
    try {
      await selectedDevice.open()
      await new Promise(resolve => setTimeout(resolve, 500))

      deviceStore.setDevice(selectedDevice)

      selectedDevice.addEventListener('inputreport', (event) => {
        const rawData = new Uint8Array(event.data.buffer)
        
        const rawHex = Array.from(rawData).map(b => b.toString(16).padStart(2, '0')).join(' ')
        console.log(`[useWebHID] inputreport reportId=${event.reportId} raw=[${rawHex}]`)
        
        let data = rawData
        if (event.reportId === 0 && rawData.length > 0) {
          if (rawData[0] === 0x00 && rawData.length > 1) {
            data = rawData.slice(1)
            const dataHex = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' ')
            console.log(`[useWebHID] 去除前导0x00后 data=[${dataHex}]`)
          }
        }
        
        receivedData.value = data
        
        if (inputReportHandler) {
          inputReportHandler(event.reportId, data)
        }
      })

      selectedDevice.addEventListener('close', handleDisconnect)
      navigator.hid!.addEventListener('disconnect', handleGlobalDisconnect)
    } catch (error) {
      console.error('连接设备失败:', error)
      deviceStore.setDevice(null)
      throw error
    }
  }

  /**
   * Disconnect from device
   */
  async function disconnect() {
    const device = deviceStore.connectedDevice
    if (device) {
      try {
        await device.close()
      } catch (e) {
        console.error('断开连接失败:', e)
      }
      inputReportHandler = null
      deviceStore.setDevice(null)
    }
  }

  /**
   * Handle device disconnect
   */
  function handleDisconnect() {
    console.log('设备已断开')
    inputReportHandler = null
    deviceStore.setDevice(null)
  }

  /**
   * Handle global device disconnect
   */
  function handleGlobalDisconnect(event: HIDConnectionEvent) {
    if (event.device === deviceStore.connectedDevice) {
      inputReportHandler = null
      deviceStore.setDevice(null)
    }
  }

  /**
   * Send report to device
   */
  async function sendReport(reportId: number, data: Uint8Array) {
    const device = deviceStore.connectedDevice
    if (!device) {
      throw new Error('设备未连接')
    }
    // 使用 ArrayBufferView 类型
    await device.sendReport(reportId, data as unknown as ArrayBufferView)
  }

  /**
   * Set input report handler
   */
  function setInputReportHandler(handler: InputReportHandler | null) {
    inputReportHandler = handler
  }

  return {
    isConnecting,
    requestDevice,
    connectToDevice,
    disconnect,
    sendReport,
    setInputReportHandler,
    getReceivedData,
    getAuthorizedDevice,
  }
}