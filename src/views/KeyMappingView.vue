<template>
  <div class="key-mapping-view">
    <!--主体三栏-->
    <div class="main-container">
      <!--左侧按键-->
      <div class="col-left">
        <div class="key-card">
          <ButtonList
            side="left"
            :mappings="currentMappings"
            @select="handleButtonSelect"
          />
        </div>
      </div>

      <!--中间鼠标预览-->
      <div class="col-center">
        <div class="mouse-box">
          <MouseVisual @select="handleButtonSelect" />
        </div>
        <button class="reset-all" @click="handleResetMappings">{{ $t('mapping.resetAll') }}</button>
      </div>

      <!--右侧按键-->
      <div class="col-right">
        <div class="key-card">
          <ButtonList
            side="right"
            :mappings="currentMappings"
            @select="handleButtonSelect"
          />
        </div>
      </div>
    </div>



    <!-- Key selector dialog -->
    <KeySelector
      v-model="selectorVisible"
      :current-button="selectedButton"
      :combo-init-data="comboExistingData"
      @confirm="handleKeyConfirm"
      @tab-change="handleComboTabChange"
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
import { useAppStore } from '@/stores/modules/app'
import { ProfileLayer, KeyType } from '@/types/keyMapping'
import type { MouseButton } from '@/types/keyMapping'
import { MOUSE_BUTTONS, PROFILE_LAYERS } from '@/utils/constants'
import { useI18n } from 'vue-i18n'

const keyMappingStore = useKeyMappingStore()
const deviceStore = useDeviceStore()
const appStore = useAppStore()
const { t } = useI18n()

const selectorVisible = ref(false)
const selectedButton = ref<MouseButton | null>(null)
const hasFetchedMappings = ref(false)

// 组合键已有数据（从设备读取后回填到 KeySelector）
const comboExistingData = ref<{
  modifiers: number[]
  nonModifierKey: { code: number; label: string } | null
} | null>(null)

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

const defaultButtonLabels = computed<Record<number, string>>(() => ({
  1: t('mapping.leftButton'),
  2: t('mapping.rightButton'),
  3: t('mapping.middleButton'),
  4: t('mapping.backButton'),
  5: t('mapping.forwardButton'),
  6: t('mapping.dpiButton'),
}))

// 连接后自动获取任意模式的按键定义
watch(() => deviceStore.isConnected && deviceStore.protocol, async (ready) => {
  if (!ready) {
    // 设备断开时重置标记，重新连接后重新获取
    hasFetchedMappings.value = false
    return
  }
  if (hasFetchedMappings.value) return
  hasFetchedMappings.value = true

  await fetchAndSetMappings()
}, { immediate: true })

// 恢复出厂设置后重新获取按键定义
watch(() => appStore.factoryResetVersion, async () => {
  if (!deviceStore.isConnected || !deviceStore.protocol) return
  console.log('[KeyMappingView] 恢复出厂后重新获取按键定义...')
  await fetchAndSetMappings()
})

// 提取为共享函数：获取并解析按键定义数据
async function fetchAndSetMappings() {
  if (!deviceStore.isConnected || !deviceStore.protocol) return
  const currentLayer = appStore.currentProfile
  const profileKey = profileLayerToKey[currentLayer]
  console.log(`[KeyMappingView] 获取按键定义(profileLayer=0x${currentLayer.toString(16)}, profileKey=${profileKey})...`)
  try {
    const mappingData = await deviceStore.protocol!.getKeyMappings(currentLayer)
    console.log('[KeyMappingView] 按键定义原始数据:', 
      Array.from(mappingData).map(b => b.toString(16).padStart(2, '0')).join(' ')
    )
    const bytesPerButton = 2
    const mappings: Record<number, import("@/types/keyMapping").KeyMapping> = {}
    for (let i = 0; i < 6; i++) {
      const offset = i * bytesPerButton
      const buttonId = i + 1
      if (offset + bytesPerButton <= mappingData.length) {
        const type = mappingData[offset]
        const keyCode = mappingData[offset + 1]
        mappings[buttonId] = {
          buttonId,
          type: type as KeyType,
          target: { keyCode, label: getKeyLabel(keyCode, type) || defaultButtonLabels.value[buttonId] },
          layer: currentLayer,
          enabled: true,
        }
      }
    }
    if (Object.keys(mappings).length > 0) {
      keyMappingStore.setMappings(profileKey, mappings)
      const comboButtonIds = Object.entries(mappings)
        .filter(([_, m]) => m.type === KeyType.COMBO)
        .map(([id]) => Number(id))
      for (const bid of comboButtonIds) {
        try {
          const keyIndex = bid - 1
          const shortcutData = await deviceStore.protocol!.getShortcutKey(currentLayer, keyIndex)
          const comboLabel = parseShortcutData(shortcutData)
          if (comboLabel) {
            keyMappingStore.updateMapping(bid, { target: { keyCode: 0, label: comboLabel } as any })
            keyMappingStore.markAsSaved()
          }
        } catch (e) {
          console.warn(`[KeyMappingView] 获取按键${bid}快捷键失败:`, e)
        }
      }
    }
  } catch (error) {
    console.warn('[KeyMappingView] 获取按键定义失败:', error)
  }
}

