<template>
  <div class="bottom-bar">
    <!-- Profile 模式切换（底部左侧） -->
    <div class="profile-tabs">
      <button
        v-for="profile in profileLayers"
        :key="profile.key"
        class="profile-tab"
        :class="{ active: appStore.currentProfile === profile.key }"
        @click="handleProfileChange(profile.key)"
      >
        {{ profile.label }}
      </button>
    </div>

    <!-- Action buttons -->
    <div class="action-buttons">
      <button class="right-btn-reset" @click="handleReset">
        <el-icon><Refresh /></el-icon>
        重置
      </button>
      <button class="right-btn-factory" @click="handleRestoreFactory">
        <el-icon><WarningFilled /></el-icon>
        复位
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PROFILE_LAYERS } from '@/utils/constants'
import { useAppStore } from '@/stores/modules/app'
import { useKeyMappingStore } from '@/stores/modules/keyMapping'
import { useDeviceStore } from '@/stores/modules/device'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, WarningFilled } from '@element-plus/icons-vue'
import { ProfileLayer } from '@/types/keyMapping'

const appStore = useAppStore()
const keyMappingStore = useKeyMappingStore()
const deviceStore = useDeviceStore()
const profileLayers = PROFILE_LAYERS

// ProfileLayer 枚举 → keyMapping store 的 ProfileKey 映射
const profileLayerToKey: Record<ProfileLayer, string> = {
  [ProfileLayer.DEFAULT]: 'default',
  [ProfileLayer.OFFICE]: 'office',
  [ProfileLayer.GAME1]: 'game1',
  [ProfileLayer.GAME2]: 'game2',
}

async function handleProfileChange(key: ProfileLayer) {
  appStore.setProfile(key)
  keyMappingStore.setProfile(profileLayerToKey[key] as any)

  // 设备已连接时，同步切换 MCU 的 Profile
  if (deviceStore.isConnected && deviceStore.protocol) {
    appStore.setLoading(true)
    try {
      await deviceStore.protocol.setProfileId(key)
      const profileNames = ['默认模式', '办公模式', '游戏模式1', '游戏模式2']
      ElMessage.success(`已切换到 ${profileNames[key] || '未知模式'}`)
      localStorage.setItem('mouseConfig_profileId', String(key))
      console.log('[BottomBar] 切换 Profile:', {
        值: `0x${key.toString(16).padStart(2, '0')}`,
        名称: ['默认模式', '办公模式', '游戏模式1', '游戏模式2'][key] || '未知'
      })
    } catch (error: any) {
      console.error('[BottomBar] 切换 Profile 失败:', error)
      ElMessage.error('切换模式失败')
      const prevKey = appStore.currentProfile
      appStore.setProfile(prevKey)
      keyMappingStore.setProfile(profileLayerToKey[prevKey] as any)
    } finally {
      appStore.setLoading(false)
    }
  }
}

async function handleReset() {
  try {
    await ElMessageBox.confirm('确定要恢复主控出厂设置吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    if (!deviceStore.isConnected || !deviceStore.protocol) {
      ElMessage.warning('请先连接设备')
      return
    }
    appStore.setLoading(true)
    try {
      await deviceStore.protocol.restoreFactorySettings()
      console.log('[BottomBar] 恢复出厂设置成功')
      ElMessage.success('已恢复出厂设置')
    } catch (error: any) {
      console.error('[BottomBar] 恢复出厂设置失败:', error)
      ElMessage.error('恢复出厂设置失败: ' + error.message)
    } finally {
      appStore.setLoading(false)
    }
  } catch {
    // User cancelled
  }
}

async function handleRestoreFactory() {
  try {
    await ElMessageBox.confirm('确定要复位MCU按键设置吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    if (!deviceStore.isConnected || !deviceStore.protocol) {
      ElMessage.warning('请先连接设备')
      return
    }
    appStore.setLoading(true)
    try {
      const data = await deviceStore.protocol.resetKeyMappings(ProfileLayer.DEFAULT)
      console.log('[BottomBar] 复位成功, 返回数据:', Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' '))
      ElMessage.success('MCU已复位')
    } catch (error: any) {
      console.error('[BottomBar] 复位失败:', error)
      ElMessage.error('复位失败: ' + error.message)
    } finally {
      appStore.setLoading(false)
    }
  } catch {
    // User cancelled
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 24px;
  background: $bg-panel;
  border-top: 2px solid $accent-blue;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, $accent-blue, transparent);
    box-shadow: 0 0 10px $accent-blue;
  }
}

.profile-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
}

.profile-tab {
  padding: 9px 18px;
  background: #181C29;
  border: 1px solid rgba(0,229,255,0.3);
  border-radius: 6px;
  cursor: pointer;
  color: #8A98B3;
  transition: 0.3s;
  font-size: 14px;

  &.active {
    background: #00E5FF;
    color: #000;
    box-shadow: 0 0 8px #00E5FF66;
  }

  &:hover:not(.active) {
    border-color: #00E5FF;
    color: #E6EDF7;
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.right-btn-reset {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: #181C29;
  border: 1px solid #00E5FF;
  color: #00E5FF;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: 0.3s;

  &:hover {
    background: #00E5FF;
    color: #0C0E16;
    box-shadow: 0 0 8px #00E5FF66;
  }
}

.right-btn-factory {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: #FF3355;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: 0.3s;

  &:hover {
    box-shadow: 0 0 8px #FF335566;
  }
}
</style>
