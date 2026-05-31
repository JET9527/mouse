import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DeviceInfo, DeviceCapabilities } from '@/types/device'
import type { HIDProtocol } from '@/services/hidProtocol'

export const useDeviceStore = defineStore('device', () => {
  const connectedDevice = ref<HIDDevice | null>(null)
  const isConnected = ref(false)
  const deviceInfo = ref<DeviceInfo | null>(null)
  const firmwareVersion = ref('')
  const protocol = ref<HIDProtocol | null>(null)
  const capabilities = ref<DeviceCapabilities>({
    minDPI: 100,
    maxDPI: 26000,
    dpiStep: 50,
    maxDPILevels: 5,
    supportedPollingRates: [125, 250, 500, 1000, 2000, 4000],
    maxMacros: 10,
    maxMacroEvents: 500,
  })

  function setDevice(device: HIDDevice | null) {
    connectedDevice.value = device
    isConnected.value = !!device
    if (device) {
      deviceInfo.value = {
        productName: device.productName,
        vendorId: device.vendorId,
        productId: device.productId,
        serialNumber: device.serialNumber,
        firmwareVersion: '',
      }
    } else {
      deviceInfo.value = null
      protocol.value = null
    }
  }

  function setProtocol(proto: HIDProtocol | null) {
    protocol.value = proto
  }

  function setFirmwareVersion(version: string) {
    firmwareVersion.value = version
  }

  function updateCapabilities(caps: Partial<DeviceCapabilities>) {
    capabilities.value = { ...capabilities.value, ...caps }
  }

  return {
    connectedDevice,
    isConnected,
    deviceInfo,
    firmwareVersion,
    protocol,
    capabilities,
    setDevice,
    setProtocol,
    setFirmwareVersion,
    updateCapabilities,
  }
})
