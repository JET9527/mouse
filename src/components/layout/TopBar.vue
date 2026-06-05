<template>
  <div class="top-bar">
    <!-- Logo area -->
    <div class="logo-section">
      <svg class="logo-icon" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#00ff88;stop-opacity:1" />
          </linearGradient>
        </defs>
        <path d="M20 4L36 12V28L20 36L4 28V12Z" fill="none" stroke="url(#logoGrad)" stroke-width="2"/>
        <path d="M20 10L30 16V24L20 30L10 24V16Z" fill="url(#logoGrad)" opacity="0.3"/>
        <circle cx="20" cy="20" r="4" fill="url(#logoGrad)"/>
      </svg>
      <span class="logo-text">MOUSE CONFIG</span>
    </div>

    <!-- Navigation tabs -->
    <div class="nav-tabs">
      <button
        v-for="tab in navTabs"
        :key="tab.key"
        class="nav-tab"
        :class="{ active: appStore.currentTab === tab.key }"
        @click="handleTabClick(tab)"
      >
        {{ tab.label }}
      </button>
    </div>

    <ConnectionStatus />

    <!-- Language switch -->
    <div class="lang-switch">
      <span class="lang-text">{{ appStore.language === 'zh-CN' ? '中文' : 'EN' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NAV_TABS } from '@/utils/constants'
import { useAppStore } from '@/stores/modules/app'
import { useRouter } from 'vue-router'
import ConnectionStatus from '../common/ConnectionStatus.vue'

const appStore = useAppStore()
const router = useRouter()
const navTabs = NAV_TABS

function handleTabClick(tab: typeof NAV_TABS[0]) {
  appStore.setTab(tab.key)
  router.push(tab.path)
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: transparent;
  margin-top: 20px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 32px;
  height: 32px;
}

.logo-text {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
  background: linear-gradient(90deg, $accent-blue, $accent-cyan);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-tabs {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  justify-content: center;
}

.nav-tab {
  padding: 12px 26px;
  background: #181C29;
  border: 1px solid rgba(0,229,255,0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  color: #8A98B3;
  font-size: 14px;

  &:hover:not(.active) {
    border-color: #00E5FF;
    color: #E6EDF7;
  }

  &.active {
    background: linear-gradient(90deg,#007899,#00C9E6);
    color: #fff;
    box-shadow: 0 0 12px rgba(0,229,255,0.4);
    border-color: #00E5FF;
  }
}

.lang-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  margin-left: 14px;
  background: #181C29;
  border: 1px solid rgba(0,229,255,0.3);
  border-radius: 4px;
  color: #E6EDF7;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #00E5FF;
  }
}
</style>
