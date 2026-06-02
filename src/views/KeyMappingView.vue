<template>
  <div class="key-mapping-view">
    <!-- Toolbar -->
    <div class="mapping-toolbar">
      <span class="toolbar-title">按键定义</span>
      <button class="gaming-btn btn-reset" @click="handleResetMappings" :disabled="!deviceStore.isConnected">
        复位按键定义
      </button>
    </div>

    <div class="mapping-container">
      <!-- Left button list -->
      <ButtonList
        side="left"
        :mappings="currentMappings"
        @select="handleButtonSelect"
      />

      <!-- Mouse visual -->
      <div class="mouse-area">
        <MouseVisual />
      </div>

      <!-- Right button list -->
      <ButtonList
        side="right"
        :mappings="currentMappings"
        @select="handleButtonSelect"
      />
    </div>

    <!-- Key selector dialog -->
    <KeySelector
      v-model="selectorVisible"
      :current-button="selectedButton"
      @confirm="handleKeyConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ButtonList from '@/components/mapping/ButtonList.vue'
import MouseVisual from '@/components/mapping/MouseVisual.vue'
import KeySelector from '@/components/mapping/KeySelector.vue'
import { useKeyMappingStore } from '@/stores/modules/keyMapping'
import { useDeviceStore } from '@/stores/modules/device'
import { ProfileLayer, KeyType } from '@/types/keyMapping'
import type { MouseButton } from '@/types/keyMapping'
import { MOUSE_BUTTONS } from '@/utils/constants'

const keyMappingStore = useKeyMappingStore()
const deviceStore = useDeviceStore()

const selectorVisible = ref(false)
const selectedButton = ref<MouseButton | null>(null)
const hasFetchedMappings = ref(false)

const currentProfile = computed(() => keyMappingStore.currentProfile)
const currentMappings = computed(() => keyMappingStore.profiles[currentProfile.value].mappings)

// 将协议中的 ProfileLayer 映射到 store 的 ProfileKey
type ProfileKey = 'default' | 'office' | 'game1' | 'game2'
const profileLayerToKey: Record<ProfileLayer, ProfileKey> = {
  [ProfileLayer.DEFAULT]: 'default',
  [ProfileLayer.OFFICE]: 'office',
  [ProfileLayer.GAME1]: 'game1',
  [ProfileLayer.GAME2]: 'game2',
}

const defaultButtonLabels: Record<number, string> = {
  1: '左键',
  2: '右键',
  3: '中键',
  4: '后退键',
  5: '前进键',
  6: 'DPI键',
}

// 连接后自动获取任意模式的按键定义
watch(() => deviceStore.isConnected && deviceStore.protocol, async (ready) => {
  if (!ready || hasFetchedMappings.value) return
  hasFetchedMappings.value = true

  console.log('[KeyMappingView] 设备已连接，获取按键定义...')
  try {
    // 先获取当前 Profile ID
    const profileId = await deviceStore.protocol!.getProfileId()
    console.log('[KeyMappingView] 当前Profile ID:', profileId)

    // 获取 DEFAULT 模式的按键定义
    const mappingData = await deviceStore.protocol!.getKeyMappings(ProfileLayer.DEFAULT)
    console.log('[KeyMappingView] 按键定义原始数据:', 
      Array.from(mappingData).map(b => b.toString(16).padStart(2, '0')).join(' ')
    )

    // 解析按键定义数据
    // 协议格式：data[18] = {类型, 键值} × 9，每按键2字节
    // 设备实际只有6个按键，只解析前6个
    const bytesPerButton = 2
    const mappings: Record<number, import('@/types/keyMapping').KeyMapping> = {}
    for (let i = 0; i < 6; i++) {
      const offset = i * bytesPerButton
      const buttonId = i + 1

      if (offset + bytesPerButton <= mappingData.length) {
        const type = mappingData[offset]
        const keyCode = mappingData[offset + 1]

        mappings[buttonId] = {
          buttonId,
          type: type as KeyType,
          target: {
            keyCode,
            label: getKeyLabel(keyCode, type) || defaultButtonLabels[buttonId],
          },
          layer: ProfileLayer.DEFAULT,
          enabled: true,
        }
      }
    }

    if (Object.keys(mappings).length > 0) {
      keyMappingStore.setMappings('default', mappings)
      
      // 打印解析后的按键定义
      const typeLabels: Record<number, string> = {
        0x00: '无定义',
        0x01: '按键',
        0x02: '宏录制',
        0x03: '鼠标功能',
        0x04: '组合快捷键',
      }
      console.log('[KeyMappingView] 按键定义解析结果:')
      for (let i = 0; i < 6; i++) {
        const bid = i + 1
        const m = mappings[bid]
        const typeName = typeLabels[m.type as number] || `0x${(m.type as number).toString(16).padStart(2, '0')}`
        console.log(`  按键${bid}(${defaultButtonLabels[bid]}): 类型=${typeName}, 键值=0x${(m.target as any).keyCode.toString(16).padStart(2, '0')} → ${(m.target as any).label || ''}`)
      }
    }
  } catch (error) {
    console.warn('[KeyMappingView] 获取按键定义失败:', error)
  }
}, { immediate: true })

