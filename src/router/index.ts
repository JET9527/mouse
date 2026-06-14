import { createRouter, createWebHistory } from 'vue-router'
import KeyMappingView from '@/views/KeyMappingView.vue'
import MacroView from '@/views/MacroView.vue'
import SettingsView from '@/views/SettingsView.vue'
import LightingView from '@/views/LightingView.vue'
import AboutView from '@/views/AboutView.vue'

const routes = [
  { path: '/', redirect: '/mapping' },
  { path: '/mapping', component: KeyMappingView },
  { path: '/macro', component: MacroView },
  { path: '/settings', component: SettingsView },
  { path: '/lighting', component: LightingView },
  { path: '/about', component: AboutView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
