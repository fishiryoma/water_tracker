import './assets/main.css'
import { createApp, type App as VueApp } from 'vue'
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
import { auth } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useUserIdStore } from './stores/userId'
import { updateUserData } from './hooks/useUpdateUser'

liff
  .init({ liffId: '2007574485-nVKgAdK9' })
  .then(() => {
    console.log('LIFF 初始化成功')
    useTheme()

    const app = createApp(App)
    app.use(createPinia())

    dayjs.extend(utc)
    dayjs.extend(timezone)

    // 全局錯誤處理
    app.config.errorHandler = (err, instance, info) => {
      console.error('Vue 全局錯誤:', err, info)
    }
    window.addEventListener('unhandledrejection', (event) => {
      console.error('未處理的 Promise 錯誤:', event.reason)
      event.preventDefault()
    })
    window.addEventListener('error', (event) => {
      console.error('JavaScript 錯誤:', event.error)
    })

    // 等待 Firebase 驗證狀態確定後再掛載 App
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // 這個回呼會在初次狀態確定時，以及後續狀態變更時觸發
      // 透過檢查 app._container 來確保掛載邏輯只執行一次
      if (!app._container) {
        const store = useUserIdStore()
        if (user) {
          updateUserData(user)
        } else {
          store.setUserId('')
        }

        // 狀態確定後，再安裝路由
        app.use(router)
        app.use(i18n)
        app.use(VCalendar, {})

        app.mount('#app')
      }
    })
  })
  .catch((err) => {
    // 在這裡處理 LIFF 初始化失敗的特定錯誤
    console.error('LIFF 初始化失敗：', err.message)

    // 簡易的 i18n 處理，因為 Vue i18n 實例還未建立
    const translations = {
      en: {
        title: 'Application Failed to Start',
        details: 'LIFF initialization error. Please check your network or LIFF ID.',
        message: 'Error Message',
        suggestion: 'Please refresh or contact an administrator',
      },
      ja: {
        title: 'アプリの起動に失敗しました',
        details: 'LIFFの初期化エラー。ネットワークまたはLIFF IDを確認してください。',
        message: 'エラーメッセージ',
        suggestion: 'リフレッシュするか、管理者に連絡してください',
      },
      'zh-TW': {
        title: '應用程式啟動失敗',
        details: 'LIFF 初始化錯誤，請檢查您的網路或 LIFF ID。',
        message: '錯誤訊息',
        suggestion: '請重新整理或聯絡管理者',
      },
    }

    const lang = navigator.language.startsWith('ja')
      ? 'ja'
      : navigator.language.startsWith('en')
      ? 'en'
      : 'zh-TW'

    const t = translations[lang]

    const appElement = document.getElementById('app')
    if (appElement) {
      appElement.innerHTML = `
    <div style="text-align: center; margin-top: 50px; padding: 20px; font-family: sans-serif;">
      <h1>${t.title}</h1>
      <p>${t.details}</p>
      <p><strong>${t.message}:</strong> ${err.message}</p>
      <p style="color: red; margin-top: 20px;">${t.suggestion}</p>
    </div>
  `
    }
  })
