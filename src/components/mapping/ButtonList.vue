<template>
  <div class="button-list" :class="side">
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
@import '@/assets/styles/variables.scss';

.button-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 220px;

  &.left {
    align-items: flex-start;
  }

  &.right {
    align-items: flex-end;
  }
}
</style>