// 获取按键标签（简易实现，后续可完善）
function getKeyLabel(keyCode: number, type?: number): string {
  if (keyCode >= 1 && keyCode <= 9) {
    return defaultButtonLabels[keyCode]
  }
  // 鼠标功能键
  const mouseFuncLabels: Record<number, string> = {
    0xF4: '左键',
    0xF5: '右键',
    0xF6: '中键',
    0xF7: '后退',
    0xF8: '前进',
    0xF9: '滚轮上',
    0xFA: '滚轮下',
    0xD0: 'DPI切换',
    0xD1: '回报率',
    0xD2: '火力键',
    0xD3: '蓝牙配对',
    0xD4: '2.4G配对',
    0xD5: '模式切换',
    0xD6: '老板键',
  }
  if (mouseFuncLabels[keyCode]) return mouseFuncLabels[keyCode]
  // 键盘按键
  if (keyCode >= 0x04 && keyCode <= 0x65) {
    const keyLabels: Record<number, string> = {
      0x04: 'A', 0x05: 'B', 0x06: 'C', 0x07: 'D', 0x08: 'E',
      0x09: 'F', 0x0A: 'G', 0x0B: 'H', 0x0C: 'I', 0x0D: 'J',
      0x0E: 'K', 0x0F: 'L', 0x10: 'M', 0x11: 'N', 0x12: 'O',
      0x13: 'P', 0x14: 'Q', 0x15: 'R', 0x16: 'S', 0x17: 'T',
      0x18: 'U', 0x19: 'V', 0x1A: 'W', 0x1B: 'X', 0x1C: 'Y',
      0x1D: 'Z', 0x1E: '1', 0x1F: '2', 0x20: '3', 0x21: '4',
      0x22: '5', 0x23: '6', 0x24: '7', 0x25: '8', 0x26: '9',
      0x27: '0', 0x28: 'Enter', 0x29: 'Esc', 0x2A: '退格',
      0x2B: 'Tab', 0x2C: '空格', 0x2D: '-', 0x2E: '=',
      0x2F: '[', 0x30: ']', 0x31: '\\', 0x33: ';',
      0x34: "'", 0x35: '`', 0x36: ',', 0x37: '.', 0x38: '/',
      0x39: 'Caps', 0x3A: 'F1', 0x3B: 'F2', 0x3C: 'F3',
      0x3D: 'F4', 0x3E: 'F5', 0x3F: 'F6', 0x40: 'F7',
      0x41: 'F8', 0x42: 'F9', 0x43: 'F10', 0x44: 'F11',
      0x45: 'F12', 0x46: 'PrtSc', 0x47: 'ScrLk', 0x48: 'Pause',
      0x49: 'Ins', 0x4A: 'Home', 0x4B: 'PgUp', 0x4C: 'Del',
      0x4D: 'End', 0x4E: 'PgDn', 0x4F: '→', 0x50: '←',
      0x51: '↓', 0x52: '↑',
    }
    if (keyLabels[keyCode]) return keyLabels[keyCode]
  }
  return `0x${keyCode.toString(16).padStart(2, '0')}`
}

