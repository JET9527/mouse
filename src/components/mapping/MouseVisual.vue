<template>
  <div class="mouse-visual">
    <div class="mouse-svg-wrap">
      <svg class="game-mouse" viewBox="0 0 200 300" width="200" height="300">
        <defs>
          <linearGradient id="mouseLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#00E5FF"/>
            <stop offset="100%" stop-color="#39FF77"/>
          </linearGradient>
          <linearGradient id="mouseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#192233"/>
            <stop offset="100%" stop-color="#0F1522"/>
          </linearGradient>
        </defs>
        <!--鼠标主体外壳-->
        <path d="M50,30 C20,80 10,180 40,250 C70,280 130,280 160,250 C190,180 180,80 150,30 C130,10 70,10 50,30Z" fill="url(#mouseFill)" stroke="url(#mouseLine)" stroke-width="2.5"/>
        <!--左键槽-->
        <path d="M52,33 C55,65 80,72 98,72 L98,35 C82,28 60,30 52,33Z" fill="#111722" stroke="#00E5FF" stroke-width="1.5"/>
        <!--右键槽-->
        <path d="M148,33 C145,65 120,72 102,72 L102,35 C118,28 140,30 148,33Z" fill="#111722" stroke="#00E5FF" stroke-width="1.5"/>
        <!--滚轮仓-->
        <ellipse cx="100" cy="82" rx="18" ry="12" fill="#0c1018" stroke="url(#mouseLine)" stroke-width="2"/>
        <!--左侧两个侧键凹槽-->
        <rect x="32" y="122" width="12" height="32" rx="3" fill="#121824" stroke="#00E5FF" stroke-width="1"/>
        <rect x="32" y="164" width="12" height="32" rx="3" fill="#121824" stroke="#00E5FF" stroke-width="1"/>
        <!--右侧侧键凹槽-->
        <rect x="156" y="122" width="12" height="32" rx="3" fill="#121824" stroke="#00E5FF" stroke-width="1"/>
        <!--尾部电竞纹理线条-->
        <path d="M65,220 L135,220" stroke="#00E5FF66" stroke-width="1"/>
        <path d="M70,235 L130,235" stroke="#00E5FF66" stroke-width="1"/>
      </svg>

      <!--6个点位覆盖在SVG对应按键位置-->
      <div
        v-for="btn in MOUSE_BUTTONS"
        :key="btn.id"
        class="dot"
        :class="[`dot${btn.id}`, { active: selectedId === btn.id }]"
        @click="$emit('select', btn.id)"
      >
        {{ btn.id }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MOUSE_BUTTONS } from '@/utils/constants'

defineProps<{
  selectedId?: number
}>()

defineEmits<{
  select: [buttonId: number]
}>()
</script>

<style lang="scss" scoped>
.mouse-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.mouse-svg-wrap {
  position: relative;
  width: 200px;
  height: 300px;
}

.game-mouse {
  animation: mouseGlow 3s ease-in-out infinite;
}

@keyframes mouseGlow {
  0%, 100% { filter: drop-shadow(0 0 8px #00E5FF); }
  50% { filter: drop-shadow(0 0 18px #00E5FF); }
}

.dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #00E5FF;
  color: #000;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  cursor: pointer;
  transition: 0.3s;
  z-index: 9;

  &.active {
    transform: scale(1.15);
    box-shadow: 0 0 10px #00E5FF, 0 0 20px #00E5FF77;
  }
}

.dot1 { top: 32px; left: 18px; }
.dot2 { top: 32px; right: 18px; }
.dot3 { top: 86px; left: 50%; transform: translateX(-50%); }
.dot4 { top: 126px; left: 4px; }
.dot5 { top: 168px; left: 4px; }
.dot6 { top: 126px; right: 4px; }
</style>
