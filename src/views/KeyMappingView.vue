<template>
  <div class="key-mapping-view">
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
import { computed, ref } from 'vue'
import ButtonList from '@/components/mapping/ButtonList.vue'
import MouseVisual from '@/components/mapping/MouseVisual.vue'
import KeySelector from '@/components/mapping/KeySelector.vue'
import { useKeyMappingStore } from '@/stores/modules/keyMapping'
import { useDeviceStore } from '@/stores/modules/device'
import { useWebHID } from '@/composables/useWebHID'
import { HIDProtocol } from '@/services/hidProtocol'
import type { MouseButton } from '@/types/keyMapping'
import type { KeyOption } from '@/components/mapping/KeySelector.vue'
import { MOUSE_BUTTONS } from '@/utils/constants'

const keyMappingStore = useKeyMappingStore()
const deviceStore = useDeviceStore()
const { sendReport } = useWebHID()
const protocol = new HIDProtocol(sendReport)

const selectorVisible = ref(false)
const selectedButton = ref<MouseButton | null>(null)

const currentProfile = computed(() => keyMappingStore.currentProfile)
const currentMappings = computed(() => keyMappingStore.profiles[currentProfile.value].mappings)

function handleButtonSelect(buttonId: number) {
  const button = MOUSE_BUTTONS.find((b) => b.id === buttonId)
  if (button) {
    selectedButton.value = button
    selectorVisible.value = true
  }
}

function handleKeyConfirm(key: any) {
  if (selectedButton.value) {
    keyMappingStore.updateMapping(selectedButton.value.id, {
      type: key.type,
      target: {
        keyCode: key.code,
        label: key.label,
      },
    })

    // Send to device if connected
    if (deviceStore.isConnected) {
      protocol.setKeyMapping(selectedButton.value.id, 0, key.code).catch((e) => {
        console.error('发送按键映射失败:', e)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.key-mapping-view {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
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
