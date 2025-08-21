import { createI18n } from 'vue-i18n'
import zhTW from './locales/zh-TW.json'
import ja from './locales/ja.json'
import en from './locales/en.json'

// Function to get persisted language or browser language
const getInitialLocale = (): string => {
  const savedLocale = localStorage.getItem('user-locale')
  if (savedLocale) {
    return savedLocale
  }
  // Check browser language
  const browserLanguage = navigator.language.toLowerCase()
  if (browserLanguage.startsWith('ja')) {
    return 'ja'
  }
  if (browserLanguage.startsWith('en')) {
    return 'en'
  }
  // Default to zh-TW
  return 'zh-TW'
}

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: getInitialLocale(), // Set initial locale
  fallbackLocale: 'zh-TW', // Fallback language
  messages: {
    'zh-TW': zhTW,
    ja: ja,
    en: en,
  },
  // Suppress warnings about missing translations during development
  silentTranslationWarn: true,
  missingWarn: false,
  fallbackWarn: false,
})

export default i18n