function handleButtonSelect(buttonId: number) {
  const button = MOUSE_BUTTONS.find((b) => b.id === buttonId)
  if (button) {
    selectedButton.value = button
    selectorVisible.value = true
  }
}

function handleKeyConfirm(key: any) {
  if (selectedButton.value) {
    // 1. 更新本地 store
    keyMappingStore.updateMapping(selectedButton.value.id, {
      type: key.type,
      target: {
        keyCode: key.code,
        label: key.label,
      },
    })

    // 2. 发送到设备（构建完整18字节数据块）
    if (deviceStore.isConnected && deviceStore.protocol) {
      const profileKey = currentProfile.value
      const profileLayer = profileKeyToLayer[profileKey]
      const dataBlock = buildMappingDataBlock(keyMappingStore.profiles[profileKey].mappings)

      deviceStore.protocol.saveKeyMappings(profileLayer, dataBlock).then(() => {
        console.log(`[KeyMapping] ${profileKey} 按键定义保存成功`)
      }).catch((e) => {
        console.error('[KeyMapping] 保存按键定义失败:', e)
      })
    }
  }
}

// ProfileKey → ProfileLayer 映射
const profileKeyToLayer: Record<string, ProfileLayer> = {
  default: ProfileLayer.DEFAULT,
  office: ProfileLayer.OFFICE,
  game1: ProfileLayer.GAME1,
  game2: ProfileLayer.GAME2,
}

// 复位当前Profile的按键定义
async function handleResetMappings() {
  if (!deviceStore.isConnected || !deviceStore.protocol) {
    ElMessage.warning('请先连接设备')
    return
  }

  const profileKey = currentProfile.value
  const profileLayer = profileKeyToLayer[profileKey]
  const profileName = keyMappingStore.profiles[profileKey].name

  try {
    await ElMessageBox.confirm(
      `确定要复位「${profileName}」的按键定义吗？`,
      '复位确认',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    )

    const data = await deviceStore.protocol.resetKeyMappings(profileLayer)
    // 协议复位响应 MSG_ID=0x31，返回 data[18] 为复位后的默认按键定义
    console.log(`[KeyMapping] ${profileKey} 复位成功，返回数据:`, 
      Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' ')
    )
    
    // 解析复位后的数据并更新 store
    const mappings: Record<number, import('@/types/keyMapping').KeyMapping> = {}
    for (let i = 0; i < 6; i++) {
      const buttonId = i + 1
      const type = data[i * 2]
      const keyCode = data[i * 2 + 1]
      mappings[buttonId] = {
        buttonId,
        type: type as KeyType,
        target: { keyCode, label: getKeyLabel(keyCode, type) || defaultButtonLabels[buttonId] } as any,
        layer: profileLayer as any,
        enabled: true,
      }
    }
    keyMappingStore.setMappings(profileKey, mappings)

    ElMessageBox.alert(
      `「${profileName}」按键定义已复位成功`,
      '复位成功',
      { type: 'success', confirmButtonText: '确定' }
    )
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('复位失败: ' + (e.message || e))
    }
  }
}

// 从store的mappings构建18字节协议数据块：{type, keyCode} × 9
// 设备只有6个按键，7~9填0x00占位
function buildMappingDataBlock(mappings: Record<number, import('@/types/keyMapping').KeyMapping>): Uint8Array {
  const data = new Uint8Array(18)
  for (let i = 0; i < 9; i++) {
    const buttonId = i + 1
    const mapping = mappings[buttonId]
    if (mapping) {
      data[i * 2] = mapping.type as number
      data[i * 2 + 1] = (mapping.target as any).keyCode ?? 0
    } else {
      data[i * 2] = 0x00
      data[i * 2 + 1] = 0x00
    }
  }
  return data
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.key-mapping-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.mapping-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 900px;
  margin-bottom: 20px;
  padding: 0 4px;

  .toolbar-title {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
  }

  .btn-reset {
    font-size: 12px;
    padding: 6px 14px;
    background: rgba(255, 77, 77, 0.15);
    border: 1px solid rgba(255, 77, 77, 0.4);
    color: $text-primary;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: rgba(255, 77, 77, 0.3);
      border-color: rgba(255, 77, 77, 0.7);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

.mapping-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  width: 100%;
  max-width: 900px;
}

.mouse-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
