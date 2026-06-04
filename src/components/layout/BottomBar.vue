<template>
  <div class="bottom-bar">
    <!-- Profile tabs -->
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
      <button class="gaming-btn btn-sm" @click="handleReset">
        <el-icon><Refresh /></el-icon>
        重置
      </button>
      <button class="gaming-btn btn-sm btn-danger" @click="handleRestoreFactory">
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
      // 持久化 profile 状态
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
  gap: 4px;
}

.profile-tab {
  padding: 0 20px;
  height: 32px;
  background: rgba(15, 52, 96, 0.5);
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  color: $text-secondary;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: $accent-blue;
    color: $text-primary;
  }

  &.active {
    background: linear-gradient(180deg, rgba(0,212,255,0.2) 0%, rgba(0,212,255,0.1) 100%);
    border-color: $accent-blue;
    color: $accent-blue;
    box-shadow: $glow-blue;
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;

  .gaming-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}
</style>
