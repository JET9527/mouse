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
  height: 56px;
  padding: 0 24px;
  background: $bg-panel;
  border-bottom: 2px solid $accent-blue;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, $accent-blue, transparent);
    box-shadow: 0 0 10px $accent-blue;
  }
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
}

.logo-icon {
  width: 36px;
  height: 36px;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 2px;
  background: linear-gradient(90deg, $accent-blue, $accent-cyan);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.nav-tab {
  padding: 0 24px;
  height: 40px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  color: $text-secondary;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    color: $text-primary;
    background: rgba(0, 212, 255, 0.05);
  }

  &.active {
    color: $accent-blue;
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 20%;
      right: 20%;
      height: 2px;
      background: $accent-blue;
      box-shadow: 0 0 8px $accent-blue;
    }
  }
}

.lang-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 32px;
  background: rgba(15, 52, 96, 0.5);
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  color: $text-secondary;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: $accent-blue;
    color: $accent-blue;
  }
}
</style>
