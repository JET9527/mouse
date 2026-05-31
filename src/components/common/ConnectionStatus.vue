<template>
  <div class="connection-status">
    <div class="status-indicator" :class="{ connected: deviceStore.isConnected }">
      <span class="status-dot"></span>
      <span class="status-text">
        {{ deviceStore.isConnected ? deviceStore.deviceInfo?.productName : '未连接' }}
      </span>
    </div>
    <button
      v-if="!deviceStore.isConnected"
      class="gaming-btn btn-sm"
      :loading="isConnecting"
      @click="handleConnect"
    >
      {{ isConnecting ? '连接中...' : '连接设备' }}
    </button>
    <button
      v-else
      class="gaming-btn btn-sm btn-danger"
      @click="handleDisconnect"
    >
      断开
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDeviceStore } from '@/stores/modules/device'
import { useWebHID, type InputReportHandler } from '@/composables/useWebHID'
import { HIDProtocol } from '@/services/hidProtocol'
import { useAppStore } from '@/stores/modules/app'
import { ProfileLayer } from '@/types/keyMapping'
import { ElMessage } from 'element-plus'

const LS_KEY_CONNECTED = 'mouseConfig_connected'
const LS_KEY_PROFILE = 'mouseConfig_profileId'
const PROFILE_NAMES = ['默认模式', '办公模式', '游戏模式1', '游戏模式2']

const deviceStore = useDeviceStore()
const appStore = useAppStore()
const protocol = ref<HIDProtocol | null>(null)
const { requestDevice, disconnect, isConnecting, setInputReportHandler, getReceivedData, getAuthorizedDevice, connectToDevice } = useWebHID()

// 页面加载时尝试自动重连
onMounted(async () => {
  if (localStorage.getItem(LS_KEY_CONNECTED) !== 'true') return
  
  const authorizedDevice = await getAuthorizedDevice()
  if (!authorizedDevice) {
    localStorage.removeItem(LS_KEY_CONNECTED)
    return
  }
  
  // 自动重连时显示全局 loading
  appStore.setLoading(true)
  
  try {
    // 先打开设备并设置 inputreport 监听
    await connectToDevice(authorizedDevice)
    // 再进行协议握手（不弹成功提示）
    await connectWithDevice(authorizedDevice, false)
    
    // 恢复上次的 mode
    const savedProfile = localStorage.getItem(LS_KEY_PROFILE)
    if (savedProfile !== null && deviceStore.protocol) {
      const profileId = parseInt(savedProfile) as ProfileLayer
      if (profileId >= 0 && profileId <= 3) {
        try {
          await deviceStore.protocol.setProfileId(profileId)
        } catch { /* 同步失败不阻塞 */ }
        appStore.setProfile(profileId)
      }
    }
  } catch (e) {
    console.warn('[ConnectionStatus] 自动重连失败:', e)
    localStorage.removeItem(LS_KEY_CONNECTED)
  } finally {
    appStore.setLoading(false)
  }
})

async function handleConnect() {
  try {
    // 根据协议定义的设备 VID 和 PID 进行过滤
    const filters: HIDDeviceFilter[] = [
      { vendorId: 0x1A86, productId: 0xFE00, usagePage: 0xFF80 } // 三模鼠标设备 (0xFF80协议接口)
    ]
    
    const device = await requestDevice(filters)
    
    if (device) {
      await connectWithDevice(device)
    }
  } catch (error: any) {
    if (error.message !== '用户未选择设备') {
      ElMessage.error(error.message || '连接失败')
    }
  }
}

/**
 * 连接指定设备（提取为独立函数，供首次连接和自动重连共用）
 * @param showToast 是否弹出连接成功提示（默认 true）
 */
async function connectWithDevice(device: HIDDevice, showToast = true) {
  const connectedDevice = device
  if (!connectedDevice) {
    throw new Error('设备未连接')
  }

  const newProtocol = new HIDProtocol(
    async (protocolReportId: number, data: Uint8Array) => {
      let outputReportId = protocolReportId
      const device = deviceStore.connectedDevice
      if (!device) throw new Error('设备未连接')
      for (const collection of device.collections) {
        if (collection.outputReports && collection.outputReports.length > 0) {
          outputReportId = collection.outputReports[0].reportId
          break
        }
      }
      await device.sendReport(outputReportId, data.buffer as ArrayBuffer)
    },
    async (reportId: number, length: number) => {
      const device = deviceStore.connectedDevice
      if (!device) throw new Error('设备未连接')
      const featureReport = await device.receiveFeatureReport(reportId)
      return featureReport
    },
    connectedDevice
  )
  
  // 设置 input report handler
  const handler: InputReportHandler = (reportId, data) => {
    newProtocol.handleInputReport(reportId, data)
  }
  setInputReportHandler(handler)
  
  // 存储到 deviceStore
  deviceStore.setProtocol(newProtocol)
  protocol.value = newProtocol
  
  // 等待设备准备就绪
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 尝试连接设备（发送协议握手）
  try {
    const receivedData = getReceivedData()
    const deviceInfo = await newProtocol.connectToDevice(receivedData)
    
    console.log('[ConnectionStatus] 设备连接成功:', {
      型号: `0x${deviceInfo.modelHigh.toString(16).padStart(2, '0')} ${deviceInfo.modelLow.toString(16).padStart(2, '0')}`,
      主题: `0x${deviceInfo.themeHigh.toString(16).padStart(2, '0')} ${deviceInfo.themeLow.toString(16).padStart(2, '0')}`,
      语言: deviceInfo.language,
      固件版本: deviceInfo.firmwareVersion
    })
    
    // 连接成功后获取 Profile ID
    try {
      const profileId = await newProtocol.getProfileId()
      console.log('[ConnectionStatus] 当前 Profile ID:', {
        值: `0x${profileId.toString(16).padStart(2, '0')}`,
        名称: PROFILE_NAMES[profileId] || '未知'
      })
      appStore.setProfile(profileId)
    } catch (profileError) {
      console.warn('[ConnectionStatus] 获取 Profile ID 失败，使用默认:', profileError)
      appStore.setProfile(ProfileLayer.DEFAULT)
    }
    
    // 持久化状态到 localStorage
    localStorage.setItem(LS_KEY_CONNECTED, 'true')
    localStorage.setItem(LS_KEY_PROFILE, String(appStore.currentProfile))
    
    if (showToast) {
      ElMessage.success('设备连接成功')
    }
  } catch (error: any) {
    console.error('[ConnectionStatus] 设备连接失败:', error)
    
    let errorMsg = '协议握手失败'
    if (error.message.includes('NotAllowedError')) {
      errorMsg = '设备拒绝访问，请检查设备是否支持此协议'
    } else if (error.message.includes('timeout')) {
      errorMsg = '设备响应超时，请重试'
    } else if (error.message.includes('Failed to write')) {
      errorMsg = '写入失败，设备可能不支持此 Report ID'
    }
    
    ElMessage.error(errorMsg)
  }
}

async function handleDisconnect() {
  setInputReportHandler(null)
  await disconnect()
  protocol.value = null
  localStorage.removeItem(LS_KEY_CONNECTED)
  localStorage.removeItem(LS_KEY_PROFILE)
  ElMessage.info('设备已断开')
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.connection-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(15, 52, 96, 0.5);
  border: 1px solid $border-color;
  border-radius: $radius-sm;

  &.connected {
    border-color: $success-color;
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $text-muted;

  .connected & {
    background: $success-color;
    box-shadow: 0 0 6px $success-color;
    animation: pulse 2s infinite;
  }
}

.status-text {
  font-size: 12px;
  color: $text-secondary;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
