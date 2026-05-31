import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { KeyMapping, KeyTarget, KeyType } from '@/types/keyMapping'
import { ProfileLayer } from '@/types/keyMapping'

type ProfileKey = 'default' | 'office' | 'game1' | 'game2'

interface ProfileState {
  name: string
  mappings: Record<number, KeyMapping>
  isModified: boolean
}

export const useKeyMappingStore = defineStore('keyMapping', () => {
  const currentProfile = ref<ProfileKey>('default')

  const profiles = reactive<Record<ProfileKey, ProfileState>>({
    default: {
      name: '默认层',
      mappings: initDefaultMappings('default'),
      isModified: false,
    },
    office: {
      name: '办公模式',
      mappings: initDefaultMappings('office'),
      isModified: false,
    },
    game1: {
      name: '游戏模式1',
      mappings: initDefaultMappings('game1'),
      isModified: false,
    },
    game2: {
      name: '游戏模式2',
      mappings: initDefaultMappings('game2'),
      isModified: false,
    },
  })

  function initDefaultMappings(layer: string): Record<number, KeyMapping> {
    const mappings: Record<number, KeyMapping> = {}
    const defaultLabels: Record<number, string> = {
      1: '左键',
      2: '右键',
      3: '中键',
      4: '前进',
      5: '后退',
      6: 'DPI+',
      7: 'DPI-',
      8: '老按键',
      9: '火力键',
    }
    for (let i = 1; i <= 9; i++) {
      mappings[i] = {
        buttonId: i,
        type: 'basic' as KeyType,
        target: {
          keyCode: i,
          label: defaultLabels[i] || `按键${i}`,
        } as KeyTarget,
        layer: layer as any,
        enabled: true,
      }
    }
    return mappings
  }

  function setProfile(profile: ProfileKey) {
    currentProfile.value = profile
  }

  function updateMapping(buttonId: number, newMapping: Partial<KeyMapping>) {
    const profile = profiles[currentProfile.value]
    const existing = profile.mappings[buttonId]
    if (existing) {
      profile.mappings[buttonId] = { ...existing, ...newMapping }
      profile.isModified = true
    }
  }

  function markAsSaved() {
    profiles[currentProfile.value].isModified = false
  }

  function resetProfile() {
    const layer = currentProfile.value
    profiles[layer].mappings = initDefaultMappings(layer)
    profiles[layer].isModified = false
  }

  return {
    currentProfile,
    profiles,
    setProfile,
    updateMapping,
    markAsSaved,
    resetProfile,
  }
})
