import { useDeviceStore } from '@/stores/modules/device'

/**
 * Composable to get the HIDProtocol instance from device store
 */
export function useProtocol() {
  const deviceStore = useDeviceStore()
  
  /**
   * Get protocol instance, throws error if not connected
   */
  function getProtocol() {
    if (!deviceStore.protocol) {
      throw new Error('设备未连接或协议未初始化')
    }
    return deviceStore.protocol
  }
  
  /**
   * Check if protocol is available
   */
  function isProtocolAvailable() {
    return !!deviceStore.protocol
  }
  
  return {
    protocol: deviceStore.protocol,
    getProtocol,
    isProtocolAvailable,
  }
}
