<template>
  <div class="connection-status">
    <span
      class="status-pill"
      :class="{ connected: deviceStore.isConnected }"
    >
      {{ deviceStore.isConnected ? deviceStore.deviceInfo?.productName : $t('connection.disconnected') }}
    </span>
    <button
      v-if="!deviceStore.isConnected"
      class="connect-btn"
      :loading="isConnecting"
      @click="handleConnect"
    >
      {{ isConnecting ? $t('connection.connecting') : $t('connection.connect') }}
    </button>
    <button
      v-else
      class="disconnect-btn"
      @click="handleDisconnect"
    >
      {{ $t('connection.disconnect') }}
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
import { useI18n } from 'vue-i18n'

const LS_KEY_CONNECTED = 'mouseConfig_connected'
const LS_KEY_PROFILE = 'mouseConfig_profileId'

const deviceStore = useDeviceStore()
const appStore = useAppStore()
const { t } = useI18n()
const PROFILE_NAMES = [t('connection.profileNameDefault'), t('connection.profileNameOffice'), t('connection.profileNameGame1'), t('connection.profileNameGame2')]

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
    if (error.message !== t('connection.userCancelled')) {
      ElMessage.error(error.message || t('connection.connectFailed'))
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
      ElMessage.success(t('connection.connected'))
    }
  } catch (error: any) {
    console.error('[ConnectionStatus] 设备连接失败:', error)
    
    let errorMsg = t('connection.handshakeFailed')
    if (error.message.includes('NotAllowedError')) {
      errorMsg = t('connection.accessDenied')
    } else if (error.message.includes('timeout')) {
      errorMsg = t('connection.timeout')
    } else if (error.message.includes('Failed to write')) {
      errorMsg = t('connection.writeFailed')
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
  ElMessage.info(t('connection.disconnectedMsg'))
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.connection-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-pill {
  padding: 6px 14px;
  background: #FF3355;
  color: #fff;
  border-radius: 20px;
  font-size: 13px;
  white-space: nowrap;

  &.connected {
    background: #39FF77;
    color: #000;
  }
}

.connect-btn {
  padding: 6px 12px;
  background: #181C29;
  border: 1px solid rgba(0,229,255,0.3);
  border-radius: 4px;
  color: #E6EDF7;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;

  &:hover {
    border-color: #00E5FF;
  }
}

.disconnect-btn {
  padding: 6px 14px;
  background: #FF3355;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;

  &:hover {
    box-shadow: 0 0 8px #FF335566;
  }
}
</style>
