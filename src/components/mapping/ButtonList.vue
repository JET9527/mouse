<template>
  <div class="button-list">
    <KeyButton
      v-for="btn in buttons"
      :key="btn.id"
      :button="btn"
      :mapping="mapping(btn.id)"
      @click="$emit('select', btn.id)"
    />
  </div>
</template>

<script setup lang="ts">
import KeyButton from './KeyButton.vue'
import { MOUSE_BUTTONS } from '@/utils/constants'
import type { KeyMapping } from '@/types/keyMapping'

const props = defineProps<{
  side: 'left' | 'right'
  mappings: Record<number, KeyMapping>
}>()

defineEmits<{
  select: [buttonId: number]
}>()

const buttons = MOUSE_BUTTONS.filter((b) => b.side === props.side)

const mapping = (id: number) => props.mappings[id]
</script>

<style lang="scss" scoped>
.button-list {
  display: flex;
  flex-direction: column;
}
</style>
