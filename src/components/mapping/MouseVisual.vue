<template>
  <div class="mouse-visual">
    <svg viewBox="0 0 200 340" class="mouse-svg" xmlns="http://www.w3.org/2000/svg">
      <!-- Mouse body outline -->
      <defs>
        <linearGradient id="mouseBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2a2a4a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Main body -->
      <path d="M100 20 C60 20, 30 60, 30 120 L30 220 C30 280, 50 310, 100 320 C150 310, 170 280, 170 220 L170 120 C170 60, 140 20, 100 20Z"
            fill="url(#mouseBody)" stroke="#3a3a5a" stroke-width="1.5"/>

      <!-- Left button area -->
      <path d="M100 25 C65 25, 38 60, 35 120 L35 155 L95 155 L95 25Z"
            fill="rgba(0,212,255,0.05)" stroke="#3a3a5a" stroke-width="1"/>

      <!-- Right button area -->
      <path d="M100 25 C135 25, 162 60, 165 120 L165 155 L105 155 L105 25Z"
            fill="rgba(0,212,255,0.05)" stroke="#3a3a5a" stroke-width="1"/>

      <!-- Scroll wheel -->
      <rect x="92" y="70" width="16" height="30" rx="8" fill="#1a1a2e" stroke="#3a3a5a" stroke-width="1"/>
      <rect x="95" y="75" width="10" height="20" rx="5" fill="#2a2a4a" stroke="#4a4a6a" stroke-width="0.5"/>

      <!-- Side buttons (left side) -->
      <rect x="22" y="100" width="12" height="24" rx="4" fill="#1a1a2e" stroke="#3a3a5a" stroke-width="1"/>
      <rect x="22" y="130" width="12" height="24" rx="4" fill="#1a1a2e" stroke="#3a3a5a" stroke-width="1"/>

      <!-- DPI button area -->
      <circle cx="100" cy="55" r="6" fill="#1a1a2e" stroke="#3a3a5a" stroke-width="1"/>

      <!-- RGB light strip (bottom) -->
      <path d="M50 300 C60 310, 80 315, 100 315 C120 315, 140 310, 150 300"
            fill="none" stroke="#00d4ff" stroke-width="2" filter="url(#glow)" opacity="0.8"/>

      <!-- Brand text -->
      <text x="100" y="200" text-anchor="middle" fill="#3a3a5a" font-size="12" font-family="Arial">MOUSE</text>
    </svg>

    <!-- Button number indicators -->
    <div class="button-markers">
      <div class="marker" :style="getMarkerStyle(btn.id)" v-for="btn in MOUSE_BUTTONS" :key="btn.id">
        <span class="marker-number">{{ btn.id }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MOUSE_BUTTONS } from '@/utils/constants'

function getMarkerStyle(buttonId: number) {
  const positions: Record<number, { top: string; left: string }> = {
    1: { top: '35%', left: '35%' },
    2: { top: '35%', left: '62%' },
    3: { top: '50%', left: '48%' },
    4: { top: '42%', left: '8%' },
    5: { top: '42%', right: '8%' },
    6: { top: '28%', left: '48%' },
    7: { top: '62%', left: '48%' },
    8: { top: '55%', right: '5%' },
    9: { top: '72%', left: '48%' },
  }
  return positions[buttonId] || { top: '50%', left: '50%' }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.mouse-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.mouse-svg {
  width: 160px;
  height: 280px;
}

.button-markers {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.marker {
  position: absolute;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);

  .marker-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    background: linear-gradient(135deg, $accent-blue, rgba(0, 212, 255, 0.6));
    border-radius: 50%;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    box-shadow: $glow-blue;
  }
}
</style>
