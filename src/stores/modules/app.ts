import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ProfileLayer } from '@/types/keyMapping'

export const useAppStore = defineStore('app', () => {
  const currentTab = ref('mapping')
  const currentProfile = ref<ProfileLayer>(ProfileLayer.DEFAULT)
  const sidebarCollapsed = ref(false)
  const language = ref('zh-CN')
  const webhidSupported = ref(true)
  const isLoading = ref(false)
  const factoryResetVersion = ref(0)

  function triggerFactoryReset() {
    factoryResetVersion.value++
  }

  function setTab(tab: string) {
    currentTab.value = tab
  }

  function setProfile(profile: ProfileLayer) {
    currentProfile.value = profile
  }

  function setWebHIDSupported(supported: boolean) {
    webhidSupported.value = supported
  }

  function setLoading(val: boolean) {
    isLoading.value = val
  }

  return {
    currentTab,
    currentProfile,
    sidebarCollapsed,
    language,
    webhidSupported,
    isLoading,
    factoryResetVersion,
    setTab,
    setProfile,
    triggerFactoryReset,
    setWebHIDSupported,
    setLoading,
  }
})
