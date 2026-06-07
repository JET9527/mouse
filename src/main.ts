import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// i18n
import i18n from './i18n'

// Styles
import './assets/styles/global.scss'
import './assets/styles/dark-theme.scss'

const app = createApp(App)

// Register Element Plus
app.use(ElementPlus)

// Register all icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// Register i18n, router and pinia
app.use(i18n)
app.use(router)
app.use(pinia)

app.mount('#app')
