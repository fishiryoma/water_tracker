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
import liff from '@line/liff'

liff
  .init({ liffId: '2007574485-nVKgAdK9' })
  .then(() => {
    console.log('LIFF 初始化成功')
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
  })
  .catch((err) => {
    // 在這裡處理 LIFF 初始化失敗的特定錯誤
    console.error('LIFF 初始化失敗：', err.message)
    document.getElementById('app').innerHTML = `
    <div style="text-align: center; margin-top: 50px;">
      <h1>應用程式啟動失敗</h1>
      <p>LIFF 初始化錯誤，請檢查您的網路或 LIFF ID。</p>
      <p>錯誤訊息: ${err.message}</p>
    </div>
  `
  })