// Profile切换时重新获取按键定义
watch(() => appStore.currentProfile, async () => {
  if (!deviceStore.isConnected || !deviceStore.protocol) return
  console.log('[KeyMappingView] Profile切换，重新获取按键定义...')
  await fetchAndSetMappings()
})

// 获取按键标签（简易实现，后续可完善）
function getKeyLabel(keyCode: number, type?: number): string {
  // 宏录制：键值为宏ID 0~14（UI显示M0~M14）
  if (type === KeyType.MACRO) {
    return `M${keyCode}`
  }
  if (type !== KeyType.KEY && keyCode >= 1 && keyCode <= 9) {
    return defaultButtonLabels.value[keyCode]
  }
  // 鼠标功能键
  const mouseFuncLabels: Record<number, string> = {
    0xF4: t('mapping.mouseLeft'),
    0xF5: t('mapping.mouseRight'),
    0xF6: t('mapping.mouseMiddle'),
    0xF7: t('mapping.mouseBack'),
    0xF8: t('mapping.mouseForward'),
    0xF9: t('mapping.wheelUp'),
    0xFA: t('mapping.wheelDown'),
    0xD0: t('mapping.dpiSwitch'),
    0xD1: t('mapping.pollingRate'),
    0xD2: t('mapping.fireKey'),
    0xD3: t('mapping.btPair'),
    0xD4: t('mapping.wireless24Pair'),
    0xD5: t('mapping.modeSwitch'),
    0xD6: t('mapping.bossKey'),
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

// 组合快捷键 HID 键码 → 标签
const hidKeyLabel: Record<number, string> = {
  0x04: 'A', 0x05: 'B', 0x06: 'C', 0x07: 'D', 0x08: 'E',
  0x09: 'F', 0x0A: 'G', 0x0B: 'H', 0x0C: 'I', 0x0D: 'J',
  0x0E: 'K', 0x0F: 'L', 0x10: 'M', 0x11: 'N', 0x12: 'O',
  0x13: 'P', 0x14: 'Q', 0x15: 'R', 0x16: 'S', 0x17: 'T',
  0x18: 'U', 0x19: 'V', 0x1A: 'W', 0x1B: 'X', 0x1C: 'Y',
  0x1D: 'Z', 0x1E: '1', 0x1F: '2', 0x20: '3', 0x21: '4',
  0x22: '5', 0x23: '6', 0x24: '7', 0x25: '8', 0x26: '9',
  0x27: '0',
}
const modifierLabel = computed<Record<number, string>>(() => ({
  0xE0: t('keySelector.modCtrl'), 0xE1: t('keySelector.modShift'), 0xE2: t('keySelector.modAlt'), 0xE3: t('keySelector.modWin'),
}))

// 解析组合快捷键数据，用于显示标签
// 6字节格式：{count, key1, key2, key3, key4, key5}
function parseShortcutData(data: Uint8Array): string {
  if (!data || data.length < 1) return ''
  const count = data[0]
  if (count === 0) return ''
  const keys: string[] = []
  for (let i = 0; i < count && i < 5; i++) {
    const code = data[1 + i]
    if (code === 0) break
    const mod = modifierLabel.value[code]
    if (mod) {
      keys.push(mod)
    } else {
      keys.push(hidKeyLabel[code] || `0x${code.toString(16).padStart(2, '0')}`)
    }
  }
  return keys.join('+') || ''
}

function handleButtonSelect(buttonId: number) {
  const button = MOUSE_BUTTONS.find((b) => b.id === buttonId)
  if (button) {
    selectedButton.value = button
    selectorVisible.value = true
  }
}

// 切换 Profile 模式
function handleProfileSwitch(layer: import('@/types/keyMapping').ProfileLayer) {
  const key = profileLayerToKey[layer]
  if (key) {
    keyMappingStore.setProfile(key)
  }
}

// 切换到组合键tab时获取设备组合快捷键数据
function handleComboTabChange() {
  if (!deviceStore.isConnected || !deviceStore.protocol || !selectedButton.value) {
    console.warn('[KeyMappingView] 设备未连接或无选中按键，跳过获取组合键')
    return
  }
  // 清空上一次的已有数据，避免弹窗残留
  comboExistingData.value = null

  const btn = selectedButton.value
  const profileKey = currentProfile.value
  const profileLayer = profileKeyToLayer[profileKey]
  const keyIndex = btn.id - 1
  console.log(`[KeyMappingView] 切换到组合键tab，获取按键${btn.id}(${btn.label})的组合快捷键...`)
  deviceStore.protocol.getShortcutKey(profileLayer, keyIndex).then((shortcutData) => {
    console.log(`[KeyMappingView] 按键${btn.id} 快捷键数据:`, 
      Array.from(shortcutData).map(b => b.toString(16).padStart(2, '0')).join(' ')
    )
    const parsed = parseComboShortcutData(shortcutData)
    console.log(`[KeyMappingView] 解析结果:`, JSON.stringify(parsed))
    comboExistingData.value = parsed
  }).catch((e) => {
    console.warn(`[KeyMappingView] 获取按键${btn.id}组合快捷键失败:`, e)
    comboExistingData.value = null
  })
}

// 解析 6 字节组合键协议数据为 {modifiers, nonModifierKey}
// 6字节格式：{count, key1, key2, key3, key4, key5}
const MODIFIER_CODES = [0xE0, 0xE1, 0xE2, 0xE3]
function parseComboShortcutData(data: Uint8Array): {
  modifiers: number[]
  nonModifierKey: { code: number; label: string } | null
} {
  if (!data || data.length < 1) return { modifiers: [], nonModifierKey: null }
  const count = data[0]
  const modifiers: number[] = []
  let nonModifierKey: { code: number; label: string } | null = null
  for (let i = 0; i < count && i < 5; i++) {
    const code = data[1 + i]
    if (code === 0x00) break
    if (MODIFIER_CODES.includes(code)) {
      modifiers.push(code)
    } else {
      nonModifierKey = { code, label: hidKeyLabel[code] || getKeyLabel(code, KeyType.KEY) }
    }
  }
  return { modifiers, nonModifierKey }
}

async function handleKeyConfirm(key: any) {
  if (selectedButton.value) {
    const btnId = selectedButton.value.id
    // 1. 更新本地 store
    // 组合快捷键类型：keyCode 填 0x00，实际快捷键数据已通过 saveShortcutKey 保存
    const mappingKeyCode = key.type === KeyType.COMBO ? 0x00 : key.code
    keyMappingStore.updateMapping(btnId, {
      type: key.type,
      target: {
        keyCode: mappingKeyCode,
        label: key.label,
      },
    })

    // 2. 发送到设备
    if (deviceStore.isConnected && deviceStore.protocol) {
      const profileKey = currentProfile.value
      const profileLayer = profileKeyToLayer[profileKey]

      try {
        // 如果是组合快捷键类型，先保存快捷键定义数据
        if (key.type === KeyType.COMBO) {
          const keyIndex = btnId - 1
          // 优先使用新 comboData 字段，兼容旧版 comboShortcutData 映射
          const comboData = key.comboData || comboShortcutData[key.code]
          if (comboData) {
            console.log(`[KeyMapping] 保存组合快捷键 按键${btnId}(${key.label}) data:`, 
              Array.from(comboData as Uint8Array).map(b => b.toString(16).padStart(2, '0')).join(' '))
            await deviceStore.protocol.saveShortcutKey(profileLayer, keyIndex, comboData)
            console.log(`[KeyMapping] 组合快捷键保存成功: ${key.label}`)
          }
        }

        // 等快捷键保存完成后再更新按键定义（完整18字节数据块）
        const dataBlock = buildMappingDataBlock(keyMappingStore.profiles[profileKey].mappings)
        await deviceStore.protocol.saveKeyMappings(profileLayer, dataBlock)
        console.log(`[KeyMapping] ${profileKey} 按键定义保存成功`)
      } catch (e) {
        console.error('[KeyMapping] 保存失败:', e)
      }
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

// 组合快捷键码 → 6字节 {count, key1, key2, key3, key4, key5}
const comboShortcutData: Record<number, Uint8Array> = {
  200: new Uint8Array([0x02, 0xE0, 0x06, 0x00, 0x00, 0x00]), // Ctrl+C
  201: new Uint8Array([0x02, 0xE0, 0x19, 0x00, 0x00, 0x00]), // Ctrl+V
  202: new Uint8Array([0x02, 0xE0, 0x1B, 0x00, 0x00, 0x00]), // Ctrl+X
  203: new Uint8Array([0x02, 0xE0, 0x1D, 0x00, 0x00, 0x00]), // Ctrl+Z
  204: new Uint8Array([0x02, 0xE0, 0x16, 0x00, 0x00, 0x00]), // Ctrl+S
  205: new Uint8Array([0x02, 0xE0, 0x04, 0x00, 0x00, 0x00]), // Ctrl+A
  206: new Uint8Array([0x02, 0xE2, 0x2B, 0x00, 0x00, 0x00]), // Alt+Tab
  207: new Uint8Array([0x02, 0xE3, 0x07, 0x00, 0x00, 0x00]), // Win+D
  208: new Uint8Array([0x02, 0xE3, 0x08, 0x00, 0x00, 0x00]), // Win+E
  209: new Uint8Array([0x02, 0xE3, 0x0F, 0x00, 0x00, 0x00]), // Win+L
  210: new Uint8Array([0x02, 0xE3, 0x1B, 0x00, 0x00, 0x00]), // Win+X
}

// 复位当前Profile的按键定义
async function handleResetMappings() {
  if (!deviceStore.isConnected || !deviceStore.protocol) {
    ElMessage.warning(t('common.connectDevice'))
    return
  }

  const profileKey = currentProfile.value
  const profileLayer = profileKeyToLayer[profileKey]
  const profileName = keyMappingStore.profiles[profileKey].name

  try {
    await ElMessageBox.confirm(
      t('mapping.resetConfirm', { name: profileName }),
      t('mapping.resetConfirmTitle'),
      { type: 'warning', confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel') }
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
        target: { keyCode, label: getKeyLabel(keyCode, type) || defaultButtonLabels.value[buttonId] } as any,
        layer: profileLayer as any,
        enabled: true,
      }
    }
    keyMappingStore.setMappings(profileKey, mappings)

    ElMessageBox.alert(
      t('common.resetSuccess'),
      t('mapping.resetConfirmTitle'),
      { type: 'success', confirmButtonText: t('common.confirm') }
    )
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(t('mapping.resetFailed') + ': ' + (e.message || e))
    }
  }
}

// 从store的mappings构建18字节协议数据块：{type, keyCode} × 9
// 设备只有6个按键，7~9默认鼠标功能(0x03)补0x00
function buildMappingDataBlock(mappings: Record<number, import('@/types/keyMapping').KeyMapping>): Uint8Array {
  const data = new Uint8Array(18)
  for (let i = 0; i < 9; i++) {
    const buttonId = i + 1
    const mapping = mappings[buttonId]
    if (mapping) {
      data[i * 2] = mapping.type as number
      data[i * 2 + 1] = (mapping.target as any).keyCode ?? 0
    } else {
      // 无定义时默认鼠标功能(0x03)，值补0x00
      data[i * 2] = 0x03
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
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow: auto;
}

.main-container {
  display: flex;
  gap: 24px;
  flex: 1;
}

.col-left,
.col-right {
  width: 30%;
}

.col-center {
  width: 40%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.key-card {
  background: #181C29;
  border: 1px solid rgba(0,229,255,0.25);
  border-radius: 8px;
  padding: 6px 18px;
  margin-bottom: 14px;
  transition: 0.3s;

  &:hover {
    background: #22283A;
    box-shadow: 0 0 8px rgba(0,229,255,0.15);
  }
}

.mouse-box {
  width: 320px;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #181C29;
  border: 1px solid rgba(0,229,255,0.3);
  border-radius: 12px;
  box-shadow: 0 0 14px #00E5FF40;
}



.reset-all {
  border: 1px solid #FF3355;
  color: #FF3355;
  background: transparent;
  padding: 9px 22px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.3s;
  font-size: 14px;
  margin-top: 20px;

  &:hover {
    background: #FF3355;
    color: #fff;
    box-shadow: 0 0 8px #FF335566;
  }
}
</style>
      