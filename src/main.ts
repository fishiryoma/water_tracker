import './assets/main.css'
import { database } from './firebase'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useTheme } from './hooks/useTheme'
import VCalendar from 'v-calendar'
import 'v-calendar/style.css'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

useTheme()
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(VCalendar, {})

dayjs.extend(utc)
dayjs.extend(timezone)

// 全局錯誤處理
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue 全局錯誤:', err, info)
  // 注意：這裡不能直接使用 useGlobalErrorStore，因為可能在組件外部
  // 錯誤會在控制台顯示，開發時可以看到
}

// 未捕獲的 Promise 錯誤
window.addEventListener('unhandledrejection', (event) => {
  console.error('未處理的 Promise 錯誤:', event.reason)
  // 防止錯誤在控制台顯示紅色警告
  event.preventDefault()
})

// JavaScript 運行時錯誤
window.addEventListener('error', (event) => {
  console.error('JavaScript 錯誤:', event.error)
})

app.mount('#app')
