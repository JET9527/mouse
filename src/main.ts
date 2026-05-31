import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

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

// Register router and pinia
app.use(router)
app.use(pinia)

app.mount('#app')
