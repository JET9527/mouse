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
        {{ $t('navTabs.' + tab.key) }}
      </button>
    </div>

    <!-- Right section (connection + language) -->
    <div class="right-section">
      <ConnectionStatus />
      <el-dropdown class="lang-dropdown" @command="handleLangChange">
      <span class="lang-trigger">
        {{ $t('topbar.' + (appStore.language === 'zh-CN' ? 'chinese' : 'english')) }}
        <el-icon class="lang-arrow"><ArrowDown /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="zh-CN" :disabled="appStore.language === 'zh-CN'">
            <span :class="{ active: appStore.language === 'zh-CN' }">中文</span>
          </el-dropdown-item>
          <el-dropdown-item command="en" :disabled="appStore.language === 'en'">
            <span :class="{ active: appStore.language === 'en' }">English</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NAV_TABS } from '@/utils/constants'
import { useAppStore } from '@/stores/modules/app'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowDown } from '@element-plus/icons-vue'
import ConnectionStatus from '../common/ConnectionStatus.vue'

const appStore = useAppStore()
const router = useRouter()
const { locale } = useI18n()
const navTabs = NAV_TABS

function handleTabClick(tab: typeof NAV_TABS[0]) {
  appStore.setTab(tab.key)
  router.push(tab.path)
}

function handleLangChange(lang: string) {
  locale.value = lang
  appStore.setLanguage(lang)
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
  position: relative;
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
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
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

.right-section {
  display: flex;
  align-items: center;
  gap: 14px;
}

.lang-dropdown {
  cursor: pointer;
}

.lang-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #181C29;
  border: 1px solid rgba(0,229,255,0.3);
  border-radius: 4px;
  color: #E6EDF7;
  font-size: 13px;
  transition: all 0.3s;

  &:hover {
    border-color: #00E5FF;
  }
}

.lang-arrow {
  font-size: 12px;
}
</style>
