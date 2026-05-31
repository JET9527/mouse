<template>
  <div class="about-view">
    <div class="about-container">
      <div class="about-card">
        <div class="logo-large">
          <svg viewBox="0 0 60 60" class="logo-svg">
            <defs>
              <linearGradient id="aboutLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#00ff88;stop-opacity:1" />
              </linearGradient>
            </defs>
            <path d="M30 6L54 18V42L30 54L6 42V18Z" fill="none" stroke="url(#aboutLogoGrad)" stroke-width="2"/>
            <circle cx="30" cy="30" r="8" fill="url(#aboutLogoGrad)" opacity="0.3"/>
            <circle cx="30" cy="30" r="4" fill="url(#aboutLogoGrad)"/>
          </svg>
        </div>

        <h1 class="app-name">游戏鼠标配置器</h1>
        <p class="app-desc">基于 WebHID API 的浏览器端鼠标配置工具</p>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">版本</span>
            <span class="info-value">{{ version }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">技术栈</span>
            <span class="info-value">Vue3 + TypeScript + Pinia</span>
          </div>
          <div class="info-item">
            <span class="info-label">浏览器要求</span>
            <span class="info-value">Chrome 89+ / Edge 89+</span>
          </div>
          <div class="info-item">
            <span class="info-label">设备状态</span>
            <span class="info-value" :class="{ connected: deviceStore.isConnected }">
              {{ deviceStore.isConnected ? '已连接' : '未连接' }}
            </span>
          </div>
        </div>

        <div class="feature-list">
          <h3>功能特性</h3>
          <ul>
            <li>9 按键自定义映射，支持 4 层配置切换</li>
            <li>宏录制与回放，支持键盘和鼠标事件</li>
            <li>DPI / 回报率 / 指针速度 / 火力键设置</li>
            <li>RGB 灯光控制（常亮 / 呼吸 / 循环渐变）</li>
            <li>配置文件导入导出（JSON 格式）</li>
          </ul>
        </div>

        <div class="help-section">
          <h3>使用帮助</h3>
          <ol>
            <li>使用 Chrome 或 Edge 浏览器打开本页面</li>
            <li>点击底部"连接设备"按钮选择您的鼠标</li>
            <li>在"基本设置"中配置按键映射</li>
            <li>在"宏设置"中录制宏命令</li>
            <li>在"高级设置"中调整 DPI 和回报率</li>
            <li>在"灯光设置"中自定义 RGB 效果</li>
            <li>点击底部"应用"将配置写入设备</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDeviceStore } from '@/stores/modules/device'

const deviceStore = useDeviceStore()
const version = '1.0.0'
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.about-view {
  width: 100%;
  height: 100%;
  padding: 24px;
  overflow: auto;
  display: flex;
  justify-content: center;
}

.about-container {
  width: 100%;
  max-width: 600px;
}

.about-card {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: 32px;
  text-align: center;
}

.logo-large {
  margin-bottom: 16px;
}

.logo-svg {
  width: 60px;
  height: 60px;
}

.app-name {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(90deg, $accent-blue, $accent-cyan);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.app-desc {
  font-size: 14px;
  color: $text-muted;
  margin-bottom: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: $bg-secondary;
  border-radius: $radius-sm;
}

.info-label {
  font-size: 12px;
  color: $text-muted;
  margin-bottom: 4px;
}

.info-value {
  font-size: 14px;
  color: $text-primary;

  &.connected {
    color: $success-color;
  }
}

.feature-list, .help-section {
  text-align: left;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid $border-color;

  h3 {
    font-size: 16px;
    color: $accent-blue;
    margin-bottom: 12px;
  }

  ul, ol {
    padding-left: 20px;
    color: $text-secondary;
    font-size: 14px;
    line-height: 1.8;
  }
}
</style>
