<template>
  <div class="app-layout" v-loading="appStore.isLoading" element-loading-text="请稍候..." element-loading-background="rgba(0, 0, 0, 0.7)">
    <top-light></top-light>
    <TopBar />
    <div class="main-content">
      <router-view />
    </div>
    <BottomBar />
    <BrowserWarning v-if="!appStore.webhidSupported" />
  </div>
</template>

<script setup lang="ts">
import TopBar from './TopBar.vue'
import BottomBar from './BottomBar.vue'
import BrowserWarning from '../common/BrowserWarning.vue'
import { useAppStore } from '@/stores/modules/app'
import { getBrowserInfo } from '@/utils/helpers'
import { NAV_TABS } from '@/utils/constants'
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const appStore = useAppStore()
const route = useRoute()

onMounted(() => {
  const browser = getBrowserInfo()
  appStore.setWebHIDSupported(browser.supported)
})

// 路由变化时同步 TopBar 的 active tab 状态
watch(() => route.path, (path) => {
  const tab = NAV_TABS.find(t => t.path === path)
  if (tab) {
    appStore.setTab(tab.key)
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.connection-bar {
  display: flex;
  justify-content: flex-end;
  padding: 8px 24px 0;
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
}
</style>
