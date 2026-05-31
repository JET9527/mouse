import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Macro, MacroEvent, MacroEventType } from '@/types/macro'
import { generateUUID } from '@/utils/helpers'

export const useMacroStore = defineStore('macro', () => {
  const macros = ref<Macro[]>([])
  const isRecording = ref(false)
  const currentRecordingEvents = ref<MacroEvent[]>([])
  const activeMacroId = ref<string | null>(null)
  let recordingStartTime = 0

  function startRecording() {
    isRecording.value = true
    currentRecordingEvents.value = []
    recordingStartTime = Date.now()
  }

  function stopRecording() {
    isRecording.value = false
    if (currentRecordingEvents.value.length > 0) {
      const macro: Macro = {
        id: generateUUID(),
        name: `宏 ${macros.value.length + 1}`,
        events: [...currentRecordingEvents.value],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      macros.value.push(macro)
      currentRecordingEvents.value = []
    }
  }

  function addRecordingEvent(event: Omit<MacroEvent, 'id'>) {
    if (!isRecording.value) return
    currentRecordingEvents.value.push({
      ...event,
      id: generateUUID(),
    } as MacroEvent)
  }

  function clearRecordingEvents() {
    currentRecordingEvents.value = []
  }

  function saveMacro(macro: Macro) {
    const existingIndex = macros.value.findIndex((m) => m.id === macro.id)
    if (existingIndex >= 0) {
      macros.value[existingIndex] = macro
    } else {
      macros.value.push(macro)
    }
  }

  function deleteMacro(id: string) {
    macros.value = macros.value.filter((m) => m.id !== id)
  }

  function updateMacro(id: string, updates: Partial<Macro>) {
    const macro = macros.value.find((m) => m.id === id)
    if (macro) {
      Object.assign(macro, updates, { updatedAt: Date.now() })
    }
  }

  return {
    macros,
    isRecording,
    currentRecordingEvents,
    activeMacroId,
    startRecording,
    stopRecording,
    addRecordingEvent,
    clearRecordingEvents,
    saveMacro,
    deleteMacro,
    updateMacro,
  }
})
